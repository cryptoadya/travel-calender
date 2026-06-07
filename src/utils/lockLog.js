export const LOCK_LOG_KEY = "lock-log";

export const appendLockLog = async entry => {
  const lockedAt = entry.lockedAt || new Date().toISOString();
  let current = [];
  try {
    const existing = await window.storage.get(LOCK_LOG_KEY, true);
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
  await window.storage.set(LOCK_LOG_KEY, JSON.stringify([...current, nextEntry]), true);
  return nextEntry;
};
