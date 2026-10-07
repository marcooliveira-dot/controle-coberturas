CREATE TABLE `coverages` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`owner_name` text NOT NULL,
	`owner_email` text NOT NULL,
	`created_at` text NOT NULL,
	`name` text NOT NULL,
	`cpf` text NOT NULL,
	`operation` text NOT NULL,
	`start` text NOT NULL,
	`end` text NOT NULL,
	`month` text NOT NULL,
	`weekdays` text NOT NULL,
	`justification` text NOT NULL,
	`details` text NOT NULL,
	`pix` text NOT NULL,
	`third_party` text NOT NULL,
	`daily_cents` integer NOT NULL,
	`days` integer NOT NULL,
	`total_cents` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_coverages_owner_month` ON `coverages` (`owner_id`,`month`);--> statement-breakpoint
CREATE INDEX `idx_coverages_month` ON `coverages` (`month`);--> statement-breakpoint
CREATE TABLE `members` (
	`email` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`primary_admin` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_user_id_unique` ON `members` (`user_id`);