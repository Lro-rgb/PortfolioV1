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

  const { password } = req.body || {};
  if (typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Kein Passwort uebergeben.' });
  }

  let valid = false;
  try {
    valid = verifyPassword(password, config.passwordHash);
  } catch (e) {
    console.error('Passwortpruefung fehlgeschlagen:', e.message);
  }

  if (!valid) {
    // Kurze Verzoegerung gegen Brute-Force
    await new Promise(r => setTimeout(r, 500));
    return res.status(401).json({ error: 'Falsches Passwort.' });
  }

  const token = signToken({ role: 'viewer' }, config.secret, TOKEN_LIFETIME);
  return res.status(200).json({ token });
};
