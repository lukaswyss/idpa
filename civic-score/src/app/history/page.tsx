import { prisma } from "@/lib/db";
import { getOrCreateParticipant } from "@/lib/participant";
import { getSessionUser } from "@/lib/auth";
import LoginRequired from "@/components/login-required";
import { format } from "date-fns";

export default async function HistoryPage() {
  const session = await getSessionUser();
  if (!session) {
    return <LoginRequired title="Kein Zugriff" message="Bitte anmelden, um die Historie zu sehen." />;
  }
  const p = await getOrCreateParticipant();
  const entries = await prisma.dayEntry.findMany({
    where: { participantId: p.id },
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
      <h1 className="text-2xl font-semibold">Historie</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Datum</th>
            <th>Score</th>
            <th>Pos/Neg</th>
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
                <td>{e.totalScore >= 0 ? `+${e.totalScore}` : e.totalScore}</td>
                <td>{pos}/{neg}</td>
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
