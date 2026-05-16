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
      <div style={{ color: C.white, fontWeight: 900, fontSize: 15, fontStyle: "italic", letterSpacing: -0.5, fontFamily: "Arial Black,Arial,sans-serif" }}>Delivery Hero</div>
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

export function DHLogoLogin({ lang = "de" }) {
  return (
    <div style={{ backgroundColor: C.red, borderRadius: 16, padding: "16px 48px 20px", textAlign: "center", marginBottom: 24, boxShadow: "0 8px 32px rgba(226,0,26,0.35)", width: "100%", maxWidth: 520, boxSizing: "border-box" }}>
      <div style={{ position: "relative", width: 112, height: 112, margin: "0 auto 10px" }}>
        <svg width="112" height="112" viewBox="0 0 112 112" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="ocean" cx="38%" cy="38%" r="65%">
              <stop offset="0%" stopColor="#5BB8E8" />
              <stop offset="60%" stopColor="#2980B9" />
              <stop offset="100%" stopColor="#1A4A6E" />
            </radialGradient>
            <radialGradient id="shine" cx="32%" cy="28%" r="35%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <clipPath id="sphereClip">
              <circle cx="56" cy="56" r="42" />
            </clipPath>
          </defs>
          <circle cx="56" cy="56" r="43" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" />
          <circle cx="56" cy="56" r="42" fill="url(#ocean)" />
          <g clipPath="url(#sphereClip)" opacity="0.95">
            <g style={{ transformOrigin: "56px 56px", animation: "globespin 18s linear infinite" }}>
              {[0, 360].map(off => (
                <g key={off} transform={`translate(${14 + off * 84 / 360 - 84 / 2} 14) scale(${84 / 360})`}>
                  <path d="M178,90 q14,-2 22,8 q8,12 4,28 q-2,18 -10,32 q-6,16 -18,32 q-6,10 -14,12 q-10,2 -16,-6 q-10,-12 -14,-30 q-6,-22 -2,-44 q4,-18 16,-26 q14,-8 32,-6 z" fill="#3FAA52" />
                  <path d="M170,68 q12,-6 28,-4 q14,2 22,-2 q8,-2 14,4 q-2,8 -12,10 q-12,4 -26,2 q-14,-2 -22,2 q-8,2 -10,-4 q0,-6 6,-8 z" fill="#3FAA52" />
                  <path d="M188,52 q8,-4 14,0 q4,4 -2,10 q-6,4 -12,2 q-4,-6 0,-12 z" fill="#3FAA52" />
                  <path d="M154,68 q4,-2 6,4 q1,6 -3,8 q-4,1 -5,-4 q-1,-6 2,-8 z" fill="#3FAA52" />
                  <path d="M222,50 q26,-6 56,-2 q34,4 56,16 q14,8 18,22 q2,14 -8,22 q-14,12 -32,14 q-26,4 -50,-2 q-22,-6 -34,-18 q-10,-12 -14,-26 q-2,-14 0,-22 q2,-4 8,-4 z" fill="#3FAA52" />
                  <path d="M254,96 q14,0 18,12 q4,16 -4,32 q-6,12 -16,12 q-8,-2 -10,-14 q-4,-18 2,-32 q4,-10 10,-10 z" fill="#3FAA52" />
                  <path d="M310,128 q12,-4 22,4 q8,6 2,14 q-12,6 -24,2 q-8,-4 -8,-12 q0,-6 8,-8 z" fill="#3FAA52" />
                  <path d="M340,138 q10,-2 14,4 q2,6 -6,10 q-10,2 -14,-4 q-2,-6 6,-10 z" fill="#3FAA52" />
                  <path d="M348,170 q26,-6 48,4 q16,8 14,22 q-2,14 -22,18 q-26,4 -46,-6 q-14,-8 -12,-22 q2,-12 18,-16 z" fill="#3FAA52" />
                  <path d="M214,170 q6,-2 8,8 q2,16 -4,22 q-6,2 -8,-8 q-2,-14 4,-22 z" fill="#3FAA52" />
                  <path d="M40,50 q-4,-8 12,-14 q24,-8 60,-6 q40,2 60,12 q16,8 14,22 q-2,16 -22,22 q-30,8 -68,4 q-32,-4 -48,-14 q-12,-8 -12,-18 q0,-4 4,-8 z" fill="#3FAA52" />
                  <path d="M132,30 q12,-4 22,2 q6,8 -2,18 q-12,8 -22,2 q-8,-6 -6,-14 q2,-6 8,-8 z" fill="#3FAA52" />
                  <path d="M70,98 q10,-2 14,8 q4,12 -2,22 q-8,12 -16,8 q-8,-6 -6,-22 q2,-12 10,-16 z" fill="#3FAA52" />
                  <path d="M86,130 q16,-6 30,2 q14,10 14,32 q0,30 -10,56 q-8,22 -22,28 q-12,4 -18,-10 q-8,-22 -6,-50 q2,-32 4,-46 q2,-10 8,-12 z" fill="#3FAA52" />
                </g>
              ))}
            </g>
          </g>
          <g clipPath="url(#sphereClip)" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6">
            <ellipse cx="56" cy="56" rx="42" ry="10" />
            <ellipse cx="56" cy="56" rx="42" ry="22" />
            <ellipse cx="56" cy="56" rx="42" ry="32" />
            <line x1="14" y1="56" x2="98" y2="56" strokeWidth="0.8" />
          </g>
          <circle cx="56" cy="56" r="42" fill="url(#shine)" pointerEvents="none" />
          <circle cx="56" cy="56" r="44" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" strokeDasharray="2,3" />
        </svg>
        {["🦸", "🦸", "🦸"].map((_, i) => (
          <span key={i} style={{ position: "absolute", top: "50%", left: "50%", marginTop: "-11px", marginLeft: "-11px", fontSize: 22, animation: `orbit${i + 1} ${4.5 + i * 0.7}s linear infinite`, display: "block", lineHeight: 1, userSelect: "none", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}>🦸</span>
        ))}
      </div>
      <div style={{ color: C.white, fontWeight: 900, fontSize: 32, fontStyle: "italic", fontFamily: "Arial Black,Arial,sans-serif", letterSpacing: -1, lineHeight: 1 }}>Delivery Hero</div>
      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 6, letterSpacing: 2, textTransform: "uppercase" }}>{lang === "de" ? "Reisekalender" : "Travel Calendar"}</div>
    </div>
  );
}
