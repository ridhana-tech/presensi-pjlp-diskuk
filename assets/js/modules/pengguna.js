
import { apiRequest } from '../api.js';
import { APP_CONFIG } from '../config.js';

/* =====================================================
   MODULE PENGGUNA & AKUN PJLP
===================================================== */

const TOKEN_KEY = APP_CONFIG.SESSION.TOKEN_KEY;
const DEVICE_KEY = APP_CONFIG.SESSION.DEVICE_KEY;

let daftarAkun = [];
let belumMemilikiAkun = [];
let ringkasan = {};
let penggunaRoot = null;
let penggunaEventController = null;


/* =====================================================
   1. HELPER
===================================================== */

function getCredentials() {
  return {
    token: localStorage.getItem(TOKEN_KEY),
    deviceId: localStorage.getItem(DEVICE_KEY)
  };
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);
}

function unwrapResponse(response) {
  if (!response || response.success === false) {
    throw new Error(response?.message || 'Permintaan gagal.');
  }

  const result = response.data ?? response;

  if (result && result.success === false) {
    throw new Error(result.message || 'Permintaan gagal.');
  }

  return result;
}

async function penggunaRequest(action, payload = {}) {
  const credentials = getCredentials();

  if (!credentials.token || !credentials.deviceId) {
    throw new Error(
      'Sesi login tidak ditemukan. Silakan login kembali.'
    );
  }

  const response = await apiRequest(action, {
    ...credentials,
    ...payload
  });

  return unwrapResponse(response);
}

function showAlert(message, type = 'success') {
  if (!penggunaRoot) return;

  const oldAlert = penggunaRoot.querySelector('.pa-alert');

  if (oldAlert) oldAlert.remove();

  const alert = document.createElement('div');

  alert.className = `pa-alert pa-alert-${type}`;
  alert.textContent = message;

  penggunaRoot.prepend(alert);

  setTimeout(() => {
    alert.remove();
  }, 4000);
}


/* =====================================================
   2. CSS MODULE
===================================================== */

