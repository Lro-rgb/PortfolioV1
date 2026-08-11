// api/protected.js
// Vercel Serverless Function
// GET /api/protected  Authorization: Bearer <token>  →  { noten, lebenslauf }

const { verifyToken } = require('../lib/auth.js');

const SECRET = process.env.JWT_SECRET || 'local-dev-secret-change-in-production';

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
  noten: [],
  lebenslauf: {
    ausbildung: [],
    erfahrung: [],
    nebenjobs: [
      {
        zeitraum: 'wiederkehrend in den Schulferien',
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Kein Token.' });
  }

  try {
    verifyToken(token, SECRET);
  } catch (e) {
    return res.status(401).json({ error: 'Token ungültig oder abgelaufen.' });
  }

  return res.status(200).json(DATA);
};
