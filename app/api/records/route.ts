import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { labRecords, labReportFiles } from "@/db/schema";
import { forbidden, logAudit, requireActiveMember, unauthorized } from "@/lib/access";
import { cleanValues, createReportFileKey, normalizeReportKind, serializeLabRecord, validateReportFiles } from "@/lib/lab-records";
import { deleteReport, uploadReport } from "@/lib/report-storage";
import { isReportDate } from "@/lib/report-dates";
import { recordSearchFilter } from "@/lib/record-search";

export async function GET(request: Request) {
  const context = await requireActiveMember();
  if (!context) return unauthorized("An active hospital membership is required");
  const params = new URL(request.url).searchParams;
  const reportDate = params.get("reportDate") ?? "";
  const query = params.get("q")?.trim() ?? "";
  if (reportDate && !isReportDate(reportDate)) return Response.json({ error: "Enter a valid report date (YYYY-MM-DD)" }, { status: 400 });
  if (query.length > 120) return Response.json({ error: "Search must be 120 characters or fewer" }, { status: 400 });
  try {
    const db = getDb();
    const hospitalId = context.profile.membership.hospitalId;
    // Apply filters before the recent-record limit so older dated reports can be found.
    const matches = await db.select().from(labRecords)
      .where(recordSearchFilter(hospitalId, query, reportDate))
      .orderBy(desc(labRecords.createdAt)).limit(201);
    const rows = matches.slice(0, 200);
    const reportRows = rows.length ? await db.select().from(labReportFiles)
      .where(and(eq(labReportFiles.hospitalId, hospitalId), inArray(labReportFiles.recordId, rows.map((row) => row.id))))
      .orderBy(asc(labReportFiles.createdAt)) : [];
    const reportsByRecord = new Map<string, Array<typeof labReportFiles.$inferSelect>>();
    for (const report of reportRows) reportsByRecord.set(report.recordId, [...(reportsByRecord.get(report.recordId) ?? []), report]);
    return Response.json({ records: rows.map((row) => serializeLabRecord(row, reportsByRecord.get(row.id))), hasMore: matches.length > 200 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not load records" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const context = await requireActiveMember();
  if (!context) return unauthorized("An active hospital membership is required");
  if (context.profile.membership.role === "viewer") return forbidden("Viewers cannot create patient records");
  const ownerEmail = context.user.email;
  const uploadedKeys: string[] = [];
  let createdRecordId: string | null = null;
  try {
    const form = await request.formData();
    const patientName = String(form.get("patientName") ?? "").trim().slice(0, 120);
    const ageText = String(form.get("patientAge") ?? "").trim();
    const source = form.get("source") === "Scan / upload" ? "Scan / upload" : "Manual";
    const reportKind = normalizeReportKind(form.get("reportKind"));
    const reportDate = form.get("reportDate");
    if (!isReportDate(reportDate)) return Response.json({ error: "Select a valid report date" }, { status: 400 });
    const submittedValues = cleanValues(JSON.parse(String(form.get("values") ?? "{}")));
    const reports = [...form.getAll("reports"), form.get("report")]
      .filter((value): value is File => value instanceof File && value.size > 0);
    const values = reportKind === "handwritten" && reports.length ? cleanValues({}) : submittedValues;

    if (!patientName) return Response.json({ error: "Patient name is required" }, { status: 400 });
    const fileError = validateReportFiles(reports);
    if (fileError) return Response.json({ error: fileError }, { status: 400 });
    const age = ageText && /^\d{1,3}$/.test(ageText) ? Number(ageText) : null;
    if (age !== null && (age < 0 || age > 130)) return Response.json({ error: "Enter a valid patient age" }, { status: 400 });

    const id = crypto.randomUUID();
    const patientCode = `PT-${id.replaceAll("-", "").slice(0, 5).toUpperCase()}`;
    const now = new Date();
    const storedReports: Array<typeof labReportFiles.$inferInsert> = [];
    for (const report of reports) {
      const reportId = crypto.randomUUID();
      const fileName = report.name.slice(0, 180) || "lab-report";
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
      const fileKey = createReportFileKey(id, reportId, safeName, reportKind);
      await uploadReport(fileKey, await report.arrayBuffer(), report.type);
      uploadedKeys.push(fileKey);
      storedReports.push({ id: reportId, recordId: id, hospitalId: context.profile.membership.hospitalId, fileKey, fileName, contentType: report.type, uploadedByEmail: context.user.email, reportDate, createdAt: now });
    }

    const [row] = await getDb().insert(labRecords).values({
      id, patientCode, patientName, patientAge: age, source, reportDate,
      valuesJson: JSON.stringify(values), ownerEmail, hospitalId: context.profile.membership.hospitalId,
      createdByEmail: context.user.email, status: "pending", updatedAt: now, createdAt: now,
    }).returning();
    createdRecordId = id;
    if (storedReports.length) await getDb().insert(labReportFiles).values(storedReports);
    const reportDescription = reports.length ? ` (${reportKind}${reportKind === "handwritten" ? "; extraction skipped" : ""})` : "";
    await logAudit({ hospitalId: context.profile.membership.hospitalId, recordId: id, actorEmail: context.user.email, actorName: context.profile.name, action: "record_created", details: `Created ${patientCode} for ${patientName}, report date ${reportDate}, using ${source} with ${reports.length} report file${reports.length === 1 ? "" : "s"}${reportDescription}` });
    return Response.json({ record: serializeLabRecord(row, storedReports as Array<typeof labReportFiles.$inferSelect>) }, { status: 201 });
  } catch (error) {
    await Promise.all(uploadedKeys.map((key) => deleteReport(key).catch(() => undefined)));
    if (createdRecordId) await getDb().delete(labRecords).where(eq(labRecords.id, createdRecordId)).catch(() => undefined);
    return Response.json({ error: error instanceof Error ? error.message : "Could not save record" }, { status: 500 });
  }
}
