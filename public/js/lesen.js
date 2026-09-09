/* ═══════════════════════════════════════════════════════════════════════
   lesen.js: Kurzlink, Ordner, Gliederung, Lesefortschritt

   Was aus einem Panel einen lesbaren Text macht: die Gliederung am
   rechten Rand samt Fortschritt, die aufklappbaren Details und die
   Einblendungen beim Scrollen. Dazu der Kurzlink-Endpunkt.

   Teil der früheren app.js. Gemeinsame Helfer kommen aus basis.js, alles
   übrige zwischen den Modulen läuft über LR.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
const LR=window.LR;
const {reduceMotion, $, editorScroll, scroller, stickyOffset, el, esc}=LR;

/* ═══════════════════════════════════
   VORFÜHRUNG: ADRESSE KÜRZEN

   Zeigt die Antwort der Funktion so, wie sie kommt. Die Weiterleitung
   dahinter fehlt mit Absicht, sie steht in der Erklärung darunter, nicht
   auf dieser Domain.
═══════════════════════════════════ */
(function(){
  const eingabe=$('kurzUrl'),knopf=$('kurzBtn'),ausgabe=$('kurzOut');
  if(!eingabe||!knopf||!ausgabe)return;

  function melden(klasse,text){
    ausgabe.innerHTML='<span class="'+klasse+'">'+esc(text)+'</span>';
  }

  async function kuerzen(){
    const url=eingabe.value.trim();
    if(!url){eingabe.focus();return;}

    knopf.disabled=true;
    melden('','… '+I18N.t('demo.kurz.working'));
    try{
      const antwort=await fetch('/api/kurz',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({url:url})
      });
      const daten=await antwort.json().catch(()=>({}));
      if(!antwort.ok){
        melden('err','✗ '+(daten.error||I18N.t('demo.kurz.failed')));
        return;
      }
      ausgabe.innerHTML=
        '<span class="ok">201 Created</span> { "code": "'+esc(daten.code)+'" }'+
        '<br><span style="color:var(--dim)">'+esc(I18N.t('demo.kurz.wouldRedirect'))+
        ' → '+esc(url)+'</span>';
    }catch(e){
      melden('err','✗ '+I18N.t('demo.kurz.offline'));
    }finally{
      knopf.disabled=false;
    }
  }

  knopf.addEventListener('click',kuerzen);
  eingabe.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();kuerzen();}});
})();

/* ═══════════════════════════════════
   ORDNER AUF/ZU
═══════════════════════════════════ */
document.querySelectorAll('.tree-folder').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const open=btn.classList.toggle('open');
    btn.setAttribute('aria-expanded',open?'true':'false');
    const icon=btn.querySelector('.folder-icon');
    if(icon){
      icon.classList.remove('ic-folder','ic-folder-open');
      icon.classList.add(open?'ic-folder-open':'ic-folder');
    }
  });
});

/* ═══════════════════════════════════════════════════════════════
   GLIEDERUNG, LESEFORTSCHRITT UND FALTBARE DETAILS

   Lange Abschnitte sind zum Überfliegen gedacht, nicht zum
   Durchscrollen. Beides wird aus dem vorhandenen Markup erzeugt,
   neue Inhalte brauchen keine zusätzliche Pflege.
═══════════════════════════════════════════════════════════════ */

const OUTLINE_MIN = 3; // ab so vielen Zwischentiteln lohnt sich eine Gliederung

function slug(text, i){
  const base = text.toLowerCase()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  return (base || 'abschnitt') + '-' + i;
}

