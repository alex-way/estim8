CREATE TABLE `room` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`name` text(32),
	`show_results` integer DEFAULT false NOT NULL,
	`selectable_choices` text NOT NULL,
	`allow_snooping` integer DEFAULT false NOT NULL,
	`allow_unknown` integer DEFAULT false NOT NULL,
	`admin_device_id` text(36) NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`name` text(32),
	`card_back` text(32),
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `room_user` (
	`room_id` text(36) NOT NULL,
	`device_id` text(36) NOT NULL,
	`choice` integer,
	`is_participant` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`device_id`, `room_id`)
);
