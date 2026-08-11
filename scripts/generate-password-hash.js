#!/usr/bin/env node
/**
 * generate-password-hash.js
 * ───────────────────────────────────────────────────────────
 * Erzeugt einen sicheren Passwort-Hash (scrypt, salted) für
 * den Login des geschützten Bereichs (Noten / Lebenslauf).
 * Nutzt nur Node's eingebautes "crypto"-Modul — kein npm
 * install nötig.
 *
 * Verwendung:
 *   node scripts/generate-password-hash.js DEIN_PASSWORT
 *
 * Den Output anschliessend in api/login.js bei
 * PASSWORD_HASH einfügen.
 * ───────────────────────────────────────────────────────────
 */

const { hashPassword } = require('../lib/auth.js');

const password = process.argv[2];

if (!password) {
  console.error('Bitte ein Passwort angeben:');
  console.error('  node scripts/generate-password-hash.js DEIN_PASSWORT');
  process.exit(1);
}

const hash = hashPassword(password);

console.log('');
console.log('Passwort-Hash:');
console.log(hash);
console.log('');
console.log('→ In api/login.js bei PASSWORD_HASH einfügen.');