function injectPenggunaStyle() {
  if (document.getElementById('pengguna-module-style')) return;

  const style = document.createElement('style');

  style.id = 'pengguna-module-style';

  style.textContent = `
    .pa-container {
      width: 100%;
      color: #263449;
      font-family: inherit;
    }

    .pa-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 22px;
    }

    .pa-toolbar h2 {
      margin: 0 0 6px;
      color: #233d70;
      font-size: 22px;
      font-weight: 700;
    }

    .pa-toolbar p {
      margin: 0;
      color: #8490a2;
      font-size: 13px;
    }

    .pa-summary {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 22px;
    }

    .pa-summary-card {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 20px;
      background: #fff;
      border: 1px solid #e6eaf0;
      border-radius: 12px;
      box-shadow: 0 3px 15px rgba(20,43,74,.04);
    }

    .pa-summary-card span {
      color: #8490a2;
      font-size: 12px;
    }

    .pa-summary-card strong {
      color: #233d70;
      font-size: 27px;
      font-weight: 700;
    }

    .pa-table-card {
      background: #fff;
      border: 1px solid #e6eaf0;
      border-radius: 12px;
      overflow: hidden;
    }

    .pa-table-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      padding: 18px 20px;
      border-bottom: 1px solid #e6eaf0;
    }

    .pa-table-heading h3 {
      margin: 0 0 5px;
      color: #263449;
      font-size: 16px;
    }

    .pa-table-heading p {
      margin: 0;
      color: #8490a2;
      font-size: 12px;
    }

    .pa-search {
      width: 100%;
      max-width: 360px;
      box-sizing: border-box;
      padding: 11px 14px;
      border: 1px solid #dce3ed;
      border-radius: 8px;
      background: #fff;
      font: inherit;
      font-size: 13px;
      outline: none;
    }

    .pa-search:focus,
    .pa-form-control:focus {
      border-color: #263f70;
      box-shadow: 0 0 0 3px rgba(38,63,112,.10);
    }

    .pa-table-wrap {
      width: 100%;
      overflow-x: auto;
    }

    .pa-table {
      width: 100%;
      min-width: 850px;
      border-collapse: collapse;
      font-size: 13px;
    }

    .pa-table th {
      padding: 14px 12px;
      background: #f5f7fb;
      color: #42516a;
      font-weight: 700;
      text-align: left;
      white-space: nowrap;
      border-bottom: 1px solid #e6eaf0;
    }

    .pa-table td {
      padding: 13px 12px;
      color: #425168;
      border-bottom: 1px solid #edf0f4;
      vertical-align: middle;
    }

    .pa-table tbody tr:hover {
      background: #fafbfe;
    }

    .pa-table tbody tr:last-child td {
      border-bottom: 0;
    }

    .pa-employee-name {
      color: #263449;
      font-weight: 600;
    }

    .pa-employee-id {
      display: block;
      margin-top: 4px;
      color: #8995a7;
      font-size: 11px;
    }

    .pa-badge {
      display: inline-block;
      padding: 5px 9px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
    }

    .pa-active {
      color: #16834a;
      background: #e7f7ee;
    }

    .pa-inactive {
      color: #9b5b13;
      background: #fff3df;
    }

    .pa-empty {
      padding: 35px 15px !important;
      color: #8490a2 !important;
      text-align: center;
    }

    .pa-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      padding: 10px 15px;
      border: 0;
      border-radius: 8px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: .2s;
    }

    .pa-btn:disabled {
      opacity: .55;
      cursor: not-allowed;
    }

    .pa-btn-primary {
      background: #233d70;
      color: #fff;
    }

    .pa-btn-primary:hover:not(:disabled) {
      background: #192e56;
    }

    .pa-btn-light {
      background: #edf1f7;
      color: #263449;
    }

    .pa-btn-light:hover {
      background: #dfe6f0;
    }

    .pa-alert {
      padding: 12px 15px;
      margin-bottom: 16px;
      border-radius: 8px;
      font-size: 13px;
    }

    .pa-alert-success {
      background: #e8f7ee;
      color: #167345;
    }

    .pa-alert-error {
      background: #fff0f0;
      color: #b83232;
    }

    .pa-modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
      box-sizing: border-box;
      background: rgba(15,23,42,.58);
    }

    .pa-modal {
      width: 100%;
      max-width: 620px;
      max-height: 90vh;
      overflow-y: auto;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 15px 50px rgba(0,0,0,.2);
    }

    .pa-modal-header {
      position: sticky;
      top: 0;
      z-index: 2;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      padding: 20px 23px;
      background: #fff;
      border-bottom: 1px solid #edf0f4;
    }

    .pa-modal-title {
      margin: 0 0 6px;
      color: #233d70;
      font-size: 18px;
      font-weight: 700;
    }

    .pa-modal-subtitle {
      margin: 0;
      color: #8490a2;
      font-size: 12px;
    }

    .pa-modal-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 33px;
      height: 33px;
      flex-shrink: 0;
      border: 0;
      border-radius: 8px;
      background: #f1f3f7;
      color: #475569;
      font-size: 21px;
      cursor: pointer;
    }

    .pa-modal-body {
      padding: 22px 23px;
    }

    .pa-form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 17px;
    }

    .pa-form-group {
      min-width: 0;
    }

    .pa-form-group label {
      display: block;
      margin-bottom: 7px;
      color: #46546a;
      font-size: 13px;
      font-weight: 600;
    }

    .pa-required {
      color: #d64545;
    }

    .pa-form-control {
      display: block;
      width: 100%;
      box-sizing: border-box;
      padding: 11px 12px;
      border: 1px solid #dce3ed;
      border-radius: 8px;
      background: #fff;
      color: #263449;
      font-family: inherit;
      font-size: 13px;
      outline: none;
    }

    .pa-form-help {
      display: block;
      margin-top: 6px;
      color: #8792a3;
      font-size: 11px;
      line-height: 1.5;
    }

    .pa-info {
      padding: 12px 14px;
      margin-top: 18px;
      border-radius: 8px;
      background: #f2f5fa;
      color: #50617a;
      font-size: 12px;
      line-height: 1.6;
    }

    .pa-form-error {
      margin-bottom: 16px;
    }

    .pa-modal-footer {
      position: sticky;
      bottom: 0;
      display: flex;
      justify-content: flex-end;
      gap: 9px;
      padding: 16px 23px;
      background: #fff;
      border-top: 1px solid #edf0f4;
    }

    @media(max-width: 900px) {
      .pa-summary {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media(max-width: 600px) {
      .pa-toolbar {
        align-items: stretch;
        flex-direction: column;
      }

      .pa-toolbar .pa-btn {
        width: 100%;
      }

      .pa-summary {
        gap: 10px;
      }

      .pa-summary-card {
        padding: 15px;
      }

      .pa-summary-card strong {
        font-size: 23px;
      }

      .pa-table-heading {
        align-items: stretch;
        flex-direction: column;
      }

      .pa-search {
        max-width: none;
      }

      .pa-form-grid {
        grid-template-columns: 1fr;
      }

      .pa-modal {
        max-height: 95vh;
      }

      .pa-modal-body {
        padding: 18px;
      }

      .pa-modal-header,
      .pa-modal-footer {
        padding-left: 18px;
        padding-right: 18px;
      }
    }
  `;

  document.head.appendChild(style);
}


