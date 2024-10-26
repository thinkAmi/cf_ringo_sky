CREATE TABLE `genealogies` (
	`child_name` text NOT NULL,
	`pollen_name` text NOT NULL,
	`seed_name` text NOT NULL,
	PRIMARY KEY(`child_name`, `pollen_name`, `seed_name`),
	FOREIGN KEY (`child_name`) REFERENCES `apples`(`name`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`pollen_name`) REFERENCES `apples`(`name`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`seed_name`) REFERENCES `apples`(`name`) ON UPDATE no action ON DELETE no action
);
