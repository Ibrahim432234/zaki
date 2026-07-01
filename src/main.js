import './styles/main.css';
import './styles/pro.css';
import { App } from './app.js';
import { showConfirm } from './components/modal.js';
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    showConfirm({
      title: 'Update verfügbar',
      body: 'Eine neue Version der App ist bereit. Jetzt aktualisieren?',
      confirmLabel: 'Aktualisieren',
      cancelLabel: 'Später',
    }).then((ok) => {
      if (ok) updateSW(true);
    });
  },
});

const app = new App(document.getElementById('app'));
app.init();
