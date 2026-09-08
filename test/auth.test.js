// test/auth.test.js
// Prüft die Bausteine hinter dem geschützten Bereich: Passwortprüfung
// und Token. Bewusst mit dem Testläufer von Node selbst (node --test) und
// ohne Bibliothek — das Projekt kommt sonst ohne Abhängigkeiten aus, und
// dafür allein lohnt sich keine.
//
// Ausführen:  npm test

const test = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');

const { hashPassword, verifyPassword, signToken, verifyToken } =
  require('../lib/auth.js');

const GEHEIM = 'nur-fuer-den-test-und-lang-genug-1234567890';

// ─── Passwort ─────────────────────────────────────────────────────────────

test('richtiges Passwort wird erkannt', () => {
  const abgelegt = hashPassword('korrekt-pferd-batterie');
  assert.strictEqual(verifyPassword('korrekt-pferd-batterie', abgelegt), true);
});

test('falsches Passwort wird abgewiesen', () => {
  const abgelegt = hashPassword('korrekt-pferd-batterie');
  assert.strictEqual(verifyPassword('korrekt-pferd-batteria', abgelegt), false);
});

test('derselbe Klartext ergibt zwei verschiedene Hashes', () => {
  // Sonst wäre das Salz wirkungslos und gleiche Passwörter wären an
  // gleichen Hashes erkennbar.
  assert.notStrictEqual(hashPassword('gleich'), hashPassword('gleich'));
});

test('kaputter Eintrag laesst die Pruefung nicht abstuerzen', () => {
  assert.strictEqual(verifyPassword('egal', 'ohne-doppelpunkt'), false);
  assert.strictEqual(verifyPassword('egal', ''), false);
});

// ─── Token ────────────────────────────────────────────────────────────────

test('eigenes Token wird angenommen und traegt die Nutzlast', () => {
  const token = signToken({ role: 'viewer' }, GEHEIM, 60);
  const inhalt = verifyToken(token, GEHEIM);
  assert.strictEqual(inhalt.role, 'viewer');
  assert.ok(inhalt.exp > inhalt.iat);
});

test('anderes Geheimnis wird abgewiesen', () => {
  const token = signToken({ role: 'viewer' }, GEHEIM, 60);
  assert.throws(() => verifyToken(token, GEHEIM + 'x'), /Signatur/);
});

test('veraenderte Nutzlast wird abgewiesen', () => {
  // Der eigentliche Punkt: wer sich "role":"admin" hineinschreibt, muss
  // scheitern, solange er das Geheimnis nicht kennt.
  const token = signToken({ role: 'viewer' }, GEHEIM, 60);
  const [kopf, , sig] = token.split('.');
  const gefaelscht = Buffer.from(JSON.stringify({
    role: 'admin', iat: 0, exp: Math.floor(Date.now() / 1000) + 60
  })).toString('base64url');
  assert.throws(() => verifyToken(`${kopf}.${gefaelscht}.${sig}`, GEHEIM), /Signatur/);
});

test('abgelaufenes Token wird abgewiesen', () => {
  const token = signToken({ role: 'viewer' }, GEHEIM, -1);
  assert.throws(() => verifyToken(token, GEHEIM), /abgelaufen/);
});

test('Token ohne Ablauf wird abgewiesen', () => {
  // Von Hand gebaut, weil signToken exp immer setzt: ein Token ohne exp
  // wäre sonst unbegrenzt gültig.
  const kopf = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const rumpf = Buffer.from(JSON.stringify({ role: 'viewer', iat: 0 })).toString('base64url');
  const daten = `${kopf}.${rumpf}`;
  const sig = crypto.createHmac('sha256', GEHEIM).update(daten).digest('base64url');
  assert.throws(() => verifyToken(`${daten}.${sig}`, GEHEIM), /abgelaufen/);
});

test('Unsinn statt Token wird abgewiesen', () => {
  assert.throws(() => verifyToken('kein-token', GEHEIM), /Format/);
  assert.throws(() => verifyToken('', GEHEIM), /Format/);
});
