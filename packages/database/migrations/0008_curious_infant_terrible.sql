CREATE TABLE `certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`certificate_number` text NOT NULL,
	`type` text NOT NULL,
	`student_id` text NOT NULL,
	`issued_on` text NOT NULL,
	`purpose` text,
	`reason` text,
	`conduct` text,
	`date_of_leaving` text,
	`remarks` text,
	`snapshot` text NOT NULL,
	`status` text DEFAULT 'ISSUED' NOT NULL,
	`cancelled_reason` text,
	`issued_by_user_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `certificates_certificate_number_unique` ON `certificates` (`certificate_number`);--> statement-breakpoint
CREATE INDEX `certificates_student_idx` ON `certificates` (`student_id`,`type`,`status`);