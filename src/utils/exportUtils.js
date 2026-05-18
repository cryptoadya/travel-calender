import { getActs, T, WDN } from '../locales/translations';
import { WORK_ACTS } from '../constants/config';
import { isWE, dk, fmtDate, getDOW } from './dateUtils';
import { dName, escX } from './formatUtils';

export function calcCountrySummary(entries, fromDate, toDate) {
  const summary = {};
  const addStay = (country, days) => {
    const code = country || "DE";
    if (!summary[code]) summary[code] = { stay: 0, work: 0 };
    summary[code].stay += days;
  };
  const addWork = (country, act, days) => {
    if (!WORK_ACTS.has(act)) return;
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
      addStay(ent.amL, 0.5);
      addWork(ent.amL, ent.amA, 0.5);
      addStay(ent.pmL, 0.5);
      addWork(ent.pmL, ent.pmA, 0.5);
    } else {
      addStay(ent.loc, 1);
      addWork(ent.loc, ent.act, 1);
    }
  }
  
  return Object.entries(summary)
    .map(([country, values]) => ({ country, ...values }))
    .filter(r => r.stay > 0 || r.work > 0)
    .sort((a, b) => b.work - a.work || b.stay - a.stay || a.country.localeCompare(b.country));
}

const fmtDays = v => String(v);

export function buildExcel(emp, entries, fromDate, toDate, lang) {
  const t = T[lang];
  const acts = getActs(lang);
  const actMap = Object.fromEntries(acts.map(a => [a.id, a]));
  const getL = id => actMap[id]?.label || id || "";
  const summary = calcCountrySummary(entries, fromDate, toDate);
  
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
    
    if (ent) {
      rows.push({
        date: k,
        day: WDN[lang][getDOW(y, m, di)],
        country: ent.period === "split" ? `${ent.amL}(VM)/${ent.pmL}(NM)` : ent.loc || "",
        activity: ent.period === "split" ? `${getL(ent.amA)}/${getL(ent.pmA)}` : getL(ent.act),
        notes: ent.notes || "",
        flag: we ? "WE" : ""
      });
    } else {
      rows.push({
        date: k,
        day: WDN[lang][getDOW(y, m, di)],
        country: "–",
        activity: "–",
        notes: "",
        flag: we ? "WE" : "MISSING"
      });
    }
  }
  
  const hdr = lang === "de" 
    ? ["Datum", "Wochentag", "Land", "Aktivität", "Notizen", "Status"] 
    : ["Date", "Weekday", "Country", "Activity", "Notes", "Status"];
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
${rows.map(r => `<Row>${[r.date, r.day, r.country, r.activity, r.notes, r.flag].map(cell).join("")}</Row>`).join("\n")}
</Table></Worksheet></Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${dName(emp).replace(/\s/g, "_")}_${fromDate}_${toDate}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildHTMLReport(emp, entries, fromDate, toDate, lang) {
  const t = T[lang];
  const acts = getActs(lang);
  const actMap = Object.fromEntries(acts.map(a => [a.id, a]));
  const getL = id => actMap[id]?.label || id || "";
  const summary = calcCountrySummary(entries, fromDate, toDate);
  
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
    
    rows.push({
      date: k,
      day: WDN[lang][getDOW(y, m, di)],
      country: ent ? (ent.period === "split" ? `${ent.amL}/${ent.pmL}` : ent.loc || "") : "–",
      activity: ent ? (ent.period === "split" ? `${getL(ent.amA)}/${getL(ent.pmA)}` : getL(ent.act)) : "–",
      notes: ent?.notes || "",
      we,
      missing: !ent && !we
    });
  }
  
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
    <tr><th>Date</th><th>Day</th><th>Country</th><th>Activity</th><th>Notes</th></tr>
  </thead>
  <tbody>
    ${rows.map(r => `<tr class="${r.we ? "we" : r.missing ? "miss" : ""}">
      <td>${r.date}</td>
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
