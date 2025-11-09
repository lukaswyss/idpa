import React from "react";

type BooleanAnswerInputProps = {
  name: string;
  value: boolean | undefined;
  onChange: (value: boolean) => void;
};

export function BooleanAnswerInput({ name, value, onChange }: BooleanAnswerInputProps) {
  return (
    <div className="flex items-center gap-4">
      <label className="flex items-center gap-2">
        <input
          type="radio"
          name={name}
          checked={Boolean(value) === true}
          onChange={() => onChange(true)}
        />
        <span className="text-sm">Ja</span>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="radio"
          name={name}
          checked={value === false}
          onChange={() => onChange(false)}
        />
        <span className="text-sm">Nein</span>
      </label>
    </div>
  );
}


