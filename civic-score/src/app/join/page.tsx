import { prisma } from "@/lib/db";
import { getOrCreateParticipant } from "@/lib/participant";
import { getSessionUser } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { format } from "date-fns";
import LoginRequired from "@/components/login-required";
import JoinForm from "./join-form.client";

async function joinChallenge(_: any, formData: FormData): Promise<any> {
  "use server";
  const Schema = z.object({ code: z.string().min(3) });
  const parsed = Schema.safeParse({ code: formData.get("code") });
  if (!parsed.success) return { error: "validation", message: "Bitte Code eingeben." };

  const participant = await getOrCreateParticipant();
  const challenge = await (prisma as any).challenge.findUnique({ where: { code: parsed.data.code.trim() } });
  if (!challenge) return { error: "not_found", message: "Challenge-Code existiert nicht." };

  // Kein Upsert im HTTP-Modus: erst prüfen, dann erstellen
  const existing = await (prisma as any).challengeMembership.findUnique({
    where: { participantId_challengeId: { participantId: participant.id, challengeId: challenge.id } },
  });
  if (!existing) {
    try {
      // Assign A/B group if enabled for this challenge
      const abEnabled: boolean = Boolean((challenge as any).abEnabled);
      const abGroup: "A" | "B" | undefined = abEnabled ? (Math.random() < 0.5 ? "A" : "B") : undefined;
      await (prisma as any).challengeMembership.create({
        data: { participantId: participant.id, challengeId: challenge.id, abGroup },
      });
      // Set selected challenge cookie to the newly joined challenge for immediate context
      try {
        const jar: any = await cookies();
        jar.set("selected_challenge", String((challenge as any).code), { httpOnly: false, sameSite: "lax", path: "/" });
      } catch {}
      // Falls Startscore > 0: Basis-Eintrag am Challenge-Starttag anlegen
      if (challenge.startDate && (challenge as any).startScore && (challenge as any).startScore > 0) {
        const start = new Date(challenge.startDate);
        const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const next = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate() + 1);
        const existingStart = await (prisma as any).dayEntry.findFirst({
          where: ({ participantId: participant.id, challengeId: challenge.id, date: { gte: startDay, lt: next } } as any),
        });
        if (!existingStart) {
          await (prisma as any).dayEntry.create({
            data: {
              participantId: participant.id,
              date: startDay,
              totalScore: (challenge as any).startScore,
              note: "Startscore",
              challengeId: challenge.id,
            },
          });
        }
      }
    } catch (e) {
      // Ignoriere Unique-Fehler, falls parallel beigetreten wurde
    }
  }
  revalidatePath("/today");
  return { ok: true, message: "Challenge beigetreten." };
}

export default async function JoinPage() {
  const session = await getSessionUser();
  if (!session) {
    return <LoginRequired title="Challenge beitreten" message="Bitte anmelden, um beizutreten." />;
  }
  const participant = await getOrCreateParticipant();
  const memberships = await (prisma as any).challengeMembership.findMany({
    where: { participantId: participant.id },
    include: { challenge: true },
    orderBy: { joinedAt: "desc" },
  });
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <section className="max-w-md space-y-3">
        <h1 className="text-2xl font-semibold">Challenge beitreten</h1>
        <JoinForm action={joinChallenge} />
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Deine Challenges</h2>
        {memberships.length === 0 ? (
          <div className="text-sm opacity-70">Noch keiner Challenge beigetreten.</div>
        ) : (
          <ul className="space-y-1">
            {memberships.map((m: any) => (
              <li key={m.id} className="text-sm">
                {m.challenge.title} ({m.challenge.code}) – {format(m.challenge.startDate, "dd.MM.yyyy")}–{format(m.challenge.endDate, "dd.MM.yyyy")}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}


