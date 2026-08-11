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
    zertifikate: [{ jahr, titel, anbieter }],
    sprachen:    [{ sprache, niveau }]
  }
};
```

Diese Daten gehen nur an eingeloggte Besucher raus. Sobald Einträge
vorhanden sind, erscheinen im geschützten Bereich automatisch die
Download-Buttons „⭳ CSV" (Noten) und „⭳ PDF" (Lebenslauf). Sind die
Listen leer, bleiben die Buttons ausgeblendet.

## 3. Login-Passwort ändern

```bash
node scripts/generate-password-hash.js NEUES_PASSWORT
```

Den Output in `api/login.js` bei `PASSWORD_HASH` einsetzen.

## 4. Favicon & Link-Vorschau

- `public/favicon.svg` — „L."-Monogramm im Farbschema der Seite.
- `public/og-image.png` — Bild für die Link-Vorschau (LinkedIn, WhatsApp,
  E-Mail-Clients), empfohlen 1200 × 630 px. Liegt die Datei nicht vor,
  zeigt die Vorschau nur Titel und Beschreibung.

## 5. Icons

Die Technologie-Icons kommen von [Devicon](https://devicon.dev). Neues
Icon einbinden:

```html
<i class="devicon-react-original colored"></i>
```

Die Namen der verfügbaren Icons stehen auf devicon.dev.
