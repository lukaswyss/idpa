"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function NavTabs() {
  const pathname = usePathname();
  const router = useRouter();

  const value =
    pathname === "/" ? "today" :
    pathname?.startsWith("/history") ? "history" :
    pathname?.startsWith("/join") ? "join" :
    "today";

  return (
    <Tabs value={value} onValueChange={(v)=> {
      if (v === "today") router.push("/");
      else if (v === "history") router.push("/history");
      else if (v === "join") router.push("/join");
    }}>
      <TabsList className="gap-2">
        <TabsTrigger value="today">Heute</TabsTrigger>
        <TabsTrigger value="history">Historie</TabsTrigger>
        <TabsTrigger value="join">Beitreten</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}


