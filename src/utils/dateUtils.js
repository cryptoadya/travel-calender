export const getDOW = (y, m, d) => {
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const yr = m < 2 ? y - 1 : y;
  return (yr + Math.floor(yr / 4) - Math.floor(yr / 100) + Math.floor(yr / 400) + t[m] + d) % 7;
};

export const isWE = (y, m, d) => {
  const w = getDOW(y, m, d);
  return w === 0 || w === 6;
};

export const fdow = (y, m) => {
  const w = getDOW(y, m, 1);
  return w === 0 ? 6 : w - 1;
};

export const dk = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export const dim = (y, m) => new Date(y, m + 1, 0).getDate();

export const fmtDate = (d, l) => new Date(d).toLocaleDateString(l === "de" ? "de-DE" : "en-GB");
