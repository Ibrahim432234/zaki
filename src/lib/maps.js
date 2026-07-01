export function mapsUrl(address, provider = 'google') {
  const q = encodeURIComponent(address);
  const providers = {
    google: `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`,
    apple: `https://maps.apple.com/?daddr=${q}&dirflg=d`,
    waze: `https://waze.com/ul?q=${q}&navigate=yes`,
  };
  return providers[provider] || providers.google;
}

export function openNavigation(address, provider = 'google') {
  window.open(mapsUrl(address, provider), '_blank', 'noopener');
}

/** Fragt zuerst, öffnet Maps nur bei Bestätigung. */
export function askNavigation(address, label) {
  const name = label || address.split(',')[0] || 'Ziel';
  if (window.confirm(`Navigation zu „${name}" starten?`)) {
    openNavigation(address, 'google');
    return true;
  }
  return false;
}

export async function copyAddress(address) {
  try {
    await navigator.clipboard.writeText(address);
    return true;
  } catch {
    return false;
  }
}
