import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid confusing chars

export function generateChallengeCode(length: number = 6): string {
  const bytes = typeof crypto !== "undefined" && "getRandomValues" in crypto
    ? crypto.getRandomValues(new Uint8Array(length))
    : new Uint8Array(Array.from({ length }, () => Math.floor(Math.random() * 256)));
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export async function generateUniqueChallengeCode(): Promise<string> {
  // Try a few times to avoid rare collisions
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = generateChallengeCode(6);
    const existing = await (prisma as any).challenge.findUnique({ where: { code: candidate } });
    if (!existing) return candidate;
  }
  // Fallback to longer code if unlucky
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = generateChallengeCode(8);
    const existing = await (prisma as any).challenge.findUnique({ where: { code: candidate } });
    if (!existing) return candidate;
  }
  // Absolute fallback
  return `${generateChallengeCode(6)}${generateChallengeCode(6)}`;
}


// Lightweight schedule helpers for challenge flows
export function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfDayLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isSameDayLocal(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isLastDay(challenge: { endDate: Date }, date: Date = new Date()): boolean {
  const end = startOfDayLocal(new Date(challenge.endDate));
  const cur = startOfDayLocal(date);
  return isSameDayLocal(end, cur);
}

export function isDefinedDay(cfg: any, date: Date): boolean {
  const dayKey = formatYmd(date);
  try {
    if (!cfg || !cfg.defined) return false;
    // Legacy shape: { defined: { days: string[], questions: Question[] } }
    if (Array.isArray(cfg.defined.days)) return cfg.defined.days.includes(dayKey);
    // New shape: { defined: { [setKey]: { days: string[], questions: Question[] } } }
    if (cfg.defined && typeof cfg.defined === "object") {
      for (const value of Object.values(cfg.defined)) {
        if (value && typeof value === "object" && Array.isArray((value as any).days) && (value as any).days.includes(dayKey)) {
          return true;
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

// Returns the matching defined set key for the given date, or "__default" for legacy shape, or null
export function getDefinedSetKeyForDate(cfg: any, date: Date): string | null {
  const dayKey = formatYmd(date);
  try {
    if (!cfg || !cfg.defined) return null;
    if (Array.isArray(cfg.defined.days)) return "__default";
    if (cfg.defined && typeof cfg.defined === "object") {
      for (const [key, value] of Object.entries(cfg.defined)) {
        if (value && typeof value === "object" && Array.isArray((value as any).days) && (value as any).days.includes(dayKey)) {
          return key;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Returns the list of defined questions applicable for the given date based on the set configuration
export function getDefinedQuestionsForDate(cfg: any, date: Date): any[] {
  try {
    if (!cfg || !cfg.defined) return [];
    const setKey = getDefinedSetKeyForDate(cfg, date);
    if (setKey === "__default") {
      const rootQs = Array.isArray(cfg.defined.questions) ? cfg.defined.questions : [];
      if (rootQs.length > 0) return rootQs;
      // Fallback 1: if the day is marked on the legacy root but questions live in a single set,
      // return that set's questions to avoid silent empty state.
      if (cfg.defined && typeof cfg.defined === "object") {
        const setsEntries: [string, any][] = Object.entries(cfg.defined).filter(
          ([, value]) => value && typeof value === "object"
        ) as [string, any][];
        const setsWithQuestions = setsEntries.filter(
          ([, v]) => Array.isArray((v as any).questions) && (v as any).questions.length > 0
        );
        if (setsWithQuestions.length === 1) {
          return (setsWithQuestions[0][1] as any).questions as any[];
        }
        // Fallback 2: prefer a set explicitly named "weekly" if present
        const weekly = (cfg.defined as any).weekly;
        if (weekly && typeof weekly === "object" && Array.isArray(weekly.questions) && weekly.questions.length > 0) {
          return weekly.questions as any[];
        }
        // Fallback 3: merge all available set questions (de-duplicated by id)
        if (setsWithQuestions.length > 1) {
          const merged: any[] = [];
          const seen = new Set<string>();
          for (const [, v] of setsWithQuestions) {
            const qs: any[] = (v as any).questions || [];
            for (const q of qs) {
              const id = (q as any)?.id;
              if (id && !seen.has(id)) {
                seen.add(id);
                merged.push(q);
              }
            }
          }
          if (merged.length > 0) return merged;
        }
      }
      return [];
    }
    if (typeof setKey === "string" && setKey) {
      const setObj: any = (cfg.defined as any)[setKey];
      return Array.isArray(setObj?.questions) ? setObj.questions : [];
    }
    return [];
  } catch {
    return [];
  }
}

export function hasWeeklyConfig(cfg: any): boolean {
  try {
    return Array.isArray(cfg?.weekly?.questions) || Array.isArray(cfg?.questionsWeekly) || Array.isArray(cfg?.weeklyQuestions);
  } catch {
    return false;
  }
}

export function isWeeklyDue(cfg: any, date: Date = new Date()): boolean {
  try {
    // Allow config to specify dayOfWeek 0-6 (0=Sunday). Default: Monday (1)
    const desired = typeof cfg?.weekly?.dayOfWeek === "number" ? cfg.weekly.dayOfWeek : 1;
    return date.getDay() === desired;
  } catch {
    return false;
  }
}

export async function hasTodayEntry(userId: string, challengeId?: string): Promise<boolean> {
  const now = new Date();
  const day = startOfDayLocal(now);
  const nextDay = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
  try {
    const entry = await (prisma as any).dayEntry.findFirst({
      where: ({ userId, challengeId, date: { gte: day, lt: nextDay } } as any),
      select: { id: true },
    });
    return Boolean(entry);
  } catch {
    return false;
  }
}

async function isQuizDoneByMarker(userId: string, challengeId: string | undefined, markerId?: string): Promise<boolean> {
  if (!markerId) return false;
  try {
    const found = await (prisma as any).dayEntry.findFirst({
      where: ({ userId, challengeId, markers: { has: `quiz:${markerId}` } } as any),
      select: { id: true },
    });
    return Boolean(found);
  } catch {
    return false;
  }
}

export async function isPreQuizDone(userId: string, challenge: any): Promise<boolean> {
  const cfg: any = challenge?.config || {};
  const preId: string | undefined = cfg?.quiz?.preId
    ?? cfg?.quizBefore?.id
    ?? cfg?.preQuizId
    ?? cfg?.pre?.id;
  return isQuizDoneByMarker(userId, challenge?.id, preId);
}

export async function isPostQuizDone(userId: string, challenge: any): Promise<boolean> {
  const cfg: any = challenge?.config || {};
  const postId: string | undefined = cfg?.quiz?.postId
    ?? cfg?.quizAfter?.id
    ?? cfg?.postQuizId
    ?? cfg?.post?.id;
  return isQuizDoneByMarker(userId, challenge?.id, postId);
}

// Persist preferred/selected challenge in a cookie to switch contexts across pages
const SELECTED_CHALLENGE_COOKIE = "selected_challenge";

export async function getSelectedChallengeCode(): Promise<string | null> {
  try {
    const jar: any = await cookies();
    return jar.get(SELECTED_CHALLENGE_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

export async function setSelectedChallengeCode(code: string): Promise<void> {
  try {
    const jar: any = await cookies();
    jar.set(SELECTED_CHALLENGE_COOKIE, code, { httpOnly: false, sameSite: "lax", path: "/" });
  } catch {}
}

// moved templates to client-safe module: src/lib/challenge-templates

