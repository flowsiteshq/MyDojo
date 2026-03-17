CREATE TABLE `enrollmentIntents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`planId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`stripeCheckoutSessionId` varchar(255),
	`status` enum('pending','processing','succeeded','failed','cancelled') NOT NULL DEFAULT 'pending',
	`paymentType` enum('deposit','full') NOT NULL DEFAULT 'deposit',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `enrollmentIntents_id` PRIMARY KEY(`id`),
	CONSTRAINT `enrollmentIntents_stripePaymentIntentId_unique` UNIQUE(`stripePaymentIntentId`),
	CONSTRAINT `enrollmentIntents_stripeCheckoutSessionId_unique` UNIQUE(`stripeCheckoutSessionId`)
);
--> statement-breakpoint
CREATE TABLE `guardians` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(320),
	`relationship` varchar(50),
	`isPrimary` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guardians_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int,
	`name` varchar(255) NOT NULL,
	`dateOfBirth` varchar(10),
	`age` int,
	`address` varchar(500),
	`city` varchar(100),
	`state` varchar(2),
	`zip` varchar(10),
	`emergencyContactName` varchar(255),
	`emergencyContactPhone` varchar(20),
	`program` enum('Little Ninjas','Dragon Kids','Teens','Adult Karate','Kickboxing','After School','Summer Camp') NOT NULL,
	`status` enum('pending','active','inactive','cancelled') NOT NULL DEFAULT 'pending',
	`location` varchar(255) NOT NULL DEFAULT 'Tomball HQ',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `waiverSignaturesV2` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`guardianId` int,
	`waiverVersion` varchar(20) NOT NULL,
	`signedAt` timestamp NOT NULL,
	`ipAddress` varchar(45),
	`acceptedLiability` int NOT NULL DEFAULT 1,
	`acceptedPhotoConsent` int NOT NULL DEFAULT 1,
	`signatureMethod` enum('digital','in-person') NOT NULL DEFAULT 'digital',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `waiverSignaturesV2_id` PRIMARY KEY(`id`)
);
