import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";
import { NavTabs } from "@/components/nav-tabs";
import { getOrCreateUser } from "@/lib/user";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await getOrCreateUser();
  return (
    <html lang="de">
      <body>
        <nav className="p-3"><NavTabs /></nav>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
