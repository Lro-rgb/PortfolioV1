// scripts/unterlagen-verschluesseln.js
//
// Verschlüsselt die Kompetenznachweise aus unterlagen/ nach
// unterlagen-verschluesselt/. Nur die verschlüsselte Fassung wird
// eingecheckt: das Repository ist öffentlich, die Noten sollen dort
// niemand lesen können, die Dateien müssen aber trotzdem mit jedem
// Bau aus GitHub auf den Server kommen.
//
//   node scripts/unterlagen-verschluesseln.js
//
// Der Schlüssel steht in UNTERLAGEN_KEY (64 Hexzeichen). Fehlt er, wird
// einer vorgeschlagen — die Zeile gehört dann nach .env und mit
// "vercel env add UNTERLAGEN_KEY" in die Produktionsumgebung.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const projekt = path.join(__dirname, '..');
const quelle = path.join(projekt, 'unterlagen');
const ziel = path.join(projekt, 'unterlagen-verschluesselt');

// .env einlesen, damit der Schlüssel nicht jedes Mal von Hand gesetzt wird
try {
  for (const zeile of fs.readFileSync(path.join(projekt, '.env'), 'utf8').split('\n')) {
    const t = zeile.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i > 0 && !(t.slice(0, i).trim() in process.env)) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
} catch { /* keine .env */ }

const hex = (process.env.UNTERLAGEN_KEY || '').trim();
if (!/^[0-9a-f]{64}$/i.test(hex)) {
  console.error('UNTERLAGEN_KEY fehlt oder ist keine 64 Hexzeichen.\n');
  console.error('Vorschlag — diese Zeile nach .env uebernehmen:\n');
  console.error('UNTERLAGEN_KEY=' + crypto.randomBytes(32).toString('hex') + '\n');
  console.error('Danach: vercel env add UNTERLAGEN_KEY   (nur den Wert)');
  process.exit(1);
}
const schluessel = Buffer.from(hex, 'hex');

if (!fs.existsSync(quelle)) {
  console.error('Ordner unterlagen/ fehlt — dort gehoeren die PDF-Dateien hin.');
  process.exit(1);
}
fs.mkdirSync(ziel, { recursive: true });

const dateien = fs.readdirSync(quelle).filter(n => n.toLowerCase().endsWith('.pdf'));
if (!dateien.length) {
  console.error('Keine PDF-Dateien in unterlagen/ gefunden.');
  process.exit(1);
}

for (const name of dateien) {
  const klar = fs.readFileSync(path.join(quelle, name));
  /* AES-256-GCM: verschlüsselt und erkennt nachträgliche Veränderungen.
     Der Zufallswert (iv) muss je Datei verschieden sein, sonst lässt sich
     aus zwei Dateien der Schlüsselstrom herausrechnen. */
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', schluessel, iv);
  const geheim = Buffer.concat([c.update(klar), c.final()]);
  // Aufbau: iv (12) + Prüfsumme (16) + Inhalt
  fs.writeFileSync(path.join(ziel, name + '.bin'), Buffer.concat([iv, c.getAuthTag(), geheim]));
  console.log('verschluesselt:', name, '→', name + '.bin', '(' + geheim.length + ' Bytes)');
}

console.log('\nFertig. unterlagen-verschluesselt/ gehoert ins Repository, unterlagen/ nicht.');
