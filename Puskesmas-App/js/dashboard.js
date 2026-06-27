async function loadDashboard() {
  try {
    const stats = await getStatistikBulanIni();
    document.getElementById('total-ss').textContent = stats.totalSS;
    document.getElementById('total-sk').textContent = stats.totalSK;
    document.getElementById('total-kw').textContent = stats.totalKW;

    // Ambil 10 data terbaru gabungan
    const bulanIni = getBulanIni();
    const [ss, sk, kw] = await Promise.all([
      db.from('surat_sehat').select('nomor, nama, tanggal').eq('bulan', bulanIni).order('tanggal', {ascending: false}).limit(5),
      db.from('surat_sakit').select('nomor, nama, tanggal').eq('bulan', bulanIni).order('tanggal', {ascending: false}).limit(5),
      db.from('kwitansi').select('nomor, nama, tanggal').eq('bulan', bulanIni).order('tanggal', {ascending: false}).limit(5),
    ]);

    const semua = [
      ...(ss.data || []).map(d => ({...d, jenis: 'Surat Sehat'})),
      ...(sk.data || []).map(d => ({...d, jenis: 'Surat Sakit'})),
      ...(kw.data || []).map(d => ({...d, jenis: 'Kwitansi'})),
    ].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)).slice(0, 10);

    const tbody = document.getElementById('tabel-data');

    if (semua.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" 
        style="text-align:center;color:#999;">Belum ada data</td></tr>`;
      return;
    }

    tbody.innerHTML = semua.map(d => `
      <tr>
        <td><b>${d.nomor}</b></td>
        <td>${d.nama}</td>
        <td>${d.jenis}</td>
        <td>${formatTanggal(d.tanggal)}</td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Error dashboard:', err);
  }
}

function logout() {
  localStorage.removeItem('isLogin');
  window.location.href = 'index.html';
}

loadDashboard();