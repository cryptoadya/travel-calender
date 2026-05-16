import React from 'react';
import { Overlay } from '../ui/Layout';
import { C } from '../../constants/colors';
import { SBTN } from '../ui/Buttons';

export function ConfirmModal({ title, message, onConfirm, onCancel, confirmText, cancelText, isDanger = false }) {
  return (
    <Overlay onClose={onCancel}>
      <div style={{ textAlign: "center", padding: "4px 0" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>{isDanger ? "⚠️" : "🔒"}</div>
        <h3 style={{ fontWeight: 800, fontSize: 16, color: C.dark, margin: "0 0 10px" }}>{title}</h3>
        <p style={{ fontSize: 13, color: C.gray, margin: "0 0 22px", lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onConfirm} style={{ flex: 1, padding: "11px 0", borderRadius: 8, backgroundColor: isDanger ? C.red : C.green, color: C.white, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
            {confirmText || "OK"}
          </button>
          <button onClick={onCancel} style={SBTN}>
            {cancelText || "Abbrechen"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
