
import { apiRequest } from '../api.js';
import { APP_CONFIG } from '../config.js';

let daftarAkun = [];
let belumMemilikiAkun = [];
let ringkasan = {};
let activeController = null;

export async function showKelolaAkun(root) {
  const content = root.querySelector('#adminContent');
  if (!content) return;

  // Hentikan listener dari halaman sebelumnya jika modul dibuka ulang.
  activeController?.abort();
  activeController = new AbortController();

  const { signal } = activeController;

  content.innerHTML = `
    <section class="pengguna-page">
      <div class="pengguna-toolbar">
        <div>
          <h2>Pengguna & Akun</h2>
          <p>Kelola akun dan hak akses pengguna PJLP.</p>
        </div>

        <button type="button" class="btn-primary"
          id="btnBuatAkun">
          <i class="bi bi-plus-lg"></i>
          Buat Akun PJLP
        </button>
      </div>

      <div class="pengguna-summary" id="penggunaSummary">
        <div class="pengguna-summary-card">
          <span>Total Akun PJLP</span>
          <strong id="totalAkun">0</strong>
        </div>
        <div class="pengguna-summary-card">
          <span>Akun Aktif</span>
          <strong id="akunAktif">0</strong>
        </div>
        <div class="pengguna-summary-card">
          <span>Akun Nonaktif</span>
          <strong id="akunNonaktif">0</strong>
        </div>
        <div class="pengguna-summary-card">
          <span>Belum Memiliki Akun</span>
          <strong id="belumAkun">0</strong>
        </div>
      </div>

      <div class="pjlp-card">
        <div class="pjlp-card-header">
          <div>
            <h3>Daftar Akun PJLP</h3>
            <p>Daftar akun yang terdaftar pada aplikasi.</p>
          </div>
        </div>

        <div class="pengguna-table-toolbar">
          <input
            type="search"
            id="searchAkun"
            placeholder="Cari nama pegawai atau username..."
            autocomplete="off"
          >
        </div>

        <div class="pjlp-table-wrapper">
          <table class="pjlp-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Nama Pegawai</th>
                <th>Jabatan</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Terakhir Login</th>
              </tr>
            </thead>
            <tbody id="akunTableBody">
              <tr>
                <td colspan="7" class="pengguna-empty">
                  Memuat data akun...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div id="akunModalContainer"></div>
    </section>
  `;

  // Event pencarian.
  const searchInput = content.querySelector('#searchAkun');

  searchInput.addEventListener('input', () => {
    renderTabelAkun(content, searchInput.value);
  }, { signal });

  // Event tombol dan modal.
  content.addEventListener('click', event => {
    if (event.target.closest('#btnBuatAkun')) {
      bukaModalBuatAkun(content);
    }

    if (event.target.closest('#btnTutupModal')) {
      tutupModal(content);
    }

    if (event.target.closest('#btnBatalAkun')) {
      tutupModal(content);
    }
  }, { signal });

  // Event submit form.
  content.addEventListener('submit', async event => {
    if (event.target.id !== 'formBuatAkun') return;

    event.preventDefault();
    await submitBuatAkun(content);
  }, { signal });

  // Tutup modal dengan tombol Escape.
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      tutupModal(content);
    }
  }, { signal });

  await muatDataAkun(content);
}


/* =====================================================
   1. MEMUAT DATA AKUN
===================================================== */

