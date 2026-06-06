import { CMAP } from '../constants/countries.js';

export const dName = u => u && (u.firstName ? `${u.firstName} ${u.lastName}`.trim() : u.name || u.email || "");

export const ctryName = (code, lang) => {
  const full = CMAP[code];
  if (!full) return code;
  const parts = full.split(" / ");
  return parts.length === 2 ? (lang === "de" ? parts[1] : parts[0]) : full;
};

export const escX = s => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const transferLabel = (type, lang) => {
  const labels = {
    hire_without_entity: "Hire without Entity",
    entity_hire: "Entity Hire",
    assignment: lang === "de" ? "Entsendung" : "Assignment"
  };
  return labels[type] || type || "–";
};
