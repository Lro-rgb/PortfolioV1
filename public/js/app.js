/* ═══════════════════════════════════
   KONSTANTEN
═══════════════════════════════════ */
// Dient nur noch als Liste der gültigen Panel-Namen (Deep-Linking).
const LANG={home:'JSON',skills:'Python',techstack:'TypeScript',projekte:'HTML',interessen:'JSON',kontakt:'SQL',readme:'Markdown',noten:'CSV',cv:'Markdown'};
const LOCKED=['noten','cv'];
const LINE_H=31;
const MOBILE=window.matchMedia('(max-width: 820px)');

const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let token=sessionStorage.getItem('lr_token')||null;
let pendingPanel=null;
let lastFocusedBeforeLogin=null;

const $=id=>document.getElementById(id);

const editorScroll=$('editorScroll');
const sidebar=$('sidebar');
const backdrop=$('sbBackdrop');
const sbToggle=$('sbToggle');
const overlay=$('loginOverlay');

/* ═══════════════════════════════════
   SPLASH SCREEN
   Läuft nur beim ersten Besuch pro Browser-Sitzung. Wer die Seite neu lädt
   oder Bewegung reduziert haben will, landet sofort im Editor.
═══════════════════════════════════ */
(function(){
  const splash=$('splash');
  const alreadySeen=sessionStorage.getItem('lr_splash')==='1';

  function finish(instant){
    sessionStorage.setItem('lr_splash','1');
    if(instant){
      splash.style.display='none';
      $('ide').classList.add('visible');
      // Bewusst erst im nächsten Tick: beim Wiederbesuch wird der Splash
      // übersprungen, und dieser Zweig läuft dann noch mitten im ersten
      // Skriptdurchlauf. Alles, was weiter unten per const deklariert ist,
      // wäre zu diesem Zeitpunkt noch in der temporalen Todzone.
      setTimeout(startApp,0);
      return;
    }
    splash.classList.add('fade');
    $('ide').classList.add('visible');
    setTimeout(()=>{splash.style.display='none';startApp();},500);
  }

  if(alreadySeen||reduceMotion){finish(true);return;}

  const files=[
    'Lade Erweiterungen...','luis.json','skills.py','techstack.ts','projekte.html',
    'interessen.json','kontakt.sql','unterlagen/noten.csv','unterlagen/lebenslauf.md','Bereit.'
  ];
  const el=$('splashFiles'),fill=$('splashFill'),pct=$('splashPct'),lbl=$('splashLabel');
  let i=0,timer=null,done=false;

  function skip(){
    if(done)return;
    done=true;
    clearTimeout(timer);
    finish(true);
  }
  $('splashSkip').addEventListener('click',skip);
  document.addEventListener('keydown',function onKey(e){
    if(done){document.removeEventListener('keydown',onKey);return;}
    if(e.key==='Enter'||e.key==='Escape'||e.key===' '){e.preventDefault();skip();}
  });

  function step(){
    if(done)return;
    if(i>=files.length){
      timer=setTimeout(()=>{if(!done){done=true;finish(false);}},300);
      return;
    }
    const div=document.createElement('div');
    div.className='splash-file active';
    div.textContent='  '+files[i];
    el.appendChild(div);
    if(el.children.length>1)el.children[el.children.length-2].className='splash-file done';
    const p=Math.round((i/(files.length-1))*100);
    fill.style.width=p+'%';
    pct.textContent=p+'%';
    lbl.textContent=i===0?'Initialisiere...':i===files.length-1?'Bereit':'Öffne '+files[i];
    i++;
    timer=setTimeout(step,i===1?400:180);
  }
  step();
})();

/* ═══════════════════════════════════
   TABS & PANELS
═══════════════════════════════════ */
function tabEl(name){return document.querySelector('.tab[data-panel="'+name+'"]');}
function isLocked(name){return LOCKED.indexOf(name)!==-1;}
function isOpen(name){const t=tabEl(name);return !!t&&!t.classList.contains('closed');}
function openTabNames(){
  return Array.from(document.querySelectorAll('.tab:not(.closed)')).map(t=>t.dataset.panel);
}
/**
 * Tabs, auf die gerade ohne Login umgeschaltet werden darf.
 * Die gesperrten Tabs haben keinen Schliessen-Button und gelten damit
 * immer als "offen" — ohne diesen Filter würde das Schliessen des letzten
 * sichtbaren Tabs ungefragt den Login-Dialog aufreissen.
 */
function switchableTabs(){
  const authed=!!(token&&verifyToken());
  return openTabNames().filter(n=>authed||!isLocked(n));
}

/**
 * Öffnet einen Tab. Gesperrte Tabs verlangen vorher ein gültiges Token —
 * ohne das wird der Login-Dialog gezeigt und die Auswahl gemerkt.
 */
