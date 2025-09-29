"use server";

import { prisma } from "./db";
import { getOrCreateParticipant } from "./participant";
import { getSessionUser } from "./auth";
import { generateAnonymousUsername } from "./username";

export async function getOrCreateUser() {
	const participant = await getOrCreateParticipant();
	let user = await prisma.user.findFirst({ where: { participantId: participant.id } });
	if (!user) {
		user = await prisma.user.create({ data: { participantId: participant.id } });
	}
	return { user, participant } as const;
}

export async function isCurrentUserAdmin(): Promise<boolean> {
	const session = await getSessionUser();
	if (!session) return false;
	const role = await prisma.adminRole.findUnique({ where: { userId: session.id } });
	return !!role;
}

export async function generateUniqueUsername(maxTries = 12): Promise<string> {
  for (let i = 0; i < maxTries; i++) {
    const candidate = generateAnonymousUsername();
    const exists = await prisma.user.findUnique({ where: { username: candidate } });
    if (!exists) return candidate;
  }
  // fallback: add a short suffix to avoid infinite loops
  const base = generateAnonymousUsername();
  let suffix = 2;
  while (suffix < 1000) {
    const candidate = `${base}${suffix}`;
    const exists = await prisma.user.findUnique({ where: { username: candidate } });
    if (!exists) return candidate;
    suffix++;
  }
  return `${generateAnonymousUsername()}_${Date.now()}`;
}



