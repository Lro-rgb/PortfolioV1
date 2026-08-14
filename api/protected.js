// api/protected.js
// Vercel Serverless Function
// GET /api/protected  Authorization: Bearer <token>  →  { noten, lebenslauf }

const { verifyToken, requireConfig } = require('../lib/auth.js');

// ─── Geschützte Daten ─────────────────────────────────────────────────────
// Bewusst serverseitig: diese Inhalte gehören nicht ins Frontend-Bundle,
// sondern werden nur gegen ein gültiges Token ausgeliefert.
//   noten:       { fach, note, semester, art }   art: 'uek' | 'zeugnis'
//   ausbildung / erfahrung / nebenjobs: { zeitraum, titel, ort, notiz }
//   zertifikate: { jahr, titel, anbieter }
//   sprachen:    { sprache, niveau }
//
// "nebenjobs" deckt bezahlte Nebenjobs und Freiwilligenarbeit ab — die
// IMS-Checkliste verlangt beides ausdruecklich im Lebenslauf.
// "datei" ist der Schluessel, unter dem /api/zeugnis die PDF herausgibt.
// Ohne diesen Eintrag zeigt die Karte einfach keine Schaltflaechen.
// "art" bestimmt, in welcher der beiden Klappgruppen die Karte landet:
// 'uek' fuer Kompetenznachweise, 'zeugnis' fuer Schulzeugnisse.
const DATA = {
  noten: [
    {
      fach: 'üK-Modul 187 — ICT-Arbeitsplatz mit Betriebssystem in Betrieb nehmen',
      note: 5.0,
      semester: 'September 2024',
      datei: '187',
      art: 'uek'
    },
    {
      fach: 'üK-Modul 106 — Datenbanken abfragen, bearbeiten und warten',
      note: 4.5,
      semester: 'März 2025',
      datei: '106',
      art: 'uek'
    },
    {
      fach: 'üK-Modul 294 — Frontend einer interaktiven Webapplikation realisieren',
      note: 5.5,
      semester: 'April 2026',
      datei: '294',
      art: 'uek'
    },
    {
      fach: 'üK-Modul 210 — Public Cloud für Anwendungen nutzen',
      note: 5.0,
      semester: 'Juni 2026',
      datei: '210',
      art: 'uek'
    },
    {
      fach: 'üK-Modul 335 — Mobile-Applikation realisieren',
      note: 5.0,
      semester: 'Juni/Juli 2026',
      datei: '335',
      art: 'uek'
    }
  ],
  lebenslauf: {
    ausbildung: [
      {
        zeitraum: '2024 – 2028',
        titel: 'Informatikmittelschule (IMS), Informatiker EFZ Applikationsentwicklung',
        ort: 'bwd Bern',
        notiz: 'Drei Jahre Vollzeitschule mit Berufsmaturität Wirtschaft, danach ein Jahr Praktikum.'
      },
      {
        zeitraum: '2015 – 2024',
        titel: 'Primar- und Sekundarschule',
        ort: 'Schule Gsteighof, Burgdorf',
        notiz: 'Abschluss Sekundarstufe I.'
      }
    ],
    /* Dieselbe Stelle steht bewusst zweimal: unter Berufserfahrung, weil sie
       meine einzige ist und die Spalte sonst leer bliebe, und unter
       Nebenjobs, weil die IMS-Checkliste beides ausdruecklich verlangt. Die
       Beschreibung ist verschieden — oben die Aufgaben, unten die Art des
       Einsatzes. */
    erfahrung: [
      {
        zeitraum: '04/2023 – heute',
        titel: 'Aushilfe / Springer',
        ort: 'Bahnhof Apotheke Achillea, Burgdorf',
        notiz: 'Auslieferung von Medikamenten an Kundinnen und Kunden, Verwaltung und fachgerechte Entsorgung vertraulicher Unterlagen, Ordnung und Sauberkeit in den Apothekenräumen.'
      }
    ],
    nebenjobs: [
      {
        zeitraum: 'seit 2023, jeweils in den Schulferien',
        titel: 'Aushilfe / Ferienvertretung',
        ort: 'Bahnhof Apotheke Achillea, Burgdorf',
        notiz: 'Einsatz als Vertretung für Mitarbeitende, die in den Ferien sind. Neben der Schule und während der Ferien, mit selbstständig erledigten Aufträgen.'
      }
    ],
    zertifikate: [],
    sprachen: [
      { sprache: 'Deutsch', niveau: 'Muttersprache' },
      { sprache: 'Englisch', niveau: 'B2' },
      { sprache: 'Italienisch', niveau: 'B2' },
      { sprache: 'Französisch', niveau: 'B1' }
    ]
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
