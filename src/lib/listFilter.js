import { formatStopId } from './tours.js';

export const LIST_FILTERS = [
  { id: 'all', label: 'Alle' },
  { id: 'open', label: 'Offen' },
  { id: 'delivered', label: 'Zugestellt' },
  { id: 'nothome', label: 'Nicht da' },
  { id: 'current', label: 'Aktuell' },
];

export function normalizeSearchQuery(query) {
  return query.toLowerCase().replace(/[\s\-.,]/g, '');
}

export function matchesSearch(stop, query) {
  if (!query.trim()) return true;

  const q = normalizeSearchQuery(query);
  const haystack = [
    stop.name,
    stop.street,
    stop.city,
    stop.plz,
    stop.type,
    stop.id,
    formatStopId(stop.id),
  ]
    .filter(Boolean)
    .map((v) => normalizeSearchQuery(String(v)));

  return haystack.some((v) => v.includes(q));
}

export function groupIndexForStop(groups, stopId) {
  return groups.findIndex((g) => g.stops.some((s) => s.id === stopId));
}

export function matchesStatusFilter(stop, status, filter, state, groups) {
  const gi = groupIndexForStop(groups, stop.id);
  const isCurrentGroup = gi === state.currentGroupIndex;

  switch (filter) {
    case 'open':
      return !status;
    case 'delivered':
      return status?.status === 'delivered';
    case 'nothome':
      return status?.status === 'nothome';
    case 'current':
      return isCurrentGroup;
    default:
      return true;
  }
}

export function filterStops(stops, state, groups, { search = '', statusFilter = 'all' } = {}) {
  return stops.filter((stop) => {
    const status = state.statuses[stop.id];
    return (
      matchesSearch(stop, search) &&
      matchesStatusFilter(stop, status, statusFilter, state, groups)
    );
  });
}

export function countByFilter(stops, state, groups) {
  const currentGroup = groups[state.currentGroupIndex];
  return {
    all: stops.length,
    open: stops.filter((s) => !state.statuses[s.id]).length,
    delivered: stops.filter((s) => state.statuses[s.id]?.status === 'delivered').length,
    nothome: stops.filter((s) => state.statuses[s.id]?.status === 'nothome').length,
    current: currentGroup?.stops.length ?? 0,
  };
}
