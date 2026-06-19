CREATE TABLE `bucksRedemptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bucksAmount` int NOT NULL,
	`itemDescription` text NOT NULL,
	`status` enum('pending','approved','fulfilled','rejected') NOT NULL DEFAULT 'pending',
	`adminNotes` text,
	`processedByUserId` int,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bucksRedemptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mydojoBucksAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balance` int NOT NULL DEFAULT 0,
	`totalEarned` int NOT NULL DEFAULT 0,
	`totalRedeemed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mydojoBucksAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `mydojoBucksAccounts_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `mydojoBucksTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`type` enum('referral_earn','redemption','manual_adjust','bonus') NOT NULL,
	`description` text NOT NULL,
	`enrollmentId` int,
	`referralId` int,
	`redemptionId` int,
	`adminUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mydojoBucksTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referralCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`totalReferrals` int NOT NULL DEFAULT 0,
	`totalBucksEarned` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referralCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `referralCodes_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `referralCodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`referralCodeId` int NOT NULL,
	`referredName` varchar(255) NOT NULL,
	`referredPhone` varchar(20),
	`referredEmail` varchar(320),
	`status` enum('pending','enrolled','expired') NOT NULL DEFAULT 'pending',
	`bucksAwarded` int NOT NULL DEFAULT 0,
	`enrollmentId` int,
	`bucksAwardedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);
