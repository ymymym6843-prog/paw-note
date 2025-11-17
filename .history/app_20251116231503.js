// ===================
// 상수 / 공통 설정
// ===================
const STORAGE_KEY = "diaries_v2";
const PIN_KEY = "diaryPin";
const THEME_KEY = "diaryTheme";
const CAT_PROFILE_KEY = "pawCatProfile";
const MAX_HISTORY = 50; // Undo/Redo 버퍼 최대 길이
const PAW_FOOT_ICON_SRC = "paw-foot.png";
const pawFootStickerImage = new Image();
pawFootStickerImage.src = PAW_FOOT_ICON_SRC;

const defaultCatProfile = {
  background: "bg_cozy_room",
  cushion: "cushion_blue",
  fur: "fur_tuxedo",
  eyes: "eyes_blue",
  accessory: "acc_baseball",
};

let entries = [];
let currentEditingId = null;

// 그림일기 상태
let canvas, ctx;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let usingEraser = false;

// Undo / Redo
let historyStack = [];
let redoStack = [];

// 스티커 상태
const stickerState = {
  stickers: [],
  activeStickerIndex: null,
  dragging: false,
  dragOffsetX: 0,
  dragOffsetY: 0,
  resizing: false,
  rotating: false,
};

// ===================
// 유틸리티 함수
// ===================
function $(selector) {
  return document.querySelector(selector);
}

function formatDateToInput(dateObj) {
  const year = dateObj.getFullYear();
  const month = `${dateObj.getMonth() + 1}`.padStart(2, "0");
  const date = `${dateObj.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${date}`;
}

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

// 로컬스토리지에 저장 / 로드
function loadEntries() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.error("Failed to parse diaries:", e);
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ===================
// PIN 잠금 화면 관련
// ===================
function initLockScreen() {
  const lockScreen = $("#lockScreen");
  const appEl = $("#app");

  const pinSetup = $("#pinSetup");
  const pinEnter = $("#pinEnter");
  const newPinInput = $("#newPin");
  const savePinBtn = $("#savePinBtn");
  const enterPinInput = $("#enterPin");
  const enterPinBtn = $("#enterPinBtn");

  const savedPin = localStorage.getItem(PIN_KEY);

  if (!savedPin) {
    pinSetup.classList.remove("hidden");
    pinEnter.classList.add("hidden");
  } else {
    pinSetup.classList.add("hidden");
    pinEnter.classList.remove("hidden");
  }

  savePinBtn?.addEventListener("click", () => {
    const val = newPinInput.value.trim();
    if (val.length !== 4 || !/^\d+$/.test(val)) {
      alert("PIN은 숫자 4자리로 설정해 주세요.");
      return;
    }
    localStorage.setItem(PIN_KEY, val);
    alert("PIN이 저장되었습니다. 이제 로그인을 해주세요.");
    pinSetup.classList.add("hidden");
    pinEnter.classList.remove("hidden");
  });

  enterPinBtn?.addEventListener("click", () => {
    const entered = enterPinInput.value.trim();
    const saved = localStorage.getItem(PIN_KEY);
    if (!saved) {
      alert("먼저 PIN을 설정해 주세요.");
      return;
    }
    if (entered === saved) {
      lockScreen.style.display = "none";
      appEl.style.display = "block";
      setTimeout(() => {
        resizeAllCanvases();
        clearBaseLayer();
        stickerState.stickers = [];
        stickerState.activeStickerIndex = null;
        drawCanvas();
      }, 50);
    } else {
      alert("PIN이 올바르지 않습니다.");
    }
  });
}

// ===================
// 테마(다크모드) 토글
// ===================
function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
    const btn = $("#themeToggle");
    if (btn) btn.textContent = "☀️ 라이트모드";
  } else {
    document.body.classList.remove("dark");
    const btn = $("#themeToggle");
    if (btn) btn.textContent = "🌙 다크모드";
  }
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(saved);

  const btn = $("#themeToggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const current = document.body.classList.contains("dark") ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });
}

