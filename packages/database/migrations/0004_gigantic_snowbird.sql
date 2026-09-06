CREATE TABLE `store_bundle_items` (
	`id` text PRIMARY KEY NOT NULL,
	`bundle_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`bundle_id`) REFERENCES `store_bundles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `store_products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `store_bundles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`class_id` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `store_cart_items` (
	`id` text PRIMARY KEY NOT NULL,
	`cart_id` text NOT NULL,
	`product_id` text NOT NULL,
	`variant_id` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`cart_id`) REFERENCES `store_carts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `store_products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variant_id`) REFERENCES `store_product_variants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `store_carts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`student_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `store_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`icon` text,
	`display_order` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `store_coupons` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`discount_type` text NOT NULL,
	`discount_value` real NOT NULL,
	`min_order_amount` real,
	`max_uses` integer,
	`used_count` integer DEFAULT 0 NOT NULL,
	`valid_from` text,
	`valid_until` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `store_inventory_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`variant_id` text,
	`type` text NOT NULL,
	`quantity_change` integer NOT NULL,
	`stock_after` integer NOT NULL,
	`reserved_after` integer NOT NULL,
	`note` text,
	`order_id` text,
	`actor_user_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `store_products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variant_id`) REFERENCES `store_product_variants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `store_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `store_order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`variant_id` text,
	`product_name` text NOT NULL,
	`variant_label` text,
	`sku` text,
	`unit_price` real NOT NULL,
	`quantity` integer NOT NULL,
	`line_discount` real DEFAULT 0 NOT NULL,
	`line_total` real NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `store_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `store_products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`variant_id`) REFERENCES `store_product_variants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `store_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`user_id` text NOT NULL,
	`student_id` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`payment_status` text DEFAULT 'PENDING' NOT NULL,
	`subtotal` real NOT NULL,
	`discount_amount` real DEFAULT 0 NOT NULL,
	`delivery_fee` real DEFAULT 0 NOT NULL,
	`total_amount` real NOT NULL,
	`coupon_id` text,
	`fulfillment_method` text DEFAULT 'PICKUP' NOT NULL,
	`contact_phone` text,
	`contact_address` text,
	`notes` text,
	`payment_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`coupon_id`) REFERENCES `store_coupons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `store_product_classes` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`class_id` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `store_products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `store_product_images` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`image_url` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `store_products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `store_product_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`label` text NOT NULL,
	`attributes` text,
	`sku` text,
	`price_override` real,
	`sale_price_override` real,
	`stock_quantity` integer DEFAULT 0 NOT NULL,
	`reserved_quantity` integer DEFAULT 0 NOT NULL,
	`low_stock_threshold` integer DEFAULT 5 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `store_products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `store_products` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`sku` text,
	`description` text,
	`price` real NOT NULL,
	`sale_price` real,
	`image_url` text,
	`required` integer DEFAULT false NOT NULL,
	`has_variants` integer DEFAULT false NOT NULL,
	`stock_quantity` integer DEFAULT 0 NOT NULL,
	`reserved_quantity` integer DEFAULT 0 NOT NULL,
	`low_stock_threshold` integer DEFAULT 5 NOT NULL,
	`academic_year_id` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `store_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `payments` ADD `store_order_id` text REFERENCES store_orders(id);--> statement-breakpoint
CREATE INDEX `store_cart_items_cart_idx` ON `store_cart_items` (`cart_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `store_carts_user_student_unique` ON `store_carts` (`user_id`,`student_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `store_categories_name_unique` ON `store_categories` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `store_categories_slug_unique` ON `store_categories` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `store_coupons_code_unique` ON `store_coupons` (`code`);--> statement-breakpoint
CREATE INDEX `store_inventory_tx_product_idx` ON `store_inventory_transactions` (`product_id`);--> statement-breakpoint
CREATE INDEX `store_order_items_order_idx` ON `store_order_items` (`order_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `store_orders_order_number_unique` ON `store_orders` (`order_number`);--> statement-breakpoint
CREATE INDEX `store_orders_student_idx` ON `store_orders` (`student_id`);--> statement-breakpoint
CREATE INDEX `store_orders_user_idx` ON `store_orders` (`user_id`);--> statement-breakpoint
CREATE INDEX `store_orders_status_idx` ON `store_orders` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `store_product_classes_unique` ON `store_product_classes` (`product_id`,`class_id`);--> statement-breakpoint
CREATE INDEX `store_product_classes_class_idx` ON `store_product_classes` (`class_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `store_product_variants_sku_unique` ON `store_product_variants` (`sku`);--> statement-breakpoint
CREATE INDEX `store_product_variants_product_idx` ON `store_product_variants` (`product_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `store_products_slug_unique` ON `store_products` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `store_products_sku_unique` ON `store_products` (`sku`);--> statement-breakpoint
CREATE INDEX `store_products_category_idx` ON `store_products` (`category_id`);--> statement-breakpoint
CREATE INDEX `store_products_status_idx` ON `store_products` (`status`);