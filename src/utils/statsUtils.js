import { getActs } from '../locales/translations';
import { isWE, dk, dim } from './dateUtils';
import { WORK_ACTS } from '../constants/config';
import { isCountrylessActivity, normalizeActivityId } from './activityUtils';

export const calcMonthStats = (entries, y, m, lang) => {
  const acts = getActs(lang);
  const actMap = Object.fromEntries(acts.map(a => [a.id, a]));
  const d = dim(y, m);
  const byCo = {};
  let wknd = 0, miss = 0;
  
  for (let i = 1; i <= d; i++) {
    const k = dk(y, m, i);
    const we = isWE(y, m, i);
    if (we) wknd++;
    const ent = entries[k];
    
    if (ent) {
      if (ent.period === "split") {
        [[ent.amL || "DE", ent.amA], [ent.pmL || "DE", ent.pmA]].forEach(([l, a]) => {
          const act = normalizeActivityId(a);
          if (isCountrylessActivity(act)) return;
          const loc = l || "DE";
          if (!byCo[loc]) byCo[loc] = {};
          byCo[loc][act] = (byCo[loc][act] || 0) + 0.5;
        });
      } else {
        const act = normalizeActivityId(ent.act);
        if (isCountrylessActivity(act)) continue;
        const l = ent.loc || "DE";
        if (!byCo[l]) byCo[l] = {};
        byCo[l][act] = (byCo[l][act] || 0) + 1;
      }
    } else if (!we) {
      miss++;
    }
  }
  return { byCo, wknd, miss, total: d, actMap };
};

export const calcYearSummary = (entries, y) => {
  const cc = {};
  for (let m = 0; m < 12; m++) {
    const d = dim(y, m);
    for (let i = 1; i <= d; i++) {
      const k = dk(y, m, i);
      const ent = entries[k];
      if (ent) {
        if (ent.period === "split") {
          [[ent.amL || "DE", ent.amA], [ent.pmL || "DE", ent.pmA]].forEach(([loc, act]) => {
            const normalizedAct = normalizeActivityId(act);
            if (isCountrylessActivity(normalizedAct)) return;
            if (!cc[loc]) cc[loc] = { total: 0, work: 0 };
            cc[loc].total += 0.5;
            if (WORK_ACTS.has(normalizedAct)) cc[loc].work += 0.5;
          });
        } else {
          const act = normalizeActivityId(ent.act);
          if (isCountrylessActivity(act)) continue;
          const loc = ent.loc || "DE";
          if (!cc[loc]) cc[loc] = { total: 0, work: 0 };
          cc[loc].total += 1;
          if (WORK_ACTS.has(act)) cc[loc].work += 1;
        }
      }
    }
  }
  return cc;
};

export const calcRangeSummary = (entries, fromDate, toDate) => {
  const cc = {};
  const s = new Date(fromDate);
  const e = new Date(toDate);
  
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear();
    const m = d.getMonth();
    const di = d.getDate();
    const k = dk(y, m, di);
    const ent = entries[k];
    
    if (ent) {
      if (ent.period === "split") {
        [[ent.amL || "DE", ent.amA], [ent.pmL || "DE", ent.pmA]].forEach(([loc, act]) => {
          const normalizedAct = normalizeActivityId(act);
          if (isCountrylessActivity(normalizedAct)) return;
          if (!cc[loc]) cc[loc] = { total: 0, work: 0 };
          cc[loc].total += 0.5;
          if (WORK_ACTS.has(normalizedAct)) cc[loc].work += 0.5;
        });
      } else {
        const act = normalizeActivityId(ent.act);
        if (isCountrylessActivity(act)) continue;
        const loc = ent.loc || "DE";
        if (!cc[loc]) cc[loc] = { total: 0, work: 0 };
        cc[loc].total += 1;
        if (WORK_ACTS.has(act)) cc[loc].work += 1;
      }
    }
  }
  return cc;
};
