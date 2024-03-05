CREATE TABLE `rooms` (
	`id` text(128) PRIMARY KEY NOT NULL,
	`state` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
