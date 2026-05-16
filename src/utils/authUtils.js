import { T } from '../locales/translations';

export const hashPw = async pw => {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
};

export const valPw = (pw, l) => {
  const e = [];
  if (pw.length < 8) e.push(T[l].pwR8);
  if (!/[A-Z]/.test(pw)) e.push(T[l].pwRU);
  if (!/[a-z]/.test(pw)) e.push(T[l].pwRL);
  if (!/[0-9]/.test(pw)) e.push(T[l].pwRD);
  if (!/[^a-zA-Z0-9]/.test(pw)) e.push(T[l].pwRS);
  return e;
};

export const genCode = () => Math.floor(100000 + Math.random() * 900000).toString();

export const genInvite = () => {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => c[Math.floor(Math.random() * c.length)]).join('');
};
