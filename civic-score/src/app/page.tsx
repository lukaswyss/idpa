import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { DailyForm } from "@/app/daily-form";
import { getOrCreateParticipant } from "@/lib/participant";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default async function Home() {
  const actions = await prisma.action.findMany({ orderBy: [{ category: "asc" }, { label: "asc" }] });
  const today = new Date();

  // Load latest joined challenge for activity context
  const participant = await getOrCreateParticipant();
  const membership = await (prisma as any).challengeMembership.findFirst({
    where: { participantId: participant.id },
    orderBy: { joinedAt: "desc" },
    include: { challenge: true },
  });

  const challenge = membership?.challenge as any | undefined;
  let days: { date: Date; score: number }[] = [];
  let initialSelected: string[] = [];
  let initialNote: string | undefined = undefined;
  if (challenge) {
    // Build range of days between start and end
    const d0 = new Date(challenge.startDate);
    const d1 = new Date(challenge.endDate);
    const grid: Date[] = [];
    for (let d = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate()); d <= d1; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
      grid.push(new Date(d));
    }
    const entries = await (prisma as any).dayEntry.findMany({
      where: ({ participantId: participant.id, challengeId: challenge.id, date: { gte: d0, lte: d1 } } as any),
    });
    // Load today's entry with actions for initial form state
    const today = new Date();
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const nextDay = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
    const todayEntry = await (prisma as any).dayEntry.findFirst({
      where: ({ participantId: participant.id, challengeId: challenge.id, date: { gte: day, lt: nextDay } } as any),
      include: ({ actions: true } as any),
    });
    if (todayEntry) {
      const te: any = todayEntry as any;
      initialSelected = (te.actions || []).map((a: any) => a.actionId);
      initialNote = te.note ?? undefined;
    }
    days = grid.map((d) => {
      const entry = (entries as any[]).find((e: { date: Date; totalScore: number }) => new Date(e.date).toDateString() === d.toDateString());
      return { date: d, score: entry?.totalScore ?? 0 };
    });
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Civic Score – Heute ({format(today, "dd.MM.yyyy")})</h1>

      {challenge && (
        <section className="space-y-2">
          <div className="text-sm">Challenge: {challenge.title} ({challenge.code})</div>
          <div className="grid grid-cols-14 gap-1">
            {days.map((d) => {
              const isToday = new Date().toDateString() === d.date.toDateString();
              const hasAnswer = d.score > 0;
              const intensity = hasAnswer ? (d.score > 10 ? "bg-green-700" : d.score > 5 ? "bg-green-500" : "bg-green-300") : "bg-neutral-200";
              return (
                <Tooltip key={d.date.toISOString()}>
                  <TooltipTrigger asChild>
                    <div className={`h-4 w-4 rounded ${intensity} ${isToday ? "ring-2 ring-blue-500" : ""}`} />
                  </TooltipTrigger>
                  <TooltipContent>
                    {format(d.date, "dd.MM.")}: {d.score}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </section>
      )}

      {challenge ? (
        <DailyForm actions={actions} challengeCode={challenge.code} initialSelected={initialSelected} initialNote={initialNote} />
      ) : (
        <section className="space-y-2">
          <div className="text-sm">Du bist aktuell keiner Challenge beigetreten.</div>
          <Link href="/join" className="underline text-blue-600">Jetzt Challenge beitreten</Link>
        </section>
      )}
    </main>
  );
}
