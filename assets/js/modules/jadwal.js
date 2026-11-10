
import { apiRequest } from '../api.js';
import { APP_CONFIG } from '../config.js';

/* =====================================================
   MODULE JADWAL KERJA PJLP
===================================================== */

const TOKEN_KEY = APP_CONFIG.SESSION.TOKEN_KEY;
const DEVICE_KEY = APP_CONFIG.SESSION.DEVICE_KEY;

let jadwalData = [];
let jadwalRoot = null;


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

  const result = response.data;

  if (result && result.success === false) {
    throw new Error(result.message || 'Permintaan gagal.');
  }

  return result?.data ?? result;
}

async function jadwalRequest(action, payload = {}) {
  const credentials = getCredentials();

  if (!credentials.token || !credentials.deviceId) {
    throw new Error('Sesi login tidak ditemukan. Silakan login kembali.');
  }

  const response = await apiRequest(action, {
    ...credentials,
    ...payload
  });

  return unwrapResponse(response);
}

function formatStatus(status) {
  return status === 'Aktif'
    ? '<span class="jk-badge jk-active">Aktif</span>'
    : '<span class="jk-badge jk-inactive">Nonaktif</span>';
}

function formatLintasHari(value) {
  return value === 'Ya' ? 'Ya' : 'Tidak';
}

function showAlert(message, type = 'success') {
  if (!jadwalRoot) return;

  const oldAlert = jadwalRoot.querySelector('.jk-alert');

  if (oldAlert) oldAlert.remove();

  const alert = document.createElement('div');

  alert.className = `jk-alert jk-alert-${type}`;
  alert.textContent = message;

  jadwalRoot.prepend(alert);

  setTimeout(() => {
    alert.remove();
  }, 4000);
}


/* =====================================================
   2. CSS MODULE
===================================================== */

