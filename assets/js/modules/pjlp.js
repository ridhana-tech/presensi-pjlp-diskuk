
import { apiRequest } from '../api.js';
import { APP_CONFIG } from '../config.js';

let pjlpRecords = [];
let currentPage = 1;
let searchKeyword = '';
const pageSize = 10;
let currentPJLPId = null;

/* =====================================================
   UTILITAS
===================================================== */

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function getSessionPayload() {
  const token = localStorage.getItem(APP_CONFIG.SESSION.TOKEN_KEY);
  const deviceId = localStorage.getItem(APP_CONFIG.SESSION.DEVICE_KEY);

  if (!token || !deviceId) {
    throw new Error('Session tidak ditemukan. Silakan login kembali.');
  }

  return { token, deviceId };
}

async function callPJLP(action, extra = {}) {
  const result = await apiRequest(action, {
    ...getSessionPayload(),
    ...extra
  });

  if (!result.success || !result.data?.success) {
    throw new Error(
      result.message ||
      result.data?.message ||
      'Permintaan Data PJLP gagal.'
    );
  }

  return result.data;
}

function formatTanggal(value) {
  if (!value) return '-';

  const date = new Date(value + 'T00:00:00');

  if (isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  }).format(date);
}

function showNotification(message, type = 'success') {
  let notification = document.getElementById('pjlpNotification');

  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'pjlpNotification';
    document.body.appendChild(notification);
  }

  notification.className = `pjlp-notification ${type}`;
  notification.textContent = message;
  notification.classList.add('show');

  clearTimeout(notification.timer);

  notification.timer = setTimeout(() => {
    notification.classList.remove('show');
  }, 3500);
}

/* =====================================================
   TAMPILAN UTAMA
===================================================== */

export async function showDataPJLP(root) {
  const content = root.querySelector('#adminContent');

  if (!content) return;

  injectPJLPStyles();

  content.innerHTML = `
    <section class="pjlp-heading">
      <div>
        <span class="welcome-label">MODUL ADMINISTRASI</span>
        <h1>Data PJLP</h1>
        <p>Pengelolaan data tenaga PJLP DISKUKTRANS ESDM Kabupaten Karanganyar.</p>
      </div>

      <button type="button" class="pjlp-btn-primary" id="btnTambahPJLP">
        <i class="bi bi-plus-lg"></i>
        Tambah PJLP
      </button>
    </section>

    <section class="pjlp-stat-grid">
      <article class="pjlp-stat-card">
        <div class="pjlp-stat-icon"><i class="bi bi-people"></i></div>
        <div>
          <span>Total PJLP</span>
          <strong id="pjlpTotal">0</strong>
          <small>Data terdaftar</small>
        </div>
      </article>

      <article class="pjlp-stat-card">
        <div class="pjlp-stat-icon"><i class="bi bi-briefcase"></i></div>
        <div>
          <span>Jenis Jabatan</span>
          <strong id="pjlpJabatan">0</strong>
          <small>Jabatan berbeda</small>
        </div>
      </article>
    </section>

    <section class="dashboard-panel pjlp-panel">
      <div class="pjlp-toolbar">
        <div>
          <h3>Daftar Pegawai PJLP</h3>
          <p>Data bersumber dari database Presensi PJLP.</p>
        </div>

        <button type="button" class="pjlp-btn-outline" id="btnRefreshPJLP">
          <i class="bi bi-arrow-clockwise"></i>
          Refresh
        </button>
      </div>

      <div class="pjlp-search">
        <i class="bi bi-search"></i>
        <input
          type="search"
          id="pjlpSearch"
          placeholder="Cari nama, NIK, atau jabatan..."
          autocomplete="off"
        >
      </div>

      <div id="pjlpTableContainer">
        <div class="pjlp-loading">
          <span class="pjlp-spinner"></span>
          <p>Memuat data PJLP...</p>
        </div>
      </div>

      <div id="pjlpPagination"></div>
    </section>

    <footer class="admin-footer">
      <span>Presensi PJLP DISKUKTRANS ESDM</span>
      <span>Kabupaten Karanganyar &copy; ${new Date().getFullYear()}</span>
    </footer>

    <div id="pjlpModalContainer"></div>
  `;

  bindMainEvents();
  await loadPJLPData();
}

