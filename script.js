// ===================== BASIC NAVIGATION =====================

const sections = document.querySelectorAll(".page-section");

function showSection(id) {
  sections.forEach((sec) => {
    sec.classList.toggle("active", sec.id === id);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// nav buttons
document.querySelectorAll(".nav-link").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.goto;
    if (target) showSection(target);
  });
});

// landing mode buttons
document.getElementById("btn-open-user").addEventListener("click", () => {
  showSection("user");
});

const RESEARCHER_PASSWORD = "sesakberak"; // ganti kalau mau

document.getElementById("btn-open-researcher").addEventListener("click", () => {
  const input = prompt("Masukkan password untuk Mode Peneliti:");
  if (input === null) return;
  if (input === RESEARCHER_PASSWORD) {
    showSection("researcher");
  } else {
    alert("Password salah.");
  }
});

// ===================== DATA & STORAGE =====================

let drafts = [];
let activeDraftId = null;

const STORAGE_KEY = "trafficNeonDrafts";
const ACTIVE_KEY = "trafficNeonActiveDraft";

function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    drafts = raw ? JSON.parse(raw) : [];
  } catch {
    drafts = [];
  }
  activeDraftId = localStorage.getItem(ACTIVE_KEY) || null;
}

function saveStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  if (activeDraftId) localStorage.setItem(ACTIVE_KEY, activeDraftId);
}

// ===================== HELPER FUNCTIONS =====================

