import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getOrCreateParticipant } from "@/lib/participant";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body?.code || "").trim();
    if (!code) return NextResponse.json({ ok: false, error: "Missing code" }, { status: 400 });

    const participant = await getOrCreateParticipant();
    const challenge = await (prisma as any).challenge.findUnique({ where: { code } });
    if (!challenge) return NextResponse.json({ ok: false, error: "Unknown challenge" }, { status: 404 });
    const membership = await (prisma as any).challengeMembership.findUnique({
      where: { participantId_challengeId: { participantId: participant.id, challengeId: challenge.id } },
    });
    if (!membership) return NextResponse.json({ ok: false, error: "Not a member" }, { status: 403 });

    const jar: any = await cookies();
    jar.set("selected_challenge", code, { httpOnly: false, sameSite: "lax", path: "/" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}



