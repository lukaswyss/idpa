import React from "react";
import { Checkbox } from "@/components/ui/checkbox";

export type ActivityCheckboxProps = {
  label: string;
  weight: number;
  checked: boolean;
  hideWeights: boolean;
  onCheckedChange: (v: boolean | "indeterminate") => void;
};

export function ActivityCheckbox({ label, weight, checked, hideWeights, onCheckedChange }: ActivityCheckboxProps) {
  return (
    <label className="flex items-center gap-3">
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <span>
        {label}
        {!hideWeights && (
          <span className="text-xs opacity-60"> ({weight > 0 ? `+${weight}` : weight})</span>
        )}
      </span>
    </label>
  );
}


