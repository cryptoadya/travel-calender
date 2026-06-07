import { getActs, T, WDN } from '../locales/translations.js';
import { WORK_ACTS } from '../constants/config.js';
import { isWE, dk, fmtDate, getDOW } from './dateUtils.js';
import { dName, escX } from './formatUtils.js';
import { getSubmittedStatusForDate } from './monthStatus.js';
import { isCountrylessActivity, normalizeActivityId } from './activityUtils.js';

export function calcCountrySummary(entries, fromDate, toDate) {
  const summary = {};
  const addStay = (country, act, days) => {
    if (isCountrylessActivity(act)) return;
    const code = country || "DE";
    if (!summary[code]) summary[code] = { stay: 0, work: 0 };
    summary[code].stay += days;
  };
  const addWork = (country, act, days) => {
    const normalizedAct = normalizeActivityId(act);
    if (!WORK_ACTS.has(normalizedAct)) return;
    const code = country || "DE";
    if (!summary[code]) summary[code] = { stay: 0, work: 0 };
    summary[code].work += days;
  };
  
  const s = new Date(fromDate);
  const e = new Date(toDate);
  
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const ent = entries[dk(d.getFullYear(), d.getMonth(), d.getDate())];
    if (!ent) continue;
    
    if (ent.period === "split") {
      addStay(ent.amL, ent.amA, 0.5);
      addWork(ent.amL, ent.amA, 0.5);
      addStay(ent.pmL, ent.pmA, 0.5);
      addWork(ent.pmL, ent.pmA, 0.5);
    } else {
      addStay(ent.loc, ent.act, 1);
      addWork(ent.loc, ent.act, 1);
    }
  }
  
  return Object.entries(summary)
    .map(([country, values]) => ({ country, ...values }))
    .filter(r => r.stay > 0 || r.work > 0)
    .sort((a, b) => b.work - a.work || b.stay - a.stay || a.country.localeCompare(b.country));
}

const fmtDays = v => String(v);

export function buildAllEmployeesCountryWorkSummary(employees, entriesByEmployee, fromDate, toDate) {
  return employees.map(emp => ({
    employee: dName(emp),
    countries: calcCountrySummary(entriesByEmployee[emp.id] || {}, fromDate, toDate)
      .filter(r => r.work > 0)
      .map(r => ({ country: r.country, work: r.work }))
  }));
}

const resolveAllEmployeesReportRange = (fromDateOrYear, toDateOrMonth, lang) => {
  if (typeof fromDateOrYear === "number") {
    const year = fromDateOrYear;
    const month = toDateOrMonth;
    return {
      fromDate: `${year}-${String(month + 1).padStart(2, "0")}-01`,
      toDate: dk(year, month, new Date(year, month + 1, 0).getDate()),
      lang
    };
  }
  return { fromDate: fromDateOrYear, toDate: toDateOrMonth, lang };
};

const makeDailyRows = (entries, fromDate, toDate, lang, lockedMonths = []) => {
  const acts = getActs(lang);
  const actMap = Object.fromEntries(acts.map(a => [a.id, a]));
  const getL = id => actMap[normalizeActivityId(id)]?.label || id || "";
  const getLoc = (loc, act) => isCountrylessActivity(act) ? "–" : (loc || "");
  const rows = [];
  const s = new Date(fromDate);
  const e = new Date(toDate);

  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear();
    const m = d.getMonth();
    const di = d.getDate();
    const k = dk(y, m, di);
    const ent = entries[k];
    const we = isWE(y, m, di);
    const defaultWeekend = !ent && we;

    rows.push({
      date: k,
      submitted: getSubmittedStatusForDate(k, lockedMonths),
      day: WDN[lang][getDOW(y, m, di)],
      country: ent ? (ent.period === "split" ? `${getLoc(ent.amL, ent.amA)}/${getLoc(ent.pmL, ent.pmA)}` : getLoc(ent.loc, ent.act)) : "–",
      excelCountry: ent ? (ent.period === "split" ? `${getLoc(ent.amL, ent.amA)}(VM)/${getLoc(ent.pmL, ent.pmA)}(NM)` : getLoc(ent.loc, ent.act)) : "–",
      activity: ent ? (ent.period === "split" ? `${getL(ent.amA)}/${getL(ent.pmA)}` : getL(ent.act)) : defaultWeekend ? getL("nonwork") : "–",
      notes: ent?.notes || "",
      flag: ent ? (we ? "WE" : "") : (we ? "WE" : "MISSING"),
      we,
      missing: !ent && !we
    });
  }

  return rows;
};

