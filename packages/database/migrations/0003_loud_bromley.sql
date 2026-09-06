ALTER TABLE `students` ADD `father_name` text;--> statement-breakpoint
ALTER TABLE `students` ADD `mother_name` text;--> statement-breakpoint
ALTER TABLE `students` ADD `phone` text;--> statement-breakpoint
ALTER TABLE `teachers` ADD `date_of_birth` text;--> statement-breakpoint
ALTER TABLE `teachers` ADD `gender` text;--> statement-breakpoint
ALTER TABLE `teachers` ADD `address` text;--> statement-breakpoint
ALTER TABLE `teachers` ADD `designation` text;--> statement-breakpoint
ALTER TABLE `users` ADD `must_change_password` integer DEFAULT false NOT NULL;