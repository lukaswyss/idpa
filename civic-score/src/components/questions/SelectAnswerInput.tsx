import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Item = { id: string; label: string };

type SelectAnswerInputProps = {
  items: Item[];
  value: string;
  onChange: (value: string) => void;
};

export function SelectAnswerInput({ items, value, onChange }: SelectAnswerInputProps) {
  return (
    <Select
      value={String(value ?? "")}
      onValueChange={(v) => onChange(v)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Auswählen..." />
      </SelectTrigger>
      <SelectContent>
        {items.map((opt) => (
          <SelectItem key={String(opt.id)} value={String(opt.id)}>
            {String(opt.label ?? opt.id)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}


