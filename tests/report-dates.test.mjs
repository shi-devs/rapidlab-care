import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { build } from "esbuild";
import { PgDialect } from "drizzle-orm/pg-core";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
async function loadModule(entry, mocks = {}) {
  const output = await build({
    absWorkingDir: root, entryPoints: [entry], bundle: true, write: false,
    platform: "node", format: "cjs", packages: "external",
    plugins: [{ name: "test-services", setup(build) {
      for (const name of Object.keys(mocks)) {
        build.onResolve({ filter: new RegExp(`^@/lib/${name}$|^@/${name}$`) }, () => ({ path: name, namespace: "test-services" }));
      }
      build.onLoad({ filter: /.*/, namespace: "test-services" }, (args) => ({ contents: `module.exports = testServices[${JSON.stringify(args.path)}];`, loader: "js" }));
    } }],
  });
  const loaded = { exports: {} };
  new Function("require", "module", "exports", "testServices", output.outputFiles[0].text)(require, loaded, loaded.exports, mocks);
  return loaded.exports;
}

const { formatReportDate, isReportDate, todayReportDate } = await loadModule("lib/report-dates.ts");
const { recordSearchFilter } = await loadModule("lib/record-search.ts");
const { serializeLabRecord } = await loadModule("lib/lab-records.ts");
const sql = (hospital, query = "", date = "") => new PgDialect().sqlToQuery(recordSearchFilter(hospital, query, date));
const now = new Date("2026-10-26T10:00:00Z");
const record = { id: "record-1", patientCode: "PT-OLDER", patientName: "Test Patient", patientAge: 25, reportDate: "2025-04-01", source: "Scan / upload", valuesJson: "{}", hospitalId: "hospital-a", ownerEmail: "staff@example.test", createdByEmail: "staff@example.test", status: "pending", createdAt: now };
const attachment = { id: "file-1", recordId: record.id, hospitalId: "hospital-a", fileKey: "reports/record-1/printed/file-1-test.pdf", fileName: "test.pdf", contentType: "application/pdf", uploadedByEmail: "staff@example.test", createdAt: now, reportDate: "2024-02-29" };

function services(role = "nurse") {
  let row = { ...record };
  const inserts = [];
  const uploads = [];
  const updates = [];
  const filters = [];
  const selection = () => {
    const chain = { where(filter) { filters.push(filter); return chain; }, orderBy() { return chain; }, limit() { return Promise.resolve([row]); }, then(resolve, reject) { return Promise.resolve([]).then(resolve, reject); } };
    return chain;
  };
  const db = {
    select: () => ({ from: selection }),
    insert: () => ({ values(value) { inserts.push(value); row = { ...row, ...value }; return { returning: async () => [row], then: (resolve, reject) => Promise.resolve([]).then(resolve, reject) }; } }),
    update: () => ({ set(value) { updates.push(value); row = { ...row, ...value }; return { where: () => ({ returning: async () => [row], then: (resolve, reject) => Promise.resolve([]).then(resolve, reject) }) }; } }),
    delete: () => ({ where: async () => [] }),
  };
  return { inserts, uploads, updates, filters, mocks: {
    db: { getDb: () => db },
    access: {
      requireActiveMember: async () => ({ user: { email: "staff@example.test" }, profile: { name: "Test Staff", membership: { hospitalId: "hospital-a", role } } }),
      unauthorized: (error) => Response.json({ error }, { status: 401 }),
      forbidden: (error) => Response.json({ error }, { status: 403 }),
      logAudit: async () => {},
    },
    "report-storage": { uploadReport: async (...args) => uploads.push(args), deleteReport: async () => {} },
  } };
}

function uploadRequest(path, date) {
  const form = new FormData();
  form.set("patientName", "Test Patient");
  if (date !== undefined) form.set("reportDate", date);
  form.set("source", "Scan / upload");
  form.append("reports", new File(["synthetic test report"], "test.pdf", { type: "application/pdf" }));
  return new Request(`http://localhost${path}`, { method: "POST", body: form });
}

test("validates actual calendar days including century leap years", () => {
  for (const value of ["2024-02-29", "2000-02-29", "0001-01-01", "9999-12-31", "2026-10-26"]) assert.equal(isReportDate(value), true, value);
  for (const value of [null, undefined, 20261026, "", "2026-2-01", "2026-02-29", "1900-02-29", "2026-04-31", "2026-00-01", "2026-13-01", "2026-01-00", "0000-01-01", "10000-01-01", "2026-10-26T00:00:00Z"]) assert.equal(isReportDate(value), false, String(value));
});

