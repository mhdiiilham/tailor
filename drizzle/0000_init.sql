CREATE TABLE `applications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`profile_id` integer NOT NULL,
	`company` text NOT NULL,
	`role` text NOT NULL,
	`jd_text` text NOT NULL,
	`job` text NOT NULL,
	`fit` text NOT NULL,
	`questions` text NOT NULL,
	`answers` text,
	`resume` text,
	`pdf_path` text,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`data` text NOT NULL,
	`updated_at` integer NOT NULL
);
