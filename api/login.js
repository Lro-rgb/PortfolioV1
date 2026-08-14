// api/login.js
// Vercel Serverless Function
// POST /api/login  { password: "..." }  →  { token: "..." }
//
// Passwort-Hash und Token-Schluessel kommen aus Umgebungsvariablen und
// stehen bewusst nicht im Repository:
//   APP_PASSWORD_HASH  Format "salt:hash" (hex)  →  node scripts/generate-password-hash.js
//   JWT_SECRET         mindestens 32 Zeichen     →  node scripts/generate-jwt-secret.js

const { verifyPassword, signToken, requireConfig } = require('../lib/auth.js');

const TOKEN_LIFETIME = 4 * 3600; // 4 Stunden

// Laengstes Passwort, das ueberhaupt geprueft wird. scrypt ist absichtlich
// rechenintensiv, und es rechnet ueber die volle Eingabe: Wer ein Passwort mit
// einem Megabyte schickt, beschaeftigt die Funktion damit sehr lange. Ein paar
// solcher Anfragen genuegen, um den Endpunkt lahmzulegen. 200 Zeichen sind
// mehr, als ein echtes Passwort je braucht.
const MAX_PASSWORD_LENGTH = 200;

/* Einfache Bremse gegen das Durchprobieren von Passwoertern.

   Serverlose Funktionen haben keinen gemeinsamen Speicher — jede Instanz
   zaehlt fuer sich, und nach einer Ruhephase faengt sie wieder bei null an.
   Ein entschlossener Angreifer umgeht das. Trotzdem sinnvoll: Es macht das
   stumpfe Durchprobieren aus einer Quelle deutlich langsamer, und mehr laesst
   sich ohne Datenbank ehrlicherweise nicht bauen. Wer es wasserdicht will,
   braucht einen gemeinsamen Zaehler, etwa in Redis. */
const FENSTER_MS = 15 * 60 * 1000;   // Beobachtungszeitraum
const MAX_VERSUCHE = 10;             // Fehlversuche je Herkunft in diesem Zeitraum
const versuche = new Map();

function herkunft(req) {
  const weiter = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return weiter || req.socket?.remoteAddress || 'unbekannt';
}

function zuVieleVersuche(schluessel) {
  const jetzt = Date.now();
  const eintrag = versuche.get(schluessel);
  if (!eintrag || jetzt > eintrag.bis) return false;
  return eintrag.zahl >= MAX_VERSUCHE;
}

function fehlversuchNotieren(schluessel) {
  const jetzt = Date.now();
  const eintrag = versuche.get(schluessel);
  if (!eintrag || jetzt > eintrag.bis) {
    versuche.set(schluessel, { zahl: 1, bis: jetzt + FENSTER_MS });
  } else {
    eintrag.zahl++;
  }
  // Abgelaufene Eintraege wegraeumen, damit die Map nicht endlos waechst.
  for (const [k, v] of versuche) if (jetzt > v.bis) versuche.delete(k);
}

module.exports = async function handler(req, res) {
  // Frontend und API liegen auf derselben Herkunft — es gibt keinen Grund,
  // diesen Endpunkt fuer fremde Seiten zu oeffnen.
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const config = requireConfig(res, true);
  if (!config) return; // Antwort wurde bereits gesendet

  const quelle = herkunft(req);
  if (zuVieleVersuche(quelle)) {
    res.setHeader('Retry-After', String(FENSTER_MS / 1000));
    return res.status(429).json({ error: 'Zu viele Versuche. Bitte spaeter erneut probieren.' });
  }

  const { password } = req.body || {};
  if (typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Kein Passwort uebergeben.' });
  }
  // Vor der teuren Pruefung abweisen, nicht danach.
  if (password.length > MAX_PASSWORD_LENGTH) {
    fehlversuchNotieren(quelle);
    return res.status(400).json({ error: 'Passwort ist zu lang.' });
  }

  let valid = false;
  try {
    valid = verifyPassword(password, config.passwordHash);
  } catch (e) {
    console.error('Passwortpruefung fehlgeschlagen:', e.message);
  }

  if (!valid) {
    fehlversuchNotieren(quelle);
    // Kurze Verzoegerung gegen Brute-Force
    await new Promise(r => setTimeout(r, 500));
    return res.status(401).json({ error: 'Falsches Passwort.' });
  }

  const token = signToken({ role: 'viewer' }, config.secret, TOKEN_LIFETIME);
  return res.status(200).json({ token });
};
