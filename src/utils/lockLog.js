export const getLockLogKey = employeeId => `ll-${employeeId}`;

export const appendLockLog = async entry => {
  if (!entry.employeeId) throw new Error("employeeId is required for lock log entries");
  const key = getLockLogKey(entry.employeeId);
  const lockedAt = entry.lockedAt || new Date().toISOString();
  let current = [];
  try {
    const existing = await window.storage.get(key, true);
    current = existing ? JSON.parse(existing.value) : [];
    if (!Array.isArray(current)) current = [];
  } catch (e) {
    current = [];
  }

  const nextEntry = {
    id: `${entry.employeeId || "employee"}-${entry.monthKey}-${Date.now()}`,
    ...entry,
    lockedAt
  };
  await window.storage.set(key, JSON.stringify([...current, nextEntry]), true);
  return nextEntry;
};
