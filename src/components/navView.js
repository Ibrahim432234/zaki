import { STATUS } from '../lib/constants.js';
import { formatStopId, formatStopIdRange, fullAddress } from '../lib/tours.js';
import { escapeHtml } from '../lib/utils.js';

function renderIdLine(group) {
  if (group.stops.length === 1) {
    return `<div class="job-id">${formatStopId(group.stops[0].id)}</div>`;
  }
  return `
    <button type="button" class="job-id job-id-multi" data-action="toggle-ids" aria-expanded="false">
      ${formatStopIdRange(group.stops)} · ${group.stops.length} Sendungen
    </button>
    <div class="job-ids-detail" id="id-detail" hidden>
      ${group.stops.map((s) => `<span class="id-tag">${formatStopId(s.id)}</span>`).join('')}
    </div>
  `;
}

export function renderNavView(tour, state, groups) {
  if (state.currentGroupIndex >= groups.length) {
    return `
      <div class="done-screen">
        <div class="done-icon">✓</div>
        <div class="done-title">Tour abgeschlossen</div>
        <div class="done-sub">${tour.stops.length} Stopps erledigt</div>
        <button class="btn-primary" data-action="go-report">Bericht senden</button>
        <button class="btn-ghost" data-action="reset-tour">Neue Tour</button>
      </div>
    `;
  }

  const group = groups[state.currentGroupIndex];
  const address = fullAddress(group.stops[0]);
  const atStart = state.currentGroupIndex <= 0;
  const atEnd = state.currentGroupIndex >= groups.length - 1;
  const seq = state.currentGroupIndex + 1;

  return `
    <article class="job-card">
      <header class="job-header">
        <div>
          <span class="job-label">Aktueller Stopp</span>
          <span class="job-seq">${seq} / ${groups.length}</span>
        </div>
        <div class="job-step-btns">
          <button type="button" class="icon-btn" data-action="step-prev" ${atStart ? 'disabled' : ''} aria-label="Vorheriger Stopp">‹</button>
          <button type="button" class="icon-btn" data-action="step-next" ${atEnd ? 'disabled' : ''} aria-label="Nächster Stopp">›</button>
        </div>
      </header>

      ${renderIdLine(group)}

      <h1 class="job-customer">${escapeHtml(group.name)}</h1>
      <p class="job-address">${escapeHtml(group.address)}</p>

      <div class="job-actions">
        <button type="button" class="btn-primary btn-route" data-action="navigate"
          data-address="${escapeHtml(address)}" data-name="${escapeHtml(group.name)}">
          Route starten
        </button>
        <button type="button" class="btn-secondary" data-action="copy-address" data-address="${escapeHtml(address)}">
          Adresse kopieren
        </button>
      </div>
    </article>

    <button type="button" class="link-btn" data-action="undo" ${state.undoStack.length ? '' : 'disabled'}>
      Letzte Aktion rückgängig
    </button>
  `;
}

export function renderActionDock(group, state) {
  if (!group) return '';

  const isMulti = group.stops.length > 1;
  const stop = group.stops.find((s) => !state.statuses[s.id]) || group.stops[0];

  if (isMulti) {
    return `
      <footer class="action-dock" id="action-dock">
        <button type="button" class="dock-btn dock-ok" data-action="group-status" data-status="${STATUS.DELIVERED}">
          <span class="dock-label">Zugestellt</span>
          <span class="dock-sub">Alle ${group.stops.length} Sendungen</span>
        </button>
        <button type="button" class="dock-btn dock-fail" data-action="group-status" data-status="${STATUS.NOT_HOME}">
          <span class="dock-label">Nicht angetroffen</span>
        </button>
      </footer>
    `;
  }

  return `
    <footer class="action-dock" id="action-dock">
      <button type="button" class="dock-btn dock-ok" data-action="stop-status" data-stop="${stop.id}" data-status="${STATUS.DELIVERED}">
        <span class="dock-label">Zugestellt</span>
      </button>
      <button type="button" class="dock-btn dock-fail" data-action="stop-status" data-stop="${stop.id}" data-status="${STATUS.NOT_HOME}">
        <span class="dock-label">Nicht angetroffen</span>
      </button>
    </footer>
  `;
}

export function getCurrentGroup(groups, state) {
  if (state.currentGroupIndex >= groups.length) return null;
  return groups[state.currentGroupIndex];
}
