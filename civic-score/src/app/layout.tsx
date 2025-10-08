import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";
import { NavTabs } from "@/components/nav-tabs";
import UserButton from "@/components/user-button";
import { getSessionUser } from "@/lib/auth";
import { ThemeProvider } from "next-themes";
import ThemeToggle from "../components/theme-toggle";
import { ChallengeSwitcher } from "@/components/challenge-switcher";
import { prisma } from "@/lib/db";
import { getOrCreateParticipant } from "@/lib/participant";
import { getSelectedChallengeCode } from "@/lib/challenge";

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  // Build challenge switcher items when logged in (participant exists regardless)
  const participant = await getOrCreateParticipant();
  const memberships = await (prisma as any).challengeMembership.findMany({ where: { participantId: participant.id }, include: { challenge: true } });
  const selectedCode = await getSelectedChallengeCode();
  const today = new Date();
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const items = await Promise.all((memberships as any[]).map(async (m) => {
    const ch = (m as any).challenge as any;
    let openToday = false;
    try {
      // A day is "open" if there is no entry yet and we're within the window [start,end]
      const startDay = new Date(ch.startDate);
      const endDay = new Date(ch.endDate);
      const within = day >= new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate()) && day <= new Date(endDay.getFullYear(), endDay.getMonth(), endDay.getDate());
      if (within) {
        const nextDay = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
        const entry = await (prisma as any).dayEntry.findFirst({ where: ({ participantId: participant.id, challengeId: ch.id, date: { gte: day, lt: nextDay } } as any), select: { id: true } });
        openToday = !entry;
      }
    } catch {}
    return { id: ch.id as string, code: ch.code as string, title: ch.title as string, openToday, selected: ch.code === selectedCode };
  }));
  return (
    <html lang="de" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="p-3 flex items-center justify-between gap-4">
            {session ? <NavTabs /> : <div />}
            <div className="flex items-center gap-3">
              {session && items.length > 0 ? <ChallengeSwitcher items={items} /> : null}
              <ThemeToggle />
              <UserButton />
            </div>
          </header>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
