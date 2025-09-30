import { prisma } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { House } from "lucide-react";

async function doLogin(formData: FormData) {
  "use server";
  const Schema = z.object({ username: z.string().min(3), password: z.string().min(3) });
  const parsed = Schema.safeParse({ username: formData.get("username"), password: formData.get("password") });
  if (!parsed.success) return;
  const user = await prisma.user.findFirst({ where: { username: parsed.data.username } as any });
  const passwordHash: string | undefined = (user as any)?.passwordHash ?? undefined;
  if (!user || !passwordHash) return;
  const ok = await verifyPassword(parsed.data.password, passwordHash);
  if (!ok) return;
  await createSession(user.id);
  redirect("/today");
}

export default async function LoginPage() {
  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <Link className="absolute top-3 left-3" href="/"><Button variant="outline"><House /></Button></Link>
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">Anmelden</h1>
        <form action={doLogin} className="space-y-2">
          <Input name="username" placeholder="Username" />
          <Input name="password" type="password" placeholder="Passwort" />
          <Button type="submit">Login</Button>
        </form>
        <div className="text-sm">Noch kein Account? <Link className="underline" href="/register">Registrieren</Link></div>
      </section>
    </main>
  );
}