function buildOutline(panel){
  const content = panel.querySelector('.code-content');
  if(!content || content.querySelector('.outline'))return;
  /* Bereiche, die ihre Gliederung nicht brauchen. Bei den Skills sind die drei
     Zwischentitel ohnehin auf einen Blick zu sehen, die Leiste darüber war
     eine Bedienung, die nichts erschliesst. */
  if(panel.dataset.outline === 'aus')return;

  const heads = Array.from(content.querySelectorAll('h3.ed-h2'));
  if(heads.length < OUTLINE_MIN)return;

  const bar = el('div','read-bar','<span></span>');
  const nav = document.createElement('nav');
  nav.className = 'outline';
  nav.setAttribute('aria-label',I18N.t('outline.navLabel'));
  nav.setAttribute('data-i18n-aria-label','outline.navLabel');
  /* Die Leiste bleibt eine einzige Zeile und läuft bei Bedarf seitwärts.
     Mit Umbruch wuchs sie auf schmaleren Bildschirmen auf drei Zeilen und
     nahm oben dauerhaft über hundert Pixel Lesebereich weg. Die Beschriftung
     "Abschnitt" fällt weg; die Titel darunter sagen von selbst, was sie
     sind, und für Vorleseprogramme steht es weiterhin im aria-label. */
  LR.radSeitwaerts(nav);

  heads.forEach((h,i)=>{
    if(!h.id)h.id = panel.id.replace('panel-','') + '-' + slug(h.textContent, i);
    const a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = h.textContent;
    const hKey = h.getAttribute('data-i18n');
    if(hKey) a.setAttribute('data-i18n', hKey);
    a.dataset.target = h.id;
    nav.appendChild(a);
  });

  // Vor dem ersten Inhalt einhängen
  content.insertBefore(nav, content.firstChild);
  content.insertBefore(bar, nav);

  // Ohne Luft am Ende können die letzten Abschnitte nicht nach oben
  // gescrollt werden, der Sprung dorthin liefe sonst ins Leere.
  content.classList.add('has-outline');
}

/**
 * Abstand eines Titels zum Anfang des Scrollbereichs.
 *
 * Nicht offsetTop verwenden: das misst bis zum nächsten positionierten
 * Vorfahren, nicht bis zum Scrollbereich, und liegt hier um die Höhe von
 * Titel-, Tab- und Pfadleiste daneben. Bei den letzten Abschnitten reichte
 * dieser Versatz aus, damit das Ziel hinter das Scrollende rutschte, und die
 * Knöpfe wirkten dann wirkungslos.
 */
function offsetInScroller(elm){
  const sc = scroller();
  // Beim Fenster als Behälter ist die Oberkante schon der Nullpunkt,
  // beim Editorbereich muss dessen eigene Lage abgezogen werden.
  const nullpunkt = sc === editorScroll ? sc.getBoundingClientRect().top : 0;
  return sc.scrollTop + elm.getBoundingClientRect().top - nullpunkt;
}

// Der Hash gehört der Tab-Navigation, deshalb selbst scrollen statt
// den Browser springen zu lassen.
document.addEventListener('click',e=>{
  const a = e.target.closest('.outline a');
  if(!a)return;
  e.preventDefault();
  const target = $(a.dataset.target);
  if(!target)return;
  const top = Math.max(0, offsetInScroller(target) - stickyOffset());
  scroller().scrollTo({top, behavior: reduceMotion ? 'auto' : 'smooth'});
  target.setAttribute('tabindex','-1');
  target.focus({preventScroll:true});

  // Sofort hervorheben statt auf das Scroll-Ereignis zu warten: nach einem
  // programmatischen Sprung kommt es nicht verlässlich, und schon gar nicht,
  // wenn das Ziel den oberen Rand nicht mehr erreichen kann.
  const group = a.closest('.outline').querySelectorAll('a');
  group.forEach(x=>x.classList.toggle('current', x === a));
});

function updateOutlineState(){
  const panel = document.querySelector('.editor-panel.active');
  if(!panel)return;

  const sc = scroller();

  const bar = panel.querySelector('.read-bar span');
  if(bar){
    const max = sc.scrollHeight - sc.clientHeight;
    bar.style.width = (max > 0 ? Math.min(100, (sc.scrollTop / max) * 100) : 0) + '%';
  }

  const links = panel.querySelectorAll('.outline a');
  if(!links.length)return;

  const atBottom = sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 4;

  let currentId = links[0].dataset.target;
  if(atBottom){
    // Am Ende der Seite gilt der letzte Abschnitt, sonst bliebe er nie
    // hervorgehoben, weil er den oberen Rand nicht mehr erreichen kann.
    currentId = links[links.length-1].dataset.target;
  }else{
    links.forEach(a=>{
      const h = $(a.dataset.target);
      if(h && offsetInScroller(h) - stickyOffset() - 32 <= sc.scrollTop) currentId = a.dataset.target;
    });
  }
  links.forEach(a=>a.classList.toggle('current', a.dataset.target === currentId));

  /* Die Leiste ist eine einzige Zeile: bei vielen Titeln liegt die gerade
     gelesene Marke leicht ausserhalb des sichtbaren Streifens und wird
     nachgezogen. scrollIntoView() macht das nicht rein waagrecht: die
     Leiste steht sticky ganz oben im Panel, ihre eigentliche (nicht
     angeheftete) Position liegt aber ganz am Anfang des Inhalts. Beim
     Sprung zu einem weiter unten liegenden Abschnitt zog scrollIntoView()
     dadurch den ganzen Editorbereich zurück Richtung Anfang, im Wettlauf
     mit dem gerade laufenden Scrollen dorthin – bei kurzen Panels kaum
     spürbar, bei längeren wie „Interessen" oder „Gestaltung & Technik"
     blieb der Sprung dadurch praktisch wirkungslos. Nur scrollLeft der
     Leiste selbst zu verschieben trifft das ohne diesen Nebeneffekt. */
  const currentA = panel.querySelector('.outline a.current');
  if(currentA){
    const nav = currentA.closest('.outline');
    const navRect = nav.getBoundingClientRect(), aRect = currentA.getBoundingClientRect();
    if(aRect.left < navRect.left) nav.scrollLeft -= (navRect.left - aRect.left);
    else if(aRect.right > navRect.right) nav.scrollLeft += (aRect.right - navRect.right);
  }
}
// Der Scroll-Listener dazu steht weiter unten gebündelt (onEditorScroll).

