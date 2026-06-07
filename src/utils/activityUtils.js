export const COUNTRYLESS_ACTS = new Set(["vacation", "nonwork"]);

export const normalizeActivityId = act => act === "training" ? "travel" : act;

export const isCountrylessActivity = act => COUNTRYLESS_ACTS.has(normalizeActivityId(act));

export const getEntryCountry = (entry, fallback = "") => {
  if (!entry || entry.period === "split" || isCountrylessActivity(entry.act)) return "";
  return entry.loc || fallback;
};

export const normalizeFullEntry = entry => {
  const act = normalizeActivityId(entry.act || "work");
  return {
    ...entry,
    loc: isCountrylessActivity(act) ? "" : (entry.loc || "DE"),
    act,
    period: "full",
    amL: isCountrylessActivity(act) ? "" : (entry.amL || entry.loc || "DE"),
    pmL: isCountrylessActivity(act) ? "" : (entry.pmL || entry.loc || "DE"),
    amA: act,
    pmA: act
  };
};

export const normalizeSplitEntry = entry => {
  const amA = normalizeActivityId(entry.amA || "work");
  const pmA = normalizeActivityId(entry.pmA || "work");
  return {
    ...entry,
    period: "split",
    act: normalizeActivityId(entry.act || "work"),
    loc: "",
    amA,
    pmA,
    amL: isCountrylessActivity(amA) ? "" : (entry.amL || "DE"),
    pmL: isCountrylessActivity(pmA) ? "" : (entry.pmL || "DE")
  };
};

export const normalizeEntryForSave = entry => (
  entry.period === "split" ? normalizeSplitEntry(entry) : normalizeFullEntry(entry)
);
