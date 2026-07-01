import { STATUS, STATUS_LABELS } from '../lib/constants.js';
import { isGroupComplete } from '../lib/groups.js';
import { fullAddress } from '../lib/tours.js';
import { escapeHtml } from '../lib/utils.js';

export function renderNavView(tour, state, groups, distanceInfo) {
  if (state.currentGroupIndex >= groups.length) {
    return `
      <div class="done-screen">
        <div class="done-icon">🏁</div>
        <div class="done-title">Tour abgeschlossen!</div>
        <div class="done-sub">Alle ${tour.stops.length} Stopps erledigt.</div>
        <button class="btn-restart" data-action="reset-tour">↺ Tour neu starten</button>
      </div>
    `;
  }

  const group = groups[state.currentGroupIndex];
  const next = groups[state.currentGroupIndex + 1];
  const isMulti = group.stops.length > 1;
  const address = fullAddress(group.stops[0]);
  const distHtml = distanceInfo
    ? `<div class="distance-badge">📍 ${distanceInfo.formatted} · ca. ${distanceInfo.eta} Min.</div>`
    : '';

  const stopsHtml = isMulti
    ? `
      <div class="group-badge">${group.stops.length} Lieferungen an dieser Adresse</div>
      <div class="group-actions">
        <button class="btn-status btn-delivered btn-lg" data-action="group-status" data-status="${STATUS.DELIVERED}">✅ Alle geliefert</button>
        <button class="btn-status btn-not-home" data-action="group-status" data-status="${STATUS.NOT_HOME}">❌ Alle nicht da</button>
      </div>
      <div class="sub-stops">
        ${group.stops
          .map((stop) => {
            const st = state.statuses[stop.id];
            const done = st !== undefined;
            return `
              <div class="sub-stop ${done ? 'is-done' : ''}">
                <div class="sub-stop-head">
                  <span class="sub-stop-id">${stop.id}</span>
                  <span class="sub-stop-type">${escapeHtml(stop.type)}</span>
                </div>
                ${
                  done
                    ? `<span class="sub-stop-status">${STATUS_LABELS[st.status]}</span>`
                    : `
                  <div class="sub-stop-btns">
                    <button class="btn-mini btn-delivered" data-action="stop-status" data-stop="${stop.id}" data-status="${STATUS.DELIVERED}">✅</button>
                    <button class="btn-mini btn-not-home" data-action="stop-status" data-stop="${stop.id}" data-status="${STATUS.NOT_HOME}">❌</button>
                    <button class="btn-mini btn-partial" data-action="stop-status" data-stop="${stop.id}" data-status="${STATUS.PARTIAL}">⚠️</button>
                    <button class="btn-mini btn-skip" data-action="stop-status" data-stop="${stop.id}" data-status="${STATUS.SKIPPED}">⏭️</button>
                  </div>`
                }
                <div class="note-row">
                  <input class="note-input" type="text" placeholder="Notiz…" data-note="${stop.id}" value="${escapeHtml(state.notes[stop.id] || '')}">
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `
    : renderSingleStopActions(group.stops[0], state);

  const groupComplete = isGroupComplete(group, state.statuses);
  const singleActions = !isMulti && !groupComplete ? renderSingleStopActions(group.stops[0], state) : '';

  return `
    <div class="stop-card" id="swipe-card">
      <div class="stop-badge">📍 ${isMulti ? group.stops.map((s) => s.id).join(', ') : group.stops[0].id}</div>
      <div class="stop-name">${escapeHtml(group.name)}</div>
      <div class="stop-type">${isMulti ? `${group.stops.length} Lieferungen` : escapeHtml(group.stops[0].type)}</div>
      ${distHtml}
      <div class="stop-addr-box">
        <span class="pin-icon">🗺️</span>
        <span>${escapeHtml(group.address)}</span>
      </div>
      <div class="nav-row">
        <button class="btn-nav" data-action="navigate" data-address="${escapeHtml(address)}">Navigation →</button>
        <button class="btn-icon" data-action="copy-address" data-address="${escapeHtml(address)}" title="Adresse kopieren">📋</button>
      </div>
      <div class="nav-providers">
        <button class="btn-chip ${state.navProvider === 'google' ? 'active' : ''}" data-action="set-nav" data-provider="google">Google</button>
        <button class="btn-chip ${state.navProvider === 'apple' ? 'active' : ''}" data-action="set-nav" data-provider="apple">Apple</button>
        <button class="btn-chip ${state.navProvider === 'waze' ? 'active' : ''}" data-action="set-nav" data-provider="waze">Waze</button>
      </div>
      ${isMulti ? stopsHtml : singleActions}
      <div class="swipe-hint">← Nicht da &nbsp;|&nbsp; Geliefert →</div>
    </div>
    ${
      next
        ? `
      <div class="next-card">
        <div class="next-lbl">➡️ Nächster Stopp</div>
        <div class="next-name">${escapeHtml(next.name)}</div>
        <div class="next-addr">${escapeHtml(next.address)}</div>
        <button class="next-nav-btn" data-action="navigate" data-address="${escapeHtml(fullAddress(next.stops[0]))}">Vorab navigieren</button>
      </div>`
        : `
      <div class="next-card">
        <div class="next-lbl">🏁 Letzter Stopp</div>
        <div class="next-name">Danach ist die Tour fertig.</div>
      </div>`
    }
    <div class="action-bar">
      <button class="btn-undo" data-action="undo" ${state.undoStack.length ? '' : 'disabled'}>↩ Rückgängig</button>
      <label class="toggle-auto">
        <input type="checkbox" data-action="toggle-auto-nav" ${state.autoNav ? 'checked' : ''}>
        Auto-Nav
      </label>
    </div>
  `;
}

function renderSingleStopActions(stop, state) {
  const note = state.notes[stop.id] || '';
  return `
    <div class="status-row">
      <button class="btn-status btn-delivered btn-lg" data-action="stop-status" data-stop="${stop.id}" data-status="${STATUS.DELIVERED}">✅ Geliefert</button>
      <button class="btn-status btn-not-home btn-lg" data-action="stop-status" data-stop="${stop.id}" data-status="${STATUS.NOT_HOME}">❌ Nicht da</button>
      <button class="btn-status btn-partial" data-action="stop-status" data-stop="${stop.id}" data-status="${STATUS.PARTIAL}">⚠️ Teillieferung</button>
      <button class="btn-status btn-skip" data-action="stop-status" data-stop="${stop.id}" data-status="${STATUS.SKIPPED}">⏭️ Überspringen</button>
    </div>
    <div class="photo-row">
      <label class="btn-photo">
        📷 Foto
        <input type="file" accept="image/*" capture="environment" data-action="photo" data-stop="${stop.id}" hidden>
      </label>
      <span class="photo-hint" id="photo-hint-${stop.id}"></span>
    </div>
    <textarea class="note-box" rows="2" placeholder="Notiz hinzufügen…" data-note="${stop.id}">${escapeHtml(note)}</textarea>
  `;
}
