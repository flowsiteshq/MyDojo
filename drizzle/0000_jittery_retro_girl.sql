CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` varchar(255) NOT NULL,
	`clientMessageId` varchar(255),
	`direction` enum('inbound','outbound') NOT NULL,
	`channel` enum('web','sms','voice') NOT NULL DEFAULT 'web',
	`content` text NOT NULL,
	`status` enum('queued','sent','delivered','read') NOT NULL DEFAULT 'queued',
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`readAt` timestamp,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatbotConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`identifier` varchar(320) NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`phone` varchar(20),
	`program` varchar(100),
	`currentStep` varchar(50) NOT NULL DEFAULT 'greeting',
	`conversationHistory` text,
	`completed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatbotConversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `chatbotConversations_identifier_unique` UNIQUE(`identifier`)
);
--> statement-breakpoint
CREATE TABLE `classSchedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`program` enum('Little Ninjas','Dragon Kids','Teens','Adult Karate','Kickboxing') NOT NULL,
	`location` varchar(255) NOT NULL,
	`dayOfWeek` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
	`startTime` varchar(20) NOT NULL,
	`endTime` varchar(20) NOT NULL,
	`instructor` varchar(255),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `classSchedule_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversationStates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` varchar(36) NOT NULL,
	`leadId` int,
	`name` varchar(255),
	`phone` varchar(20),
	`email` varchar(320),
	`emailSkipped` int NOT NULL DEFAULT 0,
	`classFor` enum('self','child','other'),
	`intent` enum('trial','enroll','summer_camp','after_school'),
	`selectedPlanId` int,
	`childAge` int,
	`segment` enum('KIDS_3_5','KIDS_6_12','TEENS','ADULTS','KICKBOXING','CAMP','AFTER_SCHOOL'),
	`introRequired` int NOT NULL DEFAULT 0,
	`introBookedCount` int NOT NULL DEFAULT 0,
	`askedKeys` text,
	`nextStep` varchar(50) NOT NULL DEFAULT 'NAME',
	`location` varchar(255),
	`program` varchar(100),
	`introSlots` text,
	`trialSlot` text,
	`enrollmentState` text,
	`intakeComplete` int NOT NULL DEFAULT 0,
	`completedSteps` text,
	`selectedSlotId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversationStates_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversationStates_conversationId_unique` UNIQUE(`conversationId`)
);
--> statement-breakpoint
CREATE TABLE `curriculumContent` (
	`id` int AUTO_INCREMENT NOT NULL,
	`beltRank` enum('No Belt','White Belt','Yellow Belt','Orange Belt','Green Belt','Advanced Green','Blue Belt','Advanced Blue','Purple Belt','Advanced Purple','Brown Belt','Advanced Brown','Probationary Black','Black Belt 1st Dan') NOT NULL,
	`category` enum('Equipment','Striking Techniques','Defensive Techniques','Grappling','Combos','Self-Defense','Sets','Knowledge','Forms') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`videoUrl` text,
	`imageUrl` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isPublished` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `curriculumContent_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int,
	`membershipPackageId` int NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`customerPhone` varchar(20) NOT NULL,
	`stripeCustomerId` varchar(255),
	`stripePaymentIntentId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`downPaymentAmount` decimal(10,2) NOT NULL,
	`paidFirstMonth` int NOT NULL DEFAULT 0,
	`remainingBalance` decimal(10,2) NOT NULL,
	`monthlyPaymentsRemaining` int NOT NULL,
	`status` enum('pending','active','cancelled','completed','failed') NOT NULL DEFAULT 'pending',
	`discountApplied` varchar(255),
	`discountAmount` decimal(10,2) DEFAULT '0.00',
	`beltRank` enum('No Belt','White Belt','Yellow Belt','Orange Belt','Green Belt','Advanced Green','Blue Belt','Advanced Blue','Purple Belt','Advanced Purple','Brown Belt','Advanced Brown','Probationary Black','Black Belt 1st Dan','Black Belt 2nd Dan','Black Belt 3rd Dan','Black Belt 4th Dan','Black Belt 5th Dan','Black Belt 6th Dan') NOT NULL DEFAULT 'No Belt',
	`beltAchievedDate` timestamp,
	`startDate` timestamp,
	`completionDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `enrollments_id` PRIMARY KEY(`id`)
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
CREATE TABLE `membershipChangeRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollmentId` int NOT NULL,
	`userId` int NOT NULL,
	`requestType` enum('pause','cancel') NOT NULL,
	`reason` text NOT NULL,
	`status` enum('pending','approved','denied') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`adminNotes` text,
	`reviewedAt` timestamp,
	`effectiveDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `membershipChangeRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `membershipPackages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`durationMonths` int NOT NULL,
	`monthlyPrice` decimal(10,2) NOT NULL,
	`totalPrice` decimal(10,2) NOT NULL,
	`registrationFee` decimal(10,2) NOT NULL,
	`downPayment` decimal(10,2) NOT NULL,
	`description` text,
	`benefits` text,
	`invitationOnly` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`stripeProductId` varchar(255),
	`stripePriceId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `membershipPackages_id` PRIMARY KEY(`id`),
	CONSTRAINT `membershipPackages_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `notificationHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` enum('classUpdates','scheduleChanges','specialEvents','promotions','generalNews') NOT NULL,
	`isRead` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `notificationHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`classUpdates` int NOT NULL DEFAULT 1,
	`scheduleChanges` int NOT NULL DEFAULT 1,
	`specialEvents` int NOT NULL DEFAULT 1,
	`promotions` int NOT NULL DEFAULT 1,
	`generalNews` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notificationPreferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `pushSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pushSubscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staffCallbacks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phone` varchar(20) NOT NULL,
	`name` varchar(255),
	`email` varchar(255),
	`reason` varchar(500) NOT NULL,
	`program` varchar(100),
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`staffNotes` text,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staffCallbacks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studentProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollmentId` int NOT NULL,
	`curriculumContentId` int NOT NULL,
	`status` enum('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
	`completedAt` timestamp,
	`instructorNotes` text,
	`instructorFeedback` text,
	`instructorId` int,
	`feedbackDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studentProgress_id` PRIMARY KEY(`id`)
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
CREATE TABLE `testimonials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberName` varchar(255) NOT NULL,
	`memberPhoto` text,
	`program` enum('Little Ninjas','Dragon Kids','Teens','Adult Karate','Kickboxing','After School') NOT NULL,
	`rating` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`memberSince` varchar(100),
	`featured` int NOT NULL DEFAULT 0,
	`isApproved` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `testimonials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trialSignups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20) NOT NULL,
	`program` enum('Little Ninjas','Dragon Kids','Teens','Adult Karate','Kickboxing','After School','Not Sure') NOT NULL,
	`segment` enum('Kids 3-5','Kids 6-12','Teens','Adult Karate','Kickboxing','Not sure'),
	`goal` enum('Confidence','Discipline','Fitness','Self-defense','Bullying help','Weight loss'),
	`preferredDays` enum('Weekdays','Weekends','Either'),
	`scheduledTime` timestamp,
	`location` varchar(255) NOT NULL,
	`preferredContactMethod` enum('email','phone','text') NOT NULL DEFAULT 'phone',
	`message` text,
	`status` enum('new','contacted','scheduled','completed','cancelled') NOT NULL DEFAULT 'new',
	`source` varchar(100) NOT NULL DEFAULT 'chatbot',
	`introCountRequired` int NOT NULL DEFAULT 0,
	`introCountBooked` int NOT NULL DEFAULT 0,
	`introCountCompleted` int NOT NULL DEFAULT 0,
	`dojoFlowSyncStatus` enum('pending','synced','failed') NOT NULL DEFAULT 'pending',
	`dojoFlowSyncAttempts` int NOT NULL DEFAULT 0,
	`dojoFlowLastSyncAttempt` timestamp,
	`dojoFlowSyncError` text,
	`bookingRequestId` varchar(36),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trialSignups_id` PRIMARY KEY(`id`),
	CONSTRAINT `trialSignups_bookingRequestId_unique` UNIQUE(`bookingRequestId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255),
	`name` text,
	`loginMethod` varchar(64) NOT NULL DEFAULT 'email',
	`openId` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`emailVerified` int NOT NULL DEFAULT 0,
	`resetToken` varchar(255),
	`resetTokenExpiry` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `waiverSignatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(320) NOT NULL,
	`ipAddress` varchar(45),
	`waiverVersion` varchar(50) NOT NULL DEFAULT '2026-02',
	`acceptedLiability` int NOT NULL DEFAULT 1,
	`acceptedPhotoConsent` int NOT NULL DEFAULT 1,
	`signedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `waiverSignatures_id` PRIMARY KEY(`id`)
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
