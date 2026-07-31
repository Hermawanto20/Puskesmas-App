// Cek login
function cekLogin() {
  const user = getUser();
  if (!user) {
    window.location.href = 'index.html';
  }
}

// Simpan user ke localStorage
function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

// Ambil user dari localStorage
function getUser() {
  return JSON.parse(localStorage.getItem('user') || 'null');
}

// Ambil role user
function getRole() {
  const user = getUser();
  return user ? user.role : null;
}

// Ambil posisi user
function getPosisi() {
  const user = getUser();
  return user ? user.posisi : null;
}

// Ambil nama user
function getNamaUser() {
  const user = getUser();
  return user ? user.nama : null;
}

// Logout
function logout() {
  localStorage.removeItem('user');
  localStorage.removeItem('isLogin');
  window.location.href = 'index.html';
}

// Login
async function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const posisi   = document.getElementById('posisi').value;

  if (!username || !password) {
    document.getElementById('error-msg').textContent = 'Username dan password wajib diisi!';
    document.getElementById('error-msg').style.display = 'block';
    return;
  }

  if (!posisi) {
    document.getElementById('error-msg').textContent = 'Pilih posisi tugas terlebih dahulu!';
    document.getElementById('error-msg').style.display = 'block';
    return;
  }

  try {
    const { data, error } = await db
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) {
      document.getElementById('error-msg').textContent = 'Username atau password salah!';
      document.getElementById('error-msg').style.display = 'block';
      return;
    }

    // Simpan user + posisi
    setUser({ ...data, posisi });
    window.location.href = 'dashboard.html';

  } catch (err) {
    document.getElementById('error-msg').textContent = 'Gagal login: ' + err.message;
    document.getElementById('error-msg').style.display = 'block';
  }
}

document.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') login();
});