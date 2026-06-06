import assert from "node:assert/strict";

import {
  deriveMonthStatus,
  getMonthKey,
  isMonthComplete,
  isMonthLocked,
  isMonthLockableByDate,
  selectedRangeOverlapsLockedMonth,
} from "./monthStatus.js";

const filledMonthEntries = (year, month) => {
  const days = new Date(year, month + 1, 0).getDate();
  return Object.fromEntries(Array.from({ length: days }, (_, i) => [
    `${year}-${String(month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
    { loc: "DE", act: "work" },
  ]));
};

const juneEntries = filledMonthEntries(2026, 5);

assert.equal(getMonthKey(2026, 0), "2026-01");
assert.equal(isMonthComplete(juneEntries, 2026, 5), true);
assert.equal(isMonthComplete({ ...juneEntries, "2026-06-12": undefined }, 2026, 5), false);
assert.equal(isMonthLocked(["2026-06"], 2026, 5), true);
assert.equal(isMonthLockableByDate(2026, 5, new Date(2026, 5, 6)), true);
assert.equal(isMonthLockableByDate(2026, 6, new Date(2026, 5, 6)), false);

assert.equal(deriveMonthStatus({ entries: {}, lockedMonths: [], year: 2026, month: 5, today: new Date(2026, 5, 6) }).color, "red");
assert.equal(deriveMonthStatus({ entries: juneEntries, lockedMonths: [], year: 2026, month: 5, today: new Date(2026, 5, 6) }).color, "orange");
assert.equal(deriveMonthStatus({ entries: juneEntries, lockedMonths: ["2026-06"], year: 2026, month: 5, today: new Date(2026, 5, 6) }).color, "green");
assert.equal(deriveMonthStatus({ entries: {}, lockedMonths: ["2026-06"], year: 2026, month: 5, today: new Date(2026, 5, 6) }).color, "red");
assert.equal(deriveMonthStatus({ entries: juneEntries, lockedMonths: [], year: 2026, month: 6, today: new Date(2026, 5, 6) }).canLock, false);

assert.equal(selectedRangeOverlapsLockedMonth({
  start: "2026-05-30",
  end: "2026-06-02",
  include: "all",
  lockedMonths: ["2026-06"],
}), true);
assert.equal(selectedRangeOverlapsLockedMonth({
  start: "2026-05-30",
  end: "2026-06-02",
  include: "weekdays",
  lockedMonths: ["2026-07"],
}), false);

console.log("monthStatus tests passed");
