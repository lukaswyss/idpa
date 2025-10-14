"use server";

import { cookies } from "next/headers";
import { prisma } from "./db";
import { getSessionUser } from "./auth";

export async function getOrCreateParticipant() {
  const cookieStore = await cookies();

  // If a user session exists, align participant with the user's participantId
  try {
    const session = await getSessionUser();
    if (session) {
      const user = await prisma.user.findUnique({ where: { id: session.id } });
      const sessionParticipantId = user?.participantId;
      if (sessionParticipantId) {
        try {
          cookieStore.set("participant_id", sessionParticipantId, { httpOnly: true, sameSite: "lax", path: "/" });
        } catch {}
        const existingBySession = await prisma.participant.findUnique({ where: { id: sessionParticipantId } });
        if (existingBySession) return existingBySession;
        try {
          const createdBySession = await prisma.participant.create({ data: { id: sessionParticipantId } });
          return createdBySession;
        } catch {}
      }
    }
  } catch {}

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
