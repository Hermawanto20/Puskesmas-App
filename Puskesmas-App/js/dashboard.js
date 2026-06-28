// Set filter bulan & tahun default ke bulan ini
function initFilter() {
  const now = new Date();
  document.getElementById('filter-bulan').value = 
    String(now.getMonth() + 1).padStart(2, '0');
  document.getElementById('filter-tahun').value = 
    String(now.getFullYear());
}

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
}

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

    // Ambil data sesuai filter jenis
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

    // Filter nama
    if (nama) {
      semua = semua.filter(d => d.nama.toLowerCase().includes(nama));
    }

    // Urutkan by tanggal terbaru
    semua.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    // Info total
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

function getBadgeClass(jenis) {
  if (jenis === 'Surat Sehat') return 'badge-blue';
  if (jenis === 'Surat Sakit') return 'badge-red';
  if (jenis === 'Kwitansi')    return 'badge-green';
  return '';
}

function resetFilter() {
  initFilter();
  document.getElementById('filter-jenis').value = 'semua';
  document.getElementById('filter-nama').value  = '';
  applyFilter();
}

function logout() {
  localStorage.removeItem('isLogin');
  window.location.href = 'index.html';
}

// Jalankan saat halaman dibuka
initFilter();
loadDashboard();