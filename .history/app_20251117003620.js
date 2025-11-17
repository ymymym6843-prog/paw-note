// ===================
// ?곸닔 / 怨듯넻 ?좏떥
// 상수 / 공통 유틸
// ===================
const STORAGE_KEY = "diaries_v2";
const PIN_KEY = "diaryPin";
const THEME_KEY = "diaryTheme";
const CAT_GALLERY_KEY = "pawCatGallery";
const CAT_PROFILE_KEY = "pawCatProfile";
const MAX_HISTORY = 50; // Undo/Redo ?덉뒪?좊━ 理쒕? 湲몄씠
const MAX_HISTORY = 50; // Undo/Redo 히스토리 최대 길이
const PAW_FOOT_ICON_SRC = "images/paw_foot.png";
const pawFootStickerImage = new Image();
pawFootStickerImage.src = PAW_FOOT_ICON_SRC;

const defaultCatProfile = {
  bg: "bg_cozy_room",
  cushion: "cushion_blue",
  fur: "fur_white",
  eyes: "eyes_blue",
  hat: "none",
  accessory: "none",
};

function loadDiaries() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveDiaries(diaries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(diaries));
}

// 臾몄옄??媛먯젙 ??1~5 ?ㅻ━ 媛쒖닔
// 문자열 감정 -> 1~5 젤리 개수
function normalizeEmotion(raw) {
  if (typeof raw === "number") {
    if (isNaN(raw)) return 5;
    return Math.min(5, Math.max(1, Math.round(raw)));
  }
  switch (raw) {
    case "happy":
      return 5;
    case "sad":
      return 2;
    case "angry":
      return 1;
    case "scared":
      return 2;
    case "calm":
    case "neutral":
      return 3;
    default:
      return 5;
  }
}

