
import {
  loginUser,
  validateSession,
  logoutUser,
  clearLocalSession
} from './auth.js';

import { initializeDashboard } from './dashboard.js';

document.addEventListener('DOMContentLoaded', async () => {
  initializeLogin();
  initializePasswordToggle();

  await checkExistingSession();
});


/* =====================================================
   1. LOGIN
===================================================== */

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
      showMessage('Username dan password wajib diisi.', 'error');
      return;
    }

    const button = document.getElementById('loginButton');
    const buttonText = document.getElementById('loginButtonText');

    const originalText = buttonText.textContent;

    try {
      button.disabled = true;
      buttonText.textContent = 'Memproses...';

      showMessage('Sedang memverifikasi akun...', 'success');

      const result = await loginUser(username, password);

      console.log('Login berhasil:', {
        username: result.user.username,
        role: result.user.role,
        expiresAt: result.expiresAt
      });

      if (result.user.role !== 'Admin') {
        throw new Error(
          'Dashboard untuk role ini belum tersedia pada tahap pengembangan.'
        );
      }

      await openDashboard(result.user);

    } catch (error) {
      showMessage(
        error.message || 'Login gagal. Silakan coba kembali.',
        'error'
      );

      // Jika login berhasil tetapi dashboard belum tersedia
      // untuk role pengguna, session lokal dibersihkan.
      if (
        error.message?.includes('Dashboard untuk role')
      ) {
        clearLocalSession();
      }

    } finally {
      button.disabled = false;
      buttonText.textContent = originalText;
    }
  });
}


/* =====================================================
   2. VALIDASI SESSION
===================================================== */

async function checkExistingSession() {
  const token = localStorage.getItem('pjlp_session_token');

  if (!token) {
    showLoginPage();
    return;
  }

  try {
    const user = await validateSession();

    if (!user) {
      showLoginPage();
      return;
    }

    if (user.role !== 'Admin') {
      showLoginPage();
      showMessage(
        'Dashboard untuk role ini belum tersedia.',
        'error'
      );
      return;
    }

    console.log('Session aktif:', {
      username: user.username,
      role: user.role
    });

    await openDashboard(user);

  } catch (error) {
    console.error('Validasi session gagal:', error);

    showLoginPage();

    showMessage(
      'Tidak dapat memverifikasi session. Periksa koneksi internet lalu coba login kembali.',
      'error'
    );
  }
}


/* =====================================================
   3. BUKA DASHBOARD
===================================================== */

async function openDashboard(user) {
  document.getElementById('loginPage').hidden = true;
  document.getElementById('dashboardPage').hidden = false;

  await initializeDashboard(user, handleLogout);

  hideLoading();
}


/* =====================================================
   4. LOGOUT
===================================================== */

async function handleLogout() {
  const confirmed = window.confirm(
    'Apakah Anda yakin ingin keluar dari aplikasi?'
  );

  if (!confirmed) return;

  try {
    await logoutUser();

    console.log('Logout berhasil.');

    document.getElementById('dashboardPage').hidden = true;

    const root = document.getElementById('dashboardRoot');
    root.innerHTML = '';

    document.getElementById('loginForm').reset();

    showLoginPage();

    showMessage('Anda berhasil keluar dari aplikasi.', 'success');

  } catch (error) {
    console.error('Logout gagal:', error);

    alert(
      error.message ||
      'Logout gagal. Silakan coba kembali.'
    );
  }
}


/* =====================================================
   5. TAMPILAN LOGIN
===================================================== */

function showLoginPage() {
  document.getElementById('dashboardPage').hidden = true;
  document.getElementById('loginPage').hidden = false;

  hideLoading();
}


/* =====================================================
   6. LOADING
===================================================== */

function hideLoading() {
  const loading = document.getElementById('appLoading');

  if (loading) {
    loading.hidden = true;
  }
}


/* =====================================================
   7. TOGGLE PASSWORD
===================================================== */

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


/* =====================================================
   8. PESAN LOGIN
===================================================== */

function showMessage(message, type) {
  const element = document.getElementById('loginMessage');

  if (!element) return;

  element.textContent = message;
  element.className = `login-message show ${type}`;
}
