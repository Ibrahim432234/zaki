import { STATUS_LABELS } from '../lib/constants.js';
import { formatStopId, fullAddress } from '../lib/tours.js';
import { escapeHtml } from '../lib/utils.js';

export function renderListView(tour, state, groups, filter = '') {
  const q = filter.toLowerCase();

  const rows = tour.stops
    .filter((stop) => {
      if (!q) return true;
      return (
        stop.name.toLowerCase().includes(q) ||
        stop.city.toLowerCase().includes(q) ||
        stop.id.includes(q)
      );
    })
    .map((stop, si) => {
      const st = state.statuses[stop.id];
      const gi = groups.findIndex((g) => g.stops.some((s) => s.id === stop.id));
      const isCurrent = gi === state.currentGroupIndex && !st;

      let cls = '';
      if (st?.status === 'delivered') cls = 'is-done';
      else if (st?.status === 'nothome') cls = 'is-nothome';
      else if (isCurrent) cls = 'is-current';

      return `
        <div class="list-item ${cls}" data-action="jump-group" data-group="${gi}">
          <div class="list-num">${si + 1}</div>
          <div class="list-info">
            <div class="list-name">${escapeHtml(stop.name)} <span class="list-id">${formatStopId(stop.id)}</span></div>
            <div class="list-addr">${escapeHtml(stop.street)}, ${escapeHtml(stop.city)}</div>
            ${st ? `<div class="list-status">${STATUS_LABELS[st.status]}</div>` : ''}
          </div>
          <button class="list-nav-btn" data-action="navigate" data-address="${escapeHtml(fullAddress(stop))}" data-name="${escapeHtml(stop.name)}">🗺️</button>
        </div>
      `;
    })
    .join('');

  return `
    <input class="list-search" type="search" placeholder="Suchen…" value="${escapeHtml(filter)}" id="list-search">
    ${rows || '<div class="empty-state">Keine Stopps gefunden</div>'}
    <button class="btn-list-report" data-action="go-report">📊 Tour-Bericht</button>
  `;
}
