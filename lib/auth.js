// lib/auth.js
// Passwort-Hashing (scrypt) und Token-Signierung (HMAC-SHA256),
// umgesetzt mit Node's eingebautem "crypto"-Modul. Das Projekt kommt
// dadurch ohne npm-Abhängigkeiten aus.

const crypto = require('crypto');

const SCRYPT_KEYLEN = 64;
const MIN_SECRET_LENGTH = 32;

// ─── Konfiguration aus der Umgebung ────────────────────────────────────────
// Bewusst ohne Rückfallwert: Ein im Code hinterlegter Standardschlüssel läge
// im öffentlichen Repository und könnte von jedem benutzt werden, um sich ein
// gültiges Token selbst auszustellen. Fehlt die Variable, wird der Dienst
// verweigert, lieber kein Zugang als ein wirkungsloser Schutz.

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (typeof s === 'string' && s.length >= MIN_SECRET_LENGTH) return s;
  return null;
}

function getPasswordHash() {
  const h = process.env.APP_PASSWORD_HASH;
  if (typeof h === 'string' && /^[0-9a-f]+:[0-9a-f]+$/i.test(h.trim())) return h.trim();
  return null;
}

/**
 * Prüft beide Werte und beantwortet die Anfrage selbst, falls etwas fehlt.
 * Gibt die Konfiguration zurück oder null, dann ist bereits geantwortet.
 */
function requireConfig(res, needPassword) {
  const secret = getSecret();
  if (!secret) {
    console.error('JWT_SECRET fehlt oder ist kuerzer als ' + MIN_SECRET_LENGTH + ' Zeichen.');
    res.status(503).json({ error: 'Der geschuetzte Bereich ist derzeit nicht verfuegbar.' });
    return null;
  }
  if (!needPassword) return { secret, passwordHash: null };

  const passwordHash = getPasswordHash();
  if (!passwordHash) {
    console.error('APP_PASSWORD_HASH fehlt oder hat nicht das Format "salt:hash" (hex).');
    res.status(503).json({ error: 'Der geschuetzte Bereich ist derzeit nicht verfuegbar.' });
    return null;
  }
  return { secret, passwordHash };
}

// ─── Passwort-Hashing ──────────────────────────────────────────────────────

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

function verifyPassword(password, stored) {
  const [saltHex, hashHex] = String(stored).split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

// ─── Token (JWT-ähnlich, HMAC-SHA256 signiert) ────────────────────────────

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function signToken(payload, secret, expiresInSeconds) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = { ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + expiresInSeconds };
  const data = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(body))}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token, secret) {
  const parts = String(token).split('.');
  if (parts.length !== 3) throw new Error('Ungültiges Token-Format.');
  const [headerB64, bodyB64, sig] = parts;
  const data = `${headerB64}.${bodyB64}`;
  const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    throw new Error('Ungültige Signatur.');
  }
  const payload = JSON.parse(Buffer.from(bodyB64, 'base64url').toString('utf8'));
  if (!payload.exp || Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error('Token abgelaufen.');
  }
  return payload;
}

module.exports = {
  hashPassword, verifyPassword, signToken, verifyToken,
  getSecret, getPasswordHash, requireConfig, MIN_SECRET_LENGTH
};