/* =====================================================
   3. TAMPILAN UTAMA
===================================================== */


export async function showKelolaAkun(root) {
  const content = root.querySelector('#adminContent');

  if (!content) {
    console.error('Container #adminContent tidak ditemukan.');
    return;
  }

  penggunaRoot = content;

  // Hentikan listener halaman sebelumnya.
  penggunaEventController?.abort();
  penggunaEventController = new AbortController();

  const { signal } = penggunaEventController;

  closePenggunaModal();
  injectPenggunaStyle();

  content.innerHTML = `
    <div class="pa-container">

      <div class="pa-toolbar">
        <div>
          <h2>Pengguna & Akun</h2>
          <p>Kelola akun dan hak akses pengguna PJLP.</p>
        </div>

        <button
          type="button"
          class="pa-btn pa-btn-primary"
          id="paAddButton"
        >
          <i class="bi bi-plus-lg"></i>
          Buat Akun PJLP
        </button>
      </div>

      <div class="pa-summary">

        <div class="pa-summary-card">
          <span>Total Akun PJLP</span>
          <strong id="paTotalAkun">0</strong>
        </div>

        <div class="pa-summary-card">
          <span>Akun Aktif</span>
          <strong id="paAkunAktif">0</strong>
        </div>

        <div class="pa-summary-card">
          <span>Akun Nonaktif</span>
          <strong id="paAkunNonaktif">0</strong>
        </div>

        <div class="pa-summary-card">
          <span>Belum Memiliki Akun</span>
          <strong id="paBelumAkun">0</strong>
        </div>

      </div>

      <div class="pa-table-card">

        <div class="pa-table-heading">
          <div>
            <h3>Daftar Akun PJLP</h3>
            <p>Daftar akun yang terdaftar pada aplikasi.</p>
          </div>

          <input
            type="search"
            id="paSearch"
            class="pa-search"
            placeholder="Cari nama pegawai atau username..."
            autocomplete="off"
          >
        </div>

        <div class="pa-table-wrap">
          <table class="pa-table">

            <thead>
              <tr>
                <th>No.</th>
                <th>Nama Pegawai</th>
                <th>Jabatan</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Terakhir Login</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody id="paTableBody">
              <tr>
                <td colspan="8" class="pa-empty">
                  Memuat data akun...
                </td>
              </tr>
            </tbody>

          </table>
        </div>

      </div>

    </div>
  `;

  // Tombol buat akun.
  content.querySelector('#paAddButton')
    .addEventListener('click', openBuatAkunForm, { signal });

  // Pencarian akun.
  content.querySelector('#paSearch')
    .addEventListener('input', event => {
      renderAkunTable(event.target.value);
    }, { signal });

  // Event delegasi untuk aksi akun.
  content.addEventListener('click', event => {
    const button = event.target.closest('[data-reset-session]');

    if (!button || !content.contains(button)) return;

    const userId = button.dataset.resetSession;

    if (!userId) return;

    resetAkunSession(userId, button);
  }, { signal });

  // Muat data awal.
  await loadDataAkun();
}



/* =====================================================
   4. AMBIL DATA AKUN
===================================================== */

