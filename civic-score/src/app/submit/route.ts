import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getSessionUser } from "@/lib/auth";
import { z } from "zod";
import { getDefinedQuestionsForDate } from "@/lib/challenge";

const BodySchema = z.object({
  selected: z.array(z.string()).default([]),
  answers: z.record(z.string(), z.any()).optional().default({}),
  // Challenge Code ist Pflicht: Nur Einträge innerhalb einer Challenge erlaubt
  challengeCode: z.string().min(1),
  // Optionales Ziel-Datum (yyyy-MM-dd) für Dev-Mode/Backfill innerhalb des Challenge-Zeitraums
  day: z.string().optional(),
  firstAnswerAt: z.string().datetime().optional(),
  lastAnswerAt: z.string().datetime().optional(),
  submittedAt: z.string().datetime().optional(),
  durationMs: z.number().int().nonnegative().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Hole Aktionen & Score
    const uniqueIds = Array.from(new Set(parsed.data.selected));
    const actions = uniqueIds.length
      ? await prisma.action.findMany({ where: { id: { in: uniqueIds } }})
      : [];
    // Basis: Score aus explizit ausgewählten Aktionen
    const totalFromActions = actions.reduce((sum: number, a: { weight: number }) => sum + a.weight, 0);

    // Score aus Challenge-abhängigen Antworten wird nach dem Laden der Challenge berechnet

    // Challenge-Kontext per Code ermitteln und Mitgliedschaft erzwingen
    const challenge = await (prisma as any).challenge.findUnique({ where: { code: parsed.data.challengeCode.trim() } });
    if (!challenge) {
      return NextResponse.json({ ok: false, error: "Unbekannte Challenge" }, { status: 400 });
    }
    const membership = await (prisma as any).challengeMembership.findUnique({
      where: { userId_challengeId: { userId: session.id, challengeId: challenge.id } },
    });
    if (!membership) {
      return NextResponse.json({ ok: false, error: "Nicht Mitglied der Challenge" }, { status: 403 });
    }
    const challengeId: string | undefined = challenge.id;

    // Ziel-Datum bestimmen:
    // Standard ist "heute". Falls im Body ein "day" (yyyy-MM-dd) angegeben ist UND innerhalb der Challenge liegt,
    // wird dieses verwendet (unterstützt Dev-Mode/Zurück-/Vortragen).
    const now = new Date();
    let day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    try {
      const bodyDay = (parsed.data.day || "").trim();
      if (bodyDay) {
        const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(bodyDay);
        if (m) {
          const y = parseInt(m[1], 10);
          const mo = parseInt(m[2], 10) - 1;
          const d = parseInt(m[3], 10);
          const candidate = new Date(y, mo, d);
          if (!isNaN(candidate.getTime())) {
            const startDay = new Date(new Date(challenge.startDate).getFullYear(), new Date(challenge.startDate).getMonth(), new Date(challenge.startDate).getDate());
            const endDay = new Date(new Date(challenge.endDate).getFullYear(), new Date(challenge.endDate).getMonth(), new Date(challenge.endDate).getDate());
            if (candidate >= startDay && candidate <= endDay) {
              day = candidate;
            }
          }
        }
      }
    } catch {
      // ignore malformed day
    }

    // Zusätzlicher Score: aus beantworteten, gewichteten Questions der Challenge-Config
    const cfg: any = (challenge as any)?.config || {};
    const weightByQuestionId: Record<string, number> = {};
    const candidates: any[] = [
      Array.isArray(cfg?.daily?.questions) ? cfg.daily.questions : [],
      // Use defined questions for today's date, supporting multi-set shape
      getDefinedQuestionsForDate(cfg, day),
      Array.isArray(cfg?.quiz?.pre?.questions) ? cfg.quiz.pre.questions : [],
      Array.isArray(cfg?.quiz?.post?.questions) ? cfg.quiz.post.questions : [],
    ].flat();
    for (const q of candidates) {
      const id = (q as any)?.id;
      const w = (q as any)?.weight;
      if (id && typeof w === "number" && Number.isFinite(w)) {
        weightByQuestionId[id] = w;
      }
    }
    let totalFromAnswers = 0;
    const answersObj = parsed.data.answers || {};
    for (const [qid, value] of Object.entries(answersObj)) {
      const w = weightByQuestionId[qid];
      if (typeof w !== "number" || !Number.isFinite(w) || w === 0) continue;
      if (typeof value === "boolean") {
        if (value) totalFromAnswers += w;
      } else if (typeof value === "number" && Number.isFinite(value)) {
        // Optional: numerische Antworten gewichten (z. B. Sternezahl * Gewicht)
        totalFromAnswers += Math.round(value * w);
      } else {
        // Andere Antworttypen (Text/Select) werden nicht auf den Score angerechnet
      }
    }

    const total = totalFromActions + totalFromAnswers;

    // Upsert Tages-Eintrag
    // Kein Upsert im HTTP-Modus: erst suchen, dann update/create
    let entry = await (prisma as any).dayEntry.findUnique({
      where: { userId_date_challengeId: { userId: session.id, date: day, challengeId } },
    });
    if (entry) {
      entry = await (prisma as any).dayEntry.update({
        where: { id: entry.id },
        data: { totalScore: total },
      });
    } else {
      entry = await (prisma as any).dayEntry.create({
        data: { userId: session.id, date: day, totalScore: total, challengeId, markers: [] },
      });
    }

    // Persist answers & timing via raw SQL to avoid Prisma Client schema mismatch during rollout
    try {
      const hasAnswers = parsed.data.answers && Object.keys(parsed.data.answers).length > 0;
      const firstAt = parsed.data.firstAnswerAt ? new Date(parsed.data.firstAnswerAt) : null;
      const lastAt = parsed.data.lastAnswerAt ? new Date(parsed.data.lastAnswerAt) : null;
      const submittedAt = parsed.data.submittedAt ? new Date(parsed.data.submittedAt) : new Date();
      const durationMs = typeof parsed.data.durationMs === "number" && parsed.data.durationMs >= 0
        ? parsed.data.durationMs
        : (firstAt && lastAt ? Math.max(0, lastAt.getTime() - firstAt.getTime()) : null);

      const answersSql = hasAnswers
        ? Prisma.sql`${JSON.stringify(parsed.data.answers ?? {})}::jsonb`
        : Prisma.sql`NULL`;
      const firstSql = firstAt ? Prisma.sql`${firstAt.toISOString()}` : Prisma.sql`NULL`;
      const lastSql = lastAt ? Prisma.sql`${lastAt.toISOString()}` : Prisma.sql`NULL`;
      const subSql = submittedAt ? Prisma.sql`${submittedAt.toISOString()}` : Prisma.sql`NULL`;
      const durSql = durationMs !== null ? Prisma.sql`${durationMs}` : Prisma.sql`NULL`;

      await prisma.$executeRaw(Prisma.sql`
        UPDATE "DayEntry"
        SET
          "answers" = ${answersSql},
          "firstAnswerAt" = ${firstSql}::timestamptz,
          "lastAnswerAt" = ${lastSql}::timestamptz,
          "submittedAt" = ${subSql}::timestamptz,
          "durationMs" = ${durSql}
        WHERE "id" = ${entry.id}
      `);
    } catch {}

    // Mark pre-quiz as completed if pre-answers were submitted (store in markers array)
    try {
      const preId: string | undefined = cfg?.quiz?.preId;
      const hasPreAnswers = !!preId && Object.keys(parsed.data.answers || {}).some((k) => k.startsWith("pre_"));
      if (preId && hasPreAnswers) {
        const marker = `quiz:${preId}`;
        const currentMarkers: string[] = Array.isArray((entry as any)?.markers) ? ((entry as any).markers as string[]) : [];
        if (!currentMarkers.includes(marker)) {
          const nextMarkers = Array.from(new Set([...(currentMarkers || []), marker]));
          entry = await (prisma as any).dayEntry.update({
            where: { id: entry.id },
            data: { markers: nextMarkers },
          });
        }
      }
    } catch {}

    // Mark post-quiz as completed if post-answers were submitted (store in markers array)
    try {
      const postId: string | undefined = cfg?.quiz?.postId;
      const hasPostAnswers = !!postId && Object.keys(parsed.data.answers || {}).some((k) => k.startsWith("post_"));
      if (postId && hasPostAnswers) {
        const marker = `quiz:${postId}`;
        const currentMarkers: string[] = Array.isArray((entry as any)?.markers) ? ((entry as any).markers as string[]) : [];
        if (!currentMarkers.includes(marker)) {
          const nextMarkers = Array.from(new Set([...(currentMarkers || []), marker]));
          entry = await (prisma as any).dayEntry.update({
            where: { id: entry.id },
            data: { markers: nextMarkers },
          });
        }
      }
    } catch {}

    // Link Actions (ersetzen)
    await prisma.entryAction.deleteMany({ where: { dayEntryId: entry.id }});
    if (actions.length) {
      for (const a of actions) {
        await prisma.entryAction.create({
          data: { dayEntryId: entry.id, actionId: (a as { id: string }).id },
        });
      }
    }

    return NextResponse.json({ ok: true, total });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
