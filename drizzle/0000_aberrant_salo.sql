-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `Hospital` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uid` varchar(36) NOT NULL DEFAULT uuid(),
	`name` varchar(255) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `Hospital_id_key` UNIQUE(`id`),
	CONSTRAINT `Hospital_uid_key` UNIQUE(`uid`)
);
--> statement-breakpoint
CREATE TABLE `HospitalPhysician` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hospital_uid` varchar(36) NOT NULL,
	`physician_uid` varchar(29) NOT NULL,
	CONSTRAINT `HospitalPhysician_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Image` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uid` varchar(36) NOT NULL,
	`uploaded_by` varchar(29) NOT NULL,
	`uploaded_for` varchar(29) NOT NULL,
	`url` varchar(191) NOT NULL,
	`diagnoses` varchar(191),
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `Image_id` PRIMARY KEY(`id`),
	CONSTRAINT `Image_uid_key` UNIQUE(`uid`)
);
--> statement-breakpoint
CREATE TABLE `ImageNote` (
	`uid` varchar(36) NOT NULL DEFAULT uuid(),
	`author_uid` varchar(29) NOT NULL,
	`image_uid` varchar(36) NOT NULL,
	`note` longtext NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`recommend_uid` varchar(29),
	CONSTRAINT `ImageNote_author_uid_image_uid` PRIMARY KEY(`author_uid`,`image_uid`),
	CONSTRAINT `ImageNote_uid_key` UNIQUE(`uid`)
);
--> statement-breakpoint
CREATE TABLE `Invoice` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uid` varchar(29) NOT NULL,
	`patient_uid` varchar(29) NOT NULL,
	`radiologist_uid` varchar(29) NOT NULL,
	`amount` double NOT NULL,
	`paid` tinyint NOT NULL DEFAULT 0,
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`url` longtext NOT NULL,
	`image_uid` varchar(36) NOT NULL DEFAULT '',
	CONSTRAINT `Invoice_id` PRIMARY KEY(`id`),
	CONSTRAINT `Invoice_uid_key` UNIQUE(`uid`)
);
--> statement-breakpoint
CREATE TABLE `Notification` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uid` varchar(36) NOT NULL DEFAULT uuid(),
	`read` tinyint NOT NULL DEFAULT 0,
	`recipient_uid` varchar(29) NOT NULL,
	`sender_uid` varchar(29) NOT NULL,
	`timestamp` datetime(3) NOT NULL,
	`message` varchar(255) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`to` longtext,
	CONSTRAINT `Notification_id` PRIMARY KEY(`id`),
	CONSTRAINT `Notification_uid_key` UNIQUE(`uid`)
);
--> statement-breakpoint
CREATE TABLE `PatientRelation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patient_uid` varchar(29) NOT NULL,
	`staff_uid` varchar(29) NOT NULL,
	CONSTRAINT `PatientRelation_id` PRIMARY KEY(`id`),
	CONSTRAINT `PatientRelation_patient_uid_staff_uid_key` UNIQUE(`patient_uid`,`staff_uid`)
);
--> statement-breakpoint
CREATE TABLE `Rating` (
	`uid` varchar(36) NOT NULL,
	`comment` longtext,
	`rating` int NOT NULL,
	`rated_uid` varchar(29) NOT NULL,
	`user_uid` varchar(29) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`editedAt` datetime(3) NOT NULL,
	CONSTRAINT `Rating_rated_uid_user_uid` PRIMARY KEY(`rated_uid`,`user_uid`),
	CONSTRAINT `Rating_uid_key` UNIQUE(`uid`)
);
--> statement-breakpoint
CREATE TABLE `StaffCredentials` (
	`bio` longtext,
	`expertise` varchar(191),
	`years_of_exp` int,
	`uid` varchar(29) NOT NULL,
	CONSTRAINT `StaffCredentials_uid_key` UNIQUE(`uid`)
);
--> statement-breakpoint
CREATE TABLE `StripeUser` (
	`patient_uid` varchar(29) NOT NULL,
	`stripe_id` varchar(191) NOT NULL,
	CONSTRAINT `StripeUser_patient_uid_key` UNIQUE(`patient_uid`),
	CONSTRAINT `StripeUser_stripe_id_key` UNIQUE(`stripe_id`)
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uid` varchar(29) NOT NULL,
	`email` varchar(191) NOT NULL,
	`dob` date NOT NULL,
	`first_name` varchar(191) NOT NULL,
	`last_name` varchar(191) NOT NULL,
	`title` varchar(191),
	`profile_image_url` varchar(191),
	`role` enum('PATIENT','PHYSICIAN','RADIOLOGIST') NOT NULL DEFAULT 'PATIENT',
	`claimed_as_physician` tinyint NOT NULL DEFAULT 0,
	`allow_ratings` tinyint NOT NULL DEFAULT 1,
	CONSTRAINT `User_id_key` UNIQUE(`id`),
	CONSTRAINT `User_uid_key` UNIQUE(`uid`),
	CONSTRAINT `User_email_key` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `_prisma_migrations` (
	`id` varchar(36) NOT NULL,
	`checksum` varchar(64) NOT NULL,
	`finished_at` datetime(3),
	`migration_name` varchar(255) NOT NULL,
	`logs` text,
	`rolled_back_at` datetime(3),
	`started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`applied_steps_count` int unsigned NOT NULL DEFAULT 0,
	CONSTRAINT `_prisma_migrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `HospitalPhysician_hospital_uid_idx` ON `HospitalPhysician` (`hospital_uid`);--> statement-breakpoint
CREATE INDEX `HospitalPhysician_physician_uid_idx` ON `HospitalPhysician` (`physician_uid`);--> statement-breakpoint
CREATE INDEX `Image_uid_idx` ON `Image` (`uid`);--> statement-breakpoint
CREATE INDEX `Image_uploaded_by_idx` ON `Image` (`uploaded_by`);--> statement-breakpoint
CREATE INDEX `Image_uploaded_for_idx` ON `Image` (`uploaded_for`);--> statement-breakpoint
CREATE INDEX `ImageNote_uid_idx` ON `ImageNote` (`uid`);--> statement-breakpoint
CREATE INDEX `ImageNote_image_uid_idx` ON `ImageNote` (`image_uid`);--> statement-breakpoint
CREATE INDEX `ImageNote_author_uid_idx` ON `ImageNote` (`author_uid`);--> statement-breakpoint
CREATE INDEX `Invoice_patient_uid_idx` ON `Invoice` (`patient_uid`);--> statement-breakpoint
CREATE INDEX `Invoice_radiologist_uid_idx` ON `Invoice` (`radiologist_uid`);--> statement-breakpoint
CREATE INDEX `Invoice_image_uid_idx` ON `Invoice` (`image_uid`);--> statement-breakpoint
CREATE INDEX `Notification_sender_uid_idx` ON `Notification` (`sender_uid`);--> statement-breakpoint
CREATE INDEX `Notification_recipient_uid_idx` ON `Notification` (`recipient_uid`);--> statement-breakpoint
CREATE INDEX `PatientRelation_patient_uid_idx` ON `PatientRelation` (`patient_uid`);--> statement-breakpoint
CREATE INDEX `PatientRelation_staff_uid_idx` ON `PatientRelation` (`staff_uid`);--> statement-breakpoint
CREATE INDEX `Rating_rated_uid_idx` ON `Rating` (`rated_uid`);--> statement-breakpoint
CREATE INDEX `Rating_user_uid_idx` ON `Rating` (`user_uid`);--> statement-breakpoint
CREATE INDEX `StaffCredentials_uid_idx` ON `StaffCredentials` (`uid`);--> statement-breakpoint
CREATE INDEX `User_uid_idx` ON `User` (`uid`);
*/