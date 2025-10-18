import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import LoginRequired from "@/components/login-required";
import { format } from "date-fns";
import { ChallengeSwitcher } from "@/components/challenge-switcher";
import { getSelectedChallengeCode } from "@/lib/challenge";
import { isCurrentUserAdmin } from "@/lib/user";
import { DevModeControls } from "@/components/dev-mode-controls";

export default async function HistoryPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const session = await getSessionUser();
  if (!session) {
    return <LoginRequired title="Kein Zugriff" message="Bitte anmelden, um die Historie zu sehen." />;
  }
  const isAdmin = await isCurrentUserAdmin();
  const getParam = (key: string): string | undefined => {
    const v = searchParams?.[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const devEnabled = isAdmin && ((getParam("dev") === "1") || (getParam("dev") === "true"));

  const selected = await getSelectedChallengeCode();
  // Build challenge switcher items for this page
  const memberships = await (prisma as any).challengeMembership.findMany({ where: { userId: session.id }, include: { challenge: true } });
  const items = (memberships as any[]).map((m) => {
    const ch = (m as any).challenge as any;
    return { id: ch.id as string, code: ch.code as string, title: ch.title as string, openToday: false, selected: ch.code === selected };
  });

  // Determine active membership and AB group for UI behavior
  let membership = await (prisma as any).challengeMembership.findFirst({
    where: selected ? ({ userId: session.id, challenge: { code: selected } } as any) : ({ userId: session.id } as any),
    orderBy: { joinedAt: "desc" },
    include: { challenge: true },
  });
  if (!membership && selected) {
    membership = await (prisma as any).challengeMembership.findFirst({ where: { userId: session.id }, orderBy: { joinedAt: "desc" }, include: { challenge: true } });
  }
  const abEnabled = Boolean((membership as any)?.challenge?.abEnabled);
  const abParam = getParam("ab");
  const abGroupMembership: "A" | "B" | undefined = (membership as any)?.abGroup ?? undefined;
  const abGroupOverride: "A" | "B" | undefined = devEnabled && (abParam === "A" || abParam === "B") ? (abParam as "A" | "B") : undefined;
  const abGroup: "A" | "B" | undefined = abGroupOverride ?? abGroupMembership;

  const entries = await prisma.dayEntry.findMany({
    where: { userId: session.id },
    orderBy: { date: "desc" },
    select: {
      id: true,
      date: true,
      totalScore: true,
      actions: { include: { action: true } },
    },
  });

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      {isAdmin ? (
        <DevModeControls isAdmin={isAdmin} abGroup={abGroup ?? null} />
      ) : null}
      {session && items.length > 0 ? (
        <div className="flex justify-end">
          <ChallengeSwitcher items={items} />
        </div>
      ) : null}
      <h1 className="text-2xl font-semibold">Historie</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Datum</th>
            {!(abEnabled && abGroup === "B") && (
              <>
              <th>Score</th>
              <th>Pos/Neg</th>
              </>
            )}
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(e => {
            const pos = e.actions.filter(a => a.action.weight > 0).length;
            const neg = e.actions.filter(a => a.action.weight < 0).length;
            return (
              <tr key={e.id} className="border-b">
                <td className="py-2">{format(e.date, "dd.MM.yyyy")}</td>
                {!(abEnabled && abGroup === "B") && (
                  <>
                  <td>{e.totalScore >= 0 ? `+${e.totalScore}` : e.totalScore}</td>
                  <td>{pos}/{neg}</td>
                  </>
                )}
                <td className="max-w-[460px]">
                  {e.actions.map(a => a.action.label).join(", ") || "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
