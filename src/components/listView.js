import { STATUS_LABELS } from '../lib/constants.js';
import {
  LIST_FILTERS,
  countByFilter,
  filterStops,
  groupIndexForStop,
} from '../lib/listFilter.js';
import { formatStopId } from '../lib/tours.js';
import { escapeHtml } from '../lib/utils.js';

const STATUS_CLASS = {
  delivered: 'pill-ok',
  nothome: 'pill-fail',
  partial: 'pill-warn',
  skipped: 'pill-muted',
};

function renderFilterChips(statusFilter, counts) {
  return LIST_FILTERS.map(({ id, label }) => {
    const active = statusFilter === id ? ' active' : '';
    const count = counts[id] ?? 0;
    return `
      <button type="button" class="filter-chip${active}" data-action="list-filter" data-filter="${id}">
        ${label}<span class="filter-count">${count}</span>
      </button>
    `;
  }).join('');
}

export function renderListView(tour, state, groups, options = {}) {
  const { search = '', statusFilter = 'all' } = options;
  const counts = countByFilter(tour.stops, state, groups);
  const filtered = filterStops(tour.stops, state, groups, { search, statusFilter });
  const hasFilter = statusFilter !== 'all' || search.trim();

  const rows = filtered
    .map((stop) => {
      const st = state.statuses[stop.id];
      const gi = groupIndexForStop(groups, stop.id);
      const isCurrent = gi === state.currentGroupIndex && !st;

      let cls = 'list-row';
      if (isCurrent) cls += ' is-active';
      if (st?.status === 'delivered') cls += ' is-done';
      if (st?.status === 'nothome') cls += ' is-nothome';

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
        </div>
      `;
    })
    .join('');

  const statsText = hasFilter
    ? `${filtered.length} von ${tour.stops.length} Stopps`
  : `${tour.stops.length} Stopps · ${counts.open} offen · ${counts.delivered} zugestellt`;

  const emptyMsg =
    search.trim() && statusFilter !== 'all'
      ? 'Keine Stopps für Suche und Filter'
      : search.trim()
        ? 'Keine Stopps für diese Suche'
        : statusFilter === 'open'
          ? 'Alle Stopps erledigt'
          : 'Keine Stopps in diesem Filter';

  return `
    <div class="list-toolbar">
      <input class="list-search" type="search" placeholder="Name, Straße, Stadt oder Nr. …"
        value="${escapeHtml(search)}" id="list-search" autocomplete="off" enterkeyhint="search">
      <div class="filter-chips" role="tablist" aria-label="Stopp-Filter">
        ${renderFilterChips(statusFilter, counts)}
      </div>
      <div class="list-stats">${statsText}</div>
    </div>
    <div class="list-rows">${rows || `<p class="empty">${emptyMsg}</p>`}</div>
    <button type="button" class="btn-secondary btn-block" data-action="go-report">Tour-Bericht</button>
  `;
}
