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

    fs.readFile(datei, (leseFehler, inhalt) => {
      const kopf = { 'Cache-Control': 'no-store, must-revalidate' };
      if (leseFehler) {
        kopf['Content-Type'] = typen['.html'];
        res.writeHead(404, kopf);
        res.end(fs.existsSync(path.join(wurzel, '404.html'))
          ? fs.readFileSync(path.join(wurzel, '404.html'))
          : 'Nicht gefunden');
        return;
      }
      kopf['Content-Type'] = typen[path.extname(datei).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, kopf);
      res.end(inhalt);
    });
  });
}).listen(port, () => {
  console.log('Entwicklungsserver laeuft auf http://localhost:' + port);
  console.log('Zwischenspeicher ist abgeschaltet — neu laden genuegt, kein Strg+F5.');
});
