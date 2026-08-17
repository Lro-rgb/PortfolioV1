# Content-Guide: wo welche Inhalte stehen

Kurze Übersicht, an welcher Stelle die Texte und Daten der Seite gepflegt
werden.

## Übersicht

| Was | Datei | Bereich |
|---|---|---|
| Name, Rolle, Intro-Text | `public/index.html` | `panel-home` |
| Skills-Liste | `public/index.html` | `panel-skills` |
| Tech-Stack-Kacheln | `public/index.html` | `panel-techstack` |
| Projekte | `public/index.html` | `panel-projekte` |
| Hobbys / Interessen | `public/index.html` | `panel-interessen` |
| Kontakt + Impressum | `public/index.html` | `panel-kontakt` |
| Gestaltung & Technik | `public/index.html` | `panel-readme` |
| Videos, Screenshots, Downloads | `public/js/app.js` | `MEDIA` |
| Bilder der Interessen-Seite | `public/js/app.js` | `INTERESSEN` |
| Hörstatistiken (Profil, Zeitraum) | `public/index.html` / `public/js/app.js` | `#statsfm[data-user]`, `SFM_ZEITRAUM` |
| **Noten (geschützt)** | `api/protected.js` | `DATA.noten` |
| **Lebenslauf (geschützt)** | `api/protected.js` | `DATA.lebenslauf` |
| **PDF (geschützt)** | `unterlagen/` + `api/zeugnis.js` | `DATEIEN` |
| Login-Passwort | Umgebung | `APP_PASSWORD_HASH` |

## 1. Öffentliche Inhalte (`public/index.html`)

Jeder Tab in der Oberfläche entspricht einem `.editor-panel` im HTML:

- **`luis.json`** → Startseite: Name, Rolle, Intro-Text
- **`skills.py`** → eine Zeile je Technologie mit dem Projekt dahinter
- **`techstack.ts`** → Kacheln mit verwendeten Technologien
- **`projekte.html`** → Projekt-Karten
- **`interessen.json`** → Interessen mit Bilderstrecken und Hörstatistiken
- **`kontakt.sql`** → Kontaktdaten + Impressum

Die Panels sind im HTML mit Kommentaren abgetrennt (z. B. `<!-- ── SKILLS ── -->`).

## 2. Geschützter Bereich (`api/protected.js`)

Noten und Lebenslauf stehen **nicht** im Frontend, sondern serverseitig in
`api/protected.js` unter `DATA`:

