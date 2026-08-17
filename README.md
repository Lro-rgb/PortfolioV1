# Portfolio von Luis Rosado

Meine Bewerbungswebsite für ein Praktikum als **Applikationsentwickler EFZ**,
entstanden während der Informatikmittelschule (IMS) an der bwd Bern.

Die Seite sieht aus wie ein Code-Editor und lässt sich auch so bedienen: Jeder
Tab oben ist eine „Datei" mit einem Thema: `luis.json` stellt mich vor,
`projekte.html` zeigt meine Arbeiten, `kontakt.sql` sagt, wie man mich
erreicht. Links steht ein Datei-Explorer, unten eine Statusleiste, und mit
`Strg+P` öffnet sich eine Suche über alles. Wer damit nichts anfangen kann,
klickt einfach die Tabs an. Es ist eine normale Website, nur eben in der
Kulisse des Werkzeugs, mit dem ich arbeite.

Ein Teil der Seite ist mit einem Passwort geschützt: Zeugnisse, Noten und der
unterschriebene Lebenslauf gehören nicht ins offene Netz. Betriebe, die sich
bei mir melden, bekommen das Passwort von mir.

![Stack](https://img.shields.io/badge/stack-HTML%20%7C%20CSS%20%7C%20JS%20%7C%20Vercel-blue)

---

## Inhalt

- [Was die Seite kann](#was-die-seite-kann)
- [Schnellstart](#schnellstart)
- [Tech Stack](#tech-stack)
- [Hilfsmittel](#hilfsmittel)
- [Projektstruktur](#projektstruktur)
- [Die Oberfläche](#die-oberfläche)
- [Auf dem Handy](#auf-dem-handy)
- [Zwei Sprachen](#zwei-sprachen)
- [Projekte zum Ausprobieren](#projekte-zum-ausprobieren)
- [Geschützter Bereich](#geschützter-bereich)
- [Was beim Ändern mitgepflegt gehört](#was-beim-ändern-mitgepflegt-gehört)

---

## Was die Seite kann

| | |
|---|---|
| **Tabs statt Menü** | Sieben offene „Dateien", schliessbar und über den Explorer wieder zu öffnen |
| **Kommandopalette** | `Strg+P` sucht Dateien, `Strg+Umschalt+P` führt Befehle aus, wie im echten Editor |
| **Terminal** | `Strg+^` klappt eine Shell auf. Die Befehle sind echt: `help`, `whoami`, `open projekte` |
| **Sechs Farbdesigns** | Dark+, Light+, Dracula, Nord, One Dark, GitHub Dark, die Wahl bleibt gespeichert |
| **Zwei Sprachen** | Deutsch und Englisch, umschaltbar oben rechts, ohne Neuladen |
| **Zehn Projekte** | Mit Bildern, zwei Bildschirmaufnahmen, Quellcode-Archiven und zwei Vorführungen zum Selberbedienen |
| **Geschützter Bereich** | Noten, Kompetenznachweise, Lebenslauf und Arbeitsbestätigung, nur mit Passwort |
| **Druckansicht** | Beim Ausdrucken fällt die Editor-Kulisse weg, übrig bleibt der Text auf Weiss |
| **Ohne Maus bedienbar** | Tastaturkürzel, Fokusrahmen, Sprungmarke zum Inhalt, beschriftete Bedienelemente |

---

## Schnellstart

```bash
node scripts/dev-server.js
```

→ Läuft auf `http://localhost:4175`, ohne Installation und ohne Konto. Es gibt
keine Abhängigkeiten zu installieren: `dependencies` in der `package.json` ist
leer, und das bleibt auch so.

Der Entwicklungsserver liefert nicht nur `public/` aus, sondern bedient auch
die Funktionen in `api/` und liest die `.env`. Anmeldung, Noten und die
Kompetenznachweise lassen sich damit lokal vollständig testen. Er schickt
dieselben Sicherheitskopfzeilen mit wie `vercel.json`, damit eine zu enge
Content-Security-Policy hier auffällt und nicht erst nach dem Veröffentlichen.

Zum Veröffentlichen wird die Vercel-CLI gebraucht:

```bash
npm install -g vercel
vercel --prod
```

Einrichtung und Deployment im Detail: [`docs/SETUP.md`](docs/SETUP.md)
Wo welche Inhalte gepflegt werden: [`docs/CONTENT-GUIDE.md`](docs/CONTENT-GUIDE.md)

---

## Tech Stack

| Bereich | Technologie |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript (kein Framework, kein Build-Step) |
| Icons | [Devicon](https://devicon.dev) |
| Schriften | JetBrains Mono, Inter (Google Fonts) |
| Backend | Vercel Serverless Functions (Node.js) |
| Passwort | scrypt mit Salt (Node `crypto`) |
| Sitzung | HMAC-SHA256-signiertes Token, 4 h gültig, nur im `sessionStorage` |
| Unterlagen | AES-256-GCM verschlüsselt im Repository |
| Hosting | Vercel |
| Hörstatistiken | Öffentliche API von [stats.fm](https://stats.fm), geladen beim Aufruf der Interessen-Seite |

Das Frontend kommt bewusst ohne Framework und ohne Build-Schritt aus. Die
Dateien in `public/` sind genau das, was der Browser ausliefert. Auch das
Backend nutzt nur Node-Bordmittel.

Zur Laufzeit werden drei Dinge von fremden Servern geholt: die Schriften und
die Technologie-Logos jeweils von einem CDN, und die Hörstatistiken von
stats.fm. Alles andere, auch die Bilder unter `public/media/`, liegt im
Repository.

---

## Hilfsmittel

Ein Teil dieser Seite berührt Themen, die im Unterricht bisher nicht
vorkamen, allen voran die Absicherung der Daten im geschützten Bereich:
Passwörter als scrypt-Hash statt im Klartext, signierte Tokens mit Ablauf,
die verschlüsselten Unterlagen im Repository und die Sicherheitskopfzeilen
in `vercel.json`. Dazu kommt das Suchen hartnäckiger Fehler, für das mir in
der Schule bisher nur das Ausprobieren beigebracht wurde.

Für beides habe ich mit **Claude Code** gearbeitet und in Blogs und
Dokumentationen nachgelesen, vor allem MDN und der Node-Dokumentation. Was
ich dabei übernommen habe, habe ich vorher nachvollzogen. Sonst könnte ich
in diesem Dokument nicht aufschreiben, warum die Seite so gebaut ist, wie
sie gebaut ist. Der Inhalt, der Aufbau und die Entscheidungen darüber, was
in die Seite kommt und was nicht, sind meine.

---

## Projektstruktur

```
luis-rosado-portfolio/
├── public/                  # Frontend (statisch, von Vercel ausgeliefert)
│   ├── index.html           #   Seitenstruktur und alle Texte
│   ├── css/themes.css       #   Farben, Schriften und Maße der sechs Farbdesigns
│   ├── css/style.css        #   Grundstyling der Inhalte
│   ├── css/vscode.css       #   Editor-Oberfläche und alles, was darauf aufbaut
│   ├── js/i18n.js           #   Wörterbuch Deutsch / Englisch
│   ├── js/app.js            #   Tabs, Login, Medien, Bilderstrecken, Vorführungen
│   ├── js/vscode.js         #   Activity Bar, Statusleiste, Kommandopalette, Terminal
│   ├── erste-website/       #   Kopie meiner ersten Website, läuft in der Vollansicht
│   └── media/               #   Bilder, Video und das Archiv der ersten Website
│
├── api/                     # Backend, Vercel Serverless Functions
│   ├── login.js             #   POST /api/login     → prüft Passwort, gibt Token zurück
│   ├── protected.js         #   GET  /api/protected → Noten + Lebenslauf (nur mit Token)
│   ├── zeugnis.js           #   GET  /api/zeugnis   → geschützte PDF (nur mit Token)
│   └── kurz.js              #   POST /api/kurz      → Vorführung des URL-Shorteners
│
├── unterlagen/                  # Nachweise, Lebenslauf, Arbeitsbestätigung als PDF, nur lokal
├── unterlagen-verschluesselt/   # dieselben Dateien verschlüsselt, die kommen ins Repository
│
├── lib/
│   └── auth.js              # Passwort-Hashing und Token-Signierung
│
├── scripts/
│   ├── dev-server.js                 # lokaler Server inklusive api/ und .env
│   ├── generate-password-hash.js     # Passwort → Hash für APP_PASSWORD_HASH
│   ├── generate-jwt-secret.js        # Zufallsschlüssel für JWT_SECRET
│   ├── unterlagen-verschluesseln.js  # PDF → verschlüsselte Fassung fürs Repo
│   └── test-zeugnis.js               # prüft den Zugriffsschutz von /api/zeugnis
│
├── docs/
│   ├── SETUP.md             # Einrichtung & Deployment
│   └── CONTENT-GUIDE.md     # Wo trage ich welche Inhalte ein?
│
├── .env.example
├── package.json
└── vercel.json              # Sicherheitskopfzeilen, Caching, Funktionen
```

---

## Die Oberfläche

Die Nachbildung ist bewusst genau, weil ungefähr schlechter aussieht als gar
nicht: Die Activity Bar links, die Sidebar daneben, die Tableiste **nur** über
dem Editor und nicht über der Sidebar, der farbige Strich am **oberen** Rand
des aktiven Tabs, die blaue Statusleiste unten. An genau solchen Kleinigkeiten
erkennt man eine Attrappe.

Der Inhalt darin ist dagegen normaler, gut lesbarer Text. Umgekehrt, also die Hülle
ungefähr und der Inhalt als Pseudo-Code, sieht das zwar nach Programmieren aus, liest
sich aber schlecht. Wer eine Bewerbung prüft, soll den Text lesen können, ohne
ihn zu entziffern.

Die Höhen und Breiten der Leisten stehen als Variablen an einer Stelle
(`--h-title`, `--h-tabs`, `--h-status`, `--w-activity`, `--w-sidebar` in
`css/themes.css`). Das Raster der Oberfläche rechnet damit, statt die Werte
mehrfach zu wiederholen.

---

## Auf dem Handy

Unter 820 px Breite ordnet sich die Oberfläche um, ohne ihren Charakter zu
verlieren: Die Icon-Leiste links bleibt stehen und scrollt als Navigation mit,
der Datei-Explorer fährt darüber als Schublade aus (Schalter ☰ in der
Titelleiste oder das Explorer-Symbol), und die Statusleiste sitzt fest am
unteren Rand.

Titel-, Tab- und Statusleiste werden höher, Explorer-Zeilen und Schaltflächen
bekommen Trefferflächen, die man ohne Zielen erreicht. Weil das über dieselben
Variablen läuft, zieht das ganze Raster von selbst mit, die Werte stehen nur
einmal in `css/vscode.css` in der Medienabfrage.

---

## Zwei Sprachen

Jedes übersetzbare Element trägt `data-i18n="schlüssel"` (für den Inhalt) oder
`data-i18n-<attribut>="schlüssel"` (für `aria-label`, `title`, `placeholder`).
Beim Umschalten liest `applyLang()` alle passenden Elemente neu ein, auch
später per JavaScript erzeugte. Die gewählte Sprache bleibt im
`localStorage` gespeichert.

Ein neuer Text braucht also zwei Einträge in `public/js/i18n.js`, einen unter
`de` und einen unter `en`, dazu das Attribut im HTML. Fehlt die englische
Fassung, fällt `t()` auf die deutsche zurück, statt eine Lücke zu zeigen.

---

## Projekte zum Ausprobieren

Zwei Projekte lassen sich auf der Seite selbst bedienen statt nur ansehen.

**Die erste Website** (Schulprojekt aus dem ersten Lehrjahr) liegt als Kopie
unter `public/erste-website/`. In der Projektkarte steckt sie verkleinert im
Rahmen; ein Klick öffnet sie in einem nachgebauten Browserfenster, in dem sie
wirklich läuft: eigene Verweise, eigener Zurück-Schalter, Adresszeile, die
mitzieht. Das Fenster ist ein natives `<dialog>`: Escape, Fokusfalle und
Abdunklung bringt der Browser mit, dafür braucht es kein eigenes JavaScript.
Der Rahmen darin läuft mit `sandbox="allow-same-origin"` und **ohne**
`allow-scripts`: Die Seite darf gelesen werden, damit die Adresszeile stimmt,
aber kein Skript darin läuft.

**Der URL-Shortener** (Schulprojekt aus Modul 210) hat mit `api/kurz.js` eine
echte Serverless-Function: `POST /api/kurz` prüft die Adresse und gibt einen
Kurzcode zurück. Der Code wird aus der Adresse selbst berechnet, damit die
Funktion sich nichts merken muss.

Was die Vorführung **nicht** tut, ist weiterleiten. Eine Weiterleitung auf
beliebige fremde Adressen würde diese Domain zum Steigbügel für Phishing-Links
machen. Dafür ist mir eine Vorführung zu wenig wert. Im Schulprojekt selbst
übernehmen das eine MariaDB und ein zweiter Dienst, der als einziger die
Datenbank sieht. Dieser Unterschied steht auf der Seite direkt unter der
Eingabe und nicht im Kleingedruckten.

---

## Geschützter Bereich

Im Ordner **„unterlagen"** (Sidebar) liegen `noten.csv` und `lebenslauf.md`.
Der Ablauf:

1. Das Login-Fenster schickt das Passwort an `/api/login`, dort wird es gegen
   einen gesalzenen scrypt-Hash geprüft (Vergleich in konstanter Zeit).
2. Bei Erfolg gibt es ein signiertes Token mit 4 h Laufzeit, das nur im
   `sessionStorage` liegt. Beim Schliessen des Tabs ist es weg.
3. `/api/protected` liefert Noten und Lebenslauf nur gegen ein gültiges Token
   aus. Die Daten stehen serverseitig und tauchen nie im Frontend-Bundle auf.
4. `/api/zeugnis?modul=187` liefert den zugehörigen üK-Kompetenznachweis als
   PDF, ebenfalls nur gegen ein gültiges Token. Die Modulnummer wird gegen
   eine feste Liste geprüft, statt daraus einen Pfad zu bauen. Über dieselbe
   Liste kommen auch `modul=cv` (der unterschriebene Lebenslauf) und
   `modul=arbeitsbestaetigung`.

Die Noten selbst stehen **nicht** in `api/protected.js`, sondern als eine Zeile
JSON in der Umgebungsvariablen `NOTEN_JSON`. Vorher lagen die PDF verschlüsselt
im Repository, die Zahlen daneben aber im Klartext. Der Passwortschutz galt
also nur für die Website, nicht für den Quelltext. Fehlt die Variable oder ist
sie kaputt, bleibt die Notenliste leer und der Rest des geschützten Bereichs
funktioniert weiter.

Im Notenbereich stehen die Karten in zwei Klappgruppen: üK-Kompetenznachweise
und Zeugnisse; welche Gruppe eine Karte bekommt, steht im Feld `art` jedes
Eintrags. Der Lebenslauf zeigt zusätzlich die beiden PDF mit
Vorschau und Download; die abgetippten Angaben darüber bleiben, damit der
Inhalt auch ohne PDF-Anzeige lesbar ist.

Der Lebenslauf beginnt mit den Personalien aus dem Feld `personalien` in
`api/protected.js`. Geburtsdatum, Wohnadresse und Telefonnummer stehen dort
**nicht im Klartext**, sondern kommen aus den Umgebungsvariablen
`CV_GEBURTSDATUM`, `CV_ADRESSE`, `CV_TELEFON` und `CV_NATIONALITAET`, aus
demselben Grund wie die Kompetenznachweise: Diese Datei liegt in einem
öffentlichen Repository, und ein Passwort vor dem Lebenslauf nützt nichts,
wenn die Wohnadresse zwei Klicks weiter auf GitHub steht. **Leere Felder
werden nicht angezeigt**: Was nicht gesetzt ist, fehlt in der Anzeige, statt
als leere Zeile dazustehen; dasselbe gilt für die Zertifikate.

Beide Bereiche baut JavaScript zusammen und trägt deshalb kein `data-i18n`.
Damit sie beim Sprachwechsel trotzdem mitziehen, werden sie neu aufgebaut,
wenn gerade einer von beiden offen ist.

Die PDF-Dateien liegen bewusst **nicht** unter `public/`: alles dort liefert
Vercel ohne jede Prüfung aus, ein Passwort davor wäre Dekoration.

Weil dieses Repository öffentlich ist, sind sie ausserdem **verschlüsselt**
abgelegt (AES-256-GCM). Eingecheckt wird nur `unterlagen-verschluesselt/`, die
Klartext-PDF in `unterlagen/` bleiben lokal und stehen in `.gitignore`. Den
Schlüssel hält `UNTERLAGEN_KEY`; ohne ihn antwortet `/api/zeugnis` mit 503. So
kommen die Dateien mit jedem Bau aus GitHub auf den Server, ohne dass jemand
die Noten im Repository lesen kann.

Nach dem Hinzufügen oder Austauschen einer PDF:

```bash
node scripts/unterlagen-verschluesseln.js
```

Den Zugriffsschutz prüft ein Skript ohne laufenden Server:

```bash
node scripts/test-zeugnis.js
```

Passwort-Hash und Token-Schlüssel stehen **nicht** im Repository, sondern
kommen aus den Umgebungsvariablen `APP_PASSWORD_HASH` und `JWT_SECRET`. Fehlt
eine davon, antwortet der geschützte Bereich mit 503. Ein Rückfall auf einen
im Code hinterlegten Standardwert wäre kein Schutz, weil ihn jeder nachlesen
könnte.

Passwort ändern:

```bash
node scripts/generate-password-hash.js NEUES_PASSWORT
```

Der ausgegebene Wert kommt nach `.env` bzw. per `vercel env add
APP_PASSWORD_HASH` in die Produktionsumgebung.

---

## Was beim Ändern mitgepflegt gehört

| Änderung | Was ausserdem nachzuziehen ist |
|---|---|
| Neuer Text im HTML | Zwei Einträge in `public/js/i18n.js` (`de` und `en`) |
| Neues Projekt | Karte in `index.html`, Bilder in `MEDIA` (`js/app.js`), Zähler zählt sich selbst |
| Neue Bibliothek, Schrift, Farbdesign oder fremdes Bild | Quellenliste am Fuss der Startseite, Schlüssel `home.credits` in `js/i18n.js`, **beide** Sprachen |
| Neue PDF in `unterlagen/` | `node scripts/unterlagen-verschluesseln.js`, Eintrag in der festen Liste in `api/zeugnis.js` |
| Neue Regel fürs Handy | Gehört in den gesammelten `@media(max-width:820px)`-Block am Ende von `css/style.css`, nicht neben den Baustein. Eine Medienabfrage erhöht die Gewichtung nicht, und weiter unten in der Datei greift sie sicher |
| Neuer Kommentar | Deutsch mit echten Umlauten statt `ue`/`ae`/`oe`; alle Dateien sind UTF-8 |
| Grössere Änderung an der Seite | Diese README |

Die Quellenliste ist keine Formsache: Die Seite wird von Betrieben **und** von
der Schule angeschaut, und fehlende Quellenangaben fallen in einer Bewertung
ins Gewicht.
