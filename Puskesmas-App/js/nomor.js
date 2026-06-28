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
  document.getElementById('pesan-sukses').style.display = 'none';
}

function logout() {
  localStorage.removeItem('isLogin');
  window.location.href = 'index.html';
}