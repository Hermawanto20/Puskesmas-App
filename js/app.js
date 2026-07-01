function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (username === 'admin' && password === 'klinik123') {
    localStorage.setItem('isLogin', 'true');
    window.location.href = 'dashboard.html';
  } else {
    document.getElementById('error-msg').style.display = 'block';
  }
}

document.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') login();
});