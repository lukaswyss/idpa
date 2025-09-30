import { animals, animalGender, adjectives } from "./animals";

export function generateAnonymousUsername(seed?: string): string {
  const base = (seed ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)).replace(/[^a-zA-Z0-9]/g, "");
  let sum = 0;
  for (let i = 0; i < base.length; i++) sum = (sum + base.charCodeAt(i)) % 1e9;
  const adj = adjectives[sum % adjectives.length];
  const ani = animals[(Math.floor(sum / 7)) % animals.length];
  const gender = animalGender[ani] ?? "m";
  const ending = (adj[adj.length - 1] === "e" ? (gender === "m" ? "r" : gender === "f" ? "" : "s") : (gender === "m" ? "er" : gender === "f" ? "e" : "es"));
  return `${adj}${ending}${ani}`;
}


