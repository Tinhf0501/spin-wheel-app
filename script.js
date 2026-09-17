"use strict";

const CONFIG = Object.freeze({
  minOptions: 2,
  maxOptions: 12,
  maxLabelLength: 42,
  spinDuration: 4200,
  storageKey: "spin-wheel-options-v2",
  historyKey: "spin-wheel-history-v2",
  themeKey: "spin-wheel-theme-v2",
  historyLimit: 8,
});

const COLORS = [
  "#6657E8", "#F07A68", "#27A97A", "#F2B33D",
  "#4386E8", "#D65AA3", "#7D5BD6", "#25A8B4",
  "#E05B65", "#7CA343", "#E78338", "#5468D4",
];
const DEFAULT_LABELS = ["Đi ăn", "Xem phim", "Uống cà phê", "Đi dạo"];
const TAU = Math.PI * 2;

const savedTheme = readStorage(CONFIG.themeKey, null);
const initialTheme = savedTheme === "dark" || savedTheme === "light"
  ? savedTheme
  : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
document.documentElement.dataset.theme = initialTheme;

const elements = {
  wheel: document.getElementById("wheel"),
  wheelStage: document.getElementById("wheel-stage"),
  spinButton: document.getElementById("spin-btn"),
  spinStatus: document.getElementById("spin-status"),
  optionCount: document.getElementById("option-count"),
  resultCard: document.getElementById("result-card"),
  resultLabel: document.getElementById("result-label"),
  resultValue: document.getElementById("result-value"),
  form: document.getElementById("option-form"),
  input: document.getElementById("option-input"),
  addButton: document.getElementById("add-btn"),
  inputCounter: document.getElementById("input-counter"),
  formMessage: document.getElementById("form-message"),
  list: document.getElementById("options-list"),
  listCount: document.getElementById("list-count"),
  emptyState: document.getElementById("empty-state"),
  resetButton: document.getElementById("reset-btn"),
  historyList: document.getElementById("history-list"),
  historyEmpty: document.getElementById("history-empty"),
  clearHistoryButton: document.getElementById("clear-history-btn"),
  celebration: document.getElementById("celebration"),
  resultToast: document.getElementById("result-toast"),
  toastResult: document.getElementById("toast-result"),
  toastClose: document.getElementById("toast-close"),
  themeToggle: document.getElementById("theme-toggle"),
  backToTop: document.getElementById("back-to-top"),
  controlsDialog: document.getElementById("controls-dialog"),
  openControls: document.getElementById("open-controls"),
  closeControls: document.getElementById("close-controls"),
  mobileOptionCount: document.getElementById("mobile-option-count"),
  confirmDialog: document.getElementById("confirm-dialog"),
  confirmTitle: document.getElementById("confirm-title"),
  confirmMessage: document.getElementById("confirm-message"),
  confirmCancel: document.getElementById("confirm-cancel"),
  confirmAccept: document.getElementById("confirm-accept"),
};

