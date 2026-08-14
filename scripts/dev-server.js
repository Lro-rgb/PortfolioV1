/* Kleiner Entwicklungsserver fuer public/ — ohne Abhaengigkeiten, wie der
   Rest des Projekts.

   Warum nicht "python -m http.server": der schickt nur ein Last-Modified
   und ueberlaesst dem Browser den Rest. Der rechnet sich daraus selbst
   eine Haltbarkeit aus und liefert geaenderte Dateien minutenlang aus dem
   Zwischenspeicher weiter — man aendert etwas, laedt neu und sieht das
   Alte. Dieser Server sagt ausdruecklich "no-store", damit jede Anfrage
   frisch beantwortet wird.

   In Produktion gilt das nicht: dort steht die Regel in vercel.json.

   Aufruf:  node scripts/dev-server.js [Port]
*/

const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.argv[2]) || 4175;
const wurzel = path.join(__dirname, '..', 'public');

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

   Ohne das faellt eine zu enge Content-Security-Policy erst nach dem
   Veroeffentlichen auf — dann, wenn plotzlich die Technologie-Logos fehlen
   oder der PDF-Export nichts mehr tut. Hier gilt dieselbe Regel wie spaeter
   in Produktion, und ein Fehler zeigt sich beim Entwickeln.

   Bewusst schlicht gehalten: nur die Umschreibungen, die in vercel.json
   tatsaechlich vorkommen (/(.*) und /(.*)\.(a|b|c)). Kommt eine kompliziertere
   dazu, greift sie lokal nicht — die Datei bleibt fuer Vercel massgeblich. */
const kopfRegeln = ladeKopfRegeln();

function ladeKopfRegeln() {
  try {
    const roh = fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8');
    return (JSON.parse(roh).headers || []).map(regel => ({
      test: new RegExp('^' + regel.source + '$'),
      // Die "//"-Eintraege sind Kommentare, keine Kopfzeilen.
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
  // Lokal laeuft nichts ueber HTTPS — die beiden Zeilen wuerden das Testen
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
       springen: Der Abspieler haelt die Aufnahme dann fuer nicht spulbar
       und bleibt bei Sekunde null stehen. Statische Hoster koennen das von
       sich aus, der Entwicklungsserver hier musste es lernen, damit sich
       eine Aufnahme lokal genauso bedienen laesst wie spaeter online. */
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
         und ueberschreibt sie: lokal soll nie etwas aus dem Zwischenspeicher
         kommen, sonst sieht man Aenderungen nicht. */
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
