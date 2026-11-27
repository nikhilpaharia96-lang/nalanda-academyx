CREATE TABLE IF NOT EXISTS "attx_devices" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"public_key" text NOT NULL,
	"bound_at" text NOT NULL,
	"revoked_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attx_devices" ADD CONSTRAINT "attx_devices_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "attx_devices_key_unique" ON "attx_devices" USING btree ("public_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attx_devices_student_idx" ON "attx_devices" USING btree ("student_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attx_binding_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" text NOT NULL,
	"used_at" text,
	"created_by" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attx_binding_codes" ADD CONSTRAINT "attx_binding_codes_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "attx_binding_codes_hash_unique" ON "attx_binding_codes" USING btree ("code_hash");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attx_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"class_id" text NOT NULL,
	"section_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"subject_id" text,
	"started_at" text NOT NULL,
	"ended_at" text,
	"status" text NOT NULL,
	"qr_interval_sec" integer NOT NULL,
	"min_score" real NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attx_sessions" ADD CONSTRAINT "attx_sessions_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attx_sessions" ADD CONSTRAINT "attx_sessions_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attx_sessions" ADD CONSTRAINT "attx_sessions_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attx_sessions" ADD CONSTRAINT "attx_sessions_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attx_sessions" ADD CONSTRAINT "attx_sessions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attx_sessions_open_idx" ON "attx_sessions" USING btree ("class_id", "section_id", "status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attx_session_secrets" (
	"session_id" text PRIMARY KEY NOT NULL,
	"qr_secret" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attx_session_secrets" ADD CONSTRAINT "attx_session_secrets_session_id_attx_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."attx_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attx_checks" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"kind" text NOT NULL,
	"weight" integer NOT NULL,
	"code_digest" text,
	"opens_at" text NOT NULL,
	"closes_at" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attx_checks" ADD CONSTRAINT "attx_checks_session_id_attx_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."attx_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attx_checks_session_idx" ON "attx_checks" USING btree ("session_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attx_nonces" (
	"id" text PRIMARY KEY NOT NULL,
	"nonce" text NOT NULL,
	"check_id" text NOT NULL,
	"student_id" text NOT NULL,
	"expires_at" text NOT NULL,
	"used_at" text,
	"result" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attx_nonces" ADD CONSTRAINT "attx_nonces_check_id_attx_checks_id_fk" FOREIGN KEY ("check_id") REFERENCES "public"."attx_checks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attx_nonces" ADD CONSTRAINT "attx_nonces_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "attx_nonces_nonce_unique" ON "attx_nonces" USING btree ("nonce");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attx_nonces_attempt_idx" ON "attx_nonces" USING btree ("check_id", "student_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attx_slot_uses" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"student_id" text NOT NULL,
	"slot" integer NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attx_slot_uses" ADD CONSTRAINT "attx_slot_uses_session_id_attx_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."attx_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attx_slot_uses" ADD CONSTRAINT "attx_slot_uses_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "attx_slot_uses_unique" ON "attx_slot_uses" USING btree ("session_id", "student_id", "slot");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attx_responses" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"check_id" text NOT NULL,
	"student_id" text NOT NULL,
	"device_id" text NOT NULL,
	"outcome" text NOT NULL,
	"flags" text NOT NULL,
	"latency_ms" integer,
	"submitted_at" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attx_responses" ADD CONSTRAINT "attx_responses_session_id_attx_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."attx_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attx_responses" ADD CONSTRAINT "attx_responses_check_id_attx_checks_id_fk" FOREIGN KEY ("check_id") REFERENCES "public"."attx_checks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attx_responses" ADD CONSTRAINT "attx_responses_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attx_responses" ADD CONSTRAINT "attx_responses_device_id_attx_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."attx_devices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "attx_responses_unique" ON "attx_responses" USING btree ("check_id", "student_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attx_responses_session_idx" ON "attx_responses" USING btree ("session_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attx_results" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"student_id" text NOT NULL,
	"proposed_status" text NOT NULL,
	"score" real NOT NULL,
	"flags" text NOT NULL,
	"final_status" text,
	"final_reason" text,
	"final_by" text,
	"final_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attx_results" ADD CONSTRAINT "attx_results_session_id_attx_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."attx_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attx_results" ADD CONSTRAINT "attx_results_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "attx_results_unique" ON "attx_results" USING btree ("session_id", "student_id");
