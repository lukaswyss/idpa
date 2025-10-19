import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { DailyForm } from "@/app/daily-form";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import LoginRequired from "@/components/login-required";
import { Prisma } from "@prisma/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isLastDay, isDefinedDay as isDefinedDayHelper, hasWeeklyConfig, isWeeklyDue, getSelectedChallengeCode, setSelectedChallengeCode } from "@/lib/challenge";
import { SwordsIcon } from "lucide-react";
import LoginSuccessToast from "@/app/today/login-success.client";
import { ChallengeSwitcher } from "@/components/challenge-switcher";
import { isCurrentUserAdmin } from "@/lib/user";
import { DevModeControls } from "@/components/dev-mode-controls";

export default async function TodayPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const session = await getSessionUser();
  if (!session) {
    return <LoginRequired message="Bitte anmelden, um deine Fragen zu beantworten." />;
  }
  const actions = await prisma.action.findMany({ orderBy: [{ category: "asc" }, { label: "asc" }] });
  const isAdmin = await isCurrentUserAdmin();
  const getParam = (key: string): string | undefined => {
    const v = searchParams?.[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const devEnabled = isAdmin && ((getParam("dev") === "1") || (getParam("dev") === "true"));
  const dayParam = getParam("day"); // yyyy-MM-dd
  const parsedDay = (() => {
    if (!devEnabled || !dayParam) return undefined;
    const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(dayParam);
    if (!m) return undefined;
    const y = parseInt(m[1], 10), mo = parseInt(m[2], 10) - 1, d = parseInt(m[3], 10);
    const dt = new Date(y, mo, d);
    if (isNaN(dt.getTime())) return undefined;
    return dt;
  })();
  const selectedDate = parsedDay ?? new Date();
  const day = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

  // Load latest joined challenge for activity context
  const selected = await getSelectedChallengeCode();
  // Build challenge switcher items for this page
  const memberships = await (prisma as any).challengeMembership.findMany({ where: { userId: session.id }, include: { challenge: true } });
  const items = await Promise.all((memberships as any[]).map(async (m) => {
    const ch = (m as any).challenge as any;
    let openToday = false;
    try {
      const startDay = new Date(ch.startDate);
      const endDay = new Date(ch.endDate);
      const within = day >= new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate()) && day <= new Date(endDay.getFullYear(), endDay.getMonth(), endDay.getDate());
      if (within) {
        const nextDay = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
        const entry = await (prisma as any).dayEntry.findFirst({ where: ({ userId: session.id, challengeId: ch.id, date: { gte: day, lt: nextDay } } as any), select: { id: true } });
        openToday = !entry;
      }
    } catch { }
    return { id: ch.id as string, code: ch.code as string, title: ch.title as string, openToday, selected: ch.code === selected };
  }));
  let membership = await (prisma as any).challengeMembership.findFirst({
    where: selected ? ({ userId: session.id, challenge: { code: selected } } as any) : ({ userId: session.id } as any),
    orderBy: { joinedAt: "desc" },
    include: { challenge: true },
  });
  if (!membership && selected) {
    // Fallback to most recent if selected not found
    membership = await (prisma as any).challengeMembership.findFirst({ where: { userId: session.id }, orderBy: { joinedAt: "desc" }, include: { challenge: true } });
  }

  // Ensure a default selected challenge is persisted for consistent UI selection
  try {
    if (!selected && membership?.challenge?.code) {
      await setSelectedChallengeCode(String((membership as any).challenge.code));
    }
  } catch { }

  const challenge = membership?.challenge as any | undefined;
  const abGroupMembership: "A" | "B" | undefined = (membership as any)?.abGroup ?? undefined;
  const abEnabled = Boolean((membership as any)?.challenge?.abEnabled);
  const abParam = getParam("ab");
  const abGroupOverride: "A" | "B" | undefined = devEnabled && (abParam === "A" || abParam === "B") ? (abParam as "A" | "B") : undefined;
  const abGroup: "A" | "B" | undefined = abGroupOverride ?? abGroupMembership;
  let days: { date: Date; score: number; hasEntry: boolean }[] = [];
  let initialSelected: string[] = [];
  // removed: note field (non-anonymous context)
  let definedQuestionsOut: { id: string; label: string; type: "text" | "boolean" | "number" | "select" | "stars"; items?: { id: string; label: string }[]; stars?: number }[] | undefined = undefined;
  let todayAnswers: Record<string, unknown> | undefined = undefined;
  let preDone = false;
  let postDone = false;
  let isDefinedDay = false;
  let showWeekly = false;
  let lastDay = false;
  let hasToday = false;
  let beforeStart = false;
  let afterEnd = false;
  let stats: { daysWithEntry: number; totalDays: number; totalScore: number; avgScoreActive: number; completionRate: number; longestStreak: number; totalActions: number } | null = null;
  let preQuestionsOut: { id: string; label: string; type: "text" | "boolean" | "number" | "select" | "stars"; items?: { id: string; label: string }[]; stars?: number }[] | undefined = undefined;
  let postQuestionsOut: { id: string; label: string; type: "text" | "boolean" | "number" | "select" | "stars"; items?: { id: string; label: string }[]; stars?: number }[] | undefined = undefined;
  const normalizeQuestions = (arr: any[]): { id: string; label: string; type: "text" | "boolean" | "number" | "select" | "stars"; items?: { id: string; label: string }[]; stars?: number }[] => {
    return (arr || [])
      .map((q: any, idx: number) => {
        if (q && typeof q === "object" && "id" in q && "label" in q && "type" in q) {
          const t = (q as any).type;
          if (t === "text" || t === "boolean" || t === "number" || t === "select" || t === "stars") {
            return q as { id: string; label: string; type: "text" | "boolean" | "number" | "select" | "stars"; items?: { id: string; label: string }[]; stars?: number };
          }
        }
        if (q && typeof q === "object" && "text" in q) {
          return { id: `q${idx}`, label: String((q as any).text), type: "boolean" as const };
        }
        if (typeof q === "string") {
          return { id: `q${idx}`, label: q, type: "boolean" as const };
        }
        return null;
      })
      .filter(Boolean) as { id: string; label: string; type: "text" | "boolean" | "number" | "select" | "stars"; items?: { id: string; label: string }[]; stars?: number }[];
  };
  if (challenge) {
    // Build range of days between start and end
    const d0 = new Date(challenge.startDate);
    const d1 = new Date(challenge.endDate);
    const grid: Date[] = [];
    for (let d = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate()); d <= d1; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
      grid.push(new Date(d));
    }
    const entries = await (prisma as any).dayEntry.findMany({
      where: ({ userId: session.id, challengeId: challenge.id, date: { gte: d0, lte: d1 } } as any),
    });
    // Load today's entry with actions for initial form state
    const nextDay = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
    const todayEntry = await (prisma as any).dayEntry.findFirst({
      where: ({ userId: session.id, challengeId: challenge.id, date: { gte: day, lt: nextDay } } as any),
      include: ({ actions: true } as any),
    });
    if (todayEntry) {
      const te: any = todayEntry as any;
      initialSelected = (te.actions || []).map((a: any) => a.actionId);
      todayAnswers = te.answers ?? undefined;
      // Fallback: Prisma Client might not yet include the `answers` field during rollout
      if (todayAnswers === undefined && te.id) {
        try {
          const rows = await prisma.$queryRaw<{ answers: unknown }[]>(
            Prisma.sql`SELECT "answers" FROM "DayEntry" WHERE "id" = ${te.id} LIMIT 1`
          );
          if (rows && rows.length > 0) {
            todayAnswers = (rows[0] as any)?.answers ?? undefined;
          }
        } catch { }
      }
    }
    // Consider the day done if a DayEntry exists at all (score may be 0)
    hasToday = Boolean(todayEntry);
    days = grid.map((d) => {
      const entry = (entries as any[]).find((e: { date: Date; totalScore: number }) => new Date(e.date).toDateString() === d.toDateString());
      return { date: d, score: entry?.totalScore ?? 0, hasEntry: Boolean(entry) };
    });

    // Robust: if today's entry exists in the fetched list, ensure hasToday is true
    if (!hasToday) {
      try {
        const hasEntryToday = (entries as any[]).some((e: { date: Date }) => new Date(e.date).toDateString() === day.toDateString());
        if (hasEntryToday) hasToday = true;
      } catch { }
    }


    // Determine today's questions with quiz gating: show pre-quiz first until completed
    const cfg: any = challenge.config || {};
    isDefinedDay = isDefinedDayHelper(cfg, day);
    // Quiz state detection
    const preId: string | undefined = cfg?.quiz?.preId;
    const postId: string | undefined = cfg?.quiz?.postId;
    try {
      if (preId) {
        preDone = Boolean(
          await (prisma as any).dayEntry.findFirst({
            where: ({ userId: session.id, challengeId: challenge.id, markers: { has: `quiz:${preId}` } } as any),
          })
        );
      }
      if (postId) {
        postDone = Boolean(
          await (prisma as any).dayEntry.findFirst({
            where: ({ userId: session.id, challengeId: challenge.id, markers: { has: `quiz:${postId}` } } as any),
          })
        );
      }
    } catch { }

    // Fallback: if no marker yet, infer completion from today's saved answers containing pre_* keys
    if (!preDone && todayAnswers && typeof todayAnswers === "object") {
      try {
        const keys = Object.keys(todayAnswers);
        if (keys.some((k) => k.startsWith("pre_"))) preDone = true;
      } catch { }
    }

    // Weekly and end-of-challenge signals
    showWeekly = hasWeeklyConfig(cfg) && isWeeklyDue(cfg, day);
    lastDay = isLastDay(challenge, day);

    // Build pre-quiz questions for rendering
    const preQuestionsRaw: any[] = Array.isArray(cfg?.quiz?.pre?.questions)
      ? cfg.quiz.pre.questions
      : Array.isArray(cfg?.quizBefore?.questions)
        ? cfg.quizBefore.questions
        : Array.isArray(cfg?.preQuiz?.questions)
          ? cfg.preQuiz.questions
          : Array.isArray(cfg?.pre?.questions)
            ? cfg.pre.questions
            : Array.isArray(cfg?.quiz?.pre)
              ? cfg.quiz.pre
              : [];
    preQuestionsOut = normalizeQuestions(preQuestionsRaw);

    // Build post-quiz questions for rendering
    const postQuestionsRaw: any[] = Array.isArray(cfg?.quiz?.post?.questions)
      ? cfg.quiz.post.questions
      : Array.isArray(cfg?.quizAfter?.questions)
        ? cfg.quizAfter.questions
        : Array.isArray(cfg?.postQuiz?.questions)
          ? cfg.postQuiz.questions
          : Array.isArray(cfg?.post?.questions)
            ? cfg.post.questions
            : Array.isArray(cfg?.quiz?.post)
              ? cfg.quiz.post
              : [];
    postQuestionsOut = normalizeQuestions(postQuestionsRaw);

    // Only populate defined questions for defined days
    if (isDefinedDay && Array.isArray(cfg?.defined?.questions)) {
      definedQuestionsOut = normalizeQuestions(cfg.defined.questions);
    } else {
      definedQuestionsOut = undefined;
    }

    // Window flags & stats
    const startDay = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate());
    const endDay = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
    beforeStart = day < startDay;
    afterEnd = day > endDay;

    if (afterEnd) {
      const entriesArr = entries as any[];
      const totalDays = grid.length;
      const daysWithEntry = entriesArr.length;
      const totalScore = entriesArr.reduce((sum: number, e: any) => sum + (e.totalScore ?? 0), 0);
      const avgScoreActive = daysWithEntry > 0 ? Math.round((totalScore / daysWithEntry) * 10) / 10 : 0;
      const completionRate = totalDays > 0 ? Math.round((daysWithEntry / totalDays) * 100) : 0;
      // Longest streak across challenge period
      const hasEntrySet = new Set(entriesArr.map((e: any) => new Date(e.date).toDateString()));
      let longest = 0;
      let current = 0;
      for (const d of grid) {
        if (hasEntrySet.has(d.toDateString())) {
          current += 1;
          if (current > longest) longest = current;
        } else {
          current = 0;
        }
      }
      let totalActions = 0;
      const entryIds = entriesArr.map((e: any) => e.id);
      if (entryIds.length > 0) {
        try {
          totalActions = await prisma.entryAction.count({ where: { dayEntryId: { in: entryIds } } as any });
        } catch { }
      }
      stats = { daysWithEntry, totalDays, totalScore, avgScoreActive, completionRate, longestStreak: longest, totalActions };
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <LoginSuccessToast />
      {isAdmin ? (
        <DevModeControls isAdmin={isAdmin} abGroup={abGroup ?? null} />
      ) : null}
      {session && items.length > 0 ? (
        <div className="flex justify-end">
          <ChallengeSwitcher items={items} />
        </div>
      ) : null}
      <h1 className="text-2xl font-semibold">Civic Score – Heute ({format(day, "dd.MM.yyyy")})</h1>

      {challenge && (
        <section className="space-y-2">

          <div className="flex flex-row gap-1 w-full justify-items-center justify-between px-2">
            {days.map((d) => {
              const isToday = day.toDateString() === d.date.toDateString();
              const isPast = d.date < day;
              const intensity = (isToday && (d.hasEntry || hasToday))
                ? "bg-green-500"
                : d.hasEntry
                  ? "bg-green-500"
                  : isPast
                    ? "bg-orange-400"
                    : "bg-neutral-200"; // future or today without entry
              return (
                <Tooltip key={d.date.toISOString()}>
                  <TooltipTrigger asChild>
                    <div className={`h-4 w-4 rounded ${intensity} ${isToday ? "ring-2 ring-blue-500" : ""}`} />
                  </TooltipTrigger>
                  <TooltipContent>
                    {format(d.date, "dd.MM.")}
                    {!(abEnabled && abGroup === "B") && `: ${d.score}`}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </section>
      )}

      {challenge && (
        <div className="space-y-2">
          {!beforeStart && !afterEnd && abEnabled && abGroup === "A" && (
            <div className="text-sm">
              Heutiger Score: {(() => {
                const todayStr = day.toDateString();
                const todayItem = days.find((d) => d.date.toDateString() === todayStr);
                const val = todayItem?.score ?? 0;
                return val >= 0 ? `+${val}` : String(val);
              })()}
            </div>
          )}
        </div>
      )}

      {challenge && !beforeStart && !afterEnd && (
        <section className="space-y-2">
          {!hasToday && (
            <Alert>
              <AlertTitle>Heutige Tageserfassung fehlt</AlertTitle>
              <AlertDescription>
                <div className="flex items-center gap-2">
                  <span>Trage deine Aktivitäten und Antworten für heute ein.</span>
                  <Link href="#form"><Button size="sm" variant="outline">Jetzt ausfüllen</Button></Link>
                </div>
              </AlertDescription>
            </Alert>
          )}
          {Array.isArray((challenge as any)?.config?.quiz?.pre?.questions) && !preDone && (
            <Alert>
              <AlertTitle>Pre‑Quiz steht noch aus</AlertTitle>
              <AlertDescription>
                <div className="flex items-center gap-2">
                  <span>Starte mit ein paar Einstiegsfragen.</span>
                  <Link href="#form"><Button size="sm" variant="outline">Jetzt starten</Button></Link>
                </div>
              </AlertDescription>
            </Alert>
          )}
          {isDefinedDay && (
            <Alert>
              <AlertTitle>Sonderfragen heute verfügbar</AlertTitle>
              <AlertDescription>
                <div className="flex items-center gap-2">
                  <span>Heute gibt es zusätzliche Fragen.</span>
                  <Link href="#form"><Button size="sm" variant="outline">Anzeigen</Button></Link>
                </div>
              </AlertDescription>
            </Alert>
          )}
          {showWeekly && (
            <Alert>
              <AlertTitle>Wöchentliche Reflexion fällig</AlertTitle>
              <AlertDescription>
                <div className="flex items-center gap-2">
                  <span>Beantworte die wöchentlichen Fragen.</span>
                  <Link href="/onboarding"><Button size="sm" variant="outline">Mehr Infos</Button></Link>
                </div>
              </AlertDescription>
            </Alert>
          )}
          {lastDay && Array.isArray((challenge as any)?.config?.quiz?.post?.questions) && !postDone && (
            <Alert>
              <AlertTitle>Post‑Quiz heute fällig</AlertTitle>
              <AlertDescription>
                <div className="flex items-center gap-2">
                  <span>Schließe die Challenge mit dem Post‑Quiz ab.</span>
                  <Link href="#form"><Button size="sm" variant="outline">Zum Abschluss</Button></Link>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </section>
      )}

      {challenge && beforeStart && (
        <section className="space-y-2">
          <Alert>
            <AlertTitle>Challenge noch nicht gestartet</AlertTitle>
            <AlertDescription>
              <div>Die Challenge beginnt am {format(new Date(challenge.startDate), "dd.MM.yyyy")}.</div>
            </AlertDescription>
          </Alert>
        </section>
      )}

      {challenge && afterEnd && stats && (
        <section className="space-y-4">
          <Alert>
            <AlertTitle>Challenge beendet</AlertTitle>
            <AlertDescription>
              <div>Zeitraum: {format(new Date(challenge.startDate), "dd.MM.yyyy")} – {format(new Date(challenge.endDate), "dd.MM.yyyy")}.</div>
              <div className="felex md:grid md:grid-cols-2 gap-4 md:gap-2 mt-2">
                <div><strong>Tage mit Eintrag:</strong> {stats.daysWithEntry} / {stats.totalDays} ({stats.completionRate}%)</div>
                {abEnabled && abGroup === "A" && <div><strong>Gesamtpunkte:</strong> {stats.totalScore}</div>}
                {abEnabled && abGroup === "A" && <div><strong>Ø Punkte/aktiver Tag:</strong> {stats.avgScoreActive}</div>}
                <div><strong>Längste Serie:</strong> {stats.longestStreak} Tage</div>
                <div><strong>Aktionen insgesamt:</strong> {stats.totalActions}</div>
                <div><strong>Pre‑Quiz abgeschlossen:</strong> {preDone ? "Ja" : "Nein"}</div>
                <div><strong>Post‑Quiz abgeschlossen:</strong> {postDone ? "Ja" : "Nein"}</div>
              </div>
            </AlertDescription>
          </Alert>
        </section>
      )}

      {challenge && !beforeStart && !afterEnd ? (
        <div id="form">
          <DailyForm
            actions={actions}
            challengeCode={challenge.code}
            initialSelected={initialSelected}
            definedQuestions={definedQuestionsOut}
            initialAnswers={todayAnswers}
            abMode={Boolean(challenge?.abEnabled)}
            abGroup={abGroup}
            preQuestions={!preDone ? preQuestionsOut : undefined}
            postQuestions={lastDay && !postDone ? postQuestionsOut : undefined}
            showOnlyPre={!preDone}
          />
        </div>
      ) : (
        <section className="space-y-2">
          <div className="text-sm text-center">Du bist aktuell keiner Challenge beigetreten.</div>
          {session ? (
            <Link href="/join"><Button variant="outline" className="w-full"><SwordsIcon />Jetzt Challenge beitreten</Button></Link>
          ) : (
            <Link href="/login" className="underline text-blue-600"><Button>Zum Beitreten anmelden</Button></Link>
          )}
        </section>
      )}
    </main>
  );
}


