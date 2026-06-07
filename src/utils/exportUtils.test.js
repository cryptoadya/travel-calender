import assert from "node:assert/strict";

import { buildCsvRows, calcCountrySummary } from "./exportUtils.js";

const rows = buildCsvRows(
  {
    "2026-04-01": { loc: "DE", act: "work", notes: "start" },
    "2026-06-01": { loc: "FR", act: "travel", notes: "end" },
  },
  "2026-04-01",
  "2026-06-01",
  "en",
  ["2026-04"]
);

assert.equal(rows.length, 63);
assert.equal(rows[0][0], "Date");
assert.equal(rows[1][0], "2026-04-01");
assert.equal(rows[30][0], "2026-04-30");
assert.equal(rows[31][0], "2026-05-01");
assert.equal(rows[61][0], "2026-05-31");
assert.equal(rows[62][0], "2026-06-01");
assert.equal(rows[2][3], "–");
assert.equal(rows[2][4], "–");
assert.equal(rows[2][5], "");
assert.equal(rows[1][1], "submitted");
assert.equal(rows[31][1], "not submitted");

const compatibilityRows = buildCsvRows(
  {
    "2026-04-01": { loc: "DE", act: "training", notes: "legacy" },
    "2026-04-02": { loc: "FR", act: "vacation", notes: "pto" },
  },
  "2026-04-01",
  "2026-04-02",
  "en"
);

assert.equal(compatibilityRows[1][4], "Business Travel");
assert.equal(compatibilityRows[2][3], "–");
assert.equal(compatibilityRows[2][4], "Vacation");

const summary = calcCountrySummary(
  {
    "2026-04-01": { loc: "DE", act: "training" },
    "2026-04-02": { loc: "FR", act: "vacation" },
  },
  "2026-04-01",
  "2026-04-02"
);
assert.deepEqual(summary, [{ country: "DE", stay: 1, work: 1 }]);

console.log("exportUtils tests passed");
