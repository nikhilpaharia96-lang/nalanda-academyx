ALTER TABLE "students" ADD COLUMN "father_name" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "mother_name" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "date_of_birth" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "designation" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "must_change_password" boolean DEFAULT false NOT NULL;