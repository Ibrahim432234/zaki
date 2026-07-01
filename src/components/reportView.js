import { getStats } from '../lib/groups.js';

export function renderReportView(tour, state) {
  const stats = getStats(state.statuses);
  const elapsed = state.startTime ? Math.round((Date.now() - state.startTime) / 60000) : 0;

  return `
    <div class="report-card">
      <h2 class="report-heading">Tour-Bericht</h2>
      <div class="report-grid">
        <div class="report-stat"><span class="report-num">${stats.delivered}</span><span class="report-lbl">Zugestellt</span></div>
        <div class="report-stat"><span class="report-num">${stats.nothome}</span><span class="report-lbl">Nicht da</span></div>
        <div class="report-stat report-stat-wide"><span class="report-num">${stats.total} / ${tour.stops.length}</span><span class="report-lbl">Erledigt · ${elapsed} Min.</span></div>
      </div>
    </div>
    <button type="button" class="btn-primary btn-block" data-action="share-whatsapp">Bericht per WhatsApp</button>
    <button type="button" class="btn-ghost btn-block" data-action="reset-tour">Tour neu starten</button>
  `;
}
