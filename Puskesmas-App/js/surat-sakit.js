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
    document.getElementById('pesan-sukses').style.display = 'block';
    setTimeout(() => {
      document.getElementById('pesan-sukses').style.display = 'none';
    }, 3000);
    resetForm();
    await loadTabelSK();
    await updatePreviewNomor();
  } catch (err) {
    alert('Gagal simpan: ' + err.message);
  }
}

async function loadTabelSK() {
  const tbody = document.getElementById('tabel-sk');
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Memuat data...</td></tr>`;

  try {
    const data = await getSuratSakitBulanIni();

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" 
        style="text-align:center;color:#999;">Belum ada data bulan ini</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(d => `
      <tr>
        <td><b>${d.nomor}</b></td>
        <td>${d.nama}</td>
        <td>${d.diagnosis || '-'}</td>
        <td>${d.lama_sakit || '-'} hari</td>
        <td>${formatTanggal(d.tanggal)}</td>
        <td><button onclick="cetakSK('${d.nomor}')" class="btn-cetak">🖨️ Cetak</button></td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;">
      Gagal memuat data</td></tr>`;
  }
}

async function updatePreviewNomor() {
  document.getElementById('preview-nomor').textContent =
    await generateNomorOnline('SK', 'surat_sakit');
}

async function cetakSK(nomor) {
  const { data } = await db.from('surat_sakit').select('*').eq('nomor', nomor).single();
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

updatePreviewNomor();
loadTabelSK();