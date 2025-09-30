"use client";

import { useState, useCallback } from "react";
import { generateAnonymousUsername } from "@/lib/username";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { Tooltip, TooltipContent } from "@/components/ui/tooltip";
import { TooltipTrigger } from "@/components/ui/tooltip";

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
      } catch { }
      setCurrent(generateAnonymousUsername());
    });
  }, []);
  return (
    <div className="space-y-1 flex items-center gap-2">
      <input type="hidden" name={name} value={current} readOnly />
      <div className="text-sm">Vorgeschlagener Username: <strong>{current}</strong></div>
      
    <Tooltip>
      <TooltipTrigger asChild>
      <Button variant="secondary" onClick={onRotate} disabled={isPending} size="icon" className="size-8">
        <RotateCcw className={isPending ? "animate-spin-reverse" : ""} />
      </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Neuen Username generieren</p>
      </TooltipContent>
    </Tooltip>

    </div>
  );
}


