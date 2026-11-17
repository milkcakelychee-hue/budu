// BuDu service worker · แคชเฉพาะไฟล์แอป ห้ามแคชคำขอไป Supabase
// เปลี่ยนเลขเวอร์ชันทุกครั้งที่อัปเดตไฟล์
const CACHE = 'budu-v39';
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/fonts.css',
  'css/tokens.css',
  'css/app.css',
  'fonts/gaegu-700-subset.woff2',
  'fonts/bai-jamjuree-400-latin.woff2',
  'fonts/bai-jamjuree-400-thai.woff2',
  'fonts/bai-jamjuree-500-latin.woff2',
  'fonts/bai-jamjuree-500-thai.woff2',
  'fonts/bai-jamjuree-600-latin.woff2',
  'fonts/bai-jamjuree-600-thai.woff2',
  'fonts/bai-jamjuree-700-latin.woff2',
  'fonts/bai-jamjuree-700-thai.woff2',
  'fonts/prompt-400-latin.woff2',
  'fonts/prompt-400-thai.woff2',
  'fonts/prompt-500-latin.woff2',
  'fonts/prompt-500-thai.woff2',
  'fonts/prompt-600-latin.woff2',
  'fonts/prompt-600-thai.woff2',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/qr-iloveyou.svg',
  'js/app.js',
  'js/config.js',
  'js/strings.js',
  'js/icons.js',
  'js/ui.js',
  'js/local.js',
  'js/api.js',
  'js/store.js',
  'js/streak.js',
  'js/vendor/supabase.js',
  'js/views/onboarding.js',
  'js/views/today.js',
  'js/views/deduct.js',
  'js/views/rewards.js',
  'js/views/coupon.js',
  'js/views/stats.js',
  'js/views/history.js',
  'js/views/settings.js',
  'js/views/manage-activities.js',
  'js/views/manage-rewards.js',
];

self.addEventListener('install', e => {
  // cache: 'reload' = ดึงจากเซิร์ฟเวอร์จริง ไม่ใช้แคชของเบราว์เซอร์ (GitHub Pages เก็บไฟล์ไว้ 10 นาที)
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('budu-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // เฉพาะไฟล์ของแอปเอง (origin เดียวกัน, GET) · Supabase เป็นอีก origin จึงผ่านไปเครือข่ายเสมอ
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // หน้า HTML: ดึงจากเซิร์ฟเวอร์ก่อน (ได้ meta ใหม่เสมอ เช่นสีแถบเวลา/แบตตอนเพิ่มไปหน้าโฮม) · ออฟไลน์ใช้แคช
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).catch(() => caches.match('./', { ignoreSearch: true }))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request))
  );
});
