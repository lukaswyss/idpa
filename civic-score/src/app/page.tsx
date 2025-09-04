import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { DailyForm } from "@/app/daily-form";

export default async function Home() {
  const actions = await prisma.action.findMany({ orderBy: [{ category: "asc" }, { label: "asc" }] });
  const today = new Date();
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Civic Score – Heute ({format(today, "dd.MM.yyyy")})</h1>
      <DailyForm actions={actions} />
    </main>
  );
}
