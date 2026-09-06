DROP INDEX IF EXISTS "fee_structures_idx";--> statement-breakpoint
ALTER TABLE "extra_fees" ADD COLUMN "paid_amount" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD COLUMN "section_id" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "received_by_name" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "cheque_number" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "bank_name" text;--> statement-breakpoint
ALTER TABLE "student_fees" ADD COLUMN "paid_amount" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "student_fees" ADD COLUMN "waived_at" text;--> statement-breakpoint
ALTER TABLE "student_fees" ADD COLUMN "waived_by" text;--> statement-breakpoint
ALTER TABLE "student_fees" ADD COLUMN "waived_reason" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student_fees" ADD CONSTRAINT "student_fees_waived_by_users_id_fk" FOREIGN KEY ("waived_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fee_structures_idx" ON "fee_structures" USING btree ("academic_year_id","class_id","section_id");