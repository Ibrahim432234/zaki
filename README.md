# Zaki – Liefer Tour App

Professionelle mobile Web-App für Lieferfahrer. Verwaltet Stopps, Navigation, Status und Fahrberichte — offline-fähig als PWA.

## Features

- **Adress-Gruppierung** – mehrere Lieferungen an derselben Adresse in einem Stopp
- **Navigation** – Google Maps, Apple Maps oder Waze
- **GPS-Entfernung** – Anzeige von Distanz und geschätzter Fahrzeit
- **Status pro Stopp** – Geliefert, Nicht da, Teillieferung, Übersprungen
- **Swipe-Gesten** – rechts = geliefert, links = nicht da
- **Rückgängig** – letzte Aktion widerrufen
- **Foto-Nachweis** – Lieferfotos (IndexedDB)
- **Bericht** – WhatsApp, PDF, CSV, Backup Import/Export
- **PWA** – installierbar auf dem Homescreen, offline nutzbar
- **Dark Mode** – automatisch

## Auf Android nutzen (empfohlen)

### 1. Auf GitHub hochladen & Link öffnen

Nach dem Push auf `main` ist die App hier erreichbar:

**https://ibrahim432234.github.io/zaki/**

> GitHub Pages muss einmal aktiviert sein: Repo → **Settings** → **Pages** → Source: **GitHub Actions**

### 2. Als App auf dem Homescreen installieren

1. Link in **Chrome** auf dem Android-Handy öffnen
2. Menü (⋮) → **„Zum Startbildschirm hinzufügen"** oder **„App installieren"**
3. App startet wie eine normale App — auch offline

### Warum nicht `npm run dev`?

`npm run dev` läuft nur auf deinem PC im WLAN. Für unterwegs brauchst du einen **öffentlichen Link** (GitHub Pages) — genau wie früher, nur dass jetzt automatisch gebaut wird.

## Schnellstart (Entwicklung am PC)

```bash
npm install
npm run dev
```

App öffnen: http://localhost:5173

## Build & Produktion

```bash
npm run build
npm run preview
```

Der Build liegt in `dist/` und kann auf jedem Webserver gehostet werden.

## Auf dem Handy installieren

1. App im Browser öffnen (Chrome/Safari)
2. **„Zum Startbildschirm hinzufügen"** wählen
3. App startet wie eine native App

## Neue Tour hinzufügen

1. JSON-Datei unter `src/data/tours/` anlegen (siehe `tour-186.json`)
2. In `src/lib/tours.js` importieren und registrieren

## Tests

```bash
npm test
```

## Projektstruktur

```
src/
├── app.js              # Haupt-App, Event-Handling
├── main.js             # Einstiegspunkt + PWA
├── components/         # UI-Komponenten
├── data/tours/         # Tour-Daten (JSON)
├── lib/                # Logik (State, GPS, Berichte, …)
└── styles/main.css     # Styles
```

## Tour-Daten Format

```json
{
  "id": "tour-186",
  "name": "Tour 186",
  "stops": [
    {
      "id": "186005",
      "name": "Kundenname",
      "type": "Bäckerei",
      "street": "Musterstr. 1",
      "plz": "27570",
      "city": "Bremerhaven"
    }
  ]
}
```
