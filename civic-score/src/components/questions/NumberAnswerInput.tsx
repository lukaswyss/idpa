import React from "react";

type NumberAnswerInputProps = {
  value: number | undefined | "";
  onChange: (value: number | undefined) => void;
};

export function NumberAnswerInput({ value, onChange }: NumberAnswerInputProps) {
  return (
    <input
      type="number"
      className="border rounded px-2 py-1 w-full"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
    />
  );
}


