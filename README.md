# Luis Rosado — Portfolio

Meine Bewerbungswebsite für ein Praktikum als Applikationsentwickler EFZ.
Die Oberfläche ist als Code-Editor aufgebaut: jeder Tab ist eine Datei, die
Sidebar ein Datei-Explorer. Neben dem öffentlichen Teil gibt es einen
passwortgeschützten Bereich mit Noten und Lebenslauf, der über eine
Serverless-Function ausgeliefert wird.

![Stack](https://img.shields.io/badge/stack-HTML%20%7C%20CSS%20%7C%20JS%20%7C%20Vercel-blue)

---

## Schnellstart

```bash
npm install -g vercel
vercel dev
```

→ Läuft auf `http://localhost:3000`

Einrichtung und Deployment im Detail: [`docs/SETUP.md`](docs/SETUP.md)
Wo welche Inhalte gepflegt werden: [`docs/CONTENT-GUIDE.md`](docs/CONTENT-GUIDE.md)

---

## Projektstruktur

```
luis-rosado-portfolio/
├── public/                  # Frontend (statisch, von Vercel ausgeliefert)
│   ├── index.html           #   Seitenstruktur / Inhalte
│   ├── css/themes.css       #   Farben und Schriften der sechs Farbdesigns
│   ├── css/style.css        #   Grundstyling der Inhalte
│   ├── css/vscode.css       #   Editor-Oberfläche und alles, was darauf aufbaut
│   ├── js/app.js            #   Tabs, Login, Medien, Bilderstrecken, Hörstatistiken
│   ├── js/vscode.js         #   Activity Bar, Statusleiste, Kommandopalette, Terminal
│   └── media/               #   Bilder der Interessen-Seite
│
├── api/                     # Backend — Vercel Serverless Functions
│   ├── login.js             #   POST /api/login     → prüft Passwort, gibt Token zurück
│   └── protected.js         #   GET  /api/protected → Noten + Lebenslauf (nur mit Token)
│
├── lib/
│   └── auth.js              # Passwort-Hashing und Token-Signierung
│
├── scripts/                 # Hilfsskripte
│   ├── generate-password-hash.js
│   └── generate-jwt-secret.js
│
├── docs/
│   ├── SETUP.md             # Einrichtung & Deployment
│   └── CONTENT-GUIDE.md     # Wo trage ich welche Inhalte ein?
│
├── .env.example
├── package.json
└── vercel.json
```

---

## Tech Stack

| Bereich | Technologie |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript (kein Framework, kein Build-Step) |
| Icons | [Devicon](https://devicon.dev) |
| Fonts | JetBrains Mono, Inter (Google Fonts) |
| Backend | Vercel Serverless Functions (Node.js) |
| Passwort | scrypt mit Salt (Node `crypto`) |
| Session | HMAC-SHA256-signiertes Token, 4 h gültig |
| Hosting | Vercel |
| Hörstatistiken | Öffentliche API von [stats.fm](https://stats.fm) (wird beim Aufruf der Interessen-Seite geladen) |

Das Frontend kommt bewusst ohne Framework und ohne Build-Schritt aus — die
Dateien in `public/` sind genau das, was der Browser ausliefert. Auch das
Backend nutzt nur Node-Bordmittel, `dependencies` ist leer.

Zur Laufzeit werden drei Dinge von fremden Servern geholt: die Schriften und
die Technologie-Logos jeweils von einem CDN, und die Hörstatistiken von
stats.fm. Alles andere, auch die Bilder unter `public/media/`, liegt im
Repository. Die Herkunft der Bilder steht auf der Interessen-Seite und im
Impressum.

---

## Geschützter Bereich

Im Ordner **„unterlagen"** (Sidebar) liegen `noten.csv` und `lebenslauf.md`.
Der Ablauf:

1. Das Login-Modal schickt das Passwort an `/api/login`, dort wird es gegen
   einen gesalzenen scrypt-Hash geprüft (Vergleich in konstanter Zeit).
2. Bei Erfolg gibt es ein signiertes Token mit 4 h Laufzeit, das nur im
   `sessionStorage` liegt.
3. `/api/protected` liefert Noten und Lebenslauf nur gegen ein gültiges Token
   aus. Die Daten stehen serverseitig und tauchen nie im Frontend-Bundle auf.

Passwort-Hash und Token-Schlüssel stehen **nicht** im Repository, sondern
kommen aus den Umgebungsvariablen `APP_PASSWORD_HASH` und `JWT_SECRET`.
Fehlt eine davon, antwortet der geschützte Bereich mit 503 — ein
Rückfall auf einen im Code hinterlegten Standardwert wäre kein Schutz,
weil ihn jeder nachlesen könnte.

Passwort ändern:

```bash
node scripts/generate-password-hash.js NEUES_PASSWORT
```

Der ausgegebene Wert kommt nach `.env` bzw. per `vercel env add
APP_PASSWORD_HASH` in die Produktionsumgebung.
