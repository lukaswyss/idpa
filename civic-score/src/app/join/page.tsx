import { prisma } from "@/lib/db";
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

  const session = await getSessionUser();
  if (!session) return { error: "auth", message: "Bitte anmelden." };
  const challenge = await (prisma as any).challenge.findUnique({ where: { code: parsed.data.code.trim() } });
  if (!challenge) return { error: "not_found", message: "Challenge-Code existiert nicht." };

  // Kein Upsert im HTTP-Modus: erst prüfen, dann erstellen
  const existing = await (prisma as any).challengeMembership.findUnique({
    where: { userId_challengeId: { userId: session.id, challengeId: challenge.id } },
  });
  if (!existing) {
    try {
      // Assign A/B group if enabled for this challenge
      const abEnabled: boolean = Boolean((challenge as any).abEnabled);
      let abGroup: "A" | "B" | undefined = undefined;
      if (abEnabled) {
        const [countA, countB] = await Promise.all([
          (prisma as any).challengeMembership.count({ where: { challengeId: challenge.id, abGroup: "A" } }),
          (prisma as any).challengeMembership.count({ where: { challengeId: challenge.id, abGroup: "B" } }),
        ]);
        if (countA < countB) abGroup = "A";
        else if (countB < countA) abGroup = "B";
        else abGroup = Math.random() < 0.5 ? "A" : "B";
      }
      await (prisma as any).challengeMembership.create({
        data: { userId: session.id, challengeId: challenge.id, abGroup },
      });
      // Set selected challenge cookie to the newly joined challenge for immediate context
      try {
        const jar: any = await cookies();
        jar.set("selected_challenge", String((challenge as any).code), { httpOnly: false, sameSite: "lax", path: "/" });
      } catch {}
      // No start score should be added as a DayEntry
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
  const memberships = await (prisma as any).challengeMembership.findMany({
    where: { userId: session.id },
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


