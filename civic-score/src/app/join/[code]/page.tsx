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

      // No start score should be added as a DayEntry
    } catch {}
  }

  redirect("/today");
}


