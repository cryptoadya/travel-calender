import React from 'react';
import { C } from '../../constants/colors';

export function StatusBadge({ status, t }) {
  const cfg = {
    invited: { bg: C.amberL, color: C.amber, label: t.invited, dot: "○" },
    active: { bg: C.greenL, color: C.green, label: t.active, dot: "●" },
    inactive: { bg: "#F1F5F9", color: C.slate, label: t.inactive, dot: "◌" }
  }[status] || { bg: C.grayL, color: C.gray, label: status, dot: "○" };
  
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, backgroundColor: cfg.bg, color: cfg.color, flexShrink: 0 }}>
      {cfg.dot} {cfg.label}
    </span>
  );
}
