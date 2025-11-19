const CACHE_NAME = 'paw-note-cache-v4'; // 경로 수정 후 버전 업데이트


// 앱 설치 시 캐싱할 파일 목록
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  './images/paw_logo.png',
  './images/paw_logo_192.png',
  './images/paw_logo_512.png',
  './images/paw_foot.png',
  // 고양이 파츠 이미지들을 모두 캐싱합니다.
  './images/cat/bg_cozy_room.png', // 경로 일관성을 위해 './' 추가
  './images/cat/bg_forest_path.png', // 경로 일관성을 위해 './' 추가
  './images/cat/bg_library.png', // 경로 일관성을 위해 './' 추가
  './images/cat/bg_magical_landscape.png', // 경로 일관성을 위해 './' 추가
  './images/cat/bg_night_road.png', // 경로 일관성을 위해 './' 추가
  './images/cat/bg_starry_night.png', // 경로 일관성을 위해 './' 추가
  './images/cat/bg_sunny_lawn.png', // 경로 일관성을 위해 './' 추가
  './images/cat/cushion_blue.png', // 경로 일관성을 위해 './' 추가
  './images/cat/cushion_green.png', // 경로 일관성을 위해 './' 추가
a/c:\myapp\diary_re\sw.js
  './images/cat/cushion_orange.png', // 경로 일관성을 위해 './' 추가
  './images/cat/cushion_rainbow.png', // 경로 일관성을 위해 './' 추가
  './images/cat/cushion_red.png', // 경로 일관성을 위해 './' 추가
  './images/cat/cushion_yellow.png', // 경로 일관성을 위해 './' 추가
  './images/cat/fur_calico.png', // 경로 일관성을 위해 './' 추가
  './images/cat/fur_short_silver.png', // 경로 일관성을 위해 './' 추가
  './images/cat/fur_siamese.png', // 경로 일관성을 위해 './' 추가
  './images/cat/fur_tuxedo.png', // 경로 일관성을 위해 './' 추가
  './images/cat/fur_white.png', // 경로 일관성을 위해 './' 추가
  // 누락된 고양이 파츠 이미지 추가
  './images/cat/eyes_amber.png', // 경로 일관성을 위해 './' 추가
  './images/cat/eyes_blue.png', // 경로 일관성을 위해 './' 추가
  './images/cat/eyes_oddeye.png', // 경로 일관성을 위해 './' 추가
  './images/cat/hat_green_knit.png', // 경로 일관성을 위해 './' 추가
  './images/cat/hat_navy_knit.png', // 경로 일관성을 위해 './' 추가
  './images/cat/hat_pink_knit.png', // 경로 일관성을 위해 './' 추가
  './images/cat/hat_skyblue_knit.png', // 경로 일관성을 위해 './' 추가
  './images/cat/acc_baseball.png', // 경로 일관성을 위해 './' 추가
  './images/cat/acc_bow_tie.png', // 경로 일관성을 위해 './' 추가
  './images/cat/acc_churu.png', // 경로 일관성을 위해 './' 추가
  './images/cat/acc_crown.png', // 경로 일관성을 위해 './' 추가
  './imagescat/acc_hairpin.png', // 경로 일관성을 위해 './' 추가
  './images/cat/acc_mouse_toy.png', // 경로 일관성을 위해 './' 추가
  './images/cat/acc_rabbit_doll.png', // 경로 일관성을 위해 './' 추가
  './images/cat/acc_teddy_bear.png', // 경로 일관성을 위해 './' 추가
  './images/cat/acc_yarnball.png' // 경로 일관성을 위해 './' 추가
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