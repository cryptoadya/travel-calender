import React, { useState } from 'react';
import { Overlay, MH } from '../ui/Layout';
import { C } from '../../constants/colors';
import { INP, FLbl } from '../ui/Inputs';
import { PBTN, SBTN } from '../ui/Buttons';
import { dName } from '../../utils/formatUtils';
import { buildAllEmployeesExcelReport, buildAllEmployeesHTMLReport, buildExcel, buildHTMLReport } from '../../utils/exportUtils';

export function AdminExportModal({ emp, entries, locked = [], lang, t, onClose }) {
  const today = new Date();
  const [from, setFrom] = useState(`${today.getFullYear() - 1}-01-01`);
  const [to, setTo] = useState(today.toISOString().split("T")[0]);
  
  return (
    <Overlay onClose={onClose}>
      <MH title={`${t.exportTitle}: ${dName(emp)}`} onClose={onClose} />
      <div style={{ marginBottom: 11 }}>
        <FLbl>{t.from}</FLbl>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={INP} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <FLbl>{t.to}</FLbl>
        <input type="date" value={to} onChange={e => setTo(e.target.value)} style={INP} />
      </div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        <button onClick={() => { buildExcel(emp, entries, from, to, lang, locked); onClose(); }} style={{ ...PBTN, background: `linear-gradient(135deg,${C.green},#00875A)`, flex: 1 }}>
          📥 {t.exportGenerate}
        </button>
        <button onClick={() => { buildHTMLReport(emp, entries, from, to, lang, locked); onClose(); }} style={{ ...PBTN, background: `linear-gradient(135deg,${C.blue},#1D4ED8)`, flex: 1 }}>
          🖨 {t.exportPDF}
        </button>
      </div>
      <button onClick={onClose} style={{ ...SBTN, width: "100%", marginTop: 8 }}>{t.cancel}</button>
    </Overlay>
  );
}

export function AdminAllEmployeesExportModal({ employees, entriesByEmployee, lockedByEmployee, year, setYear, month, setMonth, lang, t, months, years, onClose }) {
  return (
    <Overlay onClose={onClose}>
      <MH title={lang === "de" ? "Bericht: alle Mitarbeiter" : "Report: all employees"} onClose={onClose} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        <div>
          <FLbl>{lang === "de" ? "Monat" : "Month"}</FLbl>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} style={INP}>
            {months.map((label, idx) => <option key={label} value={idx}>{label}</option>)}
          </select>
        </div>
        <div>
          <FLbl>{t.yr}</FLbl>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={INP}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        <button onClick={() => { buildAllEmployeesExcelReport(employees, entriesByEmployee, lockedByEmployee, year, month, lang); onClose(); }} style={{ ...PBTN, background: `linear-gradient(135deg,${C.green},#00875A)`, flex: 1 }}>
          📥 {t.exportGenerate}
        </button>
        <button onClick={() => { buildAllEmployeesHTMLReport(employees, entriesByEmployee, lockedByEmployee, year, month, lang); onClose(); }} style={{ ...PBTN, background: `linear-gradient(135deg,${C.blue},#1D4ED8)`, flex: 1 }}>
          🖨 {t.exportPDF}
        </button>
      </div>
      <button onClick={onClose} style={{ ...SBTN, width: "100%", marginTop: 8 }}>{t.cancel}</button>
    </Overlay>
  );
}