export const buildCsvRows = (entries, fromDate, toDate, lang, lockedMonths = []) => {
  const rows = [[lang === "de" ? "Datum" : "Date", "Submitted", "Tag/Day", lang === "de" ? "Land" : "Country", lang === "de" ? "Aktivität" : "Activity", "Notes", "Status"]];
  makeDailyRows(entries, fromDate, toDate, lang, lockedMonths).forEach(row => {
    rows.push([row.date, row.submitted, row.day, row.country, row.activity, row.notes, row.flag]);
  });
  return rows;
};

export function buildExcel(emp, entries, fromDate, toDate, lang, lockedMonths = []) {
  const t = T[lang];
  const summary = calcCountrySummary(entries, fromDate, toDate);
  const rows = makeDailyRows(entries, fromDate, toDate, lang, lockedMonths);
  
  const hdr = lang === "de"
    ? ["Datum", "Submitted", "Wochentag", "Land", "Aktivität", "Notizen", "Status"]
    : ["Date", "Submitted", "Weekday", "Country", "Activity", "Notes", "Status"];
  const summaryHdr = [t.country, t.stayDays, t.workingDays];
    
  const cell = v => `<Cell><Data ss:Type="String">${escX(v)}</Data></Cell>`;
  const blankRow = `<Row>${cell("")}</Row>`;
  const summaryRows = summary.length
    ? summary.map(r => `<Row>${[r.country, fmtDays(r.stay), fmtDays(r.work)].map(cell).join("")}</Row>`).join("\n")
    : `<Row>${cell(t.noCountryData)}</Row>`;
  
  const xml = `<?xml version="1.0" encoding="utf-8"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="${lang === "de" ? "Tagesübersicht" : "Daily Overview"}"><Table>
<Row>${[t.app, dName(emp), `${fmtDate(fromDate, lang)} – ${fmtDate(toDate, lang)}`].map(cell).join("")}</Row>
${blankRow}
<Row>${cell(t.countrySummary)}</Row>
<Row>${summaryHdr.map(cell).join("")}</Row>
${summaryRows}
${blankRow}
<Row>${hdr.map(cell).join("")}</Row>
${rows.map(r => `<Row>${[r.date, r.submitted, r.day, r.excelCountry, r.activity, r.notes, r.flag].map(cell).join("")}</Row>`).join("\n")}
</Table></Worksheet></Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${dName(emp).replace(/\s/g, "_")}_${fromDate}_${toDate}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildHTMLReport(emp, entries, fromDate, toDate, lang, lockedMonths = []) {
  const t = T[lang];
  const summary = calcCountrySummary(entries, fromDate, toDate);
  const rows = makeDailyRows(entries, fromDate, toDate, lang, lockedMonths);
  
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escX(t.app)}</title>
<style>
body{font-family:Arial,sans-serif;font-size:11px;padding:24px}
.hd{background:#E2001A;color:white;padding:16px 20px;border-radius:8px;margin-bottom:16px}
.hd h1{font-size:18px;font-weight:900;font-style:italic}
.summary{margin-bottom:18px}
.summary h2{font-size:14px;margin:0 0 8px;color:#1f2937}
.empty{color:#777;font-size:11px;margin:0 0 18px}
table{width:100%;border-collapse:collapse}
th{background:#E2001A;color:white;padding:6px 8px;text-align:left;font-size:10px}
td{padding:5px 8px;border-bottom:1px solid #eee}
.we{background:#f5f5f5;color:#999}
.miss{background:#fff0f1;color:#E2001A}
@media print{@page{margin:15mm}}
</style></head>
<body>
<div class="hd">
  <h1>Delivery Hero – ${escX(t.app)}</h1>
  <p>${escX(dName(emp))} | ${escX(fmtDate(fromDate, lang))} – ${escX(fmtDate(toDate, lang))}</p>
</div>
<div class="summary">
  <h2>${escX(t.countrySummary)}</h2>
  ${summary.length ? `<table>
    <thead>
      <tr><th>${escX(t.country)}</th><th>${escX(t.stayDays)}</th><th>${escX(t.workingDays)}</th></tr>
    </thead>
    <tbody>
      ${summary.map(r => `<tr><td>${escX(r.country)}</td><td>${escX(fmtDays(r.stay))}</td><td>${escX(fmtDays(r.work))}</td></tr>`).join("")}
    </tbody>
  </table>` : `<p class="empty">${escX(t.noCountryData)}</p>`}
</div>
<table>
  <thead>
    <tr><th>Date</th><th>Submitted</th><th>Day</th><th>Country</th><th>Activity</th><th>Notes</th></tr>
  </thead>
  <tbody>
    ${rows.map(r => `<tr class="${r.we ? "we" : r.missing ? "miss" : ""}">
      <td>${r.date}</td>
      <td>${escX(r.submitted)}</td>
      <td>${r.day}</td>
      <td>${escX(r.country)}</td>
      <td>${escX(r.activity)}</td>
      <td>${escX(r.notes)}</td>
    </tr>`).join("")}
  </tbody>
</table>
<script>window.onload=()=>window.print();</script>
</body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${dName(emp).replace(/\s/g, "_")}_Report.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildAllEmployeesExcelReport(employees, entriesByEmployee, lockedByEmployee, fromDate, toDate, lang) {
  ({ fromDate, toDate, lang } = resolveAllEmployeesReportRange(fromDate, toDate, lang));
  const t = T[lang];
  const hdr = lang === "de"
    ? ["Mitarbeiter", "Datum", "Submitted", "Wochentag", "Land", "Aktivität", "Notizen", "Status"]
    : ["Employee", "Date", "Submitted", "Weekday", "Country", "Activity", "Notes", "Status"];
  const summaryHdr = lang === "de"
    ? ["Mitarbeiter", "Land", "Arbeitstage"]
    : ["Employee", "Country", "Working days"];
  const cell = v => `<Cell><Data ss:Type="String">${escX(v)}</Data></Cell>`;
  const blankRow = `<Row>${cell("")}</Row>`;
  const summary = buildAllEmployeesCountryWorkSummary(employees, entriesByEmployee, fromDate, toDate);
  const summaryRows = summary.flatMap(empSummary => empSummary.countries.length
    ? empSummary.countries.map(r => [empSummary.employee, r.country, fmtDays(r.work)])
    : [[empSummary.employee, "–", "0"]]);
  const rows = employees.flatMap(emp => makeDailyRows(entriesByEmployee[emp.id] || {}, fromDate, toDate, lang, lockedByEmployee[emp.id] || [])
    .map(r => [dName(emp), r.date, r.submitted, r.day, r.excelCountry, r.activity, r.notes, r.flag]));

  const xml = `<?xml version="1.0" encoding="utf-8"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="${lang === "de" ? "Alle Mitarbeiter" : "All Employees"}"><Table>
<Row>${[t.app, `${fmtDate(fromDate, lang)} – ${fmtDate(toDate, lang)}`].map(cell).join("")}</Row>
${blankRow}
<Row>${cell(lang === "de" ? "Arbeitstage nach Land" : "Working days by country")}</Row>
<Row>${summaryHdr.map(cell).join("")}</Row>
${summaryRows.map(row => `<Row>${row.map(cell).join("")}</Row>`).join("\n")}
${blankRow}
<Row>${hdr.map(cell).join("")}</Row>
${rows.map(row => `<Row>${row.map(cell).join("")}</Row>`).join("\n")}
</Table></Worksheet></Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `All_Employees_${fromDate}_${toDate}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildAllEmployeesHTMLReport(employees, entriesByEmployee, lockedByEmployee, fromDate, toDate, lang) {
  ({ fromDate, toDate, lang } = resolveAllEmployeesReportRange(fromDate, toDate, lang));
  const t = T[lang];
  const summary = buildAllEmployeesCountryWorkSummary(employees, entriesByEmployee, fromDate, toDate);
  const rows = employees.flatMap(emp => makeDailyRows(entriesByEmployee[emp.id] || {}, fromDate, toDate, lang, lockedByEmployee[emp.id] || [])
    .map(r => ({ ...r, employee: dName(emp) })));
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escX(t.app)}</title>
<style>
body{font-family:Arial,sans-serif;font-size:11px;padding:24px}
.hd{background:#E2001A;color:white;padding:16px 20px;border-radius:8px;margin-bottom:16px}
.hd h1{font-size:18px;font-weight:900;font-style:italic}
.summary{margin-bottom:18px}
.summary h2{font-size:14px;margin:0 0 8px;color:#1f2937}
.emp-summary{margin:0 0 10px}
.emp-summary h3{font-size:12px;margin:0 0 4px;color:#1f2937}
.emp-summary ul{margin:0 0 0 16px;padding:0}
.empty{color:#777}
table{width:100%;border-collapse:collapse}
th{background:#E2001A;color:white;padding:6px 8px;text-align:left;font-size:10px}
td{padding:5px 8px;border-bottom:1px solid #eee}
.we{background:#f5f5f5;color:#999}
.miss{background:#fff0f1;color:#E2001A}
@media print{@page{margin:15mm}}
</style></head>
<body>
<div class="hd">
  <h1>Delivery Hero – ${escX(t.app)}</h1>
  <p>${escX(lang === "de" ? "Alle Mitarbeiter" : "All Employees")} | ${escX(fmtDate(fromDate, lang))} – ${escX(fmtDate(toDate, lang))}</p>
</div>
<div class="summary">
  <h2>${escX(lang === "de" ? "Arbeitstage nach Land" : "Working days by country")}</h2>
  ${summary.map(empSummary => `<div class="emp-summary">
    <h3>${escX(empSummary.employee)}</h3>
    ${empSummary.countries.length
      ? `<ul>${empSummary.countries.map(r => `<li>${escX(r.country)}: ${escX(fmtDays(r.work))} ${escX(t.workingDays)}</li>`).join("")}</ul>`
      : `<p class="empty">${escX(t.noCountryData)}</p>`}
  </div>`).join("")}
</div>
<table>
  <thead>
    <tr><th>Employee</th><th>Date</th><th>Submitted</th><th>Day</th><th>Country</th><th>Activity</th><th>Notes</th></tr>
  </thead>
  <tbody>
    ${rows.map(r => `<tr class="${r.we ? "we" : r.missing ? "miss" : ""}">
      <td>${escX(r.employee)}</td>
      <td>${r.date}</td>
      <td>${escX(r.submitted)}</td>
      <td>${r.day}</td>
      <td>${escX(r.country)}</td>
      <td>${escX(r.activity)}</td>
      <td>${escX(r.notes)}</td>
    </tr>`).join("")}
  </tbody>
</table>
<script>window.onload=()=>window.print();</script>
</body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `All_Employees_${fromDate}_${toDate}_Report.html`;
  a.click();
  URL.revokeObjectURL(url);
}
