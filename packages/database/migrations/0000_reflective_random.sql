CREATE TABLE `academic_years` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`active` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `admission_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`application_number` text NOT NULL,
	`student_name` text NOT NULL,
	`date_of_birth` text NOT NULL,
	`gender` text NOT NULL,
	`class_id` text NOT NULL,
	`previous_school` text,
	`parent_name` text NOT NULL,
	`parent_phone` text NOT NULL,
	`parent_email` text,
	`address` text,
	`status` text DEFAULT 'SUBMITTED' NOT NULL,
	`payment_status` text DEFAULT 'PENDING' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `admission_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`name` text NOT NULL,
	`file_url` text NOT NULL,
	`file_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `admission_applications`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`class_id` text NOT NULL,
	`section_id` text NOT NULL,
	`academic_year_id` text NOT NULL,
	`date` text NOT NULL,
	`status` text NOT NULL,
	`remarks` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text,
	`description` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'NEW' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`student_id` text,
	`name` text NOT NULL,
	`file_url` text NOT NULL,
	`file_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`category` text NOT NULL,
	`visibility` text DEFAULT 'PRIVATE' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `event_images` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`image_url` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`date` text NOT NULL,
	`time` text,
	`location` text,
	`featured` integer DEFAULT false NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`cover_image_url` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `extra_fees` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text,
	`class_id` text,
	`section_id` text,
	`title` text NOT NULL,
	`description` text,
	`amount` real NOT NULL,
	`due_date` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `facilities` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`image_url` text,
	`display_order` integer DEFAULT 0 NOT NULL,
	`published` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `faculty` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`photo_url` text,
	`designation` text NOT NULL,
	`subject` text,
	`department` text,
	`qualification` text,
	`bio` text,
	`featured` integer DEFAULT false NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fee_structures` (
	`id` text PRIMARY KEY NOT NULL,
	`academic_year_id` text NOT NULL,
	`class_id` text NOT NULL,
	`fee_type` text NOT NULL,
	`amount` real NOT NULL,
	`frequency` text NOT NULL,
	`due_day` integer DEFAULT 10 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`description` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notices` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`content` text NOT NULL,
	`category` text NOT NULL,
	`important` integer DEFAULT false NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`attachment_url` text,
	`published_at` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient_user_id` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`type` text NOT NULL,
	`read_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`recipient_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `parent_students` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text NOT NULL,
	`student_id` text NOT NULL,
	`relationship` text NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `parents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`address` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `payment_receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`payment_id` text NOT NULL,
	`receipt_number` text NOT NULL,
	`receipt_url` text,
	`generated_at` text NOT NULL,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text,
	`admission_application_id` text,
	`student_fee_id` text,
	`extra_fee_id` text,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'INR' NOT NULL,
	`payment_type` text NOT NULL,
	`gateway` text NOT NULL,
	`order_id` text,
	`payment_id` text,
	`transaction_id` text,
	`method` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`collected_by` text,
	`reference_note` text,
	`paid_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`admission_application_id`) REFERENCES `admission_applications`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_fee_id`) REFERENCES `student_fees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`extra_fee_id`) REFERENCES `extra_fees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`revoked` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `result_years` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`academic_year_id` text,
	`total_students` integer DEFAULT 0 NOT NULL,
	`appeared` integer DEFAULT 0 NOT NULL,
	`passed` integer DEFAULT 0 NOT NULL,
	`pass_percentage` real DEFAULT 0 NOT NULL,
	`distinction` integer DEFAULT 0 NOT NULL,
	`star_marks` integer DEFAULT 0 NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sections` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `student_fees` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`fee_structure_id` text NOT NULL,
	`academic_year_id` text NOT NULL,
	`month` integer,
	`year` integer NOT NULL,
	`amount` real NOT NULL,
	`due_date` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`fee_structure_id`) REFERENCES `fee_structures`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `student_results` (
	`id` text PRIMARY KEY NOT NULL,
	`result_year_id` text NOT NULL,
	`student_id` text,
	`student_name` text NOT NULL,
	`percentage` real NOT NULL,
	`grade` text,
	`achievement` text,
	`image_url` text,
	FOREIGN KEY (`result_year_id`) REFERENCES `result_years`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`student_id` text NOT NULL,
	`admission_number` text NOT NULL,
	`name` text NOT NULL,
	`photo_url` text,
	`date_of_birth` text NOT NULL,
	`gender` text NOT NULL,
	`class_id` text NOT NULL,
	`section_id` text NOT NULL,
	`academic_year_id` text NOT NULL,
	`roll_number` text NOT NULL,
	`admission_date` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`address` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `teacher_class_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`class_id` text NOT NULL,
	`section_id` text NOT NULL,
	`subject` text NOT NULL,
	`academic_year_id` text NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `teachers` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`name` text NOT NULL,
	`photo_url` text,
	`subject` text,
	`department` text,
	`qualification` text,
	`phone` text,
	`email` text,
	`joining_date` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`last_login_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academic_years_name_unique` ON `academic_years` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `admission_applications_application_number_unique` ON `admission_applications` (`application_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `attendance_unique` ON `attendance` (`student_id`,`date`,`class_id`,`section_id`,`academic_year_id`);--> statement-breakpoint
CREATE INDEX `attendance_date_idx` ON `attendance` (`class_id`,`section_id`,`date`);--> statement-breakpoint
CREATE INDEX `audit_logs_entity_idx` ON `audit_logs` (`entity`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_user_idx` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `classes_name_unique` ON `classes` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `events_slug_unique` ON `events` (`slug`);--> statement-breakpoint
CREATE INDEX `fee_structures_idx` ON `fee_structures` (`academic_year_id`,`class_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `notices_slug_unique` ON `notices` (`slug`);--> statement-breakpoint
CREATE INDEX `notifications_recipient_idx` ON `notifications` (`recipient_user_id`,`read_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `parent_student_unique` ON `parent_students` (`parent_id`,`student_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `parents_user_id_unique` ON `parents` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_receipts_payment_id_unique` ON `payment_receipts` (`payment_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_receipts_receipt_number_unique` ON `payment_receipts` (`receipt_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_order_id_unique` ON `payments` (`order_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_payment_id_unique` ON `payments` (`payment_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_transaction_id_unique` ON `payments` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `payments_student_idx` ON `payments` (`student_id`);--> statement-breakpoint
CREATE INDEX `payments_status_idx` ON `payments` (`status`);--> statement-breakpoint
CREATE INDEX `refresh_tokens_user_idx` ON `refresh_tokens` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `result_years_year_unique` ON `result_years` (`year`);--> statement-breakpoint
CREATE UNIQUE INDEX `sections_class_name_unique` ON `sections` (`class_id`,`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `student_fees_unique` ON `student_fees` (`student_id`,`fee_structure_id`,`month`,`year`);--> statement-breakpoint
CREATE INDEX `student_fees_status_idx` ON `student_fees` (`student_id`,`status`);--> statement-breakpoint
CREATE INDEX `student_results_idx` ON `student_results` (`result_year_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `students_user_id_unique` ON `students` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `students_student_id_unique` ON `students` (`student_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `students_admission_number_unique` ON `students` (`admission_number`);--> statement-breakpoint
CREATE INDEX `students_class_section_idx` ON `students` (`class_id`,`section_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `students_roll_unique` ON `students` (`roll_number`,`class_id`,`section_id`,`academic_year_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `tca_unique` ON `teacher_class_assignments` (`teacher_id`,`class_id`,`section_id`,`subject`,`academic_year_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `teachers_user_id_unique` ON `teachers` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `teachers_employee_id_unique` ON `teachers` (`employee_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_unique` ON `users` (`phone`);