CREATE TABLE `mealPlanIntake` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`goals` text NOT NULL,
	`weightLbs` int,
	`targetWeightLbs` int,
	`heightInches` int,
	`age` int,
	`sex` enum('male','female','other'),
	`activityLevel` enum('sedentary','light','moderate','active','very_active'),
	`dietaryRestrictions` text,
	`healthConditions` text,
	`mealsPerDay` int DEFAULT 3,
	`includeSnacks` int DEFAULT 1,
	`additionalNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mealPlanIntake_id` PRIMARY KEY(`id`),
	CONSTRAINT `mealPlanIntake_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `mealPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planDate` varchar(10) NOT NULL,
	`planJson` text NOT NULL,
	`totalCalories` int,
	`totalProteinG` int,
	`totalCarbsG` int,
	`totalFatG` int,
	`completed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mealPlans_id` PRIMARY KEY(`id`)
);
