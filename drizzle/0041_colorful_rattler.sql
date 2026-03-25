CREATE TABLE `promoCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` varchar(255) NOT NULL,
	`discountType` enum('percent','fixed','waive_down_payment') NOT NULL DEFAULT 'percent',
	`discountValue` decimal(10,2) NOT NULL DEFAULT '0.00',
	`maxUses` int,
	`usedCount` int NOT NULL DEFAULT 0,
	`expiresAt` bigint,
	`active` int NOT NULL DEFAULT 1,
	`createdBy` varchar(255) NOT NULL DEFAULT 'admin',
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `promoCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `promoCodes_code_unique` UNIQUE(`code`)
);
