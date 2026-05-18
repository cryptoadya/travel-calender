export const normalizeReminderSettings = rem => ({
  enabled: rem?.enabled ?? true,
  firstReminderDay: rem?.firstReminderDay ?? rem?.day ?? 25,
  dailyReminderStartDay: rem?.dailyReminderStartDay ?? 27,
  adminAlertDay: rem?.adminAlertDay ?? 1,
  msg: rem?.msg ?? ""
});

export const renderReminderMessage = (template, months, fallback) => {
  const base = template?.trim() || fallback;
  return base.replace("{months}", months.join(", "));
};
