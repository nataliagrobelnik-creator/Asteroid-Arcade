# Asteroid Arcade

Ein kleines, direkt spielbares **Asteroids-ähnliches Arcade-Spiel** als reine statische Website.

## Features

- 2D-Canvas-Gameplay im Retro-Look
- Trägheitsbasierte Schiffssteuerung
- Bildschirm-Wrapping für Schiff, Asteroiden und Schüsse
- Asteroiden zerbrechen in kleinere Fragmente
- Kollisionen mit Leben-System (3 Leben)
- Score- und Wellen-System
- Game-Over-Overlay mit Neustart per Enter

## Lokal starten

1. Repository klonen oder herunterladen.
2. `index.html` direkt im Browser öffnen.

Optional mit lokalem Static Server (z. B. VS Code Live Server oder Python):

```bash
python3 -m http.server 8080
```

Dann im Browser öffnen: `http://localhost:8080`

## Auf GitHub Pages hosten

1. Projekt auf GitHub pushen.
2. In den Repo-Einstellungen zu **Pages** gehen.
3. Unter **Build and deployment** auswählen:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` (oder dein Branch), Ordner `/ (root)`
4. Speichern – nach kurzer Zeit ist das Spiel über den angezeigten GitHub-Pages-Link erreichbar.

## Steuerung

- **Pfeil links/rechts:** Schiff rotieren
- **Pfeil hoch:** Schub
- **Leertaste:** Schießen
- **Enter (bei Game Over):** Neustart

## Projektstruktur

```text
.
├── index.html   # Grundstruktur, Canvas und Einbindung der Assets
├── style.css    # Retro-Optik und Layout
├── script.js    # Spiel-Logik (Loop, Input, Rendering, Kollisionen)
└── README.md    # Doku und Startanleitung
```

## Technik

- Reines **HTML + CSS + Vanilla JavaScript**
- Kein Backend
- Keine Datenbank
- Kein Build-Prozess
- Keine externen Abhängigkeiten
