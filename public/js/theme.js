// public/js/theme.js
// Muss vor dem ersten Zeichnen laufen, deshalb im <head> und ohne defer:
// steht das gewählte Design erst später am Dokument, blitzt beim Laden
// kurz das helle Standarddesign auf.
//
// Früher stand dieser Block direkt im HTML. Er ist hier herausgezogen,
// damit die Sicherheitsregel (Content-Security-Policy in vercel.json) keine
// Skripte mehr im Dokument selbst erlauben muss.
(function () {
  try {
    var t = localStorage.getItem('lr_theme');
    if (t) document.documentElement.setAttribute('data-theme', t);
  } catch (e) { /* privater Modus: dann gilt das Standarddesign */ }
})();

/* Devicon-Stylesheet freischalten. Es hängt mit media="print" im <head>,
   damit es das erste Zeichnen nicht aufhält; sobald es geladen ist, gilt
   es für alle Medien. Das stand früher als onload-Attribut am <link>,
   was die Sicherheitsregel (script-src ohne 'unsafe-inline') nicht mehr
   zulässt. Der zweite Zweig fängt den Fall ab, dass die Datei schon aus
   dem Zwischenspeicher da war, bevor dieser Lauscher stand. */
(function () {
  var css = document.getElementById('deviconCss');
  if (!css) return;
  function freigeben() { css.media = 'all'; }
  css.addEventListener('load', freigeben);
  document.addEventListener('DOMContentLoaded', function () {
    if (css.sheet) freigeben();
  });
})();