// 媛먯젙?쇰꺼
// 감정라벨
function getEmotionLabel(count, asHtml = false, size = 16) {
  const c = normalizeEmotion(count);
  let paws;
  if (asHtml) {
    paws = `<img src="${PAW_FOOT_ICON_SRC}" alt="paw" class="paw-foot-icon" style="height: ${size}px;" />`.repeat(c);
  } else {
    paws = "?맽".repeat(c);
    paws = "🐾".repeat(c);
  }  switch (c) {
    case 1:
      return `${paws} ?꾩＜ ?섎뱺 ??;
      return `${paws} 아주 힘든 날`;
    case 2:
      return `${paws} 議곌툑 ?ㅼ슫`;
      return `${paws} 조금 슬픈`;
    case 3:
      return `${paws} 蹂댄넻`;
      return `${paws} 보통`;
    case 4:
      return `${paws} 醫뗭? ??;
      return `${paws} 좋은 날`;
    case 5:
    default:
      return `${paws} 理쒓퀬 醫뗭? ??;
      return `${paws} 최고 좋은 날`;
  }
}

// ?좎뵪 硫뷀?
// 날씨 메타
function getWeatherMeta(value) {
  switch (value) {
    case "sunny":
      return { label: "?截?留묒쓬" };
      return { label: "☀️ 맑음" };
    case "cloudy":
      return { label: "???먮┝" };
      return { label: "⛅ 흐림" };
    case "rainy":
      return { label: "?뙢截?鍮? };
      return { label: "🌧️ 비" };
    case "snowy":
      return { label: "?꾬툘 ?? };
      return { label: "❄️ 눈" };
    case "stormy":
      return { label: "?덌툘 ??뭾" };
      return { label: "⛈️ 폭풍" };
    default:
      return { label: "?截?留묒쓬" };
      return { label: "☀️ 맑음" };
  }
}

// 怨좎뼇???꾨줈??
// 고양이 프로필
function loadCatProfile() {
  const raw = localStorage.getItem(CAT_PROFILE_KEY);
  if (!raw) return { ...defaultCatProfile };
  try {
    return { ...defaultCatProfile, ...JSON.parse(raw) };
  } catch {
    return { ...defaultCatProfile };
  }
}

function saveCatProfile(profile) {
  localStorage.setItem(CAT_PROFILE_KEY, JSON.stringify(profile));
}

function loadCatGallery() {
  const data = localStorage.getItem(CAT_GALLERY_KEY);
  return data ? JSON.parse(data) : [];
}

function saveCatGallery(gallery) {
  localStorage.setItem(CAT_GALLERY_KEY, JSON.stringify(gallery));
}

// ===================
// ?뵍 PIN ?좉툑
// 🔐 PIN 잠금
// ===================
const lockScreen = document.getElementById("lockScreen");
const lockStepSetup = document.getElementById("lockStepSetup");
const lockStepEnter = document.getElementById("lockStepEnter");
const appEl = document.getElementById("app");

const newPin = document.getElementById("newPin");
const newPinConfirm = document.getElementById("newPinConfirm");
const setPinBtn = document.getElementById("setPinBtn");

const enterPin = document.getElementById("enterPin");
const unlockBtn = document.getElementById("unlockBtn");

function initLock() {
  const pin = localStorage.getItem(PIN_KEY);
  lockScreen.style.display = "block";
  if (pin) {
    lockStepSetup.style.display = "none";
    lockStepEnter.style.display = "block";
  } else {
    lockStepSetup.style.display = "block";
    lockStepEnter.style.display = "none";
  }
}

setPinBtn.addEventListener("click", () => {
  const p1 = newPin.value.trim();
  const p2 = newPinConfirm.value.trim();
  if (!p1 || !p2) {
    alert("PIN??紐⑤몢 ?낅젰??二쇱꽭??");
    alert("PIN을 모두 입력해 주세요.");
    return;
  }
  if (p1 !== p2) {
    alert("PIN???쒕줈 ?ㅻ쫭?덈떎.");
    alert("PIN이 서로 다릅니다.");
    return;
  }
  localStorage.setItem(PIN_KEY, p1);
  alert("PIN???ㅼ젙?섏뿀?듬땲?? ?댁젣遺????PIN?쇰줈 ?좉툑 ?댁젣?????덉뒿?덈떎.");
  alert("PIN을 설정했습니다. 이제부터 이 PIN으로 잠금 해제할 수 있습니다.");
  lockStepSetup.style.display = "none";
  lockStepEnter.style.display = "block";
});

unlockBtn.addEventListener("click", () => {
  const pinSaved = localStorage.getItem(PIN_KEY);
  const entered = enterPin.value.trim();
  if (entered === pinSaved) {
    lockScreen.style.display = "none";
    appEl.style.display = "block";

    // ??蹂댁씪 ??罹붾쾭??珥덇린??
    // 앱 보일 때 캔버스 초기화
    setTimeout(() => {
      resizeAllCanvases();
      clearBaseLayer();
      stickers = [];
      selectedStickerIndex = null;
      resetHistoryWithCurrent();
      renderAll();
    }, 10);
  } else {
    alert("PIN???щ컮瑜댁? ?딆뒿?덈떎.");
    alert("PIN이 올바르지 않습니다.");
  }
});

// PIN 由ъ뀑(踰꾪듉? More ??뿉 ?덉쓬)
// PIN 리셋(버튼은 More 탭에 있음)
const resetPinBtn = document.getElementById("resetPinBtn");
if (resetPinBtn) {
  resetPinBtn.addEventListener("click", () => {
    if (!confirm("??λ맂 PIN????젣?섍퀬 泥섏쓬 ?ㅼ젙 ?붾㈃?쇰줈 ?뚯븘媛덇퉴??")) return;
    if (!confirm("저장된 PIN을 삭제하고 처음 설정 화면으로 돌아갈까요?")) return;
    localStorage.removeItem(PIN_KEY);
    alert("PIN????젣?섏뿀?듬땲?? ?ㅼ쓬 ?ㅽ뻾 ????PIN???ㅼ젙?????덉뒿?덈떎.");
    alert("PIN을 삭제했습니다. 다음 실행 시에 PIN을 설정할 수 있습니다.");
  });
}

// ===================
// ?뙔 ?ㅽ겕 紐⑤뱶
// 🌙 다크 모드
// ===================
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "?截??쇱씠?몃え??;
    themeToggle.textContent = "☀️ 라이트모드";
  } else {
    document.body.classList.remove("dark");
    themeToggle.textContent = "?뙔 ?ㅽ겕紐⑤뱶";
    themeToggle.textContent = "🌙 다크모드";
  }
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") {
    applyTheme(saved);
  } else {
    applyTheme("light");
  }
}

themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.contains("dark");
  const next = isDark ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
});

// ===================
// ?뱭 ?쇨린???붿냼
// 📝 일기 관련 요소
// ===================
const dateInput = document.getElementById("dateInput");
const weatherSelect = document.getElementById("weatherSelect");
const contentInput = document.getElementById("contentInput");
const saveBtn = document.getElementById("saveBtn");
const newEntryBtn = document.getElementById("newEntryBtn");
const listEl = document.getElementById("list");
const searchInput = document.getElementById("searchInput");

const exportTxtBtn = document.getElementById("exportTxtBtn");
const exportPdfBtn = document.getElementById("exportPdfBtn");
const exportPngBtn = document.getElementById("exportPngBtn");

// 洹몃┝ 愿???붿냼
// 그림 관련 요소
const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const clearCanvasBtn = document.getElementById("clearCanvasBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

const drawModeBtn = document.getElementById("drawModeBtn");
const stickerModeBtn = document.getElementById("stickerModeBtn");
const modeHint = document.getElementById("modeHint");

const stickerEmojiButtons = document.querySelectorAll(".sticker-emoji-btn");
const builtInStickerImages = {
  "paw_foot": pawFootStickerImage,
};
const stickerUpload = document.getElementById("stickerUpload");
const uploadStickerBtn = document.getElementById("uploadStickerBtn");
const deleteStickerBtn = document.getElementById("deleteStickerBtn");

// ??/ 罹섎┛??/ ?ы넗
// 탭/캘린더/포토
const tabViews = {
  home: document.getElementById("view-home"),
  calendar: document.getElementById("view-calendar"),
  photos: document.getElementById("view-photos"),
  more: document.getElementById("view-more"),
};
const navButtons = document.querySelectorAll(".bottom-nav .nav-btn");

// 媛먯젙(諛쒕컮?? ?곹깭
let selectedEmotion = 5; // 湲곕낯 5媛??ㅻ━
// 감정(발바닥) 상태
let selectedEmotion = 5; // 기본 5개 젤리
const pawItems = document.querySelectorAll(".paw-rating .paw");

// ===== 諛쒕컮??媛먯젙 UI =====
// ===== 발바닥 감정 UI =====
function setPawRating(value) {
  selectedEmotion = normalizeEmotion(value || 5);
  pawItems.forEach((p) => {
    const v = Number(p.dataset.value);
    if (v <= selectedEmotion) p.classList.add("selected");
    else p.classList.remove("selected");
  });
}
pawItems.forEach((paw) => {
  paw.addEventListener("click", () => {
    const value = Number(paw.dataset.value);
    setPawRating(value);
  });
});

// 洹몃┝ ?곹깭
// 그림 상태
const canvasState = {
  drawing: false,
  mode: "draw", // "draw" | "sticker"
  currentImageData: null,
  history: [],
  historyIndex: -1,
};

// ?덉씠?? 湲곕낯 洹몃┝???ㅽ봽?ㅽ겕由?罹붾쾭??
// 레이어: 기본 그림용 오프스크린 캔버스
const baseCanvas = document.createElement("canvas");
const baseCtx = baseCanvas.getContext("2d");

// ?ㅽ떚而??곹깭
// 스티커 상태
const stickerState = {
  stickers: [],
  selectedStickerIndex: null,
  draggingSticker: false,
  dragOffsetX: 0,
  dragOffsetY: 0,
  resizingSticker: false,
};
const STICKER_SIZE = 80;
const STICKER_MIN_SIZE = 20;
const RESIZE_HANDLE_SIZE = 12;

let selectedStickerEmoji = null;
let selectedStickerImage = null;

// ?ㅻ뒛 ?좎쭨 湲곕낯媛?
// 오늘 날짜 기본값
function setToday() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  dateInput.value = `${yyyy}-${mm}-${dd}`;
}

// ===================
// ???꾪솚
// 탭 전환
// ===================
function showView(view) {
  Object.entries(tabViews).forEach(([key, el]) => {
    if (!el) return;
    el.classList.toggle("active", key === view);
  });
  navButtons.forEach((btn) => {
    const v = btn.dataset.view;
    btn.classList.toggle("active", v === view);
  });

  if (view === "calendar") renderCalendar();
  if (view === "photos") renderPhotoGrid();
}

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const v = btn.dataset.view;
    showView(v);
  });
});

// ===================
// ?렓 罹붾쾭??/ ?덉씠??
// 🖼️ 캔버스 / 레이어
// ===================
function resizeAllCanvases() {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  if (width === 0 || height === 0) return;

  canvas.width = width;
  canvas.height = height;

  baseCanvas.width = width;
  baseCanvas.height = height;

  if (canvasState.currentImageData) {
    const img = new Image();
    img.onload = () => {
      baseCtx.clearRect(0, 0, width, height);
      baseCtx.drawImage(img, 0, 0, width, height);
      renderAll();
    };
    img.src = currentImageData;
  } else { // This seems to be a bug, should be canvasState.currentImageData
    clearBaseLayer();
    renderAll();
  }
}

function clearBaseLayer() {
  baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
  baseCtx.fillStyle = "#ffffff";
  baseCtx.fillRect(0, 0, baseCanvas.width, baseCanvas.height);
}

function renderAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(baseCanvas, 0, 0);

  stickerState.stickers.forEach((s, idx) => {
    if (s.type === "image" && s.image) {
      ctx.drawImage(s.image, s.x, s.y, s.w, s.h);
    } else if (s.type === "emoji" && s.emoji) {
      const size = s.h;
      ctx.font = `${size}px system-ui, emoji`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(s.emoji, s.x + s.w / 2, s.y + s.h / 2);
    }

    if (idx === stickerState.selectedStickerIndex) {
      ctx.save();
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.strokeRect(s.x, s.y, s.w, s.h);

      ctx.setLineDash([]);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(
        s.x + s.w - RESIZE_HANDLE_SIZE,
        s.y + s.h - RESIZE_HANDLE_SIZE,
        RESIZE_HANDLE_SIZE,
        RESIZE_HANDLE_SIZE
      );
      ctx.restore();
    }
  });
}

function renderAllAndSave() {
  renderAll();
  canvasState.currentImageData = canvas.toDataURL("image/png");
}

// ===================
// ?덉뒪?좊━(Undo/Redo)
// ===================
function resetHistoryWithCurrent() {
  renderAllAndSave();
  canvasState.history = [canvasState.currentImageData];
  canvasState.historyIndex = 0;
}

function commitState() {
  renderAllAndSave();
  if (canvasState.historyIndex < canvasState.history.length - 1) {
    canvasState.history = canvasState.history.slice(0, canvasState.historyIndex + 1);
  }
  canvasState.history.push(canvasState.currentImageData);
  canvasState.historyIndex = canvasState.history.length - 1;

  if (canvasState.history.length > MAX_HISTORY) {
    const overflow = canvasState.history.length - MAX_HISTORY;
    canvasState.history.splice(0, overflow);
    canvasState.historyIndex -= overflow;
  }
}

function restoreFromHistory(index) {
  const imgData = canvasState.history[index];
  if (!imgData) return;

  canvasState.currentImageData = imgData;
  stickerState.stickers = [];
  stickerState.selectedStickerIndex = null;

  const img = new Image();
  img.onload = () => {
    baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
    baseCtx.drawImage(img, 0, 0, baseCanvas.width, baseCanvas.height);
    renderAll();
  };
  img.src = imgData;
}

undoBtn.addEventListener("click", () => {
  if (canvasState.historyIndex <= 0) {
    alert("?섎룎由?湲곕줉???놁뼱??");
    alert("되돌릴 기록이 없어요.");
    return;
  }
  canvasState.historyIndex--;
  restoreFromHistory(canvasState.historyIndex);
});

redoBtn.addEventListener("click", () => {
  if (canvasState.historyIndex >= canvasState.history.length - 1) {
    alert("?ㅼ떆??湲곕줉???놁뼱??");
    alert("다시할 기록이 없어요.");
    return;
  }
  canvasState.historyIndex++;
  restoreFromHistory(canvasState.historyIndex);
});

// ===================
// 醫뚰몴 / 紐⑤뱶 愿由?
// ===================
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  if (e.touches && e.touches[0]) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    };
  } else {
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }
}

function setMode(newMode) {
  canvasState.mode = newMode;
  if (canvasState.mode === "draw") {
    drawModeBtn.classList.add("active");
    stickerModeBtn.classList.remove("active");
    modeHint.textContent = "?먭???留덉슦?ㅻ줈 ?먯쑀濡?쾶 洹몃━湲?;
    modeHint.textContent = "손가락/마우스로 자유롭게 그리기";
  } else {
    stickerModeBtn.classList.add("active");
    drawModeBtn.classList.remove("active");
    modeHint.textContent =
      "?ㅽ떚而ㅻ? ?좏깮?섍퀬 罹붾쾭?ㅻ? ?대┃??遺숈씠嫄곕굹 ?대룞 / ?ш린 議곗젅";
      "스티커를 선택하고 캔버스를 클릭해 붙이거나 이동 / 크기 조절";
  }
}

// ===================
// ?륅툘 洹몃━湲?紐⑤뱶
// ===================
function handleDrawStart(e) {
  canvasState.drawing = true;
  const pos = getPos(e);
  baseCtx.strokeStyle = colorPicker.value;
  baseCtx.lineWidth = brushSize.value;
  baseCtx.lineCap = "round";
  baseCtx.lineJoin = "round";
  baseCtx.beginPath();
  baseCtx.moveTo(pos.x, pos.y);
}

function handleDrawMove(e) {
  if (!canvasState.drawing) return;
  const pos = getPos(e);
  baseCtx.lineTo(pos.x, pos.y);
  baseCtx.stroke();
  renderAll();
}

function handleDrawEnd() {
  if (!canvasState.drawing) return;
  canvasState.drawing = false;
  commitState();
}

// ===================
// 狩??ㅽ떚而?紐⑤뱶
// ===================
function findStickerAt(pos) {
  for (let i = stickerState.stickers.length - 1; i >= 0; i--) {
    const s = stickerState.stickers[i];
    if (
      pos.x >= s.x &&
      pos.x <= s.x + s.w &&
      pos.y >= s.y &&
      pos.y <= s.y + s.h
    ) {
      return i;
    }
  }
  return null;
}

function isOnResizeHandle(pos, sticker) {
  return (
    pos.x >= sticker.x + sticker.w - RESIZE_HANDLE_SIZE &&
    pos.x <= sticker.x + sticker.w &&
    pos.y >= sticker.y + sticker.h - RESIZE_HANDLE_SIZE &&
    pos.y <= sticker.y + sticker.h
  );
}

function createStickerAt(pos) {
  if (!selectedStickerEmoji && !selectedStickerImage) return;

  if (selectedStickerImage) {
    const size = STICKER_SIZE;
    stickerState.stickers.push({
      type: "image",
      x: pos.x - size / 2,
      y: pos.y - size / 2,
      w: size,
      h: size,
      image: selectedStickerImage,
    });
  } else if (selectedStickerEmoji) {
    const size = 40;
    stickerState.stickers.push({
      type: "emoji",
      x: pos.x - size / 2,
      y: pos.y - size / 2,
      w: size,
      h: size,
      emoji: selectedStickerEmoji,
    });
  }
  stickerState.selectedStickerIndex = stickerState.stickers.length - 1;
  commitState();
}

function handleStickerDown(e) {
  const pos = getPos(e);
  const hitIndex = findStickerAt(pos);

  stickerState.draggingSticker = false;
  stickerState.resizingSticker = false;

  if (hitIndex !== null) {
    stickerState.selectedStickerIndex = hitIndex;
    const s = stickerState.stickers[hitIndex];

    if (isOnResizeHandle(pos, s)) {
      stickerState.resizingSticker = true;
    } else {
      stickerState.draggingSticker = true;
      stickerState.dragOffsetX = pos.x - s.x;
      stickerState.dragOffsetY = pos.y - s.y;
    }
    renderAll();
  } else {
    createStickerAt(pos);
  }
}

function handleStickerMove(e) {
  const pos = getPos(e);

  if (stickerState.resizingSticker && stickerState.selectedStickerIndex !== null) {
    const s = stickerState.stickers[stickerState.selectedStickerIndex];
    let newW = pos.x - s.x;
    let newH = pos.y - s.y;

    newW = Math.max(STICKER_MIN_SIZE, newW);
    newH = Math.max(STICKER_MIN_SIZE, newH);

    s.w = newW;
    s.h = newH;
    renderAll();
    return;
  }

  if (!stickerState.draggingSticker || stickerState.selectedStickerIndex === null) return;
  const s = stickerState.stickers[stickerState.selectedStickerIndex];
  s.x = pos.x - stickerState.dragOffsetX;
  s.y = pos.y - stickerState.dragOffsetY;
  renderAll();
}

function handleStickerEnd() {
  if (stickerState.draggingSticker || stickerState.resizingSticker) {
    stickerState.draggingSticker = false;
    stickerState.resizingSticker = false;
    commitState();
  }
}

// ?대え吏 ?ㅽ떚而??좏깮
stickerEmojiButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const stickerKey = btn.dataset.sticker;
    if (stickerKey && builtInStickerImages[stickerKey]) {
      const stickerImage = builtInStickerImages[stickerKey];
      if (!stickerImage.complete) {
        alert("?ㅽ떚而??대?吏瑜?遺덈윭?ㅻ뒗 以묒엯?덈떎. ?좎떆 ???ㅼ떆 ?쒕룄??二쇱꽭??");
        alert("스티커 이미지를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      selectedStickerImage = stickerImage;
      selectedStickerEmoji = null;
      setMode("sticker");
      alert("諛쒕컮???ㅽ떚而ㅺ? ?좏깮?섏뿀?듬땲?? 罹붾쾭?ㅻ? ?대┃?섎㈃ 遺숈씪 ???덉뼱??");
      alert("발바닥 스티커가 선택되었습니다. 캔버스를 클릭하면 붙일 수 있어요.");
      return;
    }
    const emoji = btn.getAttribute("data-emoji");
    if (!emoji) return;
    selectedStickerEmoji = emoji;
    selectedStickerImage = null;
    setMode("sticker");
    alert(`?ㅽ떚而?"${emoji}" ?좏깮?? 罹붾쾭?ㅻ? ?대┃?섎㈃ 遺숈씪 ???덉뼱??`);
    alert(`스티커 "${emoji}" 선택됨. 캔버스를 클릭하면 붙일 수 있어요.`);
  });
});

// PNG ?낅줈???ㅽ떚而?
uploadStickerBtn.addEventListener("click", () => {
  stickerUpload.click();
});

stickerUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("?대?吏 ?뚯씪留??좏깮??二쇱꽭??");
    alert("이미지 파일만 선택해 주세요.");
    return;
  }
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      selectedStickerImage = img;
      selectedStickerEmoji = null;
      setMode("sticker");
      alert("PNG ?ㅽ떚而ㅺ? ?좏깮?섏뿀?듬땲?? 罹붾쾭?ㅻ? ?대┃?섎㈃ 遺숈씪 ???덉뼱??");
      alert("PNG 스티커가 선택되었습니다. 캔버스를 클릭하면 붙일 수 있어요.");
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// ?ㅽ떚而???젣
deleteStickerBtn.addEventListener("click", () => {
  if (stickerState.selectedStickerIndex === null) {
    alert("??젣???ㅽ떚而ㅻ? 癒쇱? ?좏깮??二쇱꽭??");
    alert("삭제할 스티커를 먼저 선택해 주세요.");
    return;
  }
  stickerState.stickers.splice(stickerState.selectedStickerIndex, 1);
  stickerState.selectedStickerIndex = null;
  commitState();
});

// PNG ?쒕옒洹??쒕∼ ???ㅽ떚而?
canvas.addEventListener("dragover", (e) => {
  e.preventDefault();
});

canvas.addEventListener("drop", (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith("image/")) return;

  const pos = getPos(e);
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const size = STICKER_SIZE;
      stickerState.stickers.push({
        type: "image",
        x: pos.x - size / 2,
        y: pos.y - size / 2,
        w: size,
        h: size,
        image: img,
      });
      stickerState.selectedStickerIndex = stickerState.stickers.length - 1;
      commitState();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// ===================
// 罹붾쾭???대깽??
// ===================
function handleMouseDown(e) {
  if (canvasState.mode === "draw") {
    e.preventDefault();
    handleDrawStart(e);
  } else if (canvasState.mode === "sticker") {
    e.preventDefault();
    handleStickerDown(e);
  }
}

function handleMouseMove(e) {
  if (canvasState.mode === "draw") {
    e.preventDefault();
    handleDrawMove(e);
  } else if (canvasState.mode === "sticker") {
    e.preventDefault();
    handleStickerMove(e);
  }
}

function handleMouseUp(e) {
  if (canvasState.mode === "draw") {
    handleDrawEnd(e);
  } else if (canvasState.mode === "sticker") {
    handleStickerEnd(e);
  }
}

canvas.addEventListener("mousedown", handleMouseDown);
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("mouseup", handleMouseUp);
canvas.addEventListener("mouseleave", handleMouseUp);

canvas.addEventListener(
  "touchstart",
  (e) => {
    if (canvasState.mode === "draw") {
      handleDrawStart(e);
    } else if (canvasState.mode === "sticker") {
      handleStickerDown(e);
    }
  },
  { passive: false }
);

canvas.addEventListener(
  "touchmove",
  (e) => {
    if (canvasState.mode === "draw") {
      handleDrawMove(e);
    } else if (canvasState.mode === "sticker") {
      handleStickerMove(e);
    }
  },
  { passive: false }
);

canvas.addEventListener(
  "touchend",
  (e) => {
    handleMouseUp(e);
  },
  { passive: false }
);

// ?꾩껜 吏?곌린
clearCanvasBtn.addEventListener("click", () => {
  clearBaseLayer();
  stickerState.stickers = [];
  stickerState.selectedStickerIndex = null;
  commitState();
});

// 紐⑤뱶 踰꾪듉
drawModeBtn.addEventListener("click", () => setMode("draw"));
stickerModeBtn.addEventListener("click", () => setMode("sticker"));

// ===================
// 怨듯넻: ?먮뵒?곗뿉 ?쇨린 濡쒕뵫
// ===================
function loadDiaryToEditor(item) {
  if (!item) return;
  dateInput.value = item.date;
  const emo = normalizeEmotion(item.emotion);
  setPawRating(emo);
  weatherSelect.value = item.weather || "sunny";
  contentInput.value = item.content || "";

  const imgData = item.imageData || null;
  canvasState.currentImageData = imgData;
  stickerState.stickers = [];
  stickerState.selectedStickerIndex = null;

  if (imgData) {
    const img = new Image();
    img.onload = () => {
      baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
      baseCtx.drawImage(img, 0, 0, baseCanvas.width, baseCanvas.height);
      resetHistoryWithCurrent();
      renderAll();
    };
    img.src = imgData;
  } else {
    clearBaseLayer();
    resetHistoryWithCurrent();
    renderAll();
  }

  showView("home");
}

// ===================
// ?뱴 紐⑸줉 ?뚮뜑留?+ 寃??
// ===================
function renderList() {
  const diaries = loadDiaries().sort((a, b) => b.date.localeCompare(a.date));
  const keyword = searchInput.value.trim().toLowerCase();

  listEl.innerHTML = "";

  const filtered = diaries.filter((item) => {
    if (!keyword) return true;
    const d = new Date(item.date);
    const dateText = isNaN(d) ? item.date : d.toLocaleDateString("ko-KR"); // getEmotionLabel(item.emotion, false) is default
    const emoLabel = getEmotionLabel(item.emotion);
    const weatherMeta = getWeatherMeta(item.weather || "sunny");
    const text =
      (item.content || "") +
      " " +
      dateText +
      " " +
      emoLabel +
      " " +
      weatherMeta.label;

    return text.toLowerCase().includes(keyword);
  });

  if (filtered.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "寃??寃곌낵媛 ?놁뼱??";
    empty.textContent = "검색 결과가 없어요.";
    listEl.appendChild(empty);
    return;
  }

  filtered.forEach((item) => {
    const li = document.createElement("li");

    const metaDiv = document.createElement("div");
    metaDiv.className = "meta";

    const btn = document.createElement("button");
    btn.className = "info-btn";
    const d = new Date(item.date);
    const dateText = isNaN(d) ? item.date : d.toLocaleDateString("ko-KR");
    const preview = (item.content || "").slice(0, 20);
    btn.textContent = `${dateText} - ${preview || "?댁슜 ?놁쓬"}`;
    btn.textContent = `${dateText} - ${preview || "내용 없음"}`;

    btn.addEventListener("click", () => {
      loadDiaryToEditor(item);
    });

    const emoLabel = getEmotionLabel(item.emotion, true, 14);
    const badge = document.createElement("span");
    badge.className = `badge paw`;
    badge.innerHTML = emoLabel;

    metaDiv.appendChild(btn);
    metaDiv.appendChild(badge);

    const thumb = document.createElement("div");
    thumb.className = "thumb";
    if (item.imageData) {
      const img = document.createElement("img");
      img.src = item.imageData;
      thumb.appendChild(img);
    } else {
      thumb.textContent = "NO IMG";
    }

    const del = document.createElement("button");
    del.textContent = "??젣";
    del.textContent = "삭제";
    del.className = "delete";
    del.addEventListener("click", () => {
      const all = loadDiaries();
      const idx = all.findIndex((d) => d.date === item.date);
      if (idx >= 0 && confirm("???좎쭨???쇨린瑜???젣?좉퉴??")) {
      if (idx >= 0 && confirm("이 날짜의 일기를 삭제할까요?")) {
        all.splice(idx, 1);
        saveDiaries(all);
        renderList();
        renderCalendar();
        renderPhotoGrid();
      }
    });

    li.appendChild(thumb);
    li.appendChild(metaDiv);
    li.appendChild(del);
    listEl.appendChild(li);
  });
}

function renderPhotoGrid() {
  const diaryGrid = document.getElementById("photoGridDiary");
  const catGrid = document.getElementById("photoGridCat");
  if (!diaryGrid || !catGrid) return;

  const diaries = loadDiaries()
    .filter((item) => item.imageData)
    .sort((a, b) => b.date.localeCompare(a.date));

  diaryGrid.innerHTML = "";
  if (diaries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "small";
    empty.textContent = "아직 저장된 그림이 없어요.";
    diaryGrid.appendChild(empty);
  } else {
    diaries.forEach((item) => {
      const photo = document.createElement("div");
      photo.className = "photo-item";
      const img = document.createElement("img");
      img.src = item.imageData;
      img.alt = `${item.date} diary drawing`;
      photo.appendChild(img);

      const dateLabel = document.createElement("div");
      dateLabel.className = "photo-date";
      const d = new Date(item.date);
      dateLabel.textContent = isNaN(d) ? item.date : d.toLocaleDateString("ko-KR");
      photo.appendChild(dateLabel);

      photo.addEventListener("click", () => loadDiaryToEditor(item));
      diaryGrid.appendChild(photo);
    });
  }

  const cats = loadCatGallery()
    .slice()
    .sort((a, b) => b.id - a.id);

  catGrid.innerHTML = "";
  if (cats.length === 0) {
    const empty = document.createElement("p");
    empty.className = "small";
    empty.textContent = "아직 저장된 고양이가 없어요.";
    catGrid.appendChild(empty);
    return;
  }

  cats.forEach((item) => {
    const photo = document.createElement("div");
    photo.className = "photo-item";
    const img = document.createElement("img");
    img.src = item.imageData;
    img.alt = "Custom cat";
    photo.appendChild(img);

    const dateLabel = document.createElement("div");
    dateLabel.className = "photo-date";
    const d = new Date(item.id);
    dateLabel.textContent = isNaN(d) ? "" : d.toLocaleDateString("ko-KR");
    photo.appendChild(dateLabel);

    catGrid.appendChild(photo);
  });
}

searchInput.addEventListener("input", renderList);

// ===================
// ?뮶 ???/ ???쇨린
// ===================
saveBtn.addEventListener("click", () => {
  const date = dateInput.value || new Date().toISOString().slice(0, 10);
  const content = contentInput.value.trim();
  const emotion = selectedEmotion || 5;
  const weather = weatherSelect.value || "sunny";

  commitState();

  if (!content && !canvasState.currentImageData) {
    alert("?띿뒪?몃굹 洹몃┝ 以??섎굹???낅젰??二쇱꽭??");
    alert("텍스트나 그림 중 하나는 입력해 주세요.");
    return;
  }

  let diaries = loadDiaries();
  const idx = diaries.findIndex((d) => d.date === date);

  const entry = {
    date,
    content,
    emotion,
    weather, // 罹붾쾭?ㅺ? 鍮꾩뼱?덉쑝硫?珥덇린 ?곗깋 ?곹깭) null濡????
    weather, // 캔버스가 비어있으면(초기 흰색 상태) null로 저장
    imageData: isCanvasEmpty() ? null : canvasState.currentImageData,
  };

  if (idx >= 0) {
    diaries[idx] = entry;
  } else {
    diaries.push(entry);
  }

  saveDiaries(diaries);
  renderList();
  renderCalendar();
  renderPhotoGrid();
  alert("??λ릺?덉뒿?덈떎 ??);
  alert("저장되었습니다 🐾");
});

newEntryBtn.addEventListener("click", () => {
  setToday();
  weatherSelect.value = "sunny";
  contentInput.value = "";
  canvasState.currentImageData = null;
  stickerState.stickers = [];
  stickerState.selectedStickerIndex = null;
  clearBaseLayer();
  resetHistoryWithCurrent();
  renderAll();
  setMode("draw");
  setPawRating(5);
});

// ===================
// ?뼹 PNG ?대낫?닿린 (?꾩옱 ?좎쭨 洹몃┝留?
// ===================
exportPngBtn.addEventListener("click", () => {
  renderAllAndSave();
  if (!canvasState.currentImageData) {
    alert("??λ맂 洹몃┝???놁뒿?덈떎.");
    alert("저장된 그림이 없습니다.");
    return;
  }
  const date = dateInput.value || "no-date";
  const a = document.createElement("a");
  a.href = canvasState.currentImageData;
  a.download = `pawnote_${date}.png`;
  a.click();
});

// ===================
// ?뱾 ?띿뒪??/ PDF ?대낫?닿린
// ===================
exportTxtBtn.addEventListener("click", () => {
  const diaries = loadDiaries().sort((a, b) => a.date.localeCompare(b.date));
  if (diaries.length === 0) {
    alert("?대낫???쇨린媛 ?놁뒿?덈떎.");
    alert("내보낼 일기가 없습니다.");
    return;
  }

  let text = "Paw Note 諛깆뾽\n\n";
  let text = "Paw Note 백업\n\n";
  diaries.forEach((item) => {
    const d = new Date(item.date);
    const dateText = isNaN(d) ? item.date : d.toLocaleDateString("ko-KR");
    const emoLabel = getEmotionLabel(item.emotion);
    const weatherMeta = getWeatherMeta(item.weather || "sunny");
    text += `?좎쭨: ${dateText}\n`;
    text += `媛먯젙: ${emoLabel}\n`;
    text += `?좎뵪: ${weatherMeta.label}\n`;
    text += `?댁슜:\n${item.content || ""}\n`;
    text += `洹몃┝: ${item.imageData ? "[?대?吏 ?덉쓬]" : "?놁쓬"}\n`;
    text += `날짜: ${dateText}\n`;
    text += `감정: ${emoLabel}\n`;
    text += `날씨: ${weatherMeta.label}\n`;
    text += `내용:\n${item.content || ""}\n`;
    text += `그림: ${item.imageData ? "[이미지 있음]" : "없음"}\n`;
    text += "------------------------\n\n";
  });

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "paw_note_backup.txt";
  a.click();
  URL.revokeObjectURL(url);
});

exportPdfBtn.addEventListener("click", () => {
  const diaries = loadDiaries().sort((a, b) => a.date.localeCompare(b.date));
  if (diaries.length === 0) {
    alert("?대낫???쇨린媛 ?놁뒿?덈떎.");
    alert("내보낼 일기가 없습니다.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;

  diaries.forEach((item, index) => {
    const d = new Date(item.date);
    const dateText = isNaN(d) ? item.date : d.toLocaleDateString("ko-KR");
    const emoLabel = getEmotionLabel(item.emotion);
    const weatherMeta = getWeatherMeta(item.weather || "sunny");

    doc.setFontSize(12);
    doc.text(`?좎쭨: ${dateText}`, 10, y);
    doc.text(`날짜: ${dateText}`, 10, y);
    y += 6;
    doc.text(`媛먯젙: ${emoLabel}`, 10, y);
    doc.text(`감정: ${emoLabel}`, 10, y);
    y += 6;
    doc.text(`?좎뵪: ${weatherMeta.label}`, 10, y);
    doc.text(`날씨: ${weatherMeta.label}`, 10, y);
    y += 6;

    const content = (item.content || "").split("\n");
    doc.setFontSize(11);
    doc.text("?댁슜:", 10, y);
    doc.text("내용:", 10, y);
    y += 6;
    content.forEach((line) => {
      const splitted = doc.splitTextToSize(line, 180);
      doc.text(splitted, 10, y);
      y += 5 * splitted.length;
      if (y > 270) {
        doc.addPage();
        y = 10;
      }
    });

    if (item.imageData) {
      if (y > 220) {
        doc.addPage();
        y = 10;
      }
      doc.text("洹몃┝:", 10, y);
      doc.text("그림:", 10, y);
      y += 4;
      doc.addImage(item.imageData, "PNG", 10, y, 60, 60);
      y += 66;
    }

    if (index < diaries.length - 1) {
      if (y > 260) {
        doc.addPage();
        y = 10;
      }
      doc.setDrawColor(200);
      doc.line(10, y, 200, y);
      y += 6;
    }
  });

  doc.save("paw_note_backup.pdf");
});

// ===================
// ?뱟 罹섎┛????
// ===================
let calYear, calMonth; // month: 0~11

function initCalendarToday() {
  const today = new Date();
  calYear = today.getFullYear();
  calMonth = today.getMonth();
}

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  const titleEl = document.getElementById("calendarTitle");
  if (!grid || !titleEl) return;

  grid.innerHTML = "";

  const diaries = loadDiaries();
  const diaryDates = new Set(diaries.map((d) => d.date));

  const firstDay = new Date(calYear, calMonth, 1);
  const lastDay = new Date(calYear, calMonth + 1, 0);

  const monthName = `${calYear}??${calMonth + 1}??;
  const monthName = `${calYear}년 ${calMonth + 1}월`;
  titleEl.textContent = monthName;

  const weekDays = ["??, "??, "??, "??, "紐?, "湲?, "??];
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  weekDays.forEach((w) => {
    const cell = document.createElement("div");
    cell.className = "calendar-cell header";
    cell.textContent = w;
    grid.appendChild(cell);
  });

  const startWeekday = firstDay.getDay();
  for (let i = 0; i < startWeekday; i++) {
    const empty = document.createElement("div");
    empty.className = "calendar-cell";
    grid.appendChild(empty);
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(calYear, calMonth, day);
    const cell = document.createElement("div");
    cell.className = "calendar-cell day";
    cell.textContent = day;

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;

    if (diaryDates.has(dateKey)) {
      cell.classList.add("has-diary");
    }
    if (dateKey === todayStr) {
      cell.classList.add("today");
    }

    cell.addEventListener("click", () => {
      const diariesAll = loadDiaries();
      const item = diariesAll.find((d) => d.date === dateKey);
      if (item) {
        loadDiaryToEditor(item);
      } else {
        dateInput.value = dateKey;
        setPawRating(5);
        weatherSelect.value = "sunny";
        contentInput.value = "";
        clearBaseLayer();
        resetHistoryWithCurrent();
        renderAll();
        showView("home");
      }
    });

    grid.appendChild(cell);
  }
}

const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");

if (prevMonthBtn && nextMonthBtn) {
  prevMonthBtn.addEventListener("click", () => {
    calMonth--;
    if (calMonth < 0) {
      calMonth = 11;
      calYear--;
    }
    renderCalendar();
  });

  nextMonthBtn.addEventListener("click", () => {
    calMonth++;
    if (calMonth > 11) {
      calMonth = 0;
      calYear++;
    }
    renderCalendar();
  });
}

// ===================
// MORE ?? 怨좎뼇??而ㅼ뒪?곕쭏?댁쭠
// ===================
const catCanvas = document.getElementById("catPreviewCanvas");
const catCtx = catCanvas ? catCanvas.getContext("2d") : null;
const catParts = {
  bg: null, cushion: null, hat: null, fur: null, eyes: null, accessory: null,
};
const catImageSources = {
  bg: ["bg_cozy_room", "bg_forest_path", "bg_library", "bg_magical_landscape", "bg_night_road", "bg_starry_night", "bg_sunny_lawn"],
  cushion: ["none", "cushion_blue", "cushion_green", "cushion_orange", "cushion_rainbow", "cushion_red", "cushion_yellow"],
  fur: ["fur_tuxedo", "fur_calico", "fur_short_silver", "fur_siamese", "fur_white"],
  eyes: ["eyes_blue", "eyes_amber", "eyes_oddeye"],
  hat: ["none", "hat_navy_knit", "hat_pink_knit", "hat_skyblue_knit"],
  accessory: ["none", "acc_baseball", "acc_boe_tie", "acc_churu", "acc_crown", "acc_green_knit", "acc_hairpin", "acc_mouse_toy", "acc_rabbit_doll", "acc_teddy_bear", "acc_yarnball"],
  accessory: ["none", "acc_baseball", "acc_bow_tie", "acc_churu", "acc_crown", "acc_green_knit", "acc_hairpin", "acc_mouse_toy", "acc_rabbit-doll", "acc_teddy_bear", "acc_yarnball"],
};
const catOptionLabels = {
  bg: { "bg_cozy_room": "?꾨뒔??諛?, "bg_forest_path": "?꿸만", "bg_library": "?꾩꽌愿", "bg_magical_landscape": "留덈쾿 ?띻꼍", "bg_night_road": "?대몢?대갇", "bg_starry_night": "?곗＜", "bg_sunny_lawn": "?뉗궡 媛??怨듭썝" },
  cushion: { "none": "?놁쓬", "cushion_blue": "?뚮옉", "cushion_rainbow": "臾댁?媛?, "cushion_red": "鍮④컯", "cushion_yellow": "?몃옉", "cushion_orange": "二쇳솴", "cushion_green": "珥덈줉" },
  fur: { "fur_tuxedo": "?깆떆??, "fur_calico": "移섏쫰", "fur_short_silver": "?ㅻ쾭", "fur_siamese": "??, "fur_white": "?붿씠?? },
  eyes: { "eyes_blue": "釉붾（", "eyes_amber": "?곕쾭", "eyes_oddeye": "?ㅻ뱶?꾩씠" },
  bg: { "bg_cozy_room": "아늑한 방", "bg_forest_path": "숲길", "bg_library": "도서관", "bg_magical_landscape": "마법 풍경", "bg_night_road": "밤거리", "bg_starry_night": "별밤", "bg_sunny_lawn": "잔디밭" },
  cushion: { "none": "없음", "cushion_blue": "파랑", "cushion_rainbow": "무지개", "cushion_red": "빨강", "cushion_yellow": "노랑", "cushion_orange": "주황", "cushion_green": "초록" },
  fur: { "fur_tuxedo": "턱시도", "fur_calico": "삼색이", "fur_short_silver": "은색", "fur_siamese": "샴", "fur_white": "흰색" },
  eyes: { "eyes_blue": "파란 눈", "eyes_amber": "호박색", "eyes_oddeye": "오드아이" },
  hat: { "none": "None", "hat_navy_knit": "네이비 니트", "hat_pink_knit": "핑크 니트", "hat_skyblue_knit": "하늘 니트" },
  accessory: { "none": "None", "acc_baseball": "야구 모자", "acc_boe_tie": "보타이", "acc_churu": "츄르", "acc_crown": "왕관", "acc_green_knit": "초록 니트", "acc_hairpin": "머리핀", "acc_mouse_toy": "쥐 장난감", "acc_rabbit_doll": "토끼 인형", "acc_teddy_bear": "곰 인형", "acc_yarnball": "실뭉치" },
  accessory: { "none": "None", "acc_baseball": "야구 모자", "acc_bow_tie": "보타이", "acc_churu": "츄르", "acc_crown": "왕관", "acc_green_knit": "초록 니트", "acc_hairpin": "머리핀", "acc_mouse_toy": "쥐 장난감", "acc_rabbit-doll": "토끼 인형", "acc_teddy_bear": "곰 인형", "acc_yarnball": "실뭉치" },
};
const catPartLabels = {
  bg: "諛곌꼍", cushion: "荑좎뀡", fur: "??, eyes: "??, hat: "紐⑥옄", accessory: "?≪꽭?쒕━"
  bg: "배경", cushion: "쿠션", fur: "털", eyes: "눈", hat: "모자", accessory: "액세서리"
};

function isCanvasEmpty() {
    const blankCanvas = document.createElement('canvas');
    blankCanvas.width = canvas.width;
    blankCanvas.height = canvas.height;
    const blankCtx = blankCanvas.getContext('2d');
    blankCtx.fillStyle = "#ffffff";
    blankCtx.fillRect(0, 0, blankCanvas.width, blankCanvas.height);
    return canvas.toDataURL() === blankCanvas.toDataURL();
}
async function loadCatPartImage(part, value) {
  if (value === 'none') {
    catParts[part] = null;
    return;
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      catParts[part] = img;
      resolve();
    };
    img.onerror = reject;
    img.src = `images/cat/${value}.png`;
  });
}

function drawCatOnCanvas() {
  if (!catCtx) return;
  catCtx.clearRect(0, 0, catCanvas.width, catCanvas.height);
  const drawOrder = ["bg", "cushion", "fur", "eyes", "hat", "accessory"];
  drawOrder.forEach(part => {
    if (catParts[part]) {
      catCtx.drawImage(catParts[part], 0, 0, catCanvas.width, catCanvas.height);
    }
  });
}

async function updateCatPreview(profile) {
  const promises = Object.entries(profile).map(([part, value]) =>
    loadCatPartImage(part, value)
  );
  await Promise.all(promises);
  drawCatOnCanvas();
}

function applyCatProfileToUI(profile) {
  document.querySelectorAll(".cat-option-btn").forEach(btn => {
    const part = btn.dataset.part;
    const value = btn.dataset.value;
    btn.classList.toggle("active", profile[part] === value);
  });
}

function initCatCustomizer() {
  if (!catCanvas) return;

  const profile = loadCatProfile();
  const controlsContainer = document.getElementById("catControls");
  
  Object.entries(catImageSources).forEach(([part, values]) => {
    const group = document.createElement('div');
    group.className = 'control-row';
    const label = document.createElement('label');
    label.textContent = catPartLabels[part];
    group.appendChild(label);

    const options = document.createElement('div');
    options.className = 'cat-options';
    values.forEach(value => {
      const btn = document.createElement('button');
      btn.className = 'cat-option-btn';
      if (part === 'cushion' && value !== 'none') {
        btn.classList.add('color-chip');
        const colorValue = value.split('_')[1];
        btn.style.setProperty('--chip-color', colorValue);
      }
      btn.dataset.part = part;
      btn.dataset.value = value;
      btn.addEventListener('click', () => {
        profile[part] = value;
        saveCatProfile(profile);
        updateCatPreview(profile);
        applyCatProfileToUI(profile);
      });
      options.appendChild(btn);

      const labelSpan = document.createElement('span');
      labelSpan.className = 'cat-option-label';
      labelSpan.textContent = catOptionLabels[part][value] || value;
      btn.appendChild(labelSpan);

    });
    group.appendChild(options);
    controlsContainer.appendChild(group);
  });

  applyCatProfileToUI(profile);
  updateCatPreview(profile);

  const saveCatBtn = document.getElementById('saveCatBtn');
  if (saveCatBtn) {
    saveCatBtn.addEventListener('click', () => {
      const imageData = catCanvas.toDataURL('image/png');
      const gallery = loadCatGallery();
      gallery.push({ id: Date.now(), imageData });
      saveCatGallery(gallery);
      alert('??怨좎뼇?닿? 媛ㅻ윭由ъ뿉 ??λ릺?덉뒿?덈떎! ?벜');
      alert('내 고양이가 갤러리에 저장되었습니다! 📷');
      renderPhotoGrid();
    });
  }
}

// ===================
// ?뱤 諛쒕컮??媛먯젙 ?듦퀎 (二쇨컙 / ?붽컙)
// ===================
function computePawStats(period) {
  const diaries = loadDiaries();
  const now = new Date();
  const days = period === "month" ? 30 : 7;
  const from = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  let total = 0;

  diaries.forEach((item) => {
    const d = new Date(item.date);
    if (isNaN(d)) return;
    if (d < from || d > now) return;
    const emo = normalizeEmotion(item.emotion);
    counts[emo] += 1;
    sum += emo;
    total += 1;
  });

  const avg = total > 0 ? sum / total : null;
  return { counts, avg, total, days };
}

function renderPawStats(period) {
  const chart = document.getElementById("statsChart");
  const summary = document.getElementById("statsSummary");
  if (!chart || !summary) return;

  const { counts, avg, total, days } = computePawStats(period);
  chart.innerHTML = "";

  const maxCount = Math.max(...Object.values(counts), 1);

  for (let value = 1; value <= 5; value++) {
    const bar = document.createElement("div");
    bar.className = "stats-bar";
    const fill = document.createElement("div");
    fill.className = "stats-bar-fill";
    const heightPercent = (counts[value] / maxCount) * 100;
    fill.style.height = `${Math.max(4, heightPercent)}%`;

    const valueLabel = document.createElement("div");
    valueLabel.className = "stats-bar-value";
    valueLabel.setAttribute("aria-label", `${value} paws`);
    valueLabel.innerHTML = `<img src="${PAW_FOOT_ICON_SRC}" alt="" class="paw-foot-icon" style="height: 16px;" aria-hidden="true" />`.repeat(value);

    const countLabel = document.createElement("div");
    countLabel.className = "stats-bar-label";
    countLabel.textContent = `${counts[value]}d`;

    bar.appendChild(fill);
    bar.appendChild(valueLabel);
    bar.appendChild(countLabel);
    chart.appendChild(bar);
  }

  if (!total) {
    summary.textContent = `理쒓렐 ${days}???숈븞 ??λ맂 ?쇨린媛 ?놁뼱??`;
    summary.textContent = `최근 ${days}일 동안 저장된 일기가 없어요.`;
  } else {
    const avgRounded = avg.toFixed(1);
    summary.textContent = `理쒓렐 ${days}??湲곗? ?됯퇏 諛쒕컮??湲곕텇? ${avgRounded}媛쒖엯?덈떎. (珥?${total}??湲곕줉)`;
    summary.textContent = `최근 ${days}일 기준 평균 발바닥 기분은 ${avgRounded}개입니다. (총 ${total}개 기록)`;
  }

  document.querySelectorAll(".stats-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.period === period);
  });
}

function initPawStats() {
  const buttons = document.querySelectorAll(".stats-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const period = btn.dataset.period === "month" ? "month" : "week";
      renderPawStats(period);
    });
  });

  renderPawStats("week");
}

