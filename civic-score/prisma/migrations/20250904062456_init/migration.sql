-- CreateTable
CREATE TABLE "public"."Participant" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Action" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "polarity" TEXT NOT NULL,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DayEntry" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "totalScore" INTEGER NOT NULL,

    CONSTRAINT "DayEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EntryAction" (
    "id" TEXT NOT NULL,
    "dayEntryId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,

    CONSTRAINT "EntryAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Action_code_key" ON "public"."Action"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DayEntry_participantId_date_key" ON "public"."DayEntry"("participantId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "EntryAction_dayEntryId_actionId_key" ON "public"."EntryAction"("dayEntryId", "actionId");

-- AddForeignKey
ALTER TABLE "public"."DayEntry" ADD CONSTRAINT "DayEntry_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "public"."Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EntryAction" ADD CONSTRAINT "EntryAction_dayEntryId_fkey" FOREIGN KEY ("dayEntryId") REFERENCES "public"."DayEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EntryAction" ADD CONSTRAINT "EntryAction_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "public"."Action"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
