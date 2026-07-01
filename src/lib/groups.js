import { formatAddress } from './tours.js';

function groupKey(stop) {
  return stop.group ? `g:${stop.group}` : `id:${stop.id}`;
}

/** Gruppiert nur Stopps mit gleichem group-Feld (z. B. 186-010…150 = ein Kunde). */
export function groupStops(stops) {
  const groups = [];

  for (const stop of stops) {
    const key = groupKey(stop);
    const last = groups[groups.length - 1];

    if (last && last.key === key) {
      last.stops.push(stop);
    } else {
      groups.push({
        key,
        stops: [stop],
        name: stop.name,
        street: stop.street,
        plz: stop.plz,
        city: stop.city,
        address: formatAddress(stop),
      });
    }
  }

  return groups;
}

export function groupStopIds(group) {
  return group.stops.map((s) => s.id);
}

export function isGroupComplete(group, statuses) {
  return group.stops.every((s) => statuses[s.id] !== undefined);
}

export function findCurrentGroupIndex(groups, statuses) {
  const idx = groups.findIndex((g) => !isGroupComplete(g, statuses));
  return idx === -1 ? groups.length : idx;
}

export function countDone(statuses) {
  return Object.keys(statuses).length;
}

export function getStats(statuses) {
  const values = Object.values(statuses);
  return {
    delivered: values.filter((s) => s.status === 'delivered').length,
    nothome: values.filter((s) => s.status === 'nothome').length,
    partial: values.filter((s) => s.status === 'partial').length,
    skipped: values.filter((s) => s.status === 'skipped').length,
    total: values.length,
  };
}