/* ── Ausführliches einklappen ──
   Sichtbar bleibt, was zum Überfliegen reicht: Art des Projekts, Titel,
   Abstract, Bilder, die eigene Rolle, der Stack und die Verweise. Der
   lange Fliesstext und die restlichen Details, also Gelerntes und was ich heute
   anders mache, wandern hinter einen Schalter.

   Der Grund: die Details waren mit Abstand der längste Block einer Karte,
   bei manchen Projekten fast die Hälfte der Höhe. Zehn Karten mit je
   drei Absätzen nebeneinander liest niemand; man sucht erst das Projekt
   und liest dann eines. Verloren geht nichts, es ist einen Klick weit weg
   und steht beim Drucken ohnehin wieder offen. */
let foldCounter = 0;
function buildFolds(panel){
  panel.querySelectorAll('.proj-card:not([data-folded])').forEach(karte=>{
    const body = karte.querySelector('.proj-body');
    const meta = karte.querySelector('.proj-meta');
    if(!body && !meta) return;
    karte.setAttribute('data-folded','1');
    const id = 'fold-' + (++foldCounter);

    const wrap = el('div','fold');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fold-btn';
    btn.setAttribute('aria-expanded','false');
    btn.setAttribute('aria-controls',id);
    btn.innerHTML = '<span class="fold-arrow" aria-hidden="true">▶</span><span data-i18n="chrome.detailed">'+I18N.t('chrome.detailed')+'</span>';

    const holder = el('div','fold-body');
    holder.id = id;
    holder.hidden = true;

    // Der Schalter sitzt hinter der sichtbaren Zeile mit der Rolle, damit
    // die Reihenfolge stimmt: erst was bleibt, dann was sich öffnet.
    const anker = meta || body;
    anker.parentNode.insertBefore(wrap, anker.nextSibling);
    wrap.appendChild(btn);
    wrap.appendChild(holder);
    if(body) holder.appendChild(body);

    // Von den Details bleibt die erste Zeile stehen, das ist die Rolle,
    // und die ist für einen Betrieb die wichtigste Angabe der Karte.
    if(meta){
      const zeilen = [...meta.children];
      if(zeilen.length > 1){
        const rest = el('dl','proj-meta');
        zeilen.slice(1).forEach(z=>rest.appendChild(z));
        holder.appendChild(rest);
      }
    }
  });
}

/* Ein Umschalter für alle Faltungen: die erzeugten oben und die, die
   direkt im HTML stehen (Impressum). */
document.addEventListener('click',e=>{
  const btn=e.target.closest('.fold-btn');
  if(!btn)return;
  const body=document.getElementById(btn.getAttribute('aria-controls'));
  if(!body)return;
  const offen=btn.getAttribute('aria-expanded')==='true';
  btn.setAttribute('aria-expanded',offen?'false':'true');
  body.hidden=offen;
});

/* Mailadresse in die Zwischenablage. Der moderne Weg braucht eine sichere
   Verbindung und ein Fenster im Vordergrund; scheitert er, wird der alte
   Weg über ein verstecktes Feld versucht, erst dann gilt es als
   fehlgeschlagen. */
