import React, { useState } from 'react';
import { Overlay, MH } from '../ui/Layout';
import { C } from '../../constants/colors';
import { INP, FLbl, CountrySelect } from '../ui/Inputs';
import { PBTN, SBTN } from '../ui/Buttons';
import { ErrBox } from '../ui/Feedback';
import { transferLabel } from '../../utils/formatUtils';
import { genInvite } from '../../utils/authUtils';
import { DH_COMPANIES, TRANSFER_TYPES } from '../../constants/config';

import { db } from '../../lib/firebase';
import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';

export function CreateEmpModal({ lang, t, onCreated, onClose }) {
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", company: "", transferType: "", homeCountry: "", hostCountry: "", homeEntity: "", hostEntity: "" });
  const [err, setErr] = useState("");
  const ff = (k, v) => setF(x => ({ ...x, [k]: v }));
  
  const create = async () => {
    setErr("");
    if (!f.firstName.trim() || !f.lastName.trim() || !f.email.trim()) {
      setErr(lang === "de" ? "Pflichtfelder: Vorname, Nachname, E-Mail" : "Required: First name, last name, email");
      return;
    }
    
    const email = f.email.trim().toLowerCase();
    try {
      const q = query(collection(db, "users"), where("email", "==", email));
      const snaps = await getDocs(q);
      if (!snaps.empty) { setErr(t.eExists); return; }
      
      const nu = {
        firstName: f.firstName.trim(),
        lastName: f.lastName.trim(),
        email,
        company: f.company,
        transferType: f.transferType,
        homeCountry: f.homeCountry,
        hostCountry: f.hostCountry,
        homeEntity: f.transferType === "assignment" ? f.homeEntity : "",
        hostEntity: f.transferType === "assignment" ? f.hostEntity : "",
        role: "employee",
        status: "invited",
        inviteCode: genInvite(),
        inviteExpires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        reg: new Date().toISOString()
      };
      
      const docRef = doc(collection(db, "users"));
      await setDoc(docRef, nu);
      onCreated({ ...nu, id: docRef.id });
    } catch (e) {
      console.error(e);
      setErr(lang === "de" ? "Datenbankfehler" : "Database error");
    }
  };
  
  return (
    <Overlay onClose={onClose}>
      <MH title={t.addEmp} onClose={onClose} />
      <div style={{ display: "flex", gap: 8, marginBottom: 11 }}>
        <div style={{ flex: 1 }}><FLbl>{t.firstName} *</FLbl><input value={f.firstName} onChange={e => ff("firstName", e.target.value)} style={INP} /></div>
        <div style={{ flex: 1 }}><FLbl>{t.lastName} *</FLbl><input value={f.lastName} onChange={e => ff("lastName", e.target.value)} style={INP} /></div>
      </div>
      <div style={{ marginBottom: 11 }}><FLbl>{t.email} *</FLbl><input type="email" value={f.email} onChange={e => ff("email", e.target.value)} style={INP} /></div>
      <div style={{ marginBottom: 11 }}><FLbl>{t.company}</FLbl><select value={f.company} onChange={e => ff("company", e.target.value)} style={INP}><option value="">{t.selectCo}</option>{DH_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
      <div style={{ marginBottom: 11 }}>
        <FLbl>{t.transferType}</FLbl>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {TRANSFER_TYPES.map(tp => (
            <button key={tp} type="button" onClick={() => ff("transferType", tp)} style={{ padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, border: `2px solid ${f.transferType === tp ? C.red : C.border}`, backgroundColor: f.transferType === tp ? C.redL : C.white, color: f.transferType === tp ? C.red : C.gray, cursor: "pointer" }}>
              {transferLabel(tp, lang)}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 11 }}>
        <div style={{ flex: 1 }}><FLbl>{t.homeCo}</FLbl><CountrySelect value={f.homeCountry} onChange={v => ff("homeCountry", v)} t={t} /></div>
        <div style={{ flex: 1 }}><FLbl>{t.hostCo}</FLbl><CountrySelect value={f.hostCountry} onChange={v => ff("hostCountry", v)} t={t} /></div>
      </div>
      {f.transferType === "assignment" && (
        <div style={{ backgroundColor: C.amberL, border: `1px solid #fde68a`, borderRadius: 8, padding: 10, marginBottom: 11 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#92400E", marginBottom: 8, textTransform: "uppercase" }}>Assignment</div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}><FLbl>{t.homeEnt}</FLbl><select value={f.homeEntity} onChange={e => ff("homeEntity", e.target.value)} style={INP}><option value="">{t.selectCo}</option>{DH_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div style={{ flex: 1 }}><FLbl>{t.hostEnt}</FLbl><select value={f.hostEntity} onChange={e => ff("hostEntity", e.target.value)} style={INP}><option value="">{t.selectCo}</option>{DH_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          </div>
        </div>
      )}
      {err && <ErrBox msg={err} />}
      <div style={{ display: "flex", gap: 7 }}>
        <button onClick={create} style={PBTN}>{t.addEmp}</button>
        <button onClick={onClose} style={SBTN}>{t.cancel}</button>
      </div>
    </Overlay>
  );
}
