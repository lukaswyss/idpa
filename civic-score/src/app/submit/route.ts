import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateParticipant } from "@/lib/participant";
import { z } from "zod";

const BodySchema = z.object({
  selected: z.array(z.string()).default([]),
  note: z.string().optional().default(""),
  // Challenge Code ist Pflicht: Nur Einträge innerhalb einer Challenge erlaubt
  challengeCode: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const participant = await getOrCreateParticipant();

    // Heute (nur Datumsteil)
    const now = new Date();
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Hole Aktionen & Score
    const uniqueIds = Array.from(new Set(parsed.data.selected));
    const actions = uniqueIds.length
      ? await prisma.action.findMany({ where: { id: { in: uniqueIds } }})
      : [];
    const total = actions.reduce((sum: number, a: { weight: number }) => sum + a.weight, 0);

    // Challenge-Kontext per Code ermitteln und Mitgliedschaft erzwingen
    const challenge = await (prisma as any).challenge.findUnique({ where: { code: parsed.data.challengeCode.trim() } });
    if (!challenge) {
      return NextResponse.json({ ok: false, error: "Unbekannte Challenge" }, { status: 400 });
    }
    const membership = await (prisma as any).challengeMembership.findUnique({
      where: { participantId_challengeId: { participantId: participant.id, challengeId: challenge.id } },
    });
    if (!membership) {
      return NextResponse.json({ ok: false, error: "Nicht Mitglied der Challenge" }, { status: 403 });
    }
    const challengeId: string | undefined = challenge.id;

    // Upsert Tages-Eintrag
    // Kein Upsert im HTTP-Modus: erst suchen, dann update/create
    let entry = await (prisma as any).dayEntry.findUnique({
      where: { participantId_date_challengeId: { participantId: participant.id, date: day, challengeId } },
    });
    if (entry) {
      entry = await (prisma as any).dayEntry.update({
        where: { id: entry.id },
        data: { note: parsed.data.note, totalScore: total },
      });
    } else {
      entry = await (prisma as any).dayEntry.create({
        data: { participantId: participant.id, date: day, note: parsed.data.note, totalScore: total, challengeId },
      });
    }

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
