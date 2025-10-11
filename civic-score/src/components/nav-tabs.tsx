"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

export function NavTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setIsAdmin(!!data?.isAdmin);
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const value =
    pathname?.startsWith("/today") ? "today" :
    pathname?.startsWith("/history") ? "history" :
    pathname?.startsWith("/join") ? "join" :
    pathname?.startsWith("/info") ? "info" :
    pathname?.startsWith("/admin") ? "admin" :
    "";

  const handleNavigate = (v: string) => {
    if (v === "today") router.push("/today");
    else if (v === "history") router.push("/history");
    else if (v === "join") router.push("/join");
    else if (v === "info") router.push("/info");
    else if (v === "admin") router.push("/admin");
  };

  if (isMobile) {
    const selected = ["today", "history", "join", "info", "admin"].includes(value) ? value : undefined;
    return (
      <Select value={selected} onValueChange={handleNavigate}>
        <SelectTrigger size="sm" aria-label="/">
          <SelectValue placeholder="/" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Heute</SelectItem>
          <SelectItem value="history">Historie</SelectItem>
          <SelectItem value="join">Beitreten</SelectItem>
          <SelectItem value="info">Info</SelectItem>
          {isAdmin ? <SelectItem value="admin">Admin</SelectItem> : null}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Tabs value={value} onValueChange={handleNavigate}>
      <TabsList className="gap-2">
          <TabsTrigger className="hover:bg-background/70 dark:hover:bg-input/30 transition-colors" value="today" onClick={()=> handleNavigate("today")}>Heute</TabsTrigger>
        <TabsTrigger className="hover:bg-background/70 dark:hover:bg-input/30 transition-colors" value="history" onClick={()=> handleNavigate("history")}>Historie</TabsTrigger>
        <TabsTrigger className="hover:bg-background/70 dark:hover:bg-input/30 transition-colors" value="join" onClick={()=> handleNavigate("join")}>Beitreten</TabsTrigger>
        <TabsTrigger className="hover:bg-background/70 dark:hover:bg-input/30 transition-colors" value="info" onClick={()=> handleNavigate("info")}>Info</TabsTrigger>
        {isAdmin ? <TabsTrigger className="hover:bg-background/70 dark:hover:bg-input/30 transition-colors" value="admin" onClick={()=> handleNavigate("admin")}>Admin</TabsTrigger> : null}
      </TabsList>
    </Tabs>
  );
}