function openTab(name,opts){
  opts=opts||{};
  const tab=tabEl(name);
  if(!tab)return;

  if(isLocked(name)&&!(token&&verifyToken())){
    pendingPanel=name;
    showLogin();
    return;
  }

  tab.classList.remove('closed');

  document.querySelectorAll('.tab').forEach(t=>{
    const on=t===tab;
    t.classList.toggle('active',on);
    t.setAttribute('aria-selected',on?'true':'false');
    t.setAttribute('tabindex',on?'0':'-1');
  });
  document.querySelectorAll('.editor-panel').forEach(p=>p.classList.remove('active'));
  $('panel-'+name).classList.add('active');

  document.querySelectorAll('.tree-file').forEach(f=>f.classList.toggle('active',f.dataset.open===name));

  setEmptyState(false);
  const panel=$('panel-'+name);
  buildFolds(panel);
  buildOutline(panel);
  buildLn(name);
  editorScroll.scrollTop=0;
  updateOutlineState();
  initReveals();
  setHash(name);
  closeDrawer(); // auf dem Handy die Schublade nach der Auswahl schliessen

  if(opts.focusTab!==false&&opts.fromKeyboard)tab.focus();
  if(isLocked(name))loadProtected(name);
}

/** Schliesst einen Tab wie im Editor. Wieder öffnen geht über den Explorer. */
function closeTab(name){
  const tab=tabEl(name);
  if(!tab||tab.classList.contains('closed'))return;
  const wasActive=tab.classList.contains('active');
  const idx=switchableTabs().indexOf(name);

  tab.classList.add('closed');
  tab.classList.remove('active');
  tab.setAttribute('aria-selected','false');
  tab.setAttribute('tabindex','-1');
  $('panel-'+name).classList.remove('active');

  if(!wasActive)return;

  const rest=switchableTabs();
  if(rest.length){
    openTab(rest[Math.min(Math.max(idx,0),rest.length-1)]);
  }else{
    setEmptyState(true);
  }
}

function reopenAll(){
  document.querySelectorAll('.tab.closed').forEach(t=>t.classList.remove('closed'));
  openTab('home');
}

/** Leerer Editor, wenn wirklich alle Tabs zu sind (auch mobil erreichbar). */
function setEmptyState(on){
  $('editorEmpty').hidden=!on;
  if(on){
    document.querySelectorAll('.editor-panel').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.tree-file').forEach(f=>f.classList.remove('active'));
    setHash('home'); // kein Verweis auf einen Tab, der gerade nicht offen ist
  }
}

/* ── Tabbar: Klick + Tastatur (Pfeiltasten wie in echten Tab-Leisten) ── */
$('tabbar').addEventListener('click',e=>{
  const x=e.target.closest('.tab-x');
  if(x){e.stopPropagation();closeTab(x.closest('.tab').dataset.panel);return;}
  const tab=e.target.closest('.tab');
  if(tab)openTab(tab.dataset.panel);
});

$('tabbar').addEventListener('keydown',e=>{
  const tab=e.target.closest('.tab');
  if(!tab)return;

  if(e.target.classList.contains('tab-x'))return; // Button regelt sich selbst

  if(e.key==='Enter'||e.key===' '){
    e.preventDefault();
    openTab(tab.dataset.panel);
    return;
  }
  if(e.key==='Delete'||(e.key==='w'&&(e.ctrlKey||e.metaKey))){
    e.preventDefault();
    closeTab(tab.dataset.panel);
    return;
  }

  const tabs=Array.from(document.querySelectorAll('.tab:not(.closed)'));
  const i=tabs.indexOf(tab);
  if(i===-1)return;
  let next=null;
  if(e.key==='ArrowRight')next=tabs[(i+1)%tabs.length];
  else if(e.key==='ArrowLeft')next=tabs[(i-1+tabs.length)%tabs.length];
  else if(e.key==='Home')next=tabs[0];
  else if(e.key==='End')next=tabs[tabs.length-1];
  if(next){
    e.preventDefault();
    openTab(next.dataset.panel,{fromKeyboard:true});
  }
});

/* ── Explorer & alle anderen [data-open]-Auslöser ── */
document.addEventListener('click',e=>{
  const trigger=e.target.closest('[data-open]');
  if(trigger)openTab(trigger.dataset.open);
});

$('reopenAll').addEventListener('click',reopenAll);

/* ═══════════════════════════════════
   DEEP LINKING  (#projekte lässt sich verschicken)
═══════════════════════════════════ */
function currentHashPanel(){
  const n=location.hash.replace('#','');
  return LANG[n]?n:'home';
}

/**
 * Adresse an den offenen Tab angleichen.
 *
 * Bewusst replaceState statt "location.hash = …": eine Zuweisung an
 * location.hash stellt ein hashchange-Event in die Warteschlange, das erst
 * nach dem aktuellen Skriptdurchlauf ankommt. Wer den letzten Tab schliesst,
 * bekäme dann kurz darauf genau diesen Tab wieder aufgerissen.
 * replaceState schreibt die Adresse, ohne ein Event auszulösen.
 */