// ===================
// 일기 CRUD / 렌더링
// ===================
function renderDiaryList() {
  const listEl = $("#diaryList");
  if (!listEl) return;

  const searchValue = $("#searchInput")?.value.trim().toLowerCase() || "";
  const filterDate = $("#filterDate")?.value || "";
  const filterWeather = $("#filterWeather")?.value || "";
  const selectedPaws = getSelectedFilterPaws();

  let filtered = [...entries].sort((a, b) => {
    const ad = new Date(a.date);
    const bd = new Date(b.date);
    return bd - ad;
  });

  if (searchValue) {
    filtered = filtered.filter((item) => {
      return (
        (item.title || "").toLowerCase().includes(searchValue) ||
        (item.content || "").toLowerCase().includes(searchValue)
      );
    });
  }

  if (filterDate) {
    filtered = filtered.filter((item) => item.date === filterDate);
  }

  if (filterWeather) {
    filtered = filtered.filter((item) => (item.weather || "") === filterWeather);
  }

  if (selectedPaws.length > 0) {
    filtered = filtered.filter((item) =>
      selectedPaws.includes(String(item.emotion || ""))
    );
  }

  listEl.innerHTML = "";

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.textContent = "아직 등록된 일기가 없어요.";
    empty.className = "diary-empty";
    listEl.appendChild(empty);
    return;
  }

  filtered.forEach((entry) => {
    const itemEl = document.createElement("div");
    itemEl.className = "diary-item";

    const meta = document.createElement("div");
    meta.className = "diary-meta";

    const title = document.createElement("div");
    title.className = "diary-title";
    title.textContent = entry.title || "(제목 없음)";

    const sub = document.createElement("div");
    sub.className = "diary-sub";
    const dateStr = entry.date || "";
    const weatherIcon = getWeatherIcon(entry.weather);
    const emotionPaws = "🐾".repeat(entry.emotion || 0);
    sub.textContent = `${dateStr} • ${weatherIcon} • ${emotionPaws || "no paw"}`;

    meta.appendChild(title);
    meta.appendChild(sub);

    const right = document.createElement("div");
    right.className = "diary-right";

    const editBtn = document.createElement("button");
    editBtn.textContent = "편집";
    editBtn.className = "outline small-btn";
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      loadEntryToEditor(entry.id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "삭제";
    deleteBtn.className = "outline small-btn";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm("이 일기를 삭제할까요?")) {
        deleteEntry(entry.id);
      }
    });

    right.appendChild(editBtn);
    right.appendChild(deleteBtn);

    itemEl.appendChild(meta);
    itemEl.appendChild(right);
    listEl.appendChild(itemEl);
  });
}

function getWeatherIcon(weather) {
  switch (weather) {
    case "sunny":
      return "☀️";
    case "cloudy":
      return "☁️";
    case "rain":
      return "🌧";
    case "snow":
      return "❄️";
    default:
      return "☁️";
  }
}

function saveCurrentEntry() {
  const dateEl = $("#entryDate");
  const weatherEl = $("#entryWeather");
  const titleEl = $("#entryTitle");
  const contentEl = $("#entryContent");
  const emotion = getCurrentEntryEmotion();

  const dateVal = dateEl?.value || formatDateToInput(new Date());
  const weatherVal = weatherEl?.value || "";
  const titleVal = titleEl?.value.trim() || "";
  const contentVal = contentEl?.value.trim() || "";

  const record = entries.find((e) => e.id === currentEditingId);
  if (record) {
    record.date = dateVal;
    record.weather = weatherVal;
    record.title = titleVal;
    record.content = contentVal;
    record.emotion = emotion;
  } else {
    const newId = Date.now().toString();
    const newEntry = {
      id: newId,
      date: dateVal,
      weather: weatherVal,
      title: titleVal,
      content: contentVal,
      emotion,
    };
    entries.push(newEntry);
    currentEditingId = newId;
  }

  saveEntries();
  renderDiaryList();
  renderCalendar();
  alert("일기가 저장되었습니다.");
}

function deleteEntry(id) {
  entries = entries.filter((e) => e.id !== id);
  saveEntries();
  renderDiaryList();
  renderCalendar();
}

function loadEntryToEditor(id) {
  const entry = entries.find((e) => e.id === id);
  if (!entry) return;

  $("#entryDate").value = entry.date || formatDateToInput(new Date());
  $("#entryWeather").value = entry.weather || "";
  $("#entryTitle").value = entry.title || "";
  $("#entryContent").value = entry.content || "";

  currentEditingId = id;

  const pawRatingEl = $("#entryPawRating");
  if (pawRatingEl) {
    pawRatingEl.querySelectorAll(".paw").forEach((btn) => {
      const v = Number(btn.dataset.value || "0");
      btn.classList.toggle("selected", v <= (entry.emotion || 0));
    });
  }
}

