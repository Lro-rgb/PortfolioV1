// api/protected.js
// Vercel Serverless Function
// GET /api/protected  Authorization: Bearer <token>  →  { noten, lebenslauf }

const { verifyToken, requireConfig } = require('../lib/auth.js');

// ─── Geschützte Daten ─────────────────────────────────────────────────────
// Bewusst serverseitig: diese Inhalte gehören nicht ins Frontend-Bundle,
// sondern werden nur gegen ein gültiges Token ausgeliefert.
//   noten:       { fach, note, semester }
//   ausbildung / erfahrung / nebenjobs: { zeitraum, titel, ort, notiz }
//   zertifikate: { jahr, titel, anbieter }
//   sprachen:    { sprache, niveau }
//
// "nebenjobs" deckt bezahlte Nebenjobs und Freiwilligenarbeit ab — die
// IMS-Checkliste verlangt beides ausdruecklich im Lebenslauf.
const DATA = {
  noten: [
    {
      fach: 'üK-Modul 187 — ICT-Arbeitsplatz mit Betriebssystem in Betrieb nehmen',
      note: 5.0,
      semester: 'September 2024'
    }
  ],
  lebenslauf: {
    ausbildung: [],
    erfahrung: [],
    nebenjobs: [
      {
        zeitraum: 'seit 2023, jeweils in den Schulferien',
        titel: 'Aushilfe / Ferienvertretung',
        ort: 'Bahnhof Apotheke Achillea, Burgdorf',
        notiz: 'Auslieferung von Medikamenten an Kundinnen und Kunden, Reinigung der Apothekenraeume sowie Entsorgung und Aktenvernichtung. Einsatz als Vertretung fuer Mitarbeitende, die in den Ferien sind.'
      }
    ],
    zertifikate: [],
    sprachen: []
  }
};
// ────────────────────────────────────────────────────────────────────────

module.exports = function handler(req, res) {
  // Geschuetzte Inhalte duerfen weder von Browsern noch von Zwischenspeichern
  // aufbewahrt werden.
  res.setHeader('Cache-Control', 'no-store, private');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const config = requireConfig(res, false);
  if (!config) return; // Antwort wurde bereits gesendet

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Kein Token.' });
  }

  try {
    verifyToken(token, config.secret);
  } catch (e) {
    return res.status(401).json({ error: 'Token ungültig oder abgelaufen.' });
  }

  return res.status(200).json(DATA);
};
