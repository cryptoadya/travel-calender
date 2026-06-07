import assert from "node:assert/strict";

import { isCountrylessActivity, normalizeActivityId, normalizeEntryForSave } from "./activityUtils.js";

assert.equal(normalizeActivityId("training"), "travel");
assert.equal(normalizeActivityId("travel"), "travel");
assert.equal(isCountrylessActivity("vacation"), true);
assert.equal(isCountrylessActivity("nonwork"), true);
assert.equal(isCountrylessActivity("travel"), false);

assert.deepEqual(
  normalizeEntryForSave({ loc: "DE", act: "vacation", period: "full", notes: "PTO" }),
  { loc: "", act: "vacation", period: "full", notes: "PTO", amL: "", pmL: "", amA: "vacation", pmA: "vacation" }
);

assert.deepEqual(
  normalizeEntryForSave({ amL: "DE", pmL: "FR", amA: "training", pmA: "nonwork", period: "split", notes: "" }),
  { amL: "DE", pmL: "", amA: "travel", pmA: "nonwork", period: "split", notes: "", act: "work", loc: "" }
);

console.log("activityUtils tests passed");
