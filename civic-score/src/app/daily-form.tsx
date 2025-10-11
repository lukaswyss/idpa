"use client";

import { useRef, useTransition } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner"
import { Rating, RatingButton } from "@/components/ui/shadcn-io/rating";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Schema = z.object({
  selected: z.array(z.string()),
  note: z.string().optional(),
  answers: z.record(z.string(), z.any()).optional(),
});
type FormData = z.infer<typeof Schema>;

export function DailyForm({ actions, challengeCode, initialSelected, initialNote, questions, initialAnswers, abMode, abGroup }: { actions: Action[]; challengeCode?: string; initialSelected?: string[]; initialNote?: string; questions?: { id: string; label: string; type: "text" | "boolean" | "number" | "select" | "stars"; items?: { id: string; label: string }[]; stars?: number }[]; initialAnswers?: Record<string, unknown>; abMode?: boolean; abGroup?: "A" | "B" }) {
  const groups = actions.reduce<Record<string, Action[]>>((acc, a) => {
    (acc[a.category] ||= []).push(a);
    return acc;
  }, {});
  const form = useForm<FormData>({ resolver: zodResolver(Schema), defaultValues: { selected: initialSelected ?? [], note: initialNote ?? "", answers: initialAnswers ?? {} }});
  const [pending, start] = useTransition();
  const firstRef = useRef<Date | null>(null);
  const lastRef = useRef<Date | null>(null);

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
    if (res.ok) toast.success("Gespeichert", { description: "Tages-Score aktualisiert." });
    else toast.error("Fehler", { description: "Konnte nicht speichern." });
  }

  const hideWeights = Boolean(abMode && abGroup === "B");
  return (
    <form
      onSubmit={form.handleSubmit((d)=> start(()=> submit(d)))}
      className="space-y-6"
    >
      {Object.entries(groups).map(([cat, list]) => (
        <Card key={cat}>
          <CardContent className="p-4 space-y-3">
            <div className="font-medium">{cat}</div>
            {list.map(a => (
              <label key={a.id} className="flex items-center gap-3">
                <Checkbox
                  checked={form.watch("selected").includes(a.id)}
                  onCheckedChange={(v)=> {
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
                <span>
                  {a.label}
                  {!hideWeights && (
                    <span className="text-xs opacity-60"> ({a.weight>0?`+${a.weight}`:a.weight})</span>
                  )}
                </span>
              </label>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="font-medium">Tagesbewertung</div>
          <Rating
            value={Number((form.watch("answers") as any)?.rating) || 0}
            onValueChange={(v)=> { markActivity(); form.setValue("answers", { ...(form.getValues("answers")||{}), rating: v }); }}
          >
            {Array.from({ length: 5 }).map((_, index) => (
              <RatingButton key={index} />
            ))}
          </Rating>
        </CardContent>
      </Card>

      {questions && questions.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="font-medium">Zusatzfragen</div>
            {questions.map((q) => (
              <div key={q.id} className="space-y-1">
                <div className="text-sm">{q.label}</div>
                {q.type === "text" && (
                  <input className="border rounded px-2 py-1 w-full" value={(form.watch("answers")?.[q.id] as any) ?? ""} onChange={(e)=> { markActivity(); form.setValue("answers", { ...(form.getValues("answers")||{}), [q.id]: e.target.value }); }} />
                )}
                {q.type === "number" && (
                  <input type="number" className="border rounded px-2 py-1 w-full" value={(form.watch("answers")?.[q.id] as any) ?? ""} onChange={(e)=> { markActivity(); form.setValue("answers", { ...(form.getValues("answers")||{}), [q.id]: e.target.value ? Number(e.target.value) : undefined }); }} />
                )}
                {q.type === "boolean" && (
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={Boolean(form.watch("answers")?.[q.id])} onChange={(e)=> { markActivity(); form.setValue("answers", { ...(form.getValues("answers")||{}), [q.id]: e.target.checked }); }} />
                    <span className="text-sm">Ja</span>
                  </label>
                )}
                {q.type === "select" && Array.isArray((q as any).items) && (
                  <Select
                    value={String((form.watch("answers")?.[q.id] as any) ?? "")}
                    onValueChange={(v)=> { markActivity(); form.setValue("answers", { ...(form.getValues("answers")||{}), [q.id]: v }); }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(q as any).items.map((opt: any) => (
                        <SelectItem key={String(opt.id)} value={String(opt.id)}>{String(opt.label ?? opt.id)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {q.type === "stars" && (
                  <div className="py-1">
                    <Rating
                      value={Number((form.watch("answers") as any)?.[q.id]) || 0}
                      onValueChange={(v)=> { markActivity(); form.setValue("answers", { ...(form.getValues("answers")||{}), [q.id]: v }); }}
                    >
                      {Array.from({ length: typeof (q as any).stars === "number" ? (q as any).stars : 5 }).map((_, index) => (
                        <RatingButton key={index} />
                      ))}
                    </Rating>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <div className="text-sm font-medium">Notiz (optional)</div>
        <Textarea {...form.register("note", { onChange: ()=> markActivity() })} placeholder="Kontext, falls nötig…" />
      </div>

      <Button type="submit" disabled={pending}>Speichern</Button>
    </form>
  );
}
