// localStorage ทั้งหมดอยู่ที่นี่ที่เดียว · คีย์ขึ้นต้น budu:
const P = 'budu:';

function read(key) {
  try { return JSON.parse(localStorage.getItem(P + key)); } catch { return null; }
}
function write(key, val) {
  try { localStorage.setItem(P + key, JSON.stringify(val)); } catch { /* storage เต็ม/ถูกปิด */ }
}

export const local = {
  getSession: () => read('session'),
  setSession: s => write('session', s),
  getCache: () => read('cache'),
  setCache: c => write('cache', { ...c, savedAt: new Date().toISOString() }),
  clearAll() {
    try {
      Object.keys(localStorage).filter(k => k.startsWith(P)).forEach(k => localStorage.removeItem(k));
    } catch { /* ignore */ }
  },
};
