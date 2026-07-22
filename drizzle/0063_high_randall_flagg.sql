CREATE TABLE `readingPromoLeads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parentName` varchar(200) NOT NULL,
	`parentPhone` varchar(20) NOT NULL,
	`parentEmail` varchar(320) NOT NULL,
	`childName` varchar(200) NOT NULL,
	`childAge` int NOT NULL,
	`quizScore` int NOT NULL DEFAULT 0,
	`quizPassed` int NOT NULL DEFAULT 0,
	`promoCode` varchar(30),
	`redeemed` int NOT NULL DEFAULT 0,
	`redeemedAt` timestamp,
	`recommendedProgram` varchar(100),
	`source` varchar(100) NOT NULL DEFAULT 'library_reading_promo',
	`staffNotified` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `readingPromoLeads_id` PRIMARY KEY(`id`)
);
