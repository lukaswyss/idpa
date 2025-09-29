"use client";

import { useState, useCallback } from "react";
import { generateAnonymousUsername } from "@/lib/username";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";

export function UsernameSuggestion({ name, initial }: { name: string; initial: string }) {
  const [current, setCurrent] = useState<string>(initial);
  const [isPending, startTransition] = useTransition();
  const onRotate = useCallback(() => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/username/suggest", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data?.username) {
            setCurrent(data.username);
            return;
          }
        }
      } catch {}
      setCurrent(generateAnonymousUsername());
    });
  }, []);
  return (
    <div className="space-y-1">
      <input type="hidden" name={name} value={current} readOnly />
      <div className="text-sm">Vorgeschlagener Username: <strong>{current}</strong></div>
      <Button variant="link" className="text-sm p-0 h-auto" type="button" onClick={onRotate} disabled={isPending}>Neuen Username generieren</Button>
    </div>
  );
}


