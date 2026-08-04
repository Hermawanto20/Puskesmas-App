initPage();
let dataLaporan = { ss: [], sk: [], kw: [] };

function initFilter() {
  const now    = new Date();
  const tahun  = now.getFullYear();
  const bulan  = String(now.getMonth() + 1).padStart(2, '0');
  const hari   = String(now.getDate()).padStart(2, '0');
  document.getElementById('filter-dari').value   = `${tahun}-${bulan}-01`;
  document.getElementById('filter-sampai').value = `${tahun}-${bulan}-${hari}`;
  document.getElementById('filter-jenis').value  = 'semua';
}

async function tampilkanLaporan() {
  const dari   = document.getElementById('filter-dari').value;
  const sampai = document.getElementById('filter-sampai').value;
  const jenis  = document.getElementById('filter-jenis').value;

  if (!dari || !sampai) {
    alert('Pilih tanggal awal dan tanggal akhir!');
    return;
  }

  if (dari > sampai) {
    alert('Tanggal awal tidak boleh lebih besar dari tanggal akhir!');
    return;
  }

  document.getElementById('tabel-ss-area').style.display  = 'none';
  document.getElementById('tabel-sk-area').style.display  = 'none';
  document.getElementById('tabel-kw-area').style.display  = 'none';
  document.getElementById('pesan-kosong').style.display   = 'none';
  document.getElementById('export-area').style.display    = 'none';
  document.getElementById('ringkasan-area').style.display = 'none';

  dataLaporan = { ss: [], sk: [], kw: [] };

  try {
    if (jenis === 'semua' || jenis === 'surat_sehat') {
      const { data } = await db.from('surat_sehat')
        .select('*')
        .gte('tanggal', dari + 'T00:00:00+07:00')
        .lte('tanggal', sampai + 'T23:59:59+07:00')
        .order('tanggal', { ascending: true });
      dataLaporan.ss = data || [];
    }

    if (jenis === 'semua' || jenis === 'surat_sakit') {
      const { data } = await db.from('surat_sakit')
        .select('*')
        .gte('tanggal', dari + 'T00:00:00+07:00')
        .lte('tanggal', sampai + 'T23:59:59+07:00')
        .order('tanggal', { ascending: true });
      dataLaporan.sk = data || [];
    }

    if (jenis === 'semua' || jenis === 'kwitansi') {
      const { data } = await db.from('kwitansi')
        .select('*')
        .gte('tanggal', dari + 'T00:00:00+07:00')
        .lte('tanggal', sampai + 'T23:59:59+07:00')
        .order('tanggal', { ascending: true });
      dataLaporan.kw = data || [];
    }

    const totalData = dataLaporan.ss.length +
                      dataLaporan.sk.length +
                      dataLaporan.kw.length;

    if (totalData === 0) {
      document.getElementById('pesan-kosong').style.display = 'block';
      return;
    }

    document.getElementById('ringkasan-ss').textContent = dataLaporan.ss.length;
    document.getElementById('ringkasan-sk').textContent = dataLaporan.sk.length;
    document.getElementById('ringkasan-kw').textContent = dataLaporan.kw.length;
    document.getElementById('ringkasan-area').style.display = 'block';

    if (dataLaporan.ss.length > 0) {
      renderTabelSS(dataLaporan.ss);
      document.getElementById('tabel-ss-area').style.display = 'block';
    }

    if (dataLaporan.sk.length > 0) {
      renderTabelSK(dataLaporan.sk);
      document.getElementById('tabel-sk-area').style.display = 'block';
    }

    if (dataLaporan.kw.length > 0) {
      renderTabelKW(dataLaporan.kw);
      document.getElementById('tabel-kw-area').style.display = 'block';
    }

    document.getElementById('export-area').style.display = 'block';
    document.getElementById('info-total-laporan').textContent =
      `Total: ${totalData} data`;

  } catch (err) {
    alert('Gagal memuat data: ' + err.message);
  }
}

