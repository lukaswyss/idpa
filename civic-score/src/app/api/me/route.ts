import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ isLoggedIn: false, isAdmin: false });
  const role = await prisma.adminRole.findUnique({ where: { userId: session.id } });
  return NextResponse.json({ isLoggedIn: true, isAdmin: !!role, userId: session.id, username: session.username });
}


