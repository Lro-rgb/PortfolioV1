#!/usr/bin/env node
/**
 * generate-jwt-secret.js
 * ───────────────────────────────────────────────────────────
 * Erzeugt einen zufälligen, sicheren String für JWT_SECRET.
 *
 * Verwendung:
 *   node scripts/generate-jwt-secret.js
 *
 * Den Output als Umgebungsvariable JWT_SECRET in Vercel
 * hinterlegen (vercel env add JWT_SECRET).
 * ───────────────────────────────────────────────────────────
 */

const crypto = require('crypto');

console.log('');
console.log('JWT_SECRET:');
console.log(crypto.randomBytes(48).toString('hex'));
console.log('');
console.log('→ Als Umgebungsvariable in Vercel hinterlegen:');
console.log('  vercel env add JWT_SECRET');
