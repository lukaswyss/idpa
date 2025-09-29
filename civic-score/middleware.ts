import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const cookie = req.cookies.get("participant_id");
  if (!cookie) {
    res.cookies.set("participant_id", crypto.randomUUID(), { httpOnly: true, sameSite: "lax", path: "/" });
  }
  // reserve a stable anonymous user cookie id for possible future linking
  const userCookie = req.cookies.get("user_id");
  if (!userCookie) {
    res.cookies.set("user_id", crypto.randomUUID(), { httpOnly: true, sameSite: "lax", path: "/" });
  }
  return res;
}

export const config = {
  matcher: ["/", "/history", "/submit", "/admin"],
};


