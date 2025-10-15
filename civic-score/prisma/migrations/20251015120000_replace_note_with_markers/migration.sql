-- Replace free-text note with structured markers array

-- 1) Add new column markers (text[])
ALTER TABLE "public"."DayEntry" ADD COLUMN IF NOT EXISTS "markers" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 2) Migrate existing quiz markers from note into markers
--    Extract tokens that look like 'quiz:...' and also migrate 'Startscore'
UPDATE "public"."DayEntry"
SET "markers" = (
  SELECT ARRAY(
    SELECT DISTINCT t
    FROM (
      SELECT REGEXP_MATCHES(COALESCE("note", ''), '(quiz:[^\s]+)', 'g') AS m
    ) AS s
    CROSS JOIN LATERAL UNNEST(s.m) AS t
  )
)
WHERE COALESCE("note", '') <> '';

-- Also map 'Startscore' free-text to a standard marker
UPDATE "public"."DayEntry"
SET "markers" = ARRAY_APPEND(COALESCE("markers", ARRAY[]::TEXT[]), 'startscore')
WHERE "note" ILIKE '%startscore%';

-- 3) Drop note column (safe if exists)
ALTER TABLE "public"."DayEntry" DROP COLUMN IF EXISTS "note";


