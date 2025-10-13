"use client";

import { useActionState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Action = (prevState: any, formData: FormData) => Promise<any>;

export default function JoinForm({ action }: { action: Action }) {
  const [state, formAction] = useActionState(action, null);
  const router = useRouter();

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Beigetreten", { description: "Du bist der Challenge beigetreten." });
      router.refresh();
    } else if (state.error === "not_found") {
      toast.error("Nicht gefunden", { description: state.message ?? "Kein Challenge mit diesem Code." });
    } else if (state.error) {
      toast.error("Fehler", { description: state.message ?? String(state.error) });
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-3">
      <Input name="code" placeholder="Code eingeben" />
      <Button type="submit" className="w-full">Beitreten</Button>
    </form>
  );
}


