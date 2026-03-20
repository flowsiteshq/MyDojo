CREATE TABLE `arcadeScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollment_id` int NOT NULL,
	`student_name` varchar(255) NOT NULL,
	`game_id` varchar(50) NOT NULL,
	`game_name` varchar(100) NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`level` int DEFAULT 1,
	`duration` int DEFAULT 0,
	`checked_in` int DEFAULT 0,
	`played_at` bigint NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `arcadeScores_id` PRIMARY KEY(`id`)
);
