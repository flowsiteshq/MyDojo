CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` varchar(255) NOT NULL,
	`clientMessageId` varchar(255),
	`direction` enum('inbound','outbound') NOT NULL,
	`channel` enum('web','sms','voice') NOT NULL DEFAULT 'web',
	`content` text NOT NULL,
	`status` enum('queued','sent','delivered','read') NOT NULL DEFAULT 'queued',
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`readAt` timestamp,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
