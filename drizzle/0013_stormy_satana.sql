ALTER TABLE `conversationStates` ADD `enrollmentState` text;--> statement-breakpoint
ALTER TABLE `conversationStates` ADD `intakeComplete` int DEFAULT 0 NOT NULL;