function injectJadwalStyle() {
  if (document.getElementById('jadwal-module-style')) return;

  const style = document.createElement('style');

  style.id = 'jadwal-module-style';

  style.textContent = `
    .jk-container {
      width: 100%;
      color: #263449;
      font-family: inherit;
    }

    .jk-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }

    .jk-toolbar h2 {
      margin: 0 0 6px;
      color: #233d70;
      font-size: 22px;
      font-weight: 700;
    }

    .jk-toolbar p {
      margin: 0;
      color: #8490a2;
      font-size: 13px;
    }

    .jk-search {
      width: 100%;
      max-width: 360px;
      padding: 11px 14px;
      border: 1px solid #dce3ed;
      border-radius: 9px;
      font-size: 14px;
      outline: none;
      background: #fff;
      box-sizing: border-box;
    }

    .jk-search:focus,
    .jk-form-control:focus {
      border-color: #263f70;
      box-shadow: 0 0 0 3px rgba(38,63,112,.10);
    }

    .jk-btn {
      border: 0;
      border-radius: 8px;
      padding: 10px 15px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: .2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .jk-btn:disabled {
      opacity: .6;
      cursor: not-allowed;
    }

    .jk-btn-primary {
      background: #233d70;
      color: #fff;
    }

    .jk-btn-primary:hover {
      background: #192e56;
    }

    .jk-btn-light {
      background: #edf1f7;
      color: #263449;
    }

    .jk-btn-light:hover {
      background: #dfe6f0;
    }

    .jk-btn-danger {
      background: #fff0f0;
      color: #c0392b;
    }

    .jk-btn-danger:hover {
      background: #ffe0e0;
    }

    .jk-btn-small {
      padding: 7px 10px;
      font-size: 12px;
    }

    .jk-table-wrap {
      width: 100%;
      overflow-x: auto;
      background: #fff;
      border: 1px solid #e6eaf0;
      border-radius: 12px;
    }

    .jk-table {
      width: 100%;
      min-width: 850px;
      border-collapse: collapse;
      font-size: 13px;
    }

    .jk-table th {
      background: #f5f7fb;
      color: #42516a;
      font-weight: 700;
      text-align: left;
      padding: 14px 12px;
      white-space: nowrap;
      border-bottom: 1px solid #e6eaf0;
    }

    .jk-table td {
      padding: 13px 12px;
      border-bottom: 1px solid #edf0f4;
      vertical-align: middle;
    }

    .jk-table tbody tr:hover {
      background: #fafbfe;
    }

    .jk-table tbody tr:last-child td {
      border-bottom: 0;
    }

    .jk-badge {
      display: inline-block;
      padding: 5px 9px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
    }

    .jk-active {
      color: #16834a;
      background: #e7f7ee;
    }

    .jk-inactive {
      color: #9b5b13;
      background: #fff3df;
    }

    .jk-actions {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .jk-empty {
      text-align: center;
      padding: 35px 15px !important;
      color: #8490a2;
    }

    .jk-alert {
      padding: 12px 15px;
      border-radius: 8px;
      margin-bottom: 15px;
      font-size: 13px;
    }

    .jk-alert-success {
      background: #e8f7ee;
      color: #167345;
    }

    .jk-alert-error {
      background: #fff0f0;
      color: #b83232;
    }

    .jk-modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(15,23,42,.55);
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 18px;
      box-sizing: border-box;
    }

    .jk-modal {
      width: 100%;
      max-width: 760px;
      max-height: 90vh;
      overflow-y: auto;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 15px 50px rgba(0,0,0,.2);
    }

    .jk-modal-header {
      padding: 18px 22px;
      border-bottom: 1px solid #edf0f4;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      position: sticky;
      top: 0;
      background: #fff;
      z-index: 2;
    }

    .jk-modal-title {
      font-size: 17px;
      font-weight: 700;
      color: #233d70;
      margin: 0;
    }

    .jk-modal-close {
      border: 0;
      background: #f1f3f7;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      font-size: 20px;
      cursor: pointer;
      color: #475569;
    }

    .jk-modal-body {
      padding: 22px;
    }

    .jk-modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 9px;
      padding: 15px 22px;
      border-top: 1px solid #edf0f4;
      position: sticky;
      bottom: 0;
      background: #fff;
    }

    .jk-form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }

    .jk-form-group {
      min-width: 0;
    }

    .jk-form-group.full {
      grid-column: 1 / -1;
    }

    .jk-form-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #46546a;
      margin-bottom: 7px;
    }

    .jk-required {
      color: #d64545;
    }

    .jk-form-control {
      display: block;
      width: 100%;
      box-sizing: border-box;
      padding: 10px 12px;
      border: 1px solid #dce3ed;
      border-radius: 8px;
      font-size: 13px;
      color: #263449;
      outline: none;
      background: #fff;
    }

    .jk-form-help {
      display: block;
      margin-top: 5px;
      font-size: 11px;
      color: #8792a3;
    }

    .jk-detail-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }

    .jk-detail-item {
      padding: 12px;
      border: 1px solid #edf0f4;
      border-radius: 9px;
      min-width: 0;
    }

    .jk-detail-label {
      display: block;
      color: #8792a3;
      font-size: 11px;
      margin-bottom: 6px;
    }

    .jk-detail-value {
      display: block;
      color: #263449;
      font-size: 13px;
      font-weight: 600;
      overflow-wrap: anywhere;
    }

    .jk-info {
      padding: 12px 14px;
      background: #f2f5fa;
      color: #50617a;
      border-radius: 8px;
      font-size: 12px;
      line-height: 1.6;
      margin-bottom: 18px;
    }

    .jk-loading {
      padding: 30px;
      text-align: center;
      color: #7b8798;
    }

    .jk-form-error {
      margin-bottom: 16px;
    }

    @media(max-width: 600px) {
      .jk-form-grid,
      .jk-detail-grid {
        grid-template-columns: 1fr;
      }

      .jk-form-group.full {
        grid-column: auto;
      }

      .jk-modal-body {
        padding: 16px;
      }

      .jk-modal-header,
      .jk-modal-footer {
        padding-left: 16px;
        padding-right: 16px;
      }

      .jk-toolbar {
        align-items: stretch;
      }

      .jk-search {
        max-width: none;
      }
    }
  `;

  document.head.appendChild(style);
}


/* =====================================================
   3. TAMPILAN UTAMA
===================================================== */

