CREATE TABLE `chatbotConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`identifier` varchar(320) NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`phone` varchar(20),
	`program` varchar(100),
	`currentStep` varchar(50) NOT NULL DEFAULT 'greeting',
	`conversationHistory` text,
	`completed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatbotConversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `chatbotConversations_identifier_unique` UNIQUE(`identifier`)
);
--> statement-breakpoint
CREATE TABLE `notificationHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` enum('classUpdates','scheduleChanges','specialEvents','promotions','generalNews') NOT NULL,
	`isRead` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `notificationHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`classUpdates` int NOT NULL DEFAULT 1,
	`scheduleChanges` int NOT NULL DEFAULT 1,
	`specialEvents` int NOT NULL DEFAULT 1,
	`promotions` int NOT NULL DEFAULT 1,
	`generalNews` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notificationPreferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `pushSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pushSubscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberName` varchar(255) NOT NULL,
	`memberPhoto` text,
	`program` enum('Little Ninjas','Core Kids','Teens','Adults','Kickboxing','After School') NOT NULL,
	`rating` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`memberSince` varchar(100),
	`featured` int NOT NULL DEFAULT 0,
	`isApproved` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `testimonials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trialSignups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`program` enum('Little Ninjas','Core Kids','Teens','Adults','Kickboxing','After School','Not Sure') NOT NULL,
	`location` varchar(255) NOT NULL,
	`preferredContactMethod` enum('email','phone','text') NOT NULL DEFAULT 'email',
	`message` text,
	`status` enum('new','contacted','scheduled','completed','cancelled') NOT NULL DEFAULT 'new',
	`source` varchar(100) NOT NULL DEFAULT 'chatbot',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trialSignups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255),
	`name` text,
	`loginMethod` varchar(64) NOT NULL DEFAULT 'email',
	`openId` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`emailVerified` int NOT NULL DEFAULT 0,
	`resetToken` varchar(255),
	`resetTokenExpiry` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
