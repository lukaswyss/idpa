import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LoginRequired({
  title = "Kein Zugriff",
  message = "Bitte anmelden, um fortzufahren.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <section className="max-w-md space-y-3">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm opacity-70">{message}</p>
        <Button asChild>
          <Link href="/login">Anmelden</Link>
        </Button>
      </section>
    </main>
  );
}