const context = elements.wheel.getContext("2d");
const state = {
  options: loadOptions(),
  history: loadHistory(),
  rotation: 0,
  spinning: false,
  animationFrame: null,
  toastTimer: null,
  pendingConfirmation: null,
};

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `option-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createOption(label) {
  return { id: createId(), label };
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    showMessage("Không thể lưu dữ liệu trên trình duyệt này.", "error");
  }
}

function loadOptions() {
  const stored = readStorage(CONFIG.storageKey, null);
  if (stored === null) return DEFAULT_LABELS.map(createOption);
  if (!Array.isArray(stored)) return [];

  return stored
    .filter((item) => item && typeof item.label === "string" && item.label.trim())
    .slice(0, CONFIG.maxOptions)
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : createId(),
      label: item.label.trim().slice(0, CONFIG.maxLabelLength),
    }));
}

function loadHistory() {
  const stored = readStorage(CONFIG.historyKey, []);
  if (!Array.isArray(stored)) return [];
  return stored
    .filter((item) => item && typeof item.label === "string")
    .slice(0, CONFIG.historyLimit);
}

function persistOptions() {
  writeStorage(CONFIG.storageKey, state.options);
}

function persistHistory() {
  writeStorage(CONFIG.historyKey, state.history);
}

function normalizeAngle(angle) {
  return ((angle % TAU) + TAU) % TAU;
}

function secureRandomIndex(length) {
  if (!globalThis.crypto?.getRandomValues) return Math.floor(Math.random() * length);

  const values = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / length) * length;
  do {
    globalThis.crypto.getRandomValues(values);
  } while (values[0] >= limit);
  return values[0] % length;
}

function truncateLabel(label, maxLength) {
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
}

function getTextColor(hexColor) {
  const red = parseInt(hexColor.slice(1, 3), 16);
  const green = parseInt(hexColor.slice(3, 5), 16);
  const blue = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luminance > 0.68 ? "#172034" : "#ffffff";
}

function updateThemeButton(theme) {
  const nextThemeName = theme === "dark" ? "sáng" : "tối";
  const label = `Bật chế độ ${nextThemeName}`;
  elements.themeToggle.setAttribute("aria-label", label);
  elements.themeToggle.title = label;
}

function setTheme(theme, persist = true) {
  document.documentElement.dataset.theme = theme;
  updateThemeButton(theme);
  if (persist) writeStorage(CONFIG.themeKey, theme);
  drawWheel();
}

function resizeCanvas() {
  const rect = elements.wheel.getBoundingClientRect();
  const size = Math.max(280, Math.floor(Math.min(rect.width, rect.height)));
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const targetSize = Math.floor(size * pixelRatio);

  if (elements.wheel.width !== targetSize || elements.wheel.height !== targetSize) {
    elements.wheel.width = targetSize;
    elements.wheel.height = targetSize;
  }

  return { size, pixelRatio };
}

function drawWheel(rotation = state.rotation) {
  const { size, pixelRatio } = resizeCanvas();
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, size, size);

  const center = size / 2;
  const radius = center - 9;

  if (state.options.length === 0) {
    context.beginPath();
    context.arc(center, center, radius, 0, TAU);
    const darkTheme = document.documentElement.dataset.theme === "dark";
    context.fillStyle = darkTheme ? "#252c43" : "#e9ecf4";
    context.fill();
    context.setLineDash([7, 9]);
    context.lineWidth = 2;
    context.strokeStyle = darkTheme ? "#46506d" : "#cbd1de";
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = darkTheme ? "#aab3c9" : "#8d96aa";
    context.font = `700 ${Math.max(14, size * 0.037)}px "DM Sans", sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("Thêm lựa chọn", center, center - 7);
    context.font = `500 ${Math.max(11, size * 0.026)}px "DM Sans", sans-serif`;
    context.fillText("để tạo vòng quay", center, center + 18);
    return;
  }

  const slice = TAU / state.options.length;
  const startOffset = -Math.PI / 2 - slice / 2;

  state.options.forEach((option, index) => {
    const start = startOffset + rotation + index * slice;
    const end = start + slice;
    const color = COLORS[index % COLORS.length];

    context.beginPath();
    context.moveTo(center, center);
    context.arc(center, center, radius, start, end);
    context.closePath();
    context.fillStyle = color;
    context.fill();
    context.lineWidth = Math.max(2, size * 0.007);
    context.strokeStyle = "rgba(255, 255, 255, 0.9)";
    context.stroke();

    const middle = start + slice / 2;
    const buttonRadius = elements.spinButton.getBoundingClientRect().width / 2;
    const innerLabelEdge = Math.max(buttonRadius + 10, radius * 0.27);
    const outerLabelEdge = radius - Math.max(14, size * 0.04);
    const labelRadius = (innerLabelEdge + outerLabelEdge) / 2;
    const availableLabelWidth = Math.max(44, outerLabelEdge - innerLabelEdge - 6);
    let fontSize = Math.max(10, Math.min(17, size * (state.options.length > 8 ? 0.028 : 0.034)));
    const maxCharacters = state.options.length > 8 ? 12 : 16;
    const displayLabel = truncateLabel(option.label, maxCharacters);

    context.save();
    context.translate(center, center);
    context.rotate(middle);
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = getTextColor(color);
    context.font = `700 ${fontSize}px "DM Sans", sans-serif`;

    while (fontSize > 9 && context.measureText(displayLabel).width > availableLabelWidth) {
      fontSize -= 1;
      context.font = `700 ${fontSize}px "DM Sans", sans-serif`;
    }

    context.shadowColor = "rgba(0, 0, 0, 0.1)";
    context.shadowBlur = 2;
    context.fillText(displayLabel, labelRadius, 0, availableLabelWidth);
    context.restore();
  });

  context.beginPath();
  context.arc(center, center, radius, 0, TAU);
  context.lineWidth = Math.max(5, size * 0.014);
  context.strokeStyle = "#ffffff";
  context.stroke();
}

function showMessage(message, type = "default") {
  elements.formMessage.textContent = message;
  elements.formMessage.className = type === "default" ? "" : type;
}

