
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
  tampil: () => testEndpoint('getDataPJLP'),

  tambah: () => testEndpoint('tambahDataPJLP', {
    data: {
      Nama_Pegawai: 'TEST PJLP',
      NIK: String(Date.now()).padStart(16, '9'),
      Jenis_Kelamin: 'Laki-laki',
      Tempat_Lahir: 'Karanganyar',
      Tanggal_Lahir: '1995-01-01',
      Alamat: 'Alamat pengujian',
      No_HP: '080000000000',
      Jabatan: 'Tenaga Kebersihan',
      ID_Atasan: '',
      Tanggal_Mulai_Kerja: '2026-11-10',
      Foto_Profil_ID_Lampiran: '',
      Catatan: 'DATA UJI - HAPUS SETELAH PENGUJIAN'
    }
  })
};


