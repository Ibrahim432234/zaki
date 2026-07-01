const EARTH_RADIUS_KM = 6371;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

export function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function estimateMinutes(km) {
  const speedKmh = 35;
  return Math.max(1, Math.round((km / speedKmh) * 60));
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS nicht verfügbar'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  });
}

const geocodeCache = new Map();

export async function geocodeAddress(address) {
  if (geocodeCache.has(address)) return geocodeCache.get(address);

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'de' } });
  const data = await res.json();

  if (!data.length) return null;

  const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  geocodeCache.set(address, result);
  return result;
}

export async function getDistanceToAddress(address, position) {
  try {
    const coords = await geocodeAddress(address);
    if (!coords || !position) return null;
    const km = haversineKm(position.lat, position.lng, coords.lat, coords.lng);
    return { km, formatted: formatDistance(km), eta: estimateMinutes(km) };
  } catch {
    return null;
  }
}
