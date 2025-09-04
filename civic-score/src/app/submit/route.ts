import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateParticipant } from "@/lib/participant";
import { z } from "zod";

const BodySchema = z.object({
  selected: z.array(z.string()).default([]),
  note: z.string().optional().default(""),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const participant = await getOrCreateParticipant();

    // Heute (nur Datumsteil)
    const now = new Date();
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Hole Aktionen & Score
    const uniqueIds = Array.from(new Set(parsed.data.selected));
    const actions = uniqueIds.length
      ? await prisma.action.findMany({ where: { id: { in: uniqueIds } }})
      : [];
    const total = actions.reduce((sum: number, a: { weight: number }) => sum + a.weight, 0);

    // Upsert Tages-Eintrag
    const entry = await prisma.dayEntry.upsert({
      where: { participantId_date: { participantId: participant.id, date: day } },
      update: { note: parsed.data.note, totalScore: total },
      create: { participantId: participant.id, date: day, note: parsed.data.note, totalScore: total },
    });

    // Link Actions (ersetzen)
    await prisma.entryAction.deleteMany({ where: { dayEntryId: entry.id }});
    if (actions.length) {
      await prisma.entryAction.createMany({
        data: actions.map((a: { id: string }) => ({ dayEntryId: entry.id, actionId: a.id })),
      });
    }

    return NextResponse.json({ ok: true, total });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
