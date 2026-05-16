import React, { useState, useEffect } from 'react';
import { T } from './locales/translations';
import { APP_VER } from './constants/config';
import { Ctr, Spin } from './components/ui/Feedback';

import { AuthPage } from './pages/AuthPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { CalendarApp } from './pages/CalendarApp';

export default function App() {
  const [lang, setLang] = useState("de");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewEmp, setViewEmp] = useState(null);
  const [notif, setNotif] = useState("");

  const t = T[lang];

  const notify = msg => {
    setNotif(msg);
    setTimeout(() => setNotif(""), 3000);
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("session");
        if (r) setUser(JSON.parse(r.value));
      } catch (e) { }
      setLoading(false);
    })();
  }, []);

  const clearAll = async () => {
    try {
      const ks = await window.storage.list("", true);
      if (ks?.keys) {
        for (const k of ks.keys) {
          try { await window.storage.delete(k, true); } catch (e) { }
        }
      }
    } catch (e) { }
    try { await window.storage.delete("session"); } catch (e) { }
    try { await window.storage.set("tc-ver", APP_VER, true); } catch (e) { }
    setUser(null);
    notify(t.clearOK);
  };

  const logout = async () => {
    try { await window.storage.delete("session"); } catch (e) { }
    setUser(null);
    setViewEmp(null);
  };

  if (loading) return <Ctr><Spin /></Ctr>;

  if (!user) {
    return (
      <>
        {notif && <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", backgroundColor: "#00A651", color: "#FFF", padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700, zIndex: 9999 }}>{notif}</div>}
        <AuthPage lang={lang} setLang={setLang} t={t} setUser={setUser} notify={notify} clearAll={clearAll} />
      </>
    );
  }

  if (user.role === "admin") {
    return <AdminDashboard lang={lang} setLang={setLang} t={t} user={user} logout={logout} viewEmp={viewEmp} setViewEmp={setViewEmp} />;
  }

  return <CalendarApp lang={lang} setLang={setLang} t={t} user={user} logout={logout} uid={user.id} readOnly={false} />;
}
