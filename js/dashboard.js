initPage();

let grafikInstance = null;

async function loadDashboard() {
  try {
    const stats = await getStatistikBulanIni();
    document.getElementById('total-ss').textContent = stats.totalSS;
    document.getElementById('total-sk').textContent = stats.totalSK;
    document.getElementById('total-kw').textContent = stats.totalKW;
  } catch (err) {
    console.error('Error statistik:', err);
  }

  await applyFilter();
  await loadRekap();
}

// ==========================================
// FILTER DATA TERBARU
// ==========================================
async function applyFilter() {
  const bulan  = document.getElementById('filter-bulan').value;
  const tahun  = document.getElementById('filter-tahun').value;
  const jenis  = document.getElementById('filter-jenis').value;
  const nama   = document.getElementById('filter-nama').value.trim().toLowerCase();
  const period = `${tahun}-${bulan}`;

  const tbody = document.getElementById('tabel-data');
  tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">
    Memuat data...</td></tr>`;

  try {
    let semua = [];

    if (jenis === 'semua' || jenis === 'surat_sehat') {
      const { data } = await db.from('surat_sehat')
        .select('nomor, nama, tanggal, bulan')
        .eq('bulan', period)
        .order('tanggal', { ascending: false });
      if (data) semua.push(...data.map(d => ({...d, jenis: 'Surat Sehat'})));
    }

    if (jenis === 'semua' || jenis === 'surat_sakit') {
      const { data } = await db.from('surat_sakit')
        .select('nomor, nama, tanggal, bulan')
        .eq('bulan', period)
        .order('tanggal', { ascending: false });
      if (data) semua.push(...data.map(d => ({...d, jenis: 'Surat Sakit'})));
    }

    if (jenis === 'semua' || jenis === 'kwitansi') {
      const { data } = await db.from('kwitansi')
        .select('nomor, nama, tanggal, bulan')
        .eq('bulan', period)
        .order('tanggal', { ascending: false });
      if (data) semua.push(...data.map(d => ({...d, jenis: 'Kwitansi'})));
    }

    if (nama) {
      semua = semua.filter(d => d.nama.toLowerCase().includes(nama));
    }

    semua.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    document.getElementById('info-total').textContent =
      `Menampilkan ${semua.length} data`;

    if (semua.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" 
        style="text-align:center;color:#999;">
        Tidak ada data ditemukan</td></tr>`;
      return;
    }

    tbody.innerHTML = semua.map(d => `
      <tr>
        <td><b>${d.nomor}</b></td>
        <td>${d.nama}</td>
        <td>
          <span class="badge ${getBadgeClass(d.jenis)}">${d.jenis}</span>
        </td>
        <td>${formatTanggal(d.tanggal)}</td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Error filter:', err);
    tbody.innerHTML = `<tr><td colspan="4" 
      style="text-align:center;color:red;">
      Gagal memuat data</td></tr>`;
  }
}

// ==========================================
// REKAP KEUANGAN
// ==========================================
async function loadRekap() {
  const periode = document.getElementById('filter-rekap').value;
  const now     = new Date();
  const wib     = new Date(now.getTime() + (7 * 60 * 60 * 1000));

  let dari, sampai, labelPeriode;

  if (periode === 'harian') {
    const hari = getHariIni();
    dari   = hari + 'T00:00:00+07:00';
    sampai = hari + 'T23:59:59+07:00';
    labelPeriode = 'Hari Ini';
  } else if (periode === 'mingguan') {
    // 7 hari ke belakang
    const tglSampai = getHariIni();
    const tglDari   = new Date(wib);
    tglDari.setDate(tglDari.getUTCDate() - 6);
    const dd = String(tglDari.getUTCDate()).padStart(2, '0');
    const mm = String(tglDari.getUTCMonth() + 1).padStart(2, '0');
    const yy = tglDari.getUTCFullYear();
    dari   = `${yy}-${mm}-${dd}T00:00:00+07:00`;
    sampai = tglSampai + 'T23:59:59+07:00';
    labelPeriode = '7 Hari Terakhir';
  } else {
    // Bulanan
    const tahun = wib.getUTCFullYear();
    const bulan = String(wib.getUTCMonth() + 1).padStart(2, '0');
    dari   = `${tahun}-${bulan}-01T00:00:00+07:00`;
    sampai = getHariIni() + 'T23:59:59+07:00';
    labelPeriode = 'Bulan Ini';
  }

  try {
    const { data, error } = await db
      .from('kwitansi')
      .select('*')
      .gte('tanggal', dari)
      .lte('tanggal', sampai)
      .order('tanggal', { ascending: true });

    if (error) throw error;

    const transaksi = data || [];
    const total     = transaksi.reduce((sum, d) => sum + (d.jumlah || 0), 0);
    const jumlah    = transaksi.length;
    const rata      = jumlah > 0 ? Math.round(total / jumlah) : 0;

    // Update kartu
    document.getElementById('rekap-total').textContent  = formatRupiah(total);
    document.getElementById('rekap-jumlah').textContent = jumlah;
    document.getElementById('rekap-rata').textContent   = formatRupiah(rata);
    document.getElementById('rekap-label').textContent  = `Total Pendapatan (${labelPeriode})`;

    // Update tabel detail
    renderTabelRekap(transaksi);

    // Update grafik
    renderGrafik(transaksi, periode);

  } catch (err) {
    console.error('Error rekap:', err);
  }
}

function renderTabelRekap(data) {
  const tbody = document.getElementById('tabel-rekap');

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" 
      style="text-align:center;color:#999;">
      Belum ada transaksi</td></tr>`;
    return;
  }

  tbody.innerHTML = data.slice().reverse().map((d, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><b>${d.nomor}</b></td>
      <td>${d.nama}</td>
      <td>${d.layanan || '-'}</td>
      <td style="color:#16a34a; font-weight:600;">
        ${formatRupiah(d.jumlah)}
      </td>
      <td>${d.metode || '-'}</td>
      <td>${d.petugas || '-'}</td>
      <td>${d.posisi || '-'}</td>
      <td>${formatTanggal(d.tanggal)}</td>
    </tr>
  `).join('');
}

function renderGrafik(data, periode) {
  // Siapkan label & nilai
  const grupData = {};

  data.forEach(d => {
    const tgl = new Date(d.tanggal);
    const wib = new Date(tgl.getTime() + (7 * 60 * 60 * 1000));

    let label;
    if (periode === 'harian') {
      // Per jam
      label = String(wib.getUTCHours()).padStart(2, '0') + ':00';
    } else if (periode === 'mingguan') {
      // Per hari
      label = wib.toLocaleDateString('id-ID', {
        weekday: 'short', day: '2-digit', month: 'short',
        timeZone: 'Asia/Jakarta'
      });
    } else {
      // Per tanggal
      label = String(wib.getUTCDate()).padStart(2, '0') + '/' +
              String(wib.getUTCMonth() + 1).padStart(2, '0');
    }

    grupData[label] = (grupData[label] || 0) + (d.jumlah || 0);
  });

  const labels = Object.keys(grupData);
  const values = Object.values(grupData);

  // Hapus grafik lama
  if (grafikInstance) {
    grafikInstance.destroy();
  }

  const ctx = document.getElementById('grafikPendapatan').getContext('2d');
  grafikInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Pendapatan (Rp)',
        data: values,
        backgroundColor: 'rgba(37, 99, 235, 0.7)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 1,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => formatRupiah(ctx.raw)
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: val => formatRupiah(val)
          }
        }
      }
    }
  });
}

function getBadgeClass(jenis) {
  if (jenis === 'Surat Sehat') return 'badge-blue';
  if (jenis === 'Surat Sakit') return 'badge-red';
  if (jenis === 'Kwitansi')    return 'badge-green';
  return '';
}

function initFilter() {
  const now = new Date();
  document.getElementById('filter-bulan').value =
    String(now.getMonth() + 1).padStart(2, '0');
  document.getElementById('filter-tahun').value =
    String(now.getFullYear());
}

function resetFilter() {
  initFilter();
  document.getElementById('filter-jenis').value = 'semua';
  document.getElementById('filter-nama').value  = '';
  applyFilter();
}

function logout() {
  localStorage.removeItem('user');
  localStorage.removeItem('isLogin');
  window.location.href = 'index.html';
}

// Jalankan saat halaman dibuka
initFilter();
loadDashboard();