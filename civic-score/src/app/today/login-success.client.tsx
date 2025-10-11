"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export default function LoginSuccessToast() {
  const params = useSearchParams();
  useEffect(() => {
    if (params?.get("login") === "1") {
      toast.success("Login erfolgreich");
    }
  }, [params]);
  return null;
}



