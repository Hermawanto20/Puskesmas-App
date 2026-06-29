const SUPABASE_URL = 'https://wfunrcpcbbespvkzzeeh.supabase.co'; // ganti [PROJECT-ID] dengan ID kamu
const SUPABASE_KEY = 'sb_publishable_4STOXEoMoKzArYTLgJ4iIQ_nI78QtSw';                      // ganti dengan Publishable key kamu

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// FUNGSI PENOMORAN OTOMATIS (dari Supabase)
// ==========================================
async function generateNomorOnline(prefix, tabelName) {
  const now    = new Date();
  const tahun  = now.getFullYear();
  const bulan  = String(now.getMonth() + 1).padStart(2, '0');
  const bulanIni = `${tahun}-${bulan}`;

  // Ambil nomor terakhir bulan ini
  const { data } = await db
    .from(tabelName)
    .select('nomor')
    .eq('bulan', bulanIni)
    .order('nomor', { ascending: false })
    .limit(1);

  let urutan = 1;

  if (data && data.length > 0) {
    const nomorTerakhir = data[0].nomor;
    const bagian = nomorTerakhir.split('-');
    const urutanTerakhir = parseInt(bagian[bagian.length - 1]);
    urutan = urutanTerakhir + 1;
  }

  return `${prefix}-${tahun}-${bulan}-${String(urutan).padStart(4, '0')}`;
}

// ==========================================
// SURAT SEHAT
// ==========================================
async function simpanSuratSehatOnline(data) {
  const { error } = await db.from('surat_sehat').insert([data]);
  if (error) throw error;
}

async function getSuratSehatBulanIni() {
  const bulanIni = getBulanIni();
  const { data, error } = await db
    .from('surat_sehat')
    .select('*')
    .eq('bulan', bulanIni)
    .order('tanggal', { ascending: false });
  if (error) throw error;
  return data;
}

// ==========================================
// SURAT SAKIT
// ==========================================
async function simpanSuratSakitOnline(data) {
  const { error } = await db.from('surat_sakit').insert([data]);
  if (error) throw error;
}

async function getSuratSakitBulanIni() {
  const bulanIni = getBulanIni();
  const { data, error } = await db
    .from('surat_sakit')
    .select('*')
    .eq('bulan', bulanIni)
    .order('tanggal', { ascending: false });
  if (error) throw error;
  return data;
}

// ==========================================
// KWITANSI
// ==========================================
async function simpanKwitansiOnline(data) {
  const { error } = await db.from('kwitansi').insert([data]);
  if (error) throw error;
}

async function getKwitansiBulanIni() {
  const bulanIni = getBulanIni();
  const { data, error } = await db
    .from('kwitansi')
    .select('*')
    .eq('bulan', bulanIni)
    .order('tanggal', { ascending: false });
  if (error) throw error;
  return data;
}

// ==========================================
// DASHBOARD
// ==========================================
async function getStatistikBulanIni() {
  const bulanIni = getBulanIni();

  const [ss, sk, kw] = await Promise.all([
    db.from('surat_sehat').select('*', { count: 'exact', head: true }).eq('bulan', bulanIni),
    db.from('surat_sakit').select('*', { count: 'exact', head: true }).eq('bulan', bulanIni),
    db.from('kwitansi').select('*', { count: 'exact', head: true }).eq('bulan', bulanIni),
  ]);

  return {
    totalSS: ss.count || 0,
    totalSK: sk.count || 0,
    totalKW: kw.count || 0,
  };
}
  };
}