async function loadDataAkun() {
  if (!penggunaRoot) return;

  const tbody = penggunaRoot.querySelector('#paTableBody');

  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td>
        <button
            type="button"
            class="pa-btn pa-btn-light"
            data-reset-session="${escapeHTML(akun.idPengguna)}"
            title="Reset sesi login pengguna"
            ${!akun.idPengguna ? 'disabled' : ''}
        >
            <i class="bi bi-arrow-counterclockwise"></i>
            Reset Sesi
        </button>
       </td>
    </tr>
  `;

  try {
    const result = await penggunaRequest('getDataAkunPJLP');

    // Struktur data mengikuti respons backend yang sudah ada.
    daftarAkun = Array.isArray(result.data)
      ? result.data
      : [];

    belumMemilikiAkun = Array.isArray(result.belumMemilikiAkun)
      ? result.belumMemilikiAkun
      : [];

    ringkasan = result.ringkasan || {};

    renderRingkasan();
    renderAkunTable();

  } catch (error) {
    console.error('Gagal memuat akun PJLP:', error);

    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="pa-empty">
          ${escapeHTML(error.message)}
          <br><br>

          <button
            type="button"
            class="pa-btn pa-btn-light"
            id="paReloadButton"
          >
            <i class="bi bi-arrow-clockwise"></i>
            Coba Lagi
          </button>
        </td>
      </tr>
    `;

    penggunaRoot.querySelector('#paReloadButton')
      ?.addEventListener('click', loadDataAkun, {
        once: true
      });
  }
}


/* =====================================================
   5. RINGKASAN AKUN
===================================================== */

function renderRingkasan() {
  if (!penggunaRoot) return;

  penggunaRoot.querySelector('#paTotalAkun').textContent =
    ringkasan.totalAkun ?? daftarAkun.length;

  penggunaRoot.querySelector('#paAkunAktif').textContent =
    ringkasan.akunAktif ?? 0;

  penggunaRoot.querySelector('#paAkunNonaktif').textContent =
    ringkasan.akunNonaktif ?? 0;

  penggunaRoot.querySelector('#paBelumAkun').textContent =
    ringkasan.belumMemilikiAkun ?? belumMemilikiAkun.length;

  const button = penggunaRoot.querySelector('#paAddButton');

  if (button) {
    button.disabled = belumMemilikiAkun.length === 0;

    button.title = button.disabled
      ? 'Semua PJLP sudah memiliki akun.'
      : 'Buat akun baru untuk PJLP.';
  }
}


/* =====================================================
   6. RENDER TABEL AKUN
===================================================== */

function renderAkunTable(keyword = '') {
  if (!penggunaRoot) return;

  const tbody = penggunaRoot.querySelector('#paTableBody');

  if (!tbody) return;

  const search = String(keyword).toLowerCase().trim();

  const filtered = daftarAkun.filter(akun => (
    String(akun.namaPegawai || '')
      .toLowerCase().includes(search) ||

    String(akun.username || '')
      .toLowerCase().includes(search) ||

    String(akun.jabatan || '')
      .toLowerCase().includes(search) ||

    String(akun.idPJLP || '')
      .toLowerCase().includes(search)
  ));

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="pa-empty">
          ${search
            ? 'Data akun tidak ditemukan.'
            : 'Belum ada akun PJLP.'}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((akun, index) => {
    const aktif =
      String(akun.statusAkun || '').toLowerCase() === 'aktif';

    return `
      <tr>
        <td>${index + 1}</td>

        <td>
          <span class="pa-employee-name">
            ${escapeHTML(akun.namaPegawai)}
          </span>

          <small class="pa-employee-id">
            ${escapeHTML(akun.idPJLP)}
          </small>
        </td>

        <td>${escapeHTML(akun.jabatan || '-')}</td>

        <td>${escapeHTML(akun.username || '-')}</td>

        <td>${escapeHTML(akun.role || '-')}</td>

        <td>
          <span class="pa-badge ${aktif ? 'pa-active' : 'pa-inactive'}">
            ${escapeHTML(akun.statusAkun || '-')}
          </span>
        </td>

        <td>
          ${escapeHTML(
            akun.terakhirLogin || 'Belum pernah login'
          )}
        </td>
        <td>
        <button
            type="button"
            class="pa-btn pa-btn-light"
            data-reset-session="${escapeHTML(akun.idPengguna)}"
            title="Reset sesi pengguna"
        >
            <i class="bi bi-arrow-counterclockwise"></i>
            Reset Sesi
        </button>
        </td>
      </tr>
    `;
  }).join('');
}


/* =====================================================
   7. MODAL
===================================================== */

