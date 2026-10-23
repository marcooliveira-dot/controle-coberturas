ALTER TABLE `coverages` ADD `worked_dates` text;--> statement-breakpoint
ALTER TABLE `coverages` ADD `doubled_dates` text DEFAULT '[]' NOT NULL;