/*
  Warnings:

  - You are about to drop the column `participantId` on the `ChallengeMembership` table. All the data in the column will be lost.
  - You are about to drop the column `participantId` on the `DayEntry` table. All the data in the column will be lost.
  - You are about to drop the column `participantId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Participant` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,challengeId]` on the table `ChallengeMembership` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,date,challengeId]` on the table `DayEntry` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `ChallengeMembership` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `DayEntry` table without a default value. This is not possible if the table is not empty.
  - Made the column `username` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `passwordHash` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."ChallengeMembership" DROP CONSTRAINT "ChallengeMembership_participantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DayEntry" DROP CONSTRAINT "DayEntry_participantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_participantId_fkey";

-- DropIndex
DROP INDEX "public"."ChallengeMembership_participantId_challengeId_key";

-- DropIndex
DROP INDEX "public"."DayEntry_participantId_date_challengeId_key";

-- DropIndex
DROP INDEX "public"."User_participantId_key";

-- AlterTable
ALTER TABLE "public"."ChallengeMembership" DROP COLUMN "participantId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."DayEntry" DROP COLUMN "participantId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "participantId",
ALTER COLUMN "username" SET NOT NULL,
ALTER COLUMN "passwordHash" SET NOT NULL;

-- DropTable
DROP TABLE "public"."Participant";

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeMembership_userId_challengeId_key" ON "public"."ChallengeMembership"("userId", "challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "DayEntry_userId_date_challengeId_key" ON "public"."DayEntry"("userId", "date", "challengeId");

-- AddForeignKey
ALTER TABLE "public"."DayEntry" ADD CONSTRAINT "DayEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChallengeMembership" ADD CONSTRAINT "ChallengeMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
