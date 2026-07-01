import { escapeHtml } from '../lib/utils.js';

function root() {
  let el = document.getElementById('modal-root');
  if (!el) {
    el = document.createElement('div');
    el.id = 'modal-root';
    document.body.appendChild(el);
  }
  return el;
}

function closeModal() {
  const el = root();
  el.classList.remove('open');
  el.innerHTML = '';
}

/** Professionelles Bottom-Sheet statt Browser-Popup */
export function showConfirm({ title, body, confirmLabel = 'Ja, starten', cancelLabel = 'Abbrechen' }) {
  return new Promise((resolve) => {
    const el = root();
    el.innerHTML = `
      <div class="sheet-backdrop" data-modal="backdrop"></div>
      <div class="sheet" role="dialog" aria-modal="true">
        <div class="sheet-handle"></div>
        <h2 class="sheet-title">${escapeHtml(title)}</h2>
        <p class="sheet-body">${escapeHtml(body)}</p>
        <button type="button" class="sheet-btn sheet-btn-primary" data-modal="ok">${escapeHtml(confirmLabel)}</button>
        <button type="button" class="sheet-btn sheet-btn-ghost" data-modal="cancel">${escapeHtml(cancelLabel)}</button>
      </div>
    `;
    el.classList.add('open');

    const done = (value) => {
      closeModal();
      resolve(value);
    };

    el.onclick = (e) => {
      const t = e.target;
      if (t.dataset.modal === 'ok') done(true);
      if (t.dataset.modal === 'cancel' || t.dataset.modal === 'backdrop') done(false);
    };
  });
}

export function showSettingsSheet(settings, onChange) {
  return new Promise((resolve) => {
    const el = root();
    el.innerHTML = `
      <div class="sheet-backdrop" data-modal="backdrop"></div>
      <div class="sheet sheet-tall" role="dialog" aria-modal="true">
        <div class="sheet-handle"></div>
        <h2 class="sheet-title">Einstellungen</h2>
        <label class="sheet-switch">
          <span>Vor Navigation nachfragen</span>
          <input type="checkbox" data-setting="askBeforeNav" ${settings.askBeforeNav ? 'checked' : ''}>
        </label>
        <p class="sheet-label">Navigations-App</p>
        <div class="sheet-chips">
          <button type="button" class="chip ${settings.navProvider === 'google' ? 'active' : ''}" data-setting-nav="google">Google Maps</button>
          <button type="button" class="chip ${settings.navProvider === 'waze' ? 'active' : ''}" data-setting-nav="waze">Waze</button>
        </div>
        <button type="button" class="sheet-btn sheet-btn-primary" data-modal="close">Fertig</button>
      </div>
    `;
    el.classList.add('open');

    el.onchange = (e) => {
      const key = e.target.dataset?.setting;
      if (key) onChange(key, e.target.checked);
    };

    el.onclick = (e) => {
      const nav = e.target.dataset?.settingNav;
      if (nav) {
        onChange('navProvider', nav);
        el.querySelectorAll('[data-setting-nav]').forEach((b) => b.classList.toggle('active', b.dataset.settingNav === nav));
      }
      if (e.target.dataset.modal === 'close' || e.target.dataset.modal === 'backdrop') {
        closeModal();
        resolve();
      }
    };
  });
}
