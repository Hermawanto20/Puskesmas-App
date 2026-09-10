initPage();

// ==========================================
// AUTO FILL TANGGAL SEKARANG
// ==========================================
function autoFillTanggal() {
  const hari = getHariIni();
  document.getElementById('tgl-mulai').value   = hari;
  document.getElementById('tgl-selesai').value = hari;
  hitungLamaIstirahat();
}

// ==========================================
// HITUNG LAMA ISTIRAHAT OTOMATIS
// ==========================================
function hitungLamaIstirahat() {
  const tglMulai   = document.getElementById('tgl-mulai').value;
  const tglSelesai = document.getElementById('tgl-selesai').value;
  const inputLama  = document.getElementById('lama-sakit');

  if (!tglMulai || !tglSelesai) {
    inputLama.value = '';
    return;
  }

  const mulai   = new Date(tglMulai);
  const selesai = new Date(tglSelesai);

  if (selesai < mulai) {
    alert('Tanggal selesai tidak boleh sebelum tanggal mulai!');
    document.getElementById('tgl-selesai').value = tglMulai;
    inputLama.value = 1;
    return;
  }

  const selisih   = Math.round((selesai - mulai) / (1000 * 60 * 60 * 24)) + 1;
  inputLama.value = selisih;
}

// ==========================================
// RESET FORM SURAT SAKIT
// ==========================================
function resetFormSuratSakit() {
  document.getElementById('nama').value      = '';
  document.getElementById('nik').value       = '';
  document.getElementById('tgl-lahir').value = '';
  document.getElementById('jk').value        = '';
  document.getElementById('alamat').value    = '';
  document.getElementById('diagnosis').value = '';
  document.getElementById('keterangan').value = '';
  document.getElementById('lama-sakit').value = '';
  document.getElementById('dokter').value    = '';

  // Auto-fill tanggal sekarang
  autoFillTanggal();

  // Reload dropdown dokter
  loadDokter();

  const pesanSukses = document.getElementById('pesan-sukses');
  if (pesanSukses) pesanSukses.style.display = 'none';
}

// ==========================================
// SIMPAN SURAT SAKIT
// ==========================================
async function simpanSuratSakit() {
  const nama       = document.getElementById('nama').value.trim();
  const nik        = document.getElementById('nik').value.trim();
  const diagnosis  = document.getElementById('diagnosis').value.trim();
  const keterangan = document.getElementById('keterangan').value.trim();

  if (!nama || !nik) {
    alert('Nama dan NIK wajib diisi!');
    return;
  }

  if (!diagnosis) {
    alert('Diagnosis / Keluhan wajib diisi!');
    return;
  }

  if (!keterangan) {
    alert('Keterangan Tambahan wajib diisi!');
    return;
  }

  const nomor = await generateNomorOnline('SK', 'surat_sakit');

  const data = {
    nomor,
    nama,
    nik,
    tgl_lahir   : document.getElementById('tgl-lahir').value   || null,
    jk          : document.getElementById('jk').value          || null,
    alamat      : document.getElementById('alamat').value      || null,
    diagnosis,
    lama_sakit  : parseInt(document.getElementById('lama-sakit').value) || null,
    tgl_mulai   : document.getElementById('tgl-mulai').value   || null,
    tgl_selesai : document.getElementById('tgl-selesai').value || null,
    dokter      : document.getElementById('dokter').value      || null,
    keterangan,
    bulan       : getBulanIni(),
    posisi      : getPosisi(),
    petugas     : getNamaUser()
  };

  try {
    await simpanSuratSakitOnline(data);
    tampilkanPopup('Surat Sakit berhasil disimpan!\nNomor: ' + nomor);
    resetFormSuratSakit();
    await loadTabelSK();
    await updatePreviewNomor();
  } catch (err) {
    alert('Gagal simpan: ' + err.message);
  }
}

