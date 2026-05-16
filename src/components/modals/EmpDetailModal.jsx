import React from 'react';
import { Overlay, MH } from '../ui/Layout';
import { C } from '../../constants/colors';
import { PBTN, SBTN } from '../ui/Buttons';
import { dName, transferLabel, ctryName } from '../../utils/formatUtils';
import { StatusBadge } from '../ui/StatusBadge';

export function EmpDetailModal({ emp, lang, t, onEdit, onViewCal, onClose }) {
  const Row = ({ label, value, hi }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0", borderBottom: `1px solid ${C.grayL}` }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: C.gray, textTransform: "uppercase", minWidth: 110, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 12, color: hi ? C.red : C.dark, fontWeight: hi ? 700 : 400 }}>{value || <span style={{ color: C.border }}>–</span>}</span>
    </div>
  );
  
  return (
    <Overlay onClose={onClose}>
      <MH title={t.empDetails} onClose={onClose} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: "10px 12px", backgroundColor: C.grayL, borderRadius: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: C.red, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
          {(dName(emp) || "?")[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: C.dark }}>{dName(emp)}</div>
          <div style={{ fontSize: 11, color: C.gray }}>{emp.email}</div>
        </div>
        <StatusBadge status={emp.status} t={t} />
      </div>
      <Row label={t.company} value={emp.company || t.notSet} />
      <Row label={t.transferType} value={emp.transferType ? transferLabel(emp.transferType, lang) : t.notSet} hi={!!emp.transferType} />
      <Row label={t.homeCo} value={emp.homeCountry ? (emp.homeCountry + " – " + ctryName(emp.homeCountry, lang)) : t.notSet} />
      <Row label={t.hostCo} value={emp.hostCountry ? (emp.hostCountry + " – " + ctryName(emp.hostCountry, lang)) : t.notSet} />
      {emp.transferType === "assignment" && (
        <>
          <div style={{ backgroundColor: C.amberL, borderRadius: 6, padding: "5px 10px", margin: "8px 0 0", fontSize: 10, fontWeight: 700, color: "#92400E", textTransform: "uppercase" }}>Assignment</div>
          <Row label={t.homeEnt} value={emp.homeEntity || t.notSet} hi={!!emp.homeEntity} />
          <Row label={t.hostEnt} value={emp.hostEntity || t.notSet} hi={!!emp.hostEntity} />
        </>
      )}
      <div style={{ display: "flex", gap: 7, marginTop: 16 }}>
        <button onClick={onEdit} style={{ ...PBTN, background: `linear-gradient(135deg,${C.blue},#1D4ED8)`, flex: 1 }}>✏ {t.editProfile}</button>
        <button onClick={onViewCal} style={{ ...PBTN, flex: 1 }}>📅 {t.viewC}</button>
        <button onClick={onClose} style={SBTN}>{t.cancel}</button>
      </div>
    </Overlay>
  );
}
