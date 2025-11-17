// ===================
// 상수 / 공통 유틸
// ===================
const STORAGE_KEY = "diaries_v2";
const PIN_KEY = "diaryPin";
const THEME_KEY = "diaryTheme";
const CAT_PROFILE_KEY = "pawCatProfile";
const MAX_HISTORY = 50; // Undo/Redo 히스토리 최대 길이
const PAW_FOOT_ICON_SRC = "images/paw-foot.png";
const pawFootStickerImage = new Image();
pawFootStickerImage.src = PAW_FOOT_ICON_SRC;

const defaultCatProfile = {
  pose: "sitting",
  fur: "white",
  eyes: "green",
  accessory: "none",
  scene: "room",
};

function loadDiaries() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveDiaries(diaries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(diaries));
}

// 문자열 감정 → 1~5 젤리 개수
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

// 감정라벨
function getEmotionLabel(count) {
  const c = normalizeEmotion(count);
  const paws = "🐾".repeat(c);
  switch (c) {
    case 1:
      return `${paws} 아주 힘든 날`;
    case 2:
      return `${paws} 조금 다운`;
    case 3:
      return `${paws} 보통`;
    case 4:
      return `${paws} 좋은 날`;
    case 5:
    default:
      return `${paws} 최고 좋은 날`;
  }
}

// 날씨 메타
function getWeatherMeta(value) {
  switch (value) {
    case "sunny":
      return { label: "☀️ 맑음" };
    case "cloudy":
      return { label: "⛅ 흐림" };
    case "rainy":
      return { label: "🌧️ 비" };
    case "snowy":
      return { label: "❄️ 눈" };
    case "stormy":
      return { label: "⛈️ 폭풍" };
    default:
      return { label: "☀️ 맑음" };
  }
}

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

// ===================
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
    alert("PIN을 모두 입력해 주세요.");
    return;
  }
  if (p1 !== p2) {
    alert("PIN이 서로 다릅니다.");
    return;
  }
  localStorage.setItem(PIN_KEY, p1);
  alert("PIN이 설정되었습니다. 이제부터 이 PIN으로 잠금 해제할 수 있습니다.");
  lockStepSetup.style.display = "none";
  lockStepEnter.style.display = "block";
});

unlockBtn.addEventListener("click", () => {
  const pinSaved = localStorage.getItem(PIN_KEY);
  const entered = enterPin.value.trim();
  if (entered === pinSaved) {
    lockScreen.style.display = "none";
    appEl.style.display = "block";

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
    alert("PIN이 올바르지 않습니다.");
  }
});

// PIN 리셋(버튼은 More 탭에 있음)
const resetPinBtn = document.getElementById("resetPinBtn");
if (resetPinBtn) {
  resetPinBtn.addEventListener("click", () => {
    if (!confirm("저장된 PIN을 삭제하고 처음 설정 화면으로 돌아갈까요?")) return;
    localStorage.removeItem(PIN_KEY);
    alert("PIN이 삭제되었습니다. 다음 실행 시 새 PIN을 설정할 수 있습니다.");
  });
}

// ===================
// 🌙 다크 모드
// ===================
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️ 라이트모드";
  } else {
    document.body.classList.remove("dark");
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
// 📓 일기장 요소
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
  "paw-foot": pawFootStickerImage,
};
const stickerUpload = document.getElementById("stickerUpload");
const uploadStickerBtn = document.getElementById("uploadStickerBtn");
const deleteStickerBtn = document.getElementById("deleteStickerBtn");

// 탭 / 캘린더 / 포토
const tabViews = {
  home: document.getElementById("view-home"),
  calendar: document.getElementById("view-calendar"),
  photos: document.getElementById("view-photos"),
  more: document.getElementById("view-more"),
};
const navButtons = document.querySelectorAll(".bottom-nav .nav-btn");

// 감정(발바닥) 상태
let selectedEmotion = 5; // 기본 5개 젤리
const pawItems = document.querySelectorAll(".paw-rating .paw");

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

// 그림 상태
const canvasState = {
  drawing: false,
  mode: "draw", // "draw" | "sticker"
  currentImageData: null,
  history: [],
  historyIndex: -1,
};

