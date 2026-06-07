import React, { useState, useRef, useEffect, useMemo } from 'react';
import { C } from '../../constants/colors';
import { COUNTRIES } from '../../constants/countries';
import { ACT_DESC } from '../../locales/translations';

export const INP = { width: "100%", padding: "8px 10px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 12, boxSizing: "border-box", color: C.dark, fontFamily: "Inter,sans-serif", outline: "none" };
export const FGRP = { marginBottom: 13 };

export const FLbl = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 700, color: C.gray, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
    {children}
  </div>
);

export function ActivitySelect({ value, onChange, acts, lang }) {
  const [openTip, setOpenTip] = useState(null);
  const ref = useRef(null);
  
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpenTip(null); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  
  return (
    <div ref={ref} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
      {acts.map(a => (
        <div key={a.id} onClick={() => { onChange(a.id); setOpenTip(null); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 7px", borderRadius: 6, border: `2px solid ${value === a.id ? a.color : C.border}`, backgroundColor: value === a.id ? a.bg : C.white, cursor: "pointer", position: "relative", userSelect: "none" }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: a.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: value === a.id ? 700 : 400, color: C.dark, flex: 1, lineHeight: 1.3 }}>{a.label}</span>
          <span onClick={e => { e.stopPropagation(); setOpenTip(openTip === a.id ? null : a.id); }} style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: openTip === a.id ? "#334155" : "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: openTip === a.id ? "#fff" : C.slate, cursor: "pointer", flexShrink: 0, lineHeight: 1 }}>i</span>
          {openTip === a.id && (
            <div style={{ position: "absolute", bottom: "calc(100% + 5px)", left: 0, right: 0, backgroundColor: "#1E293B", color: C.white, padding: "8px 10px", borderRadius: 7, fontSize: 10, lineHeight: 1.6, zIndex: 4000, boxShadow: "0 6px 20px rgba(0,0,0,0.3)", minWidth: 200 }}>
              <div style={{ fontWeight: 700, marginBottom: 3, color: a.color }}>{a.label}</div>
              {ACT_DESC[lang][a.id]}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function CountrySelect({ value, onChange, t, disabled = false }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  
  const filtered = useMemo(() => COUNTRIES.filter(c => c.code.toLowerCase().includes(q.toLowerCase()) || c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 60), [q]);
  const sel = COUNTRIES.find(c => c.code === value);
  
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => { if (disabled) return; setOpen(o => !o); setQ(""); }} style={{ ...INP, cursor: disabled ? "not-allowed" : "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", userSelect: "none", backgroundColor: disabled ? C.grayL : C.white, color: disabled ? C.gray : C.dark }}>
        <span style={{ fontSize: 12 }}>{disabled ? "–" : sel ? `${sel.code} – ${sel.name}` : t.searchCtry}</span>
        <span style={{ color: C.gray, fontSize: 10 }}>{disabled ? "" : open ? "▲" : "▼"}</span>
      </div>
      {open && !disabled && (
        <div style={{ position: "absolute", top: "calc(100% + 3px)", left: 0, right: 0, backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 8, zIndex: 2000, boxShadow: "0 6px 20px rgba(0,0,0,0.12)", maxHeight: 220, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "5px 7px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={t.searchCtry} style={{ width: "100%", padding: "5px 8px", border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 12, boxSizing: "border-box", outline: "none" }} />
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.map(c => (
              <div key={c.code} onClick={() => { onChange(c.code); setOpen(false); setQ(""); }} style={{ padding: "6px 10px", fontSize: 12, cursor: "pointer", backgroundColor: c.code === value ? C.redL : C.white }} onMouseEnter={e => e.currentTarget.style.backgroundColor = C.redL} onMouseLeave={e => e.currentTarget.style.backgroundColor = c.code === value ? C.redL : C.white}>
                <strong style={{ color: C.red }}>{c.code}</strong> – {c.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
