import { and, eq, ilike, or, sql } from "drizzle-orm";
import { labRecords, labReportFiles } from "@/db/schema";

export function recordSearchFilter(hospitalId: string, query = "", reportDate = "") {
  // Escape LIKE wildcards so names and record IDs are searched literally.
  const pattern = `%${query.trim().replace(/[\\%_]/g, "\\$&")}%`;
  return and(
    eq(labRecords.hospitalId, hospitalId),
    query.trim() ? or(ilike(labRecords.patientName, pattern), ilike(labRecords.patientCode, pattern)) : undefined,
    reportDate ? or(
      eq(labRecords.reportDate, reportDate),
      sql`exists (select 1 from ${labReportFiles} where ${labReportFiles.recordId} = ${labRecords.id} and ${labReportFiles.hospitalId} = ${hospitalId} and ${labReportFiles.reportDate} = ${reportDate})`,
    ) : undefined,
  );
}
