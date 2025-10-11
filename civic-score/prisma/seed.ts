import { PrismaClient } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

// Use default TLS trust store (no custom CA overrides)

const prisma = new PrismaClient({ adapter: new PrismaNeonHTTP(databaseUrl, {}) });

const actions = [
  // Positive – Public
  { code:"COMM_DONATION", label:"Spende für Wohltätigkeit", category:"Public", weight:5, polarity:"positive" },
  { code:"SAFE_REPORT", label:"Öffentliche Gefahren gemeldet", category:"Public", weight:3, polarity:"positive" },
  { code:"PUBLIC_AWARD", label:"Öffentliche Auszeichnung erhalten", category:"Public", weight:3, polarity:"positive" },
  { code:"PUBLIC_HELP", label:"Jemandem geholfen (Tragen, Auskunft)", category:"Public", weight:2, polarity:"positive" },
  { code:"RECYCLE_OK", label:"Recycling korrekt", category:"Public", weight:1, polarity:"positive" },

  // Positive – Work
  { code:"WORK_PROMO", label:"Beförderung/Auszeichnung am Arbeitsplatz", category:"Work", weight:4, polarity:"positive" },
  { code:"WORK_PROJECT_DONE", label:"Projekt termingerecht abgeschlossen", category:"Work", weight:3, polarity:"positive" },
  { code:"WORK_HELP_COLLEAGUE", label:"Kolleg:in unterstützt", category:"Work", weight:2, polarity:"positive" },

  // Positive – Private
  { code:"APPT_KEPT", label:"Termin eingehalten", category:"Private", weight:2, polarity:"positive" },
  { code:"BILL_ON_TIME", label:"Rechnung pünktlich bezahlt", category:"Private", weight:2, polarity:"positive" },
  { code:"HEALTHCARE_VISIT", label:"Arzttermin wahrgenommen", category:"Private", weight:1, polarity:"positive" },

  // Positive – Digital
  { code:"ONLINE_KIND", label:"Online freundlich/konstruktiv geäußert", category:"Digital", weight:1, polarity:"positive" },
  { code:"ONLINE_REPORT_SCAM", label:"Fake/Scam gemeldet (bestätigt)", category:"Digital", weight:2, polarity:"positive" },

  // Negative – Public
  { code:"FARE_EVASION", label:"ÖV ohne Ticket", category:"Public", weight:-3, polarity:"negative" },
  { code:"LITTERING", label:"Littering (Müll liegenlassen)", category:"Public", weight:-2, polarity:"negative" },
  { code:"CREATE_RISK", label:"Öffentliches Risiko geschaffen", category:"Public", weight:-3, polarity:"negative" },
  { code:"SPEEDING", label:"Geschwindigkeit überschritten", category:"Public", weight:-3, polarity:"negative" },
  { code:"JAYWALK", label:"Straße ohne Zebrastreifen überquert", category:"Public", weight:-1, polarity:"negative" },
  { code:"ACCIDENT_FAULT", label:"Verkehrsunfall verschuldet", category:"Public", weight:-5, polarity:"negative" },

  // Negative – Work
  { code:"WORK_NO_SHOW", label:"Unentschuldigtes Fehlen", category:"Work", weight:-3, polarity:"negative" },
  { code:"WORK_MISS_DEADLINE", label:"Deadline verpasst", category:"Work", weight:-2, polarity:"negative" },

  // Negative – Private
  { code:"APPT_MISSED", label:"Termin verpasst (ohne Absage)", category:"Private", weight:-2, polarity:"negative" },
  { code:"BILL_LATE", label:"Rechnung verspätet bezahlt", category:"Private", weight:-2, polarity:"negative" },
  { code:"DUNNING", label:"Mahnung erhalten", category:"Private", weight:-3, polarity:"negative" },

  // Negative – Digital
  { code:"ONLINE_RUDE", label:"Online unfreundlich/beleidigend", category:"Digital", weight:-2, polarity:"negative" },
  { code:"ONLINE_MISINFO", label:"Falschinfo geteilt", category:"Digital", weight:-3, polarity:"negative" },
  { code:"PIRACY", label:"Illegale Downloads/Streaming", category:"Digital", weight:-2, polarity:"negative" },
];

async function main() {
  for (const a of actions) {
    await prisma.action.upsert({
      where: { code: a.code },
      update: a,
      create: a,
    });
  }
}
main().finally(() => prisma.$disconnect());
