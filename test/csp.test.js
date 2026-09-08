// test/csp.test.js
// Die Sicherheitsregel in vercel.json erlaubt genau einen Block im
// Dokument: die strukturierten Daten (application/ld+json), und zwar über
// seine Prüfsumme. Aendert jemand dort ein Zeichen, passt die Prüfsumme
// nicht mehr und der Browser wirft den Block weg — ohne dass die Seite
// sichtbar kaputt geht. Genau darum steht das hier als Test.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const wurzel = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(wurzel, 'public/index.html'), 'utf8');
const vercel = JSON.parse(fs.readFileSync(path.join(wurzel, 'vercel.json'), 'utf8'));

function csp() {
  for (const eintrag of vercel.headers) {
    const treffer = (eintrag.headers || []).find(h => h.key === 'Content-Security-Policy');
    if (treffer) return treffer.value;
  }
  return '';
}

test('script-src erlaubt kein unsafe-inline', () => {
  const regel = csp().split(';').find(t => t.trim().startsWith('script-src'));
  assert.ok(regel, 'script-src fehlt in der CSP');
  assert.ok(!regel.includes("'unsafe-inline'"), 'script-src erlaubt wieder unsafe-inline');
});

test('Pruefsumme der strukturierten Daten stimmt mit der CSP ueberein', () => {
  const treffer = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(treffer, 'Block mit strukturierten Daten nicht gefunden');
  const summe = 'sha256-' + crypto.createHash('sha256')
    .update(treffer[1], 'utf8').digest('base64');
  assert.ok(csp().includes(summe),
    'CSP kennt diese Pruefsumme nicht. Neu eintragen in vercel.json: ' + summe);
});

test('im Dokument stehen keine Skripte und keine on...-Attribute', () => {
  // Beides wäre von script-src ohne 'unsafe-inline' blockiert, das
  // Bedienelement bliebe also stumm.
  const ohneLdJson = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  const skripte = ohneLdJson.match(/<script(?![^>]*\ssrc=)[^>]*>/g) || [];
  assert.deepStrictEqual(skripte, [], 'Skript ohne src im Dokument');

  const handler = html.match(/\son[a-z]+\s*=\s*"/gi) || [];
  assert.deepStrictEqual(handler, [], 'on...-Attribut im Dokument');
});