function closePenggunaModal() {
  const modal = document.querySelector('.pa-modal-overlay');

  if (modal) {
    modal.remove();
  }

  document.removeEventListener(
    'keydown',
    handlePenggunaModalEscape
  );
}

function handlePenggunaModalEscape(event) {
  if (event.key === 'Escape') {
    closePenggunaModal();
  }
}

function createPenggunaModal(title, modalContent, footer = '') {
  closePenggunaModal();

  const overlay = document.createElement('div');

  overlay.className = 'pa-modal-overlay';

  overlay.innerHTML = `
    <div class="pa-modal">

      <div class="pa-modal-header">
        <div>
          <h3 class="pa-modal-title">
            ${escapeHTML(title)}
          </h3>
        </div>

        <button
          type="button"
          class="pa-modal-close"
          data-close-modal
          aria-label="Tutup"
        >
          &times;
        </button>
      </div>

      <div class="pa-modal-body">
        ${modalContent}
      </div>

      ${footer ? `
        <div class="pa-modal-footer">
          ${footer}
        </div>
      ` : ''}

    </div>
  `;

  overlay.addEventListener('click', event => {
    if (
      event.target === overlay ||
      event.target.closest('[data-close-modal]')
    ) {
      closePenggunaModal();
    }
  });

  document.body.appendChild(overlay);

  document.addEventListener(
    'keydown',
    handlePenggunaModalEscape
  );

  return overlay;
}


/* =====================================================
   8. FORM BUAT AKUN
===================================================== */

function openBuatAkunForm() {
  if (!belumMemilikiAkun.length) {
    showAlert(
      'Semua PJLP sudah memiliki akun.',
      'error'
    );
    return;
  }

  const options = belumMemilikiAkun.map(pegawai => `
    <option value="${escapeHTML(pegawai.idPJLP)}">
      ${escapeHTML(pegawai.namaPegawai)}
      — ${escapeHTML(pegawai.idPJLP)}
    </option>
  `).join('');

  const modalContent = `
    <form id="paForm">

      <div class="pa-form-grid">

        <div class="pa-form-group">
          <label for="paIdPJLP">
            Pilih Pegawai <span class="pa-required">*</span>
          </label>

          <select
            id="paIdPJLP"
            name="idPJLP"
            class="pa-form-control"
            required
          >
            <option value="">
              -- Pilih Pegawai PJLP --
            </option>

            ${options}
          </select>
        </div>

        <div class="pa-form-group">
          <label for="paUsername">
            Username <span class="pa-required">*</span>
          </label>

          <input
            type="text"
            id="paUsername"
            name="username"
            class="pa-form-control"
            maxlength="100"
            autocomplete="off"
            required
            placeholder="Masukkan username"
          >
        </div>

        <div class="pa-form-group">
          <label for="paPassword">
            Password <span class="pa-required">*</span>
          </label>

          <input
            type="password"
            id="paPassword"
            name="password"
            class="pa-form-control"
            minlength="12"
            maxlength="200"
            autocomplete="new-password"
            required
            placeholder="Minimal 12 karakter"
          >

          <small class="pa-form-help">
            Password harus terdiri dari 12–200 karakter.
          </small>
        </div>

        <div class="pa-form-group">
          <label for="paConfirmPassword">
            Konfirmasi Password
            <span class="pa-required">*</span>
          </label>

          <input
            type="password"
            id="paConfirmPassword"
            name="konfirmasiPassword"
            class="pa-form-control"
            minlength="12"
            maxlength="200"
            autocomplete="new-password"
            required
            placeholder="Ulangi password"
          >
        </div>

      </div>

      <div class="pa-info">
        Password minimal 12 karakter. Sampaikan kredensial
        akun kepada pegawai secara aman.
      </div>

    </form>
  `;

  const footer = `
    <button
      type="button"
      class="pa-btn pa-btn-light"
      data-close-modal
    >
      Batal
    </button>

    <button
      type="submit"
      form="paForm"
      class="pa-btn pa-btn-primary"
      id="paSaveButton"
    >
      <i class="bi bi-person-plus"></i>
      Buat Akun
    </button>
  `;

  const modal = createPenggunaModal(
    'Buat Akun PJLP',
    modalContent,
    footer
  );

  // Event submit form
  modal.querySelector('#paForm')
    .addEventListener('submit', async event => {
      event.preventDefault();

      await submitBuatAkun(event.currentTarget);
    });

  modal.querySelector('#paIdPJLP').focus();
}