// ===================
// MORE: ?곗씠????젣
// ===================
const clearDataBtn = document.getElementById("clearDataBtn");
if (clearDataBtn) {
  clearDataBtn.addEventListener("click", () => {
    if (
      !confirm(
        "Paw Note????λ맂 紐⑤뱺 ?쇨린瑜???젣?좉퉴?? (?섎룎由????놁뒿?덈떎)"
        "Paw Note에 저장된 모든 일기를 삭제할까요? (되돌릴 수 없습니다)"
      )
    )
      return;
    localStorage.removeItem(STORAGE_KEY);
    renderList();
    renderCalendar();
    renderPhotoGrid();
    alert("紐⑤뱺 ?쇨린媛 ??젣?섏뿀?듬땲??");
    alert("모든 일기가 삭제되었습니다.");
  });
}

// ===================
// 珥덇린??
// ===================
window.addEventListener("load", () => {
  initTheme();
  initLock();
  setToday();
  weatherSelect.value = "sunny";
  setMode("draw");
  setPawRating(5);
  renderList();
  renderPhotoGrid();
  initCalendarToday();

  window.addEventListener("resize", () => {
    if (appEl.style.display === "block") {
      resizeAllCanvases();
    }
  });

  initCatCustomizer();
  initPawStats();
});



