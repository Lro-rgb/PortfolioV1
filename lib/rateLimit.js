// lib/rateLimit.js
// Einfache Bremse gegen zu viele Anfragen aus einer Quelle, geteilt von
// allen Endpunkten, die sowas brauchen (Login, geschützter Bereich).
//
// Serverlose Funktionen haben keinen gemeinsamen Speicher, jede Instanz
// zählt für sich, und nach einer Ruhephase fängt sie wieder bei null an.
// Ein entschlossener Angreifer mit mehreren Quellen oder viel Geduld umgeht
// das. Trotzdem sinnvoll: Es macht stumpfes Durchprobieren oder Abgreifen
// aus einer Quelle deutlich langsamer, und mehr lässt sich ohne gemeinsamen
// Speicher (z. B. Redis) ehrlicherweise nicht bauen.

function herkunft(req) {
  const weiter = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return weiter || req.socket?.remoteAddress || 'unbekannt';
}

/**
 * Erstellt eine eigenständige Bremse mit eigenem Zähler je Herkunft.
 * @param {number} fensterMs Beobachtungszeitraum in Millisekunden
 * @param {number} maxZahl Erlaubte Zählungen je Herkunft in diesem Zeitraum
 */
function erstelleBremse(fensterMs, maxZahl) {
  const zaehler = new Map();

  function zuViele(schluessel) {
    const jetzt = Date.now();
    const eintrag = zaehler.get(schluessel);
    if (!eintrag || jetzt > eintrag.bis) return false;
    return eintrag.zahl >= maxZahl;
  }

  function notieren(schluessel) {
    const jetzt = Date.now();
    const eintrag = zaehler.get(schluessel);
    if (!eintrag || jetzt > eintrag.bis) {
      zaehler.set(schluessel, { zahl: 1, bis: jetzt + fensterMs });
    } else {
      eintrag.zahl++;
    }
    // Abgelaufene Einträge wegräumen, damit die Map nicht endlos wächst.
    for (const [k, v] of zaehler) if (jetzt > v.bis) zaehler.delete(k);
  }

  return { zuViele, notieren, fensterSekunden: fensterMs / 1000 };
}

module.exports = { herkunft, erstelleBremse };
