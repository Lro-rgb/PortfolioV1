// scripts/test-zeugnis.js
// Prueft /api/zeugnis ohne laufenden Server: Wer kein gueltiges Token hat,
// darf keine Datei bekommen, und aus der Modulnummer darf sich kein Pfad
// bauen lassen. Aufruf:  node scripts/test-zeugnis.js
//
// Ohne Netz und ohne Fremdbibliothek — es wird ein Token unterschrieben und
// der Handler direkt aufgerufen.

process.env.JWT_SECRET = 'nur-fuer-diesen-test-mindestens-32-zeichen-lang';

const assert = require('assert');
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

// ── Mit gueltigem Token kommt die richtige Datei ──
for (const modul of ['187', '106', '294', '210', '335']) {
  const a = ruf(mitToken(gueltig), { modul });
  assert.strictEqual(a.code, 200, 'Modul ' + modul + ' muss ausgeliefert werden');
  assert.ok(Buffer.isBuffer(a.koerper), 'Modul ' + modul + ' muss eine Datei liefern');
  assert.strictEqual(a.koerper.subarray(0, 5).toString(), '%PDF-', 'Modul ' + modul + ' ist keine PDF-Datei');
  assert.strictEqual(a.kopf['content-type'], 'application/pdf');
  assert.ok(/no-store/.test(a.kopf['cache-control']), 'geschuetzte Datei darf nicht zwischengespeichert werden');
}

console.log('OK — Zugriffsschutz und alle fuenf Kompetenznachweise in Ordnung.');
