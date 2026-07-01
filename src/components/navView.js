import { STATUS } from '../lib/constants.js';
import { formatStopId, formatStopIdRange, fullAddress } from '../lib/tours.js';
import { escapeHtml } from '../lib/utils.js';

function renderStepNav(state, groups) {
  const atStart = state.currentGroupIndex <= 0;
  const atEnd = state.currentGroupIndex >= groups.length - 1;

  return `
    <div class="step-nav" aria-label="Ziel wechseln">
      <button class="btn-step" data-action="step-prev" ${atStart ? 'disabled' : ''}>← Zurück</button>
      <span class="step-pos">${state.currentGroupIndex + 1} / ${groups.length}</span>
      <button class="btn-step" data-action="step-next" ${atEnd ? 'disabled' : ''}>Weiter →</button>
    </div>
  `;
}

function renderIdBadge(group) {
  const isMulti = group.stops.length > 1;
  if (!isMulti) {
    return `<div class="stop-badge">${formatStopId(group.stops[0].id)}</div>`;
  }

  return `
    <button type="button" class="id-range" data-action="toggle-ids" aria-expanded="false">
      <span class="id-range-text">${formatStopIdRange(group.stops)}</span>
      <span class="id-range-meta">· ${group.stops.length} Lieferungen · Details</span>
    </button>
    <div class="stop-ids is-collapsed" id="id-detail" hidden>
      ${group.stops.map((s) => `<span class="stop-id-tag">${formatStopId(s.id)}</span>`).join('')}
    </div>
  `;
}

export function renderNavView(tour, state, groups) {
  if (state.currentGroupIndex >= groups.length) {
    return `
      <div class="done-screen">
        <div class="done-icon">🏁</div>
        <div class="done-title">Tour fertig!</div>
        <div class="done-sub">Alle ${tour.stops.length} Stopps erledigt.</div>
        <button class="btn-share" data-action="go-report">📤 Bericht senden</button>
        <button class="btn-restart" data-action="reset-tour">↺ Neu starten</button>
      </div>
    `;
  }

  const group = groups[state.currentGroupIndex];
  const address = fullAddress(group.stops[0]);

  return `
    ${renderStepNav(state, groups)}
    <label class="auto-nav-toggle">
      <input type="checkbox" data-action="toggle-auto-nav" ${state.autoNav ? 'checked' : ''}>
      <span>Maps nach „Geliefert" automatisch öffnen</span>
    </label>
    <div class="stop-card" id="stop-card">
      ${renderIdBadge(group)}
      <div class="stop-name">${escapeHtml(group.name)}</div>
      <button type="button" class="stop-addr-box stop-addr-tap" data-action="copy-address" data-address="${escapeHtml(address)}" title="Adresse kopieren">
        <span class="pin-icon">📍</span>
        <span>${escapeHtml(group.address)}</span>
        <span class="addr-hint">Tippen zum Kopieren</span>
      </button>
      <button class="btn-nav" data-action="navigate" data-address="${escapeHtml(address)}">🗺️ Navigation starten</button>
    </div>
    <button class="btn-undo" data-action="undo" ${state.undoStack.length ? '' : 'disabled'}>↩ Rückgängig</button>
  `;
}

/** Feste Daumen-Leiste unten — wird von app.js eingebunden */
export function renderActionDock(group, state) {
  if (!group) return '';

  const isMulti = group.stops.length > 1;
  const stop = group.stops.find((s) => !state.statuses[s.id]) || group.stops[0];

  if (isMulti) {
    return `
      <div class="action-dock" id="action-dock">
        <button class="dock-btn dock-delivered" data-action="group-status" data-status="${STATUS.DELIVERED}">✅ Alle geliefert</button>
        <button class="dock-btn dock-nothome" data-action="group-status" data-status="${STATUS.NOT_HOME}">❌ Nicht da</button>
      </div>
    `;
  }

  return `
    <div class="action-dock" id="action-dock">
      <button class="dock-btn dock-delivered" data-action="stop-status" data-stop="${stop.id}" data-status="${STATUS.DELIVERED}">✅ Geliefert</button>
      <button class="dock-btn dock-nothome" data-action="stop-status" data-stop="${stop.id}" data-status="${STATUS.NOT_HOME}">❌ Nicht da</button>
    </div>
  `;
}

export function getCurrentGroup(groups, state) {
  if (state.currentGroupIndex >= groups.length) return null;
  return groups[state.currentGroupIndex];
}
