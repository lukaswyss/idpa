"use server";

import { prisma } from "./db";
import { getOrCreateParticipant } from "./participant";

export async function getOrCreateUser() {
	const participant = await getOrCreateParticipant();
	let user = await prisma.user.findFirst({ where: { participantId: participant.id } });
	if (!user) {
		user = await prisma.user.create({ data: { participantId: participant.id } });
	}
	return { user, participant } as const;
}

export async function isCurrentUserAdmin(): Promise<boolean> {
	const { user } = await getOrCreateUser();
	const role = await prisma.adminRole.findUnique({ where: { userId: user.id } });
	return !!role;
}



