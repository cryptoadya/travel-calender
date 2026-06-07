import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { C } from '../constants/colors';
import { AVAIL_YEARS } from '../constants/config';
import { getActs, MO, MOS, DY, ACT_IDS, ACT_DESC } from '../locales/translations';
import { isWE, fdow, dk, dim } from '../utils/dateUtils';
import { deriveMonthStatus, getMissingDays, getMonthKey, isMonthLockableByDate, parseLocalDate, selectedRangeOverlapsLockedMonth } from '../utils/monthStatus';
import { ctryName, dName } from '../utils/formatUtils';
import { calcYearSummary, calcMonthStats } from '../utils/statsUtils';
import { buildCsvRows } from '../utils/exportUtils';
import { normalizeReminderSettings, renderReminderMessage } from '../utils/reminderUtils';
import { appendLockLog } from '../utils/lockLog';
import { isCountrylessActivity, normalizeActivityId, normalizeEntryForSave } from '../utils/activityUtils';

import { NavBar, Card, Overlay, MH } from '../components/ui/Layout';
import { Ctr, Spin, Notif } from '../components/ui/Feedback';
import { NBtn, SBTN, PBTN, TB, NAVB } from '../components/ui/Buttons';
import { INP, FLbl, CountrySelect, ActivitySelect } from '../components/ui/Inputs';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { CMAP } from '../constants/countries';