async function muatDataAkun(content) {
  const tbody = content.querySelector('#akunTableBody');

  try {
    const token = localStorage.getItem(
      APP_CONFIG.SESSION.TOKEN_KEY
    );

    const deviceId = localStorage.getItem(
      APP_CONFIG.SESSION.DEVICE_KEY
    );

    const result = await apiRequest('getDataAkunPJLP', {
      token,
      deviceId
    });

    const responseData = result.data ?? result;

    if (!result.success || !responseData.success) {
      throw new Error(
        responseData.message ||
        result.message ||
        'Gagal mengambil data akun.'
      );
    }

    daftarAkun = responseData.data || [];
    belumMemilikiAkun = responseData.belumMemilikiAkun || [];
    ringkasan = responseData.ringkasan || {};

    renderRingkasan(content);
    renderTabelAkun(content);
  } catch (error) {
    console.error('Gagal memuat akun PJLP:', error);

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="pengguna-empty">
          ${escapeHTML(error.message)}
          <br>
          <button type="button" class="btn-secondary"
            id="btnMuatUlangAkun">
            Coba Lagi
          </button>
        </td>
      </tr>
    `;

    // Tombol coba lagi.
    content.querySelector('#btnMuatUlangAkun')
      ?.addEventListener('click', () => {
        muatDataAkun(content);
      }, { once: true });
  }
}


/* =====================================================
   2. RINGKASAN AKUN
===================================================== */

function renderRingkasan(content) {
  content.querySelector('#totalAkun').textContent =
    ringkasan.totalAkun ?? daftarAkun.length;

  content.querySelector('#akunAktif').textContent =
    ringkasan.akunAktif ?? 0;

  content.querySelector('#akunNonaktif').textContent =
    ringkasan.akunNonaktif ?? 0;

  content.querySelector('#belumAkun').textContent =
    ringkasan.belumMemilikiAkun ?? belumMemilikiAkun.length;

  const tombol = content.querySelector('#btnBuatAkun');

  tombol.disabled = belumMemilikiAkun.length === 0;

  if (tombol.disabled) {
    tombol.title = 'Semua PJLP sudah memiliki akun.';
  }
}


/* =====================================================
   3. TABEL AKUN
===================================================== */

function renderTabelAkun(content, keyword = '') {
  const tbody = content.querySelector('#akunTableBody');

  const kataKunci = String(keyword).toLowerCase().trim();

  const filtered = daftarAkun.filter(akun => {
    return (
      String(akun.namaPegawai || '')
        .toLowerCase().includes(kataKunci) ||
      String(akun.username || '')
        .toLowerCase().includes(kataKunci) ||
      String(akun.jabatan || '')
        .toLowerCase().includes(kataKunci)
    );
  });

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="pengguna-empty">
          ${kataKunci
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
          <strong>${escapeHTML(akun.namaPegawai)}</strong>
          <small class="pengguna-id">
            ${escapeHTML(akun.idPJLP)}
          </small>
        </td>
        <td>${escapeHTML(akun.jabatan || '-')}</td>
        <td>${escapeHTML(akun.username)}</td>
        <td>${escapeHTML(akun.role)}</td>
        <td>
          <span class="pengguna-status ${aktif ? 'aktif' : 'nonaktif'}">
            ${escapeHTML(akun.statusAkun || '-')}
          </span>
        </td>
        <td>${escapeHTML(akun.terakhirLogin || 'Belum pernah login')}</td>
      </tr>
    `;
  }).join('');
}


/* =====================================================
   4. MODAL BUAT AKUN
===================================================== */