```js
const DATA = {
  noten: [
    { fach: "üK-Modul 294, Frontend …", note: 5.5, semester: "April 2026",
      datei: "294", art: "uek" }
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

`nebenjobs` deckt bezahlte Nebenjobs **und** Freiwilligenarbeit ab, die
IMS-Checkliste verlangt beides ausdrücklich. `nebenjobs` und `zertifikate`
erscheinen nur, wenn Einträge vorhanden sind; eine Überschrift mit „noch
keine Daten" darunter sagt einem Betrieb nur, was fehlt.

Bei den Noten steuern zwei Felder die Anzeige: `art` entscheidet, in
welcher der beiden Klappgruppen die Karte landet (`uek` für die
Kompetenznachweise, `zeugnis` für Schulzeugnisse), und `datei` ist der
Schlüssel, unter dem `/api/zeugnis` die zugehörige PDF herausgibt. Ohne
`datei` zeigt die Karte einfach keine Schaltflächen.

Diese Daten gehen nur an eingeloggte Besucher raus. Der Knopf „⭳ CSV"
über den Noten erscheint, sobald Noten eingetragen sind. Der Knopf
„⭳ PDF" über dem Lebenslauf lädt die echte Datei aus `unterlagen/` und ist
unabhängig von diesen Angaben da.

## 3. Login-Passwort ändern

```bash
node scripts/generate-password-hash.js NEUES_PASSWORT
```

Die ausgegebene Zeile ersetzt `APP_PASSWORD_HASH` in `.env` (lokal). Für
die veröffentlichte Fassung zusätzlich `vercel env add APP_PASSWORD_HASH`
und neu deployen. Im Code steht das Passwort nirgends, das Repository ist
öffentlich.

## 4. Videos, Screenshots und Downloads

Alle Medien laufen über zwei Objekte am Anfang des Medien-Abschnitts in
`public/js/app.js`. Was dort nicht eingetragen ist, wird auch nicht
angezeigt. Es gibt also keine leeren Player und keine toten Verweise.

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

Die Schlüssel (`wallpaper`, `arch`, `portfolio`, `modding`,
`urlshortener`, `askel`, `rezeptbuch`, `kobui`, `webshop`,
`erstewebsite`) entsprechen dem `data-media`-Attribut der jeweiligen
Projektkarte im HTML.

Bilder vor dem Einchecken komprimieren. JPEG bei Qualität 80 reicht für
die Vollansicht und spart gegenüber der Kameraeinstellung gut ein Drittel.

Screenshots lassen sich anklicken und öffnen sich in einer Vollansicht mit
Pfeiltasten-Navigation. Der `alt`-Text ist dabei Pflicht, er ist zugleich
die Bildunterschrift.

## 5. Geschützte PDF (`unterlagen/`)

Lebenslauf, Arbeitsbestätigung und die üK-Kompetenznachweise liegen als
PDF in `unterlagen/`, nicht unter `public/`, sonst lägen sie ohne jede
Prüfung im Netz. Eine neue Datei ablegen, in `api/zeugnis.js` unter
`DATEIEN` eintragen und verschlüsseln:

```bash
node scripts/unterlagen-verschluesseln.js
```

Eingecheckt wird nur `unterlagen-verschluesselt/`. Einzelheiten stehen in
der README unter „Geschützter Bereich".

## 6. Favicon & Link-Vorschau

- `public/favicon.svg`: „L."-Monogramm im Farbschema der Seite.
- `public/og-image.png`: Bild für die Link-Vorschau (LinkedIn, WhatsApp,
  E-Mail-Clients), empfohlen 1200 × 630 px. Liegt die Datei nicht vor,
  zeigt die Vorschau nur Titel und Beschreibung.

## 7. Icons

Die Technologie-Icons kommen von [Devicon](https://devicon.dev). Neues
Icon einbinden:

```html
<i class="devicon-react-original colored"></i>
```

Die Namen der verfügbaren Icons stehen auf devicon.dev.

## 8. Bilder der Interessen-Seite (`public/js/app.js`)

Jedes Thema auf `interessen.json` hat eine Bilderstrecke. Die Listen stehen
in `INTERESSEN`:

```js
const INTERESSEN = {
  gaming:   [{ src: 'media/gaming-elden-ring.jpg', alt: 'Elden Ring, Key-Art' }],
  musik:    [],
  lesen:    [],
  hardware: []
};
```

Ablauf für ein neues Bild: Datei nach `public/media/` legen, eine Zeile
eintragen. Der `alt`-Text ist zugleich die Bildunterschrift in der
Vollansicht, also beschreiben, was zu sehen ist. Themen ohne Einträge zeigen
leere Rahmen mit dem Hinweis „Bild folgt".

Bilder, die nicht von dir stammen, gehören in den Bildnachweis am Ende der
Interessen-Seite und ins Impressum auf `kontakt.sql`.

## 9. Hörstatistiken (stats.fm)

Das Profil steht als `data-user` am Element `#statsfm` im HTML, der Zeitraum
in `SFM_ZEITRAUM` in `app.js` (`weeks`, `months` oder `lifetime`). Antwortet
stats.fm nicht, bleibt der Verweis auf das Profil stehen, der im HTML
hinterlegt ist. Dort muss die Adresse also ebenfalls stimmen.