/* =====================================================
   MEMUAT DATA
===================================================== */

async function loadPJLPData() {
  const container = document.getElementById('pjlpTableContainer');

  if (!container) return;

  container.innerHTML = `
    <div class="pjlp-loading">
      <span class="pjlp-spinner"></span>
      <p>Memuat data PJLP...</p>
    </div>
  `;

  try {
    const result = await callPJLP('getDataPJLP');

    pjlpRecords = Array.isArray(result.data) ? result.data : [];

    currentPage = 1;
    updateStatistics();
    renderPJLPTable();

  } catch (error) {
    container.innerHTML = `
      <div class="pjlp-error">
        <i class="bi bi-exclamation-circle"></i>
        <strong>Gagal memuat data</strong>
        <p>${escapeHTML(error.message)}</p>
        <button type="button" class="pjlp-btn-outline" id="btnRetryPJLP">
          Coba Lagi
        </button>
      </div>
    `;

    document.getElementById('btnRetryPJLP')
      ?.addEventListener('click', loadPJLPData);
  }
}

function updateStatistics() {
  const total = document.getElementById('pjlpTotal');
  const jabatan = document.getElementById('pjlpJabatan');

  if (total) total.textContent = pjlpRecords.length;

  if (jabatan) {
    const unique = new Set(
      pjlpRecords
        .map(item => String(item.Jabatan || '').trim())
        .filter(Boolean)
    );

    jabatan.textContent = unique.size;
  }
}

/* =====================================================
   TABEL DAN PENCARIAN
===================================================== */

function getFilteredRecords() {
  const keyword = searchKeyword.toLowerCase().trim();

  if (!keyword) return pjlpRecords;

  return pjlpRecords.filter(item => {
    const searchable = [
      item.Nama_Pegawai,
      item.NIK,
      item.Jabatan,
      item.ID_PJLP
    ].join(' ').toLowerCase();

    return searchable.includes(keyword);
  });
}

function renderPJLPTable() {
  const container = document.getElementById('pjlpTableContainer');
  const pagination = document.getElementById('pjlpPagination');

  if (!container || !pagination) return;

  const filtered = getFilteredRecords();
  const totalPages = Math.ceil(filtered.length / pageSize);

  if (totalPages > 0 && currentPage > totalPages) {
    currentPage = totalPages;
  }

  const start = (currentPage - 1) * pageSize;
  const currentRecords = filtered.slice(start, start + pageSize);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="pjlp-empty">
        <i class="bi bi-people"></i>
        <strong>${pjlpRecords.length ? 'Data tidak ditemukan' : 'Belum ada data PJLP'}</strong>
        <p>${pjlpRecords.length ? 'Coba gunakan kata kunci pencarian lain.' : 'Silakan tambahkan data PJLP pertama.'}</p>
      </div>
    `;

    pagination.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="pjlp-table-wrapper">
      <table class="pjlp-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>Nama Pegawai</th>
            <th>NIK</th>
            <th>Jabatan</th>
            <th>No. HP</th>
            <th>Mulai Kerja</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${currentRecords.map((item, index) => `
            <tr>
              <td>${start + index + 1}</td>
              <td>
                <div class="pjlp-name-cell">
                  <div class="pjlp-avatar">
                    <i class="bi bi-person-fill"></i>
                  </div>
                  <div>
                    <strong>${escapeHTML(item.Nama_Pegawai)}</strong>
                    <small>${escapeHTML(item.ID_PJLP)}</small>
                  </div>
                </div>
              </td>
              <td>${escapeHTML(item.NIK)}</td>
              <td>${escapeHTML(item.Jabatan)}</td>
              <td>${escapeHTML(item.No_HP || '-')}</td>
              <td>${escapeHTML(formatTanggal(item.Tanggal_Mulai_Kerja))}</td>
              <td>
                <div class="pjlp-action-group">
                  <button class="pjlp-action-btn detail"
                    data-action="detail"
                    data-id="${escapeHTML(item.ID_PJLP)}"
                    title="Detail">
                    <i class="bi bi-eye"></i>
                  </button>
                  <button class="pjlp-action-btn edit"
                    data-action="edit"
                    data-id="${escapeHTML(item.ID_PJLP)}"
                    title="Edit">
                    <i class="bi bi-pencil-square"></i>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  pagination.innerHTML = `
    <div class="pjlp-pagination-info">
      Menampilkan ${start + 1}–${Math.min(start + pageSize, filtered.length)}
      dari ${filtered.length} data
    </div>
    <div class="pjlp-pagination-buttons">
      <button type="button" data-page="${currentPage - 1}"
        ${currentPage <= 1 ? 'disabled' : ''}>
        <i class="bi bi-chevron-left"></i>
      </button>
      <span>Halaman ${currentPage} dari ${totalPages}</span>
      <button type="button" data-page="${currentPage + 1}"
        ${currentPage >= totalPages ? 'disabled' : ''}>
        <i class="bi bi-chevron-right"></i>
      </button>
    </div>
  `;
}

