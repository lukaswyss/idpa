"use client";

import { useEffect, useMemo, useState } from "react";
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

export function DateInput({ name, value, defaultValue, min, max, placeholder, onChange }: { name?: string; value?: string; defaultValue?: string; min?: string; max?: string; placeholder?: string; onChange?: (value: string) => void }) {
  const defaultDate = useMemo(() => parseIsoDateOnly(defaultValue) ?? undefined, [defaultValue]);
  const controlledDate = useMemo(() => parseIsoDateOnly(value), [value]);
  const [internalDate, setInternalDate] = useState<Date | undefined>(controlledDate ?? defaultDate ?? undefined);
  const minDate = useMemo(() => parseIsoDateOnly(min), [min]);
  const maxDate = useMemo(() => parseIsoDateOnly(max), [max]);

  // Keep internal state in sync when used as a controlled component
  useEffect(() => {
    if (controlledDate) {
      setInternalDate(controlledDate);
    } else if (value === "" || value === undefined) {
      setInternalDate(undefined);
    }
  }, [controlledDate, value]);

  const formattedHidden = internalDate ? format(internalDate, "yyyy-MM-dd") : "";
  const formattedLabel = internalDate ? format(internalDate, "dd.MM.yyyy") : (placeholder ?? "Datum wählen");

  return (
    <div className="col-span-1">
      {name ? <input type="hidden" name={name} value={formattedHidden} /> : null}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" type="button" className="w-full justify-start">
            {formattedLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={internalDate}
            onSelect={(d)=> {
              const next = d ?? internalDate;
              setInternalDate(next ?? undefined);
              if (onChange) {
                onChange(next ? format(next, "yyyy-MM-dd") : "");
              }
            }}
            disabled={(d)=> (minDate ? d < minDate : false) || (maxDate ? d > maxDate : false)}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}


