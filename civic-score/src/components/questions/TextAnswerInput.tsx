import React from "react";

type TextAnswerInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function TextAnswerInput({ value, onChange }: TextAnswerInputProps) {
  return (
    <input
      className="border rounded px-2 py-1 w-full"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}