export function CalendarApp({ lang, setLang, t, user, logout, uid, readOnly, empName, onBack, adminUnlock, initialYr, initialMo }) {
  const today = new Date();
  const [yr, setYr] = useState(initialYr ?? today.getFullYear());
  const [mo, setMo] = useState(initialMo ?? today.getMonth());
  const [entries, setEntries] = useState({});
  const [locked, setLocked] = useState([]);
  const [sel, setSel] = useState([]);
  const [modal, setModal] = useState(false);
  const [bulk, setBulk] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [view, setView] = useState(readOnly ? "cal" : "dash");
  const [showMiss, setShowMiss] = useState(false);
  const [notif, setNotif] = useState(null);
  const [ldg, setLdg] = useState(true);
  const [lockErr, setLockErr] = useState(null);
  const [bulkErr, setBulkErr] = useState(null);
  const [csvErr, setCsvErr] = useState(null);
  const [lockConfirm, setLockConfirm] = useState(false);
  const [unlockConfirm, setUnlockConfirm] = useState(false);
  const [remSettings, setRemSettings] = useState(normalizeReminderSettings());
  const [remDis, setRemDis] = useState(false);
  const [legendTip, setLegendTip] = useState(null);
  const [me, setMe] = useState({ loc: "DE", act: "work", period: "full", amL: "DE", pmL: "DE", amA: "work", pmA: "work", notes: "", ov: false });
  const [bd, setBd] = useState({ start: "", end: "", inc: "weekdays", loc: "DE", act: "work" });
  const [csvCfg, setCsvCfg] = useState({ mode: "month", year: today.getFullYear(), month: today.getMonth(), start: "", end: "" });
  const [winH, setWinH] = useState(window.innerHeight);

  useEffect(() => {
    const onResize = () => setWinH(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Dynamic cell height: fills available space below navbar/toolbar/legend
  // ~48px navbar, ~48px toolbar, ~30px day headers, ~50px legend+lock, ~24px padding
  const calendarRows = useMemo(() => {
    const fd = fdow(yr, mo), d = dim(yr, mo);
    return Math.ceil((fd + d) / 7);
  }, [yr, mo]);
  const cellH = useMemo(() => {
    // navbar ~48, month-nav+toolbar ~76, day-headers ~24, legend ~44, complete-block ~80, padding ~24
    const reserved = 48 + 76 + 24 + 44 + 80 + 24;
    const available = winH - reserved;
    return Math.max(60, Math.floor(available / calendarRows));
  }, [winH, calendarRows]);

  const acts = getActs(lang);
  const actMap = Object.fromEntries(acts.map(a => [a.id, a]));
  const getActMeta = id => actMap[normalizeActivityId(id)] || { color: C.gray, bg: C.white, label: normalizeActivityId(id) || "" };
  const getCellLoc = (loc, act) => isCountrylessActivity(act) ? "–" : (loc || "");
  const notify = msg => { setNotif(msg); setTimeout(() => setNotif(null), 2500); };

  useEffect(() => {
    setLdg(true);
    (async () => {
      let e = {}, l = [];
      try { const r = await window.storage.get(`e-${uid}`, true); if (r) e = JSON.parse(r.value); } catch (x) { }
      try { const r = await window.storage.get(`l-${uid}`, true); if (r) l = JSON.parse(r.value); } catch (x) { }
      setEntries(e); setLocked(l);
      if (!readOnly) {
        try {
          const r = await window.storage.get("rem-settings", true);
          setRemSettings(normalizeReminderSettings(r ? JSON.parse(r.value) : null));
        } catch (x) { setRemSettings(normalizeReminderSettings()); }
      }
      setLdg(false);
    })();
  }, [uid]);

  const saveE = async ne => { setEntries(ne); try { await window.storage.set(`e-${uid}`, JSON.stringify(ne), true); } catch (x) { } };
  const saveL = async nl => { setLocked(nl); try { await window.storage.set(`l-${uid}`, JSON.stringify(nl), true); } catch (x) { } };

  const mkey = getMonthKey(yr, mo);
  const currentMonthStatus = useMemo(() => deriveMonthStatus({ entries, lockedMonths: locked, year: yr, month: mo, today }), [entries, locked, yr, mo, today]);
  const isLk = currentMonthStatus.locked;
  const totalD = currentMonthStatus.total;
  const filledD = currentMonthStatus.fill;
  const pct = currentMonthStatus.pct;
  const reminder = useMemo(() => {
    if (readOnly || !remSettings.enabled || today.getDate() < remSettings.firstReminderDay) return null;
    const cy = today.getFullYear(), cm = today.getMonth();
    const total = dim(cy, cm);
    let missing = 0;
    for (let i = 1; i <= total; i++) if (!entries[dk(cy, cm, i)]) missing++;
    const mk = `${cy}-${String(cm + 1).padStart(2, "0")}`;
    const notLocked = !locked.includes(mk);
    if (missing === 0 && !notLocked) return null;
    return {
      month: cm,
      year: cy,
      missing,
      notLocked,
      strong: today.getDate() >= remSettings.dailyReminderStartDay,
      msg: renderReminderMessage(remSettings.msg, [`${MO[lang][cm]} ${cy}`], t.defaultReminderMsg)
    };
  }, [readOnly, remSettings, today, entries, locked, lang, t.defaultReminderMsg]);
  const prevMo = () => { setSel([]); mo === 0 ? (setMo(11), setYr(y => y - 1)) : setMo(m => m - 1); };
  const nextMo = () => { setSel([]); mo === 11 ? (setMo(0), setYr(y => y + 1)) : setMo(m => m + 1); };
  const clickDay = d => { if (isLk || readOnly) return; const k = dk(yr, mo, d); setSel(s => s.includes(k) ? s.filter(x => x !== k) : [...s, k]); };
  const openModal = () => {
    if (!sel.length) return;
    const ex = entries[sel[0]];
    const normalized = ex ? normalizeEntryForSave({ ...ex, notes: ex.notes || "" }) : null;
    setMe(normalized ? { loc: normalized.loc || "", act: normalized.act || "work", period: normalized.period || "full", amL: normalized.amL || "", pmL: normalized.pmL || "", amA: normalized.amA || "work", pmA: normalized.pmA || "work", notes: normalized.notes || "", ov: false } : { loc: "DE", act: "work", period: "full", amL: "DE", pmL: "DE", amA: "work", pmA: "work", notes: "", ov: false });
    setModal(true);
  };
  const saveEntry = () => { const ne = { ...entries }; const cleanEntry = normalizeEntryForSave({ loc: me.loc, act: me.act, period: me.period, amL: me.amL, pmL: me.pmL, amA: me.amA, pmA: me.pmA, notes: me.notes }); sel.forEach(k => { if (ne[k] && !me.ov && sel.length > 1) return; ne[k] = cleanEntry; }); saveE(ne); setSel([]); setModal(false); notify(`${sel.length} ${t.days} ${lang === "de" ? "gespeichert" : "saved"}`); };
  const deleteEntry = () => { const ne = { ...entries }; sel.forEach(k => { delete ne[k]; }); saveE(ne); setSel([]); setModal(false); notify(`${sel.length} ${t.days} ${lang === "de" ? "gelöscht" : "deleted"}`); };
  const openBulk = () => {
    setBulkErr(null);
    setBd(b => ({
      ...b,
      start: dk(yr, mo, 1),
      end: dk(yr, mo, dim(yr, mo))
    }));
    setBulk(true);
  };
  
  const saveBulk = () => {
    if (!bd.start || !bd.end) return;
    setBulkErr(null);
    if (selectedRangeOverlapsLockedMonth({ start: bd.start, end: bd.end, include: bd.inc, lockedMonths: locked })) {
      setBulkErr(lang === "de" ? "Ein Teil des ausgewählten Kalenders ist bereits gesperrt." : "Part of the selected calendar period is already locked.");
      return;
    }
    const s = parseLocalDate(bd.start), e = parseLocalDate(bd.end);
    if (!s || !e || s > e) return;
    const ne = { ...entries };
    let cnt = 0;
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      const dIdx = d.getDate(), m = d.getMonth(), y = d.getFullYear();
      if (bd.inc === "weekdays" && isWE(y, m, dIdx)) continue;
      if (bd.inc === "weekends" && !isWE(y, m, dIdx)) continue;
      const k = dk(y, m, dIdx);
      ne[k] = normalizeEntryForSave({ loc: bd.loc, act: bd.act, period: "full", amL: bd.loc, pmL: bd.loc, amA: bd.act, pmA: bd.act, notes: "" });
      cnt++;
    }
    saveE(ne); setBulk(false); notify(`${cnt} ${lang === "de" ? "Tage gespeichert" : "days saved"}`);
  };

  const tryLockMo = () => {
    if (!isMonthLockableByDate(yr, mo, today)) {
      setLockErr({ future: true });
      return;
    }
    const miss = getMissingDays(entries, yr, mo);
    if (miss.length) { setLockErr({ missing: miss }); return; }
    setLockConfirm(true);
  };
  const doLockMo = async () => {
    const alreadyLocked = locked.includes(mkey);
    await saveL(alreadyLocked ? locked : [...locked, mkey]);
    if (!alreadyLocked) {
      try {
        await appendLockLog({
          employeeId: uid,
          employeeName: dName(user),
          employeeEmail: user?.email || "",
          monthKey: mkey,
          year: yr,
          month: mo + 1,
          actorRole: "employee",
          actorId: uid,
          actorName: dName(user),
          actorEmail: user?.email || ""
        });
      } catch (e) { }
    }
    setLockConfirm(false);
    notify(`${MO[lang][mo]} ${yr} ${t.locked} 🔒`);
  };
  const unlockAdmin = async () => { if (adminUnlock) await adminUnlock(mkey); saveL(locked.filter(m => m !== mkey)); setUnlockConfirm(false); notify(`${MO[lang][mo]} ${yr} ${t.muOK}`); };
  const exportCSV = () => {
    setCsvErr(null);
    const start = csvCfg.mode === "month" ? dk(csvCfg.year, csvCfg.month, 1) : csvCfg.start;
    const end = csvCfg.mode === "month" ? dk(csvCfg.year, csvCfg.month, dim(csvCfg.year, csvCfg.month)) : csvCfg.end;
    const s = parseLocalDate(start), e = parseLocalDate(end);
    if (!s || !e || s > e) {
      setCsvErr(lang === "de" ? "Bitte wählen Sie einen gültigen Zeitraum." : "Please select a valid date range.");
      return;
    }
    const rows = buildCsvRows(entries, start, end, lang, locked);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF" + rows.map(r => r.join(";")).join("\n")], { type: "text/csv;charset=utf-8;" }));
    a.download = `${t.app}_${start}_${end}.csv`;
    a.click();
    setCsvOpen(false);
  };

  const unfilledPastMonths = useMemo(() => {
    const now = new Date(), result = [];
    for (let y = 2026; y <= now.getFullYear(); y++) {
      for (let m = 0; m < 12; m++) {
        if (y > now.getFullYear() || (y === now.getFullYear() && m >= now.getMonth())) continue;
        const d = dim(y, m); let fill = 0;
        for (let i = 1; i <= d; i++) if (entries[dk(y, m, i)]) fill++;
        const mk = `${y}-${String(m + 1).padStart(2, "0")}`;
        if (fill < d && !locked.includes(mk)) result.push({ y, m, fill, total: d, mk });
      }
    }
    return result;
  }, [entries, locked]);

  const completedUnlockedMonths = useMemo(() => {
    const now = new Date(), result = [];
    for (let y = 2026; y <= now.getFullYear(); y++) {
      for (let m = 0; m < 12; m++) {
        if (y > now.getFullYear() || (y === now.getFullYear() && m >= now.getMonth())) continue;
        const d = dim(y, m); let fill = 0;
        for (let i = 1; i <= d; i++) if (entries[dk(y, m, i)]) fill++;
        const mk = `${y}-${String(m + 1).padStart(2, "0")}`;
        if (fill === d && !locked.includes(mk)) result.push({ y, m, total: d, mk });
      }
    }
    return result;
  }, [entries, locked]);

  const yearD = useMemo(() => { const md = []; for (let m = 0; m < 12; m++) { const d = dim(yr, m); let miss = 0, fill = 0; for (let i = 1; i <= d; i++) { if (entries[dk(yr, m, i)]) fill++; else miss++; } md.push({ m, miss, fill, total: d }); } return { md }; }, [yr, entries]);
  const yearSum = useMemo(() => calcYearSummary(entries, yr), [yr, entries]);
  const monthStats = useMemo(() => calcMonthStats(entries, yr, mo, lang), [yr, mo, entries, lang]);

  const renderCal = () => {
    const fd = fdow(yr, mo), d = dim(yr, mo), cells = [];
    for (let i = 0; i < fd; i++) cells.push(<div key={`e${i}`} style={{ minHeight: cellH }} />);
    for (let day = 1; day <= d; day++) {
      const k = dk(yr, mo, day), e = entries[k], we = isWE(yr, mo, day), isTod = k === today.toISOString().split("T")[0], isSel = sel.includes(k), miss = !e && showMiss;
      let bg = we && !e ? "#F3F4F6" : C.white;
      if (e) bg = e.period === "split" ? "#FEFCE8" : (getActMeta(e.act)?.bg || C.white);
      if (miss) bg = C.redL;
      cells.push(<div key={day} onClick={() => clickDay(day)} style={{ minHeight: cellH, backgroundColor: bg, border: `2px solid ${isSel ? C.red : isTod ? C.amber : C.border}`, borderRadius: 7, padding: "5px 6px", cursor: (isLk || readOnly) ? "default" : "pointer", boxShadow: isSel ? `0 0 0 2px ${C.redL}` : "none", position: "relative", boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 10, fontWeight: 700, color: isTod ? C.amber : we ? C.gray : C.dark }}>{day}</span><span style={{ fontSize: 8 }}>{isLk ? "🔒" : ""}</span></div>
        {e && (e.period === "split" ? <div style={{ display: "flex", gap: 2, marginTop: 2 }}><div style={{ flex: 1, borderRadius: 3, padding: "1px", backgroundColor: getActMeta(e.amA).color || C.gray, color: C.white, fontSize: 6, textAlign: "center" }}>{getCellLoc(e.amL, e.amA)}</div><div style={{ flex: 1, borderRadius: 3, padding: "1px", backgroundColor: getActMeta(e.pmA).color || C.gray, color: C.white, fontSize: 6, textAlign: "center" }}>{getCellLoc(e.pmL, e.pmA)}</div></div> : <div style={{ marginTop: 2, borderRadius: 3, padding: "1px 3px", backgroundColor: getActMeta(e.act).color || C.gray, color: C.white, fontSize: 7, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{isCountrylessActivity(e.act) ? getActMeta(e.act).label : `${e.loc || ""} · ${getActMeta(e.act).label?.slice(0, 6) || ""}`}</div>)}
        {miss && <div style={{ fontSize: 7, color: C.red, textAlign: "center", marginTop: 1 }}>⚠</div>}
      </div>);
    }
    return cells;
  };

  if (ldg) return <Ctr><Spin /></Ctr>;

  const tabs = readOnly ? [["cal", `📅 ${t.cal}`], ["yr", `📊 ${t.yr}`]] : [["dash", "🏠 " + t.dashboard], ["cal", `📅 ${t.cal}`], ["yr", `📊 ${t.yr}`], ["instr", `📖 ${t.instr}`]];

  return (
    <div style={{ fontFamily: "Inter,sans-serif", backgroundColor: C.grayL, minHeight: "100vh" }} onClick={() => setLegendTip(null)}>
      {notif && <Notif msg={notif} />}
      {lockConfirm && <ConfirmModal title={t.cfmLockTitle} message={`${MO[lang][mo]} ${yr} – ${t.cfmLockMsg}`} onConfirm={doLockMo} onCancel={() => setLockConfirm(false)} confirmText={t.yes} cancelText={t.cancel} isDanger={false} />}
      {unlockConfirm && <ConfirmModal title={t.unlock} message={`${MO[lang][mo]} ${yr} – ${lang === "de" ? "Diesen Monat entsperren?" : "Unlock this month?"}`} onConfirm={unlockAdmin} onCancel={() => setUnlockConfirm(false)} confirmText={t.yes} cancelText={t.cancel} isDanger={false} />}
      <NavBar lang={lang} setLang={setLang} t={t} sub={(empName || dName(user)) + (readOnly ? ` ${t.ro}` : "")} logout={!readOnly ? logout : null} onBack={onBack}>
        {tabs.map(([v, l]) => <NBtn key={v} active={view === v} onClick={() => setView(v)}>{l}</NBtn>)}
      </NavBar>
      {view === "dash" && <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ fontWeight: 800, fontSize: 18, color: C.dark, marginBottom: 12 }}>{lang === "de" ? `Hallo, ${dName(user).split(" ")[0]}!` : `Hi, ${dName(user).split(" ")[0]}!`}</h2>
        {reminder && !remDis && <div style={{ backgroundColor: reminder.strong ? C.red : C.amber, color: C.white, padding: reminder.strong ? "11px 14px" : "9px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", borderRadius: 8, marginBottom: 12, border: reminder.strong ? `2px solid ${C.redD}` : "none" }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>
            {reminder.strong && <span style={{ marginRight: 8 }}>{t.strongerReminderLabel}</span>}
            {reminder.msg}
            <span style={{ marginLeft: 8, fontWeight: 800 }}>
              {[
                reminder.missing > 0 ? t.reminderIssueMissingDays.replace("{count}", reminder.missing) : null,
                reminder.notLocked ? t.reminderIssueNotLocked : null
              ].filter(Boolean).join(" + ")}
            </span>
          </span>
          <button onClick={() => setRemDis(true)} style={{ padding: "3px 9px", borderRadius: 5, fontSize: 11, fontWeight: 700, border: "1px solid rgba(255,255,255,0.4)", backgroundColor: "transparent", color: C.white, cursor: "pointer" }}>{t.remDis}</button>
        </div>}
        <Card style={{ backgroundColor: C.blueL, borderColor: "#BFDBFE", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: C.blue, marginBottom: 4 }}>ℹ️ {lang === "de" ? "Frist zum Ausfüllen" : "Submission Deadline"}</div>
          <div style={{ fontSize: 12, color: C.dark, lineHeight: 1.6 }}>{lang === "de" ? "Bitte füllen Sie Ihren Kalender aus und sperren Sie jeden Monat bis spätestens am 3. des Folgemonats." : "Please complete your calendar and lock each month by the 3rd of the following month at the latest."}</div>
        </Card>
        <Card>
          <div style={{ fontWeight: 800, fontSize: 14, color: C.dark, marginBottom: 8 }}>⚡ {t.tasks}</div>
          {completedUnlockedMonths.length > 0 && <div style={{ marginBottom: 10 }}>
            {completedUnlockedMonths.map(({ y, m, total }) => (
              <div key={`${y}-${m}`} onClick={() => { setYr(y); setMo(m); setView("cal"); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 7, backgroundColor: C.amberL, border: `1px solid #fde68a`, marginBottom: 5, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14 }}>⚠️</span>
                  <div><div style={{ fontWeight: 700, fontSize: 12, color: "#92400E" }}>{MO[lang][m]} {y}</div><div style={{ fontSize: 10, color: "#92400E" }}>{lang === "de" ? `Vollständig ausgefüllt (${total}/${total}), aber noch nicht gesperrt.` : `Fully completed (${total}/${total}) but not locked yet.`}</div></div>
                </div>
                <span style={{ fontSize: 11, color: "#92400E", fontWeight: 700 }}>→ {lang === "de" ? "Sperren" : "Lock"}</span>
              </div>
            ))}
          </div>}
          {unfilledPastMonths.length === 0 && completedUnlockedMonths.length === 0
            ? <div style={{ color: C.green, fontWeight: 700, fontSize: 13 }}>✓ {t.noTasks}</div>
            : unfilledPastMonths.length > 0 && <>
              <div style={{ fontSize: 12, color: C.gray, marginBottom: 8 }}>{t.taskHint}</div>
              {unfilledPastMonths.map(({ y, m, fill, total }) => (
                <div key={`${y}-${m}`} onClick={() => { setYr(y); setMo(m); setView("cal"); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 7, backgroundColor: C.redL, border: `1px solid #ffb3bb`, marginBottom: 5, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>⚠️</span>
                    <div><div style={{ fontWeight: 700, fontSize: 12, color: C.red }}>{MO[lang][m]} {y}</div><div style={{ fontSize: 10, color: C.redD }}>{fill}/{total} {lang === "de" ? "Tage ausgefüllt" : "days filled"}</div></div>
                  </div>
                  <span style={{ fontSize: 11, color: C.red, fontWeight: 700 }}>→ {lang === "de" ? "Ausfüllen" : "Fill in"}</span>
                </div>
              ))}
            </>}
        </Card>
      </div>}

      {view === "cal" && <div style={{ padding: "8px 13px", maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <button onClick={prevMo} style={NAVB}>←</button>
            <div style={{ minWidth: 178, textAlign: "center", fontWeight: 800, fontSize: 17, color: C.dark }}>{MO[lang][mo]} {yr}</div>
            <button onClick={nextMo} style={NAVB}>→</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <select value={yr} onChange={e => setYr(Number(e.target.value))} style={{ ...INP, width: "auto", padding: "4px 8px", fontSize: 12 }}>
              {AVAIL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span style={{ fontSize: 11, color: C.gray }}>{filledD}/{totalD} ({pct}%)</span>
            <div style={{ width: 60, height: 6, backgroundColor: C.border, borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", backgroundColor: pct === 100 ? C.green : pct > 60 ? C.amber : C.red, borderRadius: 3, transition: "width 0.3s" }} /></div>
          </div>
        </div>
        {lockErr && <div style={{ backgroundColor: C.redL, border: `1px solid #ffb3bb`, borderRadius: 8, padding: "10px 13px", marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: C.red }}>{lockErr.future ? (lang === "de" ? "❌ Dieser Monat kann noch nicht gesperrt werden." : "❌ This month cannot be locked yet.") : t.lockErr}</div>
          <div style={{ fontSize: 11, color: C.redD, marginTop: 2 }}>{lockErr.future ? (lang === "de" ? "Ein Monat kann erst ab dem ersten Kalendertag dieses Monats gesperrt werden." : "A month can only be locked from the first calendar day of that month.") : `${t.lockErrS} ${lockErr.missing.slice(0, 25).join(", ")}${lockErr.missing.length > 25 ? "…" : ""}`}</div>
          <button onClick={() => setLockErr(null)} style={{ marginTop: 4, fontSize: 10, border: `1px solid ${C.border}`, backgroundColor: C.white, borderRadius: 5, padding: "2px 8px", cursor: "pointer", color: C.gray }}>✕</button>
        </div>}
        {!readOnly && <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}><TB onClick={() => setShowMiss(s => !s)} active={showMiss}>⚠ {showMiss ? t.hideM : t.showM}</TB><TB onClick={openBulk}>📋 {t.bulk}</TB><TB onClick={tryLockMo} disabled={isLk}>{isLk ? `🔒 ${t.locked}` : `🔒 ${t.lock}`}</TB><TB onClick={() => { setCsvErr(null); setCsvCfg(c => ({ ...c, year: yr, month: mo })); setCsvOpen(true); }}>⬇ CSV</TB>{sel.length > 0 && <><button onClick={openModal} style={{ padding: "4px 11px", borderRadius: 6, fontSize: 11, fontWeight: 700, backgroundColor: C.red, color: C.white, border: "none", cursor: "pointer" }}>✏ {sel.length} {t.editD}</button><TB onClick={() => setSel([])}>✕ {t.clearS}</TB></>}</div>}
        {readOnly && isLk && adminUnlock && <div style={{ marginBottom: 8 }}><button onClick={() => setUnlockConfirm(true)} style={{ padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700, backgroundColor: C.red, color: C.white, border: "none", cursor: "pointer" }}>🔓 {t.unlock} {MO[lang][mo]} {yr}</button></div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 3 }}>{DY[lang].map((d, i) => <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: i >= 5 ? C.gray : "#374151", padding: "2px 0" }}>{d}</div>)}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>{renderCal()}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 14 }}>
          {acts.map(a => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 3, position: "relative" }}>
              <div style={{ width: 11, height: 11, borderRadius: 3, backgroundColor: a.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{a.label}</span>
              <span onClick={e => { e.stopPropagation(); setLegendTip(legendTip === a.id ? null : a.id); }} style={{ width: 17, height: 17, borderRadius: "50%", backgroundColor: legendTip === a.id ? "#334155" : "#E2E8F0", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: legendTip === a.id ? "#fff" : C.slate, cursor: "pointer", flexShrink: 0, marginLeft: 2, lineHeight: 1, userSelect: "none" }}>i</span>
              {legendTip === a.id && <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, backgroundColor: "#1E293B", color: "#fff", padding: "8px 10px", borderRadius: 7, fontSize: 10, lineHeight: 1.6, zIndex: 4000, boxShadow: "0 6px 20px rgba(0,0,0,0.3)", minWidth: 220, maxWidth: 280 }}>
                <div style={{ fontWeight: 700, marginBottom: 3, color: a.color }}>{a.label}</div>
                {ACT_DESC[lang][a.id]}
              </div>}
            </div>
          ))}
        </div>
        {!readOnly && !isLk && <div style={{ marginTop: 12, padding: "12px 14px", backgroundColor: C.greenL, border: `1px solid #86efac`, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div><div style={{ fontWeight: 700, fontSize: 12, color: C.green, marginBottom: 2 }}>💡 {lang === "de" ? "Monat abschließen" : "Complete Month"}</div><div style={{ fontSize: 11, color: "#166534" }}>{t.lockHint}</div></div>
          <button onClick={tryLockMo} style={{ padding: "8px 14px", borderRadius: 8, backgroundColor: C.green, color: C.white, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>✅ {t.completeAndLock}</button>
        </div>}
        {!readOnly && isLk && <div style={{ marginTop: 12, padding: "10px 14px", backgroundColor: C.greenL, border: `1px solid #86efac`, borderRadius: 10, fontSize: 12, color: "#166534", fontWeight: 700 }}>🔒 {lang === "de" ? "Monat gesperrt und bestätigt." : "Month locked and confirmed."}</div>}
        {Object.keys(monthStats.byCo).length > 0 && <div style={{ marginTop: 14, backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: 13 }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: C.dark, marginBottom: 10 }}>📊 {t.monthStats} – {MO[lang][mo]} {yr}</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th style={{ textAlign: "left", padding: "3px 6px", fontSize: 10, color: C.gray, fontWeight: 700 }}>{lang === "de" ? "Land" : "Country"}</th>
                {acts.filter(a => ACT_IDS.includes(a.id)).map(a => <th key={a.id} style={{ textAlign: "center", padding: "3px 4px", fontSize: 9, color: C.gray, fontWeight: 700, minWidth: 36 }}><div style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: a.color, margin: "0 auto 2px" }} />{a.label.split(" ")[0]}</th>)}
                <th style={{ textAlign: "center", padding: "3px 6px", fontSize: 10, color: C.dark, fontWeight: 700 }}>∑</th>
              </tr></thead>
              <tbody>{Object.entries(monthStats.byCo).sort((a, b) => Object.values(b[1]).reduce((s, v) => s + v, 0) - Object.values(a[1]).reduce((s, v) => s + v, 0)).map(([co, ac]) => { const total = Object.values(ac).reduce((s, v) => s + v, 0); return (<tr key={co} style={{ borderBottom: `1px solid ${C.grayL}` }}><td style={{ padding: "3px 6px", fontSize: 11 }}><span style={{ fontWeight: 700, color: C.dark }}>{co}</span>{CMAP[co] && <span style={{ color: C.gray, marginLeft: 4, fontWeight: 400 }}>{ctryName(co, lang)}</span>}</td>{ACT_IDS.map(id => <td key={id} style={{ textAlign: "center", padding: "3px 4px", fontSize: 11, color: ac[id] > 0 ? C.dark : C.border }}>{ac[id] > 0 ? ac[id] : "–"}</td>)}<td style={{ textAlign: "center", padding: "3px 6px", fontWeight: 800, fontSize: 11, color: C.blue }}>{total}</td></tr>); })}</tbody>
              <tfoot><tr style={{ borderTop: `2px solid ${C.border}`, backgroundColor: C.grayL }}><td style={{ padding: "3px 6px", fontWeight: 700, fontSize: 11, color: C.dark }}>∑</td>{ACT_IDS.map(id => { const tot = Object.values(monthStats.byCo).reduce((s, ac) => s + (ac[id] || 0), 0); return <td key={id} style={{ textAlign: "center", padding: "3px 4px", fontSize: 11, fontWeight: 700, color: tot > 0 ? C.dark : C.border }}>{tot > 0 ? tot : "–"}</td>; })} <td style={{ textAlign: "center", padding: "3px 6px", fontWeight: 800, fontSize: 11, color: C.blue }}>{Object.values(monthStats.byCo).reduce((s, ac) => s + Object.values(ac).reduce((a, b) => a + b, 0), 0)}</td></tr></tfoot>
            </table>
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap", fontSize: 10, color: C.gray }}>
            <span>📅 {lang === "de" ? "Wochenenden" : "Weekends"}: <strong>{monthStats.wknd}</strong></span>
            {monthStats.miss > 0 && <span style={{ color: C.red }}>⚠ {lang === "de" ? "Fehlende Tage" : "Missing days"}: <strong>{monthStats.miss}</strong></span>}
            {monthStats.miss === 0 && <span style={{ color: C.green }}>✓ {t.complete}</span>}
          </div>
        </div>}
      </div>}

      {view === "yr" && <div style={{ padding: 13, maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontWeight: 800, fontSize: 16, color: C.dark, margin: 0 }}>{t.yr}</h2>
          <select value={yr} onChange={e => setYr(Number(e.target.value))} style={{ ...INP, width: "auto", padding: "5px 10px", fontSize: 12 }}>
            {AVAIL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
          {yearD.md.map(({ m, miss, fill, total }) => {
            const p = Math.round((fill / total) * 100);
            const isFuture = (yr > today.getFullYear()) || (yr === today.getFullYear() && m > today.getMonth());
            const mk = `${yr}-${String(m + 1).padStart(2, "0")}`, isLkM = locked.includes(mk);
            return (<Card key={m} onClick={() => { setMo(m); setView("cal"); }} style={{ cursor: "pointer", opacity: isFuture ? 0.5 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: C.dark }}>{MO[lang][m]}</span>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {isLkM && <span style={{ fontSize: 10 }}>🔒</span>}
                  {!isFuture && miss > 0 && !isLkM && <span style={{ fontSize: 12 }}>⚠️</span>}
                  <span style={{ fontSize: 9, fontWeight: 700, color: miss > 0 && !isFuture ? C.red : C.green }}>{miss > 0 && !isFuture ? `${miss} ${t.missing}` : isFuture ? "–" : t.complete}</span>
                </div>
              </div>
              <div style={{ height: 5, backgroundColor: C.border, borderRadius: 3, marginBottom: 4 }}><div style={{ width: `${p}%`, height: "100%", backgroundColor: p === 100 ? C.green : p > 60 ? C.amber : C.red, borderRadius: 3 }} /></div>
              <div style={{ fontSize: 10, color: C.gray }}>{fill}/{total} · {p}%</div>
            </Card>);
          })}
        </div>
        {Object.keys(yearSum).length > 0 && <>
          <Card style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.dark, marginBottom: 10 }}>🌍 {t.daysPerCo} {yr}</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th style={{ textAlign: "left", padding: "4px 6px", fontSize: 10, color: C.gray, fontWeight: 700 }}>{lang === "de" ? "Land" : "Country"}</th>
                <th style={{ textAlign: "center", padding: "4px 6px", fontSize: 10, color: C.gray, fontWeight: 700 }}>{lang === "de" ? "Gesamttage" : "Total Days"}</th>
                <th style={{ textAlign: "center", padding: "4px 6px", fontSize: 10, color: C.gray, fontWeight: 700 }}>{lang === "de" ? "Arbeitstage" : "Work Days"}</th>
              </tr></thead>
              <tbody>{Object.entries(yearSum).sort((a, b) => b[1].total - a[1].total).map(([code, { total, work }]) => (
                <tr key={code} style={{ borderBottom: `1px solid ${C.grayL}` }}>
                  <td style={{ padding: "4px 6px" }}><span style={{ fontWeight: 700, color: C.dark }}>{code}</span><span style={{ color: C.gray, marginLeft: 4, fontSize: 10 }}>{ctryName(code, lang)}</span></td>
                  <td style={{ textAlign: "center", padding: "4px 6px", fontWeight: 700, color: C.dark }}>{total}</td>
                  <td style={{ textAlign: "center", padding: "4px 6px", color: C.blue, fontWeight: 700 }}>{work}</td>
                </tr>
              ))}</tbody>
            </table>
          </Card>
        </>}
      </div>}

      {view === "instr" && <div style={{ padding: 13, maxWidth: 800, margin: "0 auto" }}>
        <Card>
          <h2 style={{ fontWeight: 800, fontSize: 16, color: C.dark, marginTop: 0, marginBottom: 16 }}>📖 {t.instrTitle}</h2>
          {[
            { icon: "ℹ️", title: t.instrComplianceTitle, desc: t.instrComplianceDesc },
            { icon: "✏️", title: t.instrFill, desc: t.instrFillDesc },
            { icon: "📅", title: t.instrDeadline, desc: t.instrDeadlineDesc },
            { icon: "🏷️", title: t.instrActs, desc: t.instrActsDesc },
            { icon: "🌅", title: "Day Split", desc: lang === "de" ? "Ein Tag kann in Vormittag und Nachmittag aufgeteilt werden – z.B. wenn Sie morgens im Büro in Deutschland und nachmittags auf Dienstreise in Frankreich waren." : "A day can be split into morning and afternoon – e.g. if you worked in the office in Germany in the morning and were on a business trip to France in the afternoon." },
            { icon: "🔒", title: t.instrLock, desc: lang === "de" ? "Sobald alle Tage ausgefüllt sind, sperren Sie den Monat. ⚠️ Nach dem Sperren sind keine Änderungen mehr möglich. Nur ein Administrator kann entsperren." : "Once all days are filled in, lock the month. ⚠️ After locking, no further changes can be made. Only an administrator can unlock." },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, padding: "10px 12px", backgroundColor: C.grayL, borderRadius: 8 }}>
              <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{item.icon}</div>
              <div><div style={{ fontWeight: 700, fontSize: 13, color: C.dark, marginBottom: 3 }}>{item.title}</div><div style={{ fontSize: 12, color: C.gray, lineHeight: 1.6 }}>{item.desc}</div></div>
            </div>
          ))}
          <div style={{ marginTop: 4, padding: "10px 12px", backgroundColor: C.blueL, borderRadius: 8, border: `1px solid #BFDBFE`, fontSize: 12, color: C.blue }}>💬 {t.instrHelp}</div>
        </Card>
      </div>}

      {modal && <Overlay onClose={() => { setModal(false); setSel([]); }}>
        <MH title={`${t.entry} – ${sel.length} ${t.days}`} onClose={() => { setModal(false); setSel([]); }} />
        <div style={{ marginBottom: 12 }}><FLbl>{t.period}</FLbl><div style={{ display: "flex", gap: 6 }}>{[["full", t.allDay], ["split", t.splitDay]].map(([p, l]) => <button key={p} type="button" onClick={() => setMe(m => ({ ...m, period: p }))} style={{ flex: 1, padding: "6px 0", borderRadius: 7, fontSize: 11, fontWeight: 700, border: `2px solid ${me.period === p ? C.red : C.border}`, backgroundColor: me.period === p ? C.redL : C.white, color: me.period === p ? C.red : C.gray, cursor: "pointer" }}>{l}</button>)}</div></div>
        {me.period === "full" ? (<><div style={{ marginBottom: 11 }}><FLbl>{t.country}</FLbl><CountrySelect value={me.loc} onChange={v => setMe(m => ({ ...m, loc: v }))} t={t} disabled={isCountrylessActivity(me.act)} /></div><div style={{ marginBottom: 11 }}><FLbl>{t.activity}</FLbl><ActivitySelect value={me.act} onChange={v => setMe(m => ({ ...m, act: v, loc: isCountrylessActivity(v) ? "" : (m.loc || "DE") }))} acts={acts} lang={lang} /></div></>) : (
          [["am", t.am, "amL", "amA"], ["pm", t.pm, "pmL", "pmA"]].map(([k, lbl, lk, ak]) => (<div key={k} style={{ marginBottom: 12, padding: 10, backgroundColor: C.grayL, borderRadius: 8 }}><FLbl>{lbl}</FLbl><div style={{ marginBottom: 7 }}><CountrySelect value={me[lk]} onChange={v => setMe(m => ({ ...m, [lk]: v }))} t={t} disabled={isCountrylessActivity(me[ak])} /></div><ActivitySelect value={me[ak]} onChange={v => setMe(m => ({ ...m, [ak]: v, [lk]: isCountrylessActivity(v) ? "" : (m[lk] || "DE") }))} acts={acts} lang={lang} /></div>))
        )}
        <div style={{ marginBottom: 11 }}><FLbl>{t.notes}</FLbl><input value={me.notes} onChange={e => setMe(m => ({ ...m, notes: e.target.value }))} placeholder={t.notesH} style={INP} /></div>
        {sel.length > 1 && <label style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 11, cursor: "pointer", fontSize: 11, color: C.gray }}><input type="checkbox" checked={me.ov} onChange={e => setMe(m => ({ ...m, ov: e.target.checked }))} />{t.ovr}</label>}
        <div style={{ display: "flex", gap: 7 }}>
          <button onClick={saveEntry} style={{ ...PBTN, backgroundColor: C.green }}>{t.save}</button>
          {sel.some(k => entries[k]) && <button onClick={deleteEntry} style={{ padding: "11px 14px", borderRadius: 9, backgroundColor: C.redL, color: C.red, border: `1px solid #ffb3bb`, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>🗑 {t.delDay}</button>}
          <button onClick={() => { setModal(false); setSel([]); }} style={SBTN}>{t.cancel}</button>
        </div>
      </Overlay>}
      {csvOpen && <Overlay onClose={() => { setCsvOpen(false); setCsvErr(null); }}>
        <MH title="CSV Export" onClose={() => { setCsvOpen(false); setCsvErr(null); }} />
        {csvErr && <div style={{ backgroundColor: C.redL, border: `1px solid #ffb3bb`, borderRadius: 8, padding: "9px 11px", marginBottom: 11, fontSize: 12, color: C.red, fontWeight: 700 }}>{csvErr}</div>}
        <div style={{ marginBottom: 12 }}>
          <FLbl>{lang === "de" ? "Export-Modus" : "Export mode"}</FLbl>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              ["month", lang === "de" ? "Monat" : "Month"],
              ["range", lang === "de" ? "Zeitraum" : "Date range"],
            ].map(([mode, label]) => (
              <button key={mode} type="button" onClick={() => setCsvCfg(c => ({ ...c, mode }))} style={{ flex: 1, padding: "7px 0", borderRadius: 7, fontSize: 11, fontWeight: 700, border: `2px solid ${csvCfg.mode === mode ? C.red : C.border}`, backgroundColor: csvCfg.mode === mode ? C.redL : C.white, color: csvCfg.mode === mode ? C.red : C.gray, cursor: "pointer" }}>{label}</button>
            ))}
          </div>
        </div>
        {csvCfg.mode === "month" ? <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          <div><FLbl>{lang === "de" ? "Monat" : "Month"}</FLbl><select value={csvCfg.month} onChange={e => setCsvCfg(c => ({ ...c, month: Number(e.target.value) }))} style={INP}>{MO[lang].map((label, idx) => <option key={label} value={idx}>{label}</option>)}</select></div>
          <div><FLbl>{t.yr}</FLbl><select value={csvCfg.year} onChange={e => setCsvCfg(c => ({ ...c, year: Number(e.target.value) }))} style={INP}>{AVAIL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
        </div> : <>
          <div style={{ marginBottom: 11 }}><FLbl>{t.from}</FLbl><input type="date" value={csvCfg.start} onChange={e => setCsvCfg(c => ({ ...c, start: e.target.value }))} style={INP} /></div>
          <div style={{ marginBottom: 14 }}><FLbl>{t.to}</FLbl><input type="date" value={csvCfg.end} onChange={e => setCsvCfg(c => ({ ...c, end: e.target.value }))} style={INP} /></div>
        </>}
        <div style={{ display: "flex", gap: 7 }}>
          <button onClick={exportCSV} style={{ ...PBTN, backgroundColor: C.green }}>{lang === "de" ? "CSV erstellen" : "Generate CSV"}</button>
          <button onClick={() => { setCsvOpen(false); setCsvErr(null); }} style={SBTN}>{t.cancel}</button>
        </div>
      </Overlay>}
      {bulk && <Overlay onClose={() => { setBulk(false); setBulkErr(null); }}>
        <MH title={t.bulk} onClose={() => { setBulk(false); setBulkErr(null); }} />
        {bulkErr && <div style={{ backgroundColor: C.redL, border: `1px solid #ffb3bb`, borderRadius: 8, padding: "9px 11px", marginBottom: 11, fontSize: 12, color: C.red, fontWeight: 700 }}>{bulkErr}</div>}
        <div style={{ marginBottom: 11 }}><FLbl>{t.from}</FLbl><input type="date" value={bd.start} onChange={e => setBd(b => ({ ...b, start: e.target.value }))} style={INP} /></div>
        <div style={{ marginBottom: 11 }}><FLbl>{t.to}</FLbl><input type="date" value={bd.end} onChange={e => setBd(b => ({ ...b, end: e.target.value }))} style={INP} /></div>
        <div style={{ marginBottom: 11 }}><FLbl>{t.incl}</FLbl><select value={bd.inc} onChange={e => setBd(b => ({ ...b, inc: e.target.value }))} style={INP}><option value="all">{t.inclAll}</option><option value="weekdays">{t.inclWD}</option><option value="weekends">{t.inclWE}</option></select></div>
        <div style={{ marginBottom: 11 }}><FLbl>{t.country}</FLbl><CountrySelect value={bd.loc} onChange={v => setBd(b => ({ ...b, loc: v }))} t={t} disabled={isCountrylessActivity(bd.act)} /></div>
        <div style={{ marginBottom: 13 }}><FLbl>{t.activity}</FLbl><ActivitySelect value={bd.act} onChange={v => setBd(b => ({ ...b, act: v, loc: isCountrylessActivity(v) ? "" : (b.loc || "DE") }))} acts={acts} lang={lang} /></div>
        <div style={{ display: "flex", gap: 7 }}><button onClick={saveBulk} style={{ ...PBTN, backgroundColor: C.green }}>{t.apply}</button><button onClick={() => { setBulk(false); setBulkErr(null); }} style={SBTN}>{t.cancel}</button></div>
      </Overlay>}
    </div>
  );
}
