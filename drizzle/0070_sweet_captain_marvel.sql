ALTER TABLE `popupLeads` ADD `confirmationSmsSentAt` timestamp;--> statement-breakpoint
ALTER TABLE `popupLeads` ADD `confirmationSmsMessageId` varchar(255);--> statement-breakpoint
ALTER TABLE `popupLeads` ADD `confirmationSmsError` text;--> statement-breakpoint
ALTER TABLE `trialSignups` ADD `confirmationSmsSentAt` timestamp;--> statement-breakpoint
ALTER TABLE `trialSignups` ADD `confirmationSmsMessageId` varchar(255);--> statement-breakpoint
ALTER TABLE `trialSignups` ADD `confirmationSmsError` text;--> statement-breakpoint
