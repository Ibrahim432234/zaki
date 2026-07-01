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

export function fullAddress(stop) {
  return `${stop.street}, ${stop.plz} ${stop.city}, Deutschland`;
}
