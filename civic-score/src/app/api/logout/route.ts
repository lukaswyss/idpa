import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const jar: any = await cookies();
    const token = jar.get("session_token")?.value;
    if (token) {
      try { await (prisma as any).authSession.delete({ where: { token } }); } catch {}
    }
  } catch {}

  const res = NextResponse.redirect(new URL("/", request.url));
  res.cookies.set("session_token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}


