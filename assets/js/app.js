
import { APP_CONFIG } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  initializeLogin();
  initializePasswordToggle();
});

function initializeLogin() {
  const form = document.getElementById('loginForm');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const username = document
      .getElementById('username')
      .value.trim();

    const password = document
      .getElementById('password')
      .value;

    if (!username || !password) {
      showMessage('Username dan password wajib diisi.', 'error');
      return;
    }

    if (!APP_CONFIG.API_URL) {
      showMessage(
        'Frontend berhasil dimuat. Koneksi API belum dikonfigurasi.',
        'success'
      );
      return;
    }

    showMessage(
      'Konfigurasi API tersedia. Integrasi autentikasi akan diaktifkan pada tahap berikutnya.',
      'success'
    );
  });
}

function initializePasswordToggle() {
  const input = document.getElementById('password');
  const button = document.getElementById('togglePassword');

  button.addEventListener('click', () => {
    const isHidden = input.type === 'password';

    input.type = isHidden ? 'text' : 'password';

    button.innerHTML = isHidden
      ? '<i class="bi bi-eye-slash"></i>'
      : '<i class="bi bi-eye"></i>';

    button.setAttribute(
      'aria-label',
      isHidden ? 'Sembunyikan password' : 'Tampilkan password'
    );
  });
}

function showMessage(message, type) {
  const element = document.getElementById('loginMessage');

  element.textContent = message;
  element.className = `login-message show ${type}`;
}
