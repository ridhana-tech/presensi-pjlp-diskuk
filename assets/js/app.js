
import { loginUser, validateSession } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  initializeLogin();
  initializePasswordToggle();
  checkExistingSession();
});


/**
 * Proses form login.
 */
function initializeLogin() {
  const form = document.getElementById('loginForm');

  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document
      .getElementById('username')
      .value.trim();

    const password = document
      .getElementById('password')
      .value;

    if (!username || !password) {
      showMessage(
        'Username dan password wajib diisi.',
        'error'
      );
      return;
    }

    const submitButton = form.querySelector(
      'button[type="submit"]'
    );

    const originalText = submitButton
      ? submitButton.textContent
      : '';

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Memproses...';
      }

      showMessage('Sedang memverifikasi akun...', 'success');

      const result = await loginUser(username, password);

      showMessage(
        `Login berhasil. Selamat datang, ${result.user.username}.`,
        'success'
      );

      console.log('Login berhasil:', {
        username: result.user.username,
        role: result.user.role,
        expiresAt: result.expiresAt
      });

      // Dashboard akan diintegrasikan pada tahap berikutnya.

    } catch (error) {
      showMessage(
        error.message || 'Login gagal. Silakan coba kembali.',
        'error'
      );

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  });
}


/**
 * Periksa session yang masih aktif.
 */
async function checkExistingSession() {
  const token = localStorage.getItem('pjlp_session_token');

  if (!token) return;

  try {
    const user = await validateSession();

    if (user) {
      showMessage(
        `Session aktif. Selamat datang kembali, ${user.username}.`,
        'success'
      );

      console.log('Session aktif:', {
        username: user.username,
        role: user.role
      });
    }

  } catch (error) {
    console.error('Validasi session gagal:', error);
  }
}


/**
 * Tampilkan/sembunyikan password.
 */
function initializePasswordToggle() {
  const input = document.getElementById('password');
  const button = document.getElementById('togglePassword');

  if (!input || !button) return;

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


/**
 * Menampilkan pesan login.
 */
function showMessage(message, type) {
  const element = document.getElementById('loginMessage');

  if (!element) return;

  element.textContent = message;
  element.className = `login-message show ${type}`;
}
