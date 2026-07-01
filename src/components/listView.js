import { STATUS_LABELS } from '../lib/constants.js';
import { fullAddress } from '../lib/tours.js';
import { escapeHtml } from '../lib/utils.js';

export function renderListView(tour, state, groups, filter = '') {
  const q = filter.toLowerCase();
  const items = [];

  groups.forEach((group, gi) => {
    group.stops.forEach((stop, si) => {
      const match =
        !q ||
        stop.name.toLowerCase().includes(q) ||
        stop.city.toLowerCase().includes(q) ||
        stop.id.includes(q) ||
        stop.street.toLowerCase().includes(q);

      if (match) {
        items.push({ stop, gi, si, group });
      }
    });
  });

  const rows = items
    .map(({ stop, gi, group }) => {
      const st = state.statuses[stop.id];
      const isCurrent = gi === state.currentGroupIndex && !st;
      let cls = '';
      if (st?.status === 'delivered' || st?.status === 'partial') cls = 'is-done';
      else if (st?.status === 'nothome') cls = 'is-nothome';
      else if (st?.status === 'skipped') cls = 'is-skipped';
      else if (isCurrent) cls = 'is-current';

      const icon =
        st?.status === 'delivered'
          ? '✓'
          : st?.status === 'nothome'
            ? '✕'
            : st?.status === 'partial'
              ? '~'
              : st?.status === 'skipped'
                ? '↷'
                : isCurrent
                  ? '▶'
                  : '•';

      const stLbl = st
        ? `<div class="list-status status-${st.status}">${STATUS_LABELS[st.status]}</div>`
        : '';

      return `
        <div class="list-item ${cls}" data-action="jump-group" data-group="${gi}">
          <div class="list-num">${icon}</div>
          <div class="list-info">
            <div class="list-name">${escapeHtml(stop.name)} <span class="list-id">${stop.id}</span></div>
            <div class="list-addr">${escapeHtml(group.address)}</div>
            ${stLbl}
          </div>
          <button class="list-nav-btn" data-action="navigate" data-address="${escapeHtml(fullAddress(stop))}">🗺️</button>
        </div>
      `;
    })
    .join('');

  return `
    <input class="list-search" type="search" placeholder="🔍 Suchen…" value="${escapeHtml(filter)}" id="list-search">
    <div class="list-meta">${items.length} von ${tour.stops.length} Stopps</div>
    ${rows || '<div class="empty-state">Keine Stopps gefunden</div>'}
  `;
}
