-- Add A/B testing support
-- Note: This migration assumes PostgreSQL

-- Create enum for group assignment
DO $$ BEGIN
  CREATE TYPE "AbGroup" AS ENUM ('A', 'B');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add flag to challenges
ALTER TABLE "public"."Challenge"
  ADD COLUMN IF NOT EXISTS "abEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Add group column on membership
ALTER TABLE "public"."ChallengeMembership"
  ADD COLUMN IF NOT EXISTS "abGroup" "AbGroup";



