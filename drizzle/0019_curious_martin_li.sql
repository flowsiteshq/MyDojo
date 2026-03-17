ALTER TABLE `enrollments` ADD `agreementSignedAt` timestamp;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `agreementSignature` varchar(255);--> statement-breakpoint
ALTER TABLE `enrollments` ADD `agreementSignedIp` varchar(45);