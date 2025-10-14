import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";
import { NavTabs } from "@/components/nav-tabs";
import UserButton from "@/components/user-button";
import { getSessionUser } from "@/lib/auth";
import { ThemeProvider } from "next-themes";
import ThemeToggle from "../components/theme-toggle";
import { prisma } from "@/lib/db";
import { Roboto_Mono as FontSans } from "next/font/google"
import { getOnboardingTasks } from "@/lib/onboarding-tasks";
import TaskListButton from "@/components/task-list-button";
import type { Metadata } from "next";
export const dynamic = "force-dynamic";

const fontSans = FontSans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-geist-sans",
})

export const metadata: Metadata = {
  title: "Civic Score",
  description: "IPDA 2025 - Kevin Rodriguez & Lukas Wyss",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  const tasks = await getOnboardingTasks(session?.id ?? "", !!session);
  return (
    <html lang="de" suppressHydrationWarning className={fontSans.variable}>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="p-3 flex items-center justify-between gap-4">
            {session ? <NavTabs /> : <div />}
            <div className="flex items-center gap-3">
              {session ? <TaskListButton items={tasks} /> : null}
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
