import { prisma } from "@/lib/db";
import { isCurrentUserAdmin } from "@/lib/user";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { headers, cookies } from "next/headers";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

async function createChallenge(formData: FormData): Promise<void> {
  "use server";
  const Schema = z.object({
    title: z.string().min(3),
    code: z.string().min(3),
    start: z.string(),
    end: z.string(),
    description: z.string().optional(),
    startScore: z.coerce.number().int().min(0).default(0),
  });
  const parsed = Schema.safeParse({
    title: formData.get("title"),
    code: formData.get("code"),
    start: formData.get("start"),
    end: formData.get("end"),
    description: formData.get("description") ?? undefined,
    startScore: formData.get("startScore"),
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
    },
  });
  revalidatePath("/admin");
}

// Entfernt: Tagesfrage-Funktionalität

async function loginAdmin(formData: FormData): Promise<void> {
  "use server";
  const Schema = z.object({ code: z.string().min(1) });
  const parsed = Schema.safeParse({ code: formData.get("code") });
  if (!parsed.success) return;
  const expected = process.env.ADMIN_CODE;
  if (expected && parsed.data.code === expected) {
    const store: any = await cookies();
    store.set("admin_code", parsed.data.code, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  revalidatePath("/admin");
}

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
  // Lösche Memberships und Days
  await (prisma as any).challengeMembership.deleteMany({ where: { challengeId } });
  await (prisma as any).challengeDay.deleteMany({ where: { challengeId } });
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
  // Role-based admin in addition to optional code-based gate
  const hdrs: any = await headers();
  const providedHeader = hdrs.get("x-admin-code") || undefined;
  const cookieStore: any = await cookies();
  const providedCookie = cookieStore.get("admin_code")?.value;
  const provided = providedHeader ?? providedCookie;
  const expected = process.env.ADMIN_CODE;
  const roleIsAdmin = await isCurrentUserAdmin();
  if ((!expected || provided !== expected) && !roleIsAdmin) {
    return (
      <main className="mx-auto max-w-3xl p-6 space-y-6">
        <section className="max-w-md space-y-3">
          <h1 className="text-2xl font-semibold">Admin Login</h1>
          <form action={loginAdmin} className="space-y-3">
            <input name="code" type="password" placeholder="Admin-Code" className="border rounded px-3 py-2 w-full" />
            <button className="bg-black text-white px-3 py-2 rounded" type="submit">Einloggen</button>
          </form>
          <p className="text-sm opacity-70">Code wird mit der Umgebungsvariable verglichen.</p>
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
        <button className="text-sm underline" type="submit">Logout</button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Neue Challenge</h2>
        <form action={createChallenge} className="grid gap-2 grid-cols-2 items-end">
          <input name="title" placeholder="Titel" className="border rounded px-3 py-2 col-span-2" />
          <label htmlFor="code">Zugangscode</label>
          <label htmlFor="startScore">Startscore</label>
          <input name="code" placeholder="Code" className="border rounded px-3 py-2" />
          <input name="startScore" type="number" min={0} defaultValue={0} placeholder="Startscore" className="border rounded px-3 py-2" />
          <label htmlFor="start">Start</label>
          <label htmlFor="end">Ende</label>
          <input name="start" type="date" className="border rounded px-3 py-2" />
          <input name="end" type="date" className="border rounded px-3 py-2" />
          <input name="description" placeholder="Beschreibung (optional)" className="border rounded px-3 py-2 col-span-2" />
          <button className="bg-black text-white px-3 py-2 rounded w-fit" type="submit">Erstellen</button>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Challenges</h2>
        <ul className="space-y-2">
          {challenges.map((c: any) => (
            <li key={c.id} className="text-sm flex items-center justify-between gap-4">
              <span>{c.title} ({c.code}) – {format(c.startDate, "dd.MM.yyyy")}–{format(c.endDate, "dd.MM.yyyy")}</span>
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
                    <form action={deleteChallenge}>
                      <input type="hidden" name="id" value={c.id} />
                      <AlertDialogAction className="bg-red-600 hover:bg-red-700">Ja, löschen</AlertDialogAction>
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
          <button className="bg-red-600 text-white px-3 py-2 rounded" type="submit">Einträge ohne Challenge löschen</button>
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
                <div className="text-sm">
                  <div>ID: {u.id}</div>
                  {u.email ? <div>Email: {u.email}</div> : null}
                  {u.displayName ? <div>Name: {u.displayName}</div> : null}
                </div>
                <div>
                  {isAdmin ? (
                    <form action={revokeAdmin}>
                      <input type="hidden" name="userId" value={u.id} />
                      <button className="text-sm underline" type="submit">Revoke</button>
                    </form>
                  ) : (
                    <form action={grantAdmin}>
                      <input type="hidden" name="userId" value={u.id} />
                      <button className="text-sm underline" type="submit">Grant</button>
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


