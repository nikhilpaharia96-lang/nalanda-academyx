CREATE TABLE `upi_bank_credits` (
	`id` text PRIMARY KEY NOT NULL,
	`utr` text NOT NULL,
	`amount` real NOT NULL,
	`entered_by` text NOT NULL,
	`claim_id` text,
	`matched_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`claim_id`) REFERENCES `upi_claims`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `upi_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`student_fee_id` text,
	`extra_fee_id` text,
	`utr` text NOT NULL,
	`amount` real NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`note` text,
	`submitted_by` text NOT NULL,
	`payment_id` text,
	`matched_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_fee_id`) REFERENCES `student_fees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`extra_fee_id`) REFERENCES `extra_fees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `upi_bank_credits_utr_unique` ON `upi_bank_credits` (`utr`);--> statement-breakpoint
CREATE UNIQUE INDEX `upi_claims_utr_unique` ON `upi_claims` (`utr`);--> statement-breakpoint
CREATE INDEX `upi_claims_status_idx` ON `upi_claims` (`status`);