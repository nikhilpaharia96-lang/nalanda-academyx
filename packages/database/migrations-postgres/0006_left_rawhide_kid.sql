CREATE TABLE IF NOT EXISTS "book_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"book_id" text NOT NULL,
	"student_id" text NOT NULL,
	"status" text DEFAULT 'REQUESTED' NOT NULL,
	"requested_at" text NOT NULL,
	"issued_at" text,
	"due_date" text,
	"returned_at" text,
	"remarks" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "books" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"isbn" text,
	"category" text,
	"location" text,
	"total_copies" integer DEFAULT 1 NOT NULL,
	"available_copies" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "books_isbn_unique" UNIQUE("isbn")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hostel_allocations" (
	"id" text PRIMARY KEY NOT NULL,
	"hostel_id" text NOT NULL,
	"student_id" text NOT NULL,
	"room_number" text NOT NULL,
	"allocated_at" text NOT NULL,
	"vacated_at" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hostels" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"capacity" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "hostels_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "promotions" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"from_class_id" text NOT NULL,
	"from_section_id" text NOT NULL,
	"from_academic_year_id" text NOT NULL,
	"to_class_id" text,
	"to_section_id" text,
	"to_academic_year_id" text,
	"outcome" text NOT NULL,
	"promoted_by" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "time_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "time_slots_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "timetable_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"class_id" text NOT NULL,
	"section_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"time_slot_id" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"subject_id" text NOT NULL,
	"teacher_id" text,
	"room" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "book_requests" ADD CONSTRAINT "book_requests_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "book_requests" ADD CONSTRAINT "book_requests_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hostel_allocations" ADD CONSTRAINT "hostel_allocations_hostel_id_hostels_id_fk" FOREIGN KEY ("hostel_id") REFERENCES "public"."hostels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hostel_allocations" ADD CONSTRAINT "hostel_allocations_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "promotions" ADD CONSTRAINT "promotions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "promotions" ADD CONSTRAINT "promotions_from_class_id_classes_id_fk" FOREIGN KEY ("from_class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "promotions" ADD CONSTRAINT "promotions_from_section_id_sections_id_fk" FOREIGN KEY ("from_section_id") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "promotions" ADD CONSTRAINT "promotions_from_academic_year_id_academic_years_id_fk" FOREIGN KEY ("from_academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "promotions" ADD CONSTRAINT "promotions_to_class_id_classes_id_fk" FOREIGN KEY ("to_class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "promotions" ADD CONSTRAINT "promotions_to_section_id_sections_id_fk" FOREIGN KEY ("to_section_id") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "promotions" ADD CONSTRAINT "promotions_to_academic_year_id_academic_years_id_fk" FOREIGN KEY ("to_academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_time_slot_id_time_slots_id_fk" FOREIGN KEY ("time_slot_id") REFERENCES "public"."time_slots"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "book_requests_student_idx" ON "book_requests" USING btree ("student_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "book_requests_book_idx" ON "book_requests" USING btree ("book_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "books_title_idx" ON "books" USING btree ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hostel_alloc_student_idx" ON "hostel_allocations" USING btree ("student_id","vacated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hostel_alloc_hostel_idx" ON "hostel_allocations" USING btree ("hostel_id","vacated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promotions_student_idx" ON "promotions" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "timetable_slot_unique" ON "timetable_entries" USING btree ("class_id","section_id","academic_year_id","day_of_week","time_slot_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "timetable_teacher_idx" ON "timetable_entries" USING btree ("teacher_id","academic_year_id","day_of_week","time_slot_id");