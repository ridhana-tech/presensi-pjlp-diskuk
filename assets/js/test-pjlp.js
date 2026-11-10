
import { APP_CONFIG } from './config.js';

async function testEndpoint(action, extraData = {}) {
  const token = localStorage.getItem(
    APP_CONFIG.SESSION.TOKEN_KEY
  );

  const deviceId = localStorage.getItem(
    APP_CONFIG.SESSION.DEVICE_KEY
  );

  if (!token || !deviceId) {
    console.error('Session tidak ditemukan. Silakan login.');
    return;
  }

  try {
    const response = await fetch(APP_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action,
        token,
        deviceId,
        ...extraData
      })
    });

    const result = await response.json();

    console.log('Action:', action);
    console.log('HTTP Status:', response.status);
    console.log('Hasil:', result);

    return result;

  } catch (error) {
    console.error('Pengujian gagal:', error.message);
  }
}

window.testDataPJLP = {
  tampil: () => testEndpoint('getDataPJLP')
};


