// ===================
// 상수 / 공통 유틸
// ===================
const STORAGE_KEY = "diaries_v2";
const PIN_KEY = "diaryPin";
const THEME_KEY = "diaryTheme";
const MAX_HISTORY = 50; // Undo/Redo 히스토리 최대 길이

function loadDiaries() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveDiaries(diaries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(diaries));
}

// 감정 메타 (대표 이모티콘 5종 + 예전 값 호환)
function getEmotionMeta(value) {
  switch (value) {
    case "happy":
      return { label: "😊 기쁨", cls: "happy" };
    case "sad":
      return { label: "😢 슬픔", cls: "sad" };
    case "angry":
      return { label: "😡 화남", cls: "angry" };
    case "scared":
      return { label: "😱 무서움", cls: "scared" };
    case "calm":
    case "neutral": // 예전 neutral 값 호환
      return { label: "😌 편안", cls: "calm" };
    default:
      return { label: "😐 보통", cls: "calm" };
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

    // 앱이 보이기 시작하는 시점에 캔버스 초기화
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
const emotionSelect = document.getElementById("emotionSelect");
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
const stickerUpload = document.getElementById("stickerUpload");
const uploadStickerBtn = document.getElementById("uploadStickerBtn");
const deleteStickerBtn = document.getElementById("deleteStickerBtn");

// 그림 상태
let drawing = false;
let mode = "draw";              // "draw" | "sticker"
let currentImageData = null;    // 합쳐진 전체 그림

// 레이어: 기본 그림용 오프스크린 캔버스
const baseCanvas = document.createElement("canvas");
const baseCtx = baseCanvas.getContext("2d");

// 스티커 상태
const STICKER_SIZE = 80;
let selectedStickerEmoji = null;   // 새로 찍을 이모지 템플릿
let selectedStickerImage = null;   // 새로 찍을 PNG 템플릿 (Image 객체)
let stickers = [];                 // {type: 'emoji'|'image', x, y, w, h, emoji?, image?}
let selectedStickerIndex = null;   // 현재 선택된 스티커 인덱스
let draggingSticker = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Undo/Redo 히스토리
let history = [];
let historyIndex = -1;

// 오늘 날짜 기본값
function setToday() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  dateInput.value = `${yyyy}-${mm}-${dd}`;
}

// ===================
// 🎨 캔버스 / 레이어
// ===================
function resizeAllCanvases() {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  if (width === 0 || height === 0) return; // 아직 안 보이면 스킵

  canvas.width = width;
  canvas.height = height;

  baseCanvas.width = width;
  baseCanvas.height = height;

  if (currentImageData) {
    const img = new Image();
    img.onload = () => {
      baseCtx.clearRect(0, 0, width, height);
      baseCtx.drawImage(img, 0, 0, width, height);
      renderAll();
    };
    img.src = currentImageData;
  } else {
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

  stickers.forEach((s, idx) => {
    if (s.type === "image" && s.image) {
      ctx.drawImage(s.image, s.x, s.y, s.w, s.h);
    } else if (s.type === "emoji" && s.emoji) {
      const size = s.h;
      ctx.font = `${size}px system-ui, emoji`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(s.emoji, s.x + s.w / 2, s.y + s.h / 2);
    }

    if (idx === selectedStickerIndex) {
      ctx.save();
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.strokeRect(s.x, s.y, s.w, s.h);
      ctx.restore();
    }
  });
}

function renderAllAndSave() {
  renderAll();
  currentImageData = canvas.toDataURL("image/png");
}

// ===================
// 히스토리(Undo/Redo)
// ===================
function resetHistoryWithCurrent() {
  renderAllAndSave();
  history = [currentImageData];
  historyIndex = 0;
}

function commitState() {
  renderAllAndSave();

  // 현재 인덱스 이후 redo 히스토리 제거
  if (historyIndex < history.length - 1) {
    history = history.slice(0, historyIndex + 1);
  }

  history.push(currentImageData);
  historyIndex = history.length - 1;

  // 최대 길이 초과 시 앞부분 잘라내기
  if (history.length > MAX_HISTORY) {
    const overflow = history.length - MAX_HISTORY;
    history.splice(0, overflow);
    historyIndex -= overflow;
  }
}

function restoreFromHistory(index) {
  const imgData = history[index];
  if (!imgData) return;

  currentImageData = imgData;
  stickers = [];
  selectedStickerIndex = null;

  const img = new Image();
  img.onload = () => {
    baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
    baseCtx.drawImage(img, 0, 0, baseCanvas.width, baseCanvas.height);
    renderAll();
  };
  img.src = imgData;
}

undoBtn.addEventListener("click", () => {
  if (historyIndex <= 0) {
    alert("되돌릴 기록이 없어요.");
    return;
  }
  historyIndex--;
  restoreFromHistory(historyIndex);
});

redoBtn.addEventListener("click", () => {
  if (historyIndex >= history.length - 1) {
    alert("다시할 기록이 없어요.");
    return;
  }
  historyIndex++;
  restoreFromHistory(historyIndex);
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
  mode = newMode;
  if (mode === "draw") {
    drawModeBtn.classList.add("active");
    stickerModeBtn.classList.remove("active");
    modeHint.textContent = "손가락/마우스로 자유롭게 그리기";
  } else {
    stickerModeBtn.classList.add("active");
    drawModeBtn.classList.remove("active");
    modeHint.textContent = "스티커를 선택하고 캔버스를 클릭해 붙이거나 이동하기";
  }
}

// ===================
// ✏️ 그리기 모드
// ===================
function handleDrawStart(e) {
  drawing = true;
  const pos = getPos(e);
  baseCtx.strokeStyle = colorPicker.value;
  baseCtx.lineWidth = brushSize.value;
  baseCtx.lineCap = "round";
  baseCtx.lineJoin = "round";
  baseCtx.beginPath();
  baseCtx.moveTo(pos.x, pos.y);
}

function handleDrawMove(e) {
  if (!drawing) return;
  const pos = getPos(e);
  baseCtx.lineTo(pos.x, pos.y);
  baseCtx.stroke();
  renderAll();
}

function handleDrawEnd() {
  if (!drawing) return;
  drawing = false;
  commitState();
}

// ===================
// ⭐ 스티커 모드
// ===================
function findStickerAt(pos) {
  for (let i = stickers.length - 1; i >= 0; i--) {
    const s = stickers[i];
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

function createStickerAt(pos) {
  if (!selectedStickerEmoji && !selectedStickerImage) return;

  if (selectedStickerImage) {
    const size = STICKER_SIZE;
    stickers.push({
      type: "image",
      x: pos.x - size / 2,
      y: pos.y - size / 2,
      w: size,
      h: size,
      image: selectedStickerImage,
    });
  } else if (selectedStickerEmoji) {
    const size = 40;
    stickers.push({
      type: "emoji",
      x: pos.x - size / 2,
      y: pos.y - size / 2,
      w: size,
      h: size,
      emoji: selectedStickerEmoji,
    });
  }
  selectedStickerIndex = stickers.length - 1;
  commitState();
}

function handleStickerDown(e) {
  const pos = getPos(e);
  const hitIndex = findStickerAt(pos);

  if (hitIndex !== null) {
    selectedStickerIndex = hitIndex;
    const s = stickers[hitIndex];
    draggingSticker = true;
    dragOffsetX = pos.x - s.x;
    dragOffsetY = pos.y - s.y;
    renderAll();
  } else {
    createStickerAt(pos);
  }
}

function handleStickerMove(e) {
  if (!draggingSticker || selectedStickerIndex === null) return;
  const pos = getPos(e);
  const s = stickers[selectedStickerIndex];
  s.x = pos.x - dragOffsetX;
  s.y = pos.y - dragOffsetY;
  renderAll();
}

function handleStickerEnd() {
  if (!draggingSticker) return;
  draggingSticker = false;
  commitState();
}

// 이모지 스티커 선택
stickerEmojiButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const emoji = btn.getAttribute("data-emoji");
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
  if (selectedStickerIndex === null) {
    alert("삭제할 스티커를 먼저 선택해 주세요.");
    return;
  }
  stickers.splice(selectedStickerIndex, 1);
  selectedStickerIndex = null;
  commitState();
});

// PNG 드래그&드롭 → 스티커로 추가
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
      stickers.push({
        type: "image",
        x: pos.x - size / 2,
        y: pos.y - size / 2,
        w: size,
        h: size,
        image: img,
      });
      selectedStickerIndex = stickers.length - 1;
      commitState();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// ===================
// 캔버스 이벤트 (모드에 따라 분기)
// ===================
function handleMouseDown(e) {
  if (mode === "draw") {
    e.preventDefault();
    handleDrawStart(e);
  } else if (mode === "sticker") {
    e.preventDefault();
    handleStickerDown(e);
  }
}

function handleMouseMove(e) {
  if (mode === "draw") {
    e.preventDefault();
    handleDrawMove(e);
  } else if (mode === "sticker") {
    if (!draggingSticker) return;
    e.preventDefault();
    handleStickerMove(e);
  }
}

function handleMouseUp(e) {
  if (mode === "draw") {
    handleDrawEnd(e);
  } else if (mode === "sticker") {
    handleStickerEnd(e);
  }
}

canvas.addEventListener("mousedown", handleMouseDown);
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("mouseup", handleMouseUp);
canvas.addEventListener("mouseleave", handleMouseUp);

canvas.addEventListener("touchstart", (e) => {
  if (mode === "draw") {
    handleDrawStart(e);
  } else if (mode === "sticker") {
    handleStickerDown(e);
  }
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
  if (mode === "draw") {
    handleDrawMove(e);
  } else if (mode === "sticker") {
    handleStickerMove(e);
  }
}, { passive: false });

canvas.addEventListener("touchend", (e) => {
  handleMouseUp(e);
}, { passive: false });

// 전체 지우기
clearCanvasBtn.addEventListener("click", () => {
  clearBaseLayer();
  stickers = [];
  selectedStickerIndex = null;
  commitState();
});

// 모드 버튼
drawModeBtn.addEventListener("click", () => setMode("draw"));
stickerModeBtn.addEventListener("click", () => setMode("sticker"));

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
    const emotionMeta = getEmotionMeta(item.emotion || "calm");
    const weatherMeta = getWeatherMeta(item.weather || "sunny");
    const text =
      (item.content || "") +
      " " +
      dateText +
      " " +
      emotionMeta.label +
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
      dateInput.value = item.date;
      emotionSelect.value = item.emotion || "calm";
      weatherSelect.value = item.weather || "sunny";
      contentInput.value = item.content || "";

      const imgData = item.imageData || null;
      currentImageData = imgData;
      stickers = [];
      selectedStickerIndex = null;

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
    });

    const emotionMeta = getEmotionMeta(item.emotion || "calm");
    const badge = document.createElement("span");
    badge.className = `badge ${emotionMeta.cls}`;
    badge.textContent = emotionMeta.label;

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
  const emotion = emotionSelect.value || "calm";
  const weather = weatherSelect.value || "sunny";

  commitState(); // 최신 상태 반영

  if (!content && !currentImageData) {
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
    imageData: currentImageData || null,
  };

  if (idx >= 0) {
    diaries[idx] = entry;
  } else {
    diaries.push(entry);
  }

  saveDiaries(diaries);
  renderList();
  alert("저장되었습니다 ✅");
});

