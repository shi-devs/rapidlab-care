ALTER TABLE "lab_records" ADD COLUMN "report_date" date;--> statement-breakpoint
ALTER TABLE "lab_report_files" ADD COLUMN "report_date" date;--> statement-breakpoint
CREATE INDEX "idx_lab_records_hospital_report_date" ON "lab_records" USING btree ("hospital_id","report_date");--> statement-breakpoint
CREATE INDEX "idx_lab_report_files_hospital_report_date" ON "lab_report_files" USING btree ("hospital_id","report_date");