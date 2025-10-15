"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DateInput } from "@/components/date-input";
import { AbGroupSelect } from "@/components/ab-group-select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

function buildQueryString(base: URLSearchParams, updates: Record<string, string | null | undefined>) {
  const next = new URLSearchParams(base.toString());
  for (const [k, v] of Object.entries(updates)) {
    if (v === null || v === undefined || v === "") next.delete(k);
    else next.set(k, v);
  }
  return next.toString();
}

export function DevModeControls({ isAdmin, abGroup }: { isAdmin: boolean, abGroup: "A" | "B" | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const devEnabled = useMemo(() => isAdmin && (params.get("dev") === "1" || params.get("dev") === "true"), [isAdmin, params]);
  const day = params.get("day") ?? "";
  const ab = (params.get("ab") as "A" | "B" | null) ?? null;

  if (!isAdmin) return null;

  return (
    <div className={`rounded border p-3 text-sm flex flex-col gap-2 ${devEnabled ? "bg-red-600/40" : "bg-amber-600/40"}`}>
      <div className="flex items-center justify-between">
        <div className="font-medium">Dev‑Mode | Gruppe des Users {abGroup ?? "keine"}</div>
        <div className="flex items-center gap-2">
          <span>{devEnabled ? "aktiviert" : "deaktiviert"}</span>
          <Switch
            checked={devEnabled}
            onCheckedChange={(checked) => {
              const q = buildQueryString(params, { dev: checked ? "1" : null });
              router.push(`${pathname}?${q}`);
            }}
          />
        </div>
      </div>
      {devEnabled && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-48">
            <DateInput
              value={day}
              onChange={(v) => {
                const q = buildQueryString(params, { day: v || null });
                router.push(`${pathname}?${q}`);
              }}
            />
          </div>
          <AbGroupSelect
            name="ab"
            defaultValue={abGroup ?? undefined}
            onChange={(v) => {
              const q = buildQueryString(params, { ab: v });
              router.push(`${pathname}?${q}`);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const q = buildQueryString(params, { dev: null, day: null, ab: null });
              router.push(`${pathname}?${q}`);
            }}
          >
            Zurücksetzen
          </Button>
        </div>
      )}
    </div>
  );
}


