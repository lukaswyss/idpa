"use server";

import { cookies } from "next/headers";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { animals, animalGender } from "./animals";

const SESSION_COOKIE = "session_token";

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export async function createSession(userId: string, days = 30): Promise<void> {
  const token = crypto.randomUUID() + "." + crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  await prisma.authSession.create({ data: { userId, token, expiresAt } });
  const jar: any = await cookies();
  jar.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: true, path: "/", expires: expiresAt });
}

export async function getSessionUser(): Promise<{ id: string; username: string | null } | null> {
  const jar: any = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.authSession.findUnique({ where: { token }, include: { user: true } });
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    try { await prisma.authSession.delete({ where: { token } }); } catch {}
    try { jar.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 0 }); } catch {}
    return null;
  }
  return { id: session.user.id, username: session.user.username ?? null };
}

export async function destroySession(): Promise<void> {
  const jar: any = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    try { await prisma.authSession.delete({ where: { token } }); } catch {}
  }
  jar.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 0 });
}

const adjectives = [
  "mutig","flink","klug","neugierig","tapfer","freundlich","witzig",
  "ruhig","achtsam","frisch","schnell","weise","wach","gelassen","stark","treu",
  "listig","fröhlich","geduldig","furchtlos","kühn","lebhaft","smart",
];

export async function generateAnonymousUsername(seed?: string): Promise<string> {
  const base = (seed ?? crypto.randomUUID()).replace(/[^a-zA-Z0-9]/g, "");
  let sum = 0;
  for (let i = 0; i < base.length; i++) sum = (sum + base.charCodeAt(i)) % 1e9;
  const adj = adjectives[sum % adjectives.length];
  const ani = animals[(Math.floor(sum / 7)) % animals.length];
  const gender = animalGender[ani] ?? "m";
  const ending = gender === "m" ? "er" : gender === "f" ? "e" : "es";
  return `${adj}${ending}${ani}`;
}


