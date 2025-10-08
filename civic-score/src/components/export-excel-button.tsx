"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";
import { Spinner } from "@/components/spinner";

export function ExportExcelButton({ challengeId, challengeCode }: { challengeId: string; challengeCode: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      variant="outline"
      onClick={async () => {
        try {
          setLoading(true);
          const resp = await fetch(`/admin/${challengeId}/export`, { cache: "no-store" });
          if (!resp.ok) throw new Error("Export failed");
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `challenge_${challengeCode}_export.xlsx`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? <Spinner className="mr-2" /> : <DownloadIcon className="mr-2" />}
      Excel Export
    </Button>
  );
}


