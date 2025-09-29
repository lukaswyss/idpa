import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/user";
import { isCurrentUserAdmin } from "@/lib/user";
import { generateUniqueUsername } from "@/lib/user";
import { createSession, hashPassword, verifyPassword } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { generateAnonymousUsername } from "@/lib/username";
import { UsernameSuggestion } from "./username-suggestion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

async function doLogin(formData: FormData) {
  "use server";
  const Schema = z.object({ username: z.string().min(3), password: z.string().min(3) });
  const parsed = Schema.safeParse({ username: formData.get("username"), password: formData.get("password") });
  if (!parsed.success) return;
  const user = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!user || !user.passwordHash) return;
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return;
  await createSession(user.id);
  redirect("/");
}

async function doRegister(formData: FormData) {
  "use server";
  const Schema = z.object({ password: z.string().min(3), rotate: z.string().optional(), chosen: z.string().optional() });
  const parsed = Schema.safeParse({ password: formData.get("password"), rotate: formData.get("rotate") ?? undefined, chosen: formData.get("chosen") ?? undefined });
  if (!parsed.success) return;
  const { user, participant } = await getOrCreateUser();
  // choose username: either provided hidden input or generate one
  let username = parsed.data.chosen || generateAnonymousUsername();
  // ensure uniqueness; rotate until available (max tries)
  let tries = 0;
  while (tries < 5) {
    const exists = await prisma.user.findUnique({ where: { username } });
    if (!exists) break;
    username = generateAnonymousUsername(crypto.randomUUID());
    tries++;
  }
  const passwordHash = await hashPassword(parsed.data.password);
  const updated = await prisma.user.update({ where: { id: user.id }, data: { username, passwordHash } });
  // First registered user becomes admin automatically
  const anyAdmin = await prisma.adminRole.findFirst();
  if (!anyAdmin) {
    try { await prisma.adminRole.create({ data: { userId: updated.id } }); } catch {}
  }
  await createSession(updated.id);
  redirect("/profile");
}

async function rotateSuggestion() {
  "use server";
  const seed = crypto.randomUUID();
  redirect(`/login?s=${encodeURIComponent(seed)}`);
}

export default async function LoginPage({ searchParams }: { searchParams: { s?: string } }) {
  const cookieStore: any = await cookies();
  // Prefer server-generated unique suggestion
  const suggested = await generateUniqueUsername();
  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">Anmelden</h1>
        <form action={doLogin} className="space-y-2">
          <Input name="username" placeholder="Username" />
          <Input name="password" type="password" placeholder="Passwort" />
          <Button type="submit">Login</Button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Oder registrieren</h2>
        <form action={doRegister} className="space-y-2">
          <UsernameSuggestion name="chosen" initial={suggested} />
          <Input name="password" type="password" placeholder="Passwort" />
          <Button type="submit">Registrieren</Button>
        </form>
      </section>
    </main>
  );
}


