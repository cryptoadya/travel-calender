import { getActs, T, WDN } from '../locales/translations';
import { isWE, dk, fmtDate, getDOW } from './dateUtils';
import { dName, escX } from './formatUtils';

export function buildExcel(emp, entries, fromDate, toDate, lang) {
  const t = T[lang];
  const acts = getActs(lang);
  const actMap = Object.fromEntries(acts.map(a => [a.id, a]));
  const getL = id => actMap[id]?.label || id || "";
  
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
    
  const cell = v => `<Cell><Data ss:Type="String">${escX(v)}</Data></Cell>`;
  
  const xml = `<?xml version="1.0" encoding="utf-8"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="${lang === "de" ? "Tagesübersicht" : "Daily Overview"}"><Table>
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