function addMinutesToTime(timeStr, minutes) {
  const [h, m] = timeStr.split(":").map(Number);
  const date = new Date(2000, 0, 1, h, m + minutes);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function generateLabels(startTime, intervalMinutes, count) {
  const labels = [];
  let cur = startTime;
  for (let i = 0; i < count; i++) {
    const next = addMinutesToTime(cur, intervalMinutes);
    labels.push(`${cur}–${next}`);
    cur = next;
  }
  return labels;
}

// status berdasarkan jumlah kendaraan
function classifyStatus(v) {
  if (v < 400) return "Sepi";
  if (v < 700) return "Normal";
  return "Ramai";
}

function statusToClass(s) {
  if (s === "Sepi") return "pill-sepi";
  if (s === "Ramai") return "pill-ramai";
  return "pill-normal";
}

// ===================== MODE PENELITI =====================

const intervalInputsContainer = document.getElementById("interval-inputs");
const researcherStatus = document.getElementById("researcher-status");

document
  .getElementById("btn-make-intervals")
  .addEventListener("click", handleMakeIntervals);

function handleMakeIntervals() {
  const startTime = document.getElementById("interval-start").value || "06:00";
  const minutes = Number(
    document.getElementById("interval-minutes").value || 15
  );
  const count = Number(document.getElementById("interval-count").value || 8);

  if (!minutes || !count) {
    alert("Panjang interval dan jumlah interval harus diisi.");
    return;
  }

  const labels = generateLabels(startTime, minutes, count);
  intervalInputsContainer.innerHTML = "";

  labels.forEach((label, idx) => {
    const wrapper = document.createElement("div");
    const span = document.createElement("div");
    span.className = "interval-label";
    span.textContent = `${idx + 1}. ${label}`;

    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.placeholder = "Jumlah";
    input.dataset.index = idx;

    wrapper.appendChild(span);
    wrapper.appendChild(input);
    intervalInputsContainer.appendChild(wrapper);
  });

  researcherStatus.textContent =
    "Interval siap. Isi jumlah kendaraan, lalu klik 'Hitung turunan & simpan draft'.";
}

// hitung & simpan
document
  .getElementById("btn-calc-save")
  .addEventListener("click", handleCalcAndSave);

function handleCalcAndSave() {
  const location = document.getElementById("obs-location").value.trim();
  const observer = document.getElementById("obs-observer").value.trim();
  const date = document.getElementById("obs-date").value;

  if (!location || !observer || !date) {
    alert("Lengkapi nama lokasi, pengamat, dan tanggal.");
    return;
  }

  const startTime = document.getElementById("interval-start").value || "06:00";
  const minutes = Number(
    document.getElementById("interval-minutes").value || 15
  );
  const count = intervalInputsContainer.querySelectorAll("input").length;

  if (!count) {
    alert("Buat input interval terlebih dahulu.");
    return;
  }

  const counts = [];
  for (const input of intervalInputsContainer.querySelectorAll("input")) {
    const val = Number(input.value);
    if (!Number.isFinite(val)) {
      alert("Semua jumlah kendaraan harus diisi.");
      return;
    }
    counts.push(val);
  }

  const labels = generateLabels(startTime, minutes, count);

  // turunan numerik
  const deriv = counts.map((v, i) => {
    if (i === 0) return counts[1] - counts[0];
    if (i === counts.length - 1) return counts[i] - counts[i - 1];
    return (counts[i + 1] - counts[i - 1]) / 2;
  });

  const records = counts.map((v, i) => {
    const status = classifyStatus(v);
    return {
      index: i + 1,
      label: labels[i],
      value: v,
      deriv: deriv[i],
      status,
    };
  });

  // tentukan tersibuk & tersepi
  let maxIdx = 0;
  let minIdx = 0;
  counts.forEach((v, i) => {
    if (v > counts[maxIdx]) maxIdx = i;
    if (v < counts[minIdx]) minIdx = i;
  });

  const draft = {
    id: Date.now().toString(),
    location,
    observer,
    date,
    startTime,
    minutes,
    count,
    labels,
    counts,
    records,
    busiest: labels[maxIdx],
    busiestVal: counts[maxIdx],
    quietest: labels[minIdx],
    quietestVal: counts[minIdx],
  };

  drafts.unshift(draft);
  activeDraftId = draft.id;
  saveStorage();

  renderDetailTable(draft);
  renderDraftTable();
  renderUserDraftSelect();
  renderUserFromDraftId(activeDraftId);

  researcherStatus.textContent =
    "Berhasil menghitung dan menyimpan sebagai draft baru.";
}

function renderDetailTable(draft) {
  const tbody = document.querySelector("#detail-table tbody");
  tbody.innerHTML = "";
  if (!draft) return;
  draft.records.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.index}</td>
      <td>${r.label}</td>
      <td>${r.value}</td>
      <td>${r.deriv.toFixed(2)}</td>
      <td><span class="pill ${statusToClass(
        r.status
      )}">${r.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderDraftTable() {
  const tbody = document.querySelector("#draft-table tbody");
  tbody.innerHTML = "";
  drafts.forEach((d) => {
    const tr = document.createElement("tr");
    const intervalText = `${d.startTime} • ${d.minutes} menit × ${d.count}`;
    const isActive = d.id === activeDraftId;

    tr.innerHTML = `
      <td>${d.location}</td>
      <td>${d.observer}</td>
      <td>${d.date}</td>
      <td>${intervalText}</td>
      <td>
        <button class="secondary btn-use" data-id="${d.id}">
          ${isActive ? "Dipakai di Mode Pengguna" : "Gunakan di Mode Pengguna"}
        </button>
        <button class="secondary btn-delete" data-id="${d.id}">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // event untuk tombol
  tbody.querySelectorAll(".btn-use").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      activeDraftId = id;
      saveStorage();
      renderDraftTable();
      renderUserDraftSelect();
      renderUserFromDraftId(id);
    });
  });

  tbody.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const idx = drafts.findIndex((d) => d.id === id);
      if (idx !== -1 && confirm("Hapus draft ini?")) {
        drafts.splice(idx, 1);
        if (activeDraftId === id) activeDraftId = drafts[0]?.id || null;
        saveStorage();
        renderDraftTable();
        renderUserDraftSelect();
        if (activeDraftId) renderUserFromDraftId(activeDraftId);
        else clearUserView();
      }
    });
  });
}

// ===================== MODE PENGGUNA =====================

const draftSelect = document.getElementById("user-draft-select");

draftSelect.addEventListener("change", () => {
  const id = draftSelect.value;
  if (!id) {
    clearUserView();
    return;
  }
  renderUserFromDraftId(id);
});

function renderUserDraftSelect() {
  draftSelect.innerHTML =
    '<option value="">Pilih data observasi yang ingin dilihat</option>';
  drafts.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = `${d.location} – ${d.date}`;
    if (d.id === activeDraftId) opt.selected = true;
    draftSelect.appendChild(opt);
  });
}

function clearUserView() {
  document.getElementById("user-summary-empty").classList.remove("hidden");
  document
    .getElementById("user-summary-content")
    .classList.add("hidden");
  document.querySelector("#user-table tbody").innerHTML = "";
  document.getElementById("user-keterangan").innerHTML =
    '<p class="hint">Informasi singkat tentang kondisi jalan akan muncul di sini setelah data dipilih.</p>';
  clearChart();
}

function renderUserFromDraftId(id) {
  const draft = drafts.find((d) => d.id === id);
  if (!draft) return;

  // summary
  document.getElementById("user-summary-empty").classList.add("hidden");
  const content = document.getElementById("user-summary-content");
  content.classList.remove("hidden");

  document.getElementById("sum-location").textContent = draft.location;
  document.getElementById("sum-observer").textContent = draft.observer;
  document.getElementById("sum-date").textContent = draft.date;
  document.getElementById(
    "sum-interval"
  ).textContent = `${draft.startTime}, ${draft.minutes} menit × ${draft.count}`;
  document.getElementById(
    "sum-busy"
  ).textContent = `${draft.busiest} (${draft.busiestVal} kendaraan)`;
  document.getElementById(
    "sum-quiet"
  ).textContent = `${draft.quietest} (${draft.quietestVal} kendaraan)`;

  // tabel
  const tbody = document.querySelector("#user-table tbody");
  tbody.innerHTML = "";
  draft.records.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.index}</td>
      <td>${r.label}</td>
      <td>${r.value}</td>
      <td>${r.deriv.toFixed(2)}</td>
      <td><span class="pill ${statusToClass(
        r.status
      )}">${r.status}</span></td>
    `;
    tbody.appendChild(tr);
  });

  // keterangan
  renderKeterangan(draft);
  drawChart(draft);
}

