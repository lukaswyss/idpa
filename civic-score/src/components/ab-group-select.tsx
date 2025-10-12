"use client"

import { useEffect, useId, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AbGroupSelect({ name, defaultValue, onChange }: { name: string; defaultValue?: "A" | "B"; onChange?: (v: "A" | "B") => void }) {
  const [value, setValue] = useState<string | undefined>(defaultValue ?? undefined);
  const inputId = useId();

  useEffect(() => {
    // Ensure defaultValue is applied on first render if provided
    if (!value && defaultValue) setValue(defaultValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="inline-flex items-center gap-2">
      <input id={inputId} type="hidden" name={name} value={value ?? ""} />
      <Select
        value={value}
        onValueChange={(v) => {
          setValue(v);
          if (onChange && (v === "A" || v === "B")) onChange(v);
        }}
      >
        <SelectTrigger size="sm" aria-labelledby={inputId}>
          <SelectValue placeholder="Gruppe wählen" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="A">A</SelectItem>
          <SelectItem value="B">B</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}



