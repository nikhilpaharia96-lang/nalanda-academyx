CREATE TABLE `homework` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`section_id` text NOT NULL,
	`academic_year_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`teacher_id` text,
	`title` text NOT NULL,
	`description` text,
	`due_date` text NOT NULL,
	`created_by_user_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `leave_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`from_date` text NOT NULL,
	`to_date` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`applied_by_user_id` text NOT NULL,
	`reviewed_by_user_id` text,
	`review_note` text,
	`reviewed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `transport_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`route_id` text NOT NULL,
	`stop_id` text,
	`started_at` text NOT NULL,
	`ended_at` text,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`route_id`) REFERENCES `transport_routes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`stop_id`) REFERENCES `transport_stops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transport_routes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`vehicle_number` text,
	`driver_name` text,
	`driver_phone` text,
	`monthly_fee` real,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transport_stops` (
	`id` text PRIMARY KEY NOT NULL,
	`route_id` text NOT NULL,
	`name` text NOT NULL,
	`pickup_time` text,
	`stop_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`route_id`) REFERENCES `transport_routes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `homework_class_idx` ON `homework` (`class_id`,`section_id`,`due_date`);--> statement-breakpoint
CREATE INDEX `leave_student_idx` ON `leave_requests` (`student_id`,`status`);--> statement-breakpoint
CREATE INDEX `transport_assign_student_idx` ON `transport_assignments` (`student_id`,`ended_at`);--> statement-breakpoint
CREATE INDEX `transport_assign_route_idx` ON `transport_assignments` (`route_id`,`ended_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `transport_routes_name_unique` ON `transport_routes` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `transport_stops_route_name_unique` ON `transport_stops` (`route_id`,`name`);