function renderKeterangan(draft) {
  const info = { Sepi: [], Normal: [], Ramai: [] };
  draft.records.forEach((r) => {
    info[r.status].push(r.label);
  });

  const wrap = document.getElementById("user-keterangan");
  wrap.innerHTML = "";

  const title = document.createElement("p");
  title.innerHTML = `<strong>Informasi singkat untuk jalan ${draft.location}</strong>`;
  wrap.appendChild(title);

  const ul = document.createElement("ul");
  ul.style.paddingLeft = "1.2rem";

  ["Sepi", "Normal", "Ramai"].forEach((key) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.className = `pill ${statusToClass(key)}`;
    span.textContent = key;
    li.appendChild(span);
    const text = document.createTextNode(
      info[key].length ? ` : ${info[key].join(", ")}` : " : –"
    );
    li.appendChild(text);
    ul.appendChild(li);
  });

  wrap.appendChild(ul);

  const para = document.createElement("p");
  para.className = "hint";
  para.textContent =
    "Interpretasi sederhana: warna hijau menunjukkan arus lancar, biru arus normal, dan merah arus padat yang berpotensi menimbulkan antrean.";
  wrap.appendChild(para);
}

// ===================== CHART (Canvas) =====================

const canvas = document.getElementById("traffic-chart");
const ctx = canvas.getContext("2d");

function clearChart() {
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth * dpr;
  const height = canvas.clientHeight * dpr;
  canvas.width = width;
  canvas.height = height;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
}

function drawChart(draft) {
  clearChart();

  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const padding = { left: 40, right: 20, top: 20, bottom: 30 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const values = draft.records.map((r) => r.value);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;

  const points = draft.records.map((r, idx) => {
    const x =
      padding.left +
      (innerWidth * idx) / Math.max(1, draft.records.length - 1);
    const y =
      padding.top + innerHeight * (1 - (r.value - minVal) / range);
    return { x, y, status: r.status, label: r.label, value: r.value };
  });

  // grid Y sederhana
  ctx.strokeStyle = "rgba(55,65,81,0.7)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (innerHeight * i) / 4;
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
  }
  ctx.stroke();

  const colorMap = {
    Sepi: "#22c55e",
    Normal: "#3b82f6",
    Ramai: "#ef4444",
  };

  // garis dengan gradien antar titik
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
    grad.addColorStop(0, colorMap[p1.status]);
    grad.addColorStop(1, colorMap[p2.status]);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.4;
    ctx.stroke();
  }

  // titik
  points.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = colorMap[p.status];
    ctx.fill();
  });

  // sumbu X label (di bawah)
  ctx.fillStyle = "#9ca3af";
  ctx.font = "10px system-ui";
  ctx.textAlign = "center";
  const step = Math.max(1, Math.round(points.length / 6));
  points.forEach((p, idx) => {
    if (idx % step === 0 || idx === points.length - 1) {
      ctx.fillText(
        p.label,
        p.x,
        height - 10
      );
    }
  });
}

// ===================== INIT =====================

function init() {
  loadStorage();
  renderDraftTable();
  renderUserDraftSelect();

  if (activeDraftId) {
    renderDetailTable(drafts.find((d) => d.id === activeDraftId));
    renderUserFromDraftId(activeDraftId);
  } else {
    clearUserView();
  }
}

document.addEventListener("DOMContentLoaded", init);
