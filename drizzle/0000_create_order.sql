CREATE TABLE `order` (
	`id` text PRIMARY KEY NOT NULL,
	`tracking_id` text NOT NULL,
	`status` text DEFAULT 'received' NOT NULL,
	`panic` integer DEFAULT false NOT NULL,
	`order` text NOT NULL,
	`courier_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `order_tracking_id_unique` ON `order` (`tracking_id`);--> statement-breakpoint
CREATE INDEX `order_status_idx` ON `order` (`status`);--> statement-breakpoint
CREATE INDEX `order_tracking_id_idx` ON `order` (`tracking_id`);--> statement-breakpoint
CREATE INDEX `order_courier_id_idx` ON `order` (`courier_id`);