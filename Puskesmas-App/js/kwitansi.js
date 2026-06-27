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
    document.getElementById('pesan-sukses').style.display = 'block';
    setTimeout(() => {
      document.getElementById('pesan-sukses').style.display = 'none';
    }, 3000);
    resetForm();
    await loadTabelKW();
    await updatePreviewNomor();
  } catch (err) {
    alert('Gagal simpan: ' + err.message);
  }
}

async function loadTabelKW() {
  const tbody = document.getElementById('tabel-kw');
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Memuat data...</td></tr>`;

  try {
    const data = await getKwitansiBulanIni();

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" 
        style="text-align:center;color:#999;">Belum ada data bulan ini</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(d => `
      <tr>
        <td><b>${d.nomor}</b></td>
        <td>${d.nama}</td>
        <td>${d.layanan || '-'}</td>
        <td>${formatRupiah(d.jumlah)}</td>
        <td>${formatTanggal(d.tanggal)}</td>
        <td><button onclick="cetakKW('${d.nomor}')" class="btn-cetak">🖨️ Cetak</button></td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;">
      Gagal memuat data</td></tr>`;
  }
}

async function updatePreviewNomor() {
  document.getElementById('preview-nomor').textContent =
    await generateNomorOnline('KW', 'kwitansi');
}

async function cetakKW(nomor) {
  const { data } = await db.from('kwitansi').select('*').eq('nomor', nomor).single();
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

updatePreviewNomor();
loadTabelKW();