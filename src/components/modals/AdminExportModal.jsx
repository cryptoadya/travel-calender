import React, { useState } from 'react';
import { Overlay, MH } from '../ui/Layout';
import { C } from '../../constants/colors';
import { INP, FLbl } from '../ui/Inputs';
import { PBTN, SBTN } from '../ui/Buttons';
import { dName } from '../../utils/formatUtils';
import { buildExcel, buildHTMLReport } from '../../utils/exportUtils';

export function AdminExportModal({ emp, entries, lang, t, onClose }) {
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
        <button onClick={() => { buildExcel(emp, entries, from, to, lang); onClose(); }} style={{ ...PBTN, background: `linear-gradient(135deg,${C.green},#00875A)`, flex: 1 }}>
          📥 {t.exportGenerate}
        </button>
        <button onClick={() => { buildHTMLReport(emp, entries, from, to, lang); onClose(); }} style={{ ...PBTN, background: `linear-gradient(135deg,${C.blue},#1D4ED8)`, flex: 1 }}>
          🖨 {t.exportPDF}
        </button>
      </div>
      <button onClick={onClose} style={{ ...SBTN, width: "100%", marginTop: 8 }}>{t.cancel}</button>
    </Overlay>
  );
}
