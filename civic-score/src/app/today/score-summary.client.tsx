"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  days: { dateStr: string; score: number }[];
  todayStr: string;
  startScore?: number | null;
  abEnabled: boolean;
  abGroup?: "A" | "B" | null;
  beforeStart: boolean;
  afterEnd: boolean;
};

export default function ScoreSummary(props: Props) {
  const { days, todayStr, startScore, abEnabled, abGroup, beforeStart, afterEnd } = props;
  const [overrideToday, setOverrideToday] = useState<number | null>(null);

  useEffect(() => {
    function onPreview(e: any) {
      const val = e?.detail?.todayScore;
      if (typeof val === "number" && Number.isFinite(val)) {
        setOverrideToday(val);
      } else if (val === null) {
        setOverrideToday(null);
      }
    }
    window.addEventListener("civic:score-preview", onPreview as any);
    return () => window.removeEventListener("civic:score-preview", onPreview as any);
  }, []);

  const { todayScore, totalScore } = useMemo(() => {
    const baseToday = days.find((d) => d.dateStr === todayStr)?.score ?? 0;
    const todayScore = overrideToday !== null ? overrideToday : baseToday;
    const sumAllDays = days.reduce((sum, d) => {
      const v = d.dateStr === todayStr ? todayScore : d.score;
      return sum + (typeof v === "number" ? v : 0);
    }, 0);
    const initial = typeof startScore === "number" ? startScore : 0;
    // Gesamt Score = Startwert MINUS Summe aller Tages‑Scores
    const totalScore = initial + sumAllDays;
    return { todayScore, totalScore };
  }, [days, todayStr, overrideToday, startScore]);

  const canShow = !beforeStart && !afterEnd && (!abEnabled || abGroup === "A");
  if (!canShow) return null;

  function fmt(n: number) {
    return n >= 0 ? `+${n}` : String(n);
  }

  return (
    <div className="flex flex-row gap-1 w-full justify-items-center justify-between px-2">
      <div className="text-sm">Heutiger Score: {fmt(todayScore)}</div>
      <div className="text-sm">Start Score: {startScore ?? 0}</div>
      <div className="text-sm">Gesamt Score: {fmt(totalScore)}</div>
    </div>
  );
}

