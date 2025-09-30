import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/user";
import { createSession, hashPassword } from "@/lib/auth";
import { z } from "zod";
import { generateUniqueUsername } from "@/lib/user";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UsernameSuggestion } from "../login/username-suggestion";
import { House } from "lucide-react";

async function doRegister(formData: FormData) {
  "use server";
  const Schema = z.object({ password: z.string().min(3), chosen: z.string().optional() });
  const parsed = Schema.safeParse({ password: formData.get("password"), chosen: formData.get("chosen") ?? undefined });
  if (!parsed.success) return;
  const { user } = await getOrCreateUser();
  let username = parsed.data.chosen || (await generateUniqueUsername());
  // ensure uniqueness; rotate until available (max tries)
  let tries = 0;
  while (tries < 5) {
    const exists = await prisma.user.findUnique({ where: { username } });
    if (!exists) break;
    username = await generateUniqueUsername();
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

export default async function RegisterPage() {
  const suggested = await generateUniqueUsername();
  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <Link className="absolute top-3 left-3" href="/"><Button variant="outline"><House /></Button></Link>
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">Registrieren</h1>
        <form action={doRegister} className="space-y-2">
          <UsernameSuggestion name="chosen" initial={suggested} />
          <Input name="password" type="password" placeholder="Passwort" />
          <Button type="submit">Registrieren</Button>
        </form>
        <p className="text-xs text-muted-foreground">
          Datenschutz: Diese Anwendung ist so gestaltet, dass sie deine Anonymität
          bestmöglich wahrt. Es werden keine personenbezogenen Daten wie Name
          oder E‑Mail benötigt; dein Nutzername ist pseudonym.
        </p>
        <div className="text-sm">
          Bereits einen Account? <Link className="underline" href="/login">Anmelden</Link>
        </div>
      </section>
    </main>
  );
}


