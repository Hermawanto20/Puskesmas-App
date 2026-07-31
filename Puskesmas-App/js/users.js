// Cek harus admin
function cekAdmin() {
  const user = getUser();
  if (!user || user.role !== 'admin') {
    alert('Akses ditolak! Halaman ini hanya untuk admin.');
    window.location.href = 'dashboard.html';
  }
}

async function simpanUser() {
  const nama     = document.getElementById('nama').value.trim();
  const username = document.getElementById('username-baru').value.trim();
  const password = document.getElementById('password-baru').value.trim();
  const role     = document.getElementById('role').value;

  if (!nama || !username || !password) {
    alert('Nama, username, dan password wajib diisi!');
    return;
  }

  // Cek mode edit atau tambah baru
  if (window.editUserId) {
    await updateUser(nama, username, password, role);
    return;
  }

  try {
    const { error } = await db.from('users').insert([{
      nama, username, password, role
    }]);

    if (error) {
      if (error.message.includes('duplicate')) {
        alert('Username sudah dipakai! Gunakan username lain.');
      } else {
        throw error;
      }
      return;
    }

    tampilkanPopup(`User ${nama} berhasil ditambahkan!`);
    resetFormUser();
    await loadUsers();

  } catch (err) {
    alert('Gagal simpan: ' + err.message);
  }
}

async function loadUsers() {
  const tbody = document.getElementById('tabel-users');
  tbody.innerHTML = `<tr><td colspan="6" 
    style="text-align:center;">Memuat data...</td></tr>`;

  try {
    const { data, error } = await db
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" 
        style="text-align:center;color:#999;">
        Belum ada user</td></tr>`;
      return;
    }

    const currentUser = getUser();

    tbody.innerHTML = data.map((d, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${d.nama}</td>
        <td>${d.username}</td>
        <td>
          <span class="badge ${d.role === 'admin' ? 'badge-blue' : 'badge-green'}">
            ${d.role}
          </span>
        </td>
        <td>${formatTanggal(d.created_at)}</td>
        <td>
          <button onclick="editUser('${d.id}')" class="btn-edit">✏️</button>
          ${d.username !== currentUser.username ?
            `<button onclick="hapusUser('${d.id}', '${d.nama}')" 
              class="btn-hapus">🗑️</button>` :
            `<span style="color:#999; font-size:12px;">Akun aktif</span>`
          }
        </td>
      </tr>
    `).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" 
      style="text-align:center;color:red;">
      Gagal memuat data</td></tr>`;
  }
}

async function editUser(id) {
  const { data } = await db.from('users')
    .select('*').eq('id', id).single();
  if (!data) return;

  document.getElementById('nama').value          = data.nama;
  document.getElementById('username-baru').value = data.username;
  document.getElementById('password-baru').value = data.password;
  document.getElementById('role').value          = data.role;

  window.editUserId = id;

  const btn = document.getElementById('btn-simpan');
  btn.textContent = '💾 Update User';
  btn.onclick = simpanUser;

  window.scrollTo({top: 0, behavior: 'smooth'});
}

async function updateUser(nama, username, password, role) {
  try {
    const { error } = await db.from('users')
      .update({ nama, username, password, role })
      .eq('id', window.editUserId);

    if (error) throw error;

    // Update localStorage kalau edit akun sendiri
    const currentUser = getUser();
    if (currentUser.id === window.editUserId) {
      setUser({ ...currentUser, nama, username, role });
      initPage();
    }

    window.editUserId = null;

    const btn = document.getElementById('btn-simpan');
    btn.textContent = '💾 Simpan User';
    btn.onclick = simpanUser;

    resetFormUser();
    await loadUsers();
    tampilkanPopup(`User ${nama} berhasil diupdate!`);

  } catch (err) {
    alert('Gagal update: ' + err.message);
  }
}

function hapusUser(id, nama) {
  tampilkanPopupHapus(
    `Yakin ingin menghapus user "${nama}"?`,
    async () => {
      try {
        const { error } = await db.from('users')
          .delete().eq('id', id);
        if (error) throw error;
        tampilkanPopup(`User ${nama} berhasil dihapus!`);
        await loadUsers();
      } catch (err) {
        alert('Gagal hapus: ' + err.message);
      }
    }
  );
}

function resetFormUser() {
  document.getElementById('nama').value          = '';
  document.getElementById('username-baru').value = '';
  document.getElementById('password-baru').value = '';
  document.getElementById('role').value          = 'petugas';
  window.editUserId = null;

  const btn = document.getElementById('btn-simpan');
  btn.textContent = '💾 Simpan User';
  btn.onclick = simpanUser;
}

// Jalankan saat halaman dibuka
cekAdmin();
initPage();
loadUsers();