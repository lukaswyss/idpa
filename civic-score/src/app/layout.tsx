import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";
import { NavTabs } from "@/components/nav-tabs";
import UserButton from "@/components/user-button";
import { getSessionUser } from "@/lib/auth";
import { ThemeProvider } from "next-themes";
import ThemeToggle from "../components/theme-toggle";

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  return (
    <html lang="de" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="p-3 flex items-center justify-between gap-4">
            {session ? <NavTabs /> : <div />}
            <div className="flex items-center gap-3">
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
