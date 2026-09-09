/* ═══════════════════════════════════════════════════════════════════════
   basis.js: Konstanten und Helfer, die alle brauchen

   Zuerst geladen. Legt LR an, das gemeinsame Fach, in das jedes Modul
   hineinlegt, was die anderen von ihm brauchen. Alles andere hier drin
   sind Kleinigkeiten, die sonst in jeder Datei noch einmal stünden:
   $(), el(), esc(), die Frage nach dem scrollenden Element.

   Teil der früheren app.js. Gemeinsame Helfer kommen aus basis.js, alles
   übrige zwischen den Modulen läuft über LR.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
window.LR=window.LR||{};
const LR=window.LR;

/* ═══════════════════════════════════
   KONSTANTEN
═══════════════════════════════════ */
// Dient nur noch als Liste der gültigen Panel-Namen (Deep-Linking).
const LANG={home:'JSON',skills:'Python',techstack:'TypeScript',projekte:'HTML',interessen:'JSON',kontakt:'SQL',readme:'Markdown',noten:'CSV',cv:'Markdown'};
const LOCKED=['noten','cv'];
const MOBILE=window.matchMedia('(max-width: 820px)');

const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;


const $=id=>document.getElementById(id);

const editorScroll=$('editorScroll');

/* Wer scrollt gerade?

   Am Schreibtisch ist der Editorbereich selbst der Scroll-Behälter, die
   Seite steht fest. Auf schmalen Schirmen wächst die Seite dagegen mit
   (siehe .ide in vscode.css), und dann scrollt das Fenster, nicht der
   Editor. Alles, was den Scrollstand liest oder setzt, muss deshalb erst
   fragen, wer hier zuständig ist — sonst greift es auf dem Handy ins
   Leere: scrollTop bleibt 0, der Lesefortschritt steht still und die
   Gliederungsleiste springt nicht.

   Geprueft wird die Tatsache statt der Bildschirmbreite: so bleibt die
   Antwort richtig, ohne den Umbruchpunkt aus dem CSS hier zu wiederholen. */
function scroller(){
  return editorScroll.scrollHeight > editorScroll.clientHeight + 1
    ? editorScroll
    : (document.scrollingElement || document.documentElement);
}

/* Hoehe der angehefteten Leisten. Ein Sprungziel muss so weit unter den
   oberen Rand, dass es nicht dahinter verschwindet. Am Schreibtisch
   liegen Titel- und Tableiste ausserhalb des Scroll-Behälters, dort
   genuegt der bisherige Abstand. */
function stickyOffset(){
  if(scroller() === editorScroll) return 64;
  const tb = document.querySelector('.titlebar');
  const tabs = document.querySelector('.tabbar');
  return (tb ? tb.offsetHeight : 0) + (tabs ? tabs.offsetHeight : 0) + 12;
}
const sidebar=$('sidebar');
const backdrop=$('sbBackdrop');
const sbToggle=$('sbToggle');
const overlay=$('loginOverlay');

function el(tag,cls,html){
  const n=document.createElement(tag);
  if(cls)n.className=cls;
  if(html!=null)n.innerHTML=html;
  return n;
}

// Fremde Werte landen im DOM, vor dem Einsetzen entschärfen.
function esc(v){
  return String(v==null?'':v)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

Object.assign(LR,{LANG, LOCKED, MOBILE, reduceMotion, $, editorScroll, 
  scroller, stickyOffset, sidebar, backdrop, sbToggle, overlay, el, esc});

})();
