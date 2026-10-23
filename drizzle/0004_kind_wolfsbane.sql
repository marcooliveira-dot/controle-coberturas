CREATE TABLE `coverage_finance` (
	`coverage_id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`rejection_reason` text DEFAULT '' NOT NULL,
	`paid_on` text,
	`updated_by` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`coverage_id`) REFERENCES `coverages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `finance_events` (
	`id` text PRIMARY KEY NOT NULL,
	`coverage_id` text NOT NULL,
	`action` text NOT NULL,
	`actor` text NOT NULL,
	`at` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`coverage_id`) REFERENCES `coverages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_finance_events_coverage` ON `finance_events` (`coverage_id`);