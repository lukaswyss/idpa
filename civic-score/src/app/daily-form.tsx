"use client";

import { useEffect, useMemo, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
type Action = {
  id: string;
  code: string;
  label: string;
  category: string;
  weight: number;
};
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"
import { TextAnswerInput } from "@/components/questions/TextAnswerInput";
import { NumberAnswerInput } from "@/components/questions/NumberAnswerInput";
import { BooleanAnswerInput } from "@/components/questions/BooleanAnswerInput";
import { SelectAnswerInput } from "@/components/questions/SelectAnswerInput";
import { StarsAnswerInput } from "@/components/questions/StarsAnswerInput";
import { ActivityCheckbox } from "@/components/activity-checkbox";



const Schema = z.object({
  selected: z.array(z.string()),
  answers: z.record(z.string(), z.any()).optional(),
});
type FormData = z.infer<typeof Schema>;

type Question = { id: string; label: string; type: "text" | "boolean" | "radio" | "number" | "select" | "stars"; items?: { id: string; label: string }[]; stars?: number; weight?: number };

export function DailyForm({ actions, challengeCode, initialSelected, questions, definedQuestions, initialAnswers, abMode, abGroup, preQuestions, postQuestions, showOnlyPre }: { actions: Action[]; challengeCode?: string; initialSelected?: string[]; questions?: Question[]; definedQuestions?: Question[]; dailyQuestions?: Question[]; initialAnswers?: Record<string, unknown>; abMode?: boolean; abGroup?: "A" | "B"; preQuestions?: Question[]; postQuestions?: Question[]; showOnlyPre?: boolean }) {
  const groups = actions.reduce<Record<string, Action[]>>((acc, a) => {
    (acc[a.category] ||= []).push(a);
    return acc;
  }, {});
  const form = useForm<FormData>({ resolver: zodResolver(Schema), defaultValues: { selected: initialSelected ?? [], answers: initialAnswers ?? {} } });
  const [pending, start] = useTransition();
  const firstRef = useRef<Date | null>(null);
  const lastRef = useRef<Date | null>(null);
  const router = useRouter();

  console.log("definedQuestions", definedQuestions);
  console.log("preQuestions", preQuestions);
  console.log("postQuestions", postQuestions);

  // Build quick lookup for question weights
  const weightByQuestionId = useMemo(() => {
    const out: Record<string, number> = {};
    const all: Question[] = [
      ...(questions || []),
      ...(definedQuestions || []),
      ...(preQuestions || []),
      ...(postQuestions || []),
    ];
    for (const q of all) {
      if (q && typeof q.weight === "number" && Number.isFinite(q.weight)) {
        out[q.id] = q.weight;
      }
    }
    return out;
  }, [questions, definedQuestions, preQuestions, postQuestions]);

  function markActivity() {
    const now = new Date();
    if (!firstRef.current) firstRef.current = now;
    lastRef.current = now;
  }

  async function submit(data: FormData) {
    const submittedAt = new Date();
    const first = firstRef.current ?? null;
    const last = lastRef.current ?? null;
    const durationMs = first && last ? Math.max(0, last.getTime() - first.getTime()) : undefined;
    const res = await fetch("/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        challengeCode,
        firstAnswerAt: first ? first.toISOString() : undefined,
        lastAnswerAt: last ? last.toISOString() : undefined,
        submittedAt: submittedAt.toISOString(),
        durationMs,
      }),
    });
    if (res.ok) {
      toast.success("Gespeichert", { description: "Tages-Score aktualisiert." });
      // Refresh server data so pre-quiz gating/daily questions update immediately
      router.refresh();
    }
    else toast.error("Fehler", { description: "Konnte nicht speichern." });
  }

  const hideWeights = Boolean(abMode && abGroup === "B");

  // Live score preview: emit event on changes
  useEffect(() => {
    const subscription = form.watch((values) => {
      try {
        const selected = Array.isArray(values.selected) ? values.selected as string[] : [];
        const answers = (values.answers || {}) as Record<string, unknown>;
        const fromActions = actions.reduce((sum, a) => sum + (selected.includes(a.id) ? a.weight : 0), 0);
        let fromAnswers = 0;
        for (const [qid, val] of Object.entries(answers)) {
          const w = weightByQuestionId[qid];
          if (typeof w !== "number" || !Number.isFinite(w) || w === 0) continue;
          if (typeof val === "boolean") {
            if (val) fromAnswers += w;
          } else if (typeof val === "number" && Number.isFinite(val)) {
            fromAnswers += Math.round(val * w);
          }
        }
        const total = fromActions + fromAnswers;
        window.dispatchEvent(new CustomEvent("civic:score-preview", { detail: { todayScore: total } }));
      } catch {
        // ignore
      }
    });
    // initial emit
    try {
      const initVals = form.getValues();
      const selected = Array.isArray(initVals.selected) ? initVals.selected as string[] : [];
      const answers = (initVals.answers || {}) as Record<string, unknown>;
      const fromActions = actions.reduce((sum, a) => sum + (selected.includes(a.id) ? a.weight : 0), 0);
      let fromAnswers = 0;
      for (const [qid, val] of Object.entries(answers)) {
        const w = weightByQuestionId[qid];
        if (typeof w !== "number" || !Number.isFinite(w) || w === 0) continue;
        if (typeof val === "boolean") {
          if (val) fromAnswers += w;
        } else if (typeof val === "number" && Number.isFinite(val)) {
          fromAnswers += Math.round(val * w);
        }
      }
      const total = fromActions + fromAnswers;
      window.dispatchEvent(new CustomEvent("civic:score-preview", { detail: { todayScore: total } }));
    } catch { }

    return () => {
      subscription.unsubscribe();
      // reset preview override when unmounting
      window.dispatchEvent(new CustomEvent("civic:score-preview", { detail: { todayScore: null } }));
    };
  }, [form, actions, weightByQuestionId]);
  function renderQuestions(title: string, list?: Question[]) {
    if (!list || list.length === 0) return null;
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="font-medium">{title}</div>
          {list.map((q) => (
            <div key={q.id} className="space-y-1">
              {q.type !== "boolean" ? (
                <div className="text-sm">{q.label}  {abGroup === "A" ? q.weight && q.weight > 0 ? `+${q.weight}` : q.weight : ""}</div>
              ) : (
                null
              )}
              {q.type === "text" && (
                <TextAnswerInput
                  value={(form.watch("answers")?.[q.id] as any) ?? ""}
                  onChange={(v) => { markActivity(); form.setValue("answers", { ...(form.getValues("answers") || {}), [q.id]: v }); }}
                />
              )}
              {q.type === "number" && (
                <NumberAnswerInput
                  value={(form.watch("answers")?.[q.id] as any) ?? ""}
                  onChange={(v) => { markActivity(); form.setValue("answers", { ...(form.getValues("answers") || {}), [q.id]: v }); }}
                />
              )}
              {q.type === "radio" && (
                <BooleanAnswerInput
                  name={`bool-${q.id}`}
                  value={form.watch("answers")?.[q.id] as any}
                  onChange={(v) => { markActivity(); form.setValue("answers", { ...(form.getValues("answers") || {}), [q.id]: v }); }}
                />
              )}
              {q.type === "boolean" && (
                <ActivityCheckbox
                  key={q.id}
                  label={q.label}
                  weight={q.weight ?? 0}
                  hideWeights={hideWeights}
                  checked={(form.watch("answers")?.[q.id] as any) === true}
                  onCheckedChange={(v) => {
                    markActivity();
                    const next = v === true;
                    form.setValue("answers", { ...(form.getValues("answers") || {}), [q.id]: next });
                  }}
                />
              )}
              {q.type === "select" && Array.isArray((q as any).items) && (
                <SelectAnswerInput
                  items={(q as any).items}
                  value={String((form.watch("answers")?.[q.id] as any) ?? "")}
                  onChange={(v) => { markActivity(); form.setValue("answers", { ...(form.getValues("answers") || {}), [q.id]: v }); }}
                />
              )}
              {q.type === "stars" && (
                <StarsAnswerInput
                  stars={(q as any).stars}
                  value={Number((form.watch("answers") as any)?.[q.id]) || 0}
                  onChange={(v) => { markActivity(); form.setValue("answers", { ...(form.getValues("answers") || {}), [q.id]: v }); }}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  return (
    <form
      onSubmit={form.handleSubmit((d) => start(() => submit(d)))}
      className="space-y-6"
    >

      {preQuestions && preQuestions.length > 0 && renderQuestions("Pre‑Quiz", preQuestions)}

      {groups && Object.keys(groups).length > 0 &&
        !showOnlyPre && Object.entries(groups).map(([cat, list]) => {
          const positives = list.filter((a) => a.weight >= 0);
          const negatives = list.filter((a) => a.weight < 0);
          return (
            <Card key={cat}>
              <CardContent className="p-4 space-y-3">
                <div className="font-medium">{cat}</div>

                {positives.length > 0 && (
                  <>
                    <div className="text-sm opacity-70">Positiv</div>
                    {positives.map((a) => (
                      <ActivityCheckbox
                        key={a.id}
                        label={a.label}
                        weight={a.weight}
                        hideWeights={hideWeights}
                        checked={form.watch("selected").includes(a.id)}
                        onCheckedChange={(v) => {
                          markActivity();
                          const arr = new Set(form.getValues("selected"));
                          if (v === true) {
                            arr.add(a.id);
                          } else if (v === false) {
                            arr.delete(a.id);
                          }
                          form.setValue("selected", Array.from(arr));
                        }}
                      />
                    ))}
                  </>
                )}

                {negatives.length > 0 && (
                  <>
                    <div className="text-sm opacity-70">Negativ</div>
                    {negatives.map((a) => (
                      <ActivityCheckbox
                        key={a.id}
                        label={a.label}
                        weight={a.weight}
                        hideWeights={hideWeights}
                        checked={form.watch("selected").includes(a.id)}
                        onCheckedChange={(v) => {
                          markActivity();
                          const arr = new Set(form.getValues("selected"));
                          if (v === true) {
                            arr.add(a.id);
                          } else if (v === false) {
                            arr.delete(a.id);
                          }
                          form.setValue("selected", Array.from(arr));
                        }}
                      />
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })
      }
      {!showOnlyPre && definedQuestions && definedQuestions.length > 0 && renderQuestions("Wöchentliche Fragen", definedQuestions)}


      {!showOnlyPre && postQuestions && postQuestions.length > 0 && renderQuestions("Post‑Quiz", postQuestions)}

      <Button type="submit" disabled={pending}>Speichern</Button>
    </form>
  );
}
