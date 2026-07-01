import { countDone } from '../lib/groups.js';
import { formatClock, formatDateLine } from '../lib/utils.js';

export function renderTopbar(tour, state, totalStops) {
  const done = countDone(state.statuses);
  const pct = totalStops ? Math.round((done / totalStops) * 100) : 0;
  const isComplete = done >= totalStops;

  return `
    <header class="topbar">
      <div class="tb-left">
        <span class="tb-tour">${tour.name}</span>
        <span class="tb-count" id="tb-count">${
          isComplete ? 'Abgeschlossen' : `${done} / ${totalStops} Stopps`
        }</span>
      </div>
      <div class="tb-right">
        <button type="button" class="tb-settings" data-action="open-settings" aria-label="Einstellungen">⚙</button>
        <span class="tb-time" id="clock">${formatClock()}</span>
      </div>
    </header>
    <div class="prog-wrap">
      <div class="prog-bar"><div class="prog-fill" id="pfill" style="width:${pct}%"></div></div>
      <div class="prog-lbl" id="plbl">${pct}% · ${formatDateLine()}</div>
    </div>
  `;
}

export function updateTopbar(tour, state, totalStops) {
  const done = countDone(state.statuses);
  const pct = totalStops ? Math.round((done / totalStops) * 100) : 0;
  const isComplete = done >= totalStops;

  const countEl = document.getElementById('tb-count');
  const fillEl = document.getElementById('pfill');
  const lblEl = document.getElementById('plbl');

  if (countEl) countEl.textContent = isComplete ? 'Abgeschlossen' : `${done} / ${totalStops} Stopps`;
  if (fillEl) fillEl.style.width = `${pct}%`;
  if (lblEl) lblEl.textContent = `${pct}% · ${formatDateLine()}`;
}

export function startClock() {
  const tick = () => {
    const clock = document.getElementById('clock');
    if (clock) clock.textContent = formatClock();
  };
  tick();
  setInterval(tick, 15000);
}