/* =====================================================
   9. SIMPAN AKUN
===================================================== */

async function submitBuatAkun(form) {
  const button = document.getElementById('paSaveButton');

  const formData = new FormData(form);

  const idPJLP = String(
    formData.get('idPJLP') || ''
  ).trim();

  const username = String(
    formData.get('username') || ''
  ).trim();

  const password = String(
    formData.get('password') || ''
  );

  const konfirmasiPassword = String(
    formData.get('konfirmasiPassword') || ''
  );

  if (!idPJLP || !username || !password) {
    showPenggunaModalError(
      'Semua kolom wajib diisi.'
    );
    return;
  }

  if (password.length < 12 || password.length > 200) {
    showPenggunaModalError(
      'Password harus terdiri dari 12–200 karakter.'
    );
    return;
  }

  if (password !== konfirmasiPassword) {
    showPenggunaModalError(
      'Konfirmasi password tidak sesuai.'
    );
    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = 'Menyimpan...';
  }

  try {
    const result = await penggunaRequest('buatAkunPJLP', {
      data: {
        idPJLP,
        username,
        password
      }
    });

    closePenggunaModal();

    showAlert(
      result.message || 'Akun PJLP berhasil dibuat.'
    );

    await loadDataAkun();

  } catch (error) {
    console.error('Gagal membuat akun PJLP:', error);

    showPenggunaModalError(error.message);

    const saveButton = document.getElementById('paSaveButton');

    if (saveButton) {
      saveButton.disabled = false;
      saveButton.innerHTML = `
        <i class="bi bi-person-plus"></i>
        Buat Akun
      `;
    }
  }
}


async function resetAkunSession(userId, button) {
  if (!userId) return;

  const konfirmasi = confirm(
    'Apakah Anda yakin ingin mereset sesi pengguna ini?\n\n' +
    'Pengguna akan diminta login kembali pada perangkatnya.'
  );

  if (!konfirmasi) return;

  const tombolAwal = button.innerHTML;

  button.disabled = true;
  button.textContent = 'Mereset...';

  try {
    const result = await penggunaRequest(
      'resetSessionPengguna',
      {
        targetUserId: userId
      }
    );

    showAlert(
      result.message || 'Sesi pengguna berhasil direset.',
      'success'
    );

    await loadDataAkun();

  } catch (error) {
    console.error('Gagal mereset sesi pengguna:', error);

    showAlert(
      error.message || 'Gagal mereset sesi pengguna.',
      'error'
    );

    button.disabled = false;
    button.innerHTML = tombolAwal;
  }
}



/* =====================================================
   10. NOTIFIKASI ERROR MODAL
===================================================== */

function showPenggunaModalError(message) {
  const body = document.querySelector('.pa-modal-body');

  if (!body) return;

  let errorBox = body.querySelector('.pa-form-error');

  if (!errorBox) {
    errorBox = document.createElement('div');

    errorBox.className =
      'pa-alert pa-alert-error pa-form-error';

    body.prepend(errorBox);
  }

  errorBox.textContent = message;

  errorBox.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest'
  });
}

/* =====================================================
   11. RESET SESI PENGGUNA
===================================================== */

async function resetAkunSession(userId, button) {
  if (!userId) {
    showAlert('ID pengguna tidak ditemukan.', 'error');
    return;
  }

  const konfirmasi = confirm(
    'Apakah Anda yakin ingin mereset sesi login pengguna ini?\n\n' +
    'Pengguna harus login kembali setelah sesi direset.'
  );

  if (!konfirmasi) return;

  const originalHTML = button.innerHTML;

  button.disabled = true;
  button.textContent = 'Memproses...';

  try {
    const result = await penggunaRequest(
      'resetSessionPengguna',
      {
        targetUserId: userId
      }
    );

    showAlert(
      result.message || 'Sesi pengguna berhasil direset.'
    );

    await loadDataAkun();

  } catch (error) {
    console.error('Gagal mereset sesi:', error);

    showAlert(
      error.message || 'Gagal mereset sesi pengguna.',
      'error'
    );

    button.disabled = false;
    button.innerHTML = originalHTML;
  }
}