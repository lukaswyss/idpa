import { prisma } from "@/lib/db";
import { isCurrentUserAdmin } from "@/lib/user";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { headers, cookies } from "next/headers";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DateInput } from "@/components/date-input";

async function createChallenge(formData: FormData): Promise<void> {
  "use server";
  const Schema = z.object({
    title: z.string().min(3),
    code: z.string().min(3),
    start: z.string(),
    end: z.string(),
    description: z.string().optional(),
    startScore: z.coerce.number().int().min(0).default(0),
    config: z.string().optional(),
  });
  const parsed = Schema.safeParse({
    title: formData.get("title"),
    code: formData.get("code"),
    start: formData.get("start"),
    end: formData.get("end"),
    description: formData.get("description") ?? undefined,
    startScore: formData.get("startScore"),
    config: formData.get("config") ?? undefined,
  });
  if (!parsed.success) return;

  const startDate = new Date(parsed.data.start as string);
  const endDate = new Date(parsed.data.end as string);
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) return;

  await (prisma as any).challenge.create({
    data: {
      title: parsed.data.title,
      code: parsed.data.code,
      description: parsed.data.description,
      startDate,
      endDate,
      startScore: parsed.data.startScore ?? 0,
      config: parsed.data.config ? safeParseJson(parsed.data.config) : undefined,
    },
  });
  revalidatePath("/admin");
}

// Entfernt: Tagesfrage-Funktionalität

function safeParseJson(input?: string | null): any {
  if (!input) return undefined;
  try {
    const obj = JSON.parse(input as string);
    return obj;
  } catch {
    return undefined;
  }
}

// Removed admin code login gate. Admin access is role-based only.

async function deleteChallenge(formData: FormData): Promise<void> {
  "use server";
  const Schema = z.object({ id: z.string().min(1) });
  const parsed = Schema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  const challengeId = parsed.data.id;

  // Lösche EntryActions der Einträge in dieser Challenge
  const entries = await (prisma as any).dayEntry.findMany({ where: { challengeId }, select: { id: true } });
  if (entries.length) {
    await prisma.entryAction.deleteMany({ where: { dayEntryId: { in: entries.map((e: any) => e.id) } } });
  }
  // Lösche DayEntries innerhalb der Challenge
  await (prisma as any).dayEntry.deleteMany({ where: { challengeId } });
  // Lösche Memberships (ChallengeDay entfernt)
  await (prisma as any).challengeMembership.deleteMany({ where: { challengeId } });
  // Lösche Challenge
  await (prisma as any).challenge.delete({ where: { id: challengeId } });
  revalidatePath("/admin");
}

async function cleanupUnassigned(): Promise<void> {
  "use server";
  // Lösche EntryActions ohne Challenge-Kontext (über DayEntries mit challengeId = null)
  const entries = await (prisma as any).dayEntry.findMany({ where: { challengeId: null }, select: { id: true } });
  if (entries.length) {
    await prisma.entryAction.deleteMany({ where: { dayEntryId: { in: entries.map((e: any) => e.id) } } });
    await (prisma as any).dayEntry.deleteMany({ where: { id: { in: entries.map((e: any) => e.id) } } });
  }
  revalidatePath("/admin");
}

async function logoutAdmin(): Promise<void> {
  "use server";
  const store: any = await cookies();
  store.set("admin_code", "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 0 });
  revalidatePath("/admin");
}

async function grantAdmin(formData: FormData): Promise<void> {
  "use server";
  const Schema = z.object({ userId: z.string().min(1) });
  const parsed = Schema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) return;
  const roleIsAdmin = await isCurrentUserAdmin();
  if (!roleIsAdmin) return;
  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) return;
  const existing = await prisma.adminRole.findUnique({ where: { userId: user.id } });
  if (!existing) {
    await prisma.adminRole.create({ data: { userId: user.id } });
  }
  revalidatePath("/admin");
}

async function revokeAdmin(formData: FormData): Promise<void> {
  "use server";
  const Schema = z.object({ userId: z.string().min(1) });
  const parsed = Schema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) return;
  const roleIsAdmin = await isCurrentUserAdmin();
  if (!roleIsAdmin) return;
  const existing = await prisma.adminRole.findUnique({ where: { userId: parsed.data.userId } });
  if (existing) {
    await prisma.adminRole.delete({ where: { userId: parsed.data.userId } });
  }
  revalidatePath("/admin");
}

