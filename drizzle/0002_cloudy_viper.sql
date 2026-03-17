ALTER TABLE `trialSignups` MODIFY COLUMN `email` varchar(320);--> statement-breakpoint
ALTER TABLE `trialSignups` MODIFY COLUMN `preferredContactMethod` enum('email','phone','text') NOT NULL DEFAULT 'phone';--> statement-breakpoint
ALTER TABLE `trialSignups` ADD `segment` enum('Kids 3-5','Kids 6-12','Teens','Adults','Not sure');--> statement-breakpoint
ALTER TABLE `trialSignups` ADD `goal` enum('Confidence','Discipline','Fitness','Self-defense','Bullying help','Weight loss');--> statement-breakpoint
ALTER TABLE `trialSignups` ADD `preferredDays` enum('Weekdays','Weekends','Either');--> statement-breakpoint
ALTER TABLE `trialSignups` ADD `scheduledTime` timestamp;