/* =====================================================
   EVENT UTAMA
===================================================== */

function bindMainEvents() {
  document.getElementById('btnTambahPJLP')
    ?.addEventListener('click', () => openPJLPForm());

  document.getElementById('btnRefreshPJLP')
    ?.addEventListener('click', loadPJLPData);

  document.getElementById('pjlpSearch')
    ?.addEventListener('input', event => {
      searchKeyword = event.target.value;
      currentPage = 1;
      renderPJLPTable();
    });

  document.getElementById('pjlpTableContainer')
    ?.addEventListener('click', event => {
      const button = event.target.closest('[data-action]');

      if (!button) return;

      const id = button.dataset.id;

      if (button.dataset.action === 'detail') {
        openPJLPDetail(id);
      }

      if (button.dataset.action === 'edit') {
        openPJPLEdit(id);
      }
    });

  document.getElementById('pjlpPagination')
    ?.addEventListener('click', event => {
      const button = event.target.closest('[data-page]');

      if (!button || button.disabled) return;

      currentPage = Number(button.dataset.page);
      renderPJLPTable();
    });
}

/* =====================================================
   FORM TAMBAH DAN EDIT
===================================================== */

function openPJLPForm(record = null) {
  currentPJLPId = record?.ID_PJLP || null;

  const isEdit = Boolean(record);

  const fields = [
    ['Nama_Pegawai', 'Nama Pegawai', 'text', true],
    ['NIK', 'NIK (16 digit)', 'text', true],
    ['Jenis_Kelamin', 'Jenis Kelamin', 'select', true],
    ['Tempat_Lahir', 'Tempat Lahir', 'text', false],
    ['Tanggal_Lahir', 'Tanggal Lahir', 'date', false],
    ['Alamat', 'Alamat', 'textarea', false],
    ['No_HP', 'Nomor HP', 'tel', false],
    ['Jabatan', 'Jabatan', 'text', true],
    ['ID_Atasan', 'ID Atasan', 'text', false],
    ['Tanggal_Mulai_Kerja', 'Tanggal Mulai Kerja', 'date', true],
    ['Foto_Profil_ID_Lampiran', 'ID Lampiran Foto Profil', 'text', false],
    ['Catatan', 'Catatan', 'textarea', false]
  ];

  const fieldHTML = fields.map(([name, label, type, required]) => {
    const value = record?.[name] ?? '';
    const requiredAttr = required ? 'required' : '';

    if (type === 'select') {
      return `
        <div class="pjlp-form-group">
          <label>${label}${required ? ' *' : ''}</label>
          <select name="${name}" ${requiredAttr}>
            <option value="">Pilih jenis kelamin</option>
            <option value="Laki-laki" ${value === 'Laki-laki' ? 'selected' : ''}>Laki-laki</option>
            <option value="Perempuan" ${value === 'Perempuan' ? 'selected' : ''}>Perempuan</option>
          </select>
        </div>
      `;
    }

    if (type === 'textarea') {
      return `
        <div class="pjlp-form-group full">
          <label>${label}${required ? ' *' : ''}</label>
          <textarea name="${name}" rows="3">${escapeHTML(value)}</textarea>
        </div>
      `;
    }

    return `
      <div class="pjlp-form-group">
        <label>${label}${required ? ' *' : ''}</label>
        <input
          type="${type}"
          name="${name}"
          value="${type === 'date' ? escapeHTML(String(value).slice(0, 10)) : escapeHTML(value)}"
          ${requiredAttr}
          ${name === 'NIK' ? 'maxlength="16" inputmode="numeric"' : ''}
        >
      </div>
    `;
  }).join('');

  showModal(`
    <div class="pjlp-modal-header">
      <div>
        <h2>${isEdit ? 'Edit Data PJLP' : 'Tambah Data PJLP'}</h2>
        <p>Lengkapi identitas tenaga PJLP.</p>
      </div>
      <button type="button" class="pjlp-modal-close" data-close>
        <i class="bi bi-x-lg"></i>
      </button>
    </div>

    <form id="pjlpForm">
      <div class="pjlp-form-grid">
        ${fieldHTML}
      </div>

      <div class="pjlp-form-note">Kolom bertanda * wajib diisi.</div>

      <div class="pjlp-modal-footer">
        <button type="button" class="pjlp-btn-outline" data-close>Batal</button>
        <button type="submit" class="pjlp-btn-primary" id="btnSavePJLP">
          <i class="bi bi-check-lg"></i>
          ${isEdit ? 'Simpan Perubahan' : 'Simpan Data'}
        </button>
      </div>
    </form>
  `);

  document.getElementById('pjlpForm')
    ?.addEventListener('submit', submitPJLPForm);
}