export async function showDataJadwal(root) {
  // Mengambil container isi dashboard.
  // Sidebar dan header tidak akan dihapus.
  const content = root.querySelector('#adminContent');

  if (!content) {
    console.error('Container #adminContent tidak ditemukan.', root);
    return;
  }

  jadwalRoot = content;

  injectJadwalStyle();

  // Tutup modal jadwal yang mungkin masih terbuka.
  closeJadwalModal();

  content.innerHTML = `
    <div class="jk-container">

      <!-- TOOLBAR -->
      <div class="jk-toolbar">
        <div>
          <h2>Jadwal Kerja</h2>
          <p>Pengelolaan jadwal kerja dan waktu presensi PJLP.</p>
        </div>

        <button
          type="button"
          class="jk-btn jk-btn-primary"
          id="jkAddButton"
        >
          + Tambah Jadwal
        </button>
      </div>

      <!-- DAFTAR JADWAL -->
      <div class="jk-table-wrap">

        <div style="
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          border-bottom: 1px solid #e6eaf0;
        ">
          <div>
            <h3 style="
              margin: 0 0 5px;
              font-size: 16px;
              color: #263449;
            ">
              Daftar Jadwal Kerja
            </h3>

            <span
              id="jkTotal"
              style="font-size: 12px; color: #8490a2;"
            >
              Memuat data...
            </span>
          </div>

          <input
            type="search"
            id="jkSearch"
            class="jk-search"
            placeholder="Cari ID atau nama jadwal..."
          >
        </div>

        <table class="jk-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>ID Jadwal</th>
              <th>Nama Jadwal</th>
              <th>Jam Kerja</th>
              <th>Mulai Presensi</th>
              <th>Lintas Hari</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody id="jkTableBody">
            <tr>
              <td colspan="8" class="jk-empty">
                Memuat data jadwal...
              </td>
            </tr>
          </tbody>
        </table>

      </div>

    </div>
  `;

  // Tombol tambah jadwal
  content.querySelector('#jkAddButton')
    .addEventListener('click', () => {
      openJadwalForm();
    });

  // Pencarian jadwal
  content.querySelector('#jkSearch')
    .addEventListener('input', event => {
      renderJadwalTable(event.target.value);
    });

  // Event detail tabel
  content.querySelector('#jkTableBody')
    .addEventListener('click', handleTableAction);

  // Muat data awal
  await loadDataJadwal();
}


/* =====================================================
   4. AMBIL DATA JADWAL
===================================================== */

async function loadDataJadwal() {
  if (!jadwalRoot) return;

  const tbody = jadwalRoot.querySelector('#jkTableBody');
  const total = jadwalRoot.querySelector('#jkTotal');

  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="8" class="jk-empty">
        Memuat data...
      </td>
    </tr>
  `;

  try {
    const result = await jadwalRequest('getDataJadwal');

    jadwalData = Array.isArray(result) ? result : [];

    renderJadwalTable();

  } catch (error) {
    console.error('Gagal memuat jadwal:', error);

    if (total) {
      total.textContent = 'Gagal memuat data';
    }

    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="jk-empty">
          ${escapeHTML(error.message)}
        </td>
      </tr>
    `;
  }
}


/* =====================================================
   5. RENDER TABEL
===================================================== */

