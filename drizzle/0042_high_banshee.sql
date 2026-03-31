CREATE TABLE `familyKickboxingAddOns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyGroupId` int NOT NULL,
	`memberName` varchar(255) NOT NULL,
	`memberEmail` varchar(320) NOT NULL,
	`memberPhone` varchar(20),
	`monthlyAmount` decimal(10,2) NOT NULL DEFAULT '49.00',
	`fluidpayCustomerId` varchar(255),
	`fluidpaySubscriptionId` varchar(255),
	`firstChargeTransactionId` varchar(255),
	`status` enum('active','cancelled','paused') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `familyKickboxingAddOns_id` PRIMARY KEY(`id`)
);