function updateAvailability() {
  const count = state.options.length;
  const canSpin = count >= CONFIG.minOptions && !state.spinning;
  const atMaximum = count >= CONFIG.maxOptions;

  elements.spinButton.disabled = !canSpin;
  elements.input.disabled = state.spinning || atMaximum;
  elements.addButton.disabled = state.spinning || atMaximum;
  elements.resetButton.disabled = state.spinning || count === 0;
  elements.optionCount.textContent = `${count} lựa chọn`;
  elements.mobileOptionCount.textContent = count;
  elements.listCount.textContent = `${count} / ${CONFIG.maxOptions}`;

  if (!state.spinning) {
    elements.spinStatus.classList.remove("spinning");
    elements.spinStatus.lastElementChild.textContent = canSpin ? "Sẵn sàng" : "Chờ lựa chọn";
  }

  if (atMaximum) {
    showMessage(`Đã đạt tối đa ${CONFIG.maxOptions} lựa chọn.`);
  } else if (count < CONFIG.minOptions) {
    showMessage(`Cần thêm ${CONFIG.minOptions - count} lựa chọn để bắt đầu.`);
  }
}

function createIconButton(label, symbol, className, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `icon-button ${className}`.trim();
  button.setAttribute("aria-label", label);
  button.title = label;
  button.textContent = symbol;
  button.disabled = state.spinning;
  button.addEventListener("click", handler);
  return button;
}

function renderOptions() {
  elements.list.replaceChildren();
  elements.emptyState.hidden = state.options.length !== 0;

  state.options.forEach((option, index) => {
    const item = document.createElement("li");
    item.className = "option-item";

    const dot = document.createElement("span");
    dot.className = "color-dot";
    dot.style.color = COLORS[index % COLORS.length];
    dot.style.backgroundColor = COLORS[index % COLORS.length];
    dot.setAttribute("aria-hidden", "true");

    const input = document.createElement("input");
    input.className = "option-name";
    input.type = "text";
    input.maxLength = CONFIG.maxLabelLength;
    input.value = option.label;
    input.disabled = state.spinning;
    input.setAttribute("aria-label", `Sửa lựa chọn ${index + 1}`);
    input.addEventListener("change", () => updateOption(option.id, input.value, input));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") input.blur();
      if (event.key === "Escape") {
        input.value = option.label;
        input.blur();
      }
    });

    const actions = document.createElement("div");
    actions.className = "option-actions";
    const moveUp = createIconButton("Đưa lên", "↑", "", () => moveOption(index, -1));
    const moveDown = createIconButton("Đưa xuống", "↓", "", () => moveOption(index, 1));
    const remove = createIconButton("Xóa lựa chọn", "×", "delete", () => removeOption(option.id));
    moveUp.disabled = state.spinning || index === 0;
    moveDown.disabled = state.spinning || index === state.options.length - 1;
    actions.append(moveUp, moveDown, remove);

    item.append(dot, input, actions);
    elements.list.append(item);
  });

  updateAvailability();
  drawWheel();
}

function renderHistory() {
  elements.historyList.replaceChildren();
  elements.historyEmpty.hidden = state.history.length > 0;
  elements.clearHistoryButton.disabled = state.history.length === 0 || state.spinning;

  state.history.slice(0, 5).forEach((entry) => {
    const item = document.createElement("li");
    item.className = "history-item";
    const label = document.createElement("span");
    label.className = "history-label";
    label.textContent = entry.label;
    label.tabIndex = 0;
    const time = document.createElement("time");
    const date = new Date(entry.timestamp);
    time.dateTime = Number.isNaN(date.getTime()) ? "" : date.toISOString();
    if (Number.isNaN(date.getTime())) {
      time.textContent = "Vừa xong";
    } else {
      const dateText = new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
      const timeText = new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
      time.textContent = `${dateText} • ${timeText}`;
      time.title = new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "full",
        timeStyle: "medium",
      }).format(date);
    }
    const tooltip = document.createElement("span");
    tooltip.className = "history-tooltip";
    tooltip.setAttribute("role", "tooltip");
    tooltip.textContent = entry.label;

    item.append(label, time, tooltip);
    elements.historyList.append(item);
  });
}

function normalizedLabel(label) {
  return label.trim().toLocaleLowerCase("vi");
}

function labelExists(label, ignoredId = null) {
  const normalized = normalizedLabel(label);
  return state.options.some((option) => option.id !== ignoredId && normalizedLabel(option.label) === normalized);
}

