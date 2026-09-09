/* scripts/build.js
   Baut aus public/ den Stand, der ausgeliefert wird: dist/.
   Aufruf: npm run build

   Es gibt genau zwei Gründe für diesen Schritt, und beide sind messbar:

   1. Weniger Anfragen. Aus vierzehn Dateien im Kopf und am Seitenende
      werden vier. Jede einzelne kostet auf einer Mobilverbindung mehr
      Zeit als ihr Inhalt.
   2. Weniger Bytes. Kommentare und Einrückung sind für den Browser
      wertlos; in diesem Projekt sind sie ein gutes Drittel des Codes.

   Die Quelle bleibt public/. Dort wird gelesen, verstanden und geändert,
   die Kommentare sind Teil der Arbeit. dist/ ist ein Erzeugnis und liegt
   deshalb nicht im Repository.

   Bewusst nicht angetastet wird index.html: der Block mit den
   strukturierten Daten geht über seine Prüfsumme in die Sicherheitsregel
   ein (vercel.json). Ein umgestelltes Leerzeichen darin, und der Browser
   verwirft ihn stillschweigend. Ersetzt werden nur die Verweise auf die
   Skripte und Stylesheets, und das prüft der Build am Ende nach. */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const WURZEL = path.join(__dirname, '..');
const QUELLE = path.join(WURZEL, 'public');
const ZIEL = path.join(WURZEL, 'dist');

// Reihenfolge ist nicht beliebig: basis.js legt LR an, vscode.js hängt sich
// zuletzt an die Lauscher der übrigen Module. Siehe public/index.html.
const MODULE = ['basis', 'tabs', 'medien', 'statsfm', 'galerie', 'lesen',
                'geschuetzt', 'start', 'vscode'];
const STYLES = ['themes', 'style', 'vscode'];

function kopiere(von, nach) {
  fs.mkdirSync(nach, { recursive: true });
  for (const eintrag of fs.readdirSync(von, { withFileTypes: true })) {
    const a = path.join(von, eintrag.name), b = path.join(nach, eintrag.name);
    if (eintrag.isDirectory()) kopiere(a, b);
    else fs.copyFileSync(a, b);
  }
}

function lies(...teile) { return fs.readFileSync(path.join(...teile), 'utf8'); }

function verdichte(code, art) {
  const raus = esbuild.transformSync(code, {
    loader: art, minify: true, charset: 'utf8',
    legalComments: 'none', target: art === 'css' ? 'chrome90' : 'es2019'
  });
  if (raus.warnings.length) {
    for (const w of raus.warnings) console.warn('  Warnung:', w.text);
  }
  return raus.code;
}

function groesse(n) { return (n / 1024).toFixed(1).padStart(6) + ' KB'; }

// ─── Aufräumen und kopieren ───────────────────────────────────────────────
fs.rmSync(ZIEL, { recursive: true, force: true });
kopiere(QUELLE, ZIEL);

const bericht = [];
let vorher = 0, nachher = 0;

// ─── Javascript ───────────────────────────────────────────────────────────
// Die acht Module und vscode.js werden zu einer Datei. Sie sind alle
// Funktionen für sich und reden nur über LR miteinander, aneinanderhängen
// reicht deshalb aus.
const seite = MODULE.map(n => lies(QUELLE, 'js', n + '.js')).join('\n');
const seiteKlein = verdichte(seite, 'js');
fs.writeFileSync(path.join(ZIEL, 'js', 'seite.js'), seiteKlein);
for (const n of MODULE) fs.rmSync(path.join(ZIEL, 'js', n + '.js'));
bericht.push(['js/seite.js (' + MODULE.length + ' Dateien)', seite.length, seiteKlein.length]);
vorher += seite.length; nachher += seiteKlein.length;

// theme.js bleibt allein: es läuft im <head>, bevor die Seite zeichnet.
// i18n.de.js und i18n.en.js behalten ihren Namen, i18n.js setzt ihn beim
// Nachladen selbst zusammen.
for (const name of ['theme.js', 'i18n.js', 'i18n.de.js', 'i18n.en.js']) {
  const roh = lies(QUELLE, 'js', name);
  const klein = verdichte(roh, 'js');
  fs.writeFileSync(path.join(ZIEL, 'js', name), klein);
  bericht.push(['js/' + name, roh.length, klein.length]);
  vorher += roh.length; nachher += klein.length;
}

// ─── Stylesheets ──────────────────────────────────────────────────────────
const stil = STYLES.map(n => lies(QUELLE, 'css', n + '.css')).join('\n');
const stilKlein = verdichte(stil, 'css');
fs.writeFileSync(path.join(ZIEL, 'css', 'stil.css'), stilKlein);
for (const n of STYLES) fs.rmSync(path.join(ZIEL, 'css', n + '.css'));
bericht.push(['css/stil.css (' + STYLES.length + ' Dateien)', stil.length, stilKlein.length]);
vorher += stil.length; nachher += stilKlein.length;

// ─── index.html: nur die Verweise umbiegen ────────────────────────────────
let html = lies(QUELLE, 'index.html');
const vorlage = html;

const cssBlock = STYLES.map(n => `<link rel="stylesheet" href="css/${n}.css">`).join('\n');
if (!html.includes(cssBlock)) throw new Error('Die drei Stylesheet-Verweise stehen nicht wie erwartet in index.html');
html = html.replace(cssBlock, '<link rel="stylesheet" href="css/stil.css">');

const jsBlock = MODULE.slice(0, 8).map(n => `<script src="js/${n}.js"></script>`).join('\n');
if (!html.includes(jsBlock)) throw new Error('Die Modul-Verweise stehen nicht wie erwartet in index.html');
html = html.replace(jsBlock, '<script src="js/seite.js"></script>');
html = html.replace('<script src="js/vscode.js"></script>\n', '');

// Der Block mit den strukturierten Daten muss Zeichen für Zeichen derselbe
// bleiben, sonst passt seine Prüfsumme in vercel.json nicht mehr.
const ldjson = s => (s.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/) || [''])[0];
if (ldjson(html) !== ldjson(vorlage)) throw new Error('Die strukturierten Daten haben sich geändert — die Prüfsumme in vercel.json passt nicht mehr');

fs.writeFileSync(path.join(ZIEL, 'index.html'), html);
bericht.push(['index.html (unverdichtet)', vorlage.length, html.length]);
vorher += vorlage.length; nachher += html.length;

// ─── Bericht ──────────────────────────────────────────────────────────────
console.log('\n  Datei                              vorher    nachher   gespart');
console.log('  ' + '─'.repeat(64));
for (const [name, a, b] of bericht) {
  console.log('  ' + name.padEnd(34) + groesse(a) + '  ' + groesse(b) +
              (' ' + (a ? Math.round((1 - b / a) * 100) : 0) + '%').padStart(9));
}
console.log('  ' + '─'.repeat(64));
console.log('  ' + 'zusammen'.padEnd(34) + groesse(vorher) + '  ' + groesse(nachher) +
            (' ' + Math.round((1 - nachher / vorher) * 100) + '%').padStart(9));
console.log('\n  dist/ steht bereit.\n');
