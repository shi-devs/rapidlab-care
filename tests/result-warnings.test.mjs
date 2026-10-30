import assert from "node:assert/strict";
import test from "node:test";
import { buildSync } from "esbuild";
const compiled = buildSync({ entryPoints: [new URL("../lib/result-warnings.ts", import.meta.url).pathname], bundle: true, write: false, platform: "node", format: "esm" });
const { isAboveReferenceRange: high } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`);

test("each result is compared to its own report range, including boundaries", () => {
  assert.deepEqual(["3", "4", "7", "10", "10.1"].map(value => high(value, "4 - 10")), [false, false, false, false, true]);
  assert.equal(high("10.1", "4 - 12"), false);
  assert.equal(high("11001", "4,000–11,000"), true);
  assert.equal(high("11,000", "4,000–11,000"), false);
  assert.equal(high("1.1e4", "4e3 to 1e4"), true);
  assert.equal(high("-1", "-5 - -2"), true);
});

test("upper-limit notation and qualified results preserve strict boundaries", () => {
  assert.equal(high("5", "<5"), true);
  assert.equal(high("5", "<=5"), false);
  assert.equal(high("5.1", "≤ 5"), true);
  assert.equal(high(">10", "4-10"), true);
  assert.equal(high(">=10", "4-10"), false);
  assert.equal(high(">9", "4-10"), false);
  assert.equal(high("<11", "4-10"), false);
});

test("blank, qualitative, ambiguous and missing ranges do not invent warnings", () => {
  for (const value of ["", "positive", "NaN", "Infinity", "12 mg/dL", "1,2", "9-12"])
    assert.equal(high(value, "4-10"), false);
  for (const range of ["", "normal", ">5", "5", "10-4", "4-10 mg/dL", "4-10; 5-12"])
    assert.equal(high("12", range), false);
});
