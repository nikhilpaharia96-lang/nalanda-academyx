CREATE TABLE IF NOT EXISTS "concessions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"value" real NOT NULL,
	"fee_type" text,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "concessions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_concessions" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"concession_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"reason" text NOT NULL,
	"granted_by_user_id" text NOT NULL,
	"revoked_at" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_fee_concessions" (
	"id" text PRIMARY KEY NOT NULL,
	"student_fee_id" text NOT NULL,
	"concession_id" text NOT NULL,
	"original_amount" real NOT NULL,
	"discount_amount" real NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student_concessions" ADD CONSTRAINT "student_concessions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student_concessions" ADD CONSTRAINT "student_concessions_concession_id_concessions_id_fk" FOREIGN KEY ("concession_id") REFERENCES "public"."concessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student_concessions" ADD CONSTRAINT "student_concessions_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student_fee_concessions" ADD CONSTRAINT "student_fee_concessions_student_fee_id_student_fees_id_fk" FOREIGN KEY ("student_fee_id") REFERENCES "public"."student_fees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student_fee_concessions" ADD CONSTRAINT "student_fee_concessions_concession_id_concessions_id_fk" FOREIGN KEY ("concession_id") REFERENCES "public"."concessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "student_concessions_idx" ON "student_concessions" USING btree ("student_id","academic_year_id","revoked_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "student_fee_concessions_unique" ON "student_fee_concessions" USING btree ("student_fee_id","concession_id");