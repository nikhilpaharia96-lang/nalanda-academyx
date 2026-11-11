CREATE TABLE `concessions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`value` real NOT NULL,
	`fee_type` text,
	`description` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `student_concessions` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`concession_id` text NOT NULL,
	`academic_year_id` text NOT NULL,
	`reason` text NOT NULL,
	`granted_by_user_id` text NOT NULL,
	`revoked_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`concession_id`) REFERENCES `concessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `student_fee_concessions` (
	`id` text PRIMARY KEY NOT NULL,
	`student_fee_id` text NOT NULL,
	`concession_id` text NOT NULL,
	`original_amount` real NOT NULL,
	`discount_amount` real NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`student_fee_id`) REFERENCES `student_fees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`concession_id`) REFERENCES `concessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `concessions_name_unique` ON `concessions` (`name`);--> statement-breakpoint
CREATE INDEX `student_concessions_idx` ON `student_concessions` (`student_id`,`academic_year_id`,`revoked_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `student_fee_concessions_unique` ON `student_fee_concessions` (`student_fee_id`,`concession_id`);