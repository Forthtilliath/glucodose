ALTER TABLE `settings` ADD `theme_preference` text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `last_update_check_at` integer;--> statement-breakpoint
ALTER TABLE `settings` ADD `dismissed_update_version` text;