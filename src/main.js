import './styles/main.css';
import { App } from './app.js';
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Neue Version verfügbar. Jetzt aktualisieren?')) {
      updateSW(true);
    }
  },
});

const app = new App(document.getElementById('app'));
app.init();