function getCurrentEntryEmotion() {
  const pawRatingEl = $("#entryPawRating");
  if (!pawRatingEl) return 0;
  let max = 0;
  pawRatingEl.querySelectorAll(".paw").forEach((btn) => {
    if (btn.classList.contains("selected")) {
      const val = Number(btn.dataset.value || "0");
      if (!isNaN(val) && val > max) max = val;
    }
  });
  return max;
}

// ===================
// 필터 바 - 감정 발바닥
// ===================
function initFilterPaws() {
  const container = $("#pawRating");
  if (!container) return;
  container.querySelectorAll(".paw").forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = Number(btn.dataset.value || "0");
      const already = btn.classList.contains("selected");
      container.querySelectorAll(".paw").forEach((b) => {
        const v = Number(b.dataset.value || "0");
        if (already && v >= val) {
          b.classList.remove("selected");
        } else if (v <= val) {
          b.classList.add("selected");
        } else {
          b.classList.remove("selected");
        }
      });
      renderDiaryList();
      renderPawStats(getCurrentStatsPeriod());
    });
  });
}

function getSelectedFilterPaws() {
  const container = $("#pawRating");
  if (!container) return [];
  const selected = [];
  container.querySelectorAll(".paw").forEach((btn) => {
    if (btn.classList.contains("selected")) {
      selected.push(btn.dataset.value || "");
    }
  });
  return selected;
}

// ===================
// 탭 전환
// ===================
function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const tabName = btn.dataset.tab;
      document.querySelectorAll(".tab-view").forEach((view) => {
        view.classList.remove("active");
      });
      const target = document.getElementById(`view-${tabName}`);
      if (target) target.classList.add("active");

      if (tabName === "home") {
        resizeAllCanvases();
      }
    });
  });
}

// ===================
// 검색 / 필터
// ===================
function initFilters() {
  $("#searchInput")?.addEventListener("input", () => {
    renderDiaryList();
  });
  $("#filterDate")?.addEventListener("change", () => {
    renderDiaryList();
  });
  $("#filterWeather")?.addEventListener("change", () => {
    renderDiaryList();
  });
}

// ===================
// 모드 토글(텍스트 / 그림)
// ===================
function initModeToggle() {
  const textBtn = $("#textModeBtn");
  const drawBtn = $("#drawModeBtn");
  const textEditor = $("#textEditor");
  const drawEditor = $("#drawEditor");

  if (!textBtn || !drawBtn || !textEditor || !drawEditor) return;

  textBtn.addEventListener("click", () => {
    textBtn.classList.add("active");
    drawBtn.classList.remove("active");
    textEditor.classList.remove("hidden");
    drawEditor.classList.add("hidden");
  });

  drawBtn.addEventListener("click", () => {
    textBtn.classList.remove("active");
    drawBtn.classList.add("active");
    textEditor.classList.add("hidden");
    drawEditor.classList.remove("hidden");
    resizeAllCanvases();
    clearBaseLayer();
    stickerState.stickers = [];
    stickerState.activeStickerIndex = null;
    drawCanvas();
  });
}

// ===================
// 그림 일기 (Canvas)
// ===================
function initCanvas() {
  canvas = document.getElementById("drawCanvas");
  if (!canvas) return;
  ctx = canvas.getContext("2d");
  resizeAllCanvases();
  initCanvasEvents();
  clearCanvasHistory();
  saveCanvasState();
}

