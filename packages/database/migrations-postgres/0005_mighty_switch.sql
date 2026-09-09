ALTER TABLE "events" ADD COLUMN "end_time" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "registration_url" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "cta_text" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "display_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "notices" ADD COLUMN "external_link" text;--> statement-breakpoint
ALTER TABLE "notices" ADD COLUMN "cta_text" text;--> statement-breakpoint
ALTER TABLE "notices" ADD COLUMN "notice_date" text;--> statement-breakpoint
ALTER TABLE "notices" ADD COLUMN "display_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Backfill notice_date for pre-existing rows so "newest first" sorting has
-- something to sort on; new rows get this set explicitly at create time.
UPDATE "notices" SET "notice_date" = COALESCE("published_at", "created_at") WHERE "notice_date" IS NULL;