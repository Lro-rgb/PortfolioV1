/* ═══════════════════════════════════════════════════════════════════════
   i18n.js: Sprachumschaltung Deutsch / Englisch

   Wörterbuch-Ansatz: jedes übersetzbare Element trägt data-i18n="key"
   (für innerHTML) oder data-i18n-<attribut>="key" (für aria-label, title,
   placeholder, alt, content). apply() liest bei jedem Sprachwechsel alle
   passenden Elemente neu ein, auch später per JS erzeugte, z.B. die
   Gliederung oder die "Ausführlich"-Schalter bei den Projekten.

   Muss vor den Modulen geladen werden: sie rufen I18N.t() an mehreren
   Stellen auf (Login, Terminal, Kommandopalette, ...).

   Die Wörterbücher stehen nicht hier, sondern in i18n.de.js und
   i18n.en.js, und melden sich mit I18N.registriere() an. Geladen wird nur,
   was gebraucht wird: die deutsche Fassung steht ohnehin schon im HTML,
   die englische kommt erst, wenn jemand umschaltet oder mit ?lang=en
   ankommt. Das spart beim ersten Besuch die Hälfte des Wörterbuchs.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';


  /* Die Wörterbücher legen sich selbst hier ab, sobald ihre Datei geladen
     ist. Deutsch ist beim ersten Zeichnen da, Englisch kann fehlen. */
  var translations = {};
  window.I18N_TRANSLATIONS = translations;

  var gestartet = false;

  function registriere(sprache, woerter) {
    translations[sprache] = woerter;
    /* Der erste Aufruf ist immer der deutsche und zugleich der Startschuss:
       vorher gibt es kein Wörterbuch, und applyLang hätte nichts, womit es
       arbeiten könnte. */
    if (!gestartet && sprache === "de") starte();
  }

  /* Nachladen einer Sprache. Ein <script>-Element und kein fetch(), weil
     die Datei ohnehin als Skript ausgeführt wird und so auch aus dem
     Zwischenspeicher kommen kann. Klappt es nicht, bleibt es bei der
     aktuellen Sprache — lieber alles auf Deutsch als eine Seite mit halb
     ersetzten Beschriftungen. */
  var amLaden = {};
  function ladeSprache(sprache, fertig) {
    if (translations[sprache]) return fertig(true);
    if (amLaden[sprache]) return amLaden[sprache].push(fertig);
    amLaden[sprache] = [fertig];
    var skript = document.createElement("script");
    skript.src = "js/i18n." + sprache + ".js";
    skript.onload = skript.onerror = function () {
      var da = !!translations[sprache];
      var wartende = amLaden[sprache];
      amLaden[sprache] = null;
      wartende.forEach(function (fn) { fn(da); });
    };
    document.head.appendChild(skript);
  }

  var ATTR_MAP = ["aria-label", "title", "placeholder", "alt", "content"];

  /* Die Sprache steht auch in der Adresse (?lang=en), nicht nur im
     localStorage. Zwei Gründe: ein Verweis auf die englische Fassung lässt
     sich so verschicken, und Suchmaschinen bekommen überhaupt erst eine
     eigene Adresse zum Erfassen — vorher lag der englische Inhalt hinter
     einem Schalter und war von aussen unsichtbar. Die Adresse gewinnt gegen
     den Speicher: wer den Verweis anklickt, will diese Sprache sehen. */
  function langAusAdresse() {
    try {
      var l = new URLSearchParams(location.search).get("lang");
      if (l === "de" || l === "en") return l;
    } catch (e) { /* sehr alter Browser ohne URLSearchParams */ }
    return null;
  }

  function getLang() {
    var ausAdresse = langAusAdresse();
    if (ausAdresse) return ausAdresse;
    try {
      var l = localStorage.getItem("lang");
      if (l === "de" || l === "en") return l;
    } catch (e) { /* privater Modus */ }
    return "de";
  }

  /* Adresse und massgebliche Adresse (canonical) der Sprache nachziehen.
     Ohne das zweite zeigte canonical bei ?lang=en weiter auf die deutsche
     Startseite, und Suchmaschinen würfen beide Fassungen wieder zusammen. */
  var BASIS = "https://luis-rosado.ch/";

  function adresseNachziehen() {
    var ziel = currentLang === "en" ? BASIS + "?lang=en" : BASIS;
    var kanonisch = document.querySelector('link[rel="canonical"]');
    if (kanonisch) kanonisch.setAttribute("href", ziel);

    var lokal = document.querySelector('meta[property="og:locale"]');
    if (lokal) lokal.setAttribute("content", currentLang === "en" ? "en" : "de_CH");

    // Im Adressfeld nur den Parameter tauschen, Sprungmarke (#projekte)
    // und alles andere bleiben stehen.
    try {
      var url = new URL(location.href);
      if (currentLang === "en") url.searchParams.set("lang", "en");
      else url.searchParams.delete("lang");
      if (url.href !== location.href) history.replaceState(history.state, "", url.href);
    } catch (e) { /* sehr alter Browser */ }
  }

  function setStoredLang(l) {
    try { localStorage.setItem("lang", l); } catch (e) { /* privater Modus */ }
  }

  var currentLang = getLang();

  function t(key) {
    /* Das leere Objekt am Ende ist kein Zierrat: bleibt i18n.de.js unterwegs
       hängen, liefert t() dann leere Zeichenketten statt die Seite mit einem
       Fehler anzuhalten. Im HTML steht der deutsche Text ohnehin schon. */
    var dict = translations[currentLang] || translations.de || {};
    if (Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
    var de = translations.de;
    if (Object.prototype.hasOwnProperty.call(de, key)) return de[key];
    return "";
  }

  function applyLang() {
    var dict = translations[currentLang] || translations.de || {};
    document.documentElement.lang = currentLang;
    adresseNachziehen();

    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var elNode = nodes[i];
      var key = elNode.getAttribute("data-i18n");
      if (Object.prototype.hasOwnProperty.call(dict, key)) {
        elNode.innerHTML = dict[key];
      }
    }

    ATTR_MAP.forEach(function (attr) {
      var els = document.querySelectorAll("[data-i18n-" + attr + "]");
      for (var j = 0; j < els.length; j++) {
        var e = els[j];
        var k = e.getAttribute("data-i18n-" + attr);
        if (Object.prototype.hasOwnProperty.call(dict, k)) {
          e.setAttribute(attr, dict[k]);
        }
      }
    });

    var btn = document.getElementById("langToggle");
    if (btn) btn.textContent = currentLang.toUpperCase();

    try {
      document.dispatchEvent(new CustomEvent("lr:langchange", { detail: { lang: currentLang } }));
    } catch (e) { /* sehr alter Browser ohne CustomEvent-Konstruktor */ }
  }

  function setLang(l) {
    if (l !== "de" && l !== "en") return;
    if (l === currentLang && translations[l]) return;
    ladeSprache(l, function (da) {
      if (!da) return;
      currentLang = l;
      setStoredLang(l);
      applyLang();
    });
  }

  function toggleLang() {
    setLang(currentLang === "de" ? "en" : "de");
  }

  window.I18N = {
    t: t,
    lang: function () { return currentLang; },
    setLang: setLang,
    toggle: toggleLang,
    apply: applyLang,
    registriere: registriere,
    translations: translations
  };

  /* Gestartet wird immer auf Deutsch: so steht es im HTML, und so muss
     nichts ersetzt werden, bevor die Seite das erste Mal zu sehen ist.
     Wer zuletzt Englisch gewählt hat oder mit ?lang=en kommt, bekommt das
     Wörterbuch gleich danach nachgeliefert. Aufgerufen wird das nicht hier,
     sondern von registriere(), sobald das deutsche Wörterbuch da ist. */
  function starte() {
    gestartet = true;
    var gewuenscht = currentLang;
    currentLang = "de";
    applyLang();
    if (gewuenscht !== "de") setLang(gewuenscht);
  }
  var toggleBtn = document.getElementById("langToggle");
  if (toggleBtn) toggleBtn.addEventListener("click", toggleLang);
})();
