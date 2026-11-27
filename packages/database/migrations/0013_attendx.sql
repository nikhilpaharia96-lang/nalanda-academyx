CREATE TABLE `attx_devices` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`public_key` text NOT NULL,
	`bound_at` text NOT NULL,
	`revoked_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attx_devices_key_unique` ON `attx_devices` (`public_key`);
--> statement-breakpoint
CREATE INDEX `attx_devices_student_idx` ON `attx_devices` (`student_id`);
--> statement-breakpoint
CREATE TABLE `attx_binding_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`code_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attx_binding_codes_hash_unique` ON `attx_binding_codes` (`code_hash`);
--> statement-breakpoint
CREATE TABLE `attx_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`class_id` text NOT NULL,
	`section_id` text NOT NULL,
	`academic_year_id` text NOT NULL,
	`subject_id` text,
	`started_at` text NOT NULL,
	`ended_at` text,
	`status` text NOT NULL,
	`qr_interval_sec` integer NOT NULL,
	`min_score` real NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `attx_sessions_open_idx` ON `attx_sessions` (`class_id`, `section_id`, `status`);
--> statement-breakpoint
CREATE TABLE `attx_session_secrets` (
	`session_id` text PRIMARY KEY NOT NULL,
	`qr_secret` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `attx_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `attx_checks` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`kind` text NOT NULL,
	`weight` integer NOT NULL,
	`code_digest` text,
	`opens_at` text NOT NULL,
	`closes_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `attx_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `attx_checks_session_idx` ON `attx_checks` (`session_id`);
--> statement-breakpoint
CREATE TABLE `attx_nonces` (
	`id` text PRIMARY KEY NOT NULL,
	`nonce` text NOT NULL,
	`check_id` text NOT NULL,
	`student_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`result` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`check_id`) REFERENCES `attx_checks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attx_nonces_nonce_unique` ON `attx_nonces` (`nonce`);
--> statement-breakpoint
CREATE INDEX `attx_nonces_attempt_idx` ON `attx_nonces` (`check_id`, `student_id`);
--> statement-breakpoint
CREATE TABLE `attx_slot_uses` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`student_id` text NOT NULL,
	`slot` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `attx_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attx_slot_uses_unique` ON `attx_slot_uses` (`session_id`, `student_id`, `slot`);
--> statement-breakpoint
CREATE TABLE `attx_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`check_id` text NOT NULL,
	`student_id` text NOT NULL,
	`device_id` text NOT NULL,
	`outcome` text NOT NULL,
	`flags` text NOT NULL,
	`latency_ms` integer,
	`submitted_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `attx_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`check_id`) REFERENCES `attx_checks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`device_id`) REFERENCES `attx_devices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attx_responses_unique` ON `attx_responses` (`check_id`, `student_id`);
--> statement-breakpoint
CREATE INDEX `attx_responses_session_idx` ON `attx_responses` (`session_id`);
--> statement-breakpoint
CREATE TABLE `attx_results` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`student_id` text NOT NULL,
	`proposed_status` text NOT NULL,
	`score` real NOT NULL,
	`flags` text NOT NULL,
	`final_status` text,
	`final_reason` text,
	`final_by` text,
	`final_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `attx_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attx_results_unique` ON `attx_results` (`session_id`, `student_id`);
