// api/zeugnis.js
// Vercel Serverless Function
// GET /api/zeugnis?modul=187  Authorization: Bearer <token>  →  die PDF-Datei
//
// Die Kompetenznachweise liegen bewusst in "unterlagen/" und nicht in
// "public/": alles unter "public/" liefert Vercel ohne jede Pruefung aus, ein
// Passwort davor waere reine Dekoration — wer die Adresse kennt, haette die
// Noten. Hier kommt die Datei erst nach der Tokenpruefung heraus.

const fs = require('fs');
const path = require('path');
const { verifyToken, requireConfig } = require('../lib/auth.js');

/* Feste Zuordnung Modulnummer → Datei. Kein aus der Anfrage
   zusammengesetzter Pfad: sonst laesst sich mit "../" alles aus dem
   Projektverzeichnis herausholen. Was nicht in dieser Liste steht,
   existiert fuer diesen Endpunkt nicht. */
const DATEIEN = {
  '187': 'uek-187-ict-arbeitsplatz.pdf',
  '106': 'uek-106-datenbanken.pdf',
  '294': 'uek-294-frontend.pdf',
  '210': 'uek-210-public-cloud.pdf',
  '335': 'uek-335-mobile-applikation.pdf'
};

module.exports = function handler(req, res) {
  // Geschuetzte Dateien gehoeren weder in den Browsercache noch in einen
  // Zwischenspeicher unterwegs.
  res.setHeader('Cache-Control', 'no-store, private');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const config = requireConfig(res, false);
  if (!config) return; // Antwort wurde bereits gesendet

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Kein Token.' });

  try {
    verifyToken(token, config.secret);
  } catch (e) {
    return res.status(401).json({ error: 'Token ungültig oder abgelaufen.' });
  }

  const modul = String((req.query && req.query.modul) || '');
  const datei = DATEIEN[modul];
  if (!datei) return res.status(404).json({ error: 'Kein Zeugnis zu diesem Modul.' });

  const pfad = path.join(process.cwd(), 'unterlagen', datei);
  let inhalt;
  try {
    inhalt = fs.readFileSync(pfad);
  } catch (e) {
    console.error('Zeugnis nicht lesbar:', pfad, e.message);
    return res.status(404).json({ error: 'Datei nicht gefunden.' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', inhalt.length);
  // "inline": die Vorschau im Browser soll die Datei anzeigen duerfen. Den
  // Download loest das Frontend selbst aus, es haelt das Token ohnehin schon.
  res.setHeader('Content-Disposition', 'inline; filename="' + datei + '"');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(200).send(inhalt);
};
