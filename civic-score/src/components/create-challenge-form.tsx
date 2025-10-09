"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/date-input";
import { getDefaultChallengeConfig } from "@/lib/challenge-templates";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";

const CreateChallengeSchema = z.object({
  title: z.string().min(3, "Mindestens 3 Zeichen"),
  start: z.string().min(1, "Startdatum ist erforderlich"),
  end: z.string().min(1, "Enddatum ist erforderlich"),
  description: z.string().optional(),
  startScore: z.coerce.number().int().min(0).default(0),
  config: z.string().optional(),
  abEnabled: z.boolean().default(false),
});

type CreateChallengeValues = z.input<typeof CreateChallengeSchema>;

export function CreateChallengeForm({ action, onSuccess }: { action: (formData: FormData) => Promise<{ ok: boolean; id?: string; code?: string; title?: string; error?: string }>; onSuccess?: (result: { ok: boolean; id?: string; code?: string; title?: string; error?: string }) => void }) {
  const todayDefault = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const form = useForm<CreateChallengeValues>({
    resolver: zodResolver(CreateChallengeSchema),
    defaultValues: {
      title: "",
      start: todayDefault,
      end: "",
      description: "",
      startScore: 0,
      config: "",
      abEnabled: false,
    },
    mode: "onBlur",
  });

  async function onSubmit(values: CreateChallengeValues) {
    const fd = new FormData();
    fd.set("title", values.title);
    fd.set("start", values.start);
    fd.set("end", values.end);
    if (values.description) fd.set("description", values.description);
    const startScoreNum = Number((values as any).startScore ?? 0);
    fd.set("startScore", String(Number.isFinite(startScoreNum) ? startScoreNum : 0));
    if (values.config) fd.set("config", values.config);
    fd.set("abEnabled", values.abEnabled ? "true" : "false");
    const res = await action(fd);
    if (typeof window !== "undefined") {
      const { toast } = await import("sonner");
      if (res?.ok) {
        toast.success(`Challenge erstellt: ${res.title} (${res.code})`);
        onSuccess?.(res);
      } else {
        toast.error(res?.error || "Erstellen fehlgeschlagen");
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-2 grid-cols-2 items-end">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Titel*</FormLabel>
              <FormControl>
                <Input placeholder="Titel" {...field} />
              </FormControl>
              <FormDescription>Zugangscode wird automatisch generiert.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="abEnabled"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <div className="flex items-center gap-3">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={(checked)=> field.onChange(Boolean(checked))} />
                </FormControl>
                <FormLabel className="!mt-0">A/B‑Testing aktivieren</FormLabel>
              </div>
              <FormDescription>Wenn aktiviert, werden neue Teilnehmer zufällig in Gruppe A oder B eingeteilt.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startScore"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Startscore*</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  name={field.name}
                  value={typeof field.value === "number" ? field.value : Number(field.value ?? 0)}
                  onBlur={field.onBlur}
                  onChange={(e)=> field.onChange(Number(e.target.value))}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="start"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start*</FormLabel>
              <FormControl>
                <DateInput value={field.value} onChange={field.onChange} name={field.name} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="end"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ende*</FormLabel>
              <FormControl>
                <DateInput value={field.value} onChange={field.onChange} name={field.name} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Beschreibung</FormLabel>
              <FormControl>
                <Input placeholder="Beschreibung" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="config"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <div className="flex items-center justify-between">
                <FormLabel>Konfiguration (JSON)</FormLabel>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const tpl = JSON.stringify(getDefaultChallengeConfig(), null, 2);
                    form.setValue("config", tpl, { shouldDirty: true, shouldValidate: true });
                  }}
                >
                  Template einfügen
                </Button>
              </div>
              <FormControl>
                <div className="relative">
                  <Textarea className="min-h-40 max-h-[30vh] overflow-auto pr-10 text-sm/0" placeholder='{"quizBefore":{...},"quizAfter":{...},"defined":{...},"daily":{...}}' {...field} />
                  {Boolean(form.watch("config")) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      aria-label="Konfiguration löschen"
                      onClick={() => form.setValue("config", "", { shouldDirty: true, shouldValidate: true })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="w-fit" type="submit">Erstellen</Button>
      </form>
    </Form>
  );
}


