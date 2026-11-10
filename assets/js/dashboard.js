
import { showDataPJLP } from './modules/pjlp.js';
import { showDataAtasan } from './modules/atasan.js';
import { showDataLokasi } from './modules/lokasi.js';
import { showDataJadwal } from './modules/jadwal.js';

const ADMIN_MENUS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'bi-grid-1x2' },
  { id: 'pjlp', label: 'Data PJLP', icon: 'bi-people' },
  { id: 'atasan', label: 'Data Atasan', icon: 'bi-person-badge' },
  { id: 'presensi', label: 'Presensi', icon: 'bi-calendar-check' },
  { id: 'persetujuan', label: 'Persetujuan', icon: 'bi-clipboard-check' },
  { id: 'lokasi', label: 'Lokasi Kantor', icon: 'bi-geo-alt' },
  { id: 'jadwal', label: 'Jadwal Kerja', icon: 'bi-calendar-week' },
  { id: 'logbook', label: 'Logbook', icon: 'bi-journal-text' },
  { id: 'laporan', label: 'Laporan', icon: 'bi-file-earmark-bar-graph' },
  { id: 'pengguna', label: 'Pengguna & Akun', icon: 'bi-person-lock' },
  { id: 'konfigurasi', label: 'Konfigurasi', icon: 'bi-gear' },
  { id: 'aktivitas', label: 'Log Aktivitas', icon: 'bi-clock-history' },
];

let currentDashboardUser = null;
let currentLogoutHandler = null;

const MODULE_INFO = {
  pjlp: {
    title: 'Data PJLP',
    description: 'Pengelolaan data tenaga PJLP.'
  },
  atasan: {
    title: 'Data Atasan',
    description: 'Pengelolaan data atasan dan pejabat yang berwenang.'
  },
  presensi: {
    title: 'Presensi',
    description: 'Monitoring dan pengelolaan data presensi PJLP.'
  },
  persetujuan: {
    title: 'Persetujuan',
    description: 'Pemeriksaan dan persetujuan pengajuan PJLP.'
  },
  lokasi: {
    title: 'Lokasi Kantor',
    description: 'Pengaturan titik koordinat dan radius kantor.'
  },
  jadwal: {
    title: 'Jadwal Kerja',
    description: 'Pengelolaan master jadwal dan jam kerja PJLP.'
  },
  logbook: {
    title: 'Logbook',
    description: 'Pemeriksaan dan pengelolaan logbook bulanan PJLP.'
  },
  laporan: {
    title: 'Laporan',
    description: 'Rekapitulasi dan pencetakan laporan presensi.'
  },
  pengguna: {
    title: 'Pengguna & Akun',
    description: 'Pengelolaan akun dan hak akses aplikasi.'
  },
  konfigurasi: {
    title: 'Konfigurasi',
    description: 'Pengaturan parameter aplikasi Presensi PJLP.'
  },
  aktivitas: {
    title: 'Log Aktivitas',
    description: 'Riwayat aktivitas pengguna dalam aplikasi.'
  }
};


/**
 * Inisialisasi dashboard Admin.
 */
