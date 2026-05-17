import React, { useState } from 'react';
import { Overlay, MH } from '../ui/Layout';
import { C } from '../../constants/colors';
import { INP, FLbl, CountrySelect } from '../ui/Inputs';
import { PBTN, SBTN } from '../ui/Buttons';
import { transferLabel } from '../../utils/formatUtils';
import { DH_COMPANIES, TRANSFER_TYPES } from '../../constants/config';

import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export function EditEmpModal({ emp, lang, t, onSaved, onClose }) {
  const [fn, setFn] = useState(emp.firstName || "");
  const [ln, setLn] = useState(emp.lastName || "");
  const [co, setCo] = useState(emp.company || "");
  const [tt, setTt] = useState(emp.transferType || "");
  const [hco, setHco] = useState(emp.homeCountry || "");
  const [hstco, setHstco] = useState(emp.hostCountry || "");
  const [hent, setHent] = useState(emp.homeEntity || "");
  const [hsent, setHsent] = useState(emp.hostEntity || "");
  
  const save = async () => {
    try {
      await updateDoc(doc(db, "users", emp.id), {
        firstName: fn,
        lastName: ln,
        company: co,
        transferType: tt,
        homeCountry: hco,
        hostCountry: hstco,
        homeEntity: tt === "assignment" ? hent : "",
        hostEntity: tt === "assignment" ? hsent : ""
      });
      onSaved();
      onClose();
    } catch (e) {
      console.error(e);
    }
  };
  
  return (
    <Overlay onClose={onClose}>
      <MH title={t.editProfile} onClose={onClose} />
      <div style={{ display: "flex", gap: 8, marginBottom: 11 }}>
        <div style={{ flex: 1 }}><FLbl>{t.firstName}</FLbl><input value={fn} onChange={e => setFn(e.target.value)} style={INP} /></div>
        <div style={{ flex: 1 }}><FLbl>{t.lastName}</FLbl><input value={ln} onChange={e => setLn(e.target.value)} style={INP} /></div>
      </div>
      <div style={{ marginBottom: 11 }}><FLbl>{t.company}</FLbl><select value={co} onChange={e => setCo(e.target.value)} style={INP}><option value="">{t.selectCo}</option>{DH_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
      <div style={{ marginBottom: 11 }}>
        <FLbl>{t.transferType}</FLbl>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {TRANSFER_TYPES.map(tp => (
            <button key={tp} type="button" onClick={() => setTt(tp)} style={{ padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, border: `2px solid ${tt === tp ? C.red : C.border}`, backgroundColor: tt === tp ? C.redL : C.white, color: tt === tp ? C.red : C.gray, cursor: "pointer" }}>
              {transferLabel(tp, lang)}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 11 }}>
        <div style={{ flex: 1 }}><FLbl>{t.homeCo}</FLbl><CountrySelect value={hco} onChange={setHco} t={t} /></div>
        <div style={{ flex: 1 }}><FLbl>{t.hostCo}</FLbl><CountrySelect value={hstco} onChange={setHstco} t={t} /></div>
      </div>
      {tt === "assignment" && (
        <div style={{ backgroundColor: C.amberL, border: `1px solid #fde68a`, borderRadius: 8, padding: 10, marginBottom: 11 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#92400E", marginBottom: 8, textTransform: "uppercase" }}>Assignment</div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}><FLbl>{t.homeEnt}</FLbl><select value={hent} onChange={e => setHent(e.target.value)} style={INP}><option value="">{t.selectCo}</option>{DH_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div style={{ flex: 1 }}><FLbl>{t.hostEnt}</FLbl><select value={hsent} onChange={e => setHsent(e.target.value)} style={INP}><option value="">{t.selectCo}</option>{DH_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 7 }}>
        <button onClick={save} style={PBTN}>{t.save}</button>
        <button onClick={onClose} style={SBTN}>{t.cancel}</button>
      </div>
    </Overlay>
  );
}
