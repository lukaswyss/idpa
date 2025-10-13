-- AlterTable
ALTER TABLE "public"."DayEntry" ADD COLUMN     "durationMs" INTEGER,
ADD COLUMN     "firstAnswerAt" TIMESTAMP(3),
ADD COLUMN     "lastAnswerAt" TIMESTAMP(3),
ADD COLUMN     "submittedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "loginCount" INTEGER NOT NULL DEFAULT 0;