function setHash(name){
  if(currentHashPanel()===name)return;
  const url=location.pathname+location.search+(name==='home'?'':'#'+name);
  try{
    history.replaceState(null,'',url);
  }catch(e){
    // Beim Öffnen als lokale Datei oder in einer Vorschau-Ansicht lehnen
    // manche Browser replaceState ab. Die Adresse ist dann nur Beiwerk —
    // ein Fehler hier darf nicht den Rest der Navigation abbrechen.
  }
}

// Bleibt für von Hand geänderte Adressen zuständig — eigene Änderungen
// laufen über replaceState und lösen hier nichts aus.
window.addEventListener('hashchange',()=>{
  const name=currentHashPanel();
  const active=document.querySelector('.tab.active');
  if(active&&active.dataset.panel===name)return;
  openTab(name);
});

/* ═══════════════════════════════════
   EXPLORER-SCHUBLADE (nur schmale Bildschirme)

   Auf dem Handy hat die Sidebar keinen Platz neben dem Editor. Statt sie
   ersatzlos auszublenden — dort stehen die Ordnerstruktur und die
   gesperrten Dateien — fährt sie über einen Schalter in der Titelleiste
   als Schublade aus.
═══════════════════════════════════ */
let focusBeforeDrawer=null;

function drawerOpen(){return sidebar.classList.contains('open');}

function openDrawer(){
  if(!MOBILE.matches||drawerOpen())return;
  focusBeforeDrawer=document.activeElement;
  sidebar.classList.add('open');
  backdrop.hidden=false;
  sbToggle.setAttribute('aria-expanded','true');
  sbToggle.querySelector('.vh').textContent='Explorer schliessen';
  const first=sidebar.querySelector('.tree-folder, .tree-file');
  if(first)setTimeout(()=>first.focus(),reduceMotion?0:220);
}

function closeDrawer(){
  if(!drawerOpen())return;
  sidebar.classList.remove('open');
  backdrop.hidden=true;
  sbToggle.setAttribute('aria-expanded','false');
  sbToggle.querySelector('.vh').textContent='Explorer öffnen';
  // Fokus nur zurückholen, wenn er noch in der Schublade steckt —
  // sonst würde ein Klick auf eine Datei den Fokus wieder wegreissen.
  if(sidebar.contains(document.activeElement)){
    (focusBeforeDrawer&&document.contains(focusBeforeDrawer)?focusBeforeDrawer:sbToggle).focus();
  }
  focusBeforeDrawer=null;
}

sbToggle.addEventListener('click',()=>{drawerOpen()?closeDrawer():openDrawer();});
backdrop.addEventListener('click',closeDrawer);
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&drawerOpen()&&!overlay.classList.contains('show'))closeDrawer();
});
// Beim Wechsel zurück auf ein breites Fenster darf kein halber Zustand bleiben.
// addListener ist der Rückfall für ältere Safari-Versionen, die
// addEventListener auf MediaQueryList noch nicht kennen.
(function(){
  const onChange=e=>{if(!e.matches)closeDrawer();};
  if(MOBILE.addEventListener)MOBILE.addEventListener('change',onChange);
  else if(MOBILE.addListener)MOBILE.addListener(onChange);
})();

/* ═══════════════════════════════════════════════════════════════
   MEDIEN  —  Video, Screenshots, Downloads

   Alles läuft über die beiden Objekte unten. Was hier nicht
   eingetragen ist, wird auch nicht gerendert: keine leeren Player,
   keine toten Verweise, kein "kommt noch".

   Neue Datei einbinden:
     1. Datei nach public/media/ legen
     2. Hier beim passenden Projekt eintragen
   Mehr ist nicht nötig — die Anzeige baut sich daraus auf.
═══════════════════════════════════════════════════════════════ */

// Kurzvorstellung als Audio auf der Startseite.
//   intro:{ src:'media/vorstellung.m4a', titel:'…', dauer:'0:45', text:'…' }
const AUDIO={};

// Pro Projekt: video, shots (Screenshots), downloads.
//   askel:{
//     video:{src:'media/askel.mp4', poster:'media/askel-poster.jpg',
//            titel:'Askel zeichnet eine Route auf', dauer:'1:10'},
//     shots:[{src:'media/askel-1.jpg', alt:'Startbildschirm mit Routenliste'}],
//     downloads:[{href:'media/askel-doku.pdf', label:'Projektdokumentation', meta:'PDF · 1,2 MB'}]
//   }
const MEDIA={};

function el(tag,cls,html){
  const n=document.createElement(tag);
  if(cls)n.className=cls;
  if(html!=null)n.innerHTML=html;
  return n;
}

