// api/kurz.js
// Vercel Serverless Function
// POST /api/kurz  { url: "https://..." }  →  { code }
//
// Die spielbare Haelfte des Schulprojekts "URL-Shortener mit GitOps-Kette":
// Adresse rein, Kurzcode raus. Das Weiterleiten fehlt hier bewusst — eine
// Weiterleitung auf beliebige fremde Adressen macht aus meiner Domain einen
// Steigbuegel fuer Phishing-Links, und das ist mir eine Vorfuehrung nicht
// wert. Ohne Weiterleitung braucht die Funktion auch nichts zu speichern.

const crypto = require('crypto');

const MAX_URL_LAENGE = 2000;   // laenger sind echte Adressen praktisch nie

/* Nur http und https. Ohne die Pruefung landete jede beliebige Zeichenkette
   in der Antwort, auch "javascript:..." — und die Seite zeigt die Antwort an. */
function zielPruefen(roh) {
  if (typeof roh !== 'string') return null;
  const text = roh.trim();
  if (!text || text.length > MAX_URL_LAENGE) return null;
  try {
    const adresse = new URL(text);
    if (adresse.protocol !== 'http:' && adresse.protocol !== 'https:') return null;
    return adresse.toString();
  } catch (e) {
    return null;
  }
}

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ziel = zielPruefen(req.body && req.body.url);
  if (!ziel) {
    return res.status(400).json({
      error: 'Bitte eine vollständige Adresse mit http:// oder https:// angeben.'
    });
  }

  // Der Code kommt aus der Adresse selbst statt aus einer Zufallszahl: Damit
  // ergibt dieselbe Adresse immer denselben Code, ohne dass sich die Funktion
  // etwas merken muss. Im Projekt selbst vergibt der Dienst den Code und legt
  // ihn mit dem Ziel in einer MariaDB ab.
  const code = crypto.createHash('sha256').update(ziel).digest('base64url').slice(0, 6);

  return res.status(201).json({ code: code });
};
