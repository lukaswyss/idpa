"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ListChecks } from "lucide-react";
import Link from "next/link";
import type { ChecklistItem } from "@/lib/onboarding-tasks";
import { useIsMobile } from "@/hooks/use-mobile";

type Props = {
  items: ChecklistItem[];
};

export default function TaskListButton({ items }: Props) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const incompleteCount = useMemo(() => items.filter(i => !i.done).length, [items]);
  const content = (
    <div className="space-y-3">
      <div className="text-sm font-medium">Deine Aufgaben</div>
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item.id} className="flex items-center gap-3">
            <span className={`inline-block size-3 rounded-full border ${item.done ? 'bg-green-500 border-green-600' : 'bg-neutral-100 border-neutral-300'}`} />
            <span className={`text-sm ${item.done ? 'line-through opacity-60' : ''}`}>{item.label}</span>
            {!item.done && item.href ? (
              <Link className="ml-auto text-sm underline" href={item.href}>
                Öffnen
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );

  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" type="button" className="relative">
            <ListChecks className="size-4" />
            {incompleteCount > 0 ? (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 px-1.5 py-0 text-[10px] leading-none"
              >
                {incompleteCount}
              </Badge>
            ) : null}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deine Aufgaben</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" type="button" className="relative">
          <ListChecks className="size-4" />
          {incompleteCount > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 px-1.5 py-0 text-[10px] leading-none"
            >
              {incompleteCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80"
        align="end"
        sideOffset={4}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}


