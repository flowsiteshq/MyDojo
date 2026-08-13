ALTER TABLE `enrollments` ADD `stripePaymentMethodId` varchar(255);--> statement-breakpoint
ALTER TABLE `enrollments` ADD `paymentMethodBrand` varchar(32);--> statement-breakpoint
ALTER TABLE `enrollments` ADD `paymentMethodLast4` varchar(4);--> statement-breakpoint
ALTER TABLE `enrollments` ADD `paymentMethodExpMonth` int;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `paymentMethodExpYear` int;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `paymentMethodWallet` varchar(32);--> statement-breakpoint
ALTER TABLE `enrollments` ADD `paymentMethodUpdatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `agreementSignatureImageUrl` text;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `agreementPdfUrl` text;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `agreementVersion` varchar(32);