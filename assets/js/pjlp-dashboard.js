import { APP_CONFIG } from './config.js';

const NAV_ITEMS = [
  { id: 'beranda', label: 'Beranda', icon: 'bi-house-door' },
  { id: 'rekap', label: 'Rekap', icon: 'bi-calendar3' },
  { id: 'akun', label: 'Akun', icon: 'bi-person-circle' }
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

function formatTanggal() {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: APP_CONFIG.TIMEZONE
  }).format(new Date());
}

function renderBeranda(user) {
  const nama = escapeHTML(user.username || 'Rekan PJLP');

  return `
    <section class="pjlp-mobile-welcome">
      <div>
        <span class="pjlp-eyebrow">PRESENSI PJLP DISKUKTRANS</span>
        <h1>Halo, ${nama} 👋</h1>
        <p>Selamat bekerja dan semoga aktivitas hari ini berjalan lancar.</p>
      </div>
      <div class="pjlp-mobile-date">
        <i class="bi bi-calendar-event"></i>
        <span>${escapeHTML(formatTanggal())}</span>
      </div>
    </section>

    <section class="pjlp-attendance-card">
      <div class="pjlp-section-heading">
        <div>
          <span class="pjlp-eyebrow">AKTIVITAS HARI INI</span>
          <h2>Presensi Saya</h2>
        </div>
        <span class="pjlp-status-pill"><span></span> Hari ini</span>
      </div>

      <div class="pjlp-attendance-times">
        <div class="pjlp-time-item">
          <span class="pjlp-time-icon"><i class="bi bi-box-arrow-in-right"></i></span>
          <div><small>Presensi Masuk</small><strong>--:--</strong><em>Belum tercatat</em></div>
        </div>
        <div class="pjlp-time-divider"></div>
        <div class="pjlp-time-item">
          <span class="pjlp-time-icon"><i class="bi bi-box-arrow-right"></i></span>
          <div><small>Presensi Pulang</small><strong>--:--</strong><em>Belum tercatat</em></div>
        </div>
      </div>

      <button type="button" class="pjlp-primary-action" data-page="presensi">
        <i class="bi bi-camera"></i> Buka Presensi
        <i class="bi bi-arrow-right"></i>
      </button>
      <p class="pjlp-card-note">Presensi menggunakan foto selfie dan validasi lokasi.</p>
    </section>

    <section class="pjlp-quick-section">
      <div class="pjlp-section-heading">
        <div><span class="pjlp-eyebrow">LAYANAN PEGAWAI</span><h2>Akses Cepat</h2></div>
      </div>
      <div class="pjlp-quick-grid">
        <button type="button" class="pjlp-quick-card" data-page="presensi">
          <span class="pjlp-quick-icon blue"><i class="bi bi-camera"></i></span>
          <strong>Presensi</strong><small>Masuk dan pulang</small>
        </button>
        <button type="button" class="pjlp-quick-card" data-page="rekap">
          <span class="pjlp-quick-icon green"><i class="bi bi-calendar-check"></i></span>
          <strong>Rekap</strong><small>Riwayat kehadiran</small>
        </button>
        <button type="button" class="pjlp-quick-card" data-page="logbook">
          <span class="pjlp-quick-icon purple"><i class="bi bi-journal-text"></i></span>
          <strong>Logbook</strong><small>Catatan kegiatan</small>
        </button>
        <button type="button" class="pjlp-quick-card" data-page="izin">
          <span class="pjlp-quick-icon orange"><i class="bi bi-envelope-paper"></i></span>
          <strong>Pengajuan Izin</strong><small>Sampaikan izin</small>
        </button>
      </div>
    </section>
  `;
}

function renderPlaceholder(title, description, icon) {
  return `
    <section class="pjlp-mobile-page-heading">
      <span class="pjlp-eyebrow">AREA PEGAWAI</span>
      <h1>${title}</h1>
      <p>${description}</p>
    </section>
    <section class="pjlp-mobile-empty">
      <span><i class="bi ${icon}"></i></span>
      <h2>Modul siap dikembangkan</h2>
      <p>Tampilan dasar sudah disiapkan. Integrasi data dan proses pada modul ini akan dilakukan setelah endpoint backend tersedia.</p>
    </section>
  `;
}