function addOption(label) {
  const cleanLabel = label.trim();
  if (!cleanLabel) {
    showMessage("Hãy nhập nội dung cho lựa chọn.", "error");
    elements.input.focus();
    return;
  }
  if (state.options.length >= CONFIG.maxOptions) {
    showMessage(`Chỉ có thể thêm tối đa ${CONFIG.maxOptions} lựa chọn.`, "error");
    return;
  }
  if (labelExists(cleanLabel)) {
    showMessage("Lựa chọn này đã có trong danh sách.", "error");
    elements.input.select();
    return;
  }

  state.options.push(createOption(cleanLabel));
  persistOptions();
  elements.input.value = "";
  elements.inputCounter.textContent = `0/${CONFIG.maxLabelLength}`;
  showMessage("Đã thêm lựa chọn.", "success");
  renderOptions();
  elements.input.focus();
}

function updateOption(id, label, input) {
  const option = state.options.find((item) => item.id === id);
  if (!option) return;

  const cleanLabel = label.trim();
  if (!cleanLabel || labelExists(cleanLabel, id)) {
    input.value = option.label;
    showMessage(!cleanLabel ? "Tên lựa chọn không được để trống." : "Tên lựa chọn đang bị trùng.", "error");
    return;
  }

  option.label = cleanLabel;
  input.value = cleanLabel;
  persistOptions();
  showMessage("Đã cập nhật lựa chọn.", "success");
  drawWheel();
}

function removeOption(id) {
  state.options = state.options.filter((option) => option.id !== id);
  persistOptions();
  showMessage("Đã xóa lựa chọn.");
  renderOptions();
}

function moveOption(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= state.options.length) return;
  [state.options[index], state.options[target]] = [state.options[target], state.options[index]];
  persistOptions();
  renderOptions();
}

function setSpinning(isSpinning) {
  state.spinning = isSpinning;
  elements.wheelStage.classList.toggle("spinning", isSpinning);
  elements.spinStatus.classList.toggle("spinning", isSpinning);
  elements.spinStatus.lastElementChild.textContent = isSpinning ? "Đang quay" : "Sẵn sàng";
  if (isSpinning) elements.resultCard.classList.remove("winner");
  renderOptions();
  renderHistory();
}

function easeOutQuint(progress) {
  return 1 - Math.pow(1 - progress, 5);
}

function hideResultToast() {
  window.clearTimeout(state.toastTimer);
  state.toastTimer = null;
  elements.resultToast.classList.remove("show");
  elements.resultToast.setAttribute("aria-hidden", "true");
  elements.backToTop.classList.remove("toast-open");
}

function showResultToast(label, color) {
  hideResultToast();
  elements.toastResult.textContent = label;
  elements.resultToast.style.setProperty("--toast-accent", color);

  // Force the progress animation to restart for consecutive spins.
  void elements.resultToast.offsetWidth;
  elements.resultToast.classList.add("show");
  elements.resultToast.setAttribute("aria-hidden", "false");
  elements.backToTop.classList.add("toast-open");
  state.toastTimer = window.setTimeout(hideResultToast, 6000);
}

function finishSpin(winner, winningIndex) {
  state.history.unshift({ label: winner.label, timestamp: new Date().toISOString() });
  state.history = state.history.slice(0, CONFIG.historyLimit);
  persistHistory();
  elements.resultLabel.textContent = "Vòng quay đã chọn";
  elements.resultValue.textContent = winner.label;
  setSpinning(false);
  elements.resultCard.classList.add("winner");
  createConfetti();
  showResultToast(winner.label, COLORS[winningIndex % COLORS.length]);
}

function spin() {
  if (state.spinning || state.options.length < CONFIG.minOptions) return;

  hideResultToast();

  const winningIndex = secureRandomIndex(state.options.length);
  const winner = state.options[winningIndex];
  const slice = TAU / state.options.length;
  const desiredRotation = normalizeAngle(-winningIndex * slice);
  const currentRotation = normalizeAngle(state.rotation);
  const forwardDelta = normalizeAngle(desiredRotation - currentRotation);
  const extraTurns = 6 + secureRandomIndex(3);
  const startRotation = state.rotation;
  const endRotation = startRotation + extraTurns * TAU + forwardDelta;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const duration = reduceMotion ? 250 : CONFIG.spinDuration;
  const startedAt = performance.now();

  setSpinning(true);
  elements.resultLabel.textContent = "Đang tìm lựa chọn may mắn…";
  elements.resultValue.textContent = "Vòng quay đang chuyển động";

  function animate(now) {
    const progress = Math.min((now - startedAt) / duration, 1);
    state.rotation = startRotation + (endRotation - startRotation) * easeOutQuint(progress);
    drawWheel(state.rotation);

    if (progress < 1) {
      state.animationFrame = requestAnimationFrame(animate);
      return;
    }

    state.rotation = normalizeAngle(endRotation);
    drawWheel();
    state.animationFrame = null;
    finishSpin(winner, winningIndex);
  }

  state.animationFrame = requestAnimationFrame(animate);
}

function createConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  elements.celebration.replaceChildren();

  for (let index = 0; index < 32; index += 1) {
    const particle = document.createElement("i");
    const angle = (TAU * index) / 32 + Math.random() * 0.2;
    const distance = 90 + Math.random() * 130;
    particle.className = "confetti";
    particle.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
    particle.style.setProperty("--rotation", `${Math.random() * 720 - 360}deg`);
    particle.style.setProperty("--confetti-color", COLORS[index % COLORS.length]);
    elements.celebration.append(particle);
  }

  window.setTimeout(() => elements.celebration.replaceChildren(), 1100);
}

function openConfirmation({ title, message, confirmLabel, onConfirm }) {
  state.pendingConfirmation = onConfirm;
  elements.confirmTitle.textContent = title;
  elements.confirmMessage.textContent = message;
  elements.confirmAccept.textContent = confirmLabel;
  elements.confirmDialog.showModal();
  elements.confirmCancel.focus();
}

function closeConfirmation() {
  state.pendingConfirmation = null;
  if (elements.confirmDialog.open) elements.confirmDialog.close();
}

elements.confirmCancel.addEventListener("click", closeConfirmation);

elements.confirmAccept.addEventListener("click", () => {
  const action = state.pendingConfirmation;
  closeConfirmation();
  if (action) action();
});

elements.confirmDialog.addEventListener("cancel", () => {
  state.pendingConfirmation = null;
});

elements.confirmDialog.addEventListener("click", (event) => {
  if (event.target === elements.confirmDialog) closeConfirmation();
});

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  addOption(elements.input.value);
});

elements.input.addEventListener("input", () => {
  elements.inputCounter.textContent = `${elements.input.value.length}/${CONFIG.maxLabelLength}`;
  if (elements.formMessage.classList.contains("error")) {
    showMessage("Tối thiểu 2, tối đa 12 lựa chọn.");
  }
});

elements.spinButton.addEventListener("click", spin);
elements.toastClose.addEventListener("click", hideResultToast);
elements.themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  setTheme(nextTheme);
});

const compactControlsLayout = window.matchMedia("(max-width: 920px)");

function syncControlsDialog(event) {
  const isMobile = event.matches;

  if (isMobile) {
    if (elements.controlsDialog.open) elements.controlsDialog.close();
    return;
  }

  if (elements.controlsDialog.open) elements.controlsDialog.close();
  elements.controlsDialog.setAttribute("open", "");
}

elements.openControls.addEventListener("click", () => {
  if (!compactControlsLayout.matches || elements.controlsDialog.open) return;
  elements.controlsDialog.showModal();
});

elements.closeControls.addEventListener("click", () => elements.controlsDialog.close());

elements.controlsDialog.addEventListener("click", (event) => {
  if (compactControlsLayout.matches && event.target === elements.controlsDialog) {
    elements.controlsDialog.close();
  }
});

compactControlsLayout.addEventListener("change", syncControlsDialog);

function updateBackToTopVisibility() {
  elements.backToTop.classList.toggle("visible", window.scrollY > 160);
}

elements.backToTop.addEventListener("click", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
});

window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });

elements.resetButton.addEventListener("click", () => {
  if (state.options.length === 0 || state.spinning) return;
  openConfirmation({
    title: "Xóa toàn bộ lựa chọn?",
    message: "Danh sách hiện tại sẽ bị xóa và không thể khôi phục.",
    confirmLabel: "Xóa danh sách",
    onConfirm: () => {
      state.options = [];
      state.rotation = 0;
      hideResultToast();
      persistOptions();
      elements.resultLabel.textContent = "Danh sách đã được làm mới";
      elements.resultValue.textContent = "Thêm ít nhất 2 lựa chọn để bắt đầu";
      elements.resultCard.classList.remove("winner");
      renderOptions();
    },
  });
});

elements.clearHistoryButton.addEventListener("click", () => {
  if (state.history.length === 0) return;
  openConfirmation({
    title: "Xóa các kết quả đã quay?",
    message: "Toàn bộ kết quả quay gần đây sẽ bị xóa khỏi trình duyệt này.",
    confirmLabel: "Xóa kết quả",
    onConfirm: () => {
      state.history = [];
      persistHistory();
      renderHistory();
    },
  });
});

let resizeTimer;
window.addEventListener("resize", () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(drawWheel, 80);
});

updateThemeButton(initialTheme);
syncControlsDialog(compactControlsLayout);
updateBackToTopVisibility();
renderOptions();
renderHistory();
