import { loadSettings } from './settings.js';
import { showConfirm } from '../components/modal.js';

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

/** Navigation mit professionellem Dialog — respektiert Einstellungen */
export async function requestNavigation(address, label) {
  const settings = loadSettings();
  const name = label || address.split(',')[0] || 'Ziel';

  if (!settings.askBeforeNav) {
    openNavigation(address, settings.navProvider);
    return true;
  }

  const ok = await showConfirm({
    title: 'Route starten',
    body: `Navigation zu „${name}" in ${settings.navProvider === 'waze' ? 'Waze' : 'Google Maps'} öffnen?`,
    confirmLabel: 'Route starten',
    cancelLabel: 'Abbrechen',
  });

  if (ok) openNavigation(address, settings.navProvider);
  return ok;
}

export async function offerNavigationAfterDelivery(address, label) {
  const settings = loadSettings();
  if (!settings.askAfterDelivery || !address) return false;

  const name = label || address.split(',')[0];
  const ok = await showConfirm({
    title: 'Nächster Stopp',
    body: `Möchtest du jetzt zu „${name}" navigieren?`,
    confirmLabel: 'Ja, navigieren',
    cancelLabel: 'Nein, danke',
  });

  if (ok) openNavigation(address, settings.navProvider);
  return ok;
}

export async function copyAddress(address) {
  try {
    await navigator.clipboard.writeText(address);
    return true;
  } catch {
    return false;
  }
}
