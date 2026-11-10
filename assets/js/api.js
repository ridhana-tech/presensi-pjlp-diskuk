
import { APP_CONFIG } from './config.js';

export async function apiRequest(action, payload = {}) {
  try {
    const response = await fetch(APP_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action,
        ...payload
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || 'Terjadi kesalahan komunikasi server.'
      );
    }

    return result;

  } catch (error) {
    console.error('API Request Error:', error);

    throw new Error(
      error.message || 'Tidak dapat menghubungi server.'
    );
  }
}
