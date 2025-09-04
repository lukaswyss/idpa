"use server";

import { cookies } from "next/headers";
import { prisma } from "./db";

export async function getOrCreateParticipant() {
  const cookieStore = await cookies();
  const idFromCookie = cookieStore.get("participant_id")?.value;

  if (idFromCookie) {
    const existing = await prisma.participant.findUnique({ where: { id: idFromCookie } });
    if (existing) return existing;
    try {
      const createdWithCookie = await prisma.participant.create({ data: { id: idFromCookie } });
      return createdWithCookie;
    } catch {
      // ignore and create new below
    }
  }

  const created = await prisma.participant.create({ data: {} });
  try {
    cookieStore.set("participant_id", created.id, { httpOnly: true, sameSite: "lax", path: "/" });
  } catch {}
  return created;
}