async function inZwischenablage(text){
  if(navigator.clipboard&&window.isSecureContext){
    try{await navigator.clipboard.writeText(text);return true;}catch(err){/* weiter unten */}
  }
  try{
    const feld=document.createElement('textarea');
    feld.value=text;feld.setAttribute('readonly','');
    feld.style.cssText='position:fixed;top:-1000px';
    document.body.appendChild(feld);
    feld.select();
    const ok=document.execCommand('copy');
    document.body.removeChild(feld);
    return ok;
  }catch(err){return false;}
}

document.addEventListener('click',async e=>{
  const btn=e.target.closest('[data-adresse]');
  if(!btn)return;
  const ok=await inZwischenablage(btn.dataset.adresse);
  const alt=btn.dataset.text||btn.textContent;
  btn.dataset.text=alt;
  btn.textContent=ok?I18N.t('kontakt.copied'):I18N.t('kontakt.copyFailed');
  btn.classList.toggle('btn-ok',ok);
  clearTimeout(btn._zurueck);
  btn._zurueck=setTimeout(()=>{btn.textContent=alt;btn.classList.remove('btn-ok');},1800);
});

/* ═══════════════════════════════════
   SCROLL REVEAL

   Vorher lief bei jedem einzelnen Scroll-Pixel ein querySelectorAll über
   das ganze Dokument, und für jedes gefundene Element wurde
   getBoundingClientRect() aufgerufen, bei 62 Elementen also 62 erzwungene
   Layoutberechnungen pro Ereignis.

   Ein IntersectionObserver macht dasselbe, aber der Browser rechnet es
   selbst und meldet sich nur, wenn ein Element tatsächlich sichtbar wird.
   Kein Scroll-Listener nötig.
═══════════════════════════════════ */
const revealObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries,obs)=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        entry.target.classList.add('in');
        obs.unobserve(entry.target); // einmal eingeblendet, bleibt eingeblendet
      });
        // root:null heisst Sichtfeld. Das stimmt in beiden Faellen: scrollt der
    // Editorbereich, schneidet er seinen Inhalt ohnehin ab, und der
    // Beobachter rechnet diese Beschneidung mit ein.
    },{rootMargin:'0px 0px -5% 0px'})
  : null;

/** Nimmt alle noch nicht eingeblendeten Elemente in Beobachtung.
 *  Wird nach jedem Tabwechsel aufgerufen, weil dann neue Panels im
 *  sichtbaren Bereich stehen. */
function initReveals(){
  const targets=document.querySelectorAll('.reveal:not(.in),.tl-e:not(.in)');
  if(!revealObserver){
    // Sehr alter Browser: dann eben sofort alles zeigen, statt es zu verstecken.
    targets.forEach(el=>el.classList.add('in'));
    return;
  }
  targets.forEach(el=>revealObserver.observe(el));
}

/* ═══════════════════════════════════
   SCROLL-EREIGNISSE

   Statt mehrerer Listener, die unabhängig voneinander bei jedem Pixel
   feuern, gibt es einen einzigen. Er sammelt die Aufgaben und führt sie
   gebündelt im nächsten Animationsbild aus (requestAnimationFrame),
   also höchstens einmal pro Bildwiederholung statt dutzende Male.

   Andere Skripte hängen sich mit onEditorScroll(fn) ein, damit nicht
   jedes seinen eigenen Listener mitbringt.
═══════════════════════════════════ */
const scrollJobs=[];
let scrollScheduled=false;

function onEditorScroll(fn){
  scrollJobs.push(fn);
}

function scrollAngestossen(){
  if(scrollScheduled)return;
  scrollScheduled=true;
  requestAnimationFrame(()=>{
    scrollScheduled=false;
    scrollJobs.forEach(fn=>fn());
  });
}

// Beide Quellen: am Schreibtisch meldet sich der Editorbereich, auf
// schmalen Schirmen das Fenster. Welche davon feuert, entscheidet das
// Layout — hier lauschen kostet nichts und erspart eine Fallunterscheidung.
editorScroll.addEventListener('scroll',scrollAngestossen,{passive:true});
window.addEventListener('scroll',scrollAngestossen,{passive:true});

onEditorScroll(updateOutlineState);

Object.assign(LR,{buildOutline, buildFolds, updateOutlineState, 
  initReveals, onEditorScroll});

})();
