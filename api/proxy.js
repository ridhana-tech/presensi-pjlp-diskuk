
module.exports = async (req, res) => {
  // Hanya menerima POST.
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Metode request tidak diizinkan.'
    });
  }

  try {
    const gasUrl = process.env.GAS_API_URL;

    if (!gasUrl) {
      throw new Error('Konfigurasi GAS_API_URL belum tersedia.');
    }

    const payload = req.body;

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Format request tidak valid.'
      });
    }

    const allowedActions = [
      'login',
      'validateSession',
      'logout',
      'getDataPJLP',
      'getDetailPJLP',
      'tambahDataPJLP',
      'ubahDataPJLP',
      'uploadFotoProfil',
      'getDataAtasan',
      'getDetailAtasan',
      'tambahDataAtasan',
      'ubahDataAtasan',
      'getDataLokasiKantor',
      'getDetailLokasiKantor',
      'tambahLokasiKantor',
      'ubahLokasiKantor',
      'nonaktifkanLokasiKantor',
      'getDataJadwal',
      'getDetailJadwal',
      'tambahJadwal',
      'ubahJadwal',
      'nonaktifkanJadwal',
      'buatAkunPJLP',
      'getDataAkunPJLP'
    ];

    if (!allowedActions.includes(payload.action)) {
      return res.status(400).json({
        success: false,
        message: 'Action tidak diizinkan.'
      });
    }

    // Teruskan request ke Google Apps Script.
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    const result = await response.json();

    return res.status(200).json(result);

  } catch (error) {
    console.error('Proxy Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Tidak dapat menghubungi server Presensi PJLP.'
    });
  }
};
