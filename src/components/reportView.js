import { getStats } from '../lib/groups.js';

export function renderReportView(tour, state) {
  const stats = getStats(state.statuses);

  return `
    <div class="report-card">
      <div class="report-title">Tour-Übersicht</div>
      <div class="stat-row">
        <div class="stat-box green"><div class="stat-num">${stats.delivered}</div><div class="stat-lbl">Geliefert</div></div>
        <div class="stat-box red"><div class="stat-num">${stats.nothome}</div><div class="stat-lbl">Nicht da</div></div>
      </div>
      <div class="stat-box" style="margin-top:10px">
        <div class="stat-num">${stats.total} / ${tour.stops.length}</div>
        <div class="stat-lbl">Erledigt</div>
      </div>
    </div>
    <button class="btn-share" data-action="share-whatsapp">📤 Bericht per WhatsApp</button>
  `;
}
