ALTER TABLE `smsConversations` ADD `bookingState` enum('idle','awaiting_name','awaiting_program','awaiting_time','confirmed') DEFAULT 'idle';--> statement-breakpoint
ALTER TABLE `smsConversations` ADD `bookingName` varchar(255);--> statement-breakpoint
ALTER TABLE `smsConversations` ADD `bookingProgram` varchar(100);--> statement-breakpoint
ALTER TABLE `smsConversations` ADD `bookingPreferredTime` varchar(255);