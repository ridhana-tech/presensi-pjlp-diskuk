
import { apiRequest } from '../api.js';
import { APP_CONFIG } from '../config.js';

export async function showDataPJLP(root) {
  const content = root.querySelector('#adminContent');
  if (!content) return;

  content.innerHTML = `
    <div class="pjlp-page">
      <div class="pjlp-toolbar">
        <div>
          <h2>Data PJLP</h2>
          <p>Pengelolaan data Pegawai Pemerintah dengan Perjanjian Kerja Jasa Lainnya.</p>
        </div>
        <button class="btn-primary" id="btnTambahPJLP">
          + Tambah PJLP
        </button>
      </div>

      <div class="pjlp-card">
        <div class="pjlp-card-header">
          <div>
            <h3>Daftar Pegawai PJLP</h3>
            <span id="pjlpTotal">Memuat data...</span>
          </div>
          <input
            type="search"
            id="searchPJLP"
            placeholder="Cari nama atau NIK..."
          >
        </div>

        <div class="pjlp-table-wrapper">
          <table class="pjlp-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>ID PJLP</th>
                <th>Nama Pegawai</th>
                <th>NIK</th>
                <th>Jenis Kelamin</th>
                <th>Jabatan</th>
                <th>No. HP</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody id="pjlpTableBody">
              <tr>
                <td colspan="8" class="pjlp-loading">
                  Memuat data PJLP...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL TAMBAH PJLP -->
    <div class="pjlp-modal-overlay" id="modalTambahPJLP">
      <div class="pjlp-modal">
        <div class="pjlp-modal-header">
          <div>
            <h3>Tambah Data PJLP</h3>
            <p>Lengkapi informasi pegawai PJLP.</p>
          </div>
          <button type="button" class="pjlp-modal-close" id="btnTutupModalPJLP">
            &times;
          </button>
        </div>

        <form id="formTambahPJLP">
          <div class="pjlp-form-grid">

            <div class="pjlp-form-group">
              <label>Nama Lengkap <span>*</span></label>
              <input type="text" name="Nama_Pegawai"
                placeholder="Masukkan nama lengkap" required maxlength="150">
            </div>

            <div class="pjlp-form-group">
              <label>NIK <span>*</span></label>
              <input type="text" name="NIK"
                placeholder="16 digit NIK" required
                inputmode="numeric" pattern="[0-9]{16}"
                maxlength="16">
            </div>

            <div class="pjlp-form-group">
              <label>Jenis Kelamin <span>*</span></label>
              <select name="Jenis_Kelamin" required>
                <option value="">Pilih jenis kelamin</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div class="pjlp-form-group">
              <label>Tempat Lahir</label>
              <input type="text" name="Tempat_Lahir"
                placeholder="Tempat lahir">
            </div>

            <div class="pjlp-form-group">
              <label>Tanggal Lahir</label>
              <input type="date" name="Tanggal_Lahir">
            </div>

            <div class="pjlp-form-group">
              <label>Nomor HP</label>
              <input type="tel" name="No_HP"
                placeholder="Contoh: 081234567890">
            </div>

            <div class="pjlp-form-group pjlp-form-full">
              <label>Alamat</label>
              <textarea name="Alamat" rows="2"
                placeholder="Alamat lengkap"></textarea>
            </div>

            <div class="pjlp-form-group">
              <label>Jabatan <span>*</span></label>
              <select name="Jabatan" required>
                <option value="">Pilih jabatan</option>
                <option value="Resepsionis">Resepsionis</option>
                <option value="Asisten Pribadi Pimpinan">Asisten Pribadi Pimpinan</option>
                <option value="Pengemudi">Pengemudi</option>
                <option value="Tenaga Kebersihan">Tenaga Kebersihan</option>
                <option value="Tenaga Keamanan">Tenaga Keamanan</option>
                <option value="Pemungut Retribusi PKL">Pemungut Retribusi PKL</option>
              </select>
            </div>

            <div class="pjlp-form-group">
              <label>ID Atasan</label>
              <input type="text" name="ID_Atasan"
                placeholder="Masukkan ID atasan jika ada">
            </div>

            <div class="pjlp-form-group">
              <label>Tanggal Mulai Kerja <span>*</span></label>
              <input type="date" name="Tanggal_Mulai_Kerja" required>
            </div>

            <div class="pjlp-form-group">
              <label>ID Lampiran Foto Profil</label>
              <input type="text" name="Foto_Profil_ID_Lampiran"
                placeholder="ID file foto di Google Drive">
            </div>

            <div class="pjlp-form-group pjlp-form-full">
              <label>Catatan</label>
              <textarea name="Catatan" rows="2"
                placeholder="Catatan tambahan (opsional)"></textarea>
            </div>

          </div>

          <div class="pjlp-form-note">
            <span>*</span> Wajib diisi. ID PJLP akan dibuat otomatis oleh sistem.
          </div>

          <div class="pjlp-modal-footer">
            <button type="button" class="btn-secondary" id="btnBatalPJLP">
              Batal
            </button>
            <button type="submit" class="btn-primary" id="btnSimpanPJLP">
              Simpan Data
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  let dataPJLP = [];

  const tbody = content.querySelector('#pjlpTableBody');
  const total = content.querySelector('#pjlpTotal');
  const search = content.querySelector('#searchPJLP');
  const modal = content.querySelector('#modalTambahPJLP');
  const form = content.querySelector('#formTambahPJLP');
  const btnSimpan = content.querySelector('#btnSimpanPJLP');

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[char]);
  }

  function renderTable(data) {
    total.textContent = `${data.length} data PJLP`;

    if (!data.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="pjlp-empty">
            Belum ada data PJLP.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = data.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHTML(item.ID_PJLP)}</td>
        <td><strong>${escapeHTML(item.Nama_Pegawai)}</strong></td>
        <td>${escapeHTML(item.NIK)}</td>
        <td>${escapeHTML(item.Jenis_Kelamin)}</td>
        <td>${escapeHTML(item.Jabatan)}</td>
        <td>${escapeHTML(item.No_HP)}</td>
        <td>
          <button class="btn-detail-pjlp"
            data-id="${escapeHTML(item.ID_PJLP)}">
            Detail
          </button>
        </td>
      </tr>
    `).join('');
  }

  async function muatDataPJLP() {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="pjlp-loading">Memuat data PJLP...</td>
      </tr>
    `;

    const token = localStorage.getItem(APP_CONFIG.SESSION.TOKEN_KEY);
    const deviceId = localStorage.getItem(APP_CONFIG.SESSION.DEVICE_KEY);

    const result = await apiRequest('getDataPJLP', {
      token,
      deviceId
    });

    const responseData = result.data ?? result;

    if (!result.success || !responseData.success) {
      throw new Error(responseData.message || result.message || 'Gagal mengambil data PJLP.');
    }

    dataPJLP = responseData.data || [];
    renderTable(dataPJLP);
  }

  function bukaModal() {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function tutupModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  content.querySelector('#btnTambahPJLP')
    .addEventListener('click', bukaModal);

  content.querySelector('#btnTutupModalPJLP')
    .addEventListener('click', tutupModal);

  content.querySelector('#btnBatalPJLP')
    .addEventListener('click', tutupModal);

  modal.addEventListener('click', event => {
    if (event.target === modal) tutupModal();
  });

  document.addEventListener('keydown', function handleEscape(event) {
    if (event.key === 'Escape' && modal.classList.contains('active')) {
      tutupModal();
    }
  });

  search.addEventListener('input', () => {
    const keyword = search.value.toLowerCase().trim();

    const filtered = dataPJLP.filter(item =>
      String(item.Nama_Pegawai || '').toLowerCase().includes(keyword) ||
      String(item.NIK || '').toLowerCase().includes(keyword)
    );

    renderTable(filtered);
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    data.NIK = String(data.NIK || '').replace(/\D/g, '');

    if (!/^\d{16}$/.test(data.NIK)) {
      alert('NIK harus terdiri dari tepat 16 digit angka.');
      return;
    }

    const token = localStorage.getItem(APP_CONFIG.SESSION.TOKEN_KEY);
    const deviceId = localStorage.getItem(APP_CONFIG.SESSION.DEVICE_KEY);

    btnSimpan.disabled = true;
    btnSimpan.textContent = 'Menyimpan...';

    try {
      const result = await apiRequest('tambahDataPJLP', {
        token,
        deviceId,
        data
      });

      const responseData = result.data ?? result;

      if (!result.success || !responseData.success) {
        throw new Error(responseData.message || result.message || 'Gagal menyimpan data PJLP.');
      }

      alert('Data PJLP berhasil ditambahkan.');

      form.reset();
      tutupModal();

      await muatDataPJLP();

    } catch (error) {
      console.error('Tambah PJLP:', error);
      alert(error.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      btnSimpan.disabled = false;
      btnSimpan.textContent = 'Simpan Data';
    }
  });

  try {
    await muatDataPJLP();
  } catch (error) {
    console.error('Gagal memuat Data PJLP:', error);
    total.textContent = 'Gagal memuat data';
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="pjlp-error">
          ${escapeHTML(error.message)}
        </td>
      </tr>
    `;
  }
}