// 레이어: 기본 그림용 오프스크린 캔버스
const baseCanvas = document.createElement("canvas");
const baseCtx = baseCanvas.getContext("2d");

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

// 오늘 날짜 기본값
function setToday() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  dateInput.value = `${yyyy}-${mm}-${dd}`;
}

// ===================
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
// 🎨 캔버스 / 레이어
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
// 히스토리(Undo/Redo)
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
    alert("되돌릴 기록이 없어요.");
    return;
  }
  canvasState.historyIndex--;
  restoreFromHistory(canvasState.historyIndex);
});

redoBtn.addEventListener("click", () => {
  if (canvasState.historyIndex >= canvasState.history.length - 1) {
    alert("다시할 기록이 없어요.");
    return;
  }
  canvasState.historyIndex++;
  restoreFromHistory(canvasState.historyIndex);
});

// ===================
// 좌표 / 모드 관리
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
    modeHint.textContent = "손가락/마우스로 자유롭게 그리기";
  } else {
    stickerModeBtn.classList.add("active");
    drawModeBtn.classList.remove("active");
    modeHint.textContent =
      "스티커를 선택하고 캔버스를 클릭해 붙이거나 이동 / 크기 조절";
  }
}

// ===================
// ✏️ 그리기 모드
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
// ⭐ 스티커 모드
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

// 이모지 스티커 선택
stickerEmojiButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const stickerKey = btn.dataset.sticker;
    if (stickerKey && builtInStickerImages[stickerKey]) {
      const stickerImage = builtInStickerImages[stickerKey];
      if (!stickerImage.complete) {
        alert("스티커 이미지를 불러오는 중입니다. 잠시 후 다시 시도해 주세요!");
        return;
      }
      selectedStickerImage = stickerImage;
      selectedStickerEmoji = null;
      setMode("sticker");
      alert("발바닥 스티커가 선택되었습니다. 캔버스를 클릭하면 붙일 수 있어요!");
      return;
    }
    const emoji = btn.getAttribute("data-emoji");
    if (!emoji) return;
    selectedStickerEmoji = emoji;
    selectedStickerImage = null;
    setMode("sticker");
    alert(`스티커 "${emoji}" 선택됨. 캔버스를 클릭하면 붙일 수 있어요!`);
  });
});

// PNG 업로드 스티커
uploadStickerBtn.addEventListener("click", () => {
  stickerUpload.click();
});

stickerUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
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
      alert("PNG 스티커가 선택되었습니다. 캔버스를 클릭하면 붙일 수 있어요!");
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// 스티커 삭제
deleteStickerBtn.addEventListener("click", () => {
  if (stickerState.selectedStickerIndex === null) {
    alert("삭제할 스티커를 먼저 선택해 주세요.");
    return;
  }
  stickerState.stickers.splice(stickerState.selectedStickerIndex, 1);
  stickerState.selectedStickerIndex = null;
  commitState();
});

// PNG 드래그&드롭 → 스티커
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
// 캔버스 이벤트
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

// 전체 지우기
clearCanvasBtn.addEventListener("click", () => {
  clearBaseLayer();
  stickerState.stickers = [];
  stickerState.selectedStickerIndex = null;
  commitState();
});

// 모드 버튼
drawModeBtn.addEventListener("click", () => setMode("draw"));
stickerModeBtn.addEventListener("click", () => setMode("sticker"));

