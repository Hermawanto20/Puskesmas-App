initPage();

// ==========================================
// WAKTU SEKARANG (WIB)
// ==========================================
function getWaktuSekarang() {
  const now = new Date();
  const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));

  return {
    tgl   : `${wib.getUTCFullYear()}-${String(wib.getUTCMonth()+1).padStart(2,'0')}-${String(wib.getUTCDate()).padStart(2,'0')}`,
    jam   : String(wib.getUTCHours()).padStart(2, '0'),
    menit : String(wib.getUTCMinutes()).padStart(2, '0')
  };
}

// ==========================================
// INIT DROPDOWN JAM & MENIT
// ==========================================
function initDropdownWaktu() {
  const selJam   = document.getElementById('jam-bayar-jam');
  const selMenit = document.getElementById('jam-bayar-menit');

  selJam.innerHTML = '';
  for (let i = 0; i < 24; i++) {
    const val = String(i).padStart(2, '0');
    selJam.innerHTML += `<option value="${val}">${val}</option>`;
  }

  selMenit.innerHTML = '';
  for (let i = 0; i < 60; i++) {
    const val = String(i).padStart(2, '0');
    selMenit.innerHTML += `<option value="${val}">${val}</option>`;
  }
}

// ==========================================
// GET & SET JAM DARI DROPDOWN
// ==========================================
function getJamBayar() {
  const jam   = document.getElementById('jam-bayar-jam').value;
  const menit = document.getElementById('jam-bayar-menit').value;
  return `${jam}:${menit}`;
}

function setJamBayar(jamStr) {
  if (!jamStr) return;
  const parts = jamStr.split(':');
  document.getElementById('jam-bayar-jam').value   = parts[0] || '00';
  document.getElementById('jam-bayar-menit').value = parts[1] || '00';
}

// ==========================================
// AUTO FILL WAKTU DI INPUT
// ==========================================
function autoFillWaktu() {
  const w = getWaktuSekarang();
  document.getElementById('tgl-bayar').value = w.tgl;
  setJamBayar(`${w.jam}:${w.menit}`);
}

// ==========================================
// AUTO FILL JUMLAH BERDASARKAN LAYANAN
// ==========================================
function autoFillJumlah() {
  const layanan     = document.getElementById('layanan').value;
  const inputJumlah = document.getElementById('jumlah');

  const harga = {
    'Pendaftaran KTP Non Depok'  : 20000,
    'Surat Sehat KTP Depok'      : 25000,
    'Surat Sehat KTP Non Depok'  : 45000,
    'Psikolog KTP Depok'         : 30000,
    'Psikolog KTP Non Depok'     : 50000,
  };

  if (harga[layanan] !== undefined) {
    inputJumlah.value            = harga[layanan];
    inputJumlah.readOnly         = true;
    inputJumlah.style.background = '#f1f5f9';
    inputJumlah.style.color      = '#64748b';
  } else {
    inputJumlah.value            = '';
    inputJumlah.readOnly         = false;
    inputJumlah.style.background = '';
    inputJumlah.style.color      = '';
  }
}

// ==========================================
// RESET FORM KWITANSI
// ==========================================
function resetFormKwitansi() {
  document.getElementById('nama').value       = '';
  document.getElementById('ref-surat').value  = '';
  document.getElementById('layanan').value    = '';
  document.getElementById('keterangan').value = '';
  document.getElementById('metode').value     = 'Tunai';

  const inputJumlah            = document.getElementById('jumlah');
  inputJumlah.value            = '';
  inputJumlah.readOnly         = false;
  inputJumlah.style.background = '';
  inputJumlah.style.color      = '';

  autoFillWaktu();

  const pesanSukses = document.getElementById('pesan-sukses');
  if (pesanSukses) pesanSukses.style.display = 'none';
}

// ==========================================
// SIMPAN KWITANSI
// ==========================================
async function simpanKwitansi() {
  const nama    = document.getElementById('nama').value.trim();
  const jumlah  = document.getElementById('jumlah').value;
  const layanan = document.getElementById('layanan').value;

  if (!nama || !jumlah || !layanan) {
    alert('Nama, jenis layanan, dan jumlah bayar wajib diisi!');
    return;
  }

  const nomor = await generateNomorOnline('KW', 'kwitansi');
  const waktu = getWaktuSekarang();

  const data = {
    nomor,
    nama,
    ref_surat  : document.getElementById('ref-surat').value  || null,
    layanan,
    jumlah     : parseInt(jumlah),
    metode     : document.getElementById('metode').value     || 'Tunai',
    tgl_bayar  : waktu.tgl,
    jam_bayar  : `${waktu.jam}:${waktu.menit}`,
    keterangan : document.getElementById('keterangan').value || null,
    bulan      : getBulanIni(),
    posisi     : getPosisi(),
    petugas    : getNamaUser()
  };

  try {
    await simpanKwitansiOnline(data);
    tampilkanPopup('Kwitansi berhasil disimpan!\nNomor: ' + nomor);
    resetFormKwitansi();
    await loadTabelKW();
    await updatePreviewNomor();
  } catch (err) {
    alert('Gagal simpan: ' + err.message);
  }
}

