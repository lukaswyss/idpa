import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateParticipant } from "@/lib/participant";
import { prisma } from "@/lib/db";
import Link from "next/link";

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  href?: string;
};

export default async function OnboardingPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const participant = await getOrCreateParticipant();

  // Identify latest joined challenge (if any)
  const membership = await (prisma as any).challengeMembership.findFirst({
    where: { participantId: participant.id },
    orderBy: { joinedAt: "desc" },
    include: { challenge: true },
  });
  const challenge = membership?.challenge as any | undefined;

  // Determine simple completion signals
  const hasAccount = !!session;
  const hasChallenge = !!challenge;

  // Pre/Post quiz markers from challenge.config if present
  // We assume config.quiz.preId / config.quiz.postId exist when quizzes are enabled
  let preQuizDone = false;
  let postQuizDone = false;
  try {
    const cfg: any = challenge?.config || {};
    const preId: string | undefined = cfg?.quiz?.preId;
    const postId: string | undefined = cfg?.quiz?.postId;
    if (preId) {
      const pre = await (prisma as any).dayEntry.findFirst({
        where: { participantId: participant.id, challengeId: challenge?.id ?? undefined, note: { contains: `quiz:${preId}` } },
      });
      preQuizDone = !!pre;
    }
    if (postId) {
      const post = await (prisma as any).dayEntry.findFirst({
        where: { participantId: participant.id, challengeId: challenge?.id ?? undefined, note: { contains: `quiz:${postId}` } },
      });
      postQuizDone = !!post;
    }
  } catch {}

  // Daily/weekly participation signal
  let hasAnyDaily = false;
  let hasAnyWeekly = false;
  try {
    const anyEntry = await (prisma as any).dayEntry.findFirst({ where: { participantId: participant.id, challengeId: challenge?.id ?? undefined } });
    hasAnyDaily = !!anyEntry;
    // Weekly is a coarse marker: check answers containing a key like "week" or notes containing "Woche"
    if (anyEntry?.answers && typeof anyEntry.answers === "object") {
      const keys = Object.keys(anyEntry.answers as any);
      hasAnyWeekly = keys.some(k => k.toLowerCase().includes("week"));
    }
  } catch {}

  const items: ChecklistItem[] = [
    { id: "account", label: "Account erstellt oder angemeldet", done: hasAccount, href: hasAccount ? undefined : "/login" },
    { id: "join", label: "Challenge beigetreten", done: hasChallenge, href: hasChallenge ? undefined : "/join" },
    { id: "pre", label: "Pre-Quiz abgeschlossen (falls vorgesehen)", done: preQuizDone },
    { id: "daily", label: "Erste Tageserfassung gemacht", done: hasAnyDaily, href: "/today" },
    { id: "weekly", label: "Wöchentliche Reflexion beantwortet (falls vorgesehen)", done: hasAnyWeekly },
    { id: "post", label: "Post-Quiz abgeschlossen (falls vorgesehen)", done: postQuizDone },
  ];

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Onboarding</h1>
        <p className="text-sm opacity-80">Dein Fortschritt durch die wichtigsten Schritte.</p>
      </section>

      <section>
        <ul className="space-y-2">
          {items.map(item => (
            <li key={item.id} className="flex items-center gap-3">
              <span className={`inline-block size-4 rounded-full border ${item.done ? 'bg-green-500 border-green-600' : 'bg-neutral-100 border-neutral-300'}`} />
              <span className={item.done ? 'line-through opacity-60' : ''}>{item.label}</span>
              {!item.done && item.href ? (
                <Link className="ml-auto underline text-blue-600" href={item.href}>Jetzt erledigen</Link>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}


