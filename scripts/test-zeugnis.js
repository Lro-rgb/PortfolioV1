// scripts/test-zeugnis.js
// Prüft /api/zeugnis ohne laufenden Server: Wer kein gültiges Token hat,
// darf keine Datei bekommen, und aus der Modulnummer darf sich kein Pfad
// bauen lassen. Aufruf:  node scripts/test-zeugnis.js
//
// Ohne Netz und ohne Fremdbibliothek: Es wird ein Token unterschrieben und
// der Handler direkt aufgerufen.

process.env.JWT_SECRET = 'nur-fuer-diesen-test-mindestens-32-zeichen-lang';

/* Der Schlüssel der verschlüsselten Nachweise kommt aus .env; ohne ihn
   könnte der Test nicht prüfen, ob wirklich eine PDF herauskommt. */
try {
  const fs0 = require('fs'), p0 = require('path');
  for (const z of fs0.readFileSync(p0.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
    const t = z.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i > 0 && !(t.slice(0, i).trim() in process.env)) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
} catch { /* keine .env */ }

if (!/^[0-9a-f]{64}$/i.test(process.env.UNTERLAGEN_KEY || '')) {
  console.error('UNTERLAGEN_KEY fehlt, erst "node scripts/unterlagen-verschluesseln.js" ausfuehren.');
  process.exit(1);
}

const assert = require('assert');
const os = require('os');

const { signToken } = require('../lib/auth.js');
const handler = require('../api/zeugnis.js');

const gueltig = signToken({ role: 'viewer' }, process.env.JWT_SECRET, 60);
const abgelaufen = signToken({ role: 'viewer' }, process.env.JWT_SECRET, -60);
const fremd = signToken({ role: 'viewer' }, 'ein-ganz-anderer-schluessel-mit-32-zeichen', 60);

function ruf(kopfzeilen, query, methode) {
  const antwort = { code: 0, koerper: null, kopf: {} };
  const res = {
    setHeader(k, v) { antwort.kopf[k.toLowerCase()] = v; },
    status(c) { antwort.code = c; return res; },
    json(o) { antwort.koerper = o; return res; },
    send(b) { antwort.koerper = b; return res; }
  };
  handler({ method: methode || 'GET', headers: kopfzeilen, query }, res);
  return antwort;
}

const mitToken = t => ({ authorization: 'Bearer ' + t });

// ── Abgewiesen wird, wer nicht darf ──
assert.strictEqual(ruf({}, { modul: '187' }).code, 401, 'ohne Token muss 401 kommen');
assert.strictEqual(ruf({ authorization: 'Basic abc' }, { modul: '187' }).code, 401, 'falsches Schema muss 401 geben');
assert.strictEqual(ruf(mitToken(abgelaufen), { modul: '187' }).code, 401, 'abgelaufenes Token muss 401 geben');
assert.strictEqual(ruf(mitToken(fremd), { modul: '187' }).code, 401, 'fremd unterschriebenes Token muss 401 geben');
assert.strictEqual(ruf(mitToken(gueltig), { modul: '187' }, 'POST').code, 405, 'nur GET ist erlaubt');

// ── Aus der Modulnummer darf kein Pfad werden ──
for (const boese of ['../lib/auth.js', '../../.env', '187/../../lib/auth.js', '', 'sonstwas']) {
  const a = ruf(mitToken(gueltig), { modul: boese });
  assert.strictEqual(a.code, 404, 'unerlaubte Modulangabe muss 404 geben: ' + JSON.stringify(boese));
  assert.ok(!Buffer.isBuffer(a.koerper), 'es darf keine Datei herauskommen fuer: ' + JSON.stringify(boese));
}

/* Aus einem fremden Arbeitsverzeichnis heraus prüfen. Genau daran ist es
   einmal gescheitert: der Pfad zur PDF wurde aus process.cwd() gebaut, und
   der Entwicklungsserver startet eine Ebene höher, mit gültigem Token kam
   trotzdem "nicht gefunden". Von hier aus fällt das auf. */
process.chdir(os.tmpdir());

// ── Mit gültigem Token kommt die richtige Datei ──
/* Neben den Modulnummern auch der Lebenslauf: er kommt seit dem Wegfall
   von jsPDF über denselben Endpunkt. Die Arbeitsbestätigung steht hier
   nicht, solange die Datei noch fehlt. */
for (const modul of ['187', '106', '294', '210', '335', 'cv']) {
  const a = ruf(mitToken(gueltig), { modul });
  assert.strictEqual(a.code, 200, 'Modul ' + modul + ' muss ausgeliefert werden');
  assert.ok(Buffer.isBuffer(a.koerper), 'Modul ' + modul + ' muss eine Datei liefern');
  assert.strictEqual(a.koerper.subarray(0, 5).toString(), '%PDF-', 'Modul ' + modul + ' ist keine PDF-Datei');
  assert.strictEqual(a.kopf['content-type'], 'application/pdf');
  assert.ok(/no-store/.test(a.kopf['cache-control']), 'geschuetzte Datei darf nicht zwischengespeichert werden');
}

// ── Mit falschem Schlüssel darf nichts herauskommen ──
const echterSchluessel = process.env.UNTERLAGEN_KEY;
process.env.UNTERLAGEN_KEY = 'a'.repeat(64);
const mitFalschem = ruf(mitToken(gueltig), { modul: '187' });
assert.strictEqual(mitFalschem.code, 503, 'falscher Schluessel darf keine Datei liefern');
assert.ok(!Buffer.isBuffer(mitFalschem.koerper), 'bei falschem Schluessel darf keine Datei herauskommen');
process.env.UNTERLAGEN_KEY = echterSchluessel;

console.log('OK: Zugriffsschutz, Verschluesselung, fuenf Kompetenznachweise und der Lebenslauf in Ordnung.');
