async function simpanSuratSehat() {
  const nama = document.getElementById('nama').value.trim();
  const nik  = document.getElementById('nik').value.trim();

  if (!nama || !nik) {
    alert('Nama dan NIK wajib diisi!');
    return;
  }

  const nomor = await generateNomorOnline('SS', 'surat_sehat');

  const data = {
    nomor,
    nama,
    nik,
    tgl_lahir   : document.getElementById('tgl-lahir').value   || null,
    jk          : document.getElementById('jk').value          || null,
    alamat      : document.getElementById('alamat').value      || null,
    keperluan   : document.getElementById('keperluan').value   || null,
    tgl_periksa : document.getElementById('tgl-periksa').value || null,
    keterangan  : document.getElementById('keterangan').value  || null,
    bulan       : getBulanIni()
  };

  try {
    await simpanSuratSehatOnline(data);
    tampilkanPopup('Surat Sehat berhasil disimpan!\nNomor: ' + nomor);
    resetForm();
    await loadTabelSS();
    await updatePreviewNomor();
  } catch (err) {
    alert('Gagal simpan: ' + err.message);
  }
}

async function loadTabelSS() {
  const tbody = document.getElementById('tabel-ss');
  tbody.innerHTML = `<tr><td colspan="5" 
    style="text-align:center;">Memuat data...</td></tr>`;

  try {
    const { data, error } = await db
      .from('surat_sehat')
      .select('*')
      .gte('tanggal', getHariIni() + 'T00:00:00')
      .lte('tanggal', getHariIni() + 'T23:59:59')
      .order('tanggal', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" 
        style="text-align:center;color:#999;">
        Belum ada data bulan ini</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(d => `
      <tr>
        <td><b>${d.nomor}</b></td>
        <td>${d.nama}</td>
        <td>${d.keperluan || '-'}</td>
        <td>${formatTanggal(d.tanggal)}</td>
        <td>
          <button onclick="cetakSS('${d.nomor}')" class="btn-cetak">🖨️</button>
          <button onclick="editSS('${d.nomor}')" class="btn-edit">✏️</button>
          <button onclick="hapusSS('${d.nomor}')" class="btn-hapus">🗑️</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" 
      style="text-align:center;color:red;">
      Gagal memuat data</td></tr>`;
  }
}

async function hapusSS(nomor) {
  tampilkanPopupHapus(
    `Yakin ingin menghapus data ${nomor}?`,
    async () => {
      try {
        const { error } = await db.from('surat_sehat')
          .delete().eq('nomor', nomor);
        if (error) throw error;
        tampilkanPopup('Data Surat Sehat berhasil dihapus!');
        initFilterSS();
        await loadTabelSS();
        await updatePreviewNomor();
      } catch (err) {
        alert('Gagal hapus: ' + err.message);
      }
    }
  );
}

async function editSS(nomor) {
  const { data } = await db.from('surat_sehat')
    .select('*').eq('nomor', nomor).single();
  if (!data) return;

  document.getElementById('nama').value        = data.nama        || '';
  document.getElementById('nik').value         = data.nik         || '';
  document.getElementById('tgl-lahir').value   = data.tgl_lahir   || '';
  document.getElementById('jk').value          = data.jk          || '';
  document.getElementById('alamat').value      = data.alamat      || '';
  document.getElementById('keperluan').value   = data.keperluan   || '';
  document.getElementById('tgl-periksa').value = data.tgl_periksa || '';
  document.getElementById('keterangan').value  = data.keterangan  || '';

  document.getElementById('preview-nomor').textContent = data.nomor;
  window.editNomorSS = nomor;
  window.isEditModeSS = true;

  const btn = document.getElementById('btn-simpan');
  btn.textContent = '💾 Update Data';
  btn.onclick = updateSS;

  window.scrollTo({top: 0, behavior: 'smooth'});
}

async function updateSS() {
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
    keperluan   : document.getElementById('keperluan').value   || null,
    tgl_periksa : document.getElementById('tgl-periksa').value || null,
    keterangan  : document.getElementById('keterangan').value  || null,
  };

  try {
    const { error } = await db.from('surat_sehat')
      .update(data).eq('nomor', window.editNomorSS);
    if (error) throw error;

    window.editNomorSS = null;
    window.isEditModeSS = false;

    const btn = document.getElementById('btn-simpan');
    btn.textContent = '💾 Simpan & Cetak';
    btn.onclick = simpanSuratSehat;

    resetForm();
    await loadTabelSS();
    await updatePreviewNomor();

tampilkanPopup('Data Surat Sehat berhasil diupdate!');

  } catch (err) {
    alert('Gagal update: ' + err.message);
  }
}

async function updatePreviewNomor() {
  document.getElementById('preview-nomor').textContent =
    await generateNomorOnline('SS', 'surat_sehat');
}

async function cetakSS(nomor) {
  const { data } = await db.from('surat_sehat')
    .select('*').eq('nomor', nomor).single();
  if (!data) return;

  const params = new URLSearchParams({
    nomor      : data.nomor,
    nama       : data.nama,
    nik        : data.nik,
    tglLahir   : data.tgl_lahir   || '',
    jk         : data.jk          || '',
    alamat     : data.alamat      || '',
    keperluan  : data.keperluan   || '',
    tglPeriksa : data.tgl_periksa || '',
    keterangan : data.keterangan  || ''
  });

  window.open('cetak-surat-sehat.html?' + params.toString(), '_blank');
}

// Jalankan saat halaman dibuka
updatePreviewNomor();
loadTabelSS();