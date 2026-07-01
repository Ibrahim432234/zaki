import { renderTopbar, updateTopbar, startClock } from './components/topbar.js';
import { renderNavView } from './components/navView.js';
import { renderListView } from './components/listView.js';
import { renderReportView } from './components/reportView.js';
import { groupStops } from './lib/groups.js';
import { openNavigation } from './lib/maps.js';
import { buildReportText, shareWhatsApp } from './lib/report.js';
import { clearAllPhotos } from './lib/photoStorage.js';
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
import { confirmDialog, toast, vibrate } from './lib/utils.js';
import { STATUS } from './lib/constants.js';

export class App {
  constructor(root) {
    this.root = root;
    this.tour = loadTour('tour-186');
    this.groups = groupStops(this.tour.stops);
    this.state = loadState(this.tour.id, this.groups, this.tour.stops);
    this.state.navMode = 'group';
    this.state.selectMode = 'auto';
    this.activeTab = 'nav';
    this.listFilter = '';
    this.reportText = '';
  }

  async init() {
    this.render();
    startClock();
    this.bindEvents();
  }

  render() {
    this.root.innerHTML = `
      ${renderTopbar(this.tour, this.state, this.tour.stops.length)}
      <nav class="tabs">
        <button class="tab ${this.activeTab === 'nav' ? 'active' : ''}" data-tab="nav">Aktuell</button>
        <button class="tab ${this.activeTab === 'list' ? 'active' : ''}" data-tab="list">Liste</button>
        <button class="tab ${this.activeTab === 'report' ? 'active' : ''}" data-tab="report">Bericht</button>
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
      document.getElementById('view-nav').innerHTML = renderNavView(this.tour, this.state, this.groups);
    } else if (this.activeTab === 'list') {
      document.getElementById('view-list').innerHTML = renderListView(
        this.tour,
        this.state,
        this.groups,
        this.listFilter
      );
      document.querySelector('.list-item.is-current')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
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
  }

  getActiveAddress() {
    const group = this.groups[this.state.currentGroupIndex];
    return group ? fullAddress(group.stops[0]) : null;
  }

  handleStopStatus(stopId, status) {
    vibrate();
    setStopStatus(this.state, stopId, status, this.groups, this.tour.stops);
    this.afterStatusChange();
  }

  handleGroupStatus(status) {
    vibrate();
    const group = this.groups[this.state.currentGroupIndex];
    setGroupStatus(this.state, group, status, this.groups, this.tour.stops);
    this.afterStatusChange();
  }

  afterStatusChange() {
    this.renderActiveView();
    const address = this.getActiveAddress();
    if (address) {
      setTimeout(() => openNavigation(address, 'google'), 400);
    }
  }

  onGoalChanged() {
    this.renderActiveView();
    const address = this.getActiveAddress();
    if (address) openNavigation(address, 'google');
  }

  bindEvents() {
    this.root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (btn) {
        const action = btn.dataset.action;

        if (action === 'navigate') {
          openNavigation(btn.dataset.address, 'google');
          return;
        }
        if (action === 'step-prev') {
          stepNav(this.state, 'prev', this.tour.stops, this.groups);
          this.onGoalChanged();
          return;
        }
        if (action === 'step-next') {
          stepNav(this.state, 'next', this.tour.stops, this.groups);
          this.onGoalChanged();
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
        if (action === 'reset-tour') {
          if (confirmDialog('Tour neu starten?')) {
            clearAllPhotos();
            this.state = resetTour(this.state);
            this.state.currentGroupIndex = 0;
            toast('Neu gestartet');
            this.renderActiveView();
          }
          return;
        }
        if (action === 'share-whatsapp') {
          shareWhatsApp(this.reportText);
          return;
        }
      }

      const tab = e.target.closest('[data-tab]');
      if (tab) this.switchTab(tab.dataset.tab);
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
      }
    });
  }
}
