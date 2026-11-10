
import { APP_CONFIG } from './config.js';
import { apiRequest } from './api.js';

/**
 * Mengambil atau membuat identitas perangkat.
 */
export function getDeviceId() {
  let deviceId = localStorage.getItem(
    APP_CONFIG.SESSION.DEVICE_KEY
  );

  if (!deviceId) {
    deviceId = 'PJLP-' + crypto.randomUUID();

    localStorage.setItem(
      APP_CONFIG.SESSION.DEVICE_KEY,
      deviceId
    );
  }

  return deviceId;
}


/**
 * Proses login.
 */
export async function loginUser(username, password) {
  const deviceId = getDeviceId();

  const response = await apiRequest('login', {
    username,
    password,
    deviceId
  });

  if (!response.success || !response.data?.success) {
    throw new Error(
      response.message ||
      response.data?.message ||
      'Login gagal.'
    );
  }

  const result = response.data;

  if (!result.token || !result.user) {
    throw new Error('Respons login dari server tidak lengkap.');
  }

  localStorage.setItem(
    APP_CONFIG.SESSION.TOKEN_KEY,
    result.token
  );

  localStorage.setItem(
    APP_CONFIG.SESSION.USER_KEY,
    JSON.stringify(result.user)
  );

  return result;
}


/**
 * Validasi session saat halaman dibuka.
 */
export async function validateSession() {
  const token = localStorage.getItem(
    APP_CONFIG.SESSION.TOKEN_KEY
  );

  if (!token) return null;

  const deviceId = getDeviceId();

  const response = await apiRequest('validateSession', {
    token,
    deviceId
  });

  if (!response.success || !response.data?.success) {
    clearLocalSession();
    return null;
  }

  const user = response.data.user;

  localStorage.setItem(
    APP_CONFIG.SESSION.USER_KEY,
    JSON.stringify(user)
  );

  return user;
}


/**
 * Logout dari server.
 */
export async function logoutUser() {
  const token = localStorage.getItem(
    APP_CONFIG.SESSION.TOKEN_KEY
  );

  if (!token) {
    clearLocalSession();
    return true;
  }

  const deviceId = getDeviceId();

  const response = await apiRequest('logout', {
    token,
    deviceId
  });

  if (!response.success || !response.data?.success) {
    throw new Error(
      response.message ||
      response.data?.message ||
      'Logout gagal.'
    );
  }

  clearLocalSession();

  return true;
}


/**
 * Menghapus token dan data pengguna lokal.
 * Device ID sengaja tidak dihapus.
 */
export function clearLocalSession() {
  localStorage.removeItem(
    APP_CONFIG.SESSION.TOKEN_KEY
  );

  localStorage.removeItem(
    APP_CONFIG.SESSION.USER_KEY
  );
}
