import { prisma } from "@/lib/db";
import { createSession, verifyPassword, getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { House } from "lucide-react";
import LoginForm from "@/app/login/login-form.client";

export async function doLogin(_: any, formData: FormData) {
  "use server";
  const Schema = z.object({ username: z.string().min(3), password: z.string().min(3) });
  const parsed = Schema.safeParse({ username: formData.get("username"), password: formData.get("password") });
  if (!parsed.success) return { error: "Login fehlgeschlagen" };
  const user = await prisma.user.findFirst({ where: { username: parsed.data.username } as any });
  const passwordHash: string | undefined = (user as any)?.passwordHash ?? undefined;
  if (!user || !passwordHash) return { error: "Login fehlgeschlagen" };
  const ok = await verifyPassword(parsed.data.password, passwordHash);
  if (!ok) return { error: "Login fehlgeschlagen" };
  try {
    await prisma.user.update({ where: { id: user.id }, data: { loginCount: { increment: 1 } } });
  } catch {}
  await createSession(user.id);
  redirect("/today?login=1");
}

export default async function LoginPage() {
  const session = await getSessionUser();
  if (session) {
    redirect("/today");
  }
  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <Link className="absolute top-3 left-3" href="/"><Button variant="outline"><House /></Button></Link>
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">Anmelden</h1>
        <LoginForm action={doLogin} />
        <div className="text-sm flex items-center flex-col md:flex-row md:justify-between md:pt-0 pt-6 gap-2">
          <span>Noch kein Account? <Link className="underline" href="/register">Registrieren</Link></span>
          <Link className="underline" href="/reset">Passwort vergessen?</Link>
        </div>
      </section>
    </main>
  );
}