function resizeAllCanvases() {
  if (!canvas) return;
  const wrapper = canvas.parentElement;
  if (!wrapper) return;
  const rect = wrapper.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = rect.width * dpr;
  canvas.height = 280 * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `280px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  redrawCanvasFromHistory();
}

function clearBaseLayer() {
  if (!ctx || !canvas) return;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function initCanvasEvents() {
  if (!canvas) return;

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  function startDraw(e) {
    const pos = getPos(e);
    if (hitTestStickerHandles(pos.x, pos.y)) {
      e.preventDefault();
      return;
    }

    const idx = hitTestSticker(pos.x, pos.y);
    if (idx >= 0 && !usingEraser) {
      stickerState.activeStickerIndex = idx;
      stickerState.dragging = true;
      const st = stickerState.stickers[idx];
      stickerState.dragOffsetX = pos.x - st.x;
      stickerState.dragOffsetY = pos.y - st.y;
      drawCanvas();
      e.preventDefault();
      return;
    }

    isDrawing = true;
    usingEraser = $("#eraserBtn")?.classList.contains("active") || false;
    [lastX, lastY] = [pos.x, pos.y];
  }

  function moveDraw(e) {
    if (!isDrawing && !stickerState.dragging && !stickerState.resizing && !stickerState.rotating)
      return;
    const pos = getPos(e);

    if (stickerState.dragging && stickerState.activeStickerIndex != null) {
      const st = stickerState.stickers[stickerState.activeStickerIndex];
      st.x = pos.x - stickerState.dragOffsetX;
      st.y = pos.y - stickerState.dragOffsetY;
      drawCanvas();
      e.preventDefault();
      return;
    }

    drawLine(pos.x, pos.y);
    [lastX, lastY] = [pos.x, pos.y];
  }

  function endDraw() {
    if (isDrawing || stickerState.dragging || stickerState.resizing || stickerState.rotating) {
      isDrawing = false;
      stickerState.dragging = false;
      stickerState.resizing = false;
      stickerState.rotating = false;
      saveCanvasState();
    }
  }

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", moveDraw);
  canvas.addEventListener("mouseup", endDraw);
  canvas.addEventListener("mouseleave", endDraw);

  canvas.addEventListener("touchstart", (e) => {
    startDraw(e);
  });
  canvas.addEventListener("touchmove", (e) => {
    moveDraw(e);
  });
  canvas.addEventListener("touchend", endDraw);
}

function drawLine(x, y) {
  if (!ctx || !canvas || !isDrawing) return;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const colorInput = document.getElementById("penColor");
  const sizeInput = document.getElementById("penSize");

  const color = colorInput?.value || "#333333";
  const size = Number(sizeInput?.value || 4);

  if (usingEraser) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color;
  }
  ctx.lineWidth = size;

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();
}

// 캔버스 히스토리 (Undo/Redo)
function clearCanvasHistory() {
  historyStack = [];
  redoStack = [];
}

function saveCanvasState() {
  if (!canvas) return;
  try {
    const dataURL = canvas.toDataURL();
    historyStack.push(dataURL);
    if (historyStack.length > MAX_HISTORY) {
      historyStack.shift();
    }
    redoStack = [];
  } catch (e) {
    console.error("canvas.toDataURL failed", e);
  }
}

function redrawCanvasFromHistory() {
  if (!canvas || !ctx || historyStack.length === 0) {
    clearBaseLayer();
    drawStickers();
    return;
  }
  const latest = historyStack[historyStack.length - 1];
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    drawStickers();
  };
  img.src = latest;
}

function drawCanvas() {
  redrawCanvasFromHistory();
  drawStickerHandles();
}

function undoCanvas() {
  if (historyStack.length > 1) {
    const last = historyStack.pop();
    redoStack.push(last);
    redrawCanvasFromHistory();
  }
}

function redoCanvas() {
  if (redoStack.length > 0) {
    const restore = redoStack.pop();
    historyStack.push(restore);
    redrawCanvasFromHistory();
  }
}

// 스티커 기능
function addStickerToCanvasFromFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const st = {
        x: canvas.width / (2 * (window.devicePixelRatio || 1)),
        y: canvas.height / (2 * (window.devicePixelRatio || 1)),
        scale: 0.5,
        rotation: 0,
        img,
      };
      stickerState.stickers.push(st);
      stickerState.activeStickerIndex = stickerState.stickers.length - 1;
      drawCanvas();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function drawStickers() {
  if (!ctx || !canvas) return;
  const dpr = window.devicePixelRatio || 1;

  stickerState.stickers.forEach((st) => {
    const { x, y, scale, rotation, img } = st;
    const w = img.width * scale;
    const h = img.height * scale;

    const cx = x * dpr;
    const cy = y * dpr;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  });
}

function drawStickerHandles() {
  if (!ctx || !canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const idx = stickerState.activeStickerIndex;
  if (idx == null || idx < 0 || idx >= stickerState.stickers.length) return;

  const st = stickerState.stickers[idx];
  const { x, y, scale, rotation, img } = st;
  const w = img.width * scale;
  const h = img.height * scale;

  const cx = x * dpr;
  const cy = y * dpr;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotation * Math.PI) / 180);

  ctx.strokeStyle = "#ff7faa";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 2]);
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.setLineDash([]);

  const handleSize = 10;
  ctx.fillStyle = "#ff7faa";
  ctx.fillRect(-w / 2 - handleSize / 2, -h / 2 - handleSize / 2, handleSize, handleSize);
  ctx.fillRect(w / 2 - handleSize / 2, h / 2 - handleSize / 2, handleSize, handleSize);

  ctx.restore();
}

function hitTestSticker(x, y) {
  if (!canvas || !ctx) return -1;
  const dpr = window.devicePixelRatio || 1;

  for (let i = stickerState.stickers.length - 1; i >= 0; i--) {
    const st = stickerState.stickers[i];
    const { scale, rotation, img } = st;
    const w = img.width * scale;
    const h = img.height * scale;

    const cx = st.x * dpr;
    const cy = st.y * dpr;

    const dx = x * dpr - cx;
    const dy = y * dpr - cy;
    const rad = (-rotation * Math.PI) / 180;
    const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const ry = dx * Math.sin(rad) + dy * Math.cos(rad);

    if (rx >= -w / 2 && rx <= w / 2 && ry >= -h / 2 && ry <= h / 2) {
      return i;
    }
  }
  return -1;
}

function hitTestStickerHandles(x, y) {
  if (!canvas || !ctx) return false;
  const dpr = window.devicePixelRatio || 1;
  const idx = stickerState.activeStickerIndex;
  if (idx == null || idx < 0 || idx >= stickerState.stickers.length) return false;

  const st = stickerState.stickers[idx];
  const { scale, rotation, img } = st;
  const w = img.width * scale;
  const h = img.height * scale;
  const cx = st.x * dpr;
  const cy = st.y * dpr;

  const dx = x * dpr - cx;
  const dy = y * dpr - cy;
  const rad = (-rotation * Math.PI) / 180;
  const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
  const ry = dx * Math.sin(rad) + dy * Math.cos(rad);

  const handleSize = 10;

  const leftX = -w / 2;
  const leftY = -h / 2;
  if (
    rx >= leftX - handleSize / 2 &&
    rx <= leftX + handleSize / 2 &&
    ry >= leftY - handleSize / 2 &&
    ry <= leftY + handleSize / 2
  ) {
    stickerState.resizing = true;
    return true;
  }

  const rightX = w / 2;
  const rightY = h / 2;
  if (
    rx >= rightX - handleSize / 2 &&
    rx <= rightX + handleSize / 2 &&
    ry >= rightY - handleSize / 2 &&
    ry <= rightY + handleSize / 2
  ) {
    stickerState.rotating = true;
    return true;
  }

  return false;
}

// ===================
// PNG 저장 (그림 일기만)
// ===================
function saveCanvasAsPng() {
  if (!canvas) return;
  const dateVal = $("#entryDate")?.value || formatDateToInput(new Date());
  const link = document.createElement("a");
  link.download = `pawnote_drawing_${dateVal}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// ===================
// 캘린더 렌더링
// ===================
function renderCalendar() {
  const grid = $("#calendarGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  for (let i = 0; i < startWeekday; i++) {
    const cell = document.createElement("div");
    cell.className = "calendar-cell";
    grid.appendChild(cell);
  }

  const datesSet = new Set(entries.map((e) => e.date));

  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement("div");
    cell.className = "calendar-cell";
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cell.textContent = d;
    if (datesSet.has(dateStr)) {
      cell.classList.add("has-entry");
    }
    grid.appendChild(cell);
  }
}