function renderAudio(){
  document.querySelectorAll('[data-audio]').forEach(box=>{
    const cfg=AUDIO[box.dataset.audio];
    box.innerHTML='';
    if(!cfg||!cfg.src)return;
    const wrap=el('div','audio-card');
    wrap.appendChild(el('div','audio-head',
      '<span class="audio-ic" aria-hidden="true">▶</span>'+
      '<span class="audio-title">'+esc(cfg.titel||'Kurzvorstellung')+'</span>'+
      (cfg.dauer?'<span class="audio-dur">'+esc(cfg.dauer)+'</span>':'')));
    const a=document.createElement('audio');
    a.controls=true;a.preload='none';a.src=cfg.src;
    a.textContent='Ihr Browser kann diese Audiodatei nicht abspielen.';
    wrap.appendChild(a);
    if(cfg.text)wrap.appendChild(el('p','audio-text',esc(cfg.text)));
    box.appendChild(wrap);
  });
}

function renderProjectMedia(){
  document.querySelectorAll('[data-media]').forEach(box=>{
    const cfg=MEDIA[box.dataset.media];
    box.innerHTML='';
    if(!cfg)return;

    if(cfg.video&&cfg.video.src){
      const v=document.createElement('video');
      v.controls=true;v.preload='metadata';v.playsInline=true;
      v.className='proj-video';
      if(cfg.video.poster)v.poster=cfg.video.poster;
      v.src=cfg.video.src;
      v.textContent='Ihr Browser kann dieses Video nicht abspielen.';
      const fig=el('figure','media-figure');
      fig.appendChild(v);
      if(cfg.video.titel){
        fig.appendChild(el('figcaption','media-cap',
          esc(cfg.video.titel)+(cfg.video.dauer?' <span class="media-dur">'+esc(cfg.video.dauer)+'</span>':'')));
      }
      box.appendChild(fig);
    }

    if(cfg.shots&&cfg.shots.length){
      const grid=el('div','shot-grid');
      cfg.shots.forEach((s,i)=>{
        const b=el('button','shot');
        b.type='button';
        b.setAttribute('aria-label','Screenshot vergrössern: '+(s.alt||('Bild '+(i+1))));
        b.dataset.group=box.dataset.media;
        b.dataset.index=String(i);
        const img=document.createElement('img');
        img.src=s.src;img.alt=s.alt||'';img.loading='lazy';img.decoding='async';
        b.appendChild(img);
        grid.appendChild(b);
      });
      box.appendChild(grid);
    }

    if(cfg.downloads&&cfg.downloads.length){
      const list=el('div','dl-list');
      cfg.downloads.forEach(d=>{
        const a=document.createElement('a');
        a.className='dl-item';a.href=d.href;a.download='';
        a.innerHTML='<span class="dl-ic" aria-hidden="true">⭳</span><span class="dl-label">'+
          esc(d.label)+'</span>'+(d.meta?'<span class="dl-meta">'+esc(d.meta)+'</span>':'');
        list.appendChild(a);
      });
      box.appendChild(list);
    }
  });
}

/* ── Screenshots in Vollansicht ── */
const lightbox=$('lightbox');
let lbGroup=[],lbIndex=0,lbReturnFocus=null;

function openLightbox(group,index){
  const cfg=MEDIA[group];
  if(!cfg||!cfg.shots||!cfg.shots.length)return;
  lbGroup=cfg.shots;lbIndex=index;lbReturnFocus=document.activeElement;
  lightbox.classList.add('show');
  lightbox.setAttribute('aria-hidden','false');
  showLbImage();
  $('lbClose').focus();
}
function showLbImage(){
  const s=lbGroup[lbIndex];
  $('lbImg').src=s.src;
  $('lbImg').alt=s.alt||'';
  $('lbCap').textContent=s.alt||'';
  $('lbCount').textContent=(lbIndex+1)+' / '+lbGroup.length;
  const many=lbGroup.length>1;
  $('lbPrev').hidden=!many;
  $('lbNext').hidden=!many;
}
function stepLightbox(d){
  if(lbGroup.length<2)return;
  lbIndex=(lbIndex+d+lbGroup.length)%lbGroup.length;
  showLbImage();
}
function closeLightbox(){
  if(!lightbox.classList.contains('show'))return;
  lightbox.classList.remove('show');
  lightbox.setAttribute('aria-hidden','true');
  $('lbImg').removeAttribute('src');
  if(lbReturnFocus&&document.contains(lbReturnFocus))lbReturnFocus.focus();
  lbReturnFocus=null;
}

