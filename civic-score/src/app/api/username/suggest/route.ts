import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateAnonymousUsername } from "@/lib/username";

export async function GET(_req: NextRequest) {
  // Try several candidates server-side to avoid collisions
  for (let i = 0; i < 12; i++) {
    const candidate = generateAnonymousUsername();
    const exists = await prisma.user.findUnique({ where: { username: candidate } });
    if (!exists) return NextResponse.json({ username: candidate });
  }
  // Fallback: return last try (even if not guaranteed unique)
  const fallback = generateAnonymousUsername();
  return NextResponse.json({ username: fallback });
}


