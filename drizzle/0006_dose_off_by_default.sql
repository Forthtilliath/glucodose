PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`glycemia_unit` text DEFAULT 'mmol/L' NOT NULL,
	`target_glycemia` real,
	`sensitivity_factor` real,
	`show_insulin_dose` integer DEFAULT false NOT NULL,
	`widget_selected_container_id` integer,
	`widget_selected_food_id` integer,
	`theme_preference` text DEFAULT 'system' NOT NULL,
	`last_update_check_at` integer,
	`dismissed_update_version` text,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_settings`("id", "glycemia_unit", "target_glycemia", "sensitivity_factor", "show_insulin_dose", "widget_selected_container_id", "widget_selected_food_id", "theme_preference", "last_update_check_at", "dismissed_update_version", "updated_at") SELECT "id", "glycemia_unit", "target_glycemia", "sensitivity_factor", "show_insulin_dose", "widget_selected_container_id", "widget_selected_food_id", "theme_preference", "last_update_check_at", "dismissed_update_version", "updated_at" FROM `settings`;--> statement-breakpoint
DROP TABLE `settings`;--> statement-breakpoint
ALTER TABLE `__new_settings` RENAME TO `settings`;--> statement-breakpoint
-- Installation existante sans ligne de réglages : elle affichait la dose, on la garde.
INSERT OR IGNORE INTO `settings` (`id`, `show_insulin_dose`) SELECT 1, 1 WHERE EXISTS (SELECT 1 FROM `insulin_ratios`) OR EXISTS (SELECT 1 FROM `weighings`);--> statement-breakpoint
PRAGMA foreign_keys=ON;