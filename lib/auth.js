// lib/auth.js
// Passwort-Hashing (scrypt) und Token-Signierung (HMAC-SHA256),
// umgesetzt mit Node's eingebautem "crypto"-Modul — das Projekt kommt
// dadurch ohne npm-Abhängigkeiten aus.

const crypto = require('crypto');

const SCRYPT_KEYLEN = 64;

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

module.exports = { hashPassword, verifyPassword, signToken, verifyToken };
