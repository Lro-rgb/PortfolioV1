#!/usr/bin/env node
/**
 * generate-password-hash.js
 * ───────────────────────────────────────────────────────────
 * Erzeugt einen sicheren Passwort-Hash (scrypt, salted) für
 * den Login des geschützten Bereichs (Noten / Lebenslauf).
 * Nutzt nur Node's eingebautes "crypto"-Modul, kein npm
 * install nötig.
 *
 * Verwendung:
 *   node scripts/generate-password-hash.js DEIN_PASSWORT
 *
 * Der Hash gehört als Umgebungsvariable APP_PASSWORD_HASH
 * hinterlegt, nicht in den Quellcode. Das Repository ist
 * öffentlich, und ein dort liegender Hash liesse sich in Ruhe
 * offline durchprobieren.
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
console.log('APP_PASSWORD_HASH=' + hash);
console.log('');
console.log('→ Lokal: Zeile so in die Datei .env übernehmen.');
console.log('→ Produktion: vercel env add APP_PASSWORD_HASH');
console.log('   (nur den Wert nach dem Gleichheitszeichen einfügen)');
