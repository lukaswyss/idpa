import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginRequired from "@/components/login-required";
import Link from "next/link";

export default async function JoinByCodePage({ params }: { params: { code: string } }) {
  const code = String(params.code ?? "").trim();
  const session = await getSessionUser();

  if (!session) {
    return (
      <LoginRequired
        title="Challenge beitreten"
        message={`Bitte anmelden, um der Challenge mit Code \"${code}\" beizutreten.`}
      />
    );
  }

  const challenge = await (prisma as any).challenge.findUnique({ where: { code } });
  if (!challenge) {
    return (
      <main className="mx-auto max-w-md p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Challenge nicht gefunden</h1>
        <p className="text-sm opacity-70">Der Challenge‑Code existiert nicht: {code}</p>
        <Link href="/join" className="underline">Zurück zur Beitrittsseite</Link>
      </main>
    );
  }

  // Prüfen, ob Mitgliedschaft bereits existiert
  const existing = await (prisma as any).challengeMembership.findUnique({
    where: { userId_challengeId: { userId: session.id, challengeId: challenge.id } },
  });
  if (!existing) {
    try {
      // A/B‑Zuordnung falls aktiviert
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

      // Direkt ausgewählte Challenge setzen
      try {
        const jar: any = await cookies();
        jar.set("selected_challenge", String((challenge as any).code), { httpOnly: false, sameSite: "lax", path: "/" });
      } catch {}

      // Startscore-Eintrag am Starttag, falls konfiguriert
      if (challenge.startDate && (challenge as any).startScore && (challenge as any).startScore > 0) {
        const start = new Date(challenge.startDate);
        const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const next = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate() + 1);
        const existingStart = await (prisma as any).dayEntry.findFirst({
          where: ({ userId: session.id, challengeId: challenge.id, date: { gte: startDay, lt: next } } as any),
        });
        if (!existingStart) {
          await (prisma as any).dayEntry.create({
            data: {
              userId: session.id,
              date: startDay,
              totalScore: (challenge as any).startScore,
              markers: ["startscore"],
              challengeId: challenge.id,
            },
          });
        }
      }
    } catch {}
  }

  redirect("/today");
}