function renderTabelSS(data) {
  document.getElementById('tbody-ss').innerHTML = data.map((d, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><b>${d.nomor}</b></td>
      <td>${d.nama}</td>
      <td>${d.nik || '-'}</td>
      <td>${d.tgl_lahir ? formatTglSimple(d.tgl_lahir) : '-'}</td>
      <td>${d.jk || '-'}</td>
      <td>${d.alamat || '-'}</td>
      <td>${d.keperluan || '-'}</td>
      <td>${d.tgl_periksa ? formatTglSimple(d.tgl_periksa) : '-'}</td>
      <td>${d.dokter || '-'}</td>
      <td>${d.keterangan || '-'}</td>
      <td>${d.posisi || '-'}</td>
      <td>${d.petugas || '-'}</td>
      <td>${formatTanggal(d.tanggal)}</td>
    </tr>
  `).join('');
}

function renderTabelSK(data) {
  document.getElementById('tbody-sk').innerHTML = data.map((d, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><b>${d.nomor}</b></td>
      <td>${d.nama}</td>
      <td>${d.nik || '-'}</td>
      <td>${d.tgl_lahir ? formatTglSimple(d.tgl_lahir) : '-'}</td>
      <td>${d.jk || '-'}</td>
      <td>${d.alamat || '-'}</td>
      <td>${d.diagnosis || '-'}</td>
      <td>${d.lama_sakit ? d.lama_sakit + ' hari' : '-'}</td>
      <td>${d.tgl_mulai ? formatTglSimple(d.tgl_mulai) : '-'}</td>
      <td>${d.tgl_selesai ? formatTglSimple(d.tgl_selesai) : '-'}</td>
      <td>${d.dokter || '-'}</td>
      <td>${d.keterangan || '-'}</td>
      <td>${d.posisi || '-'}</td>
      <td>${d.petugas || '-'}</td>
      <td>${formatTanggal(d.tanggal)}</td>
    </tr>
  `).join('');
}

function renderTabelKW(data) {
  document.getElementById('tbody-kw').innerHTML = data.map((d, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><b>${d.nomor}</b></td>
      <td>${d.nama}</td>
      <td>${d.ref_surat || '-'}</td>
      <td>${d.layanan || '-'}</td>
      <td>${formatRupiah(d.jumlah)}</td>
      <td>${d.metode || '-'}</td>
      <td>${d.tgl_bayar ? formatTglSimple(d.tgl_bayar) : '-'}</td>
      <td>${d.keterangan || '-'}</td>
      <td>${d.posisi || '-'}</td>
      <td>${d.petugas || '-'}</td>
      <td>${formatTanggal(d.tanggal)}</td>
    </tr>
  `).join('');
}

function formatTglSimple(tgl) {
  return new Date(tgl).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
}

function exportExcel() {
  const dari    = document.getElementById('filter-dari').value;
  const sampai  = document.getElementById('filter-sampai').value;
  const periode = `${formatTglSimple(dari)} - ${formatTglSimple(sampai)}`;
  const wb      = XLSX.utils.book_new();

  if (dataLaporan.ss.length > 0) {
    const rows = [
      ['LAPORAN SURAT SEHAT'],
      ['UPTD Puskesmas Sukmajaya'],
      [`Periode: ${periode}`],
      [],
      ['No','Nomor Surat','Nama','NIK','Tgl Lahir','Jenis Kelamin',
       'Alamat','Keperluan','Tgl Periksa','Dokter','Keterangan',
       'Posisi','Petugas','Tanggal Input'],
      ...dataLaporan.ss.map((d, i) => [
        i+1, d.nomor, d.nama, d.nik||'-',
        d.tgl_lahir ? formatTglSimple(d.tgl_lahir) : '-',
        d.jk||'-', d.alamat||'-', d.keperluan||'-',
        d.tgl_periksa ? formatTglSimple(d.tgl_periksa) : '-',
        d.dokter||'-', d.keterangan||'-',
        d.posisi||'-', d.petugas||'-', formatTanggal(d.tanggal)
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      {wch:5},{wch:20},{wch:25},{wch:20},{wch:15},{wch:15},
      {wch:30},{wch:20},{wch:15},{wch:20},{wch:20},{wch:12},{wch:20},{wch:22}
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Surat Sehat');
  }

  if (dataLaporan.sk.length > 0) {
    const rows = [
      ['LAPORAN SURAT SAKIT'],
      ['UPTD Puskesmas Sukmajaya'],
      [`Periode: ${periode}`],
      [],
      ['No','Nomor Surat','Nama','NIK','Tgl Lahir','Jenis Kelamin',
       'Alamat','Diagnosis','Lama Sakit','Tgl Mulai','Tgl Selesai',
       'Dokter','Keterangan','Posisi','Petugas','Tanggal Input'],
      ...dataLaporan.sk.map((d, i) => [
        i+1, d.nomor, d.nama, d.nik||'-',
        d.tgl_lahir ? formatTglSimple(d.tgl_lahir) : '-',
        d.jk||'-', d.alamat||'-', d.diagnosis||'-',
        d.lama_sakit ? d.lama_sakit+' hari' : '-',
        d.tgl_mulai ? formatTglSimple(d.tgl_mulai) : '-',
        d.tgl_selesai ? formatTglSimple(d.tgl_selesai) : '-',
        d.dokter||'-', d.keterangan||'-',
        d.posisi||'-', d.petugas||'-', formatTanggal(d.tanggal)
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      {wch:5},{wch:20},{wch:25},{wch:20},{wch:15},{wch:15},
      {wch:30},{wch:20},{wch:12},{wch:15},{wch:15},{wch:20},
      {wch:20},{wch:12},{wch:20},{wch:22}
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Surat Sakit');
  }

  if (dataLaporan.kw.length > 0) {
    const rows = [
      ['LAPORAN KWITANSI'],
      ['UPTD Puskesmas Sukmajaya'],
      [`Periode: ${periode}`],
      [],
      ['No','Nomor Kwitansi','Nama','Ref Surat','Layanan',
       'Jumlah','Metode','Tgl Bayar','Keterangan',
       'Posisi','Petugas','Tanggal Input'],
      ...dataLaporan.kw.map((d, i) => [
        i+1, d.nomor, d.nama, d.ref_surat||'-',
        d.layanan||'-', d.jumlah||0, d.metode||'-',
        d.tgl_bayar ? formatTglSimple(d.tgl_bayar) : '-',
        d.keterangan||'-', d.posisi||'-',
        d.petugas||'-', formatTanggal(d.tanggal)
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      {wch:5},{wch:20},{wch:25},{wch:20},{wch:20},
      {wch:15},{wch:15},{wch:15},{wch:20},{wch:12},{wch:20},{wch:22}
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Kwitansi');
  }

  XLSX.writeFile(wb, `Laporan_Puskesmas_${dari}_sd_${sampai}.xlsx`);
}

function resetLaporan() {
  initFilter();
  document.getElementById('tabel-ss-area').style.display  = 'none';
  document.getElementById('tabel-sk-area').style.display  = 'none';
  document.getElementById('tabel-kw-area').style.display  = 'none';
  document.getElementById('pesan-kosong').style.display   = 'none';
  document.getElementById('export-area').style.display    = 'none';
  document.getElementById('ringkasan-area').style.display = 'none';
  dataLaporan = { ss: [], sk: [], kw: [] };
}

function logout() {
  localStorage.removeItem('isLogin');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// Jalankan saat halaman dibuka
initFilter();