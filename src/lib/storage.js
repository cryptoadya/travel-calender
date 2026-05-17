import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

export function createStorage(db) {
  return {
    get: async (key, bypassCache) => {
      // Local keys
      if (key === 'session' || key === 'tc-ver' || key === 'all-users' || key.startsWith('pw-')) {
        const val = localStorage.getItem(key);
        return val !== null ? { value: val } : null;
      }
      
      try {
        const collectionName = key.startsWith("rem-") ? "meta" : "data";
        const snap = await getDoc(doc(db, collectionName, key));
        if (snap.exists()) {
          return { value: snap.data().value };
        }
        return null;
      } catch (e) {
        console.error("Storage GET error for key", key, e);
        return null;
      }
    },
    
    set: async (key, value, bypassCache) => {
      // Local keys
      if (key === 'session' || key === 'tc-ver' || key === 'all-users' || key.startsWith('pw-')) {
        localStorage.setItem(key, value);
        return;
      }

      try {
        const collectionName = key.startsWith("rem-") ? "meta" : "data";
        await setDoc(doc(db, collectionName, key), { value });
      } catch (e) {
        console.error("Storage SET error for key", key, e);
      }
    },
    
    delete: async (key, bypassCache) => {
      // Local keys
      if (key === 'session' || key === 'tc-ver' || key === 'all-users' || key.startsWith('pw-')) {
        localStorage.removeItem(key);
        return;
      }

      try {
        const collectionName = key.startsWith("rem-") ? "meta" : "data";
        await deleteDoc(doc(db, collectionName, key));
      } catch (e) {
        console.error("Storage DELETE error for key", key, e);
      }
    },
    
    list: async () => {
      // Stub for list, as it's not fully mapped to Firestore
      return { keys: Object.keys(localStorage) };
    }
  };
}
