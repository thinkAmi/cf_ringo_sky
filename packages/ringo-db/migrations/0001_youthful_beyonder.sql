CREATE TABLE `apples` (
	`name` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `apples_display_name_unique` ON `apples` (`display_name`);