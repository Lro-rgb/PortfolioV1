# Setup & Deployment

## Voraussetzungen

- [Node.js](https://nodejs.org/) (LTS-Version)
- Ein [Vercel](https://vercel.com)-Account (kostenlos)
- [Vercel CLI](https://vercel.com/docs/cli): `npm install -g vercel`

Das Projekt hat keine npm-Abhängigkeiten — `npm install` ist nicht nötig.

## 1. Login-Passwort festlegen

```bash
node scripts/generate-password-hash.js DEIN_PASSWORT
```

→ Output in `api/login.js` bei `PASSWORD_HASH` einfügen.

## 2. Token-Secret generieren

```bash
node scripts/generate-jwt-secret.js
```

→ Wird in Schritt 5 als Umgebungsvariable gebraucht.
Für die lokale Entwicklung: `.env.example` nach `.env` kopieren und den
Wert bei `JWT_SECRET` eintragen.

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

## 5. Umgebungsvariable setzen

```bash
vercel env add JWT_SECRET
```

→ Den in Schritt 2 generierten String einfügen. Danach erneut deployen,
damit die Variable greift:

```bash
vercel --prod
```

Ohne gesetztes `JWT_SECRET` fällt der Code auf einen Standardwert zurück —
in Produktion ist die Variable also Pflicht.

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

- Das Passwort wird serverseitig mit scrypt gesalzen gehasht und in
  konstanter Zeit verglichen (`crypto.timingSafeEqual`) — kein Klartext im Code.
- Bei falschem Passwort antwortet der Endpoint bewusst verzögert, um
  Brute-Force auszubremsen.
- Das Token ist HMAC-SHA256-signiert und läuft nach 4 Stunden ab.
- Es liegt nur im `sessionStorage` und verschwindet beim Schliessen des Tabs.
- `JWT_SECRET` gehört nicht ins Repository, sondern nur in die
  Vercel-Umgebungsvariablen (`.env` ist über `.gitignore` ausgeschlossen).
