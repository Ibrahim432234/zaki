import { STATUS_LABELS } from '../lib/constants.js';
import { getStats } from '../lib/groups.js';
import { escapeHtml } from '../lib/utils.js';

export function renderReportView(tour, state) {
  const stats = getStats(state.statuses);
  const elapsed = state.startTime ? Math.round((Date.now() - state.startTime) / 60000) : 0;
  const hh = Math.floor(elapsed / 60);
  const mm = elapsed % 60;
  const timeStr = hh > 0 ? `${hh}h ${mm}min` : `${mm} Min.`;

  const issues = tour.stops
    .filter((s) => {
      const st = state.statuses[s.id];
      return st && (st.status === 'nothome' || st.status === 'partial');
    })
    .map((s) => {
      const st = state.statuses[s.id];
      const note = state.notes[s.id] || '';
      const time = st.timestamp
        ? new Date(st.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
        : '';
      return { s, st, note, time };
    });

  const notesArr = Object.entries(state.notes)
    .filter(([, n]) => n.trim())
    .map(([id, n]) => ({ s: tour.stops.find((x) => x.id === id), n }));

  return `
    <div class="report-card">
      <div class="report-title">📊 Tour-Übersicht</div>
      <div class="stat-row">
        <div class="stat-box green"><div class="stat-num">${stats.delivered}</div><div class="stat-lbl">Geliefert</div></div>
        <div class="stat-box red"><div class="stat-num">${stats.nothome}</div><div class="stat-lbl">Nicht da</div></div>
        <div class="stat-box orange"><div class="stat-num">${stats.partial}</div><div class="stat-lbl">Teillieferung</div></div>
        <div class="stat-box"><div class="stat-num">${stats.skipped}</div><div class="stat-lbl">Übersprungen</div></div>
      </div>
      <div class="stat-row">
        <div class="stat-box"><div class="stat-num">${stats.total}/${tour.stops.length}</div><div class="stat-lbl">Gesamt</div></div>
        <div class="stat-box"><div class="stat-num stat-num-sm">${timeStr}</div><div class="stat-lbl">Fahrzeit</div></div>
      </div>
    </div>

    ${
      issues.length
        ? `
      <div class="report-card">
        <div class="report-title">⚠️ Probleme (${issues.length})</div>
        ${issues
          .map(
            ({ s, st, note, time }) => `
          <div class="report-list-item">
            <div class="report-dot ${st.status === 'nothome' ? 'dot-red' : 'dot-orange'}"></div>
            <div>
              <div class="report-item-name">${escapeHtml(s.name)} <span class="muted">${s.id}</span></div>
              <div class="report-item-note">${escapeHtml(s.street)}, ${escapeHtml(s.city)}${time ? ` · ${time}` : ''}${note ? ` · ${escapeHtml(note)}` : ''}</div>
            </div>
          </div>`
          )
          .join('')}
      </div>`
        : '<div class="report-card report-ok">🎉 Keine Probleme!</div>'
    }

    ${
      notesArr.length
        ? `
      <div class="report-card">
        <div class="report-title">✏️ Notizen</div>
        ${notesArr
          .map(
            ({ s, n }) => `
          <div class="report-list-item">
            <div class="report-dot dot-blue"></div>
            <div>
              <div class="report-item-name">${escapeHtml(s?.name || '')}</div>
              <div class="report-item-note">${escapeHtml(n)}</div>
            </div>
          </div>`
          )
          .join('')}
      </div>`
        : ''
    }

    <button class="btn-share" data-action="share-whatsapp">📤 WhatsApp teilen</button>
    <button class="btn-copy" data-action="copy-report">📋 Text kopieren</button>
    <button class="btn-copy" data-action="download-pdf">📄 PDF herunterladen</button>
    <button class="btn-copy" data-action="download-csv">📊 CSV exportieren</button>
    <button class="btn-copy" data-action="export-state">💾 Fortschritt exportieren</button>
    <label class="btn-copy import-label">
      📥 Fortschritt importieren
      <input type="file" accept=".json" data-action="import-state" hidden>
    </label>
  `;
}