function renderJadwalTable(keyword = '') {
  if (!jadwalRoot) return;

  const tbody = jadwalRoot.querySelector('#jkTableBody');
  const total = jadwalRoot.querySelector('#jkTotal');

  if (!tbody) return;

  const search = String(keyword).toLowerCase().trim();

  const filtered = jadwalData.filter(item =>
    String(item.ID_Jadwal || '').toLowerCase().includes(search) ||
    String(item.Nama_Jadwal || '').toLowerCase().includes(search)
  );

  if (total) {
    total.textContent = `${filtered.length} jadwal kerja`;
  }

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="jk-empty">
          Tidak ada data jadwal kerja.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((item, index) => `
    <tr>
      <td>${index + 1}</td>

      <td>${escapeHTML(item.ID_Jadwal)}</td>

      <td>
        <strong>${escapeHTML(item.Nama_Jadwal)}</strong>
      </td>

      <td>
        ${escapeHTML(item.Jam_Masuk)}
        – ${escapeHTML(item.Jam_Pulang)}
      </td>

      <td>${escapeHTML(item.Mulai_Presensi_Masuk)}</td>

      <td>${formatLintasHari(item.Lintas_Hari)}</td>

      <td>${formatStatus(item.Status)}</td>

      <td>
        <div class="jk-actions">
          <button
            type="button"
            class="jk-btn jk-btn-light jk-btn-small"
            data-action="detail"
            data-id="${escapeHTML(item.ID_Jadwal)}"
          >
            Detail
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}


/* =====================================================
   6. AKSI TABEL
===================================================== */

async function handleTableAction(event) {
  const button = event.target.closest('button[data-action]');

  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === 'detail') {
    await openJadwalDetail(id);
  }
}


/* =====================================================
   7. MODAL
===================================================== */

function closeJadwalModal() {
  const modal = document.querySelector('.jk-modal-overlay');

  if (modal) {
    modal.remove();
  }

  document.removeEventListener(
    'keydown',
    handleModalEscape
  );
}

function handleModalEscape(event) {
  if (event.key === 'Escape') {
    closeJadwalModal();
  }
}

function createJadwalModal(title, modalContent, footer = '') {
  closeJadwalModal();

  const overlay = document.createElement('div');

  overlay.className = 'jk-modal-overlay';

  overlay.innerHTML = `
    <div class="jk-modal">

      <div class="jk-modal-header">
        <h3 class="jk-modal-title">
          ${escapeHTML(title)}
        </h3>

        <button
          type="button"
          class="jk-modal-close"
          data-close-modal
        >
          &times;
        </button>
      </div>

      <div class="jk-modal-body">
        ${modalContent}
      </div>

      ${footer ? `
        <div class="jk-modal-footer">
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
      closeJadwalModal();
    }
  });

  document.body.appendChild(overlay);

  document.addEventListener(
    'keydown',
    handleModalEscape
  );

  return overlay;
}


/* =====================================================
   8. FORM TAMBAH / EDIT
===================================================== */

function openJadwalForm(item = null) {
  const isEdit = Boolean(item);

  const value = key => escapeHTML(item?.[key] ?? '');

  const modalContent = `
    <div class="jk-info">
      Toleransi keterlambatan ditetapkan 0 menit.
      Keterlambatan berapa pun akan dihitung berdasarkan
      selisih waktu presensi dengan jam masuk.
    </div>

    <form id="jkForm">

      <div class="jk-form-grid">

        <div class="jk-form-group full">
          <label class="jk-form-label">
            Nama Jadwal <span class="jk-required">*</span>
          </label>

          <input
            type="text"
            name="Nama_Jadwal"
            class="jk-form-control"
            maxlength="100"
            required
            value="${value('Nama_Jadwal')}"
            placeholder="Contoh: Reguler"
          >
        </div>

        <div class="jk-form-group">
          <label class="jk-form-label">
            Jam Masuk <span class="jk-required">*</span>
          </label>

          <input
            type="time"
            name="Jam_Masuk"
            class="jk-form-control"
            required
            value="${value('Jam_Masuk')}"
          >
        </div>

        <div class="jk-form-group">
          <label class="jk-form-label">
            Jam Pulang <span class="jk-required">*</span>
          </label>

          <input
            type="time"
            name="Jam_Pulang"
            class="jk-form-control"
            required
            value="${value('Jam_Pulang')}"
          >
        </div>

        <div class="jk-form-group">
          <label class="jk-form-label">
            Mulai Presensi Masuk <span class="jk-required">*</span>
          </label>

          <input
            type="time"
            name="Mulai_Presensi_Masuk"
            class="jk-form-control"
            required
            value="${value('Mulai_Presensi_Masuk')}"
          >
        </div>

        <div class="jk-form-group">
          <label class="jk-form-label">
            Batas Akhir Presensi Masuk
          </label>

          <input
            type="time"
            name="Batas_Akhir_Presensi_Masuk"
            class="jk-form-control"
            value="${value('Batas_Akhir_Presensi_Masuk')}"
          >

          <small class="jk-form-help">
            Kosongkan jika belum ditentukan.
          </small>
        </div>

        <div class="jk-form-group">
          <label class="jk-form-label">
            Toleransi Terlambat
          </label>

          <input
            type="number"
            class="jk-form-control"
            value="0"
            disabled
          >

          <small class="jk-form-help">
            Ditetapkan 0 menit.
          </small>
        </div>

        <div class="jk-form-group">
          <label class="jk-form-label">
            Lintas Hari <span class="jk-required">*</span>
          </label>

          <select
            name="Lintas_Hari"
            class="jk-form-control"
            required
          >
            <option
              value="Tidak"
              ${item?.Lintas_Hari !== 'Ya' ? 'selected' : ''}
            >
              Tidak
            </option>

            <option
              value="Ya"
              ${item?.Lintas_Hari === 'Ya' ? 'selected' : ''}
            >
              Ya
            </option>
          </select>
        </div>

        ${isEdit ? `
          <div class="jk-form-group">
            <label class="jk-form-label">
              Status <span class="jk-required">*</span>
            </label>

            <select
              name="Status"
              class="jk-form-control"
              required
            >
              <option
                value="Aktif"
                ${item.Status === 'Aktif' ? 'selected' : ''}
              >
                Aktif
              </option>

              <option
                value="Nonaktif"
                ${item.Status === 'Nonaktif' ? 'selected' : ''}
              >
                Nonaktif
              </option>
            </select>
          </div>
        ` : ''}

        <div class="jk-form-group full">
          <label class="jk-form-label">
            Keterangan
          </label>

          <textarea
            name="Keterangan"
            class="jk-form-control"
            rows="3"
            maxlength="500"
            placeholder="Keterangan tambahan (opsional)"
          >${value('Keterangan')}</textarea>
        </div>

      </div>

    </form>
  `;

  const footer = `
    <button
      type="button"
      class="jk-btn jk-btn-light"
      data-close-modal
    >
      Batal
    </button>

    <button
      type="submit"
      form="jkForm"
      class="jk-btn jk-btn-primary"
      id="jkSaveButton"
    >
      ${isEdit ? 'Simpan Perubahan' : 'Simpan Jadwal'}
    </button>
  `;

  const modal = createJadwalModal(
    isEdit ? 'Ubah Jadwal Kerja' : 'Tambah Jadwal Kerja',
    modalContent,
    footer
  );

  modal.querySelector('#jkForm')
    .addEventListener('submit', async event => {
      event.preventDefault();

      await submitJadwalForm(
        event.currentTarget,
        item?.ID_Jadwal
      );
    });
}


/* =====================================================
   9. SIMPAN FORM
===================================================== */

async function submitJadwalForm(form, idJadwal = null) {
  const button = document.getElementById('jkSaveButton');

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  data.Toleransi_Terlambat_Menit = 0;

  const jamMasuk = data.Jam_Masuk;
  const jamPulang = data.Jam_Pulang;

  // Validasi lintas hari
  if (
    jamPulang < jamMasuk &&
    data.Lintas_Hari !== 'Ya'
  ) {
    showModalError(
      'Jam pulang lebih awal dari jam masuk. Pilih Lintas Hari: Ya.'
    );
    return;
  }

  if (
    jamPulang > jamMasuk &&
    data.Lintas_Hari === 'Ya'
  ) {
    showModalError(
      'Pilih Lintas Hari: Tidak untuk jadwal yang tidak melewati tengah malam.'
    );
    return;
  }

  // Validasi batas akhir presensi
  if (
    data.Batas_Akhir_Presensi_Masuk &&
    data.Batas_Akhir_Presensi_Masuk <
      data.Mulai_Presensi_Masuk
  ) {
    showModalError(
      'Batas akhir presensi tidak boleh lebih awal dari mulai presensi.'
    );
    return;
  }

  button.disabled = true;
  button.textContent = 'Menyimpan...';

  try {
    if (idJadwal) {
      await jadwalRequest('ubahJadwal', {
        idJadwal,
        data
      });

      closeJadwalModal();

      showAlert('Jadwal kerja berhasil diperbarui.');

    } else {
      await jadwalRequest('tambahJadwal', {
        data
      });

      closeJadwalModal();

      showAlert('Jadwal kerja berhasil ditambahkan.');
    }

    await loadDataJadwal();

  } catch (error) {
    console.error('Simpan Jadwal:', error);

    button.disabled = false;

    button.textContent = idJadwal
      ? 'Simpan Perubahan'
      : 'Simpan Jadwal';

    showModalError(error.message);
  }
}

function showModalError(message) {
  const body = document.querySelector('.jk-modal-body');

  if (!body) return;

  let errorBox = body.querySelector('.jk-form-error');

  if (!errorBox) {
    errorBox = document.createElement('div');

    errorBox.className =
      'jk-alert jk-alert-error jk-form-error';

    body.prepend(errorBox);
  }

  errorBox.textContent = message;

  errorBox.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest'
  });
}


/* =====================================================
   10. DETAIL JADWAL
===================================================== */

async function openJadwalDetail(idJadwal) {
  try {
    const item = await jadwalRequest('getDetailJadwal', {
      idJadwal
    });

    if (!item) {
      throw new Error('Data jadwal tidak ditemukan.');
    }

    const fields = [
      ['ID Jadwal', item.ID_Jadwal],
      ['Nama Jadwal', item.Nama_Jadwal],
      ['Jam Masuk', item.Jam_Masuk],
      ['Jam Pulang', item.Jam_Pulang],
      ['Mulai Presensi Masuk', item.Mulai_Presensi_Masuk],
      [
        'Batas Akhir Presensi Masuk',
        item.Batas_Akhir_Presensi_Masuk || '-'
      ],
      ['Toleransi Terlambat', '0 menit'],
      ['Lintas Hari', item.Lintas_Hari],
      ['Status', item.Status],
      ['Keterangan', item.Keterangan || '-']
    ];

    const modalContent = `
      <div class="jk-detail-grid">

        ${fields.map(([label, value]) => `
          <div class="jk-detail-item">

            <span class="jk-detail-label">
              ${escapeHTML(label)}
            </span>

            <span class="jk-detail-value">
              ${escapeHTML(value)}
            </span>

          </div>
        `).join('')}

      </div>
    `;

    const footer = `
      ${item.Status === 'Aktif' ? `
        <button
          type="button"
          class="jk-btn jk-btn-danger"
          id="jkDeactivateButton"
        >
          Nonaktifkan
        </button>
      ` : ''}

      <button
        type="button"
        class="jk-btn jk-btn-primary"
        id="jkEditButton"
      >
        Ubah Jadwal
      </button>

      <button
        type="button"
        class="jk-btn jk-btn-light"
        data-close-modal
      >
        Tutup
      </button>
    `;

    const modal = createJadwalModal(
      'Detail Jadwal Kerja',
      modalContent,
      footer
    );

    // Tombol edit
    modal.querySelector('#jkEditButton')
      .addEventListener('click', () => {
        openJadwalForm(item);
      });

    // Tombol nonaktifkan
    const deactivateButton =
      modal.querySelector('#jkDeactivateButton');

    if (deactivateButton) {
      deactivateButton.addEventListener('click', () => {
        deactivateJadwal(item.ID_Jadwal);
      });
    }

  } catch (error) {
    console.error('Detail Jadwal:', error);

    showAlert(error.message, 'error');
  }
}


/* =====================================================
   11. NONAKTIFKAN JADWAL
===================================================== */

async function deactivateJadwal(idJadwal) {
  const item = jadwalData.find(
    row => String(row.ID_Jadwal) === String(idJadwal)
  );

  if (!item) {
    showModalError('Data jadwal tidak ditemukan.');
    return;
  }

  const confirmed = window.confirm(
    `Apakah Anda yakin ingin menonaktifkan jadwal "${item.Nama_Jadwal}"?`
  );

  if (!confirmed) return;

  try {
    await jadwalRequest('nonaktifkanJadwal', {
      idJadwal
    });

    closeJadwalModal();

    showAlert('Jadwal kerja berhasil dinonaktifkan.');

    await loadDataJadwal();

  } catch (error) {
    console.error('Nonaktifkan Jadwal:', error);

    showModalError(error.message);
  }
}
