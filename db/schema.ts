import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

const dateColumn = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const workspaceArchiveRows = pgTable("workspace_archive_rows", {
  id: text("id").primaryKey(),
  archiveId: text("archive_id").notNull(),
  sourceTable: text("source_table").notNull(),
  sourceKey: text("source_key").notNull(),
  rowJson: text("row_json").notNull(),
  archivedAt: dateColumn("archived_at").notNull(),
}, (table) => [
  index("idx_workspace_archive_rows_archive_id").on(table.archiveId),
  index("idx_workspace_archive_rows_source_table").on(table.sourceTable),
]);

export const workspaceResetState = pgTable("workspace_reset_state", {
  resetId: text("reset_id").primaryKey(),
  archiveId: text("archive_id").notNull(),
  appliedAt: dateColumn("applied_at").notNull(),
});

export const labRecords = pgTable("lab_records", {
  id: text("id").primaryKey(),
  patientCode: text("patient_code").notNull(),
  patientName: text("patient_name").notNull(),
  patientAge: integer("patient_age"),
  source: text("source").notNull(),
  valuesJson: text("values_json").notNull(),
  reportFileKey: text("report_file_key"),
  reportFileName: text("report_file_name"),
  ownerEmail: text("owner_email"),
  hospitalId: text("hospital_id"),
  createdByEmail: text("created_by_email"),
  assignedToEmail: text("assigned_to_email"),
  status: text("status").notNull().default("pending"),
  verifiedByEmail: text("verified_by_email"),
  verifiedAt: dateColumn("verified_at"),
  updatedAt: dateColumn("updated_at"),
  createdAt: dateColumn("created_at").notNull(),
});

export const labReportFiles = pgTable("lab_report_files", {
  id: text("id").primaryKey(),
  recordId: text("record_id").notNull(),
  hospitalId: text("hospital_id").notNull(),
  fileKey: text("file_key").notNull(),
  fileName: text("file_name").notNull(),
  contentType: text("content_type").notNull(),
  uploadedByEmail: text("uploaded_by_email").notNull(),
  createdAt: dateColumn("created_at").notNull(),
}, (table) => [
  index("idx_lab_report_files_hospital_id").on(table.hospitalId),
  index("idx_lab_report_files_record_id").on(table.recordId),
]);

export const staffProfiles = pgTable("staff_profiles", {
  email: text("email").primaryKey(),
  name: text("name").notNull(),
  staffId: text("staff_id").notNull().unique(),
  createdAt: dateColumn("created_at").notNull(),
  updatedAt: dateColumn("updated_at").notNull(),
});

export const authAccounts = pgTable("auth_accounts", {
  email: text("email").primaryKey(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  passwordIterations: integer("password_iterations").notNull(),
  createdAt: dateColumn("created_at").notNull(),
  updatedAt: dateColumn("updated_at").notNull(),
});

export const authSessions = pgTable("auth_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  email: text("email").notNull(),
  expiresAt: dateColumn("expires_at").notNull(),
  createdAt: dateColumn("created_at").notNull(),
}, (table) => [
  index("idx_auth_sessions_email").on(table.email),
  index("idx_auth_sessions_expires_at").on(table.expiresAt),
]);

export const emailVerificationChallenges = pgTable("email_verification_challenges", {
  email: text("email").primaryKey(),
  name: text("name").notNull(),
  staffId: text("staff_id").notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  passwordIterations: integer("password_iterations").notNull(),
  codeHash: text("code_hash").notNull(),
  codeSalt: text("code_salt").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: dateColumn("expires_at").notNull(),
  resendAfter: dateColumn("resend_after").notNull(),
  createdAt: dateColumn("created_at").notNull(),
}, (table) => [
  index("idx_email_verification_expires_at").on(table.expiresAt),
]);

export const hospitals = pgTable("hospitals", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  createdByEmail: text("created_by_email").notNull(),
  createdAt: dateColumn("created_at").notNull(),
});

export const hospitalMembers = pgTable("hospital_members", {
  email: text("email").primaryKey(),
  hospitalId: text("hospital_id").notNull(),
  role: text("role").notNull().default("nurse"),
  status: text("status").notNull().default("pending"),
  joinedAt: dateColumn("joined_at").notNull(),
  approvedAt: dateColumn("approved_at"),
  approvedByEmail: text("approved_by_email"),
});

export const recordAudit = pgTable("record_audit", {
  id: text("id").primaryKey(),
  recordId: text("record_id"),
  hospitalId: text("hospital_id").notNull(),
  actorEmail: text("actor_email").notNull(),
  actorName: text("actor_name").notNull(),
  action: text("action").notNull(),
  details: text("details").notNull(),
  createdAt: dateColumn("created_at").notNull(),
});
