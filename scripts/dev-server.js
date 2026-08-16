/* Kleiner Entwicklungsserver für public/ — ohne Abhängigkeiten, wie der
   Rest des Projekts.

   Warum nicht "python -m http.server": der schickt nur ein Last-Modified
   und überlässt dem Browser den Rest. Der rechnet sich daraus selbst
   eine Haltbarkeit aus und liefert geänderte Dateien minutenlang aus dem
   Zwischenspeicher weiter — man ändert etwas, lädt neu und sieht das
   Alte. Dieser Server sagt ausdrücklich "no-store", damit jede Anfrage
   frisch beantwortet wird.

   In Produktion gilt das nicht: dort steht die Regel in vercel.json.

   Aufruf:  node scripts/dev-server.js [Port]
*/

const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.argv[2]) || 4175;
const wurzel = path.join(__dirname, '..', 'public');
const projekt = path.join(__dirname, '..');

/* .env einlesen, wie es "vercel dev" später auch tut. Ohne JWT_SECRET und
   APP_PASSWORD_HASH antwortet der geschützte Bereich mit 503 — das ist so
   gewollt, es soll hier nur nicht daran scheitern, dass die Datei niemand
   liest. */
function ladeEnv() {
  try {
    for (const zeile of fs.readFileSync(path.join(projekt, '.env'), 'utf8').split('\n')) {
      const t = zeile.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i < 1) continue;
      const name = t.slice(0, i).trim();
      if (!(name in process.env)) process.env[name] = t.slice(i + 1).trim();
    }
  } catch { /* keine .env: dann eben ohne */ }
}
ladeEnv();

/* Die Serverless Functions aus api/ auch hier bedienen.
   Vorher gab es sie lokal schlicht nicht: jede Anfrage an /api/... lief in
   die 404 für statische Dateien. Anmeldung, Noten und die
   Kompetenznachweise waren damit nur nach dem Veröffentlichen zu testen —
   also genau die Stellen, an denen ein Fehler am meisten kostet. */
function apiBedienen(req, res, pfad) {
  const name = pfad.replace(/^\/api\//, '').replace(/\.js$/, '');
  const datei = path.join(projekt, 'api', name + '.js');
  if (!/^[a-z0-9-]+$/i.test(name) || !fs.existsSync(datei)) {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Keine solche Funktion.' }));
    return;
  }

  // Bei jeder Anfrage neu laden, damit Änderungen ohne Neustart greifen.
  delete require.cache[require.resolve(datei)];
  const handler = require(datei);

  const koerper = [];
  req.on('data', s => koerper.push(s));
  req.on('end', async () => {
    const roh = Buffer.concat(koerper).toString('utf8');
    req.query = Object.fromEntries(new URL(req.url, 'http://localhost').searchParams);
    try { req.body = roh ? JSON.parse(roh) : {}; } catch { req.body = {}; }

    /* Vercel gibt den Funktionen ein paar Bequemlichkeiten mit, die das
       nackte http-Modul nicht hat. Genau diese drei benutzen die Funktionen
       hier — mehr nachzubauen wäre geraten statt gebraucht. */
    res.status = code => { res.statusCode = code; return res; };
    res.json = wert => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(wert));
      return res;
    };
    res.send = wert => { res.end(Buffer.isBuffer(wert) ? wert : String(wert)); return res; };

    try {
      await handler(req, res);
    } catch (e) {
      console.error('Fehler in /api/' + name + ':', e);
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Fehler in der Funktion.' }));
    }
  });
}

const typen = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.m4a': 'audio/mp4',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8'
};

/* Die Sicherheitskopfzeilen aus vercel.json auch lokal mitschicken.

   Ohne das fällt eine zu enge Content-Security-Policy erst nach dem
   Veröffentlichen auf — dann, wenn plotzlich die Technologie-Logos fehlen
   oder der PDF-Export nichts mehr tut. Hier gilt dieselbe Regel wie später
   in Produktion, und ein Fehler zeigt sich beim Entwickeln.

   Bewusst schlicht gehalten: nur die Umschreibungen, die in vercel.json
   tatsächlich vorkommen (/(.*) und /(.*)\.(a|b|c)). Kommt eine kompliziertere
   dazu, greift sie lokal nicht — die Datei bleibt für Vercel massgeblich. */
const kopfRegeln = ladeKopfRegeln();

function ladeKopfRegeln() {
  try {
    const roh = fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8');
    return (JSON.parse(roh).headers || []).map(regel => ({
      test: new RegExp('^' + regel.source + '$'),
      // Die "//"-Einträge sind Kommentare, keine Kopfzeilen.
      headers: (regel.headers || []).filter(h => h.key)
    }));
  } catch (e) {
    console.warn('vercel.json nicht lesbar, Kopfzeilen werden nicht gesetzt:', e.message);
    return [];
  }
}

