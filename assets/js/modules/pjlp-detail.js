
import { apiRequest } from '../api.js';
import { APP_CONFIG } from '../config.js';

const FIELD_CONFIG = [
  { key: 'Nama_Pegawai', label: 'Nama Lengkap', required: true },
  { key: 'NIK', label: 'NIK', required: true },
  { key: 'Jenis_Kelamin', label: 'Jenis Kelamin', type: 'gender', required: true },
  { key: 'Tempat_Lahir', label: 'Tempat Lahir' },
  { key: 'Tanggal_Lahir', label: 'Tanggal Lahir', type: 'date' },
  { key: 'Alamat', label: 'Alamat', type: 'textarea' },
  { key: 'No_HP', label: 'Nomor HP' },
  { key: 'Jabatan', label: 'Jabatan', type: 'jabatan', required: true },
  { key: 'ID_Atasan', label: 'ID Atasan' },
  { key: 'Tanggal_Mulai_Kerja', label: 'Tanggal Mulai Kerja', type: 'date', required: true },
  { key: 'Foto_Profil_ID_Lampiran', label: 'ID Lampiran Foto Profil' },
  { key: 'Catatan', label: 'Catatan', type: 'textarea' }
];

const JABATAN = [
  'Resepsionis',
  'Asisten Pribadi Pimpinan',
  'Pengemudi',
  'Tenaga Kebersihan',
  'Tenaga Keamanan',
  'Pemungut Retribusi PKL'
];

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
  const response = result.data ?? result;
  if (!result.success || !response.success) {
    throw new Error(response.message || result.message || 'Permintaan gagal.');
  }
  return response.data;
}

function renderInput(field, value) {
  const safeValue = escapeHTML(value);

  if (field.type === 'gender') {
    return `
      <select name="${field.key}" ${field.required ? 'required' : ''}>
        <option value="">Pilih jenis kelamin</option>
        <option value="Laki-laki" ${value === 'Laki-laki' ? 'selected' : ''}>Laki-laki</option>
        <option value="Perempuan" ${value === 'Perempuan' ? 'selected' : ''}>Perempuan</option>
      </select>
    `;
  }

  if (field.type === 'jabatan') {
    return `
      <select name="${field.key}" required>
        <option value="">Pilih jabatan</option>
        ${JABATAN.map(jabatan => `
          <option value="${escapeHTML(jabatan)}"
            ${value === jabatan ? 'selected' : ''}>
            ${escapeHTML(jabatan)}
          </option>
        `).join('')}
      </select>
    `;
  }

  if (field.type === 'textarea') {
    return `
      <textarea name="${field.key}" rows="3"
        ${field.required ? 'required' : ''}>${safeValue}</textarea>
    `;
  }

  return `
    <input
      type="${field.type === 'date' ? 'date' : 'text'}"
      name="${field.key}"
      value="${safeValue}"
      ${field.required ? 'required' : ''}
      ${field.key === 'NIK'
        ? 'maxlength="16" inputmode="numeric" pattern="[0-9]{16}"'
        : ''}
    >
  `;
}

