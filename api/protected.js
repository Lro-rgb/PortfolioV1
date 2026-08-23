// api/protected.js
// Vercel Serverless Function
// GET /api/protected  Authorization: Bearer <token>  →  { noten, lebenslauf }

const { verifyToken, requireConfig } = require('../lib/auth.js');

// ─── Geschützte Daten ─────────────────────────────────────────────────────
// Bewusst serverseitig: diese Inhalte gehören nicht ins Frontend-Bundle,
// sondern werden nur gegen ein gültiges Token ausgeliefert.
//   noten:       { fach, note, semester, art }   art: 'uek' | 'zeugnis'
//   personalien: { name, geburtsdatum, adresse, telefon, email, staatsangehoerigkeit }
//   ausbildung / erfahrung / nebenjobs: { zeitraum, titel, ort, notiz }
//   zertifikate: { jahr, titel, anbieter }
//   sprachen:    { sprache, niveau }
//   referenzen:  { name, rolle, telefon, email }
//
// "nebenjobs" deckt bezahlte Nebenjobs und Freiwilligenarbeit ab, die
// IMS-Checkliste verlangt beides ausdrücklich im Lebenslauf.
// "datei" ist der Schlüssel, unter dem /api/zeugnis die PDF herausgibt.
// Ohne diesen Eintrag zeigt die Karte einfach keine Schaltflächen.
// "art" bestimmt, in welcher der beiden Klappgruppen die Karte landet:
// 'uek' für Kompetenznachweise, 'zeugnis' für Schulzeugnisse.
const DATA = {
  /* Die Noten stehen nicht mehr hier, sondern in der Umgebungsvariablen
     NOTEN_JSON, als eine Zeile JSON mit denselben Feldern wie bisher.
     Grund: Diese Datei liegt in einem öffentlichen Repository. Die PDF der
     Kompetenznachweise waren verschlüsselt abgelegt, die Zahlen daneben
     standen im Klartext daneben; der Passwortschutz vor dem Notenbereich
     galt also nur für die Website, nicht für den Quelltext.

     Fällt die Variable weg oder ist sie kaputt, bleibt die Liste leer und
     der Bereich zeigt "keine Daten". Das ist besser, als wenn die ganze
     Funktion beim Laden abstürzt und auch der Lebenslauf verschwindet. */
  noten: (() => {
    try {
      return JSON.parse(process.env.NOTEN_JSON || '[]');
    } catch (e) {
      console.error('NOTEN_JSON ist kein gueltiges JSON, Notenliste bleibt leer.');
      return [];
    }
  })(),
  lebenslauf: {
    /* Ein Lebenslauf ohne Absender ist keiner, bisher fing er direkt mit
       "Ausbildung" an.

       Geburtsdatum, Wohnadresse und Telefonnummer stehen NICHT hier im
       Klartext, sondern kommen aus Umgebungsvariablen. Der Grund ist
       derselbe wie bei den Kompetenznachweisen: Diese Datei liegt in einem
       öffentlichen Repository. Ein Passwort vor dem Lebenslauf nützt
       nichts, wenn die Wohnadresse zwei Klicks weiter auf GitHub steht.

       Gesetzt werden sie in .env (lokal) und mit "vercel env add"
       (Produktion). Fehlt eine, bleibt die Zeile in der Anzeige einfach
       weg, leere Felder werden nicht gerendert. */
    personalien: {
      name: 'Luis Rosado',
      geburtsdatum: process.env.CV_GEBURTSDATUM || '',
      adresse: process.env.CV_ADRESSE || '',
      telefon: process.env.CV_TELEFON || '',
      email: 'luisrosado008@gmail.com',
      staatsangehoerigkeit: process.env.CV_NATIONALITAET || ''
    },
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
       Nebenjobs, weil die IMS-Checkliste beides ausdrücklich verlangt. Die
       Beschreibung ist verschieden: oben die Aufgaben, unten die Art des
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
    ],
    /* Referenzpersonen: Name und Rolle sind unkritisch und stehen direkt im
       Code, Telefon und E-Mail sind private Kontaktdaten von Drittpersonen
       und kommen darum, genau wie bei den eigenen Personalien oben, aus
       Umgebungsvariablen statt aus dem öffentlichen Repository. Fehlt eine
       Variable, bleibt die betroffene Spalte in der Anzeige leer. */
    referenzen: [
      {
        name: 'Patrick Meier',
        rolle: 'Klassenlehrer, Wirtschaft und Recht (WR), bwd Bern',
        telefon: process.env.CV_REF1_TELEFON || '',
        email: process.env.CV_REF1_EMAIL || ''
      },
      {
        name: 'Reto Glarner',
        rolle: 'Berufsschullehrer 2. Ausbildungsjahr, Module 293 & 322, gibb Bern',
        telefon: process.env.CV_REF2_TELEFON || '',
        email: process.env.CV_REF2_EMAIL || ''
      }
    ]
  }
};
// ────────────────────────────────────────────────────────────────────────

module.exports = function handler(req, res) {
  // Geschützte Inhalte dürfen weder von Browsern noch von Zwischenspeichern
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
