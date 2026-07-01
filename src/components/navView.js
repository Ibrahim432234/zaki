import { STATUS } from '../lib/constants.js';
import { fullAddress } from '../lib/tours.js';
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

export function renderNavView(tour, state, groups) {
  if (state.currentGroupIndex >= groups.length) {
    return `
      <div class="done-screen">
        <div class="done-icon">🏁</div>
        <div class="done-title">Tour fertig!</div>
        <div class="done-sub">Alle ${tour.stops.length} Stopps erledigt.</div>
        <button class="btn-restart" data-action="reset-tour">↺ Neu starten</button>
      </div>
    `;
  }

  const group = groups[state.currentGroupIndex];
  const isMulti = group.stops.length > 1;
  const address = fullAddress(group.stops[0]);
  const stop = group.stops.find((s) => !state.statuses[s.id]) || group.stops[0];

  const statusHtml = isMulti
    ? `
      <p class="group-hint">${group.stops.length} Lieferungen hier</p>
      <div class="status-row">
        <button class="btn-status btn-delivered btn-lg" data-action="group-status" data-status="${STATUS.DELIVERED}">✅ Alle geliefert</button>
        <button class="btn-status btn-not-home btn-lg" data-action="group-status" data-status="${STATUS.NOT_HOME}">❌ Nicht da</button>
      </div>
    `
    : `
      <div class="status-row">
        <button class="btn-status btn-delivered btn-lg" data-action="stop-status" data-stop="${stop.id}" data-status="${STATUS.DELIVERED}">✅ Geliefert</button>
        <button class="btn-status btn-not-home btn-lg" data-action="stop-status" data-stop="${stop.id}" data-status="${STATUS.NOT_HOME}">❌ Nicht da</button>
      </div>
    `;

  return `
    ${renderStepNav(state, groups)}
    <div class="stop-card">
      <div class="stop-badge">${isMulti ? `${group.stops.length}× ` : ''}${stop.id}</div>
      <div class="stop-name">${escapeHtml(group.name)}</div>
      <div class="stop-addr-box">
        <span class="pin-icon">📍</span>
        <span>${escapeHtml(group.address)}</span>
      </div>
      <button class="btn-nav" data-action="navigate" data-address="${escapeHtml(address)}">🗺️ Navigation starten</button>
      ${statusHtml}
    </div>
    <button class="btn-undo" data-action="undo" ${state.undoStack.length ? '' : 'disabled'}>↩ Rückgängig</button>
  `;
}
