async function simpanSuratSakit() {
  const nama = document.getElementById('nama').value.trim();
  const nik  = document.getElementById('nik').value.trim();

  if (!nama || !nik) {
    alert('Nama dan NIK wajib diisi!');
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
    diagnosis   : document.getElementById('diagnosis').value   || null,
    lama_sakit  : parseInt(document.getElementById('lama-sakit').value) || null,
    tgl_mulai   : document.getElementById('tgl-mulai').value   || null,
    tgl_selesai : document.getElementById('tgl-selesai').value || null,
    keterangan  : document.getElementById('keterangan').value  || null,
    bulan       : getBulanIni()
  };

  try {
    await simpanSuratSakitOnline(data);
    tampilkanPopup('Surat Sakit berhasil disimpan!\nNomor: ' + nomor);
    resetForm();
    await loadTabelSK();
    await updatePreviewNomor();
  } catch (err) {
    alert('Gagal simpan: ' + err.message);
  }
}

async function loadTabelSK() {
  const tbody = document.getElementById('tabel-sk');
  tbody.innerHTML = `<tr><td colspan="6" 
    style="text-align:center;">Memuat data...</td></tr>`;

  try {
    const { data, error } = await db
      .from('surat_sakit')
      .select('*')
      .gte('tanggal', getHariIni() + 'T00:00:00')
      .lte('tanggal', getHariIni() + 'T23:59:59')
      .order('tanggal', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" 
        style="text-align:center;color:#999;">
        Belum ada data bulan ini</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(d => `
      <tr>
        <td><b>${d.nomor}</b></td>
        <td>${d.nama}</td>
        <td>${d.diagnosis || '-'}</td>
        <td>${d.lama_sakit || '-'} hari</td>
        <td>${formatTanggal(d.tanggal)}</td>
        <td>
          <button onclick="cetakSK('${d.nomor}')" class="btn-cetak">🖨️</button>
          <button onclick="editSK('${d.nomor}')" class="btn-edit">✏️</button>
          <button onclick="hapusSK('${d.nomor}')" class="btn-hapus">🗑️</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" 
      style="text-align:center;color:red;">
      Gagal memuat data</td></tr>`;
  }
}

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

  document.getElementById('preview-nomor').textContent = data.nomor;
  window.editNomorSK = nomor;
  window.isEditModeSK = true;

  const btn = document.getElementById('btn-simpan');
  btn.textContent = '💾 Update Data';
  btn.onclick = updateSK;

  window.scrollTo({top: 0, behavior: 'smooth'});
}

async function updateSK() {
  const nama = document.getElementById('nama').value.trim();
  const nik  = document.getElementById('nik').value.trim();

  if (!nama || !nik) {
    alert('Nama dan NIK wajib diisi!');
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
    keterangan  : document.getElementById('keterangan').value  || null,
  };

  try {
    const { error } = await db.from('surat_sakit')
      .update(data).eq('nomor', window.editNomorSK);
    if (error) throw error;

    window.editNomorSK = null;
    window.isEditModeSK = false;

   const btn = document.getElementById('btn-simpan');
    btn.textContent = '💾 Simpan & Cetak';
    btn.onclick = simpanSuratSakit;

    resetForm();
    await loadTabelSK();
    await updatePreviewNomor();

tampilkanPopup('Data Surat Sakit berhasil diupdate!');

  } catch (err) {
    alert('Gagal update: ' + err.message);
  }
}

async function updatePreviewNomor() {
  document.getElementById('preview-nomor').textContent =
    await generateNomorOnline('SK', 'surat_sakit');
}

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
    keterangan : data.keterangan  || ''
  });

  window.open('cetak-surat-sakit.html?' + params.toString(), '_blank');
}

// Jalankan saat halaman dibuka
updatePreviewNomor();
loadTabelSK();