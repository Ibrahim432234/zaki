const KEY = 'zaki_settings';

const DEFAULTS = {
  askBeforeNav: true,
  navProvider: 'google',
};

export function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...DEFAULTS, ...saved };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
}

export function updateSetting(key, value) {
  const s = loadSettings();
  s[key] = value;
  saveSettings(s);
  return s;
}
