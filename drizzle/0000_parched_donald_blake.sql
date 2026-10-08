CREATE TABLE `processing_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`total_images` integer NOT NULL,
	`processed_images` integer DEFAULT 0 NOT NULL,
	`failed_images` integer DEFAULT 0 NOT NULL,
	`extracted_transactions` integer DEFAULT 0 NOT NULL,
	`error_message` text,
	`image_urls` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`unique_id` text NOT NULL,
	`bundle_size_gb` real NOT NULL,
	`price_kobo` integer NOT NULL,
	`phone_number` text NOT NULL,
	`carrier` text NOT NULL,
	`status` text NOT NULL,
	`transaction_date` integer NOT NULL,
	`raw_response` text,
	`portal_name` text,
	`processed_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`image_url` text,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `jobs_tenant_idx` ON `processing_jobs` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `jobs_user_idx` ON `processing_jobs` (`user_id`);--> statement-breakpoint
CREATE INDEX `transactions_tenant_idx` ON `transactions` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `transactions_unique_id_idx` ON `transactions` (`unique_id`);--> statement-breakpoint
CREATE INDEX `transactions_tenant_unique_idx` ON `transactions` (`tenant_id`,`unique_id`);--> statement-breakpoint
CREATE INDEX `transactions_date_idx` ON `transactions` (`transaction_date`);--> statement-breakpoint
CREATE INDEX `users_tenant_idx` ON `users` (`tenant_id`);