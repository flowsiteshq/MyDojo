ALTER TABLE `beltTestIntents` ADD `testingFor` varchar(50);--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `beltSeeking` varchar(100);--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `selfReflectionRatings` text;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `writtenAnswers` text;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `parentRatings` text;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `parentAnswers` text;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `parentRecommendation` varchar(20);--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `parentComments` text;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `blackBeltQuestion` text;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `studentPledgeAgreed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `parentCommitmentAgreed` int DEFAULT 0 NOT NULL;