CREATE TABLE `paymentFailures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollmentId` int NOT NULL,
	`fpTransactionId` varchar(255),
	`fpSubscriptionId` varchar(255),
	`amountCents` int,
	`failureReason` varchar(500),
	`retryCount` int NOT NULL DEFAULT 0,
	`emailSent` boolean NOT NULL DEFAULT false,
	`status` enum('open','resolved','written_off') NOT NULL DEFAULT 'open',
	`webhookEventId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentFailures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhookEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fpTransactionId` varchar(255),
	`eventType` varchar(100) NOT NULL,
	`eventStatus` varchar(100),
	`fpSubscriptionId` varchar(255),
	`fpCustomerId` varchar(255),
	`amountCents` int,
	`rawPayload` json,
	`signatureValid` boolean NOT NULL DEFAULT false,
	`processingStatus` enum('pending','processed','ignored','error') NOT NULL DEFAULT 'pending',
	`processingError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhookEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `dayPasses` ADD `paymentTransactionId` varchar(255);--> statement-breakpoint
ALTER TABLE `enrollments` ADD `fluidpayCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `enrollments` ADD `fluidpaySubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `membershipPackages` ADD `enrollmentFee` decimal(10,2) DEFAULT '99.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `membershipPackages` ADD `fluidpayPlanId` varchar(255);--> statement-breakpoint
ALTER TABLE `dayPasses` DROP COLUMN `stripePaymentIntentId`;