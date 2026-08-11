# Setup & Deployment

## Voraussetzungen

- [Node.js](https://nodejs.org/) (LTS-Version)
- Ein [Vercel](https://vercel.com)-Account (kostenlos)
- [Vercel CLI](https://vercel.com/docs/cli): `npm install -g vercel`

Das Projekt hat keine npm-Abhängigkeiten — `npm install` ist nicht nötig.

## 1. Zugangsdaten erzeugen

Beide Werte sind Pflicht — ohne sie verweigert der geschützte Bereich
bewusst den Dienst (HTTP 503), statt auf einen im Code hinterlegten
Standardwert zurückzufallen.

```bash
node scripts/generate-password-hash.js DEIN_PASSWORT
node scripts/generate-jwt-secret.js
```

Beide Skripte geben eine fertige `NAME=wert`-Zeile aus.

## 2. Lokal hinterlegen

`.env.example` nach `.env` kopieren und die beiden Zeilen eintragen:

```
JWT_SECRET=…
APP_PASSWORD_HASH=…
```

`.env` ist über `.gitignore` ausgeschlossen und gehört **nie** ins
Repository.

## 3. Lokal testen

```bash
vercel dev
```

→ Läuft auf `http://localhost:3000`

## 4. Deployen

```bash
vercel
```

Beim ersten Deploy fragt Vercel nach Projekteinstellungen —
die Standardwerte passen.

## 5. Umgebungsvariablen in Vercel setzen

```bash
vercel env add JWT_SECRET
vercel env add APP_PASSWORD_HASH
```

→ Jeweils den in Schritt 1 erzeugten Wert einfügen (nur den Teil nach dem
Gleichheitszeichen). Danach erneut deployen, damit die Variablen greifen:

```bash
vercel --prod
```

**Ohne diese beiden Variablen antwortet der geschützte Bereich mit 503.**
Das ist Absicht: Ein Rückfall auf einen im Repository stehenden Standardwert
wäre kein Schutz, weil ihn jeder nachlesen und damit selbst ein gültiges
Token erzeugen könnte.

Zum Prüfen nach dem Deploy:

```bash
curl -i https://DEINE-DOMAIN/api/protected
```

→ Erwartet wird `401` (kein Token). Kommt `503`, fehlt eine der Variablen.

## Projektstruktur

```
luis-rosado-portfolio/
├── public/              ← Frontend (statische Dateien)
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── api/                 ← Backend (Vercel Serverless Functions)
│   ├── login.js         ← Login-Endpoint
│   └── protected.js     ← Geschützte Daten (Noten, Lebenslauf)
├── lib/auth.js          ← Hashing & Token-Signierung
├── scripts/             ← Hilfsskripte (Passwort-Hash, Token-Secret)
├── docs/                ← Dokumentation
├── vercel.json          ← Routing-Konfiguration
└── package.json
```

Mehr zu den Inhalten: siehe [`CONTENT-GUIDE.md`](CONTENT-GUIDE.md).

## Sicherheit

- **Kein Geheimnis im Repository.** Weder Passwort-Hash noch Token-Schlüssel
  stehen im Quellcode; beide kommen ausschliesslich aus Umgebungsvariablen.
- **Kein Rückfallwert.** Fehlt eine Variable oder ist `JWT_SECRET` kürzer als
  32 Zeichen, wird der Dienst verweigert statt mit einem schwachen Wert
  weiterzuarbeiten.
- Das Passwort wird mit scrypt gesalzen gehasht und in konstanter Zeit
  verglichen (`crypto.timingSafeEqual`).
- Bei falschem Passwort antwortet der Endpunkt verzögert, um Brute-Force
  auszubremsen.
- Das Token ist HMAC-SHA256-signiert und läuft nach 4 Stunden ab. Es liegt
  nur im `sessionStorage` und verschwindet beim Schliessen des Tabs.
- Die Endpunkte senden `Cache-Control: no-store`, damit geschützte Inhalte
  nicht in Zwischenspeichern liegen bleiben.
- Kein Wildcard-CORS: Frontend und API liegen auf derselben Herkunft, fremde
  Seiten haben keinen Grund, diese Endpunkte anzusprechen.
