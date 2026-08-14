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
node scripts/dev-server.js
```

→ Läuft auf `http://localhost:4175`, ohne Installation und ohne Konto.

Der Entwicklungsserver liefert nicht nur `public/` aus, sondern bedient auch
die Funktionen in `api/` und liest die `.env` — Anmeldung, Noten und die
Kompetenznachweise lassen sich damit lokal vollständig testen. Er schickt
dieselben Sicherheitskopfzeilen mit wie `vercel.json`, damit eine zu enge
Content-Security-Policy hier auffällt und nicht erst nach dem
Veröffentlichen.

Zum Deployen wird die Vercel-CLI gebraucht:

```bash
npm install -g vercel
vercel --prod
```

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
│   ├── protected.js         #   GET  /api/protected → Noten + Lebenslauf (nur mit Token)
│   └── zeugnis.js           #   GET  /api/zeugnis   → üK-Kompetenznachweis als PDF (nur mit Token)
│
├── unterlagen/              # Die Kompetenznachweise als PDF — nicht im Repository
│                            # (siehe „Geschützter Bereich")
├── lib/
│   └── auth.js              # Passwort-Hashing und Token-Signierung
│
├── scripts/                 # Hilfsskripte
│   ├── generate-password-hash.js
│   ├── generate-jwt-secret.js
│   └── test-zeugnis.js      #   prüft den Zugriffsschutz von /api/zeugnis
│
├── docs/
│   ├── SETUP.md             # Einrichtung & Deployment
│   └── CONTENT-GUIDE.md     # Wo trage ich welche Inhalte ein?
│
├── .env.example
├── .vercelignore            # damit unterlagen/ trotz .gitignore mit hochgeladen wird
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

Was auf der Seite von anderen stammt — Bibliotheken, Schriften, die
übernommenen Farbdesigns und die nachgebaute Editor-Oberfläche — ist am Fuss
der Startseite unter „Quellen" aufgeführt. **Diese Liste gehört bei jeder
grösseren Änderung mitgepflegt**, ebenso wie diese README; gepflegt wird sie
über den Schlüssel `home.credits` in `public/js/i18n.js`, in beiden Sprachen.

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
4. `/api/zeugnis?modul=187` liefert den zugehörigen üK-Kompetenznachweis als
   PDF, ebenfalls nur gegen ein gültiges Token. Die Modulnummer wird gegen
   eine feste Liste geprüft, statt daraus einen Pfad zu bauen.

Die PDF-Dateien liegen in `unterlagen/` und bewusst **nicht** unter `public/`:
alles dort liefert Vercel ohne jede Prüfung aus, ein Passwort davor wäre
Dekoration. Aus demselben Grund stehen sie in `.gitignore` — dieses
Repository ist öffentlich. Damit sie trotzdem auf den Server kommen, gibt es
`.vercelignore`; das setzt allerdings voraus, dass mit `vercel --prod` aus
dem Ordner deployt wird und nicht automatisch aus GitHub.

Den Zugriffsschutz prüft ein Skript ohne laufenden Server:

```bash
node scripts/test-zeugnis.js
```

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
