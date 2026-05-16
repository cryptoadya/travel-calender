import React, { useState } from 'react';
import { C } from '../constants/colors';
import { APP_VER, ADM_CODE } from '../constants/config';
import { hashPw, valPw, genCode } from '../utils/authUtils';
import { DHLogoLogin } from '../components/ui/Layout';
import { INP, FGRP, FLbl } from '../components/ui/Inputs';
import { PBTN, SBTN, PWTOG, LINKGRAY, LINKRED } from '../components/ui/Buttons';
import { ErrBox } from '../components/ui/Feedback';
import { dName } from '../utils/formatUtils';

export function AuthPage({ lang, setLang, t, setUser, notify, clearAll }) {
  const [authMode, setAuthMode] = useState("login");
  const [frm, setFrm] = useState({ name: "", email: "", pw: "", pw2: "", role: "employee", adminCode: "", resetCode: "", newPw: "", newPw2: "", inviteCode: "" });
  const [err, setErr] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [resetState, setResetState] = useState({ email: "", code: "", userId: "" });
  const [legacyUser, setLegacyUser] = useState(null);
  const [activatingEmp, setActivatingEmp] = useState(null);

  const f = (k, v) => setFrm(x => ({ ...x, [k]: v }));

  const doLogin = async () => {
    setErr("");
    const email = frm.email.trim().toLowerCase();
    let users = [];
    try { const r = await window.storage.get("all-users", true); if (r) users = JSON.parse(r.value); } catch (e) { }

    if (authMode === "register") {
      if (!frm.name.trim()) { setErr(t.name + " " + (lang === "de" ? "erforderlich" : "required")); return; }
      if (users.find(u => u.email === email)) { setErr(t.eExists); return; }
      const pe = valPw(frm.pw, lang);
      if (pe.length) { setErr(`${t.pwWeak}: ${pe.join(", ")}`); return; }
      if (frm.pw !== frm.pw2) { setErr(t.pwMismatch); return; }
      if (frm.role === "admin" && frm.adminCode !== ADM_CODE) { setErr(t.wrongCode); return; }
      try {
        const hash = await hashPw(frm.pw);
        const nu = { id: Date.now().toString(), name: frm.name.trim(), email, role: frm.role, status: "active", reg: new Date().toISOString() };
        users.push(nu);
        await window.storage.set("all-users", JSON.stringify(users), true);
        await window.storage.set(`pw-${nu.id}`, hash, true);
        await window.storage.set("session", JSON.stringify(nu));
        setUser(nu);
      } catch (e) {
        setErr(lang === "de" ? "Registrierung fehlgeschlagen" : "Registration failed");
      }
    } else {
      const found = users.find(u => u.email === email);
      if (!found) { setErr(t.eNotFound); return; }
      if (found.status === "inactive") { setErr(t.inactiveAcc); return; }
      let sh = null;
      try { const r = await window.storage.get(`pw-${found.id}`, true); if (r) sh = r.value; } catch (e) { }
      if (!sh) { setLegacyUser(found); setAuthMode("legacy"); return; }
      if (await hashPw(frm.pw) !== sh) { setErr(t.wrongPw); return; }
      try {
        await window.storage.set("session", JSON.stringify(found));
        setUser(found);
      } catch (e) {
        setErr(lang === "de" ? "Anmeldefehler" : "Login error");
      }
    }
  };

  const doForgot = async () => {
    setErr("");
    const email = frm.email.trim().toLowerCase();
    let users = [];
    try { const r = await window.storage.get("all-users", true); if (r) users = JSON.parse(r.value); } catch (e) { }
    const found = users.find(u => u.email === email);
    if (!found) { setErr(t.eNotFound); return; }
    const code = genCode();
    try { await window.storage.set(`reset-${found.id}`, JSON.stringify({ code, expires: Date.now() + 15 * 60 * 1000 }), true); } catch (e) { }
    setResetState({ email, code, userId: found.id });
    setAuthMode("code");
  };

  const doVerify = async () => {
    setErr("");
    try {
      const r = await window.storage.get(`reset-${resetState.userId}`, true);
      if (!r) { setErr(t.codeInvalid); return; }
      const d = JSON.parse(r.value);
      if (frm.resetCode !== d.code || Date.now() > d.expires) { setErr(t.codeInvalid); return; }
      setAuthMode("resetpw");
    } catch (e) {
      setErr(t.codeInvalid);
    }
  };

  const doResetPw = async () => {
    setErr("");
    const pe = valPw(frm.newPw, lang);
    if (pe.length) { setErr(`${t.pwWeak}: ${pe.join(", ")}`); return; }
    if (frm.newPw !== frm.newPw2) { setErr(t.pwMismatch); return; }
    try {
      await window.storage.set(`pw-${resetState.userId}`, await hashPw(frm.newPw), true);
      try { await window.storage.delete(`reset-${resetState.userId}`, true); } catch (e) { }
      setAuthMode("login");
      setTimeout(() => setErr(t.resetOK), 50);
    } catch (e) {
      setErr(lang === "de" ? "Fehler" : "Error");
    }
  };

  const doCheckInvite = async () => {
    setErr("");
    const code = frm.inviteCode.trim().toUpperCase();
    let users = [];
    try { const r = await window.storage.get("all-users", true); if (r) users = JSON.parse(r.value); } catch (e) { }
    const found = users.find(u => u.inviteCode === code && u.status === "invited");
    if (!found) { setErr(t.inviteInvalid); return; }
    if (Date.now() > found.inviteExpires) { setErr(t.inviteExpired); return; }
    setActivatingEmp(found);
    setAuthMode("setInvitePw");
  };

  const doActivate = async () => {
    setErr("");
    const pe = valPw(frm.pw, lang);
    if (pe.length) { setErr(`${t.pwWeak}: ${pe.join(", ")}`); return; }
    if (frm.pw !== frm.pw2) { setErr(t.pwMismatch); return; }
    try {
      await window.storage.set(`pw-${activatingEmp.id}`, await hashPw(frm.pw), true);
      let users = [];
      try { const r = await window.storage.get("all-users", true); if (r) users = JSON.parse(r.value); } catch (e) { }
      const upd = users.map(u => u.id === activatingEmp.id ? { ...u, status: "active", inviteCode: undefined, inviteExpires: undefined } : u);
      await window.storage.set("all-users", JSON.stringify(upd), true);
      const au = { ...activatingEmp, status: "active" };
      await window.storage.set("session", JSON.stringify(au));
      setUser(au);
    } catch (e) {
      setErr(lang === "de" ? "Aktivierung fehlgeschlagen" : "Activation failed");
    }
  };

  const pwE = ["register", "legacy", "setInvitePw"].includes(authMode) ? valPw(frm.pw, lang) : [];
  const pwS = frm.pw.length === 0 ? 0 : Math.round(((5 - pwE.length) / 5) * 100);

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg,#fce4e4 0%,#fff 60%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Inter,sans-serif", padding: 16 }}>
      <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 5 }}>
        {["de", "en"].map(l => (
          <button key={l} onClick={() => setLang(l)} style={{ padding: "3px 9px", borderRadius: 5, fontSize: 11, fontWeight: 700, border: `1px solid ${C.border}`, backgroundColor: lang === l ? C.red : C.white, color: lang === l ? C.white : C.gray, cursor: "pointer" }}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <DHLogoLogin lang={lang} />
      <div style={{ backgroundColor: C.white, borderRadius: 16, padding: 32, width: "100%", maxWidth: 520, boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
        {authMode === "login" && (
          <>
            <h2 style={{ fontWeight: 800, fontSize: 18, color: C.dark, margin: "0 0 18px", textAlign: "center" }}>{t.signIn}</h2>
            <div style={FGRP}><FLbl>{t.email}</FLbl><input type="email" value={frm.email} onChange={e => f("email", e.target.value)} style={INP} autoComplete="email" /></div>
            <div style={FGRP}>
              <FLbl>{t.pw}</FLbl>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} value={frm.pw} onChange={e => f("pw", e.target.value)} style={{ ...INP, paddingRight: 72 }} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw(s => !s)} style={PWTOG}>{showPw ? t.hidepw : t.showpw}</button>
              </div>
            </div>
            {err && <ErrBox msg={err} />}
            <button onClick={doLogin} style={PBTN}>{t.signIn}</button>
            <div style={{ textAlign: "center", marginTop: 9 }}><button onClick={() => { setAuthMode("forgot"); setErr(""); }} style={LINKGRAY}>{t.forgotLink}</button></div>
            <div style={{ textAlign: "center", marginTop: 5 }}><button onClick={() => { setAuthMode("invite"); setErr(""); }} style={{ ...LINKGRAY, color: C.red, fontWeight: 700 }}>🎟 {t.haveInvite}</button></div>
            <div style={{ height: 1, backgroundColor: C.border, margin: "12px 0" }} />
            <div style={{ textAlign: "center", fontSize: 11, color: C.gray }}>{t.noAcc} <button onClick={() => { setAuthMode("register"); setErr(""); }} style={LINKRED}>{t.reg}</button></div>
          </>
        )}
        {authMode === "register" && (
          <>
            <h2 style={{ fontWeight: 800, fontSize: 18, color: C.dark, margin: "0 0 18px", textAlign: "center" }}>{t.reg}</h2>
            <div style={FGRP}><FLbl>{t.name}</FLbl><input value={frm.name} onChange={e => f("name", e.target.value)} style={INP} /></div>
            <div style={FGRP}><FLbl>{t.email}</FLbl><input type="email" value={frm.email} onChange={e => f("email", e.target.value)} style={INP} /></div>
            <div style={FGRP}>
              <FLbl>{t.pw}</FLbl>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} value={frm.pw} onChange={e => f("pw", e.target.value)} style={{ ...INP, paddingRight: 72 }} />
                <button type="button" onClick={() => setShowPw(s => !s)} style={PWTOG}>{showPw ? t.hidepw : t.showpw}</button>
              </div>
              {frm.pw.length > 0 && (
                <>
                  <div style={{ height: 4, backgroundColor: C.border, borderRadius: 2, marginTop: 5 }}>
                    <div style={{ width: `${pwS}%`, height: "100%", backgroundColor: pwS === 100 ? C.green : pwS >= 60 ? C.amber : C.red, borderRadius: 2, transition: "width 0.3s" }} />
                  </div>
                  <div style={{ fontSize: 10, color: C.gray, marginTop: 2 }}>{t.pwReq}</div>
                  {pwE.map((e, i) => <div key={i} style={{ fontSize: 10, color: C.red }}>✗ {e}</div>)}
                  {pwE.length === 0 && <div style={{ fontSize: 10, color: C.green }}>✓ {lang === "de" ? "Sicher" : "Strong"}</div>}
                </>
              )}
            </div>
            <div style={FGRP}>
              <FLbl>{t.pwC}</FLbl>
              <input type={showPw ? "text" : "password"} value={frm.pw2} onChange={e => f("pw2", e.target.value)} style={{ ...INP, borderColor: frm.pw2 && frm.pw2 !== frm.pw ? C.red : C.border }} />
              {frm.pw2 && frm.pw2 !== frm.pw && <div style={{ fontSize: 10, color: C.red, marginTop: 2 }}>✗ {t.pwMismatch}</div>}
            </div>
            <div style={FGRP}>
              <FLbl>{t.role}</FLbl>
              <div style={{ display: "flex", gap: 8 }}>
                {[["employee", t.emp], ["admin", t.adm]].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => f("role", v)} style={{ flex: 1, padding: "7px 0", borderRadius: 7, fontSize: 11, fontWeight: 700, border: `2px solid ${frm.role === v ? C.red : C.border}`, backgroundColor: frm.role === v ? C.redL : C.white, color: frm.role === v ? C.red : C.gray, cursor: "pointer" }}>{l}</button>
                ))}
              </div>
            </div>
            {frm.role === "admin" && (
              <div style={FGRP}><FLbl>{t.code}</FLbl><input type="password" value={frm.adminCode} onChange={e => f("adminCode", e.target.value)} placeholder={t.codeHint} style={INP} /></div>
            )}
            {err && <ErrBox msg={err} />}
            <button onClick={doLogin} style={PBTN}>{t.reg}</button>
            <div style={{ height: 1, backgroundColor: C.border, margin: "11px 0" }} />
            <div style={{ textAlign: "center", fontSize: 11, color: C.gray }}>{t.haveAcc} <button onClick={() => { setAuthMode("login"); setErr(""); }} style={LINKRED}>{t.signIn}</button></div>
          </>
        )}
        {authMode === "invite" && (
          <>
            <h2 style={{ fontWeight: 800, fontSize: 18, color: C.dark, margin: "0 0 18px", textAlign: "center" }}>🎟 {t.activateAcc}</h2>
            <div style={{ backgroundColor: C.redL, borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontSize: 11, color: C.redD }}>{lang === "de" ? "8-stelligen Code eingeben:" : "Enter the 8-character code:"}</div>
            <div style={FGRP}>
              <FLbl>{t.inviteLabel}</FLbl>
              <input value={frm.inviteCode} onChange={e => f("inviteCode", e.target.value.toUpperCase())} maxLength={8} style={{ ...INP, letterSpacing: 4, fontSize: 16, textAlign: "center", fontWeight: 700 }} />
            </div>
            {err && <ErrBox msg={err} />}
            <button onClick={doCheckInvite} style={PBTN}>{t.activateAcc}</button>
            <button type="button" onClick={() => { setAuthMode("login"); setErr(""); }} style={{ ...SBTN, width: "100%", marginTop: 7 }}>{t.backLogin}</button>
          </>
        )}
        {authMode === "setInvitePw" && activatingEmp && (
          <>
            <div style={{ backgroundColor: C.greenL, borderRadius: 10, padding: 12, marginBottom: 14, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.green, marginBottom: 2 }}>{t.welcomeInvite}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{dName(activatingEmp)}</div>
              {activatingEmp.company && <div style={{ fontSize: 11, color: C.gray }}>{activatingEmp.company}</div>}
            </div>
            <div style={FGRP}>
              <FLbl>{t.pw}</FLbl>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} value={frm.pw} onChange={e => f("pw", e.target.value)} style={{ ...INP, paddingRight: 72 }} />
                <button type="button" onClick={() => setShowPw(s => !s)} style={PWTOG}>{showPw ? t.hidepw : t.showpw}</button>
              </div>
              {frm.pw.length > 0 && (
                <>
                  <div style={{ height: 4, backgroundColor: C.border, borderRadius: 2, marginTop: 5 }}>
                    <div style={{ width: `${pwS}%`, height: "100%", backgroundColor: pwS === 100 ? C.green : pwS >= 60 ? C.amber : C.red, borderRadius: 2 }} />
                  </div>
                  {pwE.map((e, i) => <div key={i} style={{ fontSize: 10, color: C.red }}>✗ {e}</div>)}
                  {pwE.length === 0 && <div style={{ fontSize: 10, color: C.green }}>✓</div>}
                </>
              )}
            </div>
            <div style={FGRP}><FLbl>{t.pwC}</FLbl><input type={showPw ? "text" : "password"} value={frm.pw2} onChange={e => f("pw2", e.target.value)} style={{ ...INP, borderColor: frm.pw2 && frm.pw2 !== frm.pw ? C.red : C.border }} /></div>
            {err && <ErrBox msg={err} />}
            <button onClick={doActivate} style={PBTN}>{t.setPwBtn}</button>
          </>
        )}
        {authMode === "forgot" && (
          <>
            <h2 style={{ fontWeight: 800, fontSize: 18, color: C.dark, margin: "0 0 18px", textAlign: "center" }}>{t.forgotTitle}</h2>
            <p style={{ fontSize: 12, color: C.gray, marginTop: -10, marginBottom: 14 }}>{t.forgotDesc}</p>
            <div style={FGRP}><FLbl>{t.email}</FLbl><input type="email" value={frm.email} onChange={e => f("email", e.target.value)} style={INP} /></div>
            {err && <ErrBox msg={err} />}
            <button onClick={doForgot} style={PBTN}>{t.sendCode}</button>
            <button type="button" onClick={() => { setAuthMode("login"); setErr(""); }} style={{ ...SBTN, width: "100%", marginTop: 7 }}>{t.backLogin}</button>
          </>
        )}
        {authMode === "code" && (
          <>
            <h2 style={{ fontWeight: 800, fontSize: 18, color: C.dark, margin: "0 0 18px", textAlign: "center" }}>{t.forgotTitle}</h2>
            <div style={{ backgroundColor: C.grayL, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.gray, marginBottom: 6 }}>{t.simEmail}</div>
              <div style={{ backgroundColor: C.white, borderRadius: 7, padding: "10px 0", textAlign: "center", border: `1px solid ${C.border}`, marginTop: 7 }}>
                <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 8, color: C.red, fontFamily: "monospace" }}>{resetState.code}</div>
                <div style={{ fontSize: 10, color: C.gray, marginTop: 2 }}>15 min</div>
              </div>
            </div>
            <div style={FGRP}>
              <FLbl>{t.codeLabel}</FLbl>
              <input value={frm.resetCode} onChange={e => f("resetCode", e.target.value)} maxLength={6} style={{ ...INP, letterSpacing: 6, fontSize: 18, textAlign: "center", fontWeight: 700 }} />
            </div>
            {err && <ErrBox msg={err} />}
            <button onClick={doVerify} style={PBTN}>{t.verifyCode}</button>
            <button type="button" onClick={() => { setAuthMode("login"); setErr(""); }} style={{ ...SBTN, width: "100%", marginTop: 7 }}>{t.backLogin}</button>
          </>
        )}
        {authMode === "resetpw" && (
          <>
            <h2 style={{ fontWeight: 800, fontSize: 18, color: C.dark, margin: "0 0 18px", textAlign: "center" }}>{t.newPwTitle}</h2>
            <div style={FGRP}>
              <FLbl>{t.pw}</FLbl>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} value={frm.newPw} onChange={e => f("newPw", e.target.value)} style={{ ...INP, paddingRight: 72 }} />
                <button type="button" onClick={() => setShowPw(s => !s)} style={PWTOG}>{showPw ? t.hidepw : t.showpw}</button>
              </div>
            </div>
            <div style={FGRP}><FLbl>{t.pwC}</FLbl><input type={showPw ? "text" : "password"} value={frm.newPw2} onChange={e => f("newPw2", e.target.value)} style={INP} /></div>
            {err && <ErrBox msg={err} />}
            <button onClick={doResetPw} style={PBTN}>{t.setPwBtn}</button>
          </>
        )}
        {authMode === "legacy" && (
          <>
            <div style={{ backgroundColor: C.amberL, border: `1px solid #fde68a`, borderRadius: 10, padding: 12, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#92400E", marginBottom: 3 }}>{t.legacyTitle}</div>
              <div style={{ fontSize: 11, color: "#78350F" }}>{t.legacyDesc}</div>
            </div>
            <div style={FGRP}>
              <FLbl>{t.pw}</FLbl>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} value={frm.pw} onChange={e => f("pw", e.target.value)} style={{ ...INP, paddingRight: 72 }} />
                <button type="button" onClick={() => setShowPw(s => !s)} style={PWTOG}>{showPw ? t.hidepw : t.showpw}</button>
              </div>
            </div>
            <div style={FGRP}><FLbl>{t.pwC}</FLbl><input type={showPw ? "text" : "password"} value={frm.pw2} onChange={e => f("pw2", e.target.value)} style={INP} /></div>
            {err && <ErrBox msg={err} />}
            <button onClick={async () => {
              setErr("");
              const pe = valPw(frm.pw, lang);
              if (pe.length) { setErr(`${t.pwWeak}: ${pe.join(", ")}`); return; }
              if (frm.pw !== frm.pw2) { setErr(t.pwMismatch); return; }
              try {
                await window.storage.set(`pw-${legacyUser.id}`, await hashPw(frm.pw), true);
                await window.storage.set("session", JSON.stringify(legacyUser));
                setUser(legacyUser);
              } catch (e) {
                setErr(lang === "de" ? "Fehler" : "Error");
              }
            }} style={PBTN}>{t.setPwBtn}</button>
            <button type="button" onClick={() => { setAuthMode("login"); setErr(""); }} style={{ ...SBTN, width: "100%", marginTop: 7 }}>{t.backLogin}</button>
          </>
        )}
      </div>
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <button onClick={clearAll} style={{ fontSize: 11, color: C.gray, border: `1px solid ${C.border}`, backgroundColor: C.white, borderRadius: 6, padding: "5px 12px", cursor: "pointer" }}>{t.clearData}</button>
      </div>
    </div>
  );
}
