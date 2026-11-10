
import { apiRequest } from '../api.js';
import { APP_CONFIG } from '../config.js';

export async function showDataAtasan(root) {
  const content = root.querySelector('#adminContent');
  if (!content) return;

  content.innerHTML = `
    <div class="pjlp-page">

      <div class="pjlp-toolbar">
        <div>
          <h2>Data Atasan</h2>
          <p>Pengelolaan data pejabat dan pegawai yang menjadi atasan PJLP.</p>
        </div>

        <button class="btn-primary" id="btnTambahAtasan">
          + Tambah Atasan
        </button>
      </div>

      <div class="pjlp-card">
        <div class="pjlp-card-header">
          <div>
            <h3>Daftar Atasan</h3>
            <span id="atasanTotal">Memuat data...</span>
          </div>

          <input
            type="search"
            id="searchAtasan"
            placeholder="Cari nama atau NIP..."
          >
        </div>

        <div class="pjlp-table-wrapper">
          <table class="pjlp-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>ID Atasan</th>
                <th>Nama Atasan</th>
                <th>NIP</th>
                <th>Jabatan</th>
                <th>No. HP</th>
                <th>Email</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody id="atasanTableBody">
              <tr>
                <td colspan="9" class="pjlp-loading">
                  Memuat data atasan...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL TAMBAH ATASAN -->
    <div class="pjlp-modal-overlay" id="modalTambahAtasan">
      <div class="pjlp-modal">

        <div class="pjlp-modal-header">
          <div>
            <h3>Tambah Data Atasan</h3>
            <p>Lengkapi informasi atasan.</p>
          </div>

          <button type="button"
            class="pjlp-modal-close"
            id="btnTutupTambahAtasan">
            &times;
          </button>
        </div>

        <form id="formTambahAtasan">
          <div class="pjlp-form-grid">

            <div class="pjlp-form-group">
              <label>Nama Lengkap <span>*</span></label>
              <input
                type="text"
                name="Nama_Atasan"
                placeholder="Masukkan nama lengkap"
                required
                maxlength="150"
              >
            </div>

            <div class="pjlp-form-group">
              <label>NIP <span>*</span></label>
              <input
                type="text"
                name="NIP"
                placeholder="18 digit NIP"
                required
                inputmode="numeric"
                pattern="[0-9]{18}"
                maxlength="18"
              >
            </div>

            <div class="pjlp-form-group">
              <label>Jabatan <span>*</span></label>
              <input
                type="text"
                name="Jabatan"
                placeholder="Masukkan jabatan"
                required
                maxlength="150"
              >
            </div>

            <div class="pjlp-form-group">
              <label>Nomor HP</label>
              <input
                type="tel"
                name="No_HP"
                placeholder="Contoh: 081234567890"
                maxlength="20"
              >
            </div>

            <div class="pjlp-form-group pjlp-form-full">
              <label>Email</label>
              <input
                type="email"
                name="Email"
                placeholder="nama@email.go.id"
                maxlength="150"
              >
            </div>

          </div>

          <div class="pjlp-form-note">
            <span>*</span> Wajib diisi. ID Atasan dibuat otomatis oleh sistem.
          </div>

          <div class="pjlp-modal-footer">
            <button type="button"
              class="btn-secondary"
              id="btnBatalAtasan">
              Batal
            </button>

            <button type="submit"
              class="btn-primary"
              id="btnSimpanAtasan">
              Simpan Data
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL DETAIL ATASAN -->
    <div class="pjlp-modal-overlay" id="modalDetailAtasan">
      <div class="pjlp-modal" id="detailAtasanContent">
      </div>
    </div>
  `;

  let dataAtasan = [];

  const tbody = content.querySelector('#atasanTableBody');
  const total = content.querySelector('#atasanTotal');
  const search = content.querySelector('#searchAtasan');

  const modalTambah = content.querySelector('#modalTambahAtasan');
  const modalDetail = content.querySelector('#modalDetailAtasan');

  detailModalBox.style.width = '850px';
  detailModalBox.style.maxWidth = '95vw';
  detailModalBox.style.maxHeight = '90vh';
  detailModalBox.style.overflowY = 'auto';

  const formTambah = content.querySelector('#formTambahAtasan');
  const btnSimpan = content.querySelector('#btnSimpanAtasan');

  const detailContent = content.querySelector('#detailAtasanContent');

  /* =====================================================
     HELPER
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

  function getCredentials() {
    return {
      token: localStorage.getItem(APP_CONFIG.SESSION.TOKEN_KEY),
      deviceId: localStorage.getItem(APP_CONFIG.SESSION.DEVICE_KEY)
    };
  }

  function getResponseData(result) {
    const responseData = result.data ?? result;

    if (!result.success || !responseData.success) {
      throw new Error(
        responseData.message ||
        result.message ||
        'Permintaan gagal.'
      );
    }

    return responseData;
  }

  function bukaModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function tutupModal(modal) {
    modal.classList.remove('active');

    if (
      !content.querySelector('.pjlp-modal-overlay.active')
    ) {
      document.body.style.overflow = '';
    }
  }

  function tutupSemuaModal() {
    content.querySelectorAll('.pjlp-modal-overlay').forEach(modal => {
      modal.classList.remove('active');
    });

    document.body.style.overflow = '';
  }

  /* =====================================================
     RENDER TABEL
  ===================================================== */

  function renderTable(data) {
    total.textContent = `${data.length} data atasan`;

    if (!data.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="pjlp-empty">
            Belum ada data atasan.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = data.map((item, index) => `
      <tr>
        <td>${index + 1}</td>

        <td>
          ${escapeHTML(item.ID_Atasan)}
        </td>

        <td>
          <strong>${escapeHTML(item.Nama_Atasan)}</strong>
        </td>

        <td>${escapeHTML(item.NIP)}</td>

        <td>${escapeHTML(item.Jabatan)}</td>

        <td>${escapeHTML(item.No_HP)}</td>

        <td>${escapeHTML(item.Email)}</td>

        <td>${escapeHTML(item.Status)}</td>

        <td>
          <button
            type="button"
            class="btn-detail-pjlp"
            data-id="${escapeHTML(item.ID_Atasan)}">
            Detail
          </button>
        </td>
      </tr>
    `).join('');
  }

  /* =====================================================
     MUAT DATA ATASAN
  ===================================================== */

  async function muatDataAtasan() {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="pjlp-loading">
          Memuat data atasan...
        </td>
      </tr>
    `;

    const result = await apiRequest(
      'getDataAtasan',
      getCredentials()
    );

    const responseData = getResponseData(result);

    dataAtasan = responseData.data || [];

    renderTable(dataAtasan);
  }

  /* =====================================================
     PENCARIAN
  ===================================================== */

  search.addEventListener('input', () => {
    const keyword = search.value.toLowerCase().trim();

    const filtered = dataAtasan.filter(item =>
      String(item.Nama_Atasan || '')
        .toLowerCase().includes(keyword) ||

      String(item.NIP || '')
        .toLowerCase().includes(keyword)
    );

    renderTable(filtered);
  });

  /* =====================================================
     MODAL TAMBAH
  ===================================================== */

  content.querySelector('#btnTambahAtasan')
    .addEventListener('click', () => {
      formTambah.reset();
      bukaModal(modalTambah);
    });

  content.querySelector('#btnTutupTambahAtasan')
    .addEventListener('click', () => {
      tutupModal(modalTambah);
    });

  content.querySelector('#btnBatalAtasan')
    .addEventListener('click', () => {
      tutupModal(modalTambah);
    });

  modalTambah.addEventListener('click', event => {
    if (event.target === modalTambah) {
      tutupModal(modalTambah);
    }
  });

  /* =====================================================
     SIMPAN ATASAN
  ===================================================== */

  formTambah.addEventListener('submit', async event => {
    event.preventDefault();

    if (!formTambah.reportValidity()) return;

    const formData = new FormData(formTambah);
    const data = Object.fromEntries(formData.entries());

    data.NIP = String(data.NIP || '').replace(/\D/g, '');

    if (!/^\d{18}$/.test(data.NIP)) {
      alert('NIP harus terdiri dari tepat 18 digit angka.');
      return;
    }

    btnSimpan.disabled = true;
    btnSimpan.textContent = 'Menyimpan...';

    try {
      const result = await apiRequest(
        'tambahDataAtasan',
        {
          ...getCredentials(),
          data
        }
      );

      getResponseData(result);

      alert('Data atasan berhasil ditambahkan.');

      formTambah.reset();
      tutupModal(modalTambah);

      await muatDataAtasan();

    } catch (error) {
      console.error('Tambah Atasan:', error);

      alert(
        error.message ||
        'Terjadi kesalahan saat menyimpan data atasan.'
      );

    } finally {
      btnSimpan.disabled = false;
      btnSimpan.textContent = 'Simpan Data';
    }
  });

  /* =====================================================
     DETAIL ATASAN
  ===================================================== */

  async function bukaDetailAtasan(idAtasan) {
    detailContent.innerHTML = `
      <div class="pjlp-modal-header">
        <h3>Detail Data Atasan</h3>
      </div>

      <div class="pjlp-loading">
        Memuat detail atasan...
      </div>
    `;

    bukaModal(modalDetail);

    try {
      const result = await apiRequest(
        'getDetailAtasan',
        {
          ...getCredentials(),
          idAtasan
        }
      );

      const responseData = getResponseData(result);
      const record = responseData.data;

      if (!record) {
        throw new Error('Data atasan tidak ditemukan.');
      }

      renderDetailAtasan(record);

    } catch (error) {
      console.error('Detail Atasan:', error);

      detailContent.innerHTML = `
        <div class="pjlp-modal-header">
          <h3>Detail Data Atasan</h3>
        </div>

        <div class="pjlp-error">
          ${escapeHTML(error.message)}
        </div>

        <div class="pjlp-modal-footer">
          <button type="button"
            class="btn-secondary"
            id="btnTutupDetailAtasan">
            Tutup
          </button>
        </div>
      `;

      detailContent.querySelector('#btnTutupDetailAtasan')
        .addEventListener('click', () => {
          tutupModal(modalDetail);
        });
    }
  }

  function renderDetailAtasan(record) {
    detailContent.innerHTML = `
      <div class="pjlp-modal-header">
        <div>
          <h3>Detail Data Atasan</h3>
          <p>Informasi lengkap data atasan.</p>
        </div>

        <button type="button"
          class="pjlp-modal-close"
          id="btnTutupDetailAtasan">
          &times;
        </button>
      </div>

      <div class="pjlp-detail-grid">

        <div class="pjlp-detail-item">
          <span>ID Atasan</span>
          <strong>${escapeHTML(record.ID_Atasan)}</strong>
        </div>

        <div class="pjlp-detail-item">
          <span>Nama Atasan</span>
          <strong>${escapeHTML(record.Nama_Atasan)}</strong>
        </div>

        <div class="pjlp-detail-item">
          <span>NIP</span>
          <strong>${escapeHTML(record.NIP)}</strong>
        </div>

        <div class="pjlp-detail-item">
          <span>Jabatan</span>
          <strong>${escapeHTML(record.Jabatan)}</strong>
        </div>

        <div class="pjlp-detail-item">
          <span>Nomor HP</span>
          <strong>${escapeHTML(record.No_HP || '-')}</strong>
        </div>

        <div class="pjlp-detail-item">
          <span>Email</span>
          <strong>${escapeHTML(record.Email || '-')}</strong>
        </div>

        <div class="pjlp-detail-item">
          <span>Status</span>
          <strong>${escapeHTML(record.Status)}</strong>
        </div>

      </div>

      <div class="pjlp-modal-footer">
        <button type="button"
          class="btn-secondary"
          id="btnTutupDetailAtasan2">
          Tutup
        </button>

        <button type="button"
          class="btn-primary"
          id="btnEditAtasan">
          Edit Data
        </button>
      </div>
    `;

    detailContent.querySelector('#btnTutupDetailAtasan')
      .addEventListener('click', () => {
        tutupModal(modalDetail);
      });

    detailContent.querySelector('#btnTutupDetailAtasan2')
      .addEventListener('click', () => {
        tutupModal(modalDetail);
      });

    detailContent.querySelector('#btnEditAtasan')
      .addEventListener('click', () => {
        renderEditAtasan(record);
      });
  }

  /* =====================================================
     FORM EDIT ATASAN
  ===================================================== */

  function renderEditAtasan(record) {
    detailContent.innerHTML = `
      <div class="pjlp-modal-header">
        <div>
          <h3>Edit Data Atasan</h3>
          <p>Perbarui informasi data atasan.</p>
        </div>

        <button type="button"
          class="pjlp-modal-close"
          id="btnBatalEditAtasan">
          &times;
        </button>
      </div>

      <form id="formEditAtasan">

        <div class="pjlp-form-grid">

          <div class="pjlp-form-group">
            <label>Nama Lengkap <span>*</span></label>
            <input
              type="text"
              name="Nama_Atasan"
              value="${escapeHTML(record.Nama_Atasan)}"
              required
              maxlength="150"
            >
          </div>

          <div class="pjlp-form-group">
            <label>NIP <span>*</span></label>
            <input
              type="text"
              name="NIP"
              value="${escapeHTML(record.NIP)}"
              required
              inputmode="numeric"
              pattern="[0-9]{18}"
              maxlength="18"
            >
          </div>

          <div class="pjlp-form-group">
            <label>Jabatan <span>*</span></label>
            <input
              type="text"
              name="Jabatan"
              value="${escapeHTML(record.Jabatan)}"
              required
              maxlength="150"
            >
          </div>

          <div class="pjlp-form-group">
            <label>Nomor HP</label>
            <input
              type="tel"
              name="No_HP"
              value="${escapeHTML(record.No_HP || '')}"
              maxlength="20"
            >
          </div>

          <div class="pjlp-form-group pjlp-form-full">
            <label>Email</label>
            <input
              type="email"
              name="Email"
              value="${escapeHTML(record.Email || '')}"
              maxlength="150"
            >
          </div>

          <div class="pjlp-form-group">
            <label>Status <span>*</span></label>
            <select name="Status" required>
              <option value="Aktif"
                ${record.Status === 'Aktif' ? 'selected' : ''}>
                Aktif
              </option>

              <option value="Nonaktif"
                ${record.Status === 'Nonaktif' ? 'selected' : ''}>
                Nonaktif
              </option>
            </select>
          </div>

        </div>

        <div class="pjlp-modal-footer">
          <button type="button"
            class="btn-secondary"
            id="btnBatalEditAtasan2">
            Batal
          </button>

          <button type="submit"
            class="btn-primary"
            id="btnUpdateAtasan">
            Simpan Perubahan
          </button>
        </div>

      </form>
    `;

    const form = detailContent.querySelector('#formEditAtasan');
    const btnUpdate = detailContent.querySelector('#btnUpdateAtasan');

    function batalEdit() {
      renderDetailAtasan(record);
    }

    detailContent.querySelector('#btnBatalEditAtasan')
      .addEventListener('click', batalEdit);

    detailContent.querySelector('#btnBatalEditAtasan2')
      .addEventListener('click', batalEdit);

    form.addEventListener('submit', async event => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      data.NIP = String(data.NIP || '').replace(/\D/g, '');

      if (!/^\d{18}$/.test(data.NIP)) {
        alert('NIP harus terdiri dari tepat 18 digit angka.');
        return;
      }

      btnUpdate.disabled = true;
      btnUpdate.textContent = 'Menyimpan...';

      try {
        const result = await apiRequest(
          'ubahDataAtasan',
          {
            ...getCredentials(),
            idAtasan: record.ID_Atasan,
            data
          }
        );

        getResponseData(result);

        alert('Data atasan berhasil diperbarui.');

        tutupModal(modalDetail);

        await muatDataAtasan();

      } catch (error) {
        console.error('Edit Atasan:', error);

        alert(
          error.message ||
          'Terjadi kesalahan saat memperbarui data.'
        );

      } finally {
        btnUpdate.disabled = false;
        btnUpdate.textContent = 'Simpan Perubahan';
      }
    });
  }

  /* =====================================================
     EVENT DETAIL
  ===================================================== */

  tbody.addEventListener('click', event => {
    const button = event.target.closest('.btn-detail-pjlp');

    if (!button) return;

    bukaDetailAtasan(button.dataset.id);
  });

  modalDetail.addEventListener('click', event => {
    if (event.target === modalDetail) {
      tutupModal(modalDetail);
    }
  });

  /* =====================================================
     ESCAPE KEY
  ===================================================== */

  function handleEscape(event) {
    if (event.key === 'Escape') {
      tutupSemuaModal();
    }
  }

  document.addEventListener('keydown', handleEscape);

  /* =====================================================
     LOAD AWAL
  ===================================================== */

  try {
    await muatDataAtasan();

  } catch (error) {
    console.error('Gagal memuat Data Atasan:', error);

    total.textContent = 'Gagal memuat data';

    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="pjlp-error">
          ${escapeHTML(error.message)}
        </td>
      </tr>
    `;
  }
}