async function submitPJLPForm(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const button = document.getElementById('btnSavePJLP');

  const formData = new FormData(form);
  const data = {};

  formData.forEach((value, key) => {
    data[key] = String(value).trim();
  });

  if (!/^\d{16}$/.test(data.NIK || '')) {
    showNotification('NIK harus terdiri dari 16 digit angka.', 'error');
    return;
  }

  if (!/^[0-9+\-\s()]{8,20}$/.test(data.No_HP || '')) {
    if (data.No_HP) {
      showNotification('Format nomor HP tidak valid.', 'error');
      return;
    }
  }

  button.disabled = true;
  button.innerHTML = '<span class="pjlp-spinner small"></span> Menyimpan...';

  try {
    if (currentPJLPId) {
      await callPJLP('ubahDataPJLP', {
        idPJLP: currentPJLPId,
        data
      });

      showNotification('Data PJLP berhasil diperbarui.');

    } else {
      await callPJLP('tambahDataPJLP', { data });

      showNotification('Data PJLP berhasil ditambahkan.');
    }

    closeModal();
    await loadPJLPData();

  } catch (error) {
    showNotification(error.message, 'error');

    button.disabled = false;
    button.innerHTML = '<i class="bi bi-check-lg"></i> Simpan';
  }
}

/* =====================================================
   DETAIL DAN EDIT
===================================================== */

async function openPJLPDetail(id) {
  try {
    const result = await callPJLP('getDetailPJLP', {
      idPJLP: id
    });

    const item = result.data;

    showModal(`
      <div class="pjlp-modal-header">
        <div>
          <h2>Detail Data PJLP</h2>
          <p>Informasi lengkap pegawai.</p>
        </div>
        <button type="button" class="pjlp-modal-close" data-close>
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="pjlp-detail-profile">
        <div class="pjlp-detail-avatar">
          <i class="bi bi-person-fill"></i>
        </div>
        <h3>${escapeHTML(item.Nama_Pegawai)}</h3>
        <span>${escapeHTML(item.Jabatan)}</span>
        <small>${escapeHTML(item.ID_PJLP)}</small>
      </div>

      <div class="pjlp-detail-grid">
        ${detailRow('NIK', item.NIK)}
        ${detailRow('Jenis Kelamin', item.Jenis_Kelamin)}
        ${detailRow('Tempat Lahir', item.Tempat_Lahir)}
        ${detailRow('Tanggal Lahir', formatTanggal(item.Tanggal_Lahir))}
        ${detailRow('Nomor HP', item.No_HP)}
        ${detailRow('Tanggal Mulai Kerja', formatTanggal(item.Tanggal_Mulai_Kerja))}
        ${detailRow('ID Atasan', item.ID_Atasan)}
        ${detailRow('Alamat', item.Alamat)}
        ${detailRow('Catatan', item.Catatan)}
      </div>

      <div class="pjlp-modal-footer">
        <button type="button" class="pjlp-btn-outline" data-close>Tutup</button>
        <button type="button" class="pjlp-btn-primary" id="btnDetailEdit">
          <i class="bi bi-pencil-square"></i> Edit Data
        </button>
      </div>
    `);

    document.getElementById('btnDetailEdit')
      ?.addEventListener('click', () => {
        closeModal();
        openPJLPForm(item);
      });

  } catch (error) {
    showNotification(error.message, 'error');
  }
}

