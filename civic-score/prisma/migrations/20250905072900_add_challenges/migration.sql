/*
  Warnings:

  - A unique constraint covering the columns `[participantId,date,challengeId]` on the table `DayEntry` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."DayEntry_participantId_date_key";

-- AlterTable
ALTER TABLE "public"."DayEntry" ADD COLUMN     "challengeId" TEXT;

-- CreateTable
CREATE TABLE "public"."Challenge" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChallengeDay" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "question" TEXT,

    CONSTRAINT "ChallengeDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChallengeMembership" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_code_key" ON "public"."Challenge"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeDay_challengeId_date_key" ON "public"."ChallengeDay"("challengeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeMembership_participantId_challengeId_key" ON "public"."ChallengeMembership"("participantId", "challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "DayEntry_participantId_date_challengeId_key" ON "public"."DayEntry"("participantId", "date", "challengeId");

-- AddForeignKey
ALTER TABLE "public"."DayEntry" ADD CONSTRAINT "DayEntry_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."Challenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChallengeDay" ADD CONSTRAINT "ChallengeDay_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChallengeMembership" ADD CONSTRAINT "ChallengeMembership_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "public"."Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChallengeMembership" ADD CONSTRAINT "ChallengeMembership_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
