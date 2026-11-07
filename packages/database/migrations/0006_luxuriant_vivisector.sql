CREATE TABLE `book_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`student_id` text NOT NULL,
	`status` text DEFAULT 'REQUESTED' NOT NULL,
	`requested_at` text NOT NULL,
	`issued_at` text,
	`due_date` text,
	`returned_at` text,
	`remarks` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `books` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`author` text,
	`isbn` text,
	`category` text,
	`location` text,
	`total_copies` integer DEFAULT 1 NOT NULL,
	`available_copies` integer DEFAULT 1 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `hostel_allocations` (
	`id` text PRIMARY KEY NOT NULL,
	`hostel_id` text NOT NULL,
	`student_id` text NOT NULL,
	`room_number` text NOT NULL,
	`allocated_at` text NOT NULL,
	`vacated_at` text,
	FOREIGN KEY (`hostel_id`) REFERENCES `hostels`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `hostels` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`capacity` integer,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`from_class_id` text NOT NULL,
	`from_section_id` text NOT NULL,
	`from_academic_year_id` text NOT NULL,
	`to_class_id` text,
	`to_section_id` text,
	`to_academic_year_id` text,
	`outcome` text NOT NULL,
	`promoted_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`from_section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`from_academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `time_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `timetable_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`section_id` text NOT NULL,
	`academic_year_id` text NOT NULL,
	`time_slot_id` text NOT NULL,
	`day_of_week` integer NOT NULL,
	`subject_id` text NOT NULL,
	`teacher_id` text,
	`room` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`time_slot_id`) REFERENCES `time_slots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `book_requests_student_idx` ON `book_requests` (`student_id`,`status`);--> statement-breakpoint
CREATE INDEX `book_requests_book_idx` ON `book_requests` (`book_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `books_isbn_unique` ON `books` (`isbn`);--> statement-breakpoint
CREATE INDEX `books_title_idx` ON `books` (`title`);--> statement-breakpoint
CREATE INDEX `hostel_alloc_student_idx` ON `hostel_allocations` (`student_id`,`vacated_at`);--> statement-breakpoint
CREATE INDEX `hostel_alloc_hostel_idx` ON `hostel_allocations` (`hostel_id`,`vacated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `hostels_name_unique` ON `hostels` (`name`);--> statement-breakpoint
CREATE INDEX `promotions_student_idx` ON `promotions` (`student_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `time_slots_name_unique` ON `time_slots` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `timetable_slot_unique` ON `timetable_entries` (`class_id`,`section_id`,`academic_year_id`,`day_of_week`,`time_slot_id`);--> statement-breakpoint
CREATE INDEX `timetable_teacher_idx` ON `timetable_entries` (`teacher_id`,`academic_year_id`,`day_of_week`,`time_slot_id`);