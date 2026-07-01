import { STATUS_LABELS } from './constants.js';
import { getStats } from './groups.js';
import { formatAddress } from './tours.js';

export function buildReportText(tour, statuses, notes, startTime) {
  const stats = getStats(statuses);
  const elapsed = startTime ? Math.round((Date.now() - startTime) / 60000) : 0;
  const hh = Math.floor(elapsed / 60);
  const mm = elapsed % 60;
  const timeStr = hh > 0 ? `${hh}h ${mm}min` : `${mm} Min.`;

  const issues = tour.stops
    .filter((s) => {
      const st = statuses[s.id];
      return st && (st.status === 'nothome' || st.status === 'partial');
    })
    .map((s) => {
      const st = statuses[s.id];
      const note = notes[s.id] || '';
      const ts = st.timestamp ? new Date(st.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '';
      return `- ${s.name} (${s.id}): ${STATUS_LABELS[st.status]}${ts ? ` um ${ts}` : ''}${note ? ` – ${note}` : ''}`;
    });

  const notesList = Object.entries(notes)
    .filter(([, n]) => n.trim())
    .map(([id, n]) => {
      const stop = tour.stops.find((s) => s.id === id);
      return `- ${stop?.name || id}: ${n}`;
    });

  let text = `${tour.name} – Fahrbericht\n${new Date().toLocaleString('de-DE')}\n\n`;
  text += `Erledigt: ${stats.total}/${tour.stops.length}\n`;
  text += `✅ Geliefert: ${stats.delivered}\n`;
  text += `⚠️ Teillieferung: ${stats.partial}\n`;
  text += `❌ Nicht da: ${stats.nothome}\n`;
  text += `⏭️ Übersprungen: ${stats.skipped}\n`;
  text += `Fahrzeit: ${timeStr}\n`;

  if (issues.length) {
    text += `\nProbleme:\n${issues.join('\n')}`;
  }
  if (notesList.length) {
    text += `\n\nNotizen:\n${notesList.join('\n')}`;
  }

  return text;
}

export function buildCsv(tour, statuses, notes) {
  const header = 'ID;Name;Adresse;Status;Zeit;Notiz\n';
  const rows = tour.stops.map((s) => {
    const st = statuses[s.id];
    const status = st ? STATUS_LABELS[st.status] || st.status : 'Offen';
    const time = st?.timestamp
      ? new Date(st.timestamp).toLocaleString('de-DE')
      : '';
    const note = (notes[s.id] || '').replace(/;/g, ',');
    return `${s.id};${s.name};${formatAddress(s)};${status};${time};${note}`;
  });
  return header + rows.join('\n');
}

export async function downloadPdf(tour, statuses, notes, startTime) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const stats = getStats(statuses);
  const text = buildReportText(tour, statuses, notes, startTime);

  doc.setFontSize(16);
  doc.text(tour.name + ' – Fahrbericht', 14, 20);
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text, 180);
  doc.text(lines, 14, 30);

  doc.save(`${tour.id}-bericht-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function shareWhatsApp(text) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
