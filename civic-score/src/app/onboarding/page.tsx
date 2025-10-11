import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateParticipant } from "@/lib/participant";
import Link from "next/link";
import { getOnboardingTasks, type ChecklistItem } from "@/lib/onboarding-tasks";

export default async function OnboardingPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const participant = await getOrCreateParticipant();
  const items: ChecklistItem[] = await getOnboardingTasks(participant.id, !!session);

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


