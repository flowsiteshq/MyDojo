CREATE TABLE `introOfferPurchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(30),
	`packageId` enum('starter','explorer') NOT NULL,
	`amountCents` int NOT NULL,
	`classesIncluded` int NOT NULL,
	`classesRemaining` int NOT NULL,
	`fpTransactionId` varchar(255),
	`status` enum('pending','paid','failed') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `introOfferPurchases_id` PRIMARY KEY(`id`)
);
