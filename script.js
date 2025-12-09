const API_KEY = "PYV4xuUOWXx72nxZPhruGd7cFE8pVy2n";

let sampling = null;
let previous = null;

window.onload = function () {
  if (typeof tt === "undefined") {
    alert("TomTom SDK gagal dimuat!");
    return;
  }

  tt.setProductInfo("traffic-lab", "1.0");

  const landing = document.getElementById("landing");
  const pages   = document.getElementById("pages");

  const btnHome     = document.getElementById("btn-home");
  const btnFitur    = document.getElementById("btn-fitur");
  const btnTutorial = document.getElementById("btn-tutorial");
  const btnKonsep   = document.getElementById("btn-konsep");
  const btnAnalisis = document.getElementById("btn-analisis");

  const secFitur    = document.getElementById("sec-fitur");
  const secTutorial = document.getElementById("sec-tutorial");
  const secKonsep   = document.getElementById("sec-konsep");
  const secAnalisis = document.getElementById("sec-analisis");

  const allSections = [secFitur, secTutorial, secKonsep, secAnalisis];

  function showSection(section) {
    allSections.forEach(sec => sec.classList.add("hidden"));
    section.classList.remove("hidden");

    // scroll ke atas konten
    window.scrollTo({ top: 0, behavior: "smooth" });

    // jika halaman analisis dibuka, pastikan map resize
    if (section === secAnalisis && map) {
      setTimeout(() => map.resize(), 300);
    }
  }

  function openPage(section) {
    landing.classList.add("hidden");
    pages.classList.remove("hidden");
    showSection(section);
  }

  btnFitur.onclick    = () => openPage(secFitur);
  btnTutorial.onclick = () => openPage(secTutorial);
  btnKonsep.onclick   = () => openPage(secKonsep);
  btnAnalisis.onclick = () => openPage(secAnalisis);

  btnHome.onclick = () => {
    pages.classList.add("hidden");
    landing.classList.remove("hidden");
    allSections.forEach(sec => sec.classList.add("hidden"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ====== ELEMEN UI ANALISIS ======
  const statusEl      = document.getElementById("status");
  const detailsEl     = document.getElementById("details");
  const tableBody     = document.getElementById("history-table");
  const downloadBtn   = document.getElementById("download-btn");
  const searchInput   = document.getElementById("search-input");
  const searchBtn     = document.getElementById("search-btn");
  const searchResults = document.getElementById("search-results");
  const searchStatus  = document.getElementById("search-status");
  const locBtn        = document.getElementById("loc-btn");

  const history = [];

  // ====== GRAFIK CHART.JS ======
  const ctx = document.getElementById("speed-chart").getContext("2d");
  const speedChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Kecepatan (km/jam)",
        data: [],
        tension: 0.25,
        pointRadius: 3,
        borderWidth: 2,
        borderColor: "#38bdf8",
        backgroundColor: "rgba(56,189,248,0.15)"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#e5e7eb" } },
        tooltip: {
          callbacks: {
            // tooltip menampilkan v, dv/dt, dan status
            label: function (context) {
              const idx = context.dataIndex;
              const row = history[idx];
              if (!row) {
                return `Kecepatan: ${context.parsed.y} km/jam`;
              }
              const lines = [];
              lines.push(`Kecepatan: ${row.v} km/jam`);
              lines.push(`dv/dt: ${row.dvdt} km/jam per menit`);
              lines.push(`Status: ${row.label}`);
              return lines;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#9ca3af" },
          title: { display: true, text: "Waktu", color: "#e5e7eb" }
        },
        y: {
          ticks: { color: "#9ca3af" },
          title: { display: true, text: "Kecepatan (km/jam)", color: "#e5e7eb" }
        }
      }
    }
  });

  // ====== PETA TOMTOM ======
  const map = tt.map({
    key: API_KEY,
    container: "map",
    center: [106.816, -6.2],
    zoom: 12
  });
  map.addControl(new tt.NavigationControl());

  let marker = null;

  function createLocationMarker() {
    const el = document.createElement("div");
    el.className = "marker-location";
    return el;
  }

  function resetData() {
    if (sampling) {
      clearInterval(sampling);
      sampling = null;
    }
    previous = null;
    history.length = 0;
    tableBody.innerHTML = "";
    speedChart.data.labels = [];
    speedChart.data.datasets[0].data = [];
    speedChart.update();
    statusEl.textContent = "-";
    statusEl.className = "badge";
    detailsEl.textContent = "";
  }

  function setPoint(lat, lon) {
    resetData();
    if (marker) marker.remove();
    marker = new tt.Marker({ element: createLocationMarker() })
      .setLngLat([lon, lat])
      .addTo(map);

    fetchTraffic(lat, lon);
    sampling = setInterval(() => fetchTraffic(lat, lon), 10000);
  }

  map.on("click", e => {
    setPoint(e.lngLat.lat, e.lngLat.lng);
  });

  // ====== PENCARIAN LOKASI ======
  searchBtn.onclick = async () => {
    const q = searchInput.value.trim();
    if (!q) return;

    searchResults.innerHTML = "";
    searchStatus.textContent = "Mencari...";

    try {
      const res = await fetch(
        `https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json?key=${API_KEY}`
      );
      const data = await res.json();
      if (!data.results || !data.results.length) {
        searchStatus.textContent = "Lokasi tidak ditemukan.";
        return;
      }

      searchStatus.textContent = "Pilih lokasi:";
      data.results.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item.address.freeformAddress;
        li.onclick = () => {
          map.flyTo({ center: [item.position.lon, item.position.lat], zoom: 15 });
          setPoint(item.position.lat, item.position.lon);
        };
        searchResults.appendChild(li);
      });
    } catch (err) {
      console.error(err);
      searchStatus.textContent = "Terjadi kesalahan saat memanggil Search API.";
    }
  };

  // ====== TRACKING LOKASI SAAT INI ======
  locBtn.onclick = () => {
    if (!navigator.geolocation) {
      alert("Browser ini tidak mendukung geolocation.");
      return;
    }
    searchStatus.textContent = "Mengambil lokasi saat ini...";
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        map.flyTo({ center: [lon, lat], zoom: 15 });
        setPoint(lat, lon);
        searchStatus.textContent = "Lokasi saat ini digunakan.";
      },
      err => {
        console.error(err);
        searchStatus.textContent =
          "Gagal mengambil lokasi. Pastikan izin lokasi diaktifkan.";
      }
    );
  };

  // ====== AMBIL DATA TRAFIK + TURUNAN ======
  function fetchTraffic(lat, lon) {
    const url =
      "https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json" +
      `?key=${API_KEY}&point=${lat},${lon}&unit=KMPH`;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        const seg = data.flowSegmentData;
        const v   = seg.currentSpeed;
        const vf  = seg.freeFlowSpeed;
        const ratio = v / vf;

        let label, cls, borderColor, bgColor;

        if (ratio >= 0.8) {
          label = "LANCAR";
          cls   = "badge lancar";
          borderColor = "#22c55e";
          bgColor     = "rgba(34,197,94,0.18)";
        } else if (ratio >= 0.5) {
          label = "PADAT";
          cls   = "badge padat";
          borderColor = "#facc15";
          bgColor     = "rgba(250,204,21,0.18)";
        } else {
          label = "MACET";
          cls   = "badge macet";
          borderColor = "#f97373";
          bgColor     = "rgba(248,113,113,0.18)";
        }

        // turunan numerik dv/dt
        let dvdt = "-";
        const now = Date.now();
        if (previous) {
          const dtMinutes = (now - previous.t) / 60000;
          if (dtMinutes > 0) {
            dvdt = ((v - previous.v) / dtMinutes).toFixed(2);
          }
        }
        previous = { t: now, v };

        statusEl.textContent = label;
        statusEl.className   = cls;
        detailsEl.textContent =
          `Kecepatan: ${v} km/jam\n` +
          `Kecepatan bebas (v_free): ${vf} km/jam\n` +
          `dv/dt: ${dvdt} (km/jam per menit)`;

        // simpan untuk tabel dan tooltip grafik
        history.push({
          time: new Date(now),
          v,
          label,
          dvdt
        });
        renderTable();

        // sinkronkan warna grafik dengan kepadatan
        speedChart.data.datasets[0].borderColor     = borderColor;
        speedChart.data.datasets[0].backgroundColor = bgColor;
        addPointToChart(v);
      })
      .catch(err => {
        console.error(err);
      });
  }

  function renderTable() {
    tableBody.innerHTML = "";
    history.forEach((row, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML =
        `<td>${i + 1}</td>` +
        `<td>${row.time.toLocaleTimeString()}</td>` +
        `<td>${row.v}</td>` +
        `<td>${row.label}</td>` +
        `<td>${row.dvdt}</td>`;
      tableBody.appendChild(tr);
    });
  }

  // ====== UNDUH CSV ======
  downloadBtn.onclick = () => {
    if (!history.length) {
      alert("Belum ada data untuk diunduh.");
      return;
    }
    let csv = "No,Waktu,v,Status,dv/dt\n";
    history.forEach((row, i) => {
      csv += `${i + 1},${row.time.toISOString()},${row.v},${row.label},${row.dvdt}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = "data_keramaian.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  function addPointToChart(v) {
    speedChart.data.labels.push(new Date().toLocaleTimeString());
    speedChart.data.datasets[0].data.push(v);
    speedChart.update();
  }
};
