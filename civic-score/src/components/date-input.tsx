"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

function parseIsoDateOnly(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = String(value).split("-").map((p) => parseInt(p, 10));
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

export function DateInput({ name, defaultValue, min, max, placeholder }: { name: string; defaultValue?: string; min?: string; max?: string; placeholder?: string }) {
  const defaultDate = useMemo(() => parseIsoDateOnly(defaultValue) ?? new Date(), [defaultValue]);
  const [value, setValue] = useState<Date | undefined>(defaultDate);
  const minDate = useMemo(() => parseIsoDateOnly(min), [min]);
  const maxDate = useMemo(() => parseIsoDateOnly(max), [max]);

  return (
    <div className="col-span-1">
      <input type="hidden" name={name} value={value ? format(value, "yyyy-MM-dd") : ""} />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" type="button" className="w-full justify-start">
            {value ? format(value, "dd.MM.yyyy") : (placeholder ?? "Datum wählen")}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d)=> setValue(d ?? value)}
            disabled={(d)=> (minDate ? d < minDate : false) || (maxDate ? d > maxDate : false)}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}


