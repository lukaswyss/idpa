"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";

type Item = {
  id: string;
  code: string;
  title: string;
  openToday: boolean;
  selected: boolean;
};

export function ChallengeSwitcher({ items }: { items: Item[] }) {
  const router = useRouter();
  const [curr, setCurr] = useState<string | null>(() => items.find(i => i.selected)?.code ?? (items[0]?.code ?? null));
  useEffect(() => {
    setCurr(items.find(i => i.selected)?.code ?? (items[0]?.code ?? null));
  }, [items.map(i => `${i.code}:${i.selected}`).join("|")]);

  const selected = useMemo(() => items.find(i => i.code === curr) ?? items[0], [curr, items]);

  async function select(code: string) {
    setCurr(code);
    try {
      await fetch("/api/challenge/select", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
      // Optimistic refresh: request server data refresh to reflect selection immediately
      try {
        router.refresh();
      } catch {
        if (typeof window !== "undefined") window.location.reload();
      }
    } catch {}
  }

  return (
    <Select value={curr || undefined} onValueChange={select}>
      <SelectTrigger size="sm" aria-label="Challenge wechseln">
        <SelectValue placeholder="Challenge" />
      </SelectTrigger>
        <SelectContent align="end" className="min-w-[14rem]">   
        {items.map((i) => (
          <SelectItem key={i.id} value={i.code} className="justify-between">
            <span className={cn("truncate max-w-[11rem]", i.selected && "font-medium")}><span className="font-bold">Challange:</span> ({i.title})</span>
            {i.openToday && <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}



