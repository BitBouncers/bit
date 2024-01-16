import { sql } from "drizzle-orm";
import {
  date,
  datetime,
  double,
  index,
  int,
  longtext,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  tinyint,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

export const hospital = mysqlTable(
  "Hospital",
  {
    id: int("id").autoincrement().notNull(),
    uid: varchar("uid", { length: 36 })
      .default(sql`uuid()`)
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => {
    return {
      hospitalIdKey: unique("Hospital_id_key").on(table.id),
      hospitalUidKey: unique("Hospital_uid_key").on(table.uid),
    };
  }
);

export const hospitalPhysician = mysqlTable(
  "HospitalPhysician",
  {
    id: int("id").autoincrement().notNull(),
    hospitalUid: varchar("hospital_uid", { length: 36 }).notNull(),
    physicianUid: varchar("physician_uid", { length: 29 }).notNull(),
  },
  (table) => {
    return {
      hospitalUidIdx: index("HospitalPhysician_hospital_uid_idx").on(
        table.hospitalUid
      ),
      physicianUidIdx: index("HospitalPhysician_physician_uid_idx").on(
        table.physicianUid
      ),
      hospitalPhysicianId: primaryKey({
        columns: [table.id],
        name: "HospitalPhysician_id",
      }),
    };
  }
);

export const image = mysqlTable(
  "Image",
  {
    id: int("id").autoincrement().notNull(),
    uid: varchar("uid", { length: 36 }).notNull(),
    uploadedBy: varchar("uploaded_by", { length: 29 }).notNull(),
    uploadedFor: varchar("uploaded_for", { length: 29 }).notNull(),
    url: varchar("url", { length: 191 }).notNull(),
    diagnoses: varchar("diagnoses", { length: 191 }),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => {
    return {
      uidIdx: index("Image_uid_idx").on(table.uid),
      uploadedByIdx: index("Image_uploaded_by_idx").on(table.uploadedBy),
      uploadedForIdx: index("Image_uploaded_for_idx").on(table.uploadedFor),
      imageId: primaryKey({ columns: [table.id], name: "Image_id" }),
      imageUidKey: unique("Image_uid_key").on(table.uid),
    };
  }
);

export const imageNote = mysqlTable(
  "ImageNote",
  {
    uid: varchar("uid", { length: 36 })
      .default(sql`uuid()`)
      .notNull(),
    authorUid: varchar("author_uid", { length: 29 }).notNull(),
    imageUid: varchar("image_uid", { length: 36 }).notNull(),
    note: longtext("note").notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    recommendUid: varchar("recommend_uid", { length: 29 }),
  },
  (table) => {
    return {
      uidIdx: index("ImageNote_uid_idx").on(table.uid),
      imageUidIdx: index("ImageNote_image_uid_idx").on(table.imageUid),
      authorUidIdx: index("ImageNote_author_uid_idx").on(table.authorUid),
      imageNoteAuthorUidImageUid: primaryKey({
        columns: [table.authorUid, table.imageUid],
        name: "ImageNote_author_uid_image_uid",
      }),
      imageNoteUidKey: unique("ImageNote_uid_key").on(table.uid),
    };
  }
);

export const invoice = mysqlTable(
  "Invoice",
  {
    id: int("id").autoincrement().notNull(),
    uid: varchar("uid", { length: 29 }).notNull(),
    patientUid: varchar("patient_uid", { length: 29 }).notNull(),
    radiologistUid: varchar("radiologist_uid", { length: 29 }).notNull(),
    amount: double("amount").notNull(),
    paid: tinyint("paid").default(0).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    url: longtext("url").notNull(),
    imageUid: varchar("image_uid", { length: 36 }).default("").notNull(),
  },
  (table) => {
    return {
      patientUidIdx: index("Invoice_patient_uid_idx").on(table.patientUid),
      radiologistUidIdx: index("Invoice_radiologist_uid_idx").on(
        table.radiologistUid
      ),
      imageUidIdx: index("Invoice_image_uid_idx").on(table.imageUid),
      invoiceId: primaryKey({ columns: [table.id], name: "Invoice_id" }),
      invoiceUidKey: unique("Invoice_uid_key").on(table.uid),
    };
  }
);

export const notification = mysqlTable(
  "Notification",
  {
    id: int("id").autoincrement().notNull(),
    uid: varchar("uid", { length: 36 })
      .default(sql`uuid()`)
      .notNull(),
    read: tinyint("read").default(0).notNull(),
    recipientUid: varchar("recipient_uid", { length: 29 }).notNull(),
    senderUid: varchar("sender_uid", { length: 29 }).notNull(),
    timestamp: datetime("timestamp", { mode: "string", fsp: 3 }).notNull(),
    message: varchar("message", { length: 255 }).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    to: longtext("to"),
  },
  (table) => {
    return {
      senderUidIdx: index("Notification_sender_uid_idx").on(table.senderUid),
      recipientUidIdx: index("Notification_recipient_uid_idx").on(
        table.recipientUid
      ),
      notificationId: primaryKey({
        columns: [table.id],
        name: "Notification_id",
      }),
      notificationUidKey: unique("Notification_uid_key").on(table.uid),
    };
  }
);

export const patientRelation = mysqlTable(
  "PatientRelation",
  {
    id: int("id").autoincrement().notNull(),
    patientUid: varchar("patient_uid", { length: 29 }).notNull(),
    staffUid: varchar("staff_uid", { length: 29 }).notNull(),
  },
  (table) => {
    return {
      patientUidIdx: index("PatientRelation_patient_uid_idx").on(
        table.patientUid
      ),
      staffUidIdx: index("PatientRelation_staff_uid_idx").on(table.staffUid),
      patientRelationId: primaryKey({
        columns: [table.id],
        name: "PatientRelation_id",
      }),
      patientRelationPatientUidStaffUidKey: unique(
        "PatientRelation_patient_uid_staff_uid_key"
      ).on(table.patientUid, table.staffUid),
    };
  }
);

export const rating = mysqlTable(
  "Rating",
  {
    uid: varchar("uid", { length: 36 }).notNull(),
    comment: longtext("comment"),
    rating: int("rating").notNull(),
    ratedUid: varchar("rated_uid", { length: 29 }).notNull(),
    userUid: varchar("user_uid", { length: 29 }).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    editedAt: datetime("editedAt", { mode: "string", fsp: 3 }).notNull(),
  },
  (table) => {
    return {
      ratedUidIdx: index("Rating_rated_uid_idx").on(table.ratedUid),
      userUidIdx: index("Rating_user_uid_idx").on(table.userUid),
      ratingRatedUidUserUid: primaryKey({
        columns: [table.ratedUid, table.userUid],
        name: "Rating_rated_uid_user_uid",
      }),
      ratingUidKey: unique("Rating_uid_key").on(table.uid),
    };
  }
);

export const staffCredentials = mysqlTable(
  "StaffCredentials",
  {
    bio: longtext("bio"),
    expertise: varchar("expertise", { length: 191 }),
    yearsOfExp: int("years_of_exp"),
    uid: varchar("uid", { length: 29 }).notNull(),
  },
  (table) => {
    return {
      uidIdx: index("StaffCredentials_uid_idx").on(table.uid),
      staffCredentialsUidKey: unique("StaffCredentials_uid_key").on(table.uid),
    };
  }
);

export const stripeUser = mysqlTable(
  "StripeUser",
  {
    patientUid: varchar("patient_uid", { length: 29 }).notNull(),
    stripeId: varchar("stripe_id", { length: 191 }).notNull(),
  },
  (table) => {
    return {
      stripeUserPatientUidKey: unique("StripeUser_patient_uid_key").on(
        table.patientUid
      ),
      stripeUserStripeIdKey: unique("StripeUser_stripe_id_key").on(
        table.stripeId
      ),
    };
  }
);

export const user = mysqlTable(
  "User",
  {
    id: int("id").autoincrement().notNull(),
    uid: varchar("uid", { length: 29 }).notNull(),
    email: varchar("email", { length: 191 }).notNull(),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    dob: date("dob", { mode: "string" }).notNull(),
    firstName: varchar("first_name", { length: 191 }).notNull(),
    lastName: varchar("last_name", { length: 191 }).notNull(),
    title: varchar("title", { length: 191 }),
    profileImageUrl: varchar("profile_image_url", { length: 191 }),
    role: mysqlEnum("role", ["PATIENT", "PHYSICIAN", "RADIOLOGIST"])
      .default("PATIENT")
      .notNull(),
    claimedAsPhysician: tinyint("claimed_as_physician").default(0).notNull(),
    allowRatings: tinyint("allow_ratings").default(1).notNull(),
  },
  (table) => {
    return {
      uidIdx: index("User_uid_idx").on(table.uid),
      userIdKey: unique("User_id_key").on(table.id),
      userUidKey: unique("User_uid_key").on(table.uid),
      userEmailKey: unique("User_email_key").on(table.email),
    };
  }
);

export const prismaMigrations = mysqlTable(
  "_prisma_migrations",
  {
    id: varchar("id", { length: 36 }).notNull(),
    checksum: varchar("checksum", { length: 64 }).notNull(),
    finishedAt: datetime("finished_at", { mode: "string", fsp: 3 }),
    migrationName: varchar("migration_name", { length: 255 }).notNull(),
    logs: text("logs"),
    rolledBackAt: datetime("rolled_back_at", { mode: "string", fsp: 3 }),
    startedAt: datetime("started_at", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    appliedStepsCount: int("applied_steps_count", { unsigned: true })
      .default(0)
      .notNull(),
  },
  (table) => {
    return {
      prismaMigrationsId: primaryKey({
        columns: [table.id],
        name: "_prisma_migrations_id",
      }),
    };
  }
);
