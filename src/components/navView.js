import { STATUS, STATUS_LABELS } from '../lib/constants.js';
import { isGroupComplete } from '../lib/groups.js';
import { isNavComplete, isGroupCurrent } from '../lib/navigation.js';
import { fullAddress } from '../lib/tours.js';
import { escapeHtml } from '../lib/utils.js';

function renderModeBar(state) {
  return `
    <div class="mode-bar">
      <div class="mode-row">
        <span class="mode-label">Ansicht</span>
        <button class="btn-mode ${state.navMode === 'group' ? 'active' : ''}" data-action="set-nav-mode" data-mode="group">📦 Gruppen</button>
        <button class="btn-mode ${state.navMode === 'single' ? 'active' : ''}" data-action="set-nav-mode" data-mode="single">📋 Einzeln</button>
      </div>
      <div class="mode-row">
        <span class="mode-label">Auswahl</span>
        <button class="btn-mode ${state.selectMode === 'auto' ? 'active' : ''}" data-action="set-select-mode" data-mode="auto">⚡ Auto</button>
        <button class="btn-mode ${state.selectMode === 'manual' ? 'active' : ''}" data-action="set-select-mode" data-mode="manual">✋ Manuell</button>
      </div>
    </div>
  `;
}

function renderPicker(tour, state, groups) {
  if (state.navMode === 'group') {
    return `
      <div class="picker-wrap">
        <div class="picker-title">Gruppen — tippen zum Auswählen</div>
        <div class="picker-list">
          ${groups
            .map((group, gi) => {
              const done = isGroupComplete(group, state.statuses);
              const isCurrent = isGroupCurrent(state, gi);
              const open = group.stops.filter((s) => !state.statuses[s.id]).length;
              return `
                <button class="picker-item ${isCurrent ? 'is-current' : ''} ${done ? 'is-done' : ''}"
                  data-action="pick-group" data-index="${gi}">
                  <span class="picker-num">${gi + 1}</span>
                  <span class="picker-text">
                    <span class="picker-name">${escapeHtml(group.name)}</span>
                    <span class="picker-sub">${group.stops.length > 1 ? `${group.stops.length} Lieferungen · ` : ''}${escapeHtml(group.city)}</span>
                  </span>
                  <span class="picker-status">${done ? '✓' : open < group.stops.length ? `${open} offen` : '•'}</span>
                </button>
              `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  return `
    <div class="picker-wrap">
      <div class="picker-title">Stopps — tippen zum Auswählen</div>
      <div class="picker-list">
        ${tour.stops
          .map((stop, si) => {
            const st = state.statuses[stop.id];
            const isCurrent = state.currentStopIndex === si;
            const done = st !== undefined;
            return `
              <button class="picker-item ${isCurrent ? 'is-current' : ''} ${done ? 'is-done' : ''}"
                data-action="pick-stop" data-index="${si}">
                <span class="picker-num">${si + 1}</span>
                <span class="picker-text">
                  <span class="picker-name">${escapeHtml(stop.name)} <span class="picker-id">${stop.id}</span></span>
                  <span class="picker-sub">${escapeHtml(stop.city)}</span>
                </span>
                <span class="picker-status">${done ? STATUS_LABELS[st.status]?.slice(0, 1) || '✓' : '•'}</span>
              </button>
            `;
          })
          .join('')}
      </div>
    </div>
  `;
}

function renderNavButtons(state, tour, groups) {
  const atStart =
    state.navMode === 'single' ? state.currentStopIndex <= 0 : state.currentGroupIndex <= 0;
  const maxIdx = state.navMode === 'single' ? tour.stops.length - 1 : groups.length - 1;
  const atEnd =
    state.navMode === 'single'
      ? state.currentStopIndex >= maxIdx
      : state.currentGroupIndex >= maxIdx;

  const posLabel =
    state.navMode === 'single'
      ? `Stopp ${state.currentStopIndex + 1} / ${tour.stops.length}`
      : `Gruppe ${state.currentGroupIndex + 1} / ${groups.length}`;

  return `
    <div class="step-nav" aria-label="Ziel wechseln">
      <button class="btn-step btn-step-lg" data-action="step-prev" ${atStart ? 'disabled' : ''} aria-label="Vorheriges Ziel">← Zurück</button>
      <div class="step-center">
        <span class="step-label">Ziel wechseln</span>
        <span class="step-pos">${posLabel}</span>
      </div>
      <button class="btn-step btn-step-lg" data-action="step-next" ${atEnd ? 'disabled' : ''} aria-label="Nächstes Ziel">Weiter →</button>
    </div>
  `;
}

export function renderNavView(tour, state, groups, distanceInfo) {
  if (isNavComplete(state, tour.stops, groups)) {
    return `
      ${renderModeBar(state)}
      <div class="done-screen">
        <div class="done-icon">🏁</div>
        <div class="done-title">Tour abgeschlossen!</div>
        <div class="done-sub">Alle ${tour.stops.length} Stopps erledigt.</div>
        <button class="btn-restart" data-action="reset-tour">↺ Tour neu starten</button>
      </div>
    `;
  }

  const isSingle = state.navMode === 'single';
  const group = groups[state.currentGroupIndex];
  const stop = isSingle ? tour.stops[state.currentStopIndex] : null;
  const displayStop = isSingle ? stop : group?.stops.find((s) => !state.statuses[s.id]) || group?.stops[0];
  const displayName = isSingle ? stop?.name : group?.name;
  const displayType = isSingle ? stop?.type : group?.stops.length > 1 ? `${group.stops.length} Lieferungen` : group?.stops[0]?.type;
  const displayAddress = isSingle
    ? `${stop.street}, ${stop.plz} ${stop.city}`
    : group?.address;
  const address = isSingle ? fullAddress(stop) : fullAddress(group.stops[0]);
  const isMulti = !isSingle && group.stops.length > 1;

  const nextGroup = groups[state.currentGroupIndex + 1];
  const nextStop = tour.stops[state.currentStopIndex + 1];
  const distHtml = distanceInfo
    ? `<div class="distance-badge">📍 ${distanceInfo.formatted} · ca. ${distanceInfo.eta} Min.</div>`
    : '';

  const multiHtml = isMulti
    ? `
      <div class="group-badge">${group.stops.length} Lieferungen an dieser Adresse</div>
      <div class="group-actions">
        <button class="btn-status btn-delivered btn-lg" data-action="group-status" data-status="${STATUS.DELIVERED}">✅ Alle geliefert</button>
        <button class="btn-status btn-not-home" data-action="group-status" data-status="${STATUS.NOT_HOME}">❌ Alle nicht da</button>
      </div>
      <div class="sub-stops">
        ${group.stops
          .map((s) => {
            const st = state.statuses[s.id];
            const done = st !== undefined;
            return `
              <div class="sub-stop ${done ? 'is-done' : ''}">
                <div class="sub-stop-head">
                  <span class="sub-stop-id">${s.id}</span>
                  <span class="sub-stop-type">${escapeHtml(s.type)}</span>
                </div>
                ${
                  done
                    ? `<span class="sub-stop-status">${STATUS_LABELS[st.status]}</span>`
                    : `
                  <div class="sub-stop-btns">
                    <button class="btn-mini btn-delivered" data-action="stop-status" data-stop="${s.id}" data-status="${STATUS.DELIVERED}">✅</button>
                    <button class="btn-mini btn-not-home" data-action="stop-status" data-stop="${s.id}" data-status="${STATUS.NOT_HOME}">❌</button>
                    <button class="btn-mini btn-partial" data-action="stop-status" data-stop="${s.id}" data-status="${STATUS.PARTIAL}">⚠️</button>
                    <button class="btn-mini btn-skip" data-action="stop-status" data-stop="${s.id}" data-status="${STATUS.SKIPPED}">⏭️</button>
                  </div>`
                }
                <div class="note-row">
                  <input class="note-input" type="text" placeholder="Notiz…" data-note="${s.id}" value="${escapeHtml(state.notes[s.id] || '')}">
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `
    : renderSingleStopActions(displayStop, state);

  const badgeId = isSingle ? stop.id : isMulti ? group.stops.map((s) => s.id).join(', ') : displayStop?.id;

  return `
    ${renderModeBar(state)}
    ${renderNavButtons(state, tour, groups)}
    <div class="stop-card" id="swipe-card">
      <div class="stop-badge">📍 ${badgeId}</div>
      <div class="stop-name">${escapeHtml(displayName || '')}</div>
      <div class="stop-type">${escapeHtml(displayType || '')}</div>
      ${distHtml}
      <div class="stop-addr-box">
        <span class="pin-icon">🗺️</span>
        <span>${escapeHtml(displayAddress || '')}</span>
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
      ${isMulti ? multiHtml : renderSingleStopActions(displayStop, state)}
      <div class="goal-nav-row">
        <button class="btn-goal" data-action="step-prev" ${state.navMode === 'single' ? (state.currentStopIndex <= 0 ? 'disabled' : '') : (state.currentGroupIndex <= 0 ? 'disabled' : '')}>← Vorheriges Ziel</button>
        <button class="btn-goal btn-goal-next" data-action="step-next" ${state.navMode === 'single' ? (state.currentStopIndex >= tour.stops.length - 1 ? 'disabled' : '') : (state.currentGroupIndex >= groups.length - 1 ? 'disabled' : '')}>Nächstes Ziel →</button>
      </div>
      <div class="swipe-hint">← Nicht da &nbsp;|&nbsp; Geliefert →</div>
    </div>
    ${
      isSingle
        ? nextStop
          ? `
        <div class="next-card">
          <div class="next-lbl">➡️ Nächster Stopp</div>
          <div class="next-name">${escapeHtml(nextStop.name)}</div>
          <div class="next-addr">${escapeHtml(nextStop.street)}, ${escapeHtml(nextStop.city)}</div>
          <button class="next-nav-btn" data-action="navigate" data-address="${escapeHtml(fullAddress(nextStop))}">Vorab navigieren</button>
        </div>`
          : `
        <div class="next-card">
          <div class="next-lbl">🏁 Letzter Stopp</div>
          <div class="next-name">Danach ist die Tour fertig.</div>
        </div>`
        : nextGroup
          ? `
        <div class="next-card">
          <div class="next-lbl">➡️ Nächster Stopp</div>
          <div class="next-name">${escapeHtml(nextGroup.name)}</div>
          <div class="next-addr">${escapeHtml(nextGroup.address)}</div>
          <button class="next-nav-btn" data-action="navigate" data-address="${escapeHtml(fullAddress(nextGroup.stops[0]))}">Vorab navigieren</button>
        </div>`
          : `
        <div class="next-card">
          <div class="next-lbl">🏁 Letzter Stopp</div>
          <div class="next-name">Danach ist die Tour fertig.</div>
        </div>`
    }
    ${renderPicker(tour, state, groups)}
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
  if (!stop) return '';
  const note = state.notes[stop.id] || '';
  return `
    <div class="status-row">
      <button class="btn-status btn-delivered btn-lg" data-action="stop-status" data-stop="${stop.id}" data-status="${STATUS.DELIVERED}">✅ Geliefert</button>
      <button class="btn-status btn-not-home btn-lg" data-action="stop-status" data-stop="${stop.id}" data-status="${STATUS.NOT_HOME}">❌ Nicht da</button>
      <button class="btn-status btn-partial" data-action="stop-status" data-stop="${stop.id}" data-status="${STATUS.PARTIAL}">⚠️ Teillieferung</button>
      <button class="btn-status btn-skip" data-action="stop-status" data-stop="${stop.id}" data-status="${STATUS.SKIPPED}">⏭️ Übersprungen</button>
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
