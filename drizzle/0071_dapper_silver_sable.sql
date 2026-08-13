CREATE TABLE `shopOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stripeSessionId` varchar(255) NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`customerName` varchar(255) NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`customerPhone` varchar(40),
	`productId` varchar(120) NOT NULL,
	`productName` varchar(255) NOT NULL,
	`productCategory` varchar(120) NOT NULL,
	`size` varchar(32),
	`amountCents` int NOT NULL,
	`paymentStatus` enum('paid','refunded') NOT NULL DEFAULT 'paid',
	`fulfillmentStatus` enum('pending','ready','fulfilled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shopOrders_id` PRIMARY KEY(`id`),
	CONSTRAINT `shopOrders_stripeSessionId_unique` UNIQUE(`stripeSessionId`)
);
