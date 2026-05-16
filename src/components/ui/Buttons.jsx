import React from 'react';
import { C } from '../../constants/colors';

export const PBTN = { width: "100%", padding: "11px 0", borderRadius: 9, backgroundColor: C.red, color: C.white, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13 };
export const SBTN = { padding: "10px 14px", borderRadius: 8, backgroundColor: C.grayL, color: C.gray, border: `1px solid ${C.border}`, cursor: "pointer", fontSize: 13 };
export const NAVB = { padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.border}`, backgroundColor: C.white, cursor: "pointer", fontSize: 12, color: C.dark };
export const PWTOG = { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, border: "none", backgroundColor: "transparent", cursor: "pointer", color: C.gray, fontWeight: 600 };
export const LINKGRAY = { color: C.gray, fontSize: 12, fontWeight: 500, border: "none", backgroundColor: "transparent", cursor: "pointer", textDecoration: "underline" };
export const LINKRED = { color: C.red, fontWeight: 700, border: "none", backgroundColor: "transparent", cursor: "pointer", fontSize: 12 };

export const TB = ({ onClick, children, active, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled} style={{ padding: "4px 9px", borderRadius: 6, fontSize: 11, border: `1px solid ${active ? C.red : C.border}`, backgroundColor: active ? C.redL : C.white, color: active ? C.red : C.gray, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1 }}>
    {children}
  </button>
);

export const NBtn = ({ children, active, onClick }) => (
  <button type="button" onClick={onClick} style={{ padding: "5px 11px", borderRadius: 6, fontSize: 11, fontWeight: 700, backgroundColor: active ? "rgba(255,255,255,0.2)" : "transparent", color: active ? C.white : "rgba(255,255,255,0.65)", border: active ? "1px solid rgba(255,255,255,0.3)" : "1px solid transparent", cursor: "pointer" }}>
    {children}
  </button>
);

export function ToggleSW({ on, onToggle, size = 20 }) {
  return (
    <div onClick={e => { e.stopPropagation(); onToggle(); }} style={{ width: size * 1.9, height: size, borderRadius: size / 2, backgroundColor: on ? C.green : "#D1D5DB", position: "relative", cursor: "pointer", transition: "background 0.25s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 2, left: on ? size * 0.85 : 2, width: size - 4, height: size - 4, borderRadius: "50%", backgroundColor: "white", transition: "left 0.25s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
    </div>
  );
}