// ===================
// 사진 탭 (단순 예시: 그림일기 스냅)
// ===================
function renderPhotoList() {
  const container = $("#photoList");
  if (!container) return;
  container.innerHTML = "";

  for (let i = 0; i < 6; i++) {
    const item = document.createElement("div");
    item.className = "photo-item";
    const img = document.createElement("img");
    img.src = "paw-foot.png";
    img.alt = "Sample";
    item.appendChild(img);
    container.appendChild(item);
  }
}

// ===================
// 고양이 커스터마이징 (More 탭)
// ===================
function loadCatProfile() {
  const raw = localStorage.getItem(CAT_PROFILE_KEY);
  if (!raw) return { ...defaultCatProfile };
  try {
    const parsed = JSON.parse(raw);
    return { ...defaultCatProfile, ...parsed };
  } catch (e) {
    console.error("Failed to parse cat profile:", e);
    return { ...defaultCatProfile };
  }
}

function saveCatProfile(profile) {
  localStorage.setItem(CAT_PROFILE_KEY, JSON.stringify(profile));
}

function applyCatProfileToUI(profile) {
  // 옵션 버튼 active 상태 반영
  document.querySelectorAll(".option-chip").forEach((chip) => {
    const group = chip.dataset.group;
    const value = chip.dataset.value;
    if (!group) return;
    chip.classList.toggle("active", profile[group] === value);
  });

  const preview = document.getElementById("catPreview");
  const previewImgWrap = document.getElementById("catPreviewImage");
  const previewText = document.getElementById("catPreviewText");
  if (!preview || !previewImgWrap || !previewText) return;

  // 배경 이미지 적용 (카드 전체 배경)
  if (profile.background) {
    preview.style.backgroundImage = `url('cat/${profile.background}.png')`;
  } else {
    preview.style.backgroundImage = "none";
  }

  // 레이어 이미지 요소 준비
  const ensureLayer = (layerName, extraClass) => {
    let img = previewImgWrap.querySelector(`img[data-layer="${layerName}"]`);
    if (!img) {
      img = document.createElement("img");
      img.dataset.layer = layerName;
      img.className = `cat-layer ${extraClass || layerName}`;
      previewImgWrap.appendChild(img);
    }
    return img;
  };

  const cushionImg = ensureLayer("cushion", "cushion");
  const furImg = ensureLayer("fur", "fur");
  const eyesImg = ensureLayer("eyes", "eyes");
  const accImg = ensureLayer("accessory", "accessory");

  if (profile.cushion) {
    cushionImg.src = `cat/${profile.cushion}.png`;
    cushionImg.style.display = "";
  } else {
    cushionImg.style.display = "none";
  }

  if (profile.fur) {
    furImg.src = `cat/${profile.fur}.png`;
    furImg.style.display = "";
  } else {
    furImg.style.display = "none";
  }

  if (profile.eyes) {
    eyesImg.src = `cat/${profile.eyes}.png`;
    eyesImg.style.display = "";
  } else {
    eyesImg.style.display = "none";
  }

  if (profile.accessory && profile.accessory !== "none") {
    accImg.src = `cat/${profile.accessory}.png`;
    accImg.style.display = "";
  } else {
    accImg.style.display = "none";
  }

  const bgLabelMap = {
    bg_cozy_room: "Cozy Room",
    bg_forest_path: "Forest Path",
    bg_library: "Library",
    bg_magical_landscape: "Magical Landscape",
    bg_night_road: "Night Road",
    bg_starry_night: "Starry Night",
    bg_sunny_lawn: "Sunny Lawn",
  };

  const cushionLabelMap = {
    cushion_blue: "Blue Cushion",
    cushion_rainbow: "Rainbow Cushion",
    cushion_red: "Red Cushion",
    cushion_yellow: "Yellow Cushion",
    cushion_orange: "Orange Cushion",
    cushion_green: "Green Cushion",
  };

  const furLabelMap = {
    fur_tuxedo: "Tuxedo Fur",
    fur_calico: "Calico Fur",
    fur_short_silver: "Short Silver Fur",
    fur_siamese: "Siamese Fur",
    fur_white: "White Fur",
  };

  const eyesLabelMap = {
    eyes_blue: "Blue Eyes",
    eyes_amber: "Amber Eyes",
    eyes_oddeye: "Odd-Eye",
  };

  const accLabelMap = {
    acc_baseball: "Baseball",
    acc_yarnball: "Yarn Ball",
    acc_boe_tie: "Bow Tie",
    acc_churu: "Churu",
    acc_crown: "Crown",
    acc_green_knit: "Green Knit",
    acc_hairpin: "Hairpin",
    acc_mouse_toy: "Mouse Toy",
    acc_navy_knit: "Navy Knit",
    acc_pink_knit: "Pink Knit",
    acc_skyblue_knit: "Sky Blue Knit",
    acc_rabbit_doll: "Rabbit Doll",
    acc_teddy_bear: "Teddy Bear",
    none: "No Accessory",
  };

  const bgLabel = bgLabelMap[profile.background] || "Custom Background";
  const cushionLabel = cushionLabelMap[profile.cushion] || "Cushion";
  const furLabel = furLabelMap[profile.fur] || "Fur";
  const eyesLabel = eyesLabelMap[profile.eyes] || "Eyes";
  const accLabel = accLabelMap[profile.accessory] || "Accessory";

  previewText.textContent =
    `${furLabel} · ${eyesLabel} · ${cushionLabel} · ${bgLabel} · ${accLabel}`;
}