document.addEventListener('click',e=>{
  const shot=e.target.closest('.shot');
  if(shot)openLightbox(shot.dataset.group,Number(shot.dataset.index));
});
$('lbClose').addEventListener('click',closeLightbox);
$('lbPrev').addEventListener('click',()=>stepLightbox(-1));
$('lbNext').addEventListener('click',()=>stepLightbox(1));
lightbox.addEventListener('click',e=>{if(e.target===lightbox)closeLightbox();});
document.addEventListener('keydown',e=>{
  if(!lightbox.classList.contains('show'))return;
  if(e.key==='Escape'){e.preventDefault();closeLightbox();}
  else if(e.key==='ArrowLeft')stepLightbox(-1);
  else if(e.key==='ArrowRight')stepLightbox(1);
  else if(e.key==='Tab'){
    // Fokus im Dialog halten
    const f=Array.from(lightbox.querySelectorAll('button')).filter(b=>!b.hidden);
    if(!f.length)return;
    const first=f[0],last=f[f.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
});

/* ═══════════════════════════════════
   ORDNER AUF/ZU
═══════════════════════════════════ */
document.querySelectorAll('.tree-folder').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const open=btn.classList.toggle('open');
    btn.setAttribute('aria-expanded',open?'true':'false');
    const icon=btn.querySelector('.folder-icon');
    if(icon)icon.textContent=open?'📂':'📁';
  });
});

/* ═══════════════════════════════════════════════════════════════
   GLIEDERUNG, LESEFORTSCHRITT UND FALTBARE DETAILS

   Lange Abschnitte sind zum Überfliegen gedacht, nicht zum
   Durchscrollen. Beides wird aus dem vorhandenen Markup erzeugt —
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

  const heads = Array.from(content.querySelectorAll('h3.ed-h2'));
  if(heads.length < OUTLINE_MIN)return;

  const bar = el('div','read-bar','<span></span>');
  const nav = document.createElement('nav');
  nav.className = 'outline';
  nav.setAttribute('aria-label','Gliederung dieses Abschnitts');
  nav.appendChild(el('span','outline-label','Abschnitt'));

  heads.forEach((h,i)=>{
    if(!h.id)h.id = panel.id.replace('panel-','') + '-' + slug(h.textContent, i);
    const a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = h.textContent;
    a.dataset.target = h.id;
    nav.appendChild(a);
  });

  // Vor dem ersten Inhalt einhängen
  content.insertBefore(nav, content.firstChild);
  content.insertBefore(bar, nav);

  // Ohne Luft am Ende koennen die letzten Abschnitte nicht nach oben
  // gescrollt werden — der Sprung dorthin liefe sonst ins Leere.
  content.classList.add('has-outline');
}

/**
 * Abstand eines Titels zum Anfang des Scrollbereichs.
 *
 * Nicht offsetTop verwenden: das misst bis zum naechsten positionierten
 * Vorfahren, nicht bis zum Scrollbereich, und liegt hier um die Hoehe von
 * Titel-, Tab- und Pfadleiste daneben. Bei den letzten Abschnitten reichte
 * dieser Versatz aus, damit das Ziel hinter das Scrollende rutschte — die
 * Knoepfe wirkten dann wirkungslos.
 */
function offsetInScroller(elm){
  return editorScroll.scrollTop
    + elm.getBoundingClientRect().top
    - editorScroll.getBoundingClientRect().top;
}

// Der Hash gehört der Tab-Navigation — deshalb selbst scrollen statt
// den Browser springen zu lassen.
document.addEventListener('click',e=>{
  const a = e.target.closest('.outline a');
  if(!a)return;
  e.preventDefault();
  const target = $(a.dataset.target);
  if(!target)return;
  const top = Math.max(0, offsetInScroller(target) - 64);
  editorScroll.scrollTo({top, behavior: reduceMotion ? 'auto' : 'smooth'});
  target.setAttribute('tabindex','-1');
  target.focus({preventScroll:true});

  // Sofort hervorheben statt auf das Scroll-Ereignis zu warten: nach einem
  // programmatischen Sprung kommt es nicht verlaesslich, und schon gar nicht,
  // wenn das Ziel den oberen Rand nicht mehr erreichen kann.
  const group = a.closest('.outline').querySelectorAll('a');
  group.forEach(x=>x.classList.toggle('current', x === a));
});

function updateOutlineState(){
  const panel = document.querySelector('.editor-panel.active');
  if(!panel)return;

  const bar = panel.querySelector('.read-bar span');
  if(bar){
    const max = editorScroll.scrollHeight - editorScroll.clientHeight;
    bar.style.width = (max > 0 ? Math.min(100, (editorScroll.scrollTop / max) * 100) : 0) + '%';
  }

  const links = panel.querySelectorAll('.outline a');
  if(!links.length)return;

  const atBottom = editorScroll.scrollTop + editorScroll.clientHeight
                   >= editorScroll.scrollHeight - 4;

  let currentId = links[0].dataset.target;
  if(atBottom){
    // Am Ende der Seite gilt der letzte Abschnitt — sonst bliebe er nie
    // hervorgehoben, weil er den oberen Rand nicht mehr erreichen kann.
    currentId = links[links.length-1].dataset.target;
  }else{
    links.forEach(a=>{
      const h = $(a.dataset.target);
      if(h && offsetInScroller(h) - 96 <= editorScroll.scrollTop) currentId = a.dataset.target;
    });
  }
  links.forEach(a=>a.classList.toggle('current', a.dataset.target === currentId));
}
editorScroll.addEventListener('scroll',updateOutlineState);

