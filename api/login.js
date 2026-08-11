// api/login.js
// Vercel Serverless Function
// POST /api/login  { password: "..." }  →  { token: "..." }

const { verifyPassword, signToken } = require('../lib/auth.js');

// ─── KONFIGURATION ────────────────────────────────────────────────────────────
// Passwort-Hash im Format "salt:hash" (beides hex).
// Neuen Hash erzeugen:  node scripts/generate-password-hash.js DEIN_PASSWORT
const PASSWORD_HASH = 'f380999cb36322463c56aa78115db78a:c525188e7cbb884c2ecd958461a04c9a5d19b2d3609668948b0418e86ec67a862e0eb0cef31984374a01f8576e5b08f04185a7da4ab13628c2bf11b200bac1e2';

// JWT_SECRET als Umgebungsvariable in Vercel setzen (Settings → Environment Variables)
const SECRET = process.env.JWT_SECRET || 'local-dev-secret-change-in-production';
// ──────────────────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ error: 'Kein Passwort übergeben.' });
  }

  const valid = verifyPassword(password, PASSWORD_HASH);
  if (!valid) {
    // Kurze Verzögerung gegen Brute-Force
    await new Promise(r => setTimeout(r, 500));
    return res.status(401).json({ error: 'Falsches Passwort.' });
  }

  const token = signToken({ role: 'viewer' }, SECRET, 4 * 3600); // 4 Stunden gültig

  return res.status(200).json({ token });
};
