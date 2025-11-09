"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/date-input";
import { TrashIcon, PlusIcon } from "lucide-react";
import { format } from "date-fns";
import { Spinner } from "@/components/spinner";

export function DefinedDaysEditor({
  challengeId,
  definedDays,
  minDate,
  maxDate,
}: {
  challengeId: string;
  definedDays: string[];
  minDate: string; // yyyy-MM-dd
  maxDate: string; // yyyy-MM-dd
}) {
  const router = useRouter();
  const [pendingDay, setPendingDay] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function addDay() {
    if (!pendingDay) return;
    const res = await fetch("/api/challenge/defined-day", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: challengeId, date: pendingDay }),
    });
    if (res.ok) {
      startTransition(() => router.refresh());
      setPendingDay("");
    }
  }

  async function removeDay(day: string) {
    setDeleting(day);
    const res = await fetch("/api/challenge/defined-day", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: challengeId, date: day }),
    });
    setDeleting(null);
    if (res.ok) {
      startTransition(() => router.refresh());
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm">Aktuelle Tage:</div>
      <ul className="text-sm flex flex-wrap gap-2">
        {definedDays.length === 0 && <li className="px-2 py-1 rounded border">Keine Tage definiert</li>}
        {definedDays.map((dayKey) => {
          const [y, m, d] = dayKey.split("-").map((v) => Number(v));
          const dt = new Date(y, (m || 1) - 1, d || 1);
          return (
            <li key={dayKey} className="px-2 py-1 rounded border group hover:bg-accent/40 inline-flex items-center gap-2">
              <span>{format(dt, "dd.MM.yyyy")}</span>
              <div className="hidden group-hover:block">
                <Button
                  variant="destructive"
                  size="sm"
                  type="button"
                  className="h-5"
                  onClick={() => removeDay(dayKey)}
                  disabled={deleting === dayKey || isPending}
                  aria-label={`Tag ${format(dt, "dd.MM.yyyy")} entfernen`}
                >
                    {deleting === dayKey ? <Spinner className="size-3" /> : null}
                    {deleting !== dayKey ? <TrashIcon className="size-3" /> : null} 
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="grid gap-2 grid-cols-2 items-end">
        <label>Datum innerhalb der Challenge</label>
        <div />
        <DateInput
          name=""
          min={minDate}
          max={maxDate}
          value={pendingDay}
          onChange={(v) => setPendingDay(v)}
        />
        <Button type="button" onClick={addDay} disabled={!pendingDay || isPending}>
          <PlusIcon className="mr-2 size-4" />
          Hinzufügen
        </Button>
      </div>
    </div>
  );
}


