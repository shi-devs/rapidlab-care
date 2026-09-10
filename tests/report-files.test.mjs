import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("accepts PDF lab reports", async () => {
  const source = await readFile(new URL("../lib/lab-records.ts", import.meta.url), "utf8");

  assert.match(source, /"application\/pdf"/);
  assert.match(source, /Only JPG, PNG, WebP, and PDF report files are supported/);
});

test("stores printed and handwritten report types without a database migration", async () => {
  const source = await readFile(new URL("../lib/lab-records.ts", import.meta.url), "utf8");

  assert.match(source, /type ReportKind = "printed" \| "handwritten"/);
  assert.match(source, /`reports\/\$\{recordId\}\/\$\{reportKind\}\/\$\{reportId\}-\$\{safeName\}`/);
  assert.match(source, /reportKindFromFileKey\(report\.fileKey\)/);
});

test("handwritten uploads skip OCR and are labelled for later review", async () => {
  const source = await readFile(new URL("../app/rapidlab-client.tsx", import.meta.url), "utf8");

  assert.match(source, /reportKind === "handwritten"/);
  assert.match(source, /Automatic extraction was skipped/);
  assert.match(source, /No laboratory value will be guessed/);
  assert.match(source, /form\.set\("reportKind", reportKind\)/);
});

test("does not require a laboratory value before saving", async () => {
  const files = [
    "app/rapidlab-client.tsx",
    "app/api/records/route.ts",
    "app/api/records/[id]/route.ts",
  ];
  const source = (await Promise.all(files.map((file) => readFile(new URL(`../${file}`, import.meta.url), "utf8")))).join("\n");

  assert.doesNotMatch(source, /at least one laboratory value|enter or extract at least one/i);
});
