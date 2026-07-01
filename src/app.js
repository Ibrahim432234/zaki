import { renderTopbar, updateTopbar, startClock } from './components/topbar.js';
import { renderNavView, renderActionDock, getCurrentGroup } from './components/navView.js';
import { renderListView } from './components/listView.js';
import { renderReportView } from './components/reportView.js';
import { showConfirm, showSettingsSheet } from './components/modal.js';
import { groupStops } from './lib/groups.js';
import { requestNavigation, copyAddress } from './lib/maps.js';
import { buildReportText, shareWhatsApp } from './lib/report.js';
import { clearAllPhotos } from './lib/photoStorage.js';
import { loadSettings, updateSetting } from './lib/settings.js';
import {
  loadState,
  setStopStatus,
  setGroupStatus,
  undo,
  jumpToGroup,
  stepNav,
  resetTour,
} from './lib/state.js';
import { loadTour, fullAddress } from './lib/tours.js';
import { requestWakeLock, onVisibilityWakeLock } from './lib/wakeLock.js';
import { toast, vibrate } from './lib/utils.js';
import { STATUS } from './lib/constants.js';

export class App {
  constructor(root) {
    this.root = root;
    this.tour = loadTour('tour-186');
    this.groups = groupStops(this.tour.stops);
    this.state = loadState(this.tour.id, this.groups, this.tour.stops);
    this.settings = loadSettings();
    this.activeTab = 'nav';
    this.listFilter = '';
    this.listStatusFilter = 'all';
    this.reportText = '';
    this.flashTimer = null;
  }

  async init() {
    this.render();
    startClock();
    this.bindEvents();
    await requestWakeLock();
    onVisibilityWakeLock(() => this.activeTab === 'nav');
  }

  isTourActive() {
    return this.state.currentGroupIndex < this.groups.length;
  }

  render() {
    const showDock = this.activeTab === 'nav' && this.isTourActive();
    const group = getCurrentGroup(this.groups, this.state);

    this.root.innerHTML = `
      ${renderTopbar(this.tour, this.state, this.tour.stops.length)}
      <nav class="tabs">
        <button type="button" class="tab ${this.activeTab === 'nav' ? 'active' : ''}" data-tab="nav">Fahren</button>
        <button type="button" class="tab ${this.activeTab === 'list' ? 'active' : ''}" data-tab="list">Stopps</button>
      </nav>
      <div class="content-area ${showDock ? 'has-dock' : ''}">
        <main class="view ${this.activeTab === 'nav' ? 'active' : ''}" id="view-nav"></main>
        <main class="view ${this.activeTab === 'list' ? 'active' : ''}" id="view-list"></main>
        <main class="view ${this.activeTab === 'report' ? 'active' : ''}" id="view-report"></main>
      </div>
      <div id="dock-slot">${showDock ? renderActionDock(group, this.state) : ''}</div>
      <div class="flash-overlay" id="flash-overlay" aria-hidden="true"></div>
    `;
    this.renderActiveView();
  }

