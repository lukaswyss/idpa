import { prisma } from "@/lib/db";
import { isCurrentUserAdmin } from "@/lib/user";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/date-input";
import { getSessionUser } from "@/lib/auth";
import LoginRequired from "@/components/login-required";

async function addQuestionDate(formData: FormData): Promise<void> {
  "use server";
  const Schema = z.object({ id: z.string().min(1), date: z.string().min(1) });
  const parsed = Schema.safeParse({ id: formData.get("id"), date: formData.get("date") });
  if (!parsed.success) return;
  const challenge = await (prisma as any).challenge.findUnique({ where: { id: parsed.data.id } });
  if (!challenge) return;
  const d = new Date(parsed.data.date);
  const d0 = new Date(challenge.startDate);
  const d1 = new Date(challenge.endDate);
  if (d < d0 || d > d1) return;

  const cfg = (challenge.config as any) || {};
  // Migrate legacy cfg.defined (array of ISO strings) to cfg.defined.days (yyyy-MM-dd)
  const dayKey = `${d.getFullYear().toString().padStart(4, "0")}-${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
  let definedObj: any = cfg.defined;
  if (Array.isArray(definedObj)) {
    const daysFromLegacy = (definedObj as string[]).map((iso) => {
      const dt = new Date(iso);
      return `${dt.getFullYear().toString().padStart(4, "0")}-${(dt.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${dt.getDate().toString().padStart(2, "0")}`;
    });
    definedObj = { days: Array.from(new Set(daysFromLegacy)), questions: [] };
  }
  if (!definedObj || typeof definedObj !== "object") {
    definedObj = { days: [], questions: [] };
  }
  if (!Array.isArray(definedObj.days)) definedObj.days = [];
  if (!definedObj.days.includes(dayKey)) definedObj.days.push(dayKey);
  cfg.defined = definedObj;
  await (prisma as any).challenge.update({ where: { id: challenge.id }, data: { config: cfg } });
  revalidatePath(`/admin/${challenge.id}`);
}

export default async function ChallengeDetails({ params }: { params: { id: string } }) {
  const session = await getSessionUser();
  if (!session) {
    return <LoginRequired title="Kein Zugriff" message="Bitte anmelden, um die Admin-Seite zu sehen." />;
  }
  const roleIsAdmin = await isCurrentUserAdmin();
  if (!roleIsAdmin) {
    return (
      <main className="mx-auto max-w-3xl p-6 space-y-6">
        <section className="max-w-md space-y-3">
          <h1 className="text-2xl font-semibold">Kein Zugriff</h1>
          <p className="text-sm opacity-70">Nur Admins können diese Seite sehen.</p>
        </section>
      </main>
    );
  }

  const challenge = await (prisma as any).challenge.findUnique({ where: { id: params.id } });
  if (!challenge) notFound();

  const memberships = await (prisma as any).challengeMembership.findMany({ where: { challengeId: challenge.id }, include: { participant: true } });

  const cfg = (challenge.config as any) || {};

  // Collect defined days from both legacy cfg.defined (ISO strings) and cfg.defined.days (yyyy-MM-dd)
  const definedDaysSet = new Set<string>();
  const legacyDefined: string[] = Array.isArray(cfg.defined) ? (cfg.defined as string[]) : [];
  for (const iso of legacyDefined) {
    try {
      const d = new Date(iso);
      definedDaysSet.add(format(d, "yyyy-MM-dd"));
    } catch {}
  }
  if (cfg?.defined?.days && Array.isArray(cfg.defined.days)) {
    for (const d of cfg.defined.days as string[]) {
      if (typeof d === "string") definedDaysSet.add(d);
    }
  }
  const definedDays = Array.from(definedDaysSet).sort();

  // Helper to normalize mixed question formats to { id, label, type }
  const normalizeQuestions = (arr: any[]): { id: string; label: string; type: "text" | "boolean" | "number" }[] => {
    return (arr || [])
      .map((q: any, idx: number) => {
        if (q && typeof q === "object" && "id" in q && "label" in q && "type" in q) {
          return q as { id: string; label: string; type: "text" | "boolean" | "number" };
        }
        if (q && typeof q === "object" && "text" in q) {
          return { id: `q${idx}`, label: String((q as any).text), type: "boolean" as const };
        }
        if (typeof q === "string") {
          return { id: `q${idx}`, label: q, type: "boolean" as const };
        }
        return null;
      })
      .filter(Boolean) as { id: string; label: string; type: "text" | "boolean" | "number" }[];
  };

  // Extract questions from config across supported shapes
  const dailyQuestionsRaw: any[] = Array.isArray(cfg?.daily?.questions)
    ? cfg.daily.questions
    : Array.isArray(cfg?.questionsDaily)
      ? cfg.questionsDaily
      : Array.isArray(cfg?.dailyQuestions)
        ? cfg.dailyQuestions
        : [];
  const dailyQuestions = normalizeQuestions(dailyQuestionsRaw);

  const definedQuestionsRaw: any[] = Array.isArray(cfg?.defined?.questions)
    ? cfg.defined.questions
    : [];
  const definedQuestions = normalizeQuestions(definedQuestionsRaw);

  // Pre/Post quiz: support multiple config shapes
  const preQuizId: string | undefined = cfg?.quiz?.preId
    ?? cfg?.quizBefore?.id
    ?? cfg?.preQuizId
    ?? cfg?.pre?.id;
  const postQuizId: string | undefined = cfg?.quiz?.postId
    ?? cfg?.quizAfter?.id
    ?? cfg?.postQuizId
    ?? cfg?.post?.id;

  const preQuestions = normalizeQuestions(
    Array.isArray(cfg?.quiz?.pre?.questions)
      ? cfg.quiz.pre.questions
      : Array.isArray(cfg?.quizBefore?.questions)
        ? cfg.quizBefore.questions
        : Array.isArray(cfg?.preQuiz?.questions)
          ? cfg.preQuiz.questions
          : Array.isArray(cfg?.pre?.questions)
            ? cfg.pre.questions
            : Array.isArray(cfg?.quiz?.pre)
              ? cfg.quiz.pre
              : []
  );
  const postQuestions = normalizeQuestions(
    Array.isArray(cfg?.quiz?.post?.questions)
      ? cfg.quiz.post.questions
      : Array.isArray(cfg?.quizAfter?.questions)
        ? cfg.quizAfter.questions
        : Array.isArray(cfg?.postQuiz?.questions)
          ? cfg.postQuiz.questions
          : Array.isArray(cfg?.post?.questions)
            ? cfg.post.questions
            : Array.isArray(cfg?.quiz?.post)
              ? cfg.quiz.post
              : []
  );

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{challenge.title}</h1>
      <div className="text-sm opacity-70">Code {challenge.code} – {format(challenge.startDate, "dd.MM.yyyy")}–{format(challenge.endDate, "dd.MM.yyyy")}</div>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Mitglieder ({memberships.length})</h2>
        <ul className="text-sm list-disc pl-5">
          {memberships.map((m: any) => (
            <li key={m.id}>{m.participant.id}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Fragen-Tage ({definedDays.length})</h2>
        <div className="text-sm">Aktuelle Tage:</div>
        <ul className="text-sm flex flex-wrap gap-2">
          {definedDays.length === 0 && <li className="px-2 py-1 rounded border">Keine Tage definiert</li>}
          {definedDays.map((dayKey) => {
            const [y, m, d] = dayKey.split("-").map((v) => Number(v));
            const dt = new Date(y, (m || 1) - 1, d || 1);
            return <li key={dayKey} className="px-2 py-1 rounded border">{format(dt, "dd.MM.yyyy")}</li>;
          })}
        </ul>
        <form action={addQuestionDate} className="grid gap-2 grid-cols-2 items-end">
          <input type="hidden" name="id" value={challenge.id} />
          <label>Datum innerhalb der Challenge</label>
          <div />
          <DateInput name="date" min={format(new Date(challenge.startDate), "yyyy-MM-dd")} max={format(new Date(challenge.endDate), "yyyy-MM-dd")} />
          <Button type="submit">Hinzufügen</Button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Quiz & Fragenübersicht</h2>

        <div className="space-y-2">
          <h3 className="font-medium">Pre-Quiz {preQuizId ? `(ID: ${preQuizId})` : ""}</h3>
          {preQuestions.length === 0 ? (
            <div className="text-sm opacity-70">Keine Fragen konfiguriert</div>
          ) : (
            <ul className="list-disc pl-5 text-sm">
              {preQuestions.map((q) => (
                <li key={`pre-${q.id}`}>{q.label} <span className="opacity-60 text-xs">[{q.type}]</span></li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Post-Quiz {postQuizId ? `(ID: ${postQuizId})` : ""}</h3>
          {postQuestions.length === 0 ? (
            <div className="text-sm opacity-70">Keine Fragen konfiguriert</div>
          ) : (
            <ul className="list-disc pl-5 text-sm">
              {postQuestions.map((q) => (
                <li key={`post-${q.id}`}>{q.label} <span className="opacity-60 text-xs">[{q.type}]</span></li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Daily-Fragen ({dailyQuestions.length})</h3>
          {dailyQuestions.length === 0 ? (
            <div className="text-sm opacity-70">Keine Fragen konfiguriert</div>
          ) : (
            <ul className="list-disc pl-5 text-sm">
              {dailyQuestions.map((q) => (
                <li key={`daily-${q.id}`}>{q.label} <span className="opacity-60 text-xs">[{q.type}]</span></li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Defined-Fragen ({definedQuestions.length})</h3>
          {definedQuestions.length === 0 ? (
            <div className="text-sm opacity-70">Keine Fragen konfiguriert</div>
          ) : (
            <ul className="list-disc pl-5 text-sm">
              {definedQuestions.map((q) => (
                <li key={`def-${q.id}`}>{q.label} <span className="opacity-60 text-xs">[{q.type}]</span></li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}


