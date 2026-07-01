let wakeLock = null;

export async function requestWakeLock() {
  if (!('wakeLock' in navigator)) return false;
  try {
    if (wakeLock && !wakeLock.released) return true;
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => {
      wakeLock = null;
    });
    return true;
  } catch {
    return false;
  }
}

export async function releaseWakeLock() {
  try {
    await wakeLock?.release();
  } catch {
    /* ignore */
  }
  wakeLock = null;
}

export function onVisibilityWakeLock(shouldKeepAwake) {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && shouldKeepAwake()) {
      await requestWakeLock();
    }
  });
}