/* ── Technische Details einklappen ──
   Der Abstract und die Rolle bleiben immer sichtbar; nur der lange
   Fliesstext wandert hinter einen Schalter. So passen alle Projekte
   auf einen Blick, ohne dass Inhalt verloren geht. */
let foldCounter = 0;
function buildFolds(panel){
  panel.querySelectorAll('.proj-body:not([data-folded])').forEach(body=>{
    body.setAttribute('data-folded','1');
    const id = 'fold-' + (++foldCounter);

    const wrap = el('div','fold');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fold-btn';
    btn.setAttribute('aria-expanded','false');
    btn.setAttribute('aria-controls',id);
    btn.innerHTML = '<span class="fold-arrow" aria-hidden="true">▶</span>Technische Details';

    const holder = el('div','fold-body');
    holder.id = id;
    holder.hidden = true;

    body.parentNode.insertBefore(wrap, body);
    wrap.appendChild(btn);
    wrap.appendChild(holder);
    holder.appendChild(body);

    btn.addEventListener('click',()=>{
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      holder.hidden = open;
      buildLn(panel.id.replace('panel-',''));
    });
  });
}

/* ═══════════════════════════════════
   ZEILENNUMMERN
═══════════════════════════════════ */
function buildLn(name){
  const el=$('ln-'+name);
  if(!el)return;
  const cc=$('cc-'+name)||document.querySelector('#panel-'+name+' .code-content');
  const lines=Math.max(50,Math.ceil((cc?cc.scrollHeight:900)/LINE_H));
  if(el.childElementCount===lines)return;
  el.innerHTML=Array.from({length:lines},(_,i)=>'<div>'+(i+1)+'</div>').join('');
}

// Beim Umbruch ändert sich die Höhe des Inhalts — Nummern neu aufbauen.
let resizeTimer=null;
window.addEventListener('resize',()=>{
  clearTimeout(resizeTimer);
  resizeTimer=setTimeout(()=>{
    const active=document.querySelector('.tab.active');
    if(active)buildLn(active.dataset.panel);
  },200);
});

/* ═══════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════ */
function isInView(el){
  const r=el.getBoundingClientRect();
  return r.top<window.innerHeight&&r.bottom>0;
}
function initReveals(){
  document.querySelectorAll('.reveal:not(.in),.tl-e:not(.in)').forEach(el=>{
    if(isInView(el))el.classList.add('in');
  });
}
editorScroll.addEventListener('scroll',initReveals);

/* ═══════════════════════════════════
   LOGIN
═══════════════════════════════════ */
const loginBox=overlay.querySelector('.login-box');

function showLogin(){
  lastFocusedBeforeLogin=document.activeElement;
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden','false');
  $('loginInput').value='';
  $('loginErr').style.display='none';
  setTimeout(()=>$('loginInput').focus(),reduceMotion?0:120);
}

function closeLogin(){
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden','true');
  pendingPanel=null;
  if(lastFocusedBeforeLogin&&document.contains(lastFocusedBeforeLogin)){
    lastFocusedBeforeLogin.focus();
  }
  lastFocusedBeforeLogin=null;
}

// Fokus im Dialog halten, solange er offen ist.
overlay.addEventListener('keydown',e=>{
  if(e.key!=='Tab')return;
  const f=loginBox.querySelectorAll('button, input, [href]');
  if(!f.length)return;
  const first=f[0],last=f[f.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
});

$('loginInput').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&overlay.classList.contains('show'))closeLogin();
});
overlay.addEventListener('click',function(e){if(e.target===this)closeLogin();});

function togglePw(){
  const i=$('loginInput'),b=$('loginTog');
  const show=i.type==='password';
  i.type=show?'text':'password';
  b.setAttribute('aria-label',show?'Passwort verbergen':'Passwort anzeigen');
  i.focus();
}

async function doLogin(){
  const pw=$('loginInput').value;
  const btn=$('loginBtn');
  const err=$('loginErr');
  if(!pw)return;
  btn.disabled=true;btn.textContent='Prüfe...';err.style.display='none';
  try{
    const res=await fetch('/api/login',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({password:pw})
    });
    const data=await res.json();
    if(res.ok&&data.token){
      token=data.token;
      sessionStorage.setItem('lr_token',token);
      const target=pendingPanel;
      overlay.classList.remove('show');
      overlay.setAttribute('aria-hidden','true');
      pendingPanel=null;
      lastFocusedBeforeLogin=null;
      updateAuth(true);
      if(target)openTab(target);
    }else{
      err.textContent=data.error||'Falsches Passwort.';
      err.style.display='flex';
      $('loginInput').focus();
    }
  }catch(e){
    err.textContent='Verbindungsfehler.';
    err.style.display='flex';
  }
  btn.disabled=false;btn.textContent='ENTER ↵';
}

