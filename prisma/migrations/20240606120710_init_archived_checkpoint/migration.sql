-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PATIENT', 'PHYSICIAN', 'RADIOLOGIST');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('SUCCESS', 'PENDING', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "uid" VARCHAR(29) NOT NULL,
    "email" TEXT NOT NULL,
    "dob" DATE NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "title" TEXT,
    "profile_image_url" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PATIENT',
    "claimed_as_physician" BOOLEAN NOT NULL DEFAULT false,
    "allow_ratings" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "StripeUser" (
    "patient_uid" VARCHAR(29) NOT NULL,
    "stripe_id" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "uid" VARCHAR(36) NOT NULL,
    "uploaded_by" VARCHAR(29) NOT NULL,
    "uploaded_for" VARCHAR(29) NOT NULL,
    "url" TEXT NOT NULL,
    "diagnoses" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hospital" (
    "id" SERIAL NOT NULL,
    "uid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "HospitalPhysician" (
    "id" SERIAL NOT NULL,
    "hospital_uid" UUID NOT NULL,
    "physician_uid" VARCHAR(29) NOT NULL,

    CONSTRAINT "HospitalPhysician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageNote" (
    "uid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "author_uid" VARCHAR(29) NOT NULL,
    "image_uid" VARCHAR(36) NOT NULL,
    "recommend_uid" VARCHAR(29),
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageNote_pkey" PRIMARY KEY ("author_uid","image_uid")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "uid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "message" VARCHAR(255) NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "recipient_uid" VARCHAR(29) NOT NULL,
    "sender_uid" VARCHAR(29) NOT NULL,
    "to" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientRelation" (
    "id" SERIAL NOT NULL,
    "patient_uid" VARCHAR(29) NOT NULL,
    "staff_uid" VARCHAR(29) NOT NULL,

    CONSTRAINT "PatientRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "uid" VARCHAR(36) NOT NULL,
    "comment" TEXT,
    "rating" INTEGER NOT NULL,
    "rated_uid" VARCHAR(29) NOT NULL,
    "user_uid" VARCHAR(29) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("rated_uid","user_uid")
);

-- CreateTable
CREATE TABLE "StaffCredentials" (
    "uid" VARCHAR(29) NOT NULL,
    "bio" TEXT,
    "expertise" TEXT,
    "years_of_exp" INTEGER
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" SERIAL NOT NULL,
    "uid" VARCHAR(29) NOT NULL,
    "url" TEXT NOT NULL,
    "image_uid" VARCHAR(36) NOT NULL DEFAULT '',
    "patient_uid" VARCHAR(29) NOT NULL,
    "radiologist_uid" VARCHAR(29) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_uid_key" ON "User"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_uid_idx" ON "User"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "StripeUser_patient_uid_key" ON "StripeUser"("patient_uid");

-- CreateIndex
CREATE UNIQUE INDEX "StripeUser_stripe_id_key" ON "StripeUser"("stripe_id");

-- CreateIndex
CREATE UNIQUE INDEX "Image_uid_key" ON "Image"("uid");

-- CreateIndex
CREATE INDEX "Image_uid_idx" ON "Image"("uid");

-- CreateIndex
CREATE INDEX "Image_uploaded_by_idx" ON "Image"("uploaded_by");

-- CreateIndex
CREATE INDEX "Image_uploaded_for_idx" ON "Image"("uploaded_for");

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_id_key" ON "Hospital"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_uid_key" ON "Hospital"("uid");

-- CreateIndex
CREATE INDEX "HospitalPhysician_hospital_uid_idx" ON "HospitalPhysician"("hospital_uid");

-- CreateIndex
CREATE INDEX "HospitalPhysician_physician_uid_idx" ON "HospitalPhysician"("physician_uid");

-- CreateIndex
CREATE UNIQUE INDEX "ImageNote_uid_key" ON "ImageNote"("uid");

-- CreateIndex
CREATE INDEX "ImageNote_uid_idx" ON "ImageNote"("uid");

-- CreateIndex
CREATE INDEX "ImageNote_author_uid_idx" ON "ImageNote"("author_uid");

-- CreateIndex
CREATE INDEX "ImageNote_image_uid_idx" ON "ImageNote"("image_uid");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_uid_key" ON "Notification"("uid");

-- CreateIndex
CREATE INDEX "Notification_sender_uid_idx" ON "Notification"("sender_uid");

-- CreateIndex
CREATE INDEX "Notification_recipient_uid_idx" ON "Notification"("recipient_uid");

-- CreateIndex
CREATE INDEX "PatientRelation_patient_uid_idx" ON "PatientRelation"("patient_uid");

-- CreateIndex
CREATE INDEX "PatientRelation_staff_uid_idx" ON "PatientRelation"("staff_uid");

-- CreateIndex
CREATE UNIQUE INDEX "PatientRelation_patient_uid_staff_uid_key" ON "PatientRelation"("patient_uid", "staff_uid");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_uid_key" ON "Rating"("uid");

-- CreateIndex
CREATE INDEX "Rating_rated_uid_idx" ON "Rating"("rated_uid");

-- CreateIndex
CREATE INDEX "Rating_user_uid_idx" ON "Rating"("user_uid");

-- CreateIndex
CREATE UNIQUE INDEX "StaffCredentials_uid_key" ON "StaffCredentials"("uid");

-- CreateIndex
CREATE INDEX "StaffCredentials_uid_idx" ON "StaffCredentials"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_uid_key" ON "Invoice"("uid");

-- CreateIndex
CREATE INDEX "Invoice_image_uid_idx" ON "Invoice"("image_uid");

-- CreateIndex
CREATE INDEX "Invoice_patient_uid_idx" ON "Invoice"("patient_uid");

-- CreateIndex
CREATE INDEX "Invoice_radiologist_uid_idx" ON "Invoice"("radiologist_uid");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_uploaded_for_fkey" FOREIGN KEY ("uploaded_for") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalPhysician" ADD CONSTRAINT "HospitalPhysician_hospital_uid_fkey" FOREIGN KEY ("hospital_uid") REFERENCES "Hospital"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalPhysician" ADD CONSTRAINT "HospitalPhysician_physician_uid_fkey" FOREIGN KEY ("physician_uid") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageNote" ADD CONSTRAINT "ImageNote_image_uid_fkey" FOREIGN KEY ("image_uid") REFERENCES "Image"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipient_uid_fkey" FOREIGN KEY ("recipient_uid") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_sender_uid_fkey" FOREIGN KEY ("sender_uid") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientRelation" ADD CONSTRAINT "PatientRelation_patient_uid_fkey" FOREIGN KEY ("patient_uid") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientRelation" ADD CONSTRAINT "PatientRelation_staff_uid_fkey" FOREIGN KEY ("staff_uid") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_rated_uid_fkey" FOREIGN KEY ("rated_uid") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffCredentials" ADD CONSTRAINT "StaffCredentials_uid_fkey" FOREIGN KEY ("uid") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_image_uid_fkey" FOREIGN KEY ("image_uid") REFERENCES "Image"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_patient_uid_fkey" FOREIGN KEY ("patient_uid") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_radiologist_uid_fkey" FOREIGN KEY ("radiologist_uid") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;
