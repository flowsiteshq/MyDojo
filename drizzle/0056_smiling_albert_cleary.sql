CREATE TABLE `aiSmsCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('lead_followup','class_reminder','re_engagement','custom') NOT NULL,
	`messageTemplate` text NOT NULL,
	`targetFilter` json,
	`status` enum('draft','scheduled','running','completed','cancelled') NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`sentCount` int NOT NULL DEFAULT 0,
	`replyCount` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiSmsCampaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smsConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phone` varchar(20) NOT NULL,
	`contactName` varchar(255),
	`optedOut` boolean NOT NULL DEFAULT false,
	`aiEnabled` boolean NOT NULL DEFAULT true,
	`lastMessageAt` timestamp NOT NULL DEFAULT (now()),
	`unreadCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `smsConversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `smsConversations_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE TABLE `smsMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`direction` enum('inbound','outbound') NOT NULL,
	`senderType` enum('ai','human','campaign','member') NOT NULL,
	`body` text NOT NULL,
	`mediaUrls` json,
	`externalId` varchar(64),
	`status` enum('pending','sent','delivered','failed','received') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `smsMessages_id` PRIMARY KEY(`id`)
);
