import React, { useState, useEffect } from 'react';
import { T } from './locales/translations';
import { APP_VER } from './constants/config';
import { Ctr, Spin } from './components/ui/Feedback';

import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

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
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const d = await getDoc(doc(db, "users", fbUser.uid));
          if (d.exists()) {
            setUser({ ...d.data(), id: fbUser.uid });
          } else {
            setUser(null);
          }
        } catch (e) {
          console.error(e);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const clearAll = async () => {
    localStorage.clear();
    try { await window.storage.set("tc-ver", APP_VER); } catch (e) { }
    setUser(null);
    notify(t.clearOK);
  };

  const logout = async () => {
    await signOut(auth);
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
