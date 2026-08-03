// Generate nomor otomatis format: PREFIX-YYYY-MM-XXXX
function generateNomor(prefix, storageKey) {
  const now = new Date();
  const tahun = now.getFullYear();
  const bulan = String(now.getMonth() + 1).padStart(2, '0');
  const bulanIni = `${tahun}-${bulan}`;

  const data = JSON.parse(localStorage.getItem(storageKey) || '[]');
  const dataBulanIni = data.filter(d => d.bulan === bulanIni);
  const urutan = String(dataBulanIni.length + 1).padStart(4, '0');

  return `${prefix}-${tahun}-${bulan}-${urutan}`;
}

function getBulanIni() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getHariIni() {
  const now = new Date();
  const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  const tahun = wib.getUTCFullYear();
  const bulan = String(wib.getUTCMonth() + 1).padStart(2, '0');
  const hari  = String(wib.getUTCDate()).padStart(2, '0');
  return `${tahun}-${bulan}-${hari}`;
}

function formatRupiah(angka) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(angka);
}

function formatTanggal(tgl) {
  const d = new Date(tgl);
  const tanggal = d.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  const jam = d.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit',
    hour12: false
  }).replace('.', ':');
  return `${tanggal}, ${jam}`;
}

function resetForm() {
  document.querySelectorAll('input, textarea, select').forEach(el => {
    el.value = '';
  });
  const pesanSukses = document.getElementById('pesan-sukses');
  if (pesanSukses) pesanSukses.style.display = 'none';
}

function logout() {
  localStorage.removeItem('isLogin');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

function tampilkanPopup(pesan) {
  document.getElementById('popup-msg').textContent = pesan;
  document.getElementById('popup-sukses').style.display = 'flex';
  const btnOK = document.getElementById('btn-popup-ok');
  btnOK.textContent = 'OK';
  btnOK.onclick = tutupPopup;
}

function tutupPopup() {
  document.getElementById('popup-sukses').style.display = 'none';
}

function tampilkanPopupHapus(pesan, onKonfirmasi) {
  document.getElementById('popup-hapus-msg').textContent = pesan;
  document.getElementById('popup-hapus').style.display = 'flex';
  const btnOk = document.getElementById('btn-hapus-ok');
  btnOk.onclick = function() {
    tutupPopupHapus();
    onKonfirmasi();
  };
}

function tutupPopupHapus() {
  document.getElementById('popup-hapus').style.display = 'none';
}

function initPage() {
  const user = getUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  const role = user.role;

  // Redirect pimpinan kalau buka halaman selain dashboard & laporan
  const halamanSekarang = window.location.pathname.split('/').pop();
  const halamanDiizinkan = ['dashboard.html', 'laporan.html', ''];
  if (role === 'pimpinan' && !halamanDiizinkan.includes(halamanSekarang)) {
    alert('Akses ditolak! Anda hanya bisa mengakses Dashboard dan Laporan.');
    window.location.href = 'dashboard.html';
    return;
  }

  // Tampilkan nama user di navbar
  const namaEl = document.getElementById('nama-user');
  if (namaEl) {
    namaEl.textContent = `👤 ${user.nama} | ${user.posisi || '-'} | ${role}`;
  }

  // Sembunyikan menu berdasarkan role
  const menuSuratSehat = document.getElementById('menu-surat-sehat');
  const menuSuratSakit = document.getElementById('menu-surat-sakit');
  const menuKwitansi   = document.getElementById('menu-kwitansi');
  const menuUser       = document.getElementById('menu-user');

  if (role === 'pimpinan') {
    if (menuSuratSehat) menuSuratSehat.style.display = 'none';
    if (menuSuratSakit) menuSuratSakit.style.display = 'none';
    if (menuKwitansi)   menuKwitansi.style.display   = 'none';
    if (menuUser)       menuUser.style.display        = 'none';
  } else if (role !== 'admin') {
    if (menuUser) menuUser.style.display = 'none';
  }
} // ← tutup initPage

function getNamaDokter() {
  const user = getUser();
  return user ? user.nama_dokter || '' : '';
}

async function loadDokter() {
  const selectDokter = document.getElementById('dokter');
  if (!selectDokter) return;

  try {
    const { data, error } = await db
      .from('users')
      .select('nama_dokter')
      .not('nama_dokter', 'is', null)
      .neq('nama_dokter', '');

    if (error) throw error;

    selectDokter.innerHTML = '<option value="">-- Pilih Dokter --</option>';

    if (!data || data.length === 0) return;

    const unik = [...new Set(data.map(d => d.nama_dokter))];

    unik.forEach(nama => {
      const option = document.createElement('option');
      option.value = nama;
      option.textContent = nama;
      selectDokter.appendChild(option);
    });

    const namaDokterLogin = getNamaDokter();
    if (namaDokterLogin) {
      selectDokter.value = namaDokterLogin;
    }

  } catch (err) {
    console.error('Gagal load dokter:', err);
  }
}