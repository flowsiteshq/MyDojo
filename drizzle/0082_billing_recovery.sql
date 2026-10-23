CREATE TABLE `billingReconciliationCases` (
  `id` int AUTO_INCREMENT NOT NULL,
  `caseKey` varchar(255) NOT NULL,
  `familyKey` varchar(255) NOT NULL,
  `enrollmentIds` json NOT NULL,
  `sourceRecords` json NOT NULL,
  `totalSettledCents` int NOT NULL DEFAULT 0,
  `duplicateOverageCents` int NOT NULL DEFAULT 0,
  `classification` enum('matched','duplicate_candidate','authorized_family_charge','refund_pending','disputed','retry_failure','unmatched','no_double_collection') NOT NULL,
  `proposedAction` enum('none','review_refund','review_credit','review_retry','identity_match') NOT NULL DEFAULT 'none',
  `reviewStatus` enum('unreviewed','approved','rejected','resolved') NOT NULL DEFAULT 'unreviewed',
  `reviewerUserId` int,
  `reviewedAt` timestamp,
  `reviewNotes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `billingReconciliationCases_caseKey_unique` UNIQUE(`caseKey`)
);
--> statement-breakpoint
CREATE TABLE `prepaidTuitionIntents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `familyKey` varchar(255) NOT NULL,
  `enrollmentIds` json NOT NULL,
  `plan` enum('basic','blackBelt','leadership') NOT NULL,
  `monthlyChargeableCents` int NOT NULL,
  `grossCents` int NOT NULL,
  `creditAppliedCents` int NOT NULL DEFAULT 0,
  `totalDueCents` int NOT NULL,
  `startsAfter` date,
  `status` enum('quoted','pending','paid','cancelled','expired') NOT NULL DEFAULT 'quoted',
  `paypalOrderId` varchar(128),
  `paidAt` timestamp,
  `createdByUserId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `prepaidTuitionIntents_paypalOrderId_unique` UNIQUE(`paypalOrderId`)
);
--> statement-breakpoint
CREATE TABLE `billingSmsDrafts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `segment` enum('processor_failure','confirmed_past_due','migrating','duplicate_review') NOT NULL,
  `recipientUserId` int,
  `phone` varchar(20) NOT NULL,
  `message` text NOT NULL,
  `secureLoginPath` varchar(255) NOT NULL,
  `status` enum('draft','suppressed','approved','sent','cancelled') NOT NULL DEFAULT 'draft',
  `suppressionReason` varchar(100),
  `optedOut` boolean NOT NULL DEFAULT false,
  `quietHours` boolean NOT NULL DEFAULT false,
  `approvedByUserId` int,
  `approvedAt` timestamp,
  `sentAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
