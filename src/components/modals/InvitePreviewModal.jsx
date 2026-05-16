import React, { useState } from 'react';
import { Overlay, MH } from '../ui/Layout';
import { C } from '../../constants/colors';
import { INP, FLbl } from '../ui/Inputs';
import { PBTN, SBTN } from '../ui/Buttons';
import { dName } from '../../utils/formatUtils';
import { fmtDate } from '../../utils/dateUtils';

export function InvitePreviewModal({ emp, lang, t, onClose, onRegen }) {
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState("");
  
  const body = lang === "de" 
    ? `Betreff: Einladung – DH ${t.app}\n\nSehr geehrte/r ${dName(emp)},\n\n🔑 Einladungscode: ${emp.inviteCode}\nGültig bis: ${fmtDate(emp.inviteExpires, lang)}${msg ? `\n\n${msg}` : ""}\n\nMit freundlichen Grüßen\nIhr Administrator` 
    : `Subject: Invitation – DH ${t.app}\n\nDear ${dName(emp)},\n\n🔑 Code: ${emp.inviteCode}\nValid until: ${fmtDate(emp.inviteExpires, lang)}${msg ? `\n\n${msg}` : ""}\n\nBest regards\nYour Administrator`;
    
  const copy = (txt, lbl) => {
    navigator.clipboard.writeText(txt).then(() => {
      setCopied(lbl);
      setTimeout(() => setCopied(""), 2000);
    });
  };
  
  return (
    <Overlay onClose={onClose}>
      <MH title={`${t.inviteCreated} – ${dName(emp)}`} onClose={onClose} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: C.grayL, borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: C.gray, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{t.inviteLabel}</div>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 6, color: C.red, fontFamily: "monospace" }}>{emp.inviteCode}</div>
          <div style={{ fontSize: 10, color: C.gray, marginTop: 2 }}>{t.inviteValidUntil} {fmtDate(emp.inviteExpires, lang)}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <button onClick={() => copy(emp.inviteCode, emp.inviteCode)} style={{ ...SBTN, fontSize: 11, padding: "5px 10px" }}>
            {copied === emp.inviteCode ? "✓" : t.copyCode}
          </button>
          <button onClick={onRegen} style={{ ...SBTN, fontSize: 10, padding: "4px 8px", color: C.red }}>
            {t.regenCode}
          </button>
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <FLbl>{t.personalMsg}</FLbl>
        <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={2} style={{ ...INP, resize: "vertical", height: 58 }} />
      </div>
      <div style={{ backgroundColor: C.grayL, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, marginBottom: 12, maxHeight: 180, overflowY: "auto" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.gray, marginBottom: 4 }}>{t.simEmail}</div>
        <pre style={{ fontSize: 11, color: C.dark, margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace", lineHeight: 1.5 }}>{body}</pre>
      </div>
      <div style={{ display: "flex", gap: 7 }}>
        <button onClick={() => copy(body, "all")} style={{ ...PBTN, background: `linear-gradient(135deg,${C.blue},#1D4ED8)` }}>
          {copied === "all" ? `✓ ${t.codeCopied}` : t.copyEmail}
        </button>
        <button onClick={onClose} style={SBTN}>{t.cancel}</button>
      </div>
    </Overlay>
  );
}