export async function initializeDashboard(user, onLogout) {
  currentDashboardUser = user;
  currentLogoutHandler = onLogout;
  const root = document.getElementById('dashboardRoot');

  if (!root) {
    throw new Error('Elemen dashboardRoot tidak ditemukan.');
  }

  root.innerHTML = `
    <div class="admin-layout">

      <!-- SIDEBAR -->
      <aside class="admin-sidebar" id="adminSidebar">

        <div class="sidebar-brand">
          <div class="sidebar-brand-icon">
            <i class="bi bi-calendar2-check"></i>
          </div>

          <div>
            <h2>Presensi PJLP</h2>
            <p>DISKUKTRANS ESDM</p>
          </div>
        </div>

        <div class="sidebar-section-label">
          MENU UTAMA
        </div>

        <nav class="sidebar-navigation">
          ${ADMIN_MENUS.map(menu => `
            <button
              type="button"
              class="sidebar-link ${menu.id === 'dashboard' ? 'active' : ''}"
              data-module="${menu.id}"
            >
              <i class="bi ${menu.icon}"></i>
              <span>${menu.label}</span>
            </button>
          `).join('')}
        </nav>

        <div class="sidebar-bottom">
          <div class="sidebar-version">
            <span class="version-dot"></span>
            Sistem Presensi PJLP
            <small>Versi 1.0.0</small>
          </div>
        </div>

      </aside>


      <!-- AREA UTAMA -->
      <div class="admin-main">

        <!-- HEADER -->
        <header class="admin-header">

          <div class="header-left">
            <button
              type="button"
              class="sidebar-toggle"
              id="sidebarToggle"
              aria-label="Buka navigasi"
            >
              <i class="bi bi-list"></i>
            </button>

            <div class="header-breadcrumb">
              <span>Presensi PJLP</span>
              <i class="bi bi-chevron-right"></i>
              <strong id="breadcrumbTitle">Dashboard</strong>
            </div>
          </div>

          <div class="header-right">

            <div class="header-date" id="headerDate"></div>

            <div class="header-divider"></div>

            <div class="admin-profile">
              <div class="profile-avatar">
                <i class="bi bi-person-fill"></i>
              </div>

              <div class="profile-information">
                <strong>${escapeHTML(user.username)}</strong>
                <span>Administrator</span>
              </div>
            </div>

            <button
              type="button"
              class="btn-logout"
              id="logoutButton"
              title="Keluar"
              aria-label="Keluar dari aplikasi"
            >
              <i class="bi bi-box-arrow-right"></i>
            </button>

          </div>

        </header>


        <!-- KONTEN -->
        <main class="admin-content" id="adminContent">

          <section class="welcome-section">
            <div>
              <span class="welcome-label">ADMINISTRATOR</span>
              <h1>Selamat Datang, ${escapeHTML(user.username)}!</h1>
              <p>
                Berikut adalah ringkasan sistem Presensi PJLP
                DISKUKTRANS ESDM Kabupaten Karanganyar.
              </p>
            </div>

            <div class="welcome-decoration">
              <i class="bi bi-calendar2-check"></i>
            </div>
          </section>


          <!-- STATISTIK -->
          <section class="statistics-grid">

            <article class="stat-card">
              <div class="stat-icon blue">
                <i class="bi bi-people"></i>
              </div>

              <div class="stat-information">
                <span>Total PJLP</span>
                <strong>—</strong>
                <small>Tenaga PJLP terdaftar</small>
              </div>
            </article>

            <article class="stat-card">
              <div class="stat-icon green">
                <i class="bi bi-person-check"></i>
              </div>

              <div class="stat-information">
                <span>Hadir Hari Ini</span>
                <strong>—</strong>
                <small>Termasuk DL dan DLDD disetujui</small>
              </div>
            </article>

            <article class="stat-card">
              <div class="stat-icon orange">
                <i class="bi bi-clock-history"></i>
              </div>

              <div class="stat-information">
                <span>Terlambat</span>
                <strong>—</strong>
                <small>Presensi terlambat hari ini</small>
              </div>
            </article>

            <article class="stat-card">
              <div class="stat-icon purple">
                <i class="bi bi-calendar-x"></i>
              </div>

              <div class="stat-information">
                <span>Izin</span>
                <strong>—</strong>
                <small>Izin disetujui hari ini</small>
              </div>
            </article>

          </section>


          <!-- KONTEN BAWAH -->
          <section class="dashboard-bottom-grid">

            <div class="dashboard-panel">

              <div class="panel-heading">
                <div>
                  <h3>Aktivitas Presensi</h3>
                  <p>Ringkasan aktivitas presensi hari ini</p>
                </div>

                <span class="panel-badge">
                  Hari Ini
                </span>
              </div>

              <div class="empty-state">
                <div class="empty-state-icon">
                  <i class="bi bi-calendar2-week"></i>
                </div>

                <strong>Data belum tersedia</strong>

                <p>
                  Data presensi akan ditampilkan setelah
                  integrasi modul presensi selesai.
                </p>
              </div>

            </div>


            <div class="dashboard-panel">

              <div class="panel-heading">
                <div>
                  <h3>Informasi Akun</h3>
                  <p>Identitas administrator</p>
                </div>
              </div>

              <div class="account-information">

                <div class="account-row">
                  <span>ID Pengguna</span>
                  <strong>${escapeHTML(user.idPengguna || '-')}</strong>
                </div>

                <div class="account-row">
                  <span>Username</span>
                  <strong>${escapeHTML(user.username || '-')}</strong>
                </div>

                <div class="account-row">
                  <span>Role</span>
                  <strong>Administrator</strong>
                </div>

                <div class="account-row">
                  <span>Status Akun</span>
                  <span class="account-status">
                    <span></span> Aktif
                  </span>
                </div>

              </div>

            </div>

          </section>


          <!-- FOOTER -->
          <footer class="admin-footer">
            <span>Presensi PJLP DISKUKTRANS ESDM</span>
            <span>Kabupaten Karanganyar &copy; ${new Date().getFullYear()}</span>
          </footer>

        </main>

      </div>

    </div>
  `;


  // Tanggal pada header
  updateHeaderDate();


  // Navigasi menu
  
// Navigasi menu

root.querySelectorAll('[data-module]').forEach(button => {
  button.addEventListener('click', () => {
    const moduleId = button.dataset.module;

    if (moduleId === 'dashboard') {
      showDashboardHome(root);

    } else if (moduleId === 'pjlp') {
      showDataPJLP(root);

    } else if (moduleId === 'atasan') {
      showDataAtasan(root);

    } else if (moduleId === 'lokasi') {
      showDataLokasi(root);

    } else if (moduleId === 'jadwal') {
      showDataJadwal(root);

    } else {
      showModulePlaceholder(root, moduleId);
    }

    // Active menu
    root.querySelectorAll('[data-module]').forEach(item => {
      item.classList.toggle(
        'active',
        item.dataset.module === moduleId
      );
    });

    // Breadcrumb
    const title = moduleId === 'dashboard'
      ? 'Dashboard'
      : MODULE_INFO[moduleId]?.title || 'Dashboard';

    document.getElementById('breadcrumbTitle').textContent = title;

    // Tutup sidebar mobile
    document.getElementById('adminSidebar')
      .classList.remove('sidebar-open');
  });
});




  // Toggle sidebar mobile
  const toggle = document.getElementById('sidebarToggle');

  toggle?.addEventListener('click', () => {
    document.getElementById('adminSidebar')
      .classList.toggle('sidebar-open');
  });


  // Logout
  document.getElementById('logoutButton')
    ?.addEventListener('click', onLogout);
}