function bukaModalBuatAkun(content) {
  const container = content.querySelector('#akunModalContainer');

  if (!belumMemilikiAkun.length) {
    alert('Semua PJLP sudah memiliki akun.');
    return;
  }

  const options = belumMemilikiAkun.map(pegawai => `
    <option value="${escapeHTML(pegawai.idPJLP)}">
      ${escapeHTML(pegawai.namaPegawai)}
      — ${escapeHTML(pegawai.idPJLP)}
    </option>
  `).join('');

  container.innerHTML = `
    <div class="pjlp-modal-overlay active" id="akunModalOverlay">
      <div class="pjlp-modal">
        <div class="pjlp-modal-header">
          <div>
            <h3>Buat Akun PJLP</h3>
            <p>Buat username dan password untuk pegawai.</p>
          </div>

          <button type="button" id="btnTutupModal"
            class="pengguna-close-button"
            aria-label="Tutup">
            &times;
          </button>
        </div>

        <form id="formBuatAkun">
          <div class="pjlp-form-grid">
            <div class="pjlp-form-group">
              <label for="akunIdPJLP">Pilih Pegawai</label>
              <select id="akunIdPJLP" name="idPJLP" required>
                <option value="">-- Pilih Pegawai PJLP --</option>
                ${options}
              </select>
            </div>

            <div class="pjlp-form-group">
              <label for="akunUsername">Username</label>
              <input
                type="text"
                id="akunUsername"
                name="username"
                maxlength="100"
                autocomplete="off"
                required
                placeholder="Masukkan username"
              >
            </div>

            <div class="pjlp-form-group">
              <label for="akunPassword">Password</label>
              <input
                type="password"
                id="akunPassword"
                name="password"
                minlength="12"
                maxlength="200"
                autocomplete="new-password"
                required
                placeholder="Minimal 12 karakter"
              >
            </div>

            <div class="pjlp-form-group">
              <label for="akunKonfirmasiPassword">
                Konfirmasi Password
              </label>
              <input
                type="password"
                id="akunKonfirmasiPassword"
                name="konfirmasiPassword"
                minlength="12"
                maxlength="200"
                autocomplete="new-password"
                required
                placeholder="Ulangi password"
              >
            </div>
          </div>

          <div class="pengguna-password-info">
            Password minimal 12 karakter. Sampaikan kredensial
            akun kepada pegawai secara aman.
          </div>

          <div class="pjlp-modal-footer">
            <button type="button" class="btn-secondary"
              id="btnBatalAkun">
              Batal
            </button>

            <button type="submit" class="btn-primary"
              id="btnSimpanAkun">
              <i class="bi bi-person-plus"></i>
              Buat Akun
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  container.querySelector('#akunIdPJLP').focus();
}


/* =====================================================
   5. SIMPAN AKUN
===================================================== */

async function submitBuatAkun(content) {
  const form = content.querySelector('#formBuatAkun');
  const tombol = content.querySelector('#btnSimpanAkun');

  const idPJLP = form.elements.idPJLP.value.trim();
  const username = form.elements.username.value.trim();
  const password = form.elements.password.value;
  const konfirmasiPassword =
    form.elements.konfirmasiPassword.value;

  if (!idPJLP || !username || !password) {
    alert('Semua kolom wajib diisi.');
    return;
  }

  if (password.length < 12 || password.length > 200) {
    alert('Password harus terdiri dari 12–200 karakter.');
    return;
  }

  if (password !== konfirmasiPassword) {
    alert('Konfirmasi password tidak sesuai.');
    return;
  }

  tombol.disabled = true;
  tombol.textContent = 'Menyimpan...';

  try {
    const token = localStorage.getItem(
      APP_CONFIG.SESSION.TOKEN_KEY
    );

    const deviceId = localStorage.getItem(
      APP_CONFIG.SESSION.DEVICE_KEY
    );

    const result = await apiRequest('buatAkunPJLP', {
      token,
      deviceId,
      data: {
        idPJLP,
        username,
        password
      }
    });

    const responseData = result.data ?? result;

    if (!result.success || !responseData.success) {
      throw new Error(
        responseData.message ||
        result.message ||
        'Gagal membuat akun PJLP.'
      );
    }

    alert(
      responseData.message || 'Akun PJLP berhasil dibuat.'
    );

    tutupModal(content);
    await muatDataAkun(content);

  } catch (error) {
    console.error('Gagal membuat akun PJLP:', error);
    alert(error.message || 'Terjadi kesalahan saat membuat akun.');
  } finally {
    const tombolTerbaru =
      content.querySelector('#btnSimpanAkun');

    if (tombolTerbaru) {
      tombolTerbaru.disabled = false;
      tombolTerbaru.innerHTML = `
        <i class="bi bi-person-plus"></i>
        Buat Akun
      `;
    }
  }
}


/* =====================================================
   6. TUTUP MODAL
===================================================== */

function tutupModal(content) {
  const container = content.querySelector('#akunModalContainer');

  if (container) {
    container.innerHTML = '';
  }
}


/* =====================================================
   7. HELPER
===================================================== */

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);
}
