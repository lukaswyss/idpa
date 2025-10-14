import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  return res;
}

export const config = {
  matcher: ["/", "/today", "/onboarding", "/history", "/submit", "/admin"],
};


