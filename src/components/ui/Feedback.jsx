import React from 'react';
import { C } from '../../constants/colors';

export const Ctr = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Inter,sans-serif" }}>
    {children}
  </div>
);

export const Spin = () => (
  <div style={{ width: 30, height: 30, borderRadius: "50%", border: `3px solid ${C.redL}`, borderTopColor: C.red, animation: "spin 0.8s linear infinite" }}></div>
);

export const Notif = ({ msg }) => (
  <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, backgroundColor: C.green, color: C.white, padding: "9px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
    {msg}
  </div>
);

export const ErrBox = ({ msg }) => (
  <div style={{ backgroundColor: C.redL, color: C.red, fontSize: 11, padding: "8px 12px", borderRadius: 8, marginBottom: 12, border: `1px solid #ffb3bb`, lineHeight: 1.5 }}>
    {msg}
  </div>
);