async function openPJPLEdit(id) {
  try {
    const result = await callPJLP('getDetailPJLP', {
      idPJLP: id
    });

    openPJLPForm(result.data);

  } catch (error) {
    showNotification(error.message, 'error');
  }
}

function detailRow(label, value) {
  return `
    <div class="pjlp-detail-item">
      <span>${escapeHTML(label)}</span>
      <strong>${escapeHTML(value || '-')}</strong>
    </div>
  `;
}

/* =====================================================
   MODAL
===================================================== */

function showModal(content) {
  const container = document.getElementById('pjlpModalContainer');

  if (!container) return;

  container.innerHTML = `
    <div class="pjlp-modal-backdrop">
      <div class="pjlp-modal" role="dialog" aria-modal="true">
        ${content}
      </div>
    </div>
  `;

  container.querySelectorAll('[data-close]').forEach(button => {
    button.addEventListener('click', closeModal);
  });

  container.querySelector('.pjlp-modal-backdrop')
    ?.addEventListener('click', event => {
      if (event.target.classList.contains('pjlp-modal-backdrop')) {
        closeModal();
      }
    });
}

function closeModal() {
  const container = document.getElementById('pjlpModalContainer');

  if (container) container.innerHTML = '';

  currentPJLPId = null;
}

/* =====================================================
   CSS MODUL
===================================================== */