newEntryBtn.addEventListener("click", () => {
  setToday();
  emotionSelect.value = "happy";
  weatherSelect.value = "sunny";
  contentInput.value = "";
  currentImageData = null;
  stickers = [];
  selectedStickerIndex = null;
  clearBaseLayer();
  resetHistoryWithCurrent();
  renderAll();
  setMode("draw");
});

// ===================
// 🖼 PNG 내보내기 (현재 날짜 그림만)
// ===================
exportPngBtn.addEventListener("click", () => {
  renderAllAndSave();
  if (!currentImageData) {
    alert("저장된 그림이 없습니다.");
    return;
  }
  const date = dateInput.value || "no-date";
  const a = document.createElement("a");
  a.href = currentImageData;
  a.download = `diary_${date}.png`;
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

  let text = "나의 일기장 백업\n\n";
  diaries.forEach((item) => {
    const d = new Date(item.date);
    const dateText = isNaN(d) ? item.date : d.toLocaleDateString("ko-KR");
    const emotionMeta = getEmotionMeta(item.emotion || "calm");
    const weatherMeta = getWeatherMeta(item.weather || "sunny");
    text += `날짜: ${dateText}\n`;
    text += `감정: ${emotionMeta.label}\n`;
    text += `날씨: ${weatherMeta.label}\n`;
    text += `내용:\n${item.content || ""}\n`;
    text += `그림: ${item.imageData ? "[이미지 있음]" : "없음"}\n`;
    text += "------------------------\n\n";
  });

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "diary_backup.txt";
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
    const emotionMeta = getEmotionMeta(item.emotion || "calm");
    const weatherMeta = getWeatherMeta(item.weather || "sunny");

    doc.setFontSize(12);
    doc.text(`날짜: ${dateText}`, 10, y);
    y += 6;
    doc.text(`감정: ${emotionMeta.label}`, 10, y);
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

  doc.save("diary_backup.pdf");
});

// ===================
// 초기화
// ===================
window.addEventListener("load", () => {
  initTheme();
  initLock();
  setToday();
  emotionSelect.value = "happy";
  weatherSelect.value = "sunny";
  setMode("draw");
  renderList();

  // 여기서는 캔버스를 건드리지 않고,
  // 잠금 해제 후에만 resizeAllCanvases 호출
  window.addEventListener("resize", () => {
    if (appEl.style.display === "block") {
      resizeAllCanvases();
    }
  });
});
