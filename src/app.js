import { renderTopbar, updateTopbar, startClock } from './components/topbar.js';
import { renderNavView } from './components/navView.js';
import { renderListView } from './components/listView.js';
import { renderReportView } from './components/reportView.js';
import { groupStops } from './lib/groups.js';
import { getDistanceToAddress, getCurrentPosition } from './lib/geo.js';
import { openNavigation, copyAddress } from './lib/maps.js';
import { fileToDataUrl, savePhoto, getPhoto, clearAllPhotos } from './lib/photoStorage.js';
import {
  buildReportText,
  buildCsv,
  downloadPdf,
  shareWhatsApp,
  copyText,
  downloadFile,
} from './lib/report.js';
import {
  loadState,
  setStopStatus,
  setGroupStatus,
  setNote,
  undo,
  jumpToGroup,
  resetTour,
  setSetting,
  exportState,
  importState,
} from './lib/state.js';
import { loadTour, fullAddress } from './lib/tours.js';
import { bindSwipe, confirmDialog, toast, vibrate } from './lib/utils.js';
import { STATUS } from './lib/constants.js';

export class App {
  constructor(root) {
    this.root = root;
    this.tour = loadTour('tour-186');
    this.groups = groupStops(this.tour.stops);
    this.state = loadState(this.tour.id, this.groups);
    this.activeTab = 'nav';
    this.listFilter = '';
    this.position = null;
    this.distanceInfo = null;
    this.reportText = '';
  }

  async init() {
    this.render();
    startClock();
    this.bindEvents();
    this.refreshGps();
    setInterval(() => this.refreshGps(), 60000);
  }

  render() {
    this.root.innerHTML = `
      ${renderTopbar(this.tour, this.state, this.tour.stops.length)}
      <nav class="tabs" aria-label="Hauptnavigation">
        <button class="tab ${this.activeTab === 'nav' ? 'active' : ''}" data-tab="nav">🧭 Aktuell</button>
        <button class="tab ${this.activeTab === 'list' ? 'active' : ''}" data-tab="list">📋 Alle</button>
        <button class="tab ${this.activeTab === 'report' ? 'active' : ''}" data-tab="report">📊 Bericht</button>
      </nav>
      <main class="view ${this.activeTab === 'nav' ? 'active' : ''}" id="view-nav"></main>
      <main class="view ${this.activeTab === 'list' ? 'active' : ''}" id="view-list"></main>
      <main class="view ${this.activeTab === 'report' ? 'active' : ''}" id="view-report"></main>
    `;
    this.renderActiveView();
  }

