"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { CreateChallengeForm } from "@/components/create-challenge-form";

type CreateChallengeAction = (formData: FormData) => Promise<{ ok: boolean; id?: string; code?: string; title?: string; error?: string }>;

export function CreateChallengeDialog({ action }: { action: CreateChallengeAction }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center justify-between">
        <DialogTrigger asChild>
          <Button onClick={() => setOpen(true)}><PlusIcon />Neue Challenge</Button>
        </DialogTrigger>
      </div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Challenge</DialogTitle>
        </DialogHeader>
        <CreateChallengeForm action={action} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}


