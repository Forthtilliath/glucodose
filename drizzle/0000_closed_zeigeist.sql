CREATE TABLE `containers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`tare_weight_g` real NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `foods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`carbs_per_100g` real NOT NULL,
	`total_weight_g` real,
	`total_carbs_g` real,
	`source` text,
	`notes` text,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `insulin_ratios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`carbs_grams_per_unit` real NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `recipe_components` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_food_id` integer NOT NULL,
	`component_food_id` integer NOT NULL,
	`weight_g` real NOT NULL,
	`carbs_g` real NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`recipe_food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`component_food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`glycemia_unit` text DEFAULT 'mmol/L' NOT NULL,
	`target_glycemia` real,
	`sensitivity_factor` real,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `weighings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`food_id` integer,
	`food_name_snapshot` text NOT NULL,
	`container_id` integer,
	`gross_weight_g` real NOT NULL,
	`tare_weight_g` real DEFAULT 0 NOT NULL,
	`net_weight_g` real NOT NULL,
	`carbs_per_100g_snapshot` real NOT NULL,
	`carbs_g` real NOT NULL,
	`ratio_id` integer,
	`ratio_label_snapshot` text,
	`carbs_grams_per_unit_snapshot` real,
	`meal_insulin_units` real NOT NULL,
	`glycemia_unit_snapshot` text,
	`current_glycemia` real,
	`target_glycemia_snapshot` real,
	`sensitivity_factor_snapshot` real,
	`correction_insulin_units` real DEFAULT 0 NOT NULL,
	`total_insulin_units` real NOT NULL,
	`weighed_at` text DEFAULT (current_timestamp) NOT NULL,
	`notes` text,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`container_id`) REFERENCES `containers`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`ratio_id`) REFERENCES `insulin_ratios`(`id`) ON UPDATE no action ON DELETE set null
);
