import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  href?: string;
};

export async function getOnboardingTasks(userId: string, hasSession?: boolean): Promise<ChecklistItem[]> {
  // Determine session if not provided
  let hasAccount = typeof hasSession === "boolean" ? hasSession : false;
  if (typeof hasSession === "undefined") {
    try { hasAccount = !!(await getSessionUser()); } catch { hasAccount = false; }
  }

  // Identify latest joined challenge (if any)
  const membership = await (prisma as any).challengeMembership.findFirst({
    where: { userId },
    orderBy: { joinedAt: "desc" },
    include: { challenge: true },
  });
  const challenge = membership?.challenge as any | undefined;
  const hasChallenge = !!challenge;

  // Daily participation signal
  let hasAnyDaily = false;
  try {
    const anyEntry = await (prisma as any).dayEntry.findFirst({ where: { userId, challengeId: challenge?.id ?? undefined } });
    hasAnyDaily = !!anyEntry;
  } catch {}

  const items: ChecklistItem[] = [
    { id: "account", label: "Account erstellt und angemeldet", done: hasAccount, href: hasAccount ? undefined : "/login" },
    { id: "join", label: "Challenge beitreten", done: hasChallenge, href: hasChallenge ? undefined : "/join" },
    { id: "daily", label: "Erste Fragen beantworten", done: hasAnyDaily, href: "/today" },
  ];

  return items;
}


