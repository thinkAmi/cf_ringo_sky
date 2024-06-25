CREATE TABLE `feeds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`content` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`sns_id` text
);