// ===================
// 공통: 에디터에 일기 로딩
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
// 📚 목록 렌더링 + 검색
// ===================
function renderList() {
  const diaries = loadDiaries().sort((a, b) => b.date.localeCompare(a.date));
  const keyword = searchInput.value.trim().toLowerCase();

  listEl.innerHTML = "";

  const filtered = diaries.filter((item) => {
    if (!keyword) return true;
    const d = new Date(item.date);
    const dateText = isNaN(d) ? item.date : d.toLocaleDateString("ko-KR");
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
    btn.textContent = `${dateText} - ${preview || "내용 없음"}`;

    btn.addEventListener("click", () => {
      loadDiaryToEditor(item);
    });

    const emoLabel = getEmotionLabel(item.emotion);
    const badge = document.createElement("span");
    badge.className = `badge paw`;
    badge.textContent = emoLabel;

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
    del.textContent = "삭제";
    del.className = "delete";
    del.addEventListener("click", () => {
      const all = loadDiaries();
      const idx = all.findIndex((d) => d.date === item.date);
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

searchInput.addEventListener("input", renderList);

// ===================
// 💾 저장 / 새 일기
// ===================
saveBtn.addEventListener("click", () => {
  const date = dateInput.value || new Date().toISOString().slice(0, 10);
  const content = contentInput.value.trim();
  const emotion = selectedEmotion || 5;
  const weather = weatherSelect.value || "sunny";

  commitState();

  if (!content && !canvasState.currentImageData) {
    alert("텍스트나 그림 중 하나는 입력해 주세요!");
    return;
  }

  let diaries = loadDiaries();
  const idx = diaries.findIndex((d) => d.date === date);

  const entry = {
    date,
    content,
    emotion,
    weather,
    imageData: canvasState.currentImageData || null,
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
  alert("저장되었습니다 ✅");
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
// 🖼 PNG 내보내기 (현재 날짜 그림만)
// ===================
exportPngBtn.addEventListener("click", () => {
  renderAllAndSave();
  if (!canvasState.currentImageData) {
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
// 📤 텍스트 / PDF 내보내기
// ===================
exportTxtBtn.addEventListener("click", () => {
  const diaries = loadDiaries().sort((a, b) => a.date.localeCompare(b.date));
  if (diaries.length === 0) {
    alert("내보낼 일기가 없습니다.");
    return;
  }

  let text = "Paw Note 백업\n\n";
  diaries.forEach((item) => {
    const d = new Date(item.date);
    const dateText = isNaN(d) ? item.date : d.toLocaleDateString("ko-KR");
    const emoLabel = getEmotionLabel(item.emotion);
    const weatherMeta = getWeatherMeta(item.weather || "sunny");
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
    doc.text(`날짜: ${dateText}`, 10, y);
    y += 6;
    doc.text(`감정: ${emoLabel}`, 10, y);
    y += 6;
    doc.text(`날씨: ${weatherMeta.label}`, 10, y);
    y += 6;

    const content = (item.content || "").split("\n");
    doc.setFontSize(11);
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
// 📅 캘린더 탭
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

  const monthName = `${calYear}년 ${calMonth + 1}월`;
  titleEl.textContent = monthName;

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
// 📷 Photos 탭
// ===================
function renderPhotoGrid() {
  const grid = document.getElementById("photoGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const diaries = loadDiaries()
    .filter((d) => d.imageData)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (diaries.length === 0) {
    const p = document.createElement("p");
    p.className = "small";
    p.textContent = "그림 또는 사진이 있는 일기가 아직 없어요.";
    grid.appendChild(p);
    return;
  }

  diaries.forEach((item) => {
    const wrap = document.createElement("div");
    wrap.className = "photo-item";

    const img = document.createElement("img");
    img.src = item.imageData;

    const d = new Date(item.date);
    const dateText = isNaN(d) ? item.date : d.toLocaleDateString("ko-KR");

    const label = document.createElement("div");
    label.className = "photo-date";
    label.textContent = dateText;

    wrap.appendChild(img);
    wrap.appendChild(label);

    wrap.addEventListener("click", () => {
      loadDiaryToEditor(item);
    });

    grid.appendChild(wrap);
  });
}

// ===================
// MORE 탭: 고양이 커스터마이징
// ===================
function applyCatProfileToUI(profile) {
  // 옵션 버튼 active 처리
  document.querySelectorAll(".option-chip").forEach((chip) => {
    const group = chip.dataset.group;
    const value = chip.dataset.value;
    chip.classList.toggle("active", profile[group] === value);
  });

  // 프리뷰
  const preview = document.getElementById("catPreview");
  const previewImg = document.getElementById("catPreviewImage");
  const previewText = document.getElementById("catPreviewText");
  if (!preview || !previewImg || !previewText) return;

  const poseEmojiMap = {
    sitting: "😺",
    standing: "🐈",
    sleeping: "😴",
  };

  const poseLabelMap = {
    sitting: "Sitting",
    standing: "Standing",
    sleeping: "Sleeping",
  };
  const furLabelMap = {
    white: "White",
    orange: "Orange Tabby",
    grey: "Grey Tabby",
    calico: "Calico",
    black: "Black",
    siamese: "Siamese",
  };
  const eyeLabelMap = {
    green: "Green",
    blue: "Blue",
    amber: "Amber",
    odd: "Odd-Eyed",
  };
  const accLabelMap = {
    none: "No Accessory",
    hat: "Hat",
    scarf: "Scarf",
    glasses: "Glasses",
    ribbon: "Ribbon",
    outfit: "Outfit",
  };
  const sceneLabelMap = {
    room: "Cozy Room",
    garden: "Garden",
    cafe: "Cafe",
    forest: "Forest",
    beach: "Beach",
    night: "Starry Night",
  };

  const pose = poseLabelMap[profile.pose] || poseLabelMap.sitting;
  const fur = furLabelMap[profile.fur] || furLabelMap.white;
  const eyes = eyeLabelMap[profile.eyes] || eyeLabelMap.green;
  const acc = accLabelMap[profile.accessory] || accLabelMap.none;
  const scene = sceneLabelMap[profile.scene] || sceneLabelMap.room;

  previewImg.textContent = poseEmojiMap[profile.pose] || poseEmojiMap.sitting;
  previewText.textContent = `${pose} · ${fur} · ${eyes} eyes · ${acc} · ${scene}`;

  preview.className = `cat-preview scene-${profile.scene}`;
}

function initCatCustomizer() {
  const profile = loadCatProfile();
  applyCatProfileToUI(profile);

  document.querySelectorAll(".option-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const group = chip.dataset.group;
      const value = chip.dataset.value;
      profile[group] = value;
      saveCatProfile(profile);
      applyCatProfileToUI(profile);
    });
  });
}

// ===================
// 📊 발바닥 감정 통계 (주간 / 월간)
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
    for (let i = 0; i < value; i++) {
      const pawImg = document.createElement("img");
      pawImg.src = PAW_FOOT_ICON_SRC;
      pawImg.alt = "";
      pawImg.className = "paw-foot-icon";
      pawImg.setAttribute("aria-hidden", "true");
      valueLabel.appendChild(pawImg);
    }

    const countLabel = document.createElement("div");
    countLabel.className = "stats-bar-label";
    countLabel.textContent = `${counts[value]}d`;

    bar.appendChild(fill);
    bar.appendChild(valueLabel);
    bar.appendChild(countLabel);
    chart.appendChild(bar);
  }

  if (!total) {
    summary.textContent = `최근 ${days}일 동안 저장된 일기가 없어요.`;
  } else {
    const avgRounded = avg.toFixed(1);
    summary.textContent = `최근 ${days}일 기준 평균 발바닥 기분은 ${avgRounded}개입니다. (총 ${total}일 기록)`;
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
// MORE: 데이터 삭제
// ===================
const clearDataBtn = document.getElementById("clearDataBtn");
if (clearDataBtn) {
  clearDataBtn.addEventListener("click", () => {
    if (
      !confirm(
        "Paw Note에 저장된 모든 일기를 삭제할까요? (되돌릴 수 없습니다)"
      )
    )
      return;
    localStorage.removeItem(STORAGE_KEY);
    renderList();
    renderCalendar();
    renderPhotoGrid();
    alert("모든 일기가 삭제되었습니다.");
  });
}

// ===================
// 초기화
// ===================
window.addEventListener("load", () => {
  initTheme();
  initLock();
  setToday();
  weatherSelect.value = "sunny";
  setMode("draw");
  setPawRating(5);
  renderList();
  initCalendarToday();

  window.addEventListener("resize", () => {
    if (appEl.style.display === "block") {
      resizeAllCanvases();
    }
  });

  initCatCustomizer();
  initPawStats();
});
