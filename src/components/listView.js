import { STATUS_LABELS } from '../lib/constants.js';
import { formatStopId, fullAddress } from '../lib/tours.js';
import { escapeHtml } from '../lib/utils.js';

const STATUS_CLASS = {
  delivered: 'pill-ok',
  nothome: 'pill-fail',
  partial: 'pill-warn',
  skipped: 'pill-muted',
};

export function renderListView(tour, state, groups, filter = '') {
  const q = filter.toLowerCase();

  const rows = tour.stops
    .filter((stop) => {
      if (!q) return true;
      return (
        stop.name.toLowerCase().includes(q) ||
        stop.city.toLowerCase().includes(q) ||
        stop.id.includes(q) ||
        formatStopId(stop.id).includes(q)
      );
    })
    .map((stop, si) => {
      const st = state.statuses[stop.id];
      const gi = groups.findIndex((g) => g.stops.some((s) => s.id === stop.id));
      const isCurrent = gi === state.currentGroupIndex && !st;

      let cls = 'list-row';
      if (isCurrent) cls += ' is-active';
      if (st?.status === 'delivered') cls += ' is-done';

      const pill = st
        ? `<span class="pill ${STATUS_CLASS[st.status] || 'pill-muted'}">${STATUS_LABELS[st.status]}</span>`
        : isCurrent
          ? '<span class="pill pill-active">Aktuell</span>'
          : '<span class="pill pill-open">Offen</span>';

      return `
        <div class="${cls}" data-action="jump-group" data-group="${gi}">
          <div class="list-row-main">
            <span class="list-nr">${formatStopId(stop.id)}</span>
            <div class="list-body">
              <span class="list-name">${escapeHtml(stop.name)}</span>
              <span class="list-addr">${escapeHtml(stop.street)}, ${escapeHtml(stop.city)}</span>
            </div>
            ${pill}
          </div>
          <button type="button" class="list-route" data-action="navigate"
            data-address="${escapeHtml(fullAddress(stop))}" data-name="${escapeHtml(stop.name)}">
            Route
          </button>
        </div>
      `;
    })
    .join('');

  return `
    <input class="list-search" type="search" placeholder="Kunde oder Nummer suchen…" value="${escapeHtml(filter)}" id="list-search">
    <div class="list-stats">${tour.stops.length} Stopps gesamt</div>
    <div class="list-rows">${rows || '<p class="empty">Keine Treffer</p>'}</div>
    <button type="button" class="btn-secondary btn-block" data-action="go-report">Tour-Bericht</button>
  `;
}