function initCatCustomizer() {
  const profile = loadCatProfile();
  applyCatProfileToUI(profile);

  document.querySelectorAll(".option-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const group = chip.dataset.group;
      const value = chip.dataset.value;
      if (!group) return;
      profile[group] = value;
      saveCatProfile(profile);
      applyCatProfileToUI(profile);
    });
  });
}

// ===================
// 발바닥 통계
// ===================
function normalizeEmotion(value) {
  const v = Number(value || 0);
  if (Number.isNaN(v) || v <= 0) return 0;
  if (v >= 5) return 5;
  return v;
}

function computePawStats(period) {
  const now = new Date();
  const days = period === "month" ? 30 : 7;

  const from = new Date(now);
  from.setDate(now.getDate() - (days - 1));

  const counts = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  let sum = 0;
  let total = 0;

  entries.forEach((item) => {
    const d = parseDate(item.date);
    if (!d) return;
    if (d < from || d > now) return;
    const emo = normalizeEmotion(item.emotion);
    counts[emo] += 1;
    sum += emo;
    total += 1;
  });

  const avg = total > 0 ? sum / total : null;
  return { counts, avg, total, days };
}

function getCurrentStatsPeriod() {
  const btn = document.querySelector(".stats-btn.active");
  if (!btn) return "week";
  return btn.dataset.period || "week";
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
    summary.textContent = `최근 ${days}일 동안 기록된 발바닥 감정이 없어요.`;
  } else {
    const avgRounded = avg.toFixed(1);
    summary.textContent = `최근 ${days}일 기준 평균 발바닥 감정은 ${avgRounded} 입니다. (총 ${total}회)`;
  }
}

