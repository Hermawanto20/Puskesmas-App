async function simpanKwitansi() {
  const nama   = document.getElementById('nama').value.trim();
  const jumlah = document.getElementById('jumlah').value;

  if (!nama || !jumlah) {
    alert('Nama dan jumlah bayar wajib diisi!');
    return;
  }

  const nomor = await generateNomorOnline('KW', 'kwitansi');

  const data = {
    nomor,
    nama,
    ref_surat  : document.getElementById('ref-surat').value  || null,
    layanan    : document.getElementById('layanan').value    || null,
    jumlah     : parseInt(jumlah),
    metode     : document.getElementById('metode').value     || null,
    tgl_bayar  : document.getElementById('tgl-bayar').value  || null,
    keterangan : document.getElementById('keterangan').value || null,
    bulan      : getBulanIni()
  };

  try {
    await simpanKwitansiOnline(data);
    tampilkanPopup('Kwitansi berhasil disimpan!\nNomor: ' + nomor);
    resetForm();
    await loadTabelKW();
    await updatePreviewNomor();
  } catch (err) {
    alert('Gagal simpan: ' + err.message);
  }
}

async function loadTabelKW() {
  await filterTabelKW();
}

function initFilterKW() {
  const now = new Date();
  document.getElementById('filter-bulan').value =
    String(now.getMonth() + 1).padStart(2, '0');
  document.getElementById('filter-tahun').value =
    String(now.getFullYear());
}

async function filterTabelKW() {
  const bulan  = document.getElementById('filter-bulan').value;
  const tahun  = document.getElementById('filter-tahun').value;
  const period = `${tahun}-${bulan}`;

  const tbody = document.getElementById('tabel-kw');
  tbody.innerHTML = `<tr><td colspan="6" 
    style="text-align:center;">Memuat data...</td></tr>`;

  try {
    const { data, error } = await db
      .from('kwitansi')
      .select('*')
      .eq('bulan', period)
      .order('tanggal', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" 
        style="text-align:center;color:#999;">
        Belum ada data periode ini</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(d => `
      <tr>
        <td><b>${d.nomor}</b></td>
        <td>${d.nama}</td>
        <td>${d.layanan || '-'}</td>
        <td>${formatRupiah(d.jumlah)}</td>
        <td>${formatTanggal(d.tanggal)}</td>
        <td>
          <button onclick="cetakKW('${d.nomor}')" class="btn-cetak">🖨️</button>
          <button onclick="editKW('${d.nomor}')" class="btn-edit">✏️</button>
          <button onclick="hapusKW('${d.nomor}')" class="btn-hapus">🗑️</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" 
      style="text-align:center;color:red;">
      Gagal memuat data</td></tr>`;
  }
}

async function hapusKW(nomor) {
  if (!confirm(`Yakin ingin menghapus data ${nomor}?`)) return;

  try {
    const { error } = await db.from('kwitansi').delete().eq('nomor', nomor);
    if (error) throw error;
    tampilkanPopup('Data Kwitansi berhasil dihapus!');
    await loadTabelKW();
    await updatePreviewNomor();
  } catch (err) {
    alert('Gagal hapus: ' + err.message);
  }
}

async function editKW(nomor) {
  const { data } = await db.from('kwitansi')
    .select('*').eq('nomor', nomor).single();
  if (!data) return;

  document.getElementById('nama').value       = data.nama       || '';
  document.getElementById('ref-surat').value  = data.ref_surat  || '';
  document.getElementById('layanan').value    = data.layanan    || '';
  document.getElementById('jumlah').value     = data.jumlah     || '';
  document.getElementById('metode').value     = data.metode     || '';
  document.getElementById('tgl-bayar').value  = data.tgl_bayar  || '';
  document.getElementById('keterangan').value = data.keterangan || '';

  document.getElementById('preview-nomor').textContent = data.nomor;
  window.editNomorKW = nomor;
  window.isEditModeKW = true;

  const btn = document.getElementById('btn-simpan');
  btn.textContent = '💾 Update Data';
  btn.onclick = updateKW;

  window.scrollTo({top: 0, behavior: 'smooth'});
}

async function updateKW() {
  const nama   = document.getElementById('nama').value.trim();
  const jumlah = document.getElementById('jumlah').value;

  if (!nama || !jumlah) {
    alert('Nama dan jumlah bayar wajib diisi!');
    return;
  }

  const data = {
    nama,
    ref_surat  : document.getElementById('ref-surat').value  || null,
    layanan    : document.getElementById('layanan').value    || null,
    jumlah     : parseInt(jumlah),
    metode     : document.getElementById('metode').value     || null,
    tgl_bayar  : document.getElementById('tgl-bayar').value  || null,
    keterangan : document.getElementById('keterangan').value || null,
  };

  try {
    const { error } = await db.from('kwitansi')
      .update(data).eq('nomor', window.editNomorKW);
    if (error) throw error;

    window.editNomorKW = null;
    window.isEditModeKW = false;

    const btn = document.getElementById('btn-simpan');
    btn.textContent = '💾 Simpan & Cetak';
    btn.onclick = simpanKwitansi;

    resetForm();
initFilterKW();
await loadTabelKW();
await updatePreviewNomor();

tampilkanPopup('Data Kwitansi berhasil diupdate!');

  } catch (err) {
    alert('Gagal update: ' + err.message);
  }
}

async function updatePreviewNomor() {
  document.getElementById('preview-nomor').textContent =
    await generateNomorOnline('KW', 'kwitansi');
}

async function cetakKW(nomor) {
  const { data } = await db.from('kwitansi')
    .select('*').eq('nomor', nomor).single();
  if (!data) return;

  const params = new URLSearchParams({
    nomor    : data.nomor,
    nama     : data.nama,
    refSurat : data.ref_surat || '',
    layanan  : data.layanan   || '',
    jumlah   : data.jumlah    || 0,
    metode   : data.metode    || '',
    tglBayar : data.tgl_bayar || '',
  });

  window.open('cetak-kwitansi.html?' + params.toString(), '_blank');
}

// Jalankan saat halaman dibuka
updatePreviewNomor();
initFilterKW();
loadTabelKW();