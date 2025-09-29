"use client";

import { useTransition } from "react";
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

const Schema = z.object({
  selected: z.array(z.string()),
  note: z.string().optional(),
  answers: z.record(z.any()).optional(),
});
type FormData = z.infer<typeof Schema>;

export function DailyForm({ actions, challengeCode, initialSelected, initialNote, questions, initialAnswers }: { actions: Action[]; challengeCode?: string; initialSelected?: string[]; initialNote?: string; questions?: { id: string; label: string; type: "text" | "boolean" | "number" }[]; initialAnswers?: Record<string, unknown> }) {
  const groups = actions.reduce<Record<string, Action[]>>((acc, a) => {
    (acc[a.category] ||= []).push(a);
    return acc;
  }, {});
  const form = useForm<FormData>({ resolver: zodResolver(Schema), defaultValues: { selected: initialSelected ?? [], note: initialNote ?? "", answers: initialAnswers ?? {} }});
  const [pending, start] = useTransition();

  async function submit(data: FormData) {
    const res = await fetch("/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, challengeCode }),
    });
    if (res.ok) toast.success("Gespeichert", { description: "Tages-Score aktualisiert." });
    else toast.error("Fehler", { description: "Konnte nicht speichern." });
  }

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
                    const arr = new Set(form.getValues("selected"));
                    if (v === true) {
                      arr.add(a.id);
                    } else if (v === false) {
                      arr.delete(a.id);
                    }
                    form.setValue("selected", Array.from(arr));
                  }}
                />
                <span>{a.label} <span className="text-xs opacity-60">({a.weight>0?`+${a.weight}`:a.weight})</span></span>
              </label>
            ))}
          </CardContent>
        </Card>
      ))}

      {questions && questions.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="font-medium">Zusatzfragen</div>
            {questions.map((q) => (
              <div key={q.id} className="space-y-1">
                <div className="text-sm">{q.label}</div>
                {q.type === "text" && (
                  <input className="border rounded px-2 py-1 w-full" value={(form.watch("answers")?.[q.id] as any) ?? ""} onChange={(e)=> form.setValue("answers", { ...(form.getValues("answers")||{}), [q.id]: e.target.value })} />
                )}
                {q.type === "number" && (
                  <input type="number" className="border rounded px-2 py-1 w-full" value={(form.watch("answers")?.[q.id] as any) ?? ""} onChange={(e)=> form.setValue("answers", { ...(form.getValues("answers")||{}), [q.id]: e.target.value ? Number(e.target.value) : undefined })} />
                )}
                {q.type === "boolean" && (
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={Boolean(form.watch("answers")?.[q.id])} onChange={(e)=> form.setValue("answers", { ...(form.getValues("answers")||{}), [q.id]: e.target.checked })} />
                    <span className="text-sm">Ja</span>
                  </label>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <div className="text-sm font-medium">Notiz (optional)</div>
        <Textarea {...form.register("note")} placeholder="Kontext, falls nötig…" />
      </div>

      <Button type="submit" disabled={pending}>Speichern</Button>
    </form>
  );
}
