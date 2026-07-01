import tour186 from '../data/tours/tour-186.json';

const TOURS = {
  'tour-186': tour186,
};

export function getAvailableTours() {
  return Object.values(TOURS).map((t) => ({ id: t.id, name: t.name, stopCount: t.stops.length }));
}

export function loadTour(tourId) {
  const tour = TOURS[tourId];
  if (!tour) throw new Error(`Tour nicht gefunden: ${tourId}`);
  return structuredClone(tour);
}

export function formatAddress(stop) {
  return `${stop.street}, ${stop.plz} ${stop.city}`;
}

export function formatStopId(id) {
  if (/^186\d{3,4}$/.test(id)) {
    return `186-${id.slice(3)}`;
  }
  return id;
}

export function formatStopIds(stops) {
  return stops.map((s) => formatStopId(s.id));
}

/** Kompakt: „186-010 bis 186-150" */
export function formatStopIdRange(stops) {
  if (!stops.length) return '';
  if (stops.length === 1) return formatStopId(stops[0].id);
  return `${formatStopId(stops[0].id)} bis ${formatStopId(stops[stops.length - 1].id)}`;
}

export function fullAddress(stop) {
  return `${stop.street}, ${stop.plz} ${stop.city}, Deutschland`;
}
