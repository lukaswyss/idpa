import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isCurrentUserAdmin } from "@/lib/user";

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const id = typeof body?.id === "string" ? body.id : undefined;
    const groupRaw = typeof body?.group === "string" ? body.group : undefined;
    if (!id || !groupRaw) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
    const group = groupRaw === "A" ? "A" : groupRaw === "B" ? "B" : undefined;
    if (!group) {
      return NextResponse.json({ error: "invalid_group" }, { status: 400 });
    }

    const updated = await (prisma as any).challengeMembership.update({ where: { id }, data: { abGroup: group } });
    return NextResponse.json({ ok: true, membership: { id: updated.id, abGroup: updated.abGroup } });
  } catch (err) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}


