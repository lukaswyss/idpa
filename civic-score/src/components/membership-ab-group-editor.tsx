"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AbGroupSelect } from "@/components/ab-group-select";

export function MembershipAbGroupEditor({ membershipId, defaultValue }: { membershipId: string; defaultValue?: "A" | "B" }) {
  const router = useRouter();

  const handleChange = useCallback(async (group: "A" | "B") => {
    try {
      const res = await fetch("/api/membership/ab-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: membershipId, group }),
      });
      if (!res.ok) {
        toast.error("Fehler beim Aktualisieren der Gruppe");
        router.refresh();
        return;
      }
      toast.success("A/B‑Gruppe aktualisiert");
      router.refresh();
    } catch {
      toast.error("Netzwerkfehler beim Aktualisieren");
      router.refresh();
    }
  }, [membershipId, router]);

  return (
    <AbGroupSelect name="group" defaultValue={defaultValue} onChange={handleChange} />
  );
}