  renderActiveView() {
    updateTopbar(this.tour, this.state, this.tour.stops.length);

    const showDock = this.activeTab === 'nav' && this.isTourActive();
    const group = getCurrentGroup(this.groups, this.state);
    const dockSlot = document.getElementById('dock-slot');
    const contentArea = document.querySelector('.content-area');

    if (dockSlot) dockSlot.innerHTML = showDock ? renderActionDock(group, this.state) : '';
    if (contentArea) contentArea.classList.toggle('has-dock', showDock);

    if (this.activeTab === 'nav') {
      document.getElementById('view-nav').innerHTML = renderNavView(this.tour, this.state, this.groups);
    } else if (this.activeTab === 'list') {
      this.refreshListView();
      document.querySelector('.list-row.is-active')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    } else if (this.activeTab === 'report') {
      document.getElementById('view-report').innerHTML = renderReportView(this.tour, this.state);
      this.reportText = buildReportText(this.tour, this.state.statuses, this.state.notes, this.state.startTime);
    }
  }

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${tab}`));
    this.renderActiveView();
    if (tab === 'nav') requestWakeLock();
  }

  getActiveGroup() {
    return this.groups[this.state.currentGroupIndex] ?? null;
  }

  getActiveAddress() {
    const g = this.getActiveGroup();
    return g ? fullAddress(g.stops[0]) : null;
  }

  flashSuccess() {
    const el = document.getElementById('flash-overlay');
    if (!el) return;
    el.classList.add('show');
    clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => el.classList.remove('show'), 400);
  }

  async handleStopStatus(stopId, status) {
    vibrate();
    setStopStatus(this.state, stopId, status, this.groups, this.tour.stops);
    if (status === STATUS.DELIVERED) this.flashSuccess();
    toast(status === STATUS.DELIVERED ? 'Zugestellt' : 'Nicht angetroffen');
    await this.afterStatusChange(status === STATUS.DELIVERED);
  }

  async handleGroupStatus(status) {
    vibrate();
    const group = this.groups[this.state.currentGroupIndex];
    setGroupStatus(this.state, group, status, this.groups, this.tour.stops);
    if (status === STATUS.DELIVERED) this.flashSuccess();
    toast(status === STATUS.DELIVERED ? 'Alle zugestellt' : 'Nicht angetroffen');
    await this.afterStatusChange(status === STATUS.DELIVERED);
  }

  async afterStatusChange(wasDelivered) {
    this.renderActiveView();
    if (!wasDelivered || !this.isTourActive()) return;

    const group = this.getActiveGroup();
    if (group) toast(`Nächster Stopp: ${group.name}`);
  }

  onStepChange() {
    this.renderActiveView();
    const g = this.getActiveGroup();
    if (g) toast(g.name);
  }

  refreshListView() {
    const input = document.getElementById('list-search');
    const start = input?.selectionStart ?? null;
    const hadFocus = document.activeElement === input;

    document.getElementById('view-list').innerHTML = renderListView(this.tour, this.state, this.groups, {
      search: this.listFilter,
      statusFilter: this.listStatusFilter,
    });

    if (hadFocus) {
      const next = document.getElementById('list-search');
      next?.focus();
      if (start != null && next) next.setSelectionRange(start, start);
    }
  }

  async openSettings() {
    await showSettingsSheet(this.settings, (key, value) => {
      this.settings = updateSetting(key, value);
    });
  }

  bindEvents() {
    this.root.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) {
        const tab = e.target.closest('[data-tab]');
        if (tab) this.switchTab(tab.dataset.tab);
        return;
      }

      const action = btn.dataset.action;

      if (action === 'open-settings') {
        await this.openSettings();
        return;
      }
      if (action === 'navigate') {
        await requestNavigation(btn.dataset.address, btn.dataset.name);
        return;
      }
      if (action === 'copy-address') {
        copyAddress(btn.dataset.address).then((ok) => toast(ok ? 'Adresse kopiert' : 'Fehler beim Kopieren'));
        return;
      }
      if (action === 'toggle-ids') {
        const detail = document.getElementById('id-detail');
        if (detail) {
          detail.hidden = !detail.hidden;
          btn.setAttribute('aria-expanded', String(!detail.hidden));
        }
        return;
      }
      if (action === 'step-prev') {
        stepNav(this.state, 'prev', this.tour.stops, this.groups);
        this.onStepChange();
        return;
      }
      if (action === 'step-next') {
        stepNav(this.state, 'next', this.tour.stops, this.groups);
        this.onStepChange();
        return;
      }
      if (action === 'stop-status') {
        await this.handleStopStatus(btn.dataset.stop, btn.dataset.status);
        return;
      }
      if (action === 'group-status') {
        await this.handleGroupStatus(btn.dataset.status);
        return;
      }
      if (action === 'undo') {
        if (undo(this.state, this.groups, this.tour.stops)) {
          toast('Rückgängig');
          this.renderActiveView();
        }
        return;
      }
      if (action === 'jump-group') {
        jumpToGroup(this.state, parseInt(btn.dataset.group, 10), this.tour.stops, this.groups);
        this.switchTab('nav');
        return;
      }
      if (action === 'list-filter') {
        this.listStatusFilter = btn.dataset.filter;
        this.refreshListView();
        return;
      }
      if (action === 'go-report') {
        this.activeTab = 'report';
        document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
        document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-report'));
        this.renderActiveView();
        return;
      }
      if (action === 'reset-tour') {
        const ok = await showConfirm({
          title: 'Tour neu starten',
          body: 'Alle Fortschritte werden gelöscht.',
          confirmLabel: 'Neu starten',
          cancelLabel: 'Abbrechen',
        });
        if (ok) {
          clearAllPhotos();
          this.state = resetTour(this.state);
          this.state.currentGroupIndex = 0;
          toast('Tour neu gestartet');
          this.render();
        }
        return;
      }
      if (action === 'share-whatsapp') {
        shareWhatsApp(this.reportText);
        return;
      }
    });

    this.root.addEventListener('input', (e) => {
      if (e.target.id === 'list-search') {
        this.listFilter = e.target.value;
        this.refreshListView();
      }
    });
  }
}
