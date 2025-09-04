import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const cookie = req.cookies.get("participant_id");
  if (!cookie) {
    res.cookies.set("participant_id", crypto.randomUUID(), { httpOnly: true, sameSite: "lax", path: "/" });
  }
  return res;
}

export const config = {
  matcher: ["/", "/history", "/submit"],
};