function kopfzeilenFuer(pfad) {
  const raus = {};
  for (const regel of kopfRegeln) {
    if (!regel.test.test(pfad)) continue;
    for (const h of regel.headers) raus[h.key] = h.value;
  }
  // Lokal läuft nichts über HTTPS — die beiden Zeilen würden das Testen
  // nur behindern.
  delete raus['Strict-Transport-Security'];
  if (raus['Content-Security-Policy']) {
    raus['Content-Security-Policy'] = raus['Content-Security-Policy']
      .replace('; upgrade-insecure-requests', '');
  }
  return raus;
}

http.createServer((req, res) => {
  let pfad;
  try {
    pfad = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('Ungueltige Adresse');
    return;
  }

  if (pfad.startsWith('/api/')) {
    apiBedienen(req, res, pfad);
    return;
  }

  // Ausbrechen aus public/ verhindern (..%2F und Konsorten).
  const ziel = path.join(wurzel, path.normalize(pfad));
  if (!ziel.startsWith(wurzel)) {
    res.writeHead(403).end('Verboten');
    return;
  }

  fs.stat(ziel, (fehler, info) => {
    let datei = ziel;

    if (!fehler && info.isDirectory()) {
      // /erste-website  ->  /erste-website/  , damit relative Verweise darin stimmen
      if (!pfad.endsWith('/')) {
        res.writeHead(301, { Location: pfad + '/' }).end();
        return;
      }
      datei = path.join(ziel, 'index.html');
    } else if (fehler && !path.extname(ziel)) {
      // Adressen ohne Endung wie /erste-website/kontakt (cleanUrls in vercel.json)
      datei = ziel + '.html';
    }

    /* Teilanfragen (Range). Ohne sie schickt der Server immer die ganze
       Datei mit Status 200, und der Browser kann in einem Video nicht
       springen: Der Abspieler hält die Aufnahme dann für nicht spulbar
       und bleibt bei Sekunde null stehen. Statische Hoster können das von
       sich aus, der Entwicklungsserver hier musste es lernen, damit sich
       eine Aufnahme lokal genauso bedienen lässt wie später online. */
    const bereich = req.headers.range;
    if (!fehler && info.isFile() && bereich) {
      const treffer = /^bytes=(\d*)-(\d*)$/.exec(bereich.trim());
      if (treffer) {
        const groesse = info.size;
        const von = treffer[1] ? Number(treffer[1]) : 0;
        const bis = treffer[2] ? Math.min(Number(treffer[2]), groesse - 1) : groesse - 1;
        if (von > bis || von >= groesse) {
          res.writeHead(416, { 'Content-Range': 'bytes */' + groesse }).end();
          return;
        }
        res.writeHead(206, Object.assign(kopfzeilenFuer(pfad), {
          'Cache-Control': 'no-store, must-revalidate',
          'Content-Type': typen[path.extname(datei).toLowerCase()] || 'application/octet-stream',
          'Content-Range': 'bytes ' + von + '-' + bis + '/' + groesse,
          'Content-Length': bis - von + 1,
          'Accept-Ranges': 'bytes'
        }));
        fs.createReadStream(datei, { start: von, end: bis }).pipe(res);
        return;
      }
    }

    fs.readFile(datei, (leseFehler, inhalt) => {
      /* Cache-Control kommt hier absichtlich nach den Regeln aus vercel.json
         und überschreibt sie: lokal soll nie etwas aus dem Zwischenspeicher
         kommen, sonst sieht man Änderungen nicht. */
      const kopf = Object.assign(kopfzeilenFuer(pfad), { 'Cache-Control': 'no-store, must-revalidate' });
      if (leseFehler) {
        kopf['Content-Type'] = typen['.html'];
        res.writeHead(404, kopf);
        res.end(fs.existsSync(path.join(wurzel, '404.html'))
          ? fs.readFileSync(path.join(wurzel, '404.html'))
          : 'Nicht gefunden');
        return;
      }
      kopf['Content-Type'] = typen[path.extname(datei).toLowerCase()] || 'application/octet-stream';
      kopf['Accept-Ranges'] = 'bytes';
      res.writeHead(200, kopf);
      res.end(inhalt);
    });
  });
}).listen(port, () => {
  console.log('Entwicklungsserver laeuft auf http://localhost:' + port);
  console.log('Zwischenspeicher ist abgeschaltet — neu laden genuegt, kein Strg+F5.');
});
