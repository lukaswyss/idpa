import { prisma } from "@/lib/db";
import { isCurrentUserAdmin } from "@/lib/user";
import { getSessionUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rating, RatingButton } from "@/components/ui/shadcn-io/rating";
import { QuestionListClient } from "./question-list.client";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeftIcon } from "lucide-react";

type SimpleQuestion = { id: string; label: string; type: "text" | "boolean" | "number" | "select" | "stars"; items?: { id: string; label: string }[]; stars?: number };

function normalizeQuestions(arr: any[]): SimpleQuestion[] {
  return (arr || [])
    .map((q: any, idx: number) => {
      if (q && typeof q === "object" && "id" in q && "label" in q && "type" in q) {
        const t = (q as any).type;
        if (t === "text" || t === "boolean" || t === "number" || t === "select" || t === "stars") {
          return q as SimpleQuestion;
        }
      }
      if (q && typeof q === "object" && "text" in q) {
        return { id: `q${idx}`, label: String((q as any).text), type: "boolean" as const };
      }
      if (typeof q === "string") {
        return { id: `q${idx}`, label: q, type: "boolean" as const };
      }
      return null;
    })
    .filter(Boolean) as SimpleQuestion[];
}

export default async function AdminQuestionsPreview({ params }: { params: { id: string } }) {
  const session = await getSessionUser();
  if (!session) {
    return (
      <main className="mx-auto max-w-3xl p-6 space-y-6">
        <section className="max-w-md space-y-3">
          <h1 className="text-2xl font-semibold">Kein Zugriff</h1>
          <p className="text-sm opacity-70">Bitte anmelden, um die Admin-Seite zu sehen.</p>
        </section>
      </main>
    );
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
  const cfg = (challenge as any).config || {};

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
  const dailyQuestions = normalizeQuestions(
    Array.isArray(cfg?.daily?.questions)
      ? cfg.daily.questions
      : Array.isArray(cfg?.questionsDaily)
        ? cfg.questionsDaily
        : Array.isArray(cfg?.dailyQuestions)
          ? cfg.dailyQuestions
          : []
  );
  const definedQuestions = normalizeQuestions(
    Array.isArray(cfg?.defined?.questions) ? cfg.defined.questions : []
  );

  function QuestionList({ title, questions }: { title: string; questions: SimpleQuestion[] }) {
    return (
      <QuestionListClient title={title} questions={questions} />
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">Fragen Vorschau</h1>
        <Link href={`/admin/${challenge.id}`} className="text-sm underline"><Button variant="outline"><ArrowLeftIcon />Zurück</Button></Link>
      </div>

      <section className="space-y-4">
        <QuestionList title="Pre‑Quiz" questions={preQuestions} />
        <QuestionList title="Daily‑Fragen" questions={dailyQuestions} />
        <QuestionList title="Defined‑Fragen" questions={definedQuestions} />
        <QuestionList title="Post‑Quiz" questions={postQuestions} />
      </section>
    </main>
  );
}


