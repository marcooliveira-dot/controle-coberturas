CREATE TABLE `finance_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`coverage_id` text NOT NULL,
	`filename` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`content` blob NOT NULL,
	`uploaded_by` text NOT NULL,
	`uploaded_at` text NOT NULL,
	FOREIGN KEY (`coverage_id`) REFERENCES `coverages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_finance_attachments_coverage` ON `finance_attachments` (`coverage_id`);