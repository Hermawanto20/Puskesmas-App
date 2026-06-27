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
    document.getElementById('pesan-sukses').style.display = 'block';
    setTimeout(() => {
      document.getElementById('pesan-sukses').style.display = 'none';
    }, 3000);
    resetForm();
    await loadTabelSS();
    await updatePreviewNomor();
  } catch (err) {
    alert('Gagal simpan: ' + err.message);
  }
}

async function loadTabelSS() {
  const tbody = document.getElementById('tabel-ss');
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Memuat data...</td></tr>`;

  try {
    const data = await getSuratSehatBulanIni();

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" 
        style="text-align:center;color:#999;">Belum ada data bulan ini</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(d => `
      <tr>
        <td><b>${d.nomor}</b></td>
        <td>${d.nama}</td>
        <td>${d.nik}</td>
        <td>${d.keperluan || '-'}</td>
        <td>${formatTanggal(d.tanggal)}</td>
        <td><button onclick="cetakSS('${d.nomor}')" class="btn-cetak">🖨️ Cetak</button></td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;">
      Gagal memuat data</td></tr>`;
  }
}

async function updatePreviewNomor() {
  document.getElementById('preview-nomor').textContent =
    await generateNomorOnline('SS', 'surat_sehat');
}

async function cetakSS(nomor) {
  const { data } = await db.from('surat_sehat').select('*').eq('nomor', nomor).single();
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