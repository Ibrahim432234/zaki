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
          isComplete ? 'Tour abgeschlossen ✅' : `Stopp ${done + 1} von ${totalStops}`
        }</span>
      </div>
      <div class="tb-right">
        <span class="tb-time" id="clock">${formatClock()}</span>
        <span class="tb-date" id="dateline">${formatDateLine()}</span>
      </div>
    </header>
    <div class="prog-wrap">
      <div class="prog-bar"><div class="prog-fill" id="pfill" style="width:${pct}%"></div></div>
      <div class="prog-lbl" id="plbl">${done} von ${totalStops} erledigt</div>
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

  if (countEl) {
    countEl.textContent = isComplete ? 'Tour abgeschlossen ✅' : `Stopp ${done + 1} von ${totalStops}`;
  }
  if (fillEl) fillEl.style.width = `${pct}%`;
  if (lblEl) lblEl.textContent = `${done} von ${totalStops} erledigt`;
}

export function startClock() {
  const tick = () => {
    const clock = document.getElementById('clock');
    const date = document.getElementById('dateline');
    if (clock) clock.textContent = formatClock();
    if (date) date.textContent = formatDateLine();
  };
  tick();
  setInterval(tick, 15000);
}