// ==========================================
// LOAD TABEL
// ==========================================
async function loadTabelSK() {
  const tbody = document.getElementById('tabel-sk');
  tbody.innerHTML = `<tr><td colspan="6"
    style="text-align:center;">Memuat data...</td></tr>`;

  try {
    const { data, error } = await db
      .from('surat_sakit')
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
        <td>${d.diagnosis || '-'}</td>
        <td>${d.lama_sakit ? d.lama_sakit + ' hari' : '-'}</td>
        <td>${formatTanggal(d.tanggal)}</td>
        <td>
          <button onclick="cetakSK('${d.nomor}')" class="btn-cetak">🖨️</button>
          <button onclick="editSK('${d.nomor}')" class="btn-edit">✏️</button>
          ${getRole() !== 'pimpinan' ?
          `<button onclick="hapusSK('${d.nomor}')" class="btn-hapus">🗑️</button>` :
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
async function hapusSK(nomor) {
  tampilkanPopupHapus(
    `Yakin ingin menghapus data ${nomor}?`,
    async () => {
      try {
        const { error } = await db.from('surat_sakit')
          .delete().eq('nomor', nomor);
        if (error) throw error;
        tampilkanPopup('Data Surat Sakit berhasil dihapus!');
        await loadTabelSK();
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
async function editSK(nomor) {
  const { data } = await db.from('surat_sakit')
    .select('*').eq('nomor', nomor).single();
  if (!data) return;

  document.getElementById('nama').value        = data.nama        || '';
  document.getElementById('nik').value         = data.nik         || '';
  document.getElementById('tgl-lahir').value   = data.tgl_lahir   || '';
  document.getElementById('jk').value          = data.jk          || '';
  document.getElementById('alamat').value      = data.alamat      || '';
  document.getElementById('diagnosis').value   = data.diagnosis   || '';
  document.getElementById('lama-sakit').value  = data.lama_sakit  || '';
  document.getElementById('tgl-mulai').value   = data.tgl_mulai   || '';
  document.getElementById('tgl-selesai').value = data.tgl_selesai || '';
  document.getElementById('keterangan').value  = data.keterangan  || '';

  // Set dropdown dokter
  await loadDokter();
  document.getElementById('dokter').value = data.dokter || '';

  document.getElementById('preview-nomor').textContent = data.nomor;
  window.editNomorSK  = nomor;
  window.isEditModeSK = true;

  const btn       = document.getElementById('btn-simpan');
  btn.textContent = '💾 Update Data';
  btn.onclick     = updateSK;

  window.scrollTo({top: 0, behavior: 'smooth'});
}

// ==========================================
// UPDATE
// ==========================================
async function updateSK() {
  const nama       = document.getElementById('nama').value.trim();
  const nik        = document.getElementById('nik').value.trim();
  const keterangan = document.getElementById('keterangan').value.trim();

  if (!nama || !nik) {
    alert('Nama dan NIK wajib diisi!');
    return;
  }

  if (!keterangan) {
    alert('Keterangan Tambahan wajib diisi!');
    return;
  }

  const data = {
    nama,
    nik,
    tgl_lahir   : document.getElementById('tgl-lahir').value   || null,
    jk          : document.getElementById('jk').value          || null,
    alamat      : document.getElementById('alamat').value      || null,
    diagnosis   : document.getElementById('diagnosis').value   || null,
    lama_sakit  : parseInt(document.getElementById('lama-sakit').value) || null,
    tgl_mulai   : document.getElementById('tgl-mulai').value   || null,
    tgl_selesai : document.getElementById('tgl-selesai').value || null,
    dokter      : document.getElementById('dokter').value      || null,
    keterangan,
  };

  try {
    const { error } = await db.from('surat_sakit')
      .update(data).eq('nomor', window.editNomorSK);
    if (error) throw error;

    window.editNomorSK  = null;
    window.isEditModeSK = false;

    const btn       = document.getElementById('btn-simpan');
    btn.textContent = '💾 Simpan & Cetak';
    btn.onclick     = simpanSuratSakit;

    resetFormSuratSakit();
    await loadTabelSK();
    await updatePreviewNomor();

    tampilkanPopup('Data Surat Sakit berhasil diupdate!');

  } catch (err) {
    alert('Gagal update: ' + err.message);
  }
}

// ==========================================
// PREVIEW NOMOR
// ==========================================
async function updatePreviewNomor() {
  document.getElementById('preview-nomor').textContent =
    await generateNomorOnline('SK', 'surat_sakit');
}

// ==========================================
// CETAK
// ==========================================
async function cetakSK(nomor) {
  const { data } = await db.from('surat_sakit')
    .select('*').eq('nomor', nomor).single();
  if (!data) return;

  const params = new URLSearchParams({
    nomor      : data.nomor,
    nama       : data.nama,
    nik        : data.nik,
    tglLahir   : data.tgl_lahir   || '',
    jk         : data.jk          || '',
    alamat     : data.alamat      || '',
    diagnosis  : data.diagnosis   || '',
    lamaSakit  : data.lama_sakit  || '',
    tglMulai   : data.tgl_mulai   || '',
    tglSelesai : data.tgl_selesai || '',
    dokter     : data.dokter      || '',
    keterangan : data.keterangan  || ''
  });

  window.open('cetak-surat-sakit.html?' + params.toString(), '_blank');
}

// ==========================================
// JALANKAN SAAT HALAMAN DIBUKA
// ==========================================
updatePreviewNomor();
loadTabelSK();
loadDokter();
autoFillTanggal();