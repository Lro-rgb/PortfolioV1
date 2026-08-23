// api/zeugnis.js
// Vercel Serverless Function
// GET /api/zeugnis?modul=187  Authorization: Bearer <token>  →  die PDF-Datei
//
// Die Kompetenznachweise liegen bewusst in "unterlagen/" und nicht in
// "public/": alles unter "public/" liefert Vercel ohne jede Prüfung aus, ein
// Passwort davor wäre reine Dekoration, wer die Adresse kennt, hätte die
// Noten. Hier kommt die Datei erst nach der Tokenprüfung heraus.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { verifyToken, requireConfig } = require('../lib/auth.js');

/* Feste Zuordnung Modulnummer → Datei. Kein aus der Anfrage
   zusammengesetzter Pfad: sonst lässt sich mit "../" alles aus dem
   Projektverzeichnis herausholen. Was nicht in dieser Liste steht,
   existiert für diesen Endpunkt nicht. */
const DATEIEN = {
  '187': 'uek-187-ict-arbeitsplatz.pdf',
  '106': 'uek-106-datenbanken.pdf',
  '294': 'uek-294-frontend.pdf',
  '295': 'uek-295-backend.pdf',
  '210': 'uek-210-public-cloud.pdf',
  '335': 'uek-335-mobile-applikation.pdf',
  // Nicht nur Modulnachweise: derselbe Weg trägt auch die Unterlagen zur
  // Bewerbung. Der Schlüssel ist hier ein Name statt einer Modulnummer.
  'cv': 'lebenslauf.pdf',
  'arbeitsbestaetigung': 'arbeitsbestaetigung-apotheke.pdf',
  'zeugnis-gibb': 'zeugnis-gibb.pdf',
  'zeugnis-bwd': 'zeugnis-bwd.pdf'
};

module.exports = function handler(req, res) {
  // Geschützte Dateien gehören weder in den Browsercache noch in einen
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

  /* Vom Ort dieser Datei aus rechnen, nicht von process.cwd(): das ist das
     Verzeichnis, aus dem der Prozess gestartet wurde, und liegt beim
     Entwicklungsserver eine Ebene daneben. Die Datei war dann nicht zu
     finden, obwohl sie da war. */
  const pfad = path.join(__dirname, '..', 'unterlagen-verschluesselt', datei + '.bin');
  let roh;
  try {
    roh = fs.readFileSync(pfad);
  } catch (e) {
    console.error('Zeugnis nicht lesbar:', pfad, e.message);
    return res.status(404).json({ error: 'Datei nicht gefunden.' });
  }

  /* Die Dateien liegen verschlüsselt im Repository, denn das ist öffentlich.
     Der Schlüssel steht nur in der Umgebung, wie schon JWT_SECRET. */
  const hex = (process.env.UNTERLAGEN_KEY || '').trim();
  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    console.error('UNTERLAGEN_KEY fehlt oder hat nicht 64 Hexzeichen.');
    return res.status(503).json({ error: 'Der geschuetzte Bereich ist derzeit nicht verfuegbar.' });
  }

  let inhalt;
  try {
    // Aufbau: iv (12) + Prüfsumme (16) + Inhalt
    const entschluessler = crypto.createDecipheriv('aes-256-gcm', Buffer.from(hex, 'hex'), roh.subarray(0, 12));
    entschluessler.setAuthTag(roh.subarray(12, 28));
    inhalt = Buffer.concat([entschluessler.update(roh.subarray(28)), entschluessler.final()]);
  } catch (e) {
    // Falscher Schlüssel oder veränderte Datei, beides darf nicht durchgehen.
    console.error('Zeugnis nicht entschluesselbar:', datei, e.message);
    return res.status(503).json({ error: 'Der geschuetzte Bereich ist derzeit nicht verfuegbar.' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', inhalt.length);
  // "inline": die Vorschau im Browser soll die Datei anzeigen dürfen. Den
  // Download löst das Frontend selbst aus, es hält das Token ohnehin schon.
  res.setHeader('Content-Disposition', 'inline; filename="' + datei + '"');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(200).send(inhalt);
};