// ==========================================
// LOAD TABEL
// ==========================================
async function loadTabelKW() {
  const tbody = document.getElementById('tabel-kw');
  tbody.innerHTML = `<tr><td colspan="6"
    style="text-align:center;">Memuat data...</td></tr>`;

  try {
    const { data, error } = await db
      .from('kwitansi')
      .select('*')
      .gte('tanggal', getHariIni() + 'T00:00:00+07:00')
      .lte('tanggal', getHariIni() + 'T23:59:59+07:00')
      .order('tanggal', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6"
        style="text-align:center;color:#999;">
        Belum ada data hari ini</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(d => `
      <tr>
        <td><b>${d.nomor}</b></td>
        <td>${d.nama}</td>
        <td>${d.layanan || '-'}</td>
        <td>${formatRupiah(d.jumlah)}</td>
        <td>
          ${d.tgl_bayar ? formatTglSimple(d.tgl_bayar) : '-'}
          ${d.jam_bayar ? ' ' + d.jam_bayar : ''}
        </td>
        <td>
          <button onclick="cetakKW('${d.nomor}')" class="btn-cetak">🖨️</button>
          <button onclick="editKW('${d.nomor}')" class="btn-edit">✏️</button>
          ${getRole() !== 'pimpinan' ?
          `<button onclick="hapusKW('${d.nomor}')" class="btn-hapus">🗑️</button>` :
          ''}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6"
      style="text-align:center;color:red;">
      Gagal memuat data</td></tr>`;
  }
}

// ==========================================
// HAPUS
// ==========================================
async function hapusKW(nomor) {
  tampilkanPopupHapus(
    `Yakin ingin menghapus data ${nomor}?`,
    async () => {
      try {
        const { error } = await db.from('kwitansi')
          .delete().eq('nomor', nomor);
        if (error) throw error;
        tampilkanPopup('Data Kwitansi berhasil dihapus!');
        await loadTabelKW();
        await updatePreviewNomor();
      } catch (err) {
        alert('Gagal hapus: ' + err.message);
      }
    }
  );
}

// ==========================================
// EDIT
// ==========================================
async function editKW(nomor) {
  const { data } = await db.from('kwitansi')
    .select('*').eq('nomor', nomor).single();
  if (!data) return;

  document.getElementById('nama').value       = data.nama       || '';
  document.getElementById('ref-surat').value  = data.ref_surat  || '';
  document.getElementById('layanan').value    = data.layanan    || '';
  document.getElementById('jumlah').value     = data.jumlah     || '';
  document.getElementById('metode').value     = data.metode     || 'Tunai';
  document.getElementById('tgl-bayar').value  = data.tgl_bayar  || '';
  document.getElementById('keterangan').value = data.keterangan || '';

  // Set jam ke dropdown sesuai data tersimpan
  setJamBayar(data.jam_bayar || '00:00');

  // Reset readOnly jumlah
  const inputJumlah            = document.getElementById('jumlah');
  inputJumlah.readOnly         = false;
  inputJumlah.style.background = '';
  inputJumlah.style.color      = '';

  document.getElementById('preview-nomor').textContent = data.nomor;
  window.editNomorKW  = nomor;
  window.isEditModeKW = true;

  const btn       = document.getElementById('btn-simpan');
  btn.textContent = '💾 Update Data';
  btn.onclick     = updateKW;

  window.scrollTo({top: 0, behavior: 'smooth'});
}

// ==========================================
// UPDATE
// ==========================================
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
    metode     : document.getElementById('metode').value     || 'Tunai',
    tgl_bayar  : document.getElementById('tgl-bayar').value  || null,
    jam_bayar  : getJamBayar(),
    keterangan : document.getElementById('keterangan').value || null,
  };

  try {
    const { error } = await db.from('kwitansi')
      .update(data).eq('nomor', window.editNomorKW);
    if (error) throw error;

    window.editNomorKW  = null;
    window.isEditModeKW = false;

    const btn       = document.getElementById('btn-simpan');
    btn.textContent = '💾 Simpan & Cetak';
    btn.onclick     = simpanKwitansi;

    resetFormKwitansi();
    await loadTabelKW();
    await updatePreviewNomor();

    tampilkanPopup('Data Kwitansi berhasil diupdate!');

  } catch (err) {
    alert('Gagal update: ' + err.message);
  }
}

// ==========================================
// PREVIEW NOMOR
// ==========================================
async function updatePreviewNomor() {
  document.getElementById('preview-nomor').textContent =
    await generateNomorOnline('KW', 'kwitansi');
}

// ==========================================
// CETAK
// ==========================================
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
    jamBayar : data.jam_bayar || '',
  });

  window.open('cetak-kwitansi.html?' + params.toString(), '_blank');
}

// ==========================================
// FORMAT TANGGAL SIMPLE
// ==========================================
function formatTglSimple(tgl) {
  return new Date(tgl).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
}

// ==========================================
// JALANKAN SAAT HALAMAN DIBUKA
// ==========================================
updatePreviewNomor();
initDropdownWaktu();
loadTabelKW();
autoFillWaktu();