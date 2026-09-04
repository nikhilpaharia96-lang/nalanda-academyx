DROP INDEX IF EXISTS `fee_structures_idx`;--> statement-breakpoint
ALTER TABLE `extra_fees` ADD `paid_amount` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `fee_structures` ADD `section_id` text REFERENCES sections(id);--> statement-breakpoint
ALTER TABLE `payments` ADD `received_by_name` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `cheque_number` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `bank_name` text;--> statement-breakpoint
ALTER TABLE `student_fees` ADD `paid_amount` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `student_fees` ADD `waived_at` text;--> statement-breakpoint
ALTER TABLE `student_fees` ADD `waived_by` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `student_fees` ADD `waived_reason` text;--> statement-breakpoint
CREATE INDEX `fee_structures_idx` ON `fee_structures` (`academic_year_id`,`class_id`,`section_id`);--> statement-breakpoint
/*
 SQLite does not support "Creating foreign key on existing column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html

 Due to that we don't generate migration automatically and it has to be done manually
*/