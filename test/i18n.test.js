// test/i18n.test.js
// Die beiden Wörterbücher müssen dieselben Schlüssel führen. Fehlt einer,
// fällt die Seite für diesen Text still auf Deutsch zurück — sichtbar wird
// das erst, wenn jemand auf Englisch umschaltet und genau diese Stelle
// aufruft. Ein Test ist der billigere Weg, das zu merken.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const js = path.join(__dirname, '..', 'public', 'js');

function woerterbuch(sprache) {
  const quelle = fs.readFileSync(path.join(js, `i18n.${sprache}.js`), 'utf8');
  let eingetragen = null;
  const stellvertreter = {
    registriere(name, woerter) { eingetragen = { name, woerter }; }
  };
  new Function('I18N', quelle)(stellvertreter);
  assert.ok(eingetragen, `i18n.${sprache}.js hat sich nicht angemeldet`);
  assert.strictEqual(eingetragen.name, sprache);
  return eingetragen.woerter;
}

const de = woerterbuch('de');
const en = woerterbuch('en');

test('beide Wörterbücher führen dieselben Schlüssel', () => {
  const nurDe = Object.keys(de).filter(k => !(k in en));
  const nurEn = Object.keys(en).filter(k => !(k in de));
  assert.deepStrictEqual(nurDe, [], 'nur auf Deutsch vorhanden');
  assert.deepStrictEqual(nurEn, [], 'nur auf Englisch vorhanden');
});

test('kein Eintrag ist leer', () => {
  for (const [name, dict] of [['de', de], ['en', en]]) {
    const leer = Object.keys(dict).filter(k => String(dict[k]).trim() === '');
    assert.deepStrictEqual(leer, [], `leere Einträge in ${name}`);
  }
});

test('jeder data-i18n-Schlüssel im HTML steht im Wörterbuch', () => {
  const html = fs.readFileSync(path.join(js, '..', 'index.html'), 'utf8');
  const schluessel = new Set();
  for (const treffer of html.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)) {
    schluessel.add(treffer[1]);
  }
  assert.ok(schluessel.size > 100, 'zu wenige Schlüssel gefunden, Regex prüfen');
  const fehlend = [...schluessel].filter(k => !(k in de));
  assert.deepStrictEqual(fehlend, [], 'im HTML verwendet, aber nicht übersetzt');
});