function doLogout(){
  token=null;
  sessionStorage.removeItem('lr_token');
  updateAuth(false);
  LOCKED.forEach(n=>{
    const box=$(n==='noten'?'noten-content':'cv-content');
    if(box)box.innerHTML='<span style="color:var(--dim);font-family:var(--mono);font-size:.8rem">Lade Daten…</span>';
    const dl=$(n==='noten'?'noten-dl':'cv-dl');
    if(dl)dl.style.display='none';
  });
  lastNoten=null;lastLebenslauf=null;
  openTab('home');
}

function verifyToken(){
  if(!token)return false;
  try{
    const p=JSON.parse(atob(token.split('.')[1]));
    return p.exp*1000>Date.now();
  }catch(e){return false;}
}

function updateAuth(ok){
  const el=$('sbAuth');
  el.className='tb-auth'+(ok?' authed':'');
  el.textContent=ok?'🔓 Eingeloggt':'🔒 Nicht eingeloggt';
}

/* ═══════════════════════════════════
   GESCHÜTZTE DATEN LADEN
═══════════════════════════════════ */
const EMPTY_MSG='<p style="color:var(--dim);font-family:var(--mono);font-size:.8rem;padding:1.2rem 0">// Noch keine Daten hinterlegt.</p>';
let lastNoten=null,lastLebenslauf=null;

// Fremde Werte landen im DOM — vor dem Einsetzen entschärfen.
function esc(v){
  return String(v==null?'':v)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

async function loadProtected(panel){
  if(!token)return;
  try{
    const res=await fetch('/api/protected',{headers:{'Authorization':'Bearer '+token}});
    if(!res.ok){doLogout();return;}
    const d=await res.json();

    if(panel==='noten'){
      lastNoten=d.noten||[];
      const box=$('noten-content'),dl=$('noten-dl');
      if(!lastNoten.length){
        box.innerHTML=EMPTY_MSG;
        if(dl)dl.style.display='none';
      }else{
        const avg=(lastNoten.reduce((s,n)=>s+n.note,0)/lastNoten.length).toFixed(2);
        const cc=n=>n>=5?'note-5':n>=4?'note-4':n>=3?'note-3':'note-2';
        box.innerHTML=
          '<div class="noten-grid">'+
          lastNoten.map(n=>
            '<div class="note-card"><div class="note-fach">'+esc(n.fach)+'</div>'+
            '<div class="note-val '+cc(n.note)+'">'+Number(n.note).toFixed(1)+'</div>'+
            '<div class="note-sem">'+esc(n.semester)+'</div></div>').join('')+
          '</div><p class="noten-avg">Durchschnitt: <strong>'+avg+'</strong></p>';
        if(dl)dl.style.display='inline-flex';
      }
    }

    if(panel==='cv'){
      lastLebenslauf=Object.assign(
        {ausbildung:[],erfahrung:[],nebenjobs:[],zertifikate:[],sprachen:[]},
        d.lebenslauf||{});
      const lv=lastLebenslauf;
      const box=$('cv-content'),dl=$('cv-dl');
      const hasAny=lv.ausbildung.length||lv.erfahrung.length||lv.nebenjobs.length||
                   lv.zertifikate.length||lv.sprachen.length;
      if(!hasAny){
        box.innerHTML=EMPTY_MSG;
        if(dl)dl.style.display='none';
      }else{
        const tl=list=>list.length
          ? list.map(e=>'<div class="tl-e in"><div class="tl-date">'+esc(e.zeitraum)+'</div>'+
              '<div class="tl-title">'+esc(e.titel)+'</div>'+
              '<div class="tl-sub">'+esc(e.ort)+'<br>'+esc(e.notiz)+'</div></div>').join('')
          : EMPTY_MSG;
        box.innerHTML=
          '<div class="cv-cols">'+
            '<div><h3 class="ed-h2">Ausbildung</h3><div class="tl">'+tl(lv.ausbildung)+'</div></div>'+
            '<div><h3 class="ed-h2">Berufserfahrung</h3><div class="tl">'+tl(lv.erfahrung)+'</div></div>'+
          '</div>'+
          (lv.nebenjobs.length
            ? '<h3 class="ed-h2" style="margin-top:2rem">Nebenjobs &amp; Freiwilligenarbeit</h3>'+
              '<div class="tl">'+tl(lv.nebenjobs)+'</div>'
            : '')+
          '<h3 class="ed-h2" style="margin-top:2rem">Sprachen</h3>'+
          (lv.sprachen.length
            ? '<table class="ed-table"><tr><th>Sprache</th><th>Niveau</th></tr>'+
              lv.sprachen.map(s=>'<tr><td>'+esc(s.sprache)+'</td><td><span class="badge bb">'+esc(s.niveau)+'</span></td></tr>').join('')+
              '</table>'
            : EMPTY_MSG)+
          '<h3 class="ed-h2">Zertifikate</h3>'+
          (lv.zertifikate.length
            ? '<table class="ed-table"><tr><th>Jahr</th><th>Titel</th><th>Anbieter</th></tr>'+
              lv.zertifikate.map(z=>'<tr><td>'+esc(z.jahr)+'</td><td>'+esc(z.titel)+'</td><td>'+esc(z.anbieter)+'</td></tr>').join('')+
              '</table>'
            : EMPTY_MSG);
        if(dl)dl.style.display='inline-flex';
      }
    }
    setTimeout(()=>buildLn(panel),150);
  }catch(e){
    console.error(e);
  }
}

/* ═══════════════════════════════════
   DOWNLOADS (Noten-CSV, Lebenslauf-PDF)
═══════════════════════════════════ */
function triggerDownload(blob,filename){
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();
  document.body.removeChild(a);URL.revokeObjectURL(url);
}

function downloadNotenCsv(){
  if(!lastNoten||!lastNoten.length)return;
  const rows=[['Fach','Note','Semester'],...lastNoten.map(n=>[n.fach,n.note,n.semester])];
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');
  triggerDownload(new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'}),'noten-luis-rosado.csv');
}

let jsPdfLoading=null;
function loadJsPdf(){
  if(window.jspdf)return Promise.resolve();
  if(jsPdfLoading)return jsPdfLoading;
  jsPdfLoading=new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload=resolve;s.onerror=reject;
    document.head.appendChild(s);
  });
  return jsPdfLoading;
}

