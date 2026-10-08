CREATE TABLE `dashboard_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`monthly_limit_cents` integer DEFAULT 500000 NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` text NOT NULL
);
