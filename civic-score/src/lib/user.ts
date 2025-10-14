"use server";

import { prisma } from "./db";
import { getSessionUser } from "./auth";
import { generateAnonymousUsername } from "./username";

export async function getOrCreateUser() {
	const session = await getSessionUser();
	if (session) {
		const user = await prisma.user.findUnique({ where: { id: session.id } });
		if (user) return { user } as const;
	}
	// With mandatory registration, this path should not normally be used.
	// Create a placeholder user requires username/password – caller should handle registration.
	throw new Error("No active session; registration required before creating user");
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



