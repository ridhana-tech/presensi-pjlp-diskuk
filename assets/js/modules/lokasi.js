
import { apiRequest } from '../api.js';
import { APP_CONFIG } from '../config.js';

export async function showDataLokasi(root) {
  const content = root.querySelector('#adminContent');
  if (!content) return;

  content.innerHTML = `
    <div class="pjlp-page">

      <div class="pjlp-toolbar">
        <div>
          <h2>Lokasi Kantor</h2>
          <p>Pengelolaan titik koordinat dan radius presensi kantor.</p>
        </div>

        <button class="btn-primary" id="btnTambahLokasi">
          + Tambah Lokasi
        </button>
      </div>

      <div class="pjlp-card">
        <div class="pjlp-card-header">
          <div>
            <h3>Daftar Lokasi Kantor</h3>
            <span id="lokasiTotal">Memuat data...</span>
          </div>

          <input
            type="search"
            id="searchLokasi"
            placeholder="Cari nama atau alamat lokasi..."
          >
        </div>

        <div class="pjlp-table-wrapper">
          <table class="pjlp-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>ID Lokasi</th>
                <th>Nama Lokasi</th>
                <th>Alamat</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Radius</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody id="lokasiTableBody">
              <tr>
                <td colspan="9" class="pjlp-loading">
                  Memuat data lokasi...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL LOKASI -->
    <div class="pjlp-modal-overlay" id="modalLokasi">
      <div class="pjlp-modal" id="lokasiModalContent"
        style="width:850px;max-width:95vw;max-height:90vh;overflow-y:auto;">
      </div>
    </div>
  `;

  let dataLokasi = [];

  const tbody = content.querySelector('#lokasiTableBody');
  const total = content.querySelector('#lokasiTotal');
  const search = content.querySelector('#searchLokasi');
  const modal = content.querySelector('#modalLokasi');
  const modalContent = content.querySelector('#lokasiModalContent');

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

  function bukaModal() {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function tutupModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function formatKoordinat(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(6) : '-';
  }

  /* =====================================================
     RENDER TABEL
  ===================================================== */

  function renderTable(data) {
    total.textContent = `${data.length} data lokasi`;

    if (!data.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="pjlp-empty">
            Belum ada data lokasi kantor.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = data.map((item, index) => `
      <tr>
        <td>${index + 1}</td>

        <td>${escapeHTML(item.ID_Lokasi)}</td>

        <td>
          <strong>${escapeHTML(item.Nama_Lokasi)}</strong>
        </td>

        <td>${escapeHTML(item.Alamat_Lengkap)}</td>

        <td>${formatKoordinat(item.Latitude)}</td>

        <td>${formatKoordinat(item.Longitude)}</td>

        <td>${escapeHTML(item.Radius_Meter)} m</td>

        <td>${escapeHTML(item.Status)}</td>

        <td>
          <button
            type="button"
            class="btn-detail-pjlp"
            data-action="detail"
            data-id="${escapeHTML(item.ID_Lokasi)}">
            Detail
          </button>
        </td>
      </tr>
    `).join('');
  }

  /* =====================================================
     MUAT DATA
  ===================================================== */

  async function muatDataLokasi() {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="pjlp-loading">
          Memuat data lokasi...
        </td>
      </tr>
    `;

    const result = await apiRequest(
      'getDataLokasiKantor',
      getCredentials()
    );

    const responseData = getResponseData(result);

    dataLokasi = responseData.data || [];

    renderTable(dataLokasi);
  }

  /* =====================================================
     PENCARIAN
  ===================================================== */

  search.addEventListener('input', () => {
    const keyword = search.value.toLowerCase().trim();

    const filtered = dataLokasi.filter(item =>
      String(item.Nama_Lokasi || '')
        .toLowerCase().includes(keyword) ||

      String(item.Alamat_Lengkap || '')
        .toLowerCase().includes(keyword)
    );

    renderTable(filtered);
  });

  /* =====================================================
     FORM LOKASI
  ===================================================== */

  function renderFormLokasi(record = null) {
    const isEdit = Boolean(record);

    modalContent.innerHTML = `
      <div class="pjlp-modal-header">
        <div>
          <h3>${isEdit ? 'Edit Lokasi Kantor' : 'Tambah Lokasi Kantor'}</h3>
          <p>${isEdit ? 'Perbarui informasi lokasi kantor.' : 'Masukkan informasi lokasi dan titik koordinat kantor.'}</p>
        </div>

        <button type="button"
          class="pjlp-modal-close"
          id="btnTutupFormLokasi">
          &times;
        </button>
      </div>

      <form id="formLokasi">
        <div class="pjlp-form-grid">

          <div class="pjlp-form-group">
            <label>Nama Lokasi <span>*</span></label>
            <input
              type="text"
              name="Nama_Lokasi"
              value="${escapeHTML(record?.Nama_Lokasi || '')}"
              placeholder="Contoh: Kantor DISKUKTRANS ESDM"
              required
              maxlength="150"
            >
          </div>

          <div class="pjlp-form-group">
            <label>Radius Presensi (Meter) <span>*</span></label>
            <input
              type="number"
              name="Radius_Meter"
              value="${escapeHTML(record?.Radius_Meter ?? 100)}"
              placeholder="Contoh: 100"
              min="1"
              step="1"
              required
            >
          </div>

          <div class="pjlp-form-group pjlp-form-full">
            <label>Alamat Lengkap <span>*</span></label>
            <textarea
              name="Alamat_Lengkap"
              rows="3"
              placeholder="Masukkan alamat lengkap lokasi"
              required
              maxlength="500"
            >${escapeHTML(record?.Alamat_Lengkap || '')}</textarea>
          </div>

          <div class="pjlp-form-group">
            <label>Latitude <span>*</span></label>
            <input
              type="number"
              name="Latitude"
              value="${escapeHTML(record?.Latitude ?? '')}"
              placeholder="Contoh: -7.600000"
              min="-90"
              max="90"
              step="any"
              required
            >
          </div>

          <div class="pjlp-form-group">
            <label>Longitude <span>*</span></label>
            <input
              type="number"
              name="Longitude"
              value="${escapeHTML(record?.Longitude ?? '')}"
              placeholder="Contoh: 110.950000"
              min="-180"
              max="180"
              step="any"
              required
            >
          </div>

          <div class="pjlp-form-group pjlp-form-full">
            <label>Catatan</label>
            <textarea
              name="Catatan"
              rows="2"
              placeholder="Catatan tambahan (opsional)"
              maxlength="500"
            >${escapeHTML(record?.Catatan || '')}</textarea>
          </div>

          ${isEdit ? `
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
          ` : ''}
        </div>

        <div class="pjlp-form-note">
          <span>*</span> Wajib diisi.
        </div>

        <div class="pjlp-modal-footer">
          <button type="button"
            class="btn-secondary"
            id="btnBatalFormLokasi">
            Batal
          </button>

          <button type="submit"
            class="btn-primary"
            id="btnSimpanLokasi">
            ${isEdit ? 'Simpan Perubahan' : 'Simpan Lokasi'}
          </button>
        </div>
      </form>
    `;

    modalContent.querySelector('#btnTutupFormLokasi')
      .addEventListener('click', tutupModal);

    modalContent.querySelector('#btnBatalFormLokasi')
      .addEventListener('click', tutupModal);

    const form = modalContent.querySelector('#formLokasi');
    const btnSimpan = modalContent.querySelector('#btnSimpanLokasi');

    form.addEventListener('submit', async event => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      data.Latitude = Number(data.Latitude);
      data.Longitude = Number(data.Longitude);
      data.Radius_Meter = Number(data.Radius_Meter);

      if (!isEdit) {
        data.Status = 'Aktif';
      }

      btnSimpan.disabled = true;
      btnSimpan.textContent = 'Menyimpan...';

      try {
        const action = isEdit
          ? 'ubahLokasiKantor'
          : 'tambahLokasiKantor';

        const payload = {
          ...getCredentials(),
          data
        };

        if (isEdit) {
          payload.idLokasi = record.ID_Lokasi;
        }

        const result = await apiRequest(action, payload);

        getResponseData(result);

        alert(
          isEdit
            ? 'Data lokasi berhasil diperbarui.'
            : 'Lokasi kantor berhasil ditambahkan.'
        );

        tutupModal();
        await muatDataLokasi();

      } catch (error) {
        console.error('Simpan Lokasi:', error);
        alert(error.message || 'Gagal menyimpan data lokasi.');

      } finally {
        btnSimpan.disabled = false;
        btnSimpan.textContent = isEdit
          ? 'Simpan Perubahan'
          : 'Simpan Lokasi';
      }
    });

    bukaModal();
  }

  /* =====================================================
     DETAIL LOKASI
  ===================================================== */

  async function bukaDetailLokasi(idLokasi) {
    modalContent.innerHTML = `
      <div class="pjlp-modal-header">
        <h3>Detail Lokasi Kantor</h3>
      </div>

      <div class="pjlp-loading">
        Memuat detail lokasi...
      </div>
    `;

    bukaModal();

    try {
      const result = await apiRequest(
        'getDetailLokasiKantor',
        {
          ...getCredentials(),
          idLokasi
        }
      );

      const responseData = getResponseData(result);
      const record = responseData.data;

      if (!record) {
        throw new Error('Data lokasi tidak ditemukan.');
      }

      renderDetailLokasi(record);

    } catch (error) {
      console.error('Detail Lokasi:', error);

      modalContent.innerHTML = `
        <div class="pjlp-modal-header">
          <h3>Detail Lokasi Kantor</h3>
        </div>

        <div class="pjlp-error">
          ${escapeHTML(error.message)}
        </div>

        <div class="pjlp-modal-footer">
          <button type="button"
            class="btn-secondary"
            id="btnTutupErrorLokasi">
            Tutup
          </button>
        </div>
      `;

      modalContent.querySelector('#btnTutupErrorLokasi')
        .addEventListener('click', tutupModal);
    }
  }

  function renderDetailLokasi(record) {
    modalContent.innerHTML = `
      <div class="pjlp-modal-header">
        <div>
          <h3>Detail Lokasi Kantor</h3>
          <p>Informasi lengkap lokasi presensi.</p>
        </div>

        <button type="button"
          class="pjlp-modal-close"
          id="btnTutupDetailLokasi">
          &times;
        </button>
      </div>

      <div class="pjlp-detail-grid">

        <div class="pjlp-detail-item">
          <span>ID Lokasi</span>
          <strong>${escapeHTML(record.ID_Lokasi)}</strong>
        </div>

        <div class="pjlp-detail-item">
          <span>Nama Lokasi</span>
          <strong>${escapeHTML(record.Nama_Lokasi)}</strong>
        </div>

        <div class="pjlp-detail-item">
          <span>Latitude</span>
          <strong>${formatKoordinat(record.Latitude)}</strong>
        </div>

        <div class="pjlp-detail-item">
          <span>Longitude</span>
          <strong>${formatKoordinat(record.Longitude)}</strong>
        </div>

        <div class="pjlp-detail-item">
          <span>Radius Presensi</span>
          <strong>${escapeHTML(record.Radius_Meter)} meter</strong>
        </div>

        <div class="pjlp-detail-item">
          <span>Status</span>
          <strong>${escapeHTML(record.Status)}</strong>
        </div>

        <div class="pjlp-detail-item" style="grid-column:1/-1;">
          <span>Alamat Lengkap</span>
          <strong>${escapeHTML(record.Alamat_Lengkap)}</strong>
        </div>

        <div class="pjlp-detail-item" style="grid-column:1/-1;">
          <span>Catatan</span>
          <strong>${escapeHTML(record.Catatan || '-')}</strong>
        </div>

      </div>

      <div class="pjlp-modal-footer">
        <button type="button"
          class="btn-secondary"
          id="btnTutupDetailLokasi2">
          Tutup
        </button>

        <button type="button"
          class="btn-primary"
          id="btnEditLokasi">
          Edit Data
        </button>

        ${record.Status === 'Aktif' ? `
          <button type="button"
            class="btn-secondary"
            id="btnNonaktifLokasi">
            Nonaktifkan
          </button>
        ` : ''}
      </div>
    `;

    modalContent.querySelector('#btnTutupDetailLokasi')
      .addEventListener('click', tutupModal);

    modalContent.querySelector('#btnTutupDetailLokasi2')
      .addEventListener('click', tutupModal);

    modalContent.querySelector('#btnEditLokasi')
      .addEventListener('click', () => {
        renderFormLokasi(record);
      });

    const btnNonaktif = modalContent.querySelector('#btnNonaktifLokasi');

    if (btnNonaktif) {
      btnNonaktif.addEventListener('click', async () => {
        const yakin = confirm(
          `Apakah Anda yakin ingin menonaktifkan lokasi "${record.Nama_Lokasi}"?`
        );

        if (!yakin) return;

        btnNonaktif.disabled = true;
        btnNonaktif.textContent = 'Memproses...';

        try {
          const result = await apiRequest(
            'nonaktifkanLokasiKantor',
            {
              ...getCredentials(),
              idLokasi: record.ID_Lokasi
            }
          );

          getResponseData(result);

          alert('Lokasi kantor berhasil dinonaktifkan.');

          tutupModal();
          await muatDataLokasi();

        } catch (error) {
          console.error('Nonaktifkan Lokasi:', error);
          alert(error.message || 'Gagal menonaktifkan lokasi.');

          btnNonaktif.disabled = false;
          btnNonaktif.textContent = 'Nonaktifkan';
        }
      });
    }
  }

  /* =====================================================
     EVENT TOMBOL TABEL
  ===================================================== */

  tbody.addEventListener('click', event => {
    const button = event.target.closest('[data-action="detail"]');

    if (!button) return;

    bukaDetailLokasi(button.dataset.id);
  });

  /* =====================================================
     TAMBAH LOKASI
  ===================================================== */

  content.querySelector('#btnTambahLokasi')
    .addEventListener('click', () => {
      renderFormLokasi();
    });

  /* =====================================================
     MODAL
  ===================================================== */

  modal.addEventListener('click', event => {
    if (event.target === modal) {
      tutupModal();
    }
  });

  function handleEscape(event) {
    if (event.key === 'Escape' && modal.classList.contains('active')) {
      tutupModal();
    }
  }

  document.addEventListener('keydown', handleEscape);

  /* =====================================================
     LOAD AWAL
  ===================================================== */

  try {
    await muatDataLokasi();

  } catch (error) {
    console.error('Gagal memuat Lokasi Kantor:', error);

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
