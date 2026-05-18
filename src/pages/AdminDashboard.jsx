import React, { useState, useEffect } from 'react';
import { C } from '../constants/colors';
import { DH_COMPANIES, AVAIL_YEARS } from '../constants/config';
import { MOS } from '../locales/translations';
import { getDOW, isWE, dk, dim } from '../utils/dateUtils';
import { dName, transferLabel, ctryName } from '../utils/formatUtils';
import { calcRangeSummary } from '../utils/statsUtils';
import { genInvite } from '../utils/authUtils';

import { db } from '../lib/firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';

import { NavBar, Card } from '../components/ui/Layout';
import { NBtn, SBTN, PBTN, ToggleSW } from '../components/ui/Buttons';
import { INP, FLbl } from '../components/ui/Inputs';
import { Notif } from '../components/ui/Feedback';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { AdminExportModal } from '../components/modals/AdminExportModal';
import { CreateEmpModal } from '../components/modals/CreateEmpModal';
import { InvitePreviewModal } from '../components/modals/InvitePreviewModal';
import { EditEmpModal } from '../components/modals/EditEmpModal';
import { EmpDetailModal } from '../components/modals/EmpDetailModal';
import { CalendarApp } from './CalendarApp';

export function AdminDashboard({ lang, setLang, t, user, logout, viewEmp, setViewEmp }) {
  const [emps, setEmps] = useState([]);
  const [allE, setAllE] = useState({});
  const [allL, setAllL] = useState({});
  const [notif, setNotif] = useState(null);
  const [view, setView] = useState("travel");
  const [rem, setRem] = useState({ enabled: true, day: 25, msg: "" });
  const [exportEmp, setExportEmp] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [invitePreview, setInvitePreview] = useState(null);
  const [editEmp, setEditEmp] = useState(null);
  const [detailEmp, setDetailEmp] = useState(null);
  const [confirmDlg, setConfirmDlg] = useState(null);
  const [expandedEmps, setExpandedEmps] = useState(new Set());
  const [expandedCompEmps, setExpandedCompEmps] = useState(new Set());
  const [compFrom, setCompFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [compTo, setCompTo] = useState(new Date().toISOString().split("T")[0]);
  const [unlockAllEmp, setUnlockAllEmp] = useState(null);
  const [unlockMonthConfirm, setUnlockMonthConfirm] = useState(null);
  const [adminYr, setAdminYr] = useState(new Date().getFullYear());
  const [travelCompanyFilter, setTravelCompanyFilter] = useState("");
  const [travelEmployeeFilter, setTravelEmployeeFilter] = useState("");
  const [teamCompanyFilter, setTeamCompanyFilter] = useState("");
  const [teamEmployeeFilter, setTeamEmployeeFilter] = useState("");

  const notify = msg => { setNotif(msg); setTimeout(() => setNotif(null), 2800); };

  const loadAll = async () => {
    try {
      const snap = await getDocs(collection(db, "users"));
      const us = [];
      snap.forEach(d => {
        const u = d.data();
        if (u.role !== "admin") us.push({ ...u, id: d.id });
      });
      setEmps(us);
      const ae = {}, al = {};
      for (const u of us) {
        try { const r2 = await window.storage.get(`e-${u.id}`, true); if (r2) ae[u.id] = JSON.parse(r2.value); } catch (e) { }
        try { const r3 = await window.storage.get(`l-${u.id}`, true); if (r3) al[u.id] = JSON.parse(r3.value); } catch (e) { }
      }
      setAllE(ae);
      setAllL(al);
    } catch (e) {
      console.error(e);
    }
    try { const r = await window.storage.get("rem-settings", true); if (r) setRem(JSON.parse(r.value)); } catch (e) { }
  };

  useEffect(() => { loadAll(); }, [viewEmp]);

  const toggleEmp = id => setExpandedEmps(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const deleteEmp = emp => setConfirmDlg({
    title: t.cfmDelTitle, message: `"${dName(emp)}" – ${t.cfmDelMsg}`, isDanger: true, okText: t.yesDel, onOk: async () => {
      try { await deleteDoc(doc(db, "users", emp.id)); } catch (e) { }
      try { await window.storage.delete(`e-${emp.id}`, true); } catch (e) { }
      try { await window.storage.delete(`l-${emp.id}`, true); } catch (e) { }
      setConfirmDlg(null); await loadAll(); notify(`${dName(emp)} ${lang === "de" ? "gelöscht" : "deleted"}`);
    }
  });

  const requestSetInactive = emp => setConfirmDlg({
    title: t.cfmInactTitle, message: `"${dName(emp)}" – ${t.cfmInactMsg}`, isDanger: false, okText: t.yes, onOk: async () => {
      try { await updateDoc(doc(db, "users", emp.id), { status: "inactive" }); } catch (e) { }
      setConfirmDlg(null); await loadAll();
    }
  });

  const setActive = async emp => {
    try { await updateDoc(doc(db, "users", emp.id), { status: "active" }); } catch (e) { }
    await loadAll();
  };

  const regenInvite = async emp => {
    const nc = genInvite(), ne = Date.now() + 7 * 24 * 60 * 60 * 1000;
    try { await updateDoc(doc(db, "users", emp.id), { inviteCode: nc, inviteExpires: ne }); } catch (e) { }
    setInvitePreview({ ...emp, inviteCode: nc, inviteExpires: ne }); await loadAll();
  };

  const doUnlockAll = async emp => {
    try { await window.storage.set(`l-${emp.id}`, JSON.stringify([]), true); } catch (e) { }
    setAllL(al => ({ ...al, [emp.id]: [] })); setUnlockAllEmp(null); notify(t.unlockAllOK);
  };

  const unlockMo = async (uid, mk) => {
    const nl = (allL[uid] || []).filter(m => m !== mk);
    try { await window.storage.set(`l-${uid}`, JSON.stringify(nl), true); } catch (e) { }
    setAllL(al => ({ ...al, [uid]: nl })); notify(`${mk} ${t.muOK}`);
  };

  const requestUnlockMo = (emp, mk) => setUnlockMonthConfirm({ emp, mk });

  const confirmUnlockMo = async () => {
    if (!unlockMonthConfirm) return;
    await unlockMo(unlockMonthConfirm.emp.id, unlockMonthConfirm.mk);
    setUnlockMonthConfirm(null);
  };

  const saveRem = async () => {
    try { await window.storage.set("rem-settings", JSON.stringify(rem), true); notify(t.remOK); } catch (e) { }
  };

  const getEmpMonthData = (uid, y, m) => {
    const e = allE[uid] || {}, d = dim(y, m); let fill = 0; const wbyCo = {};
    for (let i = 1; i <= d; i++) {
      const k = dk(y, m, i);
      if (e[k]) {
        fill++; const ent = e[k];
        if (ent.period === "split") {
          [[ent.amL || "DE", ent.amA], [ent.pmL || "DE", ent.pmA]].forEach(([l, a]) => {
            if (new Set(["work", "homeoffice", "travel", "training"]).has(a)) { wbyCo[l] = (wbyCo[l] || 0) + 0.5; }
          });
        } else if (new Set(["work", "homeoffice", "travel", "training"]).has(ent.act)) {
          wbyCo[ent.loc || "DE"] = (wbyCo[ent.loc || "DE"] || 0) + 1;
        }
      }
    }
    return { pct: Math.round((fill / d) * 100), fill, total: d, wbyCo };
  };

  const monthKey = (y, m) => `${y}-${String(m + 1).padStart(2, "0")}`;
  const monthLabel = (y, m) => `${MOS[lang][m]} ${y}`;
  const getMonthDeadline = (y, m) => new Date(y, m + 1, 3);
  const getAdminMonthStatus = (y, m, data, lockedMonths) => {
    const mk = monthKey(y, m);
    const isLocked = lockedMonths.includes(mk);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const monthStart = new Date(y, m, 1);
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const deadline = getMonthDeadline(y, m);
    const daysToDeadline = Math.ceil((deadline - todayStart) / (24 * 60 * 60 * 1000));
    const isFutureMonth = monthStart > currentMonthStart;
    const needsSubmission = !isFutureMonth;
    const isOverdue = needsSubmission && !isLocked && daysToDeadline < 0;
    const isDueSoon = needsSubmission && !isLocked && daysToDeadline >= 0 && daysToDeadline <= 7;
    return { ...data, mk, y, m, isLocked, needsSubmission, isOverdue, isDueSoon, daysToDeadline };
  };

  const monthStatusLabel = month => {
    if (month.isLocked) return t.submitted;
    if (month.isOverdue) return t.overdue;
    if (month.isDueSoon) return t.dueSoon;
    if (!month.needsSubmission) return t.upcoming;
    return t.notSubmitted;
  };

  const groupByDH = empList => {
    const g = {}; DH_COMPANIES.forEach(c => g[c] = []); g["__other"] = [];
    empList.forEach(e => { const k = DH_COMPANIES.includes(e.company) ? e.company : "__other"; g[k].push(e); });
    return g;
  };

  const getCompanyKey = emp => DH_COMPANIES.includes(emp.company) ? emp.company : "__other";
  const employeeMatches = (emp, query) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [emp.firstName, emp.lastName, dName(emp), emp.email].some(v => String(v || "").toLowerCase().includes(q));
  };
  const filterEmployees = (list, companyFilter, employeeFilter) => list.filter(emp =>
    (!companyFilter || getCompanyKey(emp) === companyFilter) && employeeMatches(emp, employeeFilter)
  );
  const companyOptions = DH_COMPANIES.concat(["__other"]);
  const companyLabel = co => co === "__other" ? t.otherCompany : co;
  const FilterBar = ({ companyValue, onCompanyChange, employeeValue, onEmployeeChange }) => (
    <Card style={{ marginBottom: 12, padding: 10 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <select value={companyValue} onChange={e => onCompanyChange(e.target.value)} style={{ ...INP, width: "auto", minWidth: 190, padding: "6px 10px", fontSize: 12 }}>
          <option value="">{t.allCompanies}</option>
          {companyOptions.map(co => <option key={co} value={co}>{companyLabel(co)}</option>)}
        </select>
        <input value={employeeValue} onChange={e => onEmployeeChange(e.target.value)} placeholder={t.searchEmployee} style={{ ...INP, width: 240, padding: "6px 10px", fontSize: 12 }} />
      </div>
    </Card>
  );

  if (viewEmp) return <CalendarApp lang={lang} setLang={setLang} t={t} user={user} logout={logout} uid={viewEmp.id} readOnly={true} empName={dName(viewEmp)} onBack={() => setViewEmp(null)} adminUnlock={async mk => unlockMo(viewEmp.id, mk)} initialYr={viewEmp.initialYr} initialMo={viewEmp.initialMo} />;

  const activeEmps = emps.filter(e => e.status === "active");
  const filteredTravelEmps = filterEmployees(activeEmps, travelCompanyFilter, travelEmployeeFilter);
  const filteredTeamEmps = filterEmployees(emps, teamCompanyFilter, teamEmployeeFilter);
  const activeGroups = groupByDH(activeEmps);
  const filteredTravelGroups = groupByDH(filteredTravelEmps);
  const filteredTeamGroups = groupByDH(filteredTeamEmps);

  return (
    <div style={{ fontFamily: "Inter,sans-serif", backgroundColor: C.grayL, minHeight: "100vh" }}>
      {notif && <Notif msg={notif} />}
      {confirmDlg && <ConfirmModal title={confirmDlg.title} message={confirmDlg.message} onConfirm={confirmDlg.onOk} onCancel={() => setConfirmDlg(null)} confirmText={confirmDlg.okText} cancelText={t.cancel} isDanger={confirmDlg.isDanger} />}
      {unlockAllEmp && <ConfirmModal title={t.unlockAll} message={`${dName(unlockAllEmp)} – ${t.unlockAllMsg}`} onConfirm={() => doUnlockAll(unlockAllEmp)} onCancel={() => setUnlockAllEmp(null)} confirmText={t.yes} cancelText={t.cancel} isDanger={false} />}
      {unlockMonthConfirm && <ConfirmModal title={t.unlock} message={`${dName(unlockMonthConfirm.emp)} – ${unlockMonthConfirm.mk}. ${lang === "de" ? "Diesen Monat entsperren?" : "Unlock this month?"}`} onConfirm={confirmUnlockMo} onCancel={() => setUnlockMonthConfirm(null)} confirmText={t.yes} cancelText={t.cancel} isDanger={false} />}
      {exportEmp && <AdminExportModal emp={exportEmp} entries={allE[exportEmp.id] || {}} lang={lang} t={t} onClose={() => setExportEmp(null)} />}
      {showCreate && <CreateEmpModal lang={lang} t={t} onClose={() => setShowCreate(false)} onCreated={nu => { setShowCreate(false); setInvitePreview(nu); loadAll(); }} />}
      {invitePreview && <InvitePreviewModal emp={invitePreview} lang={lang} t={t} onClose={() => setInvitePreview(null)} onRegen={() => regenInvite(invitePreview)} />}
      {editEmp && <EditEmpModal emp={editEmp} lang={lang} t={t} onSaved={() => { loadAll(); setDetailEmp(null); }} onClose={() => setEditEmp(null)} />}
      {detailEmp && <EmpDetailModal emp={detailEmp} lang={lang} t={t} onEdit={() => { setEditEmp(detailEmp); setDetailEmp(null); }} onViewCal={() => { setViewEmp(detailEmp); setDetailEmp(null); }} onClose={() => setDetailEmp(null)} />}

      <NavBar lang={lang} setLang={setLang} t={t} sub={`${dName(user)} · Admin`} logout={logout}>
        {[["travel", t.travelData], ["team", `👥 ${t.team}`], ["comp", t.comp], ["sets", t.sets]].map(([v, l]) => <NBtn key={v} active={view === v} onClick={() => setView(v)}>{l}</NBtn>)}
      </NavBar>

      <div style={{ padding: 14, maxWidth: 1400, margin: "0 auto" }}>
        {view === "travel" && <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <h2 style={{ fontWeight: 800, fontSize: 16, color: C.dark, margin: 0 }}>{t.travelData} ({filteredTravelEmps.length})</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={adminYr} onChange={e => setAdminYr(Number(e.target.value))} style={{ ...INP, width: "auto", padding: "5px 10px", fontSize: 12 }}>
                {AVAIL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <button onClick={loadAll} style={SBTN}>{t.ref} ⟳</button>
            </div>
          </div>
          <FilterBar companyValue={travelCompanyFilter} onCompanyChange={setTravelCompanyFilter} employeeValue={travelEmployeeFilter} onEmployeeChange={setTravelEmployeeFilter} />
          {activeEmps.length === 0 ? <Card><div style={{ textAlign: "center", color: C.gray, padding: 28, fontSize: 13 }}>{t.noE}</div></Card> :
            filteredTravelEmps.length === 0 ? <Card><div style={{ textAlign: "center", color: C.gray, padding: 28, fontSize: 13 }}>{t.noFilterResults}</div></Card> :
            companyOptions.map(co => {
              const list = filteredTravelGroups[co] || []; if (!list.length) return null;
              const label = companyLabel(co);
              return (<div key={co} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", borderBottom: `2px solid ${C.border}`, marginBottom: 6 }}>
                  <span>🏢</span><span style={{ fontWeight: 800, fontSize: 13, color: C.dark }}>{label}</span>
                  <span style={{ fontSize: 11, color: C.gray, backgroundColor: C.grayL, padding: "1px 7px", borderRadius: 10 }}>{list.length}</span>
                </div>
                {list.map(emp => {
                  const lk = allL[emp.id] || [];
                  const expanded = expandedEmps.has(emp.id);
                  const months = Array.from({ length: 12 }, (_, m) => getAdminMonthStatus(adminYr, m, getEmpMonthData(emp.id, adminYr, m), lk));
                  const yrWbyCo = {}; months.forEach(({ wbyCo }) => Object.entries(wbyCo).forEach(([c, d]) => { yrWbyCo[c] = (yrWbyCo[c] || 0) + d; }));
                  const visibleMonths = months.filter(mo => mo.needsSubmission);
                  const submittedMonths = months.filter(mo => mo.isLocked);
                  const notSubmittedMonths = visibleMonths.filter(mo => !mo.isLocked);
                  const overdueMonths = months.filter(mo => mo.isOverdue);
                  const dueSoonMonths = months.filter(mo => mo.isDueSoon);
                  const submittedPct = visibleMonths.length ? Math.round((submittedMonths.length / visibleMonths.length) * 100) : 0;
                  const filledDays = visibleMonths.reduce((sum, mo) => sum + mo.fill, 0);
                  const totalDays = visibleMonths.reduce((sum, mo) => sum + mo.total, 0);
                  const fillPct = totalDays ? Math.round((filledDays / totalDays) * 100) : 0;
                  return (<Card key={emp.id} style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                        <button onClick={() => toggleEmp(emp.id)} style={{ fontWeight: 800, fontSize: 13, color: C.red, border: "none", backgroundColor: "transparent", cursor: "pointer", padding: 0, textAlign: "left" }}>
                          {expanded ? "▼" : "▶"} {dName(emp)}
                        </button>
                        <span style={{ fontSize: 10, backgroundColor: C.greenL, color: C.green, padding: "1px 7px", borderRadius: 4, fontWeight: 700 }}>🔒 {submittedMonths.length}/{visibleMonths.length || 12} {t.submittedMonths}</span>
                        {overdueMonths.length > 0 && <span style={{ fontSize: 10, backgroundColor: C.redL, color: C.red, padding: "1px 7px", borderRadius: 4, fontWeight: 800 }}>⚠ {overdueMonths.length} {t.overdue}</span>}
                        {dueSoonMonths.length > 0 && <span style={{ fontSize: 10, backgroundColor: C.redL, color: C.red, padding: "1px 7px", borderRadius: 4, fontWeight: 800 }}>⚠ {dueSoonMonths.length} {t.dueWithin7}</span>}
                      </div>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button onClick={() => setExportEmp(emp)} style={{ padding: "3px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700, backgroundColor: C.green, color: C.white, border: "none", cursor: "pointer" }}>📥</button>
                        <button onClick={() => setViewEmp(emp)} style={{ padding: "3px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700, backgroundColor: C.red, color: C.white, border: "none", cursor: "pointer" }}>📅</button>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8 }}>
                      {[[t.submittedProgress, submittedPct, `${submittedMonths.length}/${visibleMonths.length || 12} ${t.monthsShort}`, C.green], [t.fillProgress, fillPct, `${filledDays}/${totalDays || 0} ${lang === "de" ? "Tage" : "days"}`, fillPct === 100 ? C.green : fillPct > 60 ? C.amber : C.red]].map(([label, value, detail, color]) => (
                        <div key={label}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.gray, marginBottom: 3 }}><span style={{ fontWeight: 700 }}>{label}</span><span>{detail} · {value}%</span></div>
                          <div style={{ height: 5, backgroundColor: C.border, borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${value}%`, height: "100%", backgroundColor: color, borderRadius: 3 }} /></div>
                        </div>
                      ))}
                    </div>
                    {expanded && <>
                      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 8 }}>
                        <div style={{ backgroundColor: C.greenL, border: `1px solid #86efac`, borderRadius: 7, padding: "7px 9px" }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: C.green, marginBottom: 3 }}>{t.submittedMonths}</div>
                          <div style={{ fontSize: 10, color: C.dark, lineHeight: 1.5 }}>{submittedMonths.length ? submittedMonths.map(mo => monthLabel(mo.y, mo.m)).join(", ") : t.none}</div>
                        </div>
                        <div style={{ backgroundColor: notSubmittedMonths.some(mo => mo.isOverdue || mo.isDueSoon) ? C.redL : C.grayL, border: `1px solid ${notSubmittedMonths.some(mo => mo.isOverdue || mo.isDueSoon) ? "#ffb3bb" : C.border}`, borderRadius: 7, padding: "7px 9px" }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: notSubmittedMonths.some(mo => mo.isOverdue || mo.isDueSoon) ? C.red : C.gray, marginBottom: 3 }}>{t.notSubmittedMonths}</div>
                          <div style={{ fontSize: 10, color: C.dark, lineHeight: 1.5 }}>{notSubmittedMonths.length ? notSubmittedMonths.map(mo => `${monthLabel(mo.y, mo.m)} (${monthStatusLabel(mo)})`).join(", ") : t.none}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 12, fontSize: 10, fontWeight: 700, color: C.gray, marginBottom: 4, textTransform: "uppercase" }}>{t.compL} {adminYr}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr) 1.6fr", gap: 3 }}>
                        {months.map(({ m, pct, wbyCo }) => {
                          const month = months[m], { mk, isLocked: isLk, isOverdue, isDueSoon } = month;
                          const topCo = Object.entries(wbyCo).sort((a, b) => b[1] - a[1]).slice(0, 2);
                          const statusColor = isLk ? C.green : (isOverdue || isDueSoon) ? C.red : pct === 100 ? C.amber : pct > 60 ? C.amber : C.red;
                          const statusBg = isLk ? C.greenL : (isOverdue || isDueSoon) ? C.redL : pct === 100 ? C.amberL : pct > 60 ? C.amberL : C.redL;
                          return (<div key={m} style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 8, color: C.gray, marginBottom: 2 }}>{MOS[lang][m]}</div>
                            <div style={{ backgroundColor: statusBg, border: `1px solid ${isOverdue || isDueSoon ? "#ffb3bb" : "transparent"}`, borderRadius: 4, padding: "3px 2px", position: "relative", cursor: "pointer", minHeight: 52, boxSizing: "border-box" }} onClick={() => setViewEmp({ ...emp, initialYr: adminYr, initialMo: m })}>
                              <div style={{ fontSize: 8, fontWeight: 700, color: statusColor }}>{pct}%</div>
                              {topCo.map(([code, days]) => <div key={code} style={{ fontSize: 7, color: C.dark, lineHeight: 1.2 }}>{code}:{days}</div>)}
                              <div style={{ fontSize: 6, color: statusColor, lineHeight: 1.2, fontWeight: 800, marginTop: 1 }}>{monthStatusLabel(month)}</div>
                              {isLk && <div style={{ fontSize: 7, position: "absolute", top: -3, right: -1 }}>🔒</div>}
                            </div>
                            {isLk && <button onClick={() => requestUnlockMo(emp, mk)} style={{ fontSize: 7, marginTop: 1, padding: "1px 2px", borderRadius: 3, border: `1px solid ${C.border}`, backgroundColor: C.redL, color: C.red, cursor: "pointer", width: "100%" }}>🔓</button>}
                          </div>);
                        })}
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 8, color: C.blue, fontWeight: 700, marginBottom: 2 }}>Σ {adminYr}</div>
                          <div style={{ backgroundColor: C.blueL, borderRadius: 4, padding: "3px 3px", minHeight: 42, border: `1px solid #BFDBFE` }}>
                            {Object.entries(yrWbyCo).sort((a, b) => b[1] - a[1]).map(([code, days]) => <div key={code} style={{ fontSize: 7, fontWeight: 700, color: C.blue, lineHeight: 1.3 }}>{code}:{days}</div>)}
                            {Object.keys(yrWbyCo).length === 0 && <div style={{ fontSize: 7, color: C.gray }}>–</div>}
                          </div>
                          {submittedMonths.length > 0 && <button onClick={() => setUnlockAllEmp(emp)} style={{ fontSize: 7, marginTop: 1, padding: "1px 3px", borderRadius: 3, border: `1px solid ${C.border}`, backgroundColor: C.amberL, color: "#92400E", cursor: "pointer", width: "100%", fontWeight: 700 }}>🔓 all</button>}
                        </div>
                      </div>
                    </>}
                  </Card>);
                })}
              </div>);
            })}
        </>}

        {view === "comp" && <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
            <h2 style={{ fontWeight: 800, fontSize: 16, color: C.dark, margin: 0 }}>{t.comp}</h2>
            <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: C.gray, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{lang === "de" ? "Von" : "From"}</div><input type="date" value={compFrom} onChange={e => setCompFrom(e.target.value)} style={{ ...INP, width: "auto", padding: "5px 8px", fontSize: 12 }} /></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: C.gray, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{lang === "de" ? "Bis" : "To"}</div><input type="date" value={compTo} onChange={e => setCompTo(e.target.value)} style={{ ...INP, width: "auto", padding: "5px 8px", fontSize: 12 }} /></div>
              <div style={{ paddingTop: 18, fontSize: 11, color: C.gray }}>{lang === "de" ? "Zeitraum-Ansicht" : "Period view"}</div>
            </div>
          </div>
          {activeEmps.length === 0 ? <Card><div style={{ textAlign: "center", color: C.gray, padding: 28, fontSize: 13 }}>{t.noE}</div></Card> :
            DH_COMPANIES.concat(["__other"]).map(co => {
              const list = (activeGroups[co] || []).filter(emp => Object.keys(calcRangeSummary(allE[emp.id] || {}, compFrom, compTo)).length > 0);
              if (!list.length) return null;
              const label = co === "__other" ? (lang === "de" ? "Sonstiges" : "Other") : co;
              return (<div key={co} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", borderBottom: `2px solid ${C.border}`, marginBottom: 8 }}>
                  <span>🏢</span><span style={{ fontWeight: 800, fontSize: 13, color: C.dark }}>{label}</span>
                  <span style={{ fontSize: 11, color: C.gray, backgroundColor: C.grayL, padding: "1px 7px", borderRadius: 10 }}>{list.length}</span>
                </div>
                {list.map(emp => {
                  const expanded = expandedCompEmps.has(emp.id);
                  const toggleComp = () => setExpandedCompEmps(prev => { const n = new Set(prev); n.has(emp.id) ? n.delete(emp.id) : n.add(emp.id); return n; });
                  const rSum = calcRangeSummary(allE[emp.id] || {}, compFrom, compTo);
                  const countries = Object.entries(rSum).sort((a, b) => b[1].total - a[1].total);
                  const hasWarn = countries.some(([, { total }]) => total >= 90);
                  return (<Card key={emp.id} style={{ marginBottom: 6 }}>
                    <div onClick={toggleComp} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, flexWrap: "wrap" }}>
                        <span style={{ color: C.gray, fontSize: 11 }}>{expanded ? "▼" : "▶"}</span>
                        <span style={{ fontWeight: 800, fontSize: 13, color: C.dark }}>{dName(emp)}</span>
                        {hasWarn && <span style={{ fontSize: 13 }}>⚠️</span>}
                        {emp.transferType && <span style={{ fontSize: 10, backgroundColor: C.blueL, color: C.blue, padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>{transferLabel(emp.transferType, lang)}</span>}
                        {emp.homeCountry && <span style={{ fontSize: 10, backgroundColor: C.grayL, color: C.slate, padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>🏠 {emp.homeCountry}</span>}
                        {emp.hostCountry && <span style={{ fontSize: 10, backgroundColor: C.grayL, color: C.slate, padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>✈️ {emp.hostCountry}</span>}
                        {!expanded && <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {countries.slice(0, 4).map(([code, { total }]) => (
                            <span key={code} style={{ fontSize: 10, backgroundColor: total >= 183 ? C.redL : total >= 90 ? C.amberL : C.grayL, color: total >= 183 ? C.red : total >= 90 ? C.amber : C.gray, padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>{code}: {total}d</span>
                          ))}
                        </div>}
                      </div>
                      <button onClick={e => { e.stopPropagation(); setViewEmp(emp); }} style={{ padding: "3px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700, backgroundColor: C.red, color: C.white, border: "none", cursor: "pointer", flexShrink: 0 }}>📅</button>
                    </div>
                    {expanded && <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {countries.map(([code, { total, work }]) => {
                          const w183 = total >= 183, w90 = total >= 90 && !w183, pbar = Math.min(100, (total / 260) * 100);
                          return (<div key={code}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontWeight: 800, fontSize: 12, color: C.dark }}>{code}</span>
                                <span style={{ fontSize: 10, color: C.gray }}>{ctryName(code, lang)}</span>
                                {w183 && <span style={{ fontSize: 9, backgroundColor: C.redL, color: C.red, padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>⚠ ≥183d</span>}
                                {w90 && <span style={{ fontSize: 9, backgroundColor: C.amberL, color: C.amber, padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>⚠ ≥90d</span>}
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: C.dark }}>{total}d &nbsp;<span style={{ color: C.blue }}>{lang === "de" ? "Arbeit" : "Work"}: {work}d</span></span>
                            </div>
                            <div style={{ height: 6, backgroundColor: C.border, borderRadius: 3 }}><div style={{ width: `${pbar}%`, height: "100%", backgroundColor: w183 ? C.red : w90 ? C.amber : C.blue, borderRadius: 3, transition: "width 0.4s" }} /></div>
                          </div>);
                        })}
                      </div>
                      <div style={{ marginTop: 10, backgroundColor: C.amberL, borderRadius: 6, padding: "6px 10px", fontSize: 10, color: "#92400E" }}>🟡 90d: {t.t90} | 🔴 183d: {t.t183}</div>
                    </div>}
                  </Card>);
                })}
              </div>);
            })}
        </>}

        {view === "team" && <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontWeight: 800, fontSize: 16, color: C.dark, margin: 0 }}>👥 {t.team} ({filteredTeamEmps.length})</h2>
            <button onClick={() => setShowCreate(true)} style={{ ...PBTN, width: "auto", padding: "8px 16px", fontSize: 12 }}>+ {t.addEmp}</button>
          </div>
          <FilterBar companyValue={teamCompanyFilter} onCompanyChange={setTeamCompanyFilter} employeeValue={teamEmployeeFilter} onEmployeeChange={setTeamEmployeeFilter} />
          {emps.length === 0 ? <Card><div style={{ textAlign: "center", color: C.gray, padding: 28, fontSize: 13 }}>{t.noTeam}</div></Card> :
            filteredTeamEmps.length === 0 ? <Card><div style={{ textAlign: "center", color: C.gray, padding: 28, fontSize: 13 }}>{t.noFilterResults}</div></Card> :
            companyOptions.map(co => {
              const list = filteredTeamGroups[co] || []; if (!list.length) return null;
              const label = companyLabel(co);
              return (<div key={co} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", borderBottom: `2px solid ${C.border}`, marginBottom: 8 }}><span>🏢</span><span style={{ fontWeight: 800, fontSize: 13, color: C.dark }}>{label}</span><span style={{ fontSize: 11, color: C.gray, backgroundColor: C.grayL, padding: "1px 7px", borderRadius: 10 }}>{list.length}</span></div>
                {list.map(emp => (<Card key={emp.id} style={{ marginBottom: 7, cursor: "pointer" }} onClick={() => setDetailEmp(emp)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 800, fontSize: 13, color: emp.status === "inactive" ? C.gray : C.dark }}>{dName(emp)}</span>
                        <StatusBadge status={emp.status} t={t} />
                        {emp.transferType && <span style={{ fontSize: 10, backgroundColor: C.blueL, color: C.blue, padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>{transferLabel(emp.transferType, lang)}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: C.gray }}>{emp.email}</div>
                      {(emp.homeCountry || emp.hostCountry) && <div style={{ fontSize: 10, color: C.slate, marginTop: 2 }}>{emp.homeCountry && <span style={{ marginRight: 8 }}>🏠 {emp.homeCountry}</span>}{emp.hostCountry && <span>✈️ {emp.hostCountry}</span>}</div>}
                      {emp.comment && <div style={{ fontSize: 10, color: C.slate, marginTop: 4, maxWidth: 520, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><span style={{ fontWeight: 700 }}>{t.comment}:</span> {emp.comment}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }} onClick={e => e.stopPropagation()}>
                      {emp.status === "active" && <div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ fontSize: 10, color: C.gray }}>{lang === "de" ? "Aktiv" : "Active"}</span><ToggleSW on={true} onToggle={() => requestSetInactive(emp)} size={18} /></div>}
                      {emp.status === "inactive" && <div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ fontSize: 10, color: C.gray }}>{lang === "de" ? "Inaktiv" : "Inactive"}</span><ToggleSW on={false} onToggle={() => setActive(emp)} size={18} /></div>}
                      {emp.status === "invited" && <button onClick={() => setInvitePreview(emp)} style={{ padding: "5px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700, backgroundColor: C.blue, color: C.white, border: "none", cursor: "pointer" }}>✉ {t.viewInvite}</button>}
                      {emp.status === "active" && <button onClick={() => setViewEmp(emp)} style={{ padding: "5px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700, backgroundColor: C.red, color: C.white, border: "none", cursor: "pointer" }}>📅</button>}
                      <button onClick={() => deleteEmp(emp)} style={{ padding: "5px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700, backgroundColor: C.redL, color: C.red, border: `1px solid #ffb3bb`, cursor: "pointer" }}>🗑</button>
                    </div>
                  </div>
                </Card>))}
              </div>);
            })}
        </>}

        {view === "sets" && <Card>
          <h3 style={{ fontWeight: 800, fontSize: 15, color: C.dark, marginTop: 0, marginBottom: 16 }}>{t.remT}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}><ToggleSW on={rem.enabled} onToggle={() => setRem(r => ({ ...r, enabled: !r.enabled }))} size={22} /><span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{t.remOn}</span></div>
          <div style={{ marginBottom: 11 }}><FLbl>{t.remDay}</FLbl><div style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="number" min={1} max={28} value={rem.day} onChange={e => setRem(r => ({ ...r, day: parseInt(e.target.value) || 1 }))} style={{ ...INP, width: 80 }} /><span style={{ fontSize: 12, color: C.gray }}>{lang === "de" ? `Jeden ${rem.day}. des Monats` : `Every ${rem.day}th`}</span></div></div>
          <div style={{ marginBottom: 12 }}><FLbl>{t.remMsg}</FLbl><input value={rem.msg} onChange={e => setRem(r => ({ ...r, msg: e.target.value }))} placeholder={t.remMsgH} style={INP} /></div>
          <button onClick={saveRem} style={PBTN}>{t.save}</button>
        </Card>}
      </div>
    </div>
  );
}
