# Content-Guide — wo welche Inhalte stehen

Kurze Übersicht, an welcher Stelle die Texte und Daten der Seite gepflegt
werden.

## Übersicht

| Was | Datei | Bereich |
|---|---|---|
| Name, Rolle, Intro-Text | `public/index.html` | `panel-home` |
| Skills-Tabellen | `public/index.html` | `panel-skills` |
| Tech-Stack-Kacheln | `public/index.html` | `panel-techstack` |
| Projekte | `public/index.html` | `panel-projekte` |
| Hobbys / Interessen | `public/index.html` | `panel-interessen` |
| Kontakt + Impressum | `public/index.html` | `panel-kontakt` |
| Gestaltung & Technik | `public/index.html` | `panel-readme` |
| Videos, Screenshots, Downloads | `public/js/app.js` | `MEDIA` |
| Audio-Kurzvorstellung | `public/js/app.js` | `AUDIO` |
| **Noten (geschützt)** | `api/protected.js` | `DATA.noten` |
| **Lebenslauf (geschützt)** | `api/protected.js` | `DATA.lebenslauf` |
| Login-Passwort | `api/login.js` | `PASSWORD_HASH` |

## 1. Öffentliche Inhalte (`public/index.html`)

Jeder Tab in der Oberfläche entspricht einem `.editor-panel` im HTML:

- **`luis.json`** → Startseite: Name, Rolle, Intro-Text
- **`skills.py`** → Tabellen mit technischen Fähigkeiten
- **`techstack.ts`** → Kacheln mit verwendeten Technologien
- **`projekte.html`** → Projekt-Karten
- **`interessen.json`** → Interessen-Kacheln
- **`kontakt.sql`** → Kontaktdaten + Impressum

Die Panels sind im HTML mit Kommentaren abgetrennt (z. B. `<!-- ── SKILLS ── -->`).

## 2. Geschützter Bereich (`api/protected.js`)

Noten und Lebenslauf stehen **nicht** im Frontend, sondern serverseitig in
`api/protected.js` unter `DATA`:

```js
const DATA = {
  noten: [
    { fach: "Applikationsentwicklung", note: 5.5, semester: "HS 2025" }
  ],
  lebenslauf: {
    ausbildung:  [{ zeitraum, titel, ort, notiz }],
    erfahrung:   [{ zeitraum, titel, ort, notiz }],
    nebenjobs:   [{ zeitraum, titel, ort, notiz }],
    zertifikate: [{ jahr, titel, anbieter }],
    sprachen:    [{ sprache, niveau }]
  }
};
```

`nebenjobs` deckt bezahlte Nebenjobs **und** Freiwilligenarbeit ab — die
IMS-Checkliste verlangt beides ausdrücklich. Der Abschnitt erscheint auf
der Seite und im PDF nur, wenn Einträge vorhanden sind.

Diese Daten gehen nur an eingeloggte Besucher raus. Sobald Einträge
vorhanden sind, erscheinen im geschützten Bereich automatisch die
Download-Buttons „⭳ CSV" (Noten) und „⭳ PDF" (Lebenslauf). Sind die
Listen leer, bleiben die Buttons ausgeblendet.

## 3. Login-Passwort ändern

```bash
node scripts/generate-password-hash.js NEUES_PASSWORT
```

Den Output in `api/login.js` bei `PASSWORD_HASH` einsetzen.

## 4. Videos, Screenshots und Downloads

Alle Medien laufen über zwei Objekte am Anfang des Medien-Abschnitts in
`public/js/app.js`. Was dort nicht eingetragen ist, wird auch nicht
angezeigt — es gibt also keine leeren Player und keine toten Verweise.

Ablauf: Datei nach `public/media/` legen, hier eintragen, fertig.

```js
const MEDIA = {
  askel: {
    video: { src: 'media/askel.mp4', poster: 'media/askel-poster.jpg',
             titel: 'Askel zeichnet eine Route auf', dauer: '1:10' },
    shots: [ { src: 'media/askel-1.jpg', alt: 'Startbildschirm mit Routenliste' } ],
    downloads: [ { href: 'media/askel-doku.pdf',
                   label: 'Projektdokumentation', meta: 'PDF · 1,2 MB' } ]
  }
};
```

Die Schlüssel (`askel`, `kobui`, `website`, `arch`, `modding`) entsprechen
dem `data-media`-Attribut der jeweiligen Projektkarte im HTML.

Screenshots lassen sich anklicken und öffnen sich in einer Vollansicht mit
Pfeiltasten-Navigation. Der `alt`-Text ist dabei Pflicht — er ist zugleich
die Bildunterschrift.

Für die Audio-Kurzvorstellung auf der Startseite:

```js
const AUDIO = {
  intro: { src: 'media/vorstellung.m4a', titel: 'Kurzvorstellung',
           dauer: '0:45', text: 'Worum es im Audio geht.' }
};
```

## 5. Favicon & Link-Vorschau

- `public/favicon.svg` — „L."-Monogramm im Farbschema der Seite.
- `public/og-image.png` — Bild für die Link-Vorschau (LinkedIn, WhatsApp,
  E-Mail-Clients), empfohlen 1200 × 630 px. Liegt die Datei nicht vor,
  zeigt die Vorschau nur Titel und Beschreibung.

## 6. Icons

Die Technologie-Icons kommen von [Devicon](https://devicon.dev). Neues
Icon einbinden:

```html
<i class="devicon-react-original colored"></i>
```

Die Namen der verfügbaren Icons stehen auf devicon.dev.
