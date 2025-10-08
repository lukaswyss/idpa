import { prisma } from "@/lib/db";
import { isCurrentUserAdmin } from "@/lib/user";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { headers, cookies } from "next/headers";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DateInput } from "@/components/date-input";
import { getSessionUser } from "@/lib/auth";
import { generateUniqueChallengeCode } from "@/lib/challenge";
import LoginRequired from "@/components/login-required";
import { CreateChallengeForm } from "@/components/create-challenge-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusIcon } from "lucide-react";

async function createChallenge(formData: FormData): Promise<{ ok: boolean; id?: string; code?: string; title?: string; error?: string }> {
  "use server";
  const Schema = z.object({
    title: z.string().min(3),
    start: z.string(),
    end: z.string(),
    description: z.string().optional(),
    startScore: z.coerce.number().int().min(0).default(0),
    config: z.string().optional(),
    abEnabled: z.union([z.literal("true"), z.literal("false")]).optional(),
  });
  const parsed = Schema.safeParse({
    title: formData.get("title"),
    start: formData.get("start"),
    end: formData.get("end"),
    description: formData.get("description") ?? undefined,
    startScore: formData.get("startScore"),
    config: formData.get("config") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: "Ungültige Eingabe" };

  const startDate = new Date(parsed.data.start as string);
  const endDate = new Date(parsed.data.end as string);
  if (!(startDate instanceof Date) || isNaN(startDate.getTime()) || !(endDate instanceof Date) || isNaN(endDate.getTime())) {
    return { ok: false, error: "Ungültiges Datum" };
  }

  const generatedCode = await generateUniqueChallengeCode();
  const created = await (prisma as any).challenge.create({
    data: {
      title: parsed.data.title,
      code: generatedCode,
      description: parsed.data.description,
      startDate,
      endDate,
      startScore: parsed.data.startScore ?? 0,
      config: parsed.data.config ? safeParseJson(parsed.data.config) : undefined,
      abEnabled: parsed.data.abEnabled === "true",
    },
  });
  revalidatePath("/admin");
  return { ok: true, id: created.id as string, code: created.code as string, title: created.title as string };
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

async function cleanupExpiredSessions(): Promise<void> {
  "use server";
  const now = new Date();
  await prisma.authSession.deleteMany({ where: { expiresAt: { lt: now } } });
  revalidatePath("/admin");
}

async function cleanupUnusedParticipants(): Promise<void> {
  "use server";
  const orphans = await prisma.participant.findMany({
    where: {
      entries: { none: {} },
      memberships: { none: {} },
      user: { is: null },
    },
    select: { id: true },
  });
  if (orphans.length) {
    await prisma.participant.deleteMany({ where: { id: { in: orphans.map((p) => p.id) } } });
  }
  revalidatePath("/admin");
}

async function cleanupEmptyEndedChallenges(): Promise<void> {
  "use server";
  const now = new Date();
  const emptyEnded = await (prisma as any).challenge.findMany({
    where: { endDate: { lt: now }, memberships: { none: {} }, entries: { none: {} } },
    select: { id: true },
  });
  if (emptyEnded.length) {
    await (prisma as any).challenge.deleteMany({ where: { id: { in: emptyEnded.map((c: any) => c.id) } } });
  }
  revalidatePath("/admin");
}

async function cleanupEntriesOutOfChallengeRange(): Promise<void> {
  "use server";
  // Finde Einträge mit gesetzter Challenge, deren Datum außerhalb des Challenge-Zeitraums liegt
  const entries = await (prisma as any).dayEntry.findMany({
    where: { NOT: { challengeId: null } },
    select: { id: true, date: true, challenge: { select: { startDate: true, endDate: true } } },
  });
  const toDeleteIds: string[] = [];
  for (const e of entries as any[]) {
    const start = new Date(e.challenge.startDate);
    const end = new Date(e.challenge.endDate);
    const d = new Date(e.date);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || isNaN(d.getTime())) continue;
    if (d < start || d > end) toDeleteIds.push(e.id);
  }
  if (toDeleteIds.length) {
    await prisma.entryAction.deleteMany({ where: { dayEntryId: { in: toDeleteIds } } });
    await (prisma as any).dayEntry.deleteMany({ where: { id: { in: toDeleteIds } } });
  }
  revalidatePath("/admin");
}

async function cleanupUnusedActions(): Promise<void> {
  "use server";
  const unused = await prisma.action.findMany({ where: { entryActions: { none: {} } }, select: { id: true } });
  if (unused.length) {
    await prisma.action.deleteMany({ where: { id: { in: unused.map((a) => a.id) } } });
  }
  revalidatePath("/admin");
}

async function cleanupEmptyDayEntries(): Promise<void> {
  "use server";
  const empties = await (prisma as any).dayEntry.findMany({
    where: {
      actions: { none: {} },
      answers: null,
      totalScore: 0,
    },
    select: { id: true, note: true },
  });
  const toDelete = empties.filter((e: any) => !e.note || e.note.trim() === "").map((e: any) => e.id);
  if (toDelete.length) {
    await prisma.entryAction.deleteMany({ where: { dayEntryId: { in: toDelete } } });
    await (prisma as any).dayEntry.deleteMany({ where: { id: { in: toDelete } } });
  }
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

async function grantAdminByUsername(formData: FormData): Promise<void> {
  "use server";
  const Schema = z.object({ username: z.string().min(1) });
  const parsed = Schema.safeParse({ username: formData.get("username") });
  if (!parsed.success) return;
  const roleIsAdmin = await isCurrentUserAdmin();
  if (!roleIsAdmin) return;
  const user = await prisma.user.findUnique({ where: { username: parsed.data.username } });
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
  // Require session; then require admin role
  const session = await getSessionUser();
  if (!session) {
    return <LoginRequired title="Kein Zugriff" message="Bitte anmelden, um die Admin-Seite zu sehen." />;
  }
  const roleIsAdmin = await isCurrentUserAdmin();
  if (!roleIsAdmin) {
    return (
      <main className="mx-auto max-w-3xl p-6 space-y-6">
        <section className="max-w-md space-y-3">
          <h1 className="text-2xl font-semibold">Kein Zugriff</h1>
          <p className="text-sm opacity-70">Nur Admins können diese Seite sehen.</p>
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

      <Tabs defaultValue="challenges">
        <TabsList>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="cleanup">Bereinigung</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="space-y-6">



          <section className="space-y-2">
            <div className="flex items-center justify-between">

              <h2 className="text-lg font-medium">Challenges</h2>
              <Dialog>
                <div className="flex items-center justify-between">
                  <DialogTrigger asChild>
                    <Button><PlusIcon />Neue Challenge</Button>
                  </DialogTrigger>
                </div>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Neue Challenge</DialogTitle>
                  </DialogHeader>
                  <CreateChallengeForm action={createChallenge} />
                </DialogContent>
              </Dialog>
            </div>
            <ul className="space-y-2">
              {challenges.map((c: any) => (
                <li key={c.id} className="text-sm flex items-center justify-between gap-4">
                  <span>
                    <Link className="underline" href={`/admin/${c.id}`}>{c.title}</Link> ({c.code}) – {format(c.startDate, "dd.MM.yyyy")}–{format(c.endDate, "dd.MM.yyyy")}
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger className="text-red-600 underline"><Button variant="destructive">Löschen</Button></AlertDialogTrigger>
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
        </TabsContent>

        <TabsContent value="cleanup" className="space-y-3">
          <section className="space-y-3">
            <h2 className="text-lg font-medium">Bereinigung</h2>
            <form action={cleanupUnassigned}>
              <Button className="bg-red-600 hover:bg-red-700" type="submit">Einträge ohne Challenge löschen</Button>
            </form>
            <p className="text-xs opacity-70">Löscht DayEntries ohne Challenge und deren verknüpfte Aktionen.</p>
            <div className="h-px bg-border my-2" />
            <form action={cleanupExpiredSessions}>
              <Button variant="outline" type="submit">Abgelaufene Sessions löschen</Button>
            </form>
            <p className="text-xs opacity-70">Entfernt alle AuthSessions mit Ablaufdatum in der Vergangenheit.</p>

            <form action={cleanupUnusedParticipants}>
              <Button variant="outline" type="submit">Unbenutzte Teilnehmer löschen</Button>
            </form>
            <p className="text-xs opacity-70">Teilnehmer ohne User, ohne Einträge und ohne Challenge-Mitgliedschaften.</p>

            <form action={cleanupEmptyEndedChallenges}>
              <Button variant="outline" type="submit">Leere, beendete Challenges löschen</Button>
            </form>
            <p className="text-xs opacity-70">Challenges nach Enddatum ohne Einträge und ohne Mitglieder.</p>

            <form action={cleanupEntriesOutOfChallengeRange}>
              <Button variant="outline" type="submit">Einträge außerhalb Challenge-Zeitraum löschen</Button>
            </form>
            <p className="text-xs opacity-70">Entfernt DayEntries mit gesetzter Challenge außerhalb deren Start-/Enddatum.</p>

            <form action={cleanupEmptyDayEntries}>
              <Button variant="outline" type="submit">Leere Tages-Einträge löschen</Button>
            </form>
            <p className="text-xs opacity-70">Entfernt DayEntries ohne Aktionen, ohne Antworten, ohne Notiz und Score = 0.</p>

            <form action={cleanupUnusedActions}>
              <Button variant="outline" type="submit">Unbenutzte Aktionen löschen</Button>
            </form>
            <p className="text-xs opacity-70">Entfernt Actions, die in keiner EntryAction verwendet werden.</p>
          </section>
        </TabsContent>

        <TabsContent value="admins" className="space-y-3">
          <section className="space-y-3">
            <h2 className="text-lg font-medium">Admins</h2>
            <form action={grantAdminByUsername} className="flex items-center gap-2">
              <Input name="username" placeholder="Username" />
              <Button type="submit">Per Username gewähren</Button>
            </form>
            <div className="space-y-2">
              {users.map((u: any) => {
                const isAdmin = adminRoles.some((r: any) => r.userId === u.id);
                return (
                  <div key={u.id} className="flex items-center justify-between border rounded px-3 py-2">
                    <div className="text-sm">ID: {u.id}{u.username ? ` · ${u.username}` : ""}</div>
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
        </TabsContent>
      </Tabs>
    </main>
  );
}


