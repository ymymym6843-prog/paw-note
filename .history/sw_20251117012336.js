const CACHE_NAME = 'paw-note-cache-v1';
const CACHE_NAME = 'paw-note-cache-v2'; // 버전을 올립니다!

// 앱 설치 시 캐싱할 파일 목록
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  '/images/paw_logo.png',
  '/images/paw_logo_192.png',
  '/images/paw_logo_512.png',
  '/images/paw_foot.png',
  // 고양이 파츠 이미지들을 여기에 추가합니다.
  // (파일이 많으므로, 아래 스크립트가 동적으로 캐싱합니다)
];

// 서비스 워커 설치 이벤트
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // 기본 파일들을 먼저 캐싱합니다.
        return cache.addAll(urlsToCache);
      })
  );
});

// 서비스 워커 활성화 및 이전 캐시 정리 이벤트
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 현재 캐시 이름이 아닌 모든 이전 캐시를 삭제합니다.
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 네트워크 요청 가로채기 (Fetch) 이벤트
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에 파일이 있으면 바로 반환합니다.
        if (response) {
          return response;
        }

        // 캐시에 없으면 네트워크로 요청하고, 성공하면 캐시에 저장합니다.
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
  );
});