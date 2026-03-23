CREATE TABLE `familyGroupMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyGroupId` int NOT NULL,
	`enrollmentId` int NOT NULL,
	`memberOrder` int NOT NULL DEFAULT 1,
	`hasDiscount` int NOT NULL DEFAULT 0,
	`discountedMonthlyAmount` decimal(10,2),
	`originalMonthlyAmount` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `familyGroupMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `familyGroups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`primaryContactName` varchar(255) NOT NULL,
	`primaryContactEmail` varchar(255) NOT NULL,
	`primaryContactPhone` varchar(20),
	`registrationFeePaid` int NOT NULL DEFAULT 0,
	`registrationFeeTransactionId` varchar(255),
	`registrationFeeAmount` decimal(10,2) DEFAULT '99.00',
	`registrationFeePaidAt` timestamp,
	`fluidpayCustomerId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `familyGroups_id` PRIMARY KEY(`id`)
);
