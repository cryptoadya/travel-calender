import assert from "node:assert/strict";

import { appendLockLog, getLockLogKey } from "./lockLog.js";

assert.equal(getLockLogKey("abc123"), "ll-abc123");

await assert.rejects(() => appendLockLog({ monthKey: "2026-06" }), /employeeId is required/);

const writes = [];
globalThis.window = {
  storage: {
    get: async key => {
      assert.equal(key, "ll-emp-1");
      return { value: JSON.stringify([{ id: "existing" }]) };
    },
    set: async (key, value) => {
      writes.push({ key, value: JSON.parse(value) });
    }
  }
};

const entry = await appendLockLog({ employeeId: "emp-1", monthKey: "2026-06" });
assert.equal(entry.employeeId, "emp-1");
assert.equal(writes[0].key, "ll-emp-1");
assert.equal(writes[0].value.length, 2);
assert.equal(writes[0].value[1].monthKey, "2026-06");

console.log("lockLog tests passed");
