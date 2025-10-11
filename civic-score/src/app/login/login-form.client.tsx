"use client";

import { useActionState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Action = (prevState: any, formData: FormData) => Promise<any>;

export default function LoginForm({ action }: { action: Action }) {
  const [state, formAction] = useActionState(action, null);

  useEffect(() => {
    if (state && state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-2">
      <Input name="username" placeholder="Username" />
      <Input name="password" type="password" placeholder="Passwort" />
      <Button type="submit">Login</Button>
    </form>
  );
}