function injectPJLPStyles() {
  if (document.getElementById('pjlpStyles')) return;

  const style = document.createElement('style');
  style.id = 'pjlpStyles';

  style.textContent = `
    .pjlp-heading {
      display:flex; justify-content:space-between;
      align-items:center; gap:20px; margin-bottom:24px;
    }
    .pjlp-heading h1 { margin:8px 0; font-size:26px; color:#142b4a; }
    .pjlp-heading p { margin:0; color:#718096; font-size:13px; }

    .pjlp-btn-primary,.pjlp-btn-outline {
      display:inline-flex; align-items:center; justify-content:center;
      gap:8px; padding:10px 16px; border-radius:8px;
      font:600 13px inherit; cursor:pointer; transition:.2s;
    }
    .pjlp-btn-primary {
      background:#142b4a; color:#fff; border:1px solid #142b4a;
    }
    .pjlp-btn-primary:hover { background:#203d63; }
    .pjlp-btn-primary:disabled { opacity:.6; cursor:wait; }
    .pjlp-btn-outline {
      background:#fff; color:#334155; border:1px solid #dbe2ea;
    }
    .pjlp-btn-outline:hover { background:#f1f5f9; }

    .pjlp-stat-grid {
      display:grid; grid-template-columns:repeat(2,minmax(0,1fr));
      gap:16px; margin-bottom:22px;
    }
    .pjlp-stat-card {
      display:flex; align-items:center; gap:15px;
      background:#fff; padding:20px; border:1px solid #e8edf3;
      border-radius:12px; box-shadow:0 2px 8px #142b4a08;
    }
    .pjlp-stat-icon {
      width:46px; height:46px; border-radius:11px;
      display:grid; place-items:center; background:#eaf1fb;
      color:#24518a; font-size:21px;
    }
    .pjlp-stat-card span,.pjlp-stat-card small {
      display:block; color:#718096; font-size:12px;
    }
    .pjlp-stat-card strong {
      display:block; font-size:24px; color:#142b4a; margin:3px 0;
    }

    .pjlp-panel { padding:22px; }
    .pjlp-toolbar {
      display:flex; align-items:center; justify-content:space-between;
      gap:15px; margin-bottom:18px;
    }
    .pjlp-toolbar h3 { margin:0 0 5px; font-size:16px; color:#142b4a; }
    .pjlp-toolbar p { margin:0; font-size:12px; color:#718096; }

    .pjlp-search {
      display:flex; align-items:center; gap:10px;
      max-width:420px; border:1px solid #dbe2ea;
      border-radius:8px; padding:0 12px; margin-bottom:18px;
      color:#718096;
    }
    .pjlp-search input {
      width:100%; height:42px; border:0; outline:0;
      background:transparent; font:13px inherit; color:#334155;
    }

    .pjlp-table-wrapper { width:100%; overflow-x:auto; }
    .pjlp-table { width:100%; border-collapse:collapse; min-width:850px; }
    .pjlp-table th {
      background:#f5f7fa; color:#64748b; text-align:left;
      font-size:11px; text-transform:uppercase; letter-spacing:.3px;
      padding:13px 12px; white-space:nowrap;
    }
    .pjlp-table td {
      padding:13px 12px; border-bottom:1px solid #edf0f4;
      color:#475569; font-size:12px; white-space:nowrap;
    }
    .pjlp-table tbody tr:hover { background:#f8fafc; }
    .pjlp-name-cell { display:flex; align-items:center; gap:10px; }
    .pjlp-name-cell strong { display:block; color:#263b56; font-size:12px; }
    .pjlp-name-cell small { display:block; color:#94a3b8; font-size:10px; margin-top:3px; }
    .pjlp-avatar {
      width:34px; height:34px; border-radius:50%;
      display:grid; place-items:center; background:#eaf1fb;
      color:#24518a; font-size:16px;
    }

    .pjlp-action-group { display:flex; gap:6px; }
    .pjlp-action-btn {
      width:31px; height:31px; border:0; border-radius:7px;
      cursor:pointer; background:#edf3fb; color:#24518a;
    }
    .pjlp-action-btn.edit { background:#fff4e5; color:#b7791f; }
    .pjlp-action-btn:hover { filter:brightness(.95); }

    .pjlp-empty,.pjlp-loading,.pjlp-error {
      min-height:210px; display:flex; flex-direction:column;
      align-items:center; justify-content:center; text-align:center;
      color:#718096; gap:9px; padding:25px;
    }
    .pjlp-empty>i,.pjlp-error>i { font-size:36px; color:#94a3b8; }
    .pjlp-empty strong,.pjlp-error strong { color:#334155; font-size:14px; }
    .pjlp-empty p,.pjlp-error p { margin:0; font-size:12px; }

    .pjlp-spinner {
      width:27px; height:27px; border:3px solid #dbe5f0;
      border-top-color:#24518a; border-radius:50%;
      animation:pjlpSpin .8s linear infinite;
    }
    .pjlp-spinner.small { width:15px; height:15px; border-width:2px; }
    @keyframes pjlpSpin { to { transform:rotate(360deg); } }

    .pjlp-pagination-info { color:#718096; font-size:11px; }
    #pjlpPagination {
      display:flex; align-items:center; justify-content:space-between;
      gap:12px; padding-top:17px;
    }
    .pjlp-pagination-buttons { display:flex; align-items:center; gap:10px; }
    .pjlp-pagination-buttons button {
      width:30px; height:30px; border:1px solid #dbe2ea;
      border-radius:6px; background:#fff; cursor:pointer;
    }
    .pjlp-pagination-buttons button:disabled { opacity:.4; cursor:not-allowed; }
    .pjlp-pagination-buttons span { font-size:11px; color:#64748b; }

    #pjlpModalContainer:empty { display:none; }
    .pjlp-modal-backdrop {
      position:fixed; inset:0; z-index:9999;
      background:#0f172a99; display:flex; align-items:center;
      justify-content:center; padding:20px; overflow-y:auto;
    }
    .pjlp-modal {
      background:#fff; width:100%; max-width:760px;
      max-height:90vh; overflow-y:auto; border-radius:14px;
      padding:24px; box-shadow:0 20px 60px #0003;
    }
    .pjlp-modal-header {
      display:flex; justify-content:space-between; align-items:flex-start;
      gap:15px; margin-bottom:22px;
    }
    .pjlp-modal-header h2 { margin:0 0 5px; font-size:19px; color:#142b4a; }
    .pjlp-modal-header p { margin:0; color:#718096; font-size:12px; }
    .pjlp-modal-close {
      border:0; background:#f1f5f9; color:#64748b;
      width:34px; height:34px; border-radius:8px; cursor:pointer;
    }

    .pjlp-form-grid {
      display:grid; grid-template-columns:repeat(2,minmax(0,1fr));
      gap:15px;
    }
    .pjlp-form-group { display:flex; flex-direction:column; gap:7px; }
    .pjlp-form-group.full { grid-column:1/-1; }
    .pjlp-form-group label { color:#475569; font-size:12px; font-weight:600; }
    .pjlp-form-group input,.pjlp-form-group select,.pjlp-form-group textarea {
      width:100%; border:1px solid #dbe2ea; border-radius:7px;
      padding:10px 11px; font:13px inherit; color:#334155;
      outline:none; background:#fff; box-sizing:border-box;
    }
    .pjlp-form-group input:focus,.pjlp-form-group select:focus,
    .pjlp-form-group textarea:focus {
      border-color:#4777ad; box-shadow:0 0 0 3px #4777ad18;
    }
    .pjlp-form-group textarea { resize:vertical; }
    .pjlp-form-note { margin-top:15px; color:#94a3b8; font-size:11px; }
    .pjlp-modal-footer {
      display:flex; justify-content:flex-end; gap:9px;
      border-top:1px solid #edf0f4; margin-top:22px; padding-top:17px;
    }

    .pjlp-detail-profile {
      text-align:center; padding:5px 0 20px;
      border-bottom:1px solid #edf0f4; margin-bottom:15px;
    }
    .pjlp-detail-avatar {
      width:65px; height:65px; margin:0 auto 10px;
      display:grid; place-items:center; border-radius:50%;
      background:#eaf1fb; color:#24518a; font-size:29px;
    }
    .pjlp-detail-profile h3 { margin:0 0 5px; color:#142b4a; font-size:17px; }
    .pjlp-detail-profile span,.pjlp-detail-profile small {
      display:block; color:#718096; font-size:12px; margin-top:4px;
    }
    .pjlp-detail-grid {
      display:grid; grid-template-columns:repeat(2,minmax(0,1fr));
      gap:14px;
    }
    .pjlp-detail-item { min-width:0; }
    .pjlp-detail-item span { display:block; color:#94a3b8; font-size:11px; margin-bottom:5px; }
    .pjlp-detail-item strong {
      display:block; color:#334155; font-size:12px;
      overflow-wrap:anywhere; font-weight:600;
    }

    .pjlp-notification {
      position:fixed; z-index:10000; right:22px; bottom:22px;
      max-width:min(380px,calc(100vw - 44px)); padding:13px 17px;
      border-radius:9px; background:#166534; color:white;
      font-size:13px; box-shadow:0 5px 20px #0002;
      opacity:0; transform:translateY(10px); pointer-events:none;
      transition:.2s;
    }
    .pjlp-notification.error { background:#b42318; }
    .pjlp-notification.show { opacity:1; transform:translateY(0); }

    @media(max-width:700px) {
      .pjlp-heading { align-items:flex-start; flex-direction:column; }
      .pjlp-stat-grid { grid-template-columns:1fr; }
      .pjlp-toolbar { align-items:flex-start; flex-direction:column; }
      .pjlp-form-grid,.pjlp-detail-grid { grid-template-columns:1fr; }
      .pjlp-form-group.full { grid-column:auto; }
      .pjlp-modal { padding:18px; }
      #pjlpPagination { align-items:flex-start; flex-direction:column; }
    }
  `;

  document.head.appendChild(style);
}
