CREATE TABLE IF NOT EXISTS "upi_bank_credits" (
	"id" text PRIMARY KEY NOT NULL,
	"utr" text NOT NULL,
	"amount" real NOT NULL,
	"entered_by" text NOT NULL,
	"claim_id" text,
	"matched_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "upi_bank_credits_utr_unique" UNIQUE("utr")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "upi_claims" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"student_fee_id" text,
	"extra_fee_id" text,
	"utr" text NOT NULL,
	"amount" real NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"note" text,
	"submitted_by" text NOT NULL,
	"payment_id" text,
	"matched_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "upi_claims_utr_unique" UNIQUE("utr")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "upi_bank_credits" ADD CONSTRAINT "upi_bank_credits_claim_id_upi_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."upi_claims"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "upi_claims" ADD CONSTRAINT "upi_claims_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "upi_claims" ADD CONSTRAINT "upi_claims_student_fee_id_student_fees_id_fk" FOREIGN KEY ("student_fee_id") REFERENCES "public"."student_fees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "upi_claims" ADD CONSTRAINT "upi_claims_extra_fee_id_extra_fees_id_fk" FOREIGN KEY ("extra_fee_id") REFERENCES "public"."extra_fees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "upi_claims" ADD CONSTRAINT "upi_claims_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "upi_claims_status_idx" ON "upi_claims" USING btree ("status");