export async function openPJLPDetail(idPJLP, onUpdated) {
  const credentials = getCredentials();

  const modal = document.createElement('div');
  modal.className = 'pjlp-modal-overlay active';
  modal.id = 'modalDetailPJLP';

  modal.innerHTML = `
    <div class="pjlp-modal pjlp-detail-modal">
      <div class="pjlp-modal-header">
        <div>
          <h3>Detail Data PJLP</h3>
          <p>ID: ${escapeHTML(idPJLP)}</p>
        </div>
        <button type="button" class="pjlp-modal-close" id="closeDetailPJLP">
          &times;
        </button>
      </div>
      <div class="pjlp-detail-content">
        Memuat detail data...
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  function closeModal() {
    modal.remove();
    document.body.style.overflow = '';
  }

  modal.querySelector('#closeDetailPJLP')
    .addEventListener('click', closeModal);

  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });

  try {
    const result = await apiRequest('getDetailPJLP', {
      ...credentials,
      idPJLP
    });

    const record = getResponseData(result);

    if (!record) throw new Error('Data PJLP tidak ditemukan.');

    const detailContent = modal.querySelector('.pjlp-detail-content');

    function showDetail() {
      detailContent.innerHTML = `
        <div class="pjlp-detail-grid">
          <div class="pjlp-detail-item pjlp-detail-full">
            <span>ID PJLP</span>
            <strong>${escapeHTML(record.ID_PJLP)}</strong>
          </div>

          ${FIELD_CONFIG.map(field => `
            <div class="pjlp-detail-item ${field.type === 'textarea' ? 'pjlp-detail-full' : ''}">
              <span>${escapeHTML(field.label)}</span>
              <strong>${escapeHTML(record[field.key] || '-')}</strong>
            </div>
          `).join('')}
        </div>

        <div class="pjlp-modal-footer">
          <button type="button" class="btn-secondary" id="btnTutupDetail">
            Tutup
          </button>
          <button type="button" class="btn-primary" id="btnEditPJLP">
            Edit Data
          </button>
        </div>
      `;

      detailContent.querySelector('#btnTutupDetail')
        .addEventListener('click', closeModal);

      detailContent.querySelector('#btnEditPJLP')
        .addEventListener('click', showEditForm);
    }

    function showEditForm() {
      detailContent.innerHTML = `
        <form id="formEditPJLP">
          <div class="pjlp-form-note">
            ID PJLP: <strong>${escapeHTML(record.ID_PJLP)}</strong>
            <br>ID PJLP tidak dapat diubah.
          </div>

          <div class="pjlp-form-grid">
            ${FIELD_CONFIG.map(field => `
              <div class="pjlp-form-group ${field.type === 'textarea' ? 'pjlp-form-full' : ''}">
                <label>
                  ${escapeHTML(field.label)}
                  ${field.required ? '<span>*</span>' : ''}
                </label>
                ${renderInput(field, record[field.key] || '')}
              </div>
            `).join('')}
          </div>

          <div class="pjlp-modal-footer">
            <button type="button" class="btn-secondary" id="btnBatalEditPJLP">
              Batal
            </button>
            <button type="submit" class="btn-primary" id="btnUpdatePJLP">
              Simpan Perubahan
            </button>
          </div>
        </form>
      `;

      detailContent.querySelector('#btnBatalEditPJLP')
        .addEventListener('click', showDetail);

      const form = detailContent.querySelector('#formEditPJLP');
      const btnUpdate = detailContent.querySelector('#btnUpdatePJLP');

      form.addEventListener('submit', async event => {
        event.preventDefault();

        if (!form.reportValidity()) return;

        const data = Object.fromEntries(new FormData(form).entries());
        data.NIK = String(data.NIK || '').replace(/\D/g, '');

        if (!/^\d{16}$/.test(data.NIK)) {
          alert('NIK harus terdiri dari tepat 16 digit angka.');
          return;
        }

        btnUpdate.disabled = true;
        btnUpdate.textContent = 'Menyimpan...';

        try {
          const updateResult = await apiRequest('ubahDataPJLP', {
            ...credentials,
            idPJLP,
            data
          });

          getResponseData(updateResult);

          alert('Data PJLP berhasil diperbarui.');

          if (typeof onUpdated === 'function') {
            await onUpdated();
          }

          closeModal();

        } catch (error) {
          console.error('Edit PJLP:', error);
          alert(error.message || 'Gagal memperbarui data PJLP.');
          btnUpdate.disabled = false;
          btnUpdate.textContent = 'Simpan Perubahan';
        }
      });
    }

    showDetail();

  } catch (error) {
    console.error('Detail PJLP:', error);

    modal.querySelector('.pjlp-detail-content').innerHTML = `
      <div class="pjlp-error">
        ${escapeHTML(error.message)}
      </div>
      <div class="pjlp-modal-footer">
        <button type="button" class="btn-secondary" id="btnTutupDetailError">
          Tutup
        </button>
      </div>
    `;

    modal.querySelector('#btnTutupDetailError')
      .addEventListener('click', closeModal);
  }
}
