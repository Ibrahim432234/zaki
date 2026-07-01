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

export async function copyAddress(address) {
  try {
    await navigator.clipboard.writeText(address);
    return true;
  } catch {
    return false;
  }
}