  renderActiveView() {
    updateTopbar(this.tour, this.state, this.tour.stops.length);

    if (this.activeTab === 'nav') {
      const el = document.getElementById('view-nav');
      el.innerHTML = renderNavView(this.tour, this.state, this.groups, this.distanceInfo);
      this.bindSwipeOnCard();
      this.loadPhotoHints();
    } else if (this.activeTab === 'list') {
      document.getElementById('view-list').innerHTML = renderListView(
        this.tour,
        this.state,
        this.groups,
        this.listFilter
      );
      const current = document.querySelector('.list-item.is-current');
      current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    } else if (this.activeTab === 'report') {
      document.getElementById('view-report').innerHTML = renderReportView(this.tour, this.state);
      this.reportText = buildReportText(this.tour, this.state.statuses, this.state.notes, this.state.startTime);
    }
  }

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.querySelectorAll('.view').forEach((v) => {
      v.classList.toggle('active', v.id === `view-${tab}`);
    });
    this.renderActiveView();
  }

  async refreshGps() {
    try {
      this.position = await getCurrentPosition();
      const group = this.groups[this.state.currentGroupIndex];
      if (group) {
        this.distanceInfo = await getDistanceToAddress(fullAddress(group.stops[0]), this.position);
        const badge = document.querySelector('.distance-badge');
        if (badge && this.distanceInfo) {
          badge.textContent = `📍 ${this.distanceInfo.formatted} · ca. ${this.distanceInfo.eta} Min.`;
        }
      }
    } catch {
      this.distanceInfo = null;
    }
  }

  bindSwipeOnCard() {
    const card = document.getElementById('swipe-card');
    if (!card || this.state.currentGroupIndex >= this.groups.length) return;

    const group = this.groups[this.state.currentGroupIndex];
    bindSwipe(card, {
      onRight: () => {
        if (group.stops.length === 1) {
          this.handleStopStatus(group.stops[0].id, STATUS.DELIVERED);
        } else {
          this.handleGroupStatus(STATUS.DELIVERED);
        }
      },
      onLeft: () => {
        if (group.stops.length === 1) {
          this.handleStopStatus(group.stops[0].id, STATUS.NOT_HOME);
        } else {
          this.handleGroupStatus(STATUS.NOT_HOME);
        }
      },
    });
  }

  async loadPhotoHints() {
    const group = this.groups[this.state.currentGroupIndex];
    if (!group || group.stops.length !== 1) return;
    const stop = group.stops[0];
    const hint = document.getElementById(`photo-hint-${stop.id}`);
    if (hint) {
      const photo = await getPhoto(stop.id);
      hint.textContent = photo ? '✓ Foto gespeichert' : '';
    }
  }

  handleStopStatus(stopId, status) {
    vibrate();
    setStopStatus(this.state, stopId, status, this.groups);
    this.afterStatusChange();
  }

  handleGroupStatus(status) {
    vibrate();
    const group = this.groups[this.state.currentGroupIndex];
    setGroupStatus(this.state, group, status, this.groups);
    this.afterStatusChange();
  }

  afterStatusChange() {
    this.renderActiveView();
    this.refreshGps();

    if (this.state.autoNav && this.state.currentGroupIndex < this.groups.length) {
      setTimeout(() => {
        const group = this.groups[this.state.currentGroupIndex];
        if (group) {
          openNavigation(fullAddress(group.stops[0]), this.state.navProvider);
        }
      }, 400);
    }
  }

  bindEvents() {
    this.root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;

      if (action === 'navigate') {
        openNavigation(btn.dataset.address, this.state.navProvider);
        return;
      }
      if (action === 'copy-address') {
        copyAddress(btn.dataset.address).then((ok) => toast(ok ? 'Adresse kopiert' : 'Kopieren fehlgeschlagen'));
        return;
      }
      if (action === 'set-nav') {
        setSetting(this.state, 'navProvider', btn.dataset.provider);
        this.renderActiveView();
        return;
      }
      if (action === 'stop-status') {
        this.handleStopStatus(btn.dataset.stop, btn.dataset.status);
        return;
      }
      if (action === 'group-status') {
        this.handleGroupStatus(btn.dataset.status);
        return;
      }
      if (action === 'undo') {
        if (undo(this.state, this.groups)) {
          toast('Rückgängig');
          this.renderActiveView();
        }
        return;
      }
      if (action === 'jump-group') {
        jumpToGroup(this.state, parseInt(btn.dataset.group, 10));
        this.switchTab('nav');
        return;
      }
      if (action === 'reset-tour') {
        if (confirmDialog('Tour wirklich neu starten? Alle Daten gehen verloren.')) {
          clearAllPhotos();
          this.state = resetTour(this.state);
          toast('Tour neu gestartet');
          this.renderActiveView();
        }
        return;
      }
      if (action === 'share-whatsapp') {
        shareWhatsApp(this.reportText);
        return;
      }
      if (action === 'copy-report') {
        copyText(this.reportText).then((ok) => toast(ok ? 'Kopiert!' : 'Fehler beim Kopieren'));
        return;
      }
      if (action === 'download-pdf') {
        downloadPdf(this.tour, this.state.statuses, this.state.notes, this.state.startTime);
        return;
      }
      if (action === 'download-csv') {
        downloadFile(buildCsv(this.tour, this.state.statuses, this.state.notes), `${this.tour.id}.csv`, 'text/csv');
        toast('CSV heruntergeladen');
        return;
      }
      if (action === 'export-state') {
        downloadFile(exportState(this.state), `${this.tour.id}-backup.json`, 'application/json');
        toast('Backup exportiert');
        return;
      }
    });

    this.root.addEventListener('change', async (e) => {
      const target = e.target;

      if (target.dataset.action === 'toggle-auto-nav') {
        setSetting(this.state, 'autoNav', target.checked);
        return;
      }

      if (target.dataset.action === 'photo') {
        const file = target.files?.[0];
        if (!file) return;
        const dataUrl = await fileToDataUrl(file);
        await savePhoto(target.dataset.stop, dataUrl);
        toast('Foto gespeichert');
        this.loadPhotoHints();
        return;
      }

      if (target.dataset.action === 'import-state') {
        const file = target.files?.[0];
        if (!file) return;
        const text = await file.text();
        try {
          this.state = importState(this.tour.id, text, this.groups);
          toast('Fortschritt importiert');
          this.renderActiveView();
        } catch {
          toast('Import fehlgeschlagen');
        }
      }
    });

    this.root.addEventListener('input', (e) => {
      if (e.target.id === 'list-search') {
        this.listFilter = e.target.value;
        document.getElementById('view-list').innerHTML = renderListView(
          this.tour,
          this.state,
          this.groups,
          this.listFilter
        );
        return;
      }
      if (e.target.dataset.note) {
        setNote(this.state, e.target.dataset.note, e.target.value);
      }
    });

    this.root.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-tab]');
      if (tab) this.switchTab(tab.dataset.tab);
    });
  }
}
