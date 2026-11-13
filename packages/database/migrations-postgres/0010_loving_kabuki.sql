CREATE TABLE IF NOT EXISTS "payslips" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"basic" real NOT NULL,
	"hra" real NOT NULL,
	"da" real NOT NULL,
	"other_allowances" real NOT NULL,
	"pf_percent" real NOT NULL,
	"professional_tax" real NOT NULL,
	"other_deductions" real NOT NULL,
	"working_days" real NOT NULL,
	"lop_days" real NOT NULL,
	"gross_earned" real NOT NULL,
	"pf_amount" real NOT NULL,
	"total_deductions" real NOT NULL,
	"net_pay" real NOT NULL,
	"status" text DEFAULT 'GENERATED' NOT NULL,
	"paid_on" text,
	"payment_mode" text,
	"payment_reference" text,
	"generated_by_user_id" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "salary_structures" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"basic" real NOT NULL,
	"hra" real DEFAULT 0 NOT NULL,
	"da" real DEFAULT 0 NOT NULL,
	"other_allowances" real DEFAULT 0 NOT NULL,
	"pf_percent" real DEFAULT 0 NOT NULL,
	"professional_tax" real DEFAULT 0 NOT NULL,
	"other_deductions" real DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "salary_structures_teacher_id_unique" UNIQUE("teacher_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff_attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"date" text NOT NULL,
	"status" text NOT NULL,
	"note" text,
	"marked_by_user_id" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payslips" ADD CONSTRAINT "payslips_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payslips_teacher_month_unique" ON "payslips" USING btree ("teacher_id","year","month");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "staff_attendance_unique" ON "staff_attendance" USING btree ("teacher_id","date");