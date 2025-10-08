"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { CopyIcon } from "lucide-react";

export function CopyText({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      const t = setTimeout(() => setCopied(false), 1500);
      return () => clearTimeout(t);
    } catch {}
  };

  return (
    <div className="flex items-center gap-2">
      {label ? <span className="text-sm opacity-70">{label}</span> : null}
      <code className="px-2 py-1 rounded border bg-accent/40 text-sm font-mono select-all">
        {value}
      </code>
      <Button type="button" size="sm" variant="outline" onClick={handleCopy} aria-label="Copy to clipboard">
      <CopyIcon />
        {copied ? "Kopiert" : "Kopieren"}
      </Button>
    </div>
  );
}




