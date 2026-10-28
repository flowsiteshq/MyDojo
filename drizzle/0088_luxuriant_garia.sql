CREATE TABLE `billingPaymentAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollmentId` int NOT NULL,
	`userId` int NOT NULL,
	`provider` enum('stripe','fluidpay') NOT NULL,
	`amountCents` int NOT NULL,
	`outstandingSnapshotCents` int NOT NULL,
	`idempotencyKey` varchar(255) NOT NULL,
	`providerPaymentId` varchar(255),
	`providerInvoiceId` varchar(255),
	`status` enum('initiated','pending','succeeded','failed','canceled') NOT NULL DEFAULT 'initiated',
	`failureCode` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `billingPaymentAttempts_id` PRIMARY KEY(`id`),
	CONSTRAINT `billingPaymentAttempts_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
