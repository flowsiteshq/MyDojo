CREATE TABLE `chatbotConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`identifier` varchar(320) NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`phone` varchar(20),
	`program` varchar(100),
	`currentStep` varchar(50) NOT NULL DEFAULT 'greeting',
	`conversationHistory` json DEFAULT ('[]'),
	`completed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatbotConversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `chatbotConversations_identifier_unique` UNIQUE(`identifier`)
);
