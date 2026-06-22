import React from 'react';
import { C } from '../../constants/colors';

export const H2 = { fontWeight: 800, fontSize: 18, color: C.dark, margin: "0 0 18px", textAlign: "center" };

export const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", ...style }}>
    {children}
  </div>
);

export const NavBar = ({ lang, setLang, t, sub, logout, onBack, children }) => (
  <div style={{ backgroundColor: C.red, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, boxShadow: "0 2px 8px rgba(226,0,26,0.25)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {onBack && <button type="button" onClick={onBack} style={{ padding: "4px 9px", borderRadius: 6, fontSize: 11, backgroundColor: "rgba(0,0,0,0.2)", color: C.white, border: "none", cursor: "pointer" }}>{t.back}</button>}
      <div style={{ color: C.white, fontWeight: 900, fontSize: 15, fontStyle: "italic", letterSpacing: -0.5, fontFamily: "Arial Black,Arial,sans-serif" }}>{t.app}</div>
      <div style={{ borderLeft: "1px solid rgba(255,255,255,0.3)", paddingLeft: 10 }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>{sub}</div>
      </div>
    </div>
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
      {children}
      {["de", "en"].map(l => (
        <button key={l} type="button" onClick={() => setLang(l)} style={{ padding: "3px 7px", borderRadius: 5, fontSize: 10, fontWeight: 700, border: "1px solid rgba(255,255,255,0.3)", backgroundColor: lang === l ? "rgba(255,255,255,0.25)" : "transparent", color: C.white, cursor: "pointer" }}>
          {l.toUpperCase()}
        </button>
      ))}
      {logout && (
        <button type="button" onClick={logout} style={{ padding: "4px 9px", borderRadius: 5, fontSize: 10, fontWeight: 600, backgroundColor: "rgba(0,0,0,0.2)", color: C.white, border: "none", cursor: "pointer" }}>
          {t.logout}
        </button>
      )}
    </div>
  </div>
);

export const Overlay = ({ onClose, children }) => (
  <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(26,26,26,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div style={{ backgroundColor: C.white, borderRadius: 14, padding: 22, width: "100%", maxWidth: 440, boxShadow: "0 24px 60px rgba(0,0,0,0.25)", maxHeight: "92vh", overflowY: "auto" }}>
      {children}
    </div>
  </div>
);

export const MH = ({ title, onClose }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
    <div style={{ fontWeight: 800, fontSize: 15, color: C.dark }}>{title}</div>
    <button type="button" onClick={onClose} style={{ fontSize: 18, border: "none", backgroundColor: "transparent", cursor: "pointer", color: C.gray }}>✕</button>
  </div>
);

export function AppLogoLogin({ lang = "de" }) {
  return (
    <div style={{ backgroundColor: C.red, borderRadius: 16, padding: "28px 48px 30px", textAlign: "center", marginBottom: 24, boxShadow: "0 8px 32px rgba(226,0,26,0.35)", width: "100%", maxWidth: 520, boxSizing: "border-box" }}>
      <div style={{ color: C.white, fontWeight: 900, fontSize: 32, fontStyle: "italic", fontFamily: "Arial Black,Arial,sans-serif", letterSpacing: -1, lineHeight: 1 }}>{lang === "de" ? "Reisekalender" : "Travel Calendar"}</div>
      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 6, letterSpacing: 2, textTransform: "uppercase" }}>{lang === "de" ? "Steuer-Compliance" : "Tax Compliance"}</div>
    </div>
  );
}