/**
 * Kembali ke tampilan utama dashboard.
 */
function showDashboardHome(root) {
  if (!currentDashboardUser || !currentLogoutHandler) return;

  initializeDashboard(
    currentDashboardUser,
    currentLogoutHandler
  );
}


/**
 * Tampilan sementara untuk modul yang belum dikembangkan.
 */
function showModulePlaceholder(root, moduleId) {
  const module = MODULE_INFO[moduleId];

  if (!module) return;

  const content = root.querySelector('#adminContent');

  content.innerHTML = `
    <section class="module-page-heading">
      <span class="welcome-label">MODUL ADMINISTRASI</span>
      <h1>${module.title}</h1>
      <p>${module.description}</p>
    </section>

    <section class="dashboard-panel module-placeholder">
      <div class="empty-state">
        <div class="empty-state-icon">
          <i class="bi bi-cone-striped"></i>
        </div>

        <strong>Modul sedang dalam pengembangan</strong>

        <p>
          Fitur ${module.title} akan dibangun dan diintegrasikan
          dengan database Google Spreadsheet pada tahap berikutnya.
        </p>

        <button
          type="button"
          class="btn-back-dashboard"
          id="backToDashboard"
        >
          <i class="bi bi-arrow-left"></i>
          Kembali ke Dashboard
        </button>
      </div>
    </section>

    <footer class="admin-footer">
      <span>Presensi PJLP DISKUKTRANS ESDM</span>
      <span>Kabupaten Karanganyar &copy; ${new Date().getFullYear()}</span>
    </footer>
  `;

  content.querySelector('#backToDashboard')
    ?.addEventListener('click', () => {
      const dashboardButton = root.querySelector(
        '[data-module="dashboard"]'
      );

      dashboardButton?.click();
    });
}


/**
 * Tanggal Indonesia.
 */
function updateHeaderDate() {
  const element = document.getElementById('headerDate');

  if (!element) return;

  element.textContent = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  }).format(new Date());
}


/**
 * Escape HTML untuk data pengguna.
 */
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    return entities[character];
  });
}