async function downloadCvPdf(){
  if(!lastLebenslauf)return;
  const btn=$('cv-dl');
  const orig=btn.textContent;
  btn.textContent='Erstelle PDF…';btn.disabled=true;
  try{
    await loadJsPdf();
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({unit:'mm',format:'a4'});
    const marginX=18;let y=22;
    const lineGap=6.5,pageBottom=280;
    function ensureSpace(extra){if(y+extra>pageBottom){doc.addPage();y=22;}}
    function h1(t){ensureSpace(10);doc.setFont('helvetica','bold');doc.setFontSize(18);doc.text(t,marginX,y);y+=10;}
    function h2(t){ensureSpace(9);doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(30,80,160);doc.text(t,marginX,y);doc.setTextColor(20,20,20);y+=7;}
    function body(t){ensureSpace(lineGap);doc.setFont('helvetica','normal');doc.setFontSize(10);doc.text(t,marginX,y);y+=lineGap;}
    function sub(t){ensureSpace(5.5);doc.setFont('helvetica','italic');doc.setFontSize(9);doc.setTextColor(100,100,100);doc.text(t,marginX,y);doc.setTextColor(20,20,20);y+=5.5;}

    h1('Lebenslauf — Luis Rosado');
    y+=2;
    doc.setFont('helvetica','normal');doc.setFontSize(10);
    doc.text('luisrosado008@gmail.com  ·  github.com/Lro-rgb  ·  Burgdorf BE',marginX,y);
    y+=9;

    const lv=lastLebenslauf;
    if(lv.ausbildung.length){
      h2('Ausbildung');
      lv.ausbildung.forEach(e=>{body(e.zeitraum+'  —  '+e.titel);sub(e.ort+(e.notiz?' · '+e.notiz:''));y+=1;});
      y+=3;
    }
    if(lv.erfahrung.length){
      h2('Berufserfahrung');
      lv.erfahrung.forEach(e=>{body(e.zeitraum+'  —  '+e.titel);sub(e.ort+(e.notiz?' · '+e.notiz:''));y+=1;});
      y+=3;
    }
    if(lv.nebenjobs&&lv.nebenjobs.length){
      h2('Nebenjobs & Freiwilligenarbeit');
      lv.nebenjobs.forEach(e=>{body(e.zeitraum+'  —  '+e.titel);sub(e.ort+(e.notiz?' · '+e.notiz:''));y+=1;});
      y+=3;
    }
    if(lv.sprachen.length){
      h2('Sprachen');
      lv.sprachen.forEach(s=>body(s.sprache+': '+s.niveau));
      y+=3;
    }
    if(lv.zertifikate.length){
      h2('Zertifikate');
      lv.zertifikate.forEach(z=>body(z.jahr+' — '+z.titel+' ('+z.anbieter+')'));
    }
    doc.save('lebenslauf-luis-rosado.pdf');
  }catch(e){
    console.error(e);
    alert('PDF konnte nicht erstellt werden. Bitte Internetverbindung prüfen.');
  }
  btn.textContent=orig;btn.disabled=false;
}

/* ═══════════════════════════════════
   START
═══════════════════════════════════ */
function startApp(){
  if(token&&verifyToken())updateAuth(true);
  else{token=null;sessionStorage.removeItem('lr_token');}

  renderAudio();
  renderProjectMedia();

  const fromHash=location.hash.replace('#','');
  const start=(fromHash&&LANG[fromHash])?fromHash:'home';
  openTab(start);
  initReveals();
}