export default async function AdminPage() {
  // Role-based admin only
  const roleIsAdmin = await isCurrentUserAdmin();
  if (!roleIsAdmin) {
    return (
      <main className="mx-auto max-w-3xl p-6 space-y-6">
        <section className="max-w-md space-y-3">
          <h1 className="text-2xl font-semibold">Kein Zugriff</h1>
          <p className="text-sm opacity-70">Nur angemeldete Admins können diese Seite sehen.</p>
        </section>
      </main>
    );
  }

  const challenges = await (prisma as any).challenge.findMany({ orderBy: { createdAt: "desc" } });
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  const adminRoles = await prisma.adminRole.findMany();
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <form action={logoutAdmin}>
        <Button variant="link" className="p-0 h-auto" type="submit">Logout</Button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Neue Challenge</h2>
        <form action={createChallenge} className="grid gap-2 grid-cols-2 items-end">
          <Input name="title" placeholder="Titel" className="col-span-2" />
          <label htmlFor="code">Zugangscode</label>
          <label htmlFor="startScore">Startscore</label>
          <Input name="code" placeholder="Code" />
          <Input name="startScore" type="number" min={0} defaultValue={0} placeholder="Startscore" />
          <label htmlFor="start">Start</label>
          <label htmlFor="end">Ende</label>
          <DateInput name="start" defaultValue={format(new Date(), "yyyy-MM-dd")} />
          <DateInput name="end" />
          <Input name="description" placeholder="Beschreibung (optional)" className="col-span-2" />
          <label htmlFor="config" className="col-span-2">Konfiguration (JSON)</label>
          <textarea name="config" className="col-span-2 min-h-40 p-2 border rounded" placeholder='{"quizBefore":{...},"quizAfter":{...},"defined":{...},"daily":{...}}'></textarea>
          <Button className="w-fit" type="submit">Erstellen</Button>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Challenges</h2>
        <ul className="space-y-2">
          {challenges.map((c: any) => (
            <li key={c.id} className="text-sm flex items-center justify-between gap-4">
              <span>
                <Link className="underline" href={`/admin/${c.id}`}>{c.title}</Link> ({c.code}) – {format(c.startDate, "dd.MM.yyyy")}–{format(c.endDate, "dd.MM.yyyy")}
              </span>
              <AlertDialog>
                <AlertDialogTrigger className="text-red-600 underline">Löschen</AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Challenge löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Diese Aktion entfernt die Challenge, Mitglieder, Tage und alle Einträge in dieser Challenge. Das kann nicht rückgängig gemacht werden.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <form>
                      <input type="hidden" name="id" value={c.id} />
                      <AlertDialogAction formAction={deleteChallenge} type="submit" className="bg-red-600 hover:bg-red-700">Ja, löschen</AlertDialogAction>
                    </form>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Bereinigung</h2>
        <form action={cleanupUnassigned}>
          <Button className="bg-red-600 hover:bg-red-700" type="submit">Einträge ohne Challenge löschen</Button>
        </form>
        <p className="text-xs opacity-70">Löscht DayEntries ohne Challenge und deren verknüpfte Aktionen.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Admins</h2>
        <div className="space-y-2">
          {users.map((u: any) => {
            const isAdmin = adminRoles.some((r: any) => r.userId === u.id);
            return (
              <div key={u.id} className="flex items-center justify-between border rounded px-3 py-2">
                <div className="text-sm">ID: {u.id}</div>
                <div>
                  {isAdmin ? (
                    <form action={revokeAdmin}>
                      <input type="hidden" name="userId" value={u.id} />
                      <Button variant="link" className="text-sm p-0 h-auto" type="submit">Revoke</Button>
                    </form>
                  ) : (
                    <form action={grantAdmin}>
                      <input type="hidden" name="userId" value={u.id} />
                      <Button variant="link" className="text-sm p-0 h-auto" type="submit">Grant</Button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}