function initStats() {
  document.querySelectorAll(".stats-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".stats-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderPawStats(btn.dataset.period || "week");
    });
  });
  renderPawStats(getCurrentStatsPeriod());
}

// ===================
// 데이터 관리
// ===================
function initDataManagement() {
  const clearBtn = document.getElementById("clearDataBtn");
  if (!clearBtn) return;
  clearBtn.addEventListener("click", () => {
    if (
      confirm(
        "정말로 모든 일기 데이터를 삭제하시겠어요?\n이 작업은 되돌릴 수 없습니다."
      )
    ) {
      entries = [];
      saveEntries();
      renderDiaryList();
      renderCalendar();
      alert("모든 데이터가 삭제되었습니다.");
    }
  });
}

// ===================
// 초기화
// ===================
window.addEventListener("DOMContentLoaded", () => {
  initLockScreen();
  initTheme();

  entries = loadEntries();

  const todayStr = formatDateToInput(new Date());
  const entryDateEl = document.getElementById("entryDate");
  if (entryDateEl && !entryDateEl.value) {
    entryDateEl.value = todayStr;
  }

  initTabs();
  initFilters();
  initFilterPaws();
  initModeToggle();

  const saveBtn = document.getElementById("saveEntryBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      saveCurrentEntry();
      renderPawStats(getCurrentStatsPeriod());
    });
  }

  const undoBtn = document.getElementById("undoBtn");
  const redoBtn = document.getElementById("redoBtn");
  undoBtn?.addEventListener("click", undoCanvas);
  redoBtn?.addEventListener("click", redoCanvas);

  const eraserBtn = document.getElementById("eraserBtn");
  eraserBtn?.addEventListener("click", () => {
    eraserBtn.classList.toggle("active");
  });

  const saveCanvasPngBtn = document.getElementById("saveCanvasPngBtn");
  saveCanvasPngBtn?.addEventListener("click", saveCanvasAsPng);

  const stickerUpload = document.getElementById("stickerUpload");
  stickerUpload?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) {
      addStickerToCanvasFromFile(file);
      stickerUpload.value = "";
    }
  });

  initCanvas();
  renderDiaryList();
  renderCalendar();
  renderPhotoList();
  initCatCustomizer();
  initStats();
});
