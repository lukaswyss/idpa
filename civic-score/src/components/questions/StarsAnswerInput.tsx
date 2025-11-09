import React from "react";
import { Rating, RatingButton } from "@/components/ui/shadcn-io/rating";

type StarsAnswerInputProps = {
  stars?: number;
  value: number;
  onChange: (value: number) => void;
};

export function StarsAnswerInput({ stars = 5, value, onChange }: StarsAnswerInputProps) {
  const count = typeof stars === "number" ? stars : 5;
  return (
    <div className="py-1">
      <Rating value={Number(value) || 0} onValueChange={(v) => onChange(v)}>
        {Array.from({ length: count }).map((_, index) => (
          <RatingButton key={index} />
        ))}
      </Rating>
    </div>
  );
}


