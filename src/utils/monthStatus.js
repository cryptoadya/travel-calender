import { dim, dk, isWE } from "./dateUtils.js";

export const MONTH_STATUS = {
  INCOMPLETE_UNLOCKED: "incomplete_unlocked",
  COMPLETE_UNLOCKED: "complete_unlocked",
  COMPLETE_LOCKED: "complete_locked",
};

export const getMonthKey = (year, month) => `${year}-${String(month + 1).padStart(2, "0")}`;

export const parseLocalDate = value => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

export const isMonthLocked = (lockedMonths = [], year, month) => lockedMonths.includes(getMonthKey(year, month));

export const isDateSubmitted = (dateKey, lockedMonths = []) => {
  if (!dateKey || dateKey.length < 7) return false;
  return lockedMonths.includes(dateKey.slice(0, 7));
};

export const getSubmittedStatusForDate = (dateKey, lockedMonths = []) => (
  isDateSubmitted(dateKey, lockedMonths) ? "submitted" : "not submitted"
);

export const countFilledDays = (entries = {}, year, month) => {
  const total = dim(year, month);
  let fill = 0;
  for (let day = 1; day <= total; day++) {
    if (entries[dk(year, month, day)] || isWE(year, month, day)) fill++;
  }
  return { fill, total, missing: total - fill };
};

export const getMissingDays = (entries = {}, year, month) => {
  const total = dim(year, month);
  const missing = [];
  for (let day = 1; day <= total; day++) {
    if (!entries[dk(year, month, day)] && !isWE(year, month, day)) missing.push(day);
  }
  return missing;
};

export const isMonthComplete = (entries = {}, year, month) => countFilledDays(entries, year, month).missing === 0;

export const isMonthLockableByDate = (year, month, today = new Date()) => {
  const monthStart = new Date(year, month, 1);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return monthStart <= todayStart;
};

export const deriveMonthStatus = ({ entries = {}, lockedMonths = [], year, month, today = new Date() }) => {
  const mk = getMonthKey(year, month);
  const locked = isMonthLocked(lockedMonths, year, month);
  const { fill, total, missing } = countFilledDays(entries, year, month);
  const complete = missing === 0;
  const lockableByDate = isMonthLockableByDate(year, month, today);
  const completeAndLocked = complete && locked;
  const status = completeAndLocked
    ? MONTH_STATUS.COMPLETE_LOCKED
    : complete
      ? MONTH_STATUS.COMPLETE_UNLOCKED
      : MONTH_STATUS.INCOMPLETE_UNLOCKED;

  return {
    mk,
    year,
    month,
    fill,
    total,
    missing,
    pct: Math.round((fill / Math.max(total, 1)) * 100),
    locked,
    complete,
    lockableByDate,
    canLock: complete && !locked && lockableByDate,
    status,
    color: completeAndLocked ? "green" : complete ? "orange" : "red",
  };
};

export const selectedRangeOverlapsLockedMonth = ({ start, end, include = "all", lockedMonths = [] }) => {
  const startDate = parseLocalDate(start);
  const endDate = parseLocalDate(end);
  if (!startDate || !endDate || startDate > endDate) return false;

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    if (include === "weekdays" && isWE(year, month, day)) continue;
    if (include === "weekends" && !isWE(year, month, day)) continue;
    if (isMonthLocked(lockedMonths, year, month)) return true;
  }
  return false;
};