function renderAkun(user) {
  return `
    <section class="pjlp-mobile-page-heading">
      <span class="pjlp-eyebrow">PENGATURAN</span>
      <h1>Akun Saya</h1>
      <p>Informasi akun yang digunakan untuk mengakses aplikasi.</p>
    </section>
    <section class="pjlp-account-card">
      <div class="pjlp-account-avatar"><i class="bi bi-person-fill"></i></div>
      <h2>${escapeHTML(user.username || '-')}</h2>
      <span class="pjlp-account-role">PJLP</span>
      <div class="pjlp-account-details">
        <div><small>ID Pengguna</small><strong>${escapeHTML(user.idPengguna || '-')}</strong></div>
        <div><small>ID PJLP</small><strong>${escapeHTML(user.idPegawai || '-')}</strong></div>
        <div><small>Status Akun</small><strong>${escapeHTML(user.statusAkun || '-')}</strong></div>
      </div>
      <button type="button" class="pjlp-logout-button" id="pjlpLogout">
        <i class="bi bi-box-arrow-right"></i> Keluar dari Aplikasi
      </button>
    </section>
  `;
}

export async function initializePJLPDashboard(user, onLogout) {
  const root = document.getElementById('dashboardRoot');
  if (!root) throw new Error('Elemen dashboardRoot tidak ditemukan.');

  root.innerHTML = `
    <div class="pjlp-mobile-app">
      <header class="pjlp-mobile-header">
        <div class="pjlp-mobile-brand">
          <span class="pjlp-brand-icon"><i class="bi bi-calendar2-check"></i></span>
          <div><strong>Presensi PJLP</strong><small>DISKUKTRANS ESDM</small></div>
        </div>
        <span class="pjlp-header-avatar"><i class="bi bi-person-fill"></i></span>
      </header>

      <main class="pjlp-mobile-content" id="pjlpMobileContent"></main>

      <nav class="pjlp-bottom-nav" aria-label="Navigasi utama">
        ${NAV_ITEMS.map(item => `
          <button type="button" data-nav="${item.id}" class="${item.id === 'beranda' ? 'active' : ''}">
            <i class="bi ${item.icon}"></i><span>${item.label}</span>
          </button>
        `).join('')}
      </nav>
    </div>
  `;

  const content = root.querySelector('#pjlpMobileContent');
  const nav = root.querySelector('.pjlp-bottom-nav');

  function showPage(page) {
    nav.querySelectorAll('[data-nav]').forEach(button => {
      button.classList.toggle('active', button.dataset.nav === page);
    });

    if (page === 'beranda') {
      content.innerHTML = renderBeranda(user);
    } else if (page === 'rekap') {
      content.innerHTML = renderPlaceholder(
        'Rekap Presensi',
        'Pantau riwayat kehadiran dan keterlambatan Anda.',
        'bi-calendar3'
      );
    } else if (page === 'akun') {
      content.innerHTML = renderAkun(user);
      content.querySelector('#pjlpLogout')?.addEventListener('click', onLogout);
    } else if (page === 'presensi') {
      content.innerHTML = renderPlaceholder(
        'Presensi',
        'Lakukan presensi masuk dan pulang dengan selfie serta validasi lokasi.',
        'bi-camera'
      );
    } else if (page === 'logbook') {
      content.innerHTML = renderPlaceholder(
        'Logbook Kegiatan',
        'Catat aktivitas pekerjaan harian Anda.',
        'bi-journal-text'
      );
    } else if (page === 'izin') {
      content.innerHTML = renderPlaceholder(
        'Pengajuan Izin',
        'Ajukan izin sakit, pernikahan, keluarga meninggal, atau melahirkan.',
        'bi-envelope-paper'
      );
    }

    content.querySelectorAll('[data-page]').forEach(button => {
      button.addEventListener('click', () => showPage(button.dataset.page));
    });
  }

  nav.querySelectorAll('[data-nav]').forEach(button => {
    button.addEventListener('click', () => showPage(button.dataset.nav));
  });

  showPage('beranda');
}
