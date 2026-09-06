CREATE TABLE "auth_accounts" (
	"email" text PRIMARY KEY NOT NULL,
	"password_hash" text NOT NULL,
	"password_salt" text NOT NULL,
	"password_iterations" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verification_challenges" (
	"email" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"staff_id" text NOT NULL,
	"password_hash" text NOT NULL,
	"password_salt" text NOT NULL,
	"password_iterations" integer NOT NULL,
	"code_hash" text NOT NULL,
	"code_salt" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"resend_after" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hospital_members" (
	"email" text PRIMARY KEY NOT NULL,
	"hospital_id" text NOT NULL,
	"role" text DEFAULT 'nurse' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"joined_at" timestamp with time zone NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by_email" text
);
--> statement-breakpoint
CREATE TABLE "hospitals" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"created_by_email" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "hospitals_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "lab_records" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_code" text NOT NULL,
	"patient_name" text NOT NULL,
	"patient_age" integer,
	"source" text NOT NULL,
	"values_json" text NOT NULL,
	"report_file_key" text,
	"report_file_name" text,
	"owner_email" text,
	"hospital_id" text,
	"created_by_email" text,
	"assigned_to_email" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"verified_by_email" text,
	"verified_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_report_files" (
	"id" text PRIMARY KEY NOT NULL,
	"record_id" text NOT NULL,
	"hospital_id" text NOT NULL,
	"file_key" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"uploaded_by_email" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "record_audit" (
	"id" text PRIMARY KEY NOT NULL,
	"record_id" text,
	"hospital_id" text NOT NULL,
	"actor_email" text NOT NULL,
	"actor_name" text NOT NULL,
	"action" text NOT NULL,
	"details" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_profiles" (
	"email" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"staff_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "staff_profiles_staff_id_unique" UNIQUE("staff_id")
);
--> statement-breakpoint
CREATE TABLE "workspace_archive_rows" (
	"id" text PRIMARY KEY NOT NULL,
	"archive_id" text NOT NULL,
	"source_table" text NOT NULL,
	"source_key" text NOT NULL,
	"row_json" text NOT NULL,
	"archived_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_reset_state" (
	"reset_id" text PRIMARY KEY NOT NULL,
	"archive_id" text NOT NULL,
	"applied_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_auth_sessions_email" ON "auth_sessions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_auth_sessions_expires_at" ON "auth_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_email_verification_expires_at" ON "email_verification_challenges" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_lab_report_files_hospital_id" ON "lab_report_files" USING btree ("hospital_id");--> statement-breakpoint
CREATE INDEX "idx_lab_report_files_record_id" ON "lab_report_files" USING btree ("record_id");--> statement-breakpoint
CREATE INDEX "idx_workspace_archive_rows_archive_id" ON "workspace_archive_rows" USING btree ("archive_id");--> statement-breakpoint
CREATE INDEX "idx_workspace_archive_rows_source_table" ON "workspace_archive_rows" USING btree ("source_table");