import { prisma } from "@/lib/db";
import { isCurrentUserAdmin } from "@/lib/user";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/date-input";

async function addQuestionDate(formData: FormData): Promise<void> {
  "use server";
  const Schema = z.object({ id: z.string().min(1), date: z.string().min(1) });
  const parsed = Schema.safeParse({ id: formData.get("id"), date: formData.get("date") });
  if (!parsed.success) return;
  const challenge = await (prisma as any).challenge.findUnique({ where: { id: parsed.data.id } });
  if (!challenge) return;
  const d = new Date(parsed.data.date);
  const d0 = new Date(challenge.startDate);
  const d1 = new Date(challenge.endDate);
  if (d < d0 || d > d1) return;

  const cfg = (challenge.config as any) || {};
  const defined = Array.isArray(cfg.defined) ? cfg.defined : [];
  const iso = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
  if (!defined.includes(iso)) defined.push(iso);
  cfg.defined = defined;
  await (prisma as any).challenge.update({ where: { id: challenge.id }, data: { config: cfg } });
  revalidatePath(`/admin/${challenge.id}`);
}

export default async function ChallengeDetails({ params }: { params: { id: string } }) {
  const roleIsAdmin = await isCurrentUserAdmin();
  if (!roleIsAdmin) notFound();

  const challenge = await (prisma as any).challenge.findUnique({ where: { id: params.id } });
  if (!challenge) notFound();

  const memberships = await (prisma as any).challengeMembership.findMany({ where: { challengeId: challenge.id }, include: { participant: true } });

  const cfg = (challenge.config as any) || {};
  const defined: string[] = Array.isArray(cfg.defined) ? cfg.defined : [];

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{challenge.title}</h1>
      <div className="text-sm opacity-70">Code {challenge.code} – {format(challenge.startDate, "dd.MM.yyyy")}–{format(challenge.endDate, "dd.MM.yyyy")}</div>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Mitglieder ({memberships.length})</h2>
        <ul className="text-sm list-disc pl-5">
          {memberships.map((m: any) => (
            <li key={m.id}>{m.participant.id}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Fragen-Tage ({defined.length})</h2>
        <div className="text-sm">Aktuelle Tage:</div>
        <ul className="text-sm flex flex-wrap gap-2">
          {defined.length === 0 && <li className="px-2 py-1 rounded border">Keine Tage definiert</li>}
          {defined.map((iso) => {
            const d = new Date(iso);
            return <li key={iso} className="px-2 py-1 rounded border">{format(d, "dd.MM.yyyy")}</li>;
          })}
        </ul>
        <form action={addQuestionDate} className="grid gap-2 grid-cols-2 items-end">
          <input type="hidden" name="id" value={challenge.id} />
          <label>Datum innerhalb der Challenge</label>
          <div />
          <DateInput name="date" min={format(new Date(challenge.startDate), "yyyy-MM-dd")} max={format(new Date(challenge.endDate), "yyyy-MM-dd")} />
          <Button type="submit">Hinzufügen</Button>
        </form>
      </section>
    </main>
  );
}


