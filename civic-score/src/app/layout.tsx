import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <nav>
          <Link href="/">Heute</Link>
          <Link href="/history">Historie</Link>
        </nav>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
