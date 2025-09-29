const adjectives = [
  "mutig","flink","klug","heiter","neugierig","tapfer","freundlich","witzig","hell","sanft",
  "ruhig","klar","achtsam","frisch","schnell","weise","wach","gelassen","stark","treu",
  "listig","fröhlich","neugierig","geduldig","furchtlos","zäh","kühn","lebhaft","smart","fix",
];
import { animals, animalGender } from "./animals";

export function generateAnonymousUsername(seed?: string): string {
  const base = (seed ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)).replace(/[^a-zA-Z0-9]/g, "");
  let sum = 0;
  for (let i = 0; i < base.length; i++) sum = (sum + base.charCodeAt(i)) % 1e9;
  const adj = adjectives[sum % adjectives.length];
  const ani = animals[(Math.floor(sum / 7)) % animals.length];
  const gender = animalGender[ani] ?? "m";
  const ending = gender === "m" ? "er" : gender === "f" ? "e" : "es";
  return `${adj}${ending}${ani}`;
}


