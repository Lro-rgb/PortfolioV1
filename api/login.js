// api/login.js
// Vercel Serverless Function
// POST /api/login  { password: "..." }  →  { token: "..." }
//
// Passwort-Hash und Token-Schlüssel kommen aus Umgebungsvariablen und
// stehen bewusst nicht im Repository:
//   APP_PASSWORD_HASH  Format "salt:hash" (hex)  →  node scripts/generate-password-hash.js
//   JWT_SECRET         mindestens 32 Zeichen     →  node scripts/generate-jwt-secret.js

const { verifyPassword, signToken, requireConfig } = require('../lib/auth.js');
const { herkunft, erstelleBremse } = require('../lib/rateLimit.js');

const TOKEN_LIFETIME = 4 * 3600; // 4 Stunden

// Längstes Passwort, das überhaupt geprüft wird. scrypt ist absichtlich
// rechenintensiv, und es rechnet über die volle Eingabe: Wer ein Passwort mit
// einem Megabyte schickt, beschäftigt die Funktion damit sehr lange. Ein paar
// solcher Anfragen genügen, um den Endpunkt lahmzulegen. 200 Zeichen sind
// mehr, als ein echtes Passwort je braucht.
const MAX_PASSWORD_LENGTH = 200;

// Bremse gegen das Durchprobieren von Passwörtern: 10 Fehlversuche je
// Herkunft innert 15 Minuten, siehe lib/rateLimit.js für die Grenzen davon.
const loginBremse = erstelleBremse(15 * 60 * 1000, 10);

module.exports = async function handler(req, res) {
  // Frontend und API liegen auf derselben Herkunft, es gibt keinen Grund,
  // diesen Endpunkt für fremde Seiten zu öffnen.
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const config = requireConfig(res, true);
  if (!config) return; // Antwort wurde bereits gesendet

  const quelle = herkunft(req);
  if (loginBremse.zuViele(quelle)) {
    res.setHeader('Retry-After', String(loginBremse.fensterSekunden));
    return res.status(429).json({ error: 'Zu viele Versuche. Bitte spaeter erneut probieren.' });
  }

  const { password } = req.body || {};
  if (typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Kein Passwort uebergeben.' });
  }
  // Vor der teuren Prüfung abweisen, nicht danach.
  if (password.length > MAX_PASSWORD_LENGTH) {
    loginBremse.notieren(quelle);
    return res.status(400).json({ error: 'Passwort ist zu lang.' });
  }

  let valid = false;
  try {
    valid = verifyPassword(password, config.passwordHash);
  } catch (e) {
    console.error('Passwortpruefung fehlgeschlagen:', e.message);
  }

  if (!valid) {
    loginBremse.notieren(quelle);
    // Kurze Verzögerung gegen Brute-Force
    await new Promise(r => setTimeout(r, 500));
    return res.status(401).json({ error: 'Falsches Passwort.' });
  }

  const token = signToken({ role: 'viewer' }, config.secret, TOKEN_LIFETIME);
  return res.status(200).json({ token });
};
