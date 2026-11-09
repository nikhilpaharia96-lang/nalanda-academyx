CREATE TABLE IF NOT EXISTS "certificates" (
	"id" text PRIMARY KEY NOT NULL,
	"certificate_number" text NOT NULL,
	"type" text NOT NULL,
	"student_id" text NOT NULL,
	"issued_on" text NOT NULL,
	"purpose" text,
	"reason" text,
	"conduct" text,
	"date_of_leaving" text,
	"remarks" text,
	"snapshot" text NOT NULL,
	"status" text DEFAULT 'ISSUED' NOT NULL,
	"cancelled_reason" text,
	"issued_by_user_id" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "certificates_certificate_number_unique" UNIQUE("certificate_number")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "certificates" ADD CONSTRAINT "certificates_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "certificates_student_idx" ON "certificates" USING btree ("student_id","type","status");