test("display and defaults preserve the local calendar day across time zones", () => {
  const previous = process.env.TZ;
  try {
    for (const zone of ["Asia/Kolkata", "America/Los_Angeles", "Pacific/Kiritimati"]) {
      process.env.TZ = zone;
      assert.equal(todayReportDate(new Date(2026, 9, 26, 0, 5)), "2026-10-26");
      assert.equal(formatReportDate("2024-02-29"), "29/02/2024");
    }
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
  assert.equal(formatReportDate(null), "Not recorded");
});

test("combined search stays hospital-scoped and includes later attached reports", () => {
  const result = sql("hospital-a", "Test", "2024-02-29");
  assert.deepEqual(result.params, ["hospital-a", "%Test%", "%Test%", "2024-02-29", "hospital-a", "2024-02-29"]);
  assert.match(result.sql, /"lab_records"\."hospital_id" = \$1 and/);
  assert.match(result.sql, /exists \(select 1 from "lab_report_files"/);
  assert.match(result.sql, /"lab_report_files"\."record_id" = "lab_records"\."id"/);
  assert.match(result.sql, /"lab_report_files"\."hospital_id" = \$5/);
  assert.deepEqual(sql("hospital-a").params, ["hospital-a"]);
  assert.deepEqual(sql("hospital-a", "").params, ["hospital-a"]);
  assert.ok(sql("hospital-a", "PT-OLDER").params.includes("%PT-OLDER%"));
  assert.ok(sql("hospital-a", "a%_\\b").params.includes("%a\\%\\_\\\\b%"));
});

test("serialization keeps the record date, individual report dates and upload time separate", () => {
  const serialized = serializeLabRecord(record, [attachment]);
  assert.equal(serialized.reportDate, "2025-04-01");
  assert.equal(serialized.reports[0].reportDate, "2024-02-29");
  assert.equal(serialized.reports[0].uploadedAt, now.toISOString());
  const historical = serializeLabRecord({ ...record, reportDate: null, reportFileKey: "legacy.pdf" });
  assert.equal(historical.reportDate, null);
  assert.equal(historical.reports[0].reportDate, null);
});

test("both upload endpoints reject missing or impossible dates before storing files", async () => {
  for (const entry of ["app/api/records/route.ts", "app/api/records/[id]/reports/route.ts"]) {
    const service = services();
    const route = await loadModule(entry, service.mocks);
    for (const date of [undefined, "2026-02-29", "2026-04-31"]) {
      const response = await route.POST(uploadRequest("/api/records", date), { params: Promise.resolve({ id: record.id }) });
      assert.equal(response.status, 400);
    }
    assert.equal(service.uploads.length, 0);
    assert.equal(service.inserts.length, 0);
  }
});

test("creating a record persists and returns the selected date on record and reports", async () => {
  const service = services();
  const route = await loadModule("app/api/records/route.ts", service.mocks);
  const response = await route.POST(uploadRequest("/api/records", "2024-02-29"));
  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.record.reportDate, "2024-02-29");
  assert.equal(payload.record.reports[0].reportDate, "2024-02-29");
  assert.equal(service.inserts[0].reportDate, "2024-02-29");
  assert.equal(service.inserts[1][0].reportDate, "2024-02-29");
});

test("adding reports later saves their date without replacing the record date", async () => {
  const service = services();
  const route = await loadModule("app/api/records/[id]/reports/route.ts", service.mocks);
  const response = await route.POST(uploadRequest("/api/records/record-1/reports", "2024-02-29"), { params: Promise.resolve({ id: record.id }) });
  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.reports[0].reportDate, "2024-02-29");
  assert.equal(service.inserts[0][0].reportDate, "2024-02-29");
  assert.equal(Object.hasOwn(service.updates[0], "reportDate"), false);
});

test("search rejects invalid dates and applies valid date and name filters to the database", async () => {
  const service = services();
  const route = await loadModule("app/api/records/route.ts", service.mocks);
  assert.equal((await route.GET(new Request("http://localhost/api/records?reportDate=2026-02-29"))).status, 400);
  assert.equal(service.filters.length, 0);
  const response = await route.GET(new Request("http://localhost/api/records?q=Test&reportDate=2024-02-29"));
  assert.equal(response.status, 200);
  assert.deepEqual(new PgDialect().sqlToQuery(service.filters[0]).params, ["hospital-a", "%Test%", "%Test%", "2024-02-29", "hospital-a", "2024-02-29"]);
});

test("viewers cannot create records or add reports", async () => {
  for (const entry of ["app/api/records/route.ts", "app/api/records/[id]/reports/route.ts"]) {
    const service = services("viewer");
    const route = await loadModule(entry, service.mocks);
    const response = await route.POST(uploadRequest("/api/records", "2024-02-29"), { params: Promise.resolve({ id: record.id }) });
    assert.equal(response.status, 403);
    assert.equal(service.inserts.length, 0);
  }
});


test("editing a record validates dates and preserves omitted dates", async () => {
  const service = services();
  const route = await loadModule("app/api/records/[id]/route.ts", service.mocks);
  const patch = (extra = {}) => route.PATCH(new Request("http://localhost/api/records/record-1", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patientName: "Test Patient", ...extra }) }), { params: Promise.resolve({ id: record.id }) });
  assert.equal((await patch({ reportDate: "2026-02-29" })).status, 400);
  assert.equal(service.updates.length, 0);
  const unchanged = await patch();
  assert.equal((await unchanged.json()).record.reportDate, "2025-04-01");
  const corrected = await patch({ reportDate: "2024-02-29" });
  assert.equal((await corrected.json()).record.reportDate, "2024-02-29");
  const cleared = await patch({ reportDate: null });
  assert.equal((await cleared.json()).record.reportDate, null);
});
