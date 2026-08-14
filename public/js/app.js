/* ═══════════════════════════════════
   KONSTANTEN
═══════════════════════════════════ */
// Dient nur noch als Liste der gültigen Panel-Namen (Deep-Linking).
const LANG={home:'JSON',skills:'Python',techstack:'TypeScript',projekte:'HTML',interessen:'JSON',kontakt:'SQL',readme:'Markdown',noten:'CSV',cv:'Markdown'};
const LOCKED=['noten','cv'];
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
    I18N.t('splash.loadingExtensions'),'luis.json','skills.py','techstack.ts','projekte.html',
    'interessen.json','kontakt.sql','unterlagen/noten.csv','unterlagen/lebenslauf.md',I18N.t('splash.ready')
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
    lbl.textContent=i===0?I18N.t('splash.init'):i===files.length-1?I18N.t('splash.readyLabel'):I18N.t('splash.opening')+files[i];
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
/* Bilder eines Bereichs wirklich holen.

   loading="lazy" allein hat hier nicht gereicht. Die Bereiche liegen alle im
   selben Dokument und werden nur ueber eine Klasse ein- und ausgeblendet; fuer
   den Browser stehen ihre Bilder damit an Position null und gelten als
   sichtbar. Er hat sie deshalb sofort geladen — beim ersten Aufruf kamen ueber
   fuenf Megabyte herunter, obwohl der Besucher nur die Startseite sieht und
   die Bilder von Interessen und Projekten vielleicht nie ansteuert.

   Darum steht die Adresse zunaechst in data-src, wo sie den Browser nicht
   interessiert, und wandert erst hierher, wenn der Bereich geoeffnet wird. */
function bilderFreigeben(panel,sofort){
  if(!panel)return;
  panel.querySelectorAll('img[data-src]').forEach(img=>{
    /* Fuer den Ausdruck muss "lazy" weg. Die noch nie geoeffneten Bereiche
       sind in dem Moment ausgeblendet, und ein ausgeblendetes Bild laedt der
       Browser mit lazy grundsaetzlich nicht — es bliebe leer, obwohl es auf
       dem Papier stehen soll. */
    if(sofort)img.loading='eager';
    img.src=img.dataset.src;
    delete img.dataset.src;
  });
}

/* Auf Papier stehen alle Bereiche untereinander, auch die nie geoeffneten.
   Deren Bilder muessen also vorher noch geholt werden, sonst bleiben im
   Ausdruck Luecken. Gibt die Rueckmeldung, wann alles geladen ist, damit der
   Druckbefehl darauf warten kann — der Druckdialog selbst wartet nicht. */
function alleBilderFreigeben(){
  bilderFreigeben(document,true);
  const offen=[...document.images].filter(img=>!img.complete);
  if(!offen.length)return Promise.resolve();
  return Promise.race([
    Promise.all(offen.map(img=>new Promise(fertig=>{
      img.addEventListener('load',fertig,{once:true});
      img.addEventListener('error',fertig,{once:true});
    }))),
    // Wer offline ist oder ein Bild nicht bekommt, soll trotzdem drucken
    // koennen, statt vor einem Dialog zu warten, der nie aufgeht.
    new Promise(fertig=>setTimeout(fertig,3000))
  ]);
}
/* Sicherheitsnetz fuer Strg+P und das Browsermenue: dort bleibt keine Zeit
   zum Nachladen, aber angestossen ist besser als gar nicht. */
window.addEventListener('beforeprint',()=>{bilderFreigeben(document,true);});

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
  bilderFreigeben($('panel-'+name));

  document.querySelectorAll('.tree-file').forEach(f=>f.classList.toggle('active',f.dataset.open===name));

  setEmptyState(false);
  const panel=$('panel-'+name);
  buildFolds(panel);
  buildOutline(panel);
  editorScroll.scrollTop=0;
  /* Die Blaetterpfeile der Bilderreihen wurden bisher einmal beim Aufbau
     gemessen — da war das Panel noch ausgeblendet, clientWidth also null und
     beide Pfeile blieben abgeschaltet. Sie wachten erst auf, wenn man die
     Reihe von Hand verschoben hatte. Jetzt wird nachgemessen, sobald der
     Bereich wirklich sichtbar ist. */
  requestAnimationFrame(()=>panel.querySelectorAll('.sl-nav').forEach(nav=>randKnoepfe(nav.parentElement)));
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

/* Waagrechte Leisten mit dem Mausrad bedienbar machen — die Tableiste hier,
   die Gliederung in buildOutline. Beide laufen waagrecht, das Rad meldet aber
   nur eine senkrechte Bewegung: ohne Umrechnung scrollt der Inhalt darunter
   und die hinteren Eintraege sind auf einem schmaleren Bildschirm gar nicht
   erreichbar. deltaMode 1 heisst "in Zeilen" (Firefox unter Windows);
   ungerechnet waeren das drei Pixel pro Umdrehung. */
function radSeitwaerts(leiste){
  if(!leiste)return;
  leiste.addEventListener('wheel',e=>{
    if(leiste.scrollWidth<=leiste.clientWidth)return; // passt alles: Seite scrollt weiter
    leiste.scrollLeft+=(e.deltaY||e.deltaX)*(e.deltaMode?16:1);
    e.preventDefault();
  },{passive:false});
}
radSeitwaerts($('tabbar'));

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

/* Die Schaltflaechen bei den Skills nennen ein Projekt — dann sollen sie auch
   dorthin fuehren. Vorher landeten alle gleichermassen oben auf der
   Projektseite: "Askel" und "Redis-Webshop" taten dasselbe, obwohl die
   Einleitung "ein Klick darauf fuehrt hin" verspricht. Der Filter wird dabei
   zurueckgesetzt, sonst zeigt der Sprung auf eine ausgeblendete Karte. */
document.addEventListener('click',e=>{
  const chip=e.target.closest('[data-ziel]');
  if(!chip)return;
  const karte=$(chip.dataset.ziel);
  if(!karte)return;
  projekteFiltern('alle');
  // Nach openTab: das setzt den Scrollstand zuerst auf null zurueck.
  requestAnimationFrame(()=>{
    karte.scrollIntoView({block:'start',behavior:reduceMotion?'auto':'smooth'});
    karte.classList.remove('karte-hervor');
    void karte.offsetWidth;            // Neustart der Hervorhebung erzwingen
    karte.classList.add('karte-hervor');

    /* Die Projektbilder werden erst beim Oeffnen des Bereichs geholt. Waehrend
       sie eintreffen, waechst der Inhalt ueber der Zielkarte und schiebt sie
       weg — der Sprung landete zuletzt vierzehnhundert Pixel daneben. Also
       nachfassen, solange noch Bilder ankommen. */
    let vorbei=false;
    setTimeout(()=>{vorbei=true;},4000);
    document.querySelectorAll('#panel-projekte img').forEach(bild=>{
      if(bild.complete)return;
      bild.addEventListener('load',()=>{
        if(!vorbei)karte.scrollIntoView({block:'start',behavior:'auto'});
      },{once:true});
    });
  });
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
  sbToggle.querySelector('.vh').textContent=I18N.t('chrome.explorerClose');
  const first=sidebar.querySelector('.tree-folder, .tree-file');
  if(first)setTimeout(()=>first.focus(),reduceMotion?0:220);
}

function closeDrawer(){
  if(!drawerOpen())return;
  sidebar.classList.remove('open');
  backdrop.hidden=true;
  sbToggle.setAttribute('aria-expanded','false');
  sbToggle.querySelector('.vh').textContent=I18N.t('chrome.explorerOpen');
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

/* Leere Bildrahmen anzeigen oder nicht. Auf true stehen sie in jeder Karte
   ohne Bild als gestricheltes "Bild folgt" — nuetzlich, solange man selbst
   daran arbeitet, unruhig fuer jeden, der die Seite nur anschaut. */
const PLATZHALTER_ZEIGEN=false;

/* Pro Projekt: video, shots (Screenshots), downloads.
     askel:{
       video:{src:'media/askel.mp4', poster:'media/askel-poster.jpg',
              titel:'Askel zeichnet eine Route auf', dauer:'1:10',
              format:'hoch'},   // hochkant, für Aufnahmen vom Handy
       format:'quer',   // 16:10 statt hochkant — für Bilder vom Rechner
       shots:[{src:'media/askel-1.jpg', alt:'Startbildschirm mit Routenliste'}],
       downloads:[{href:'media/askel-doku.pdf', label:'Projektdokumentation', meta:'PDF · 1,2 MB'}]
     }
   Ohne format sind die Kacheln hochkant (9:16), passend für Aufnahmen
   vom Handy. 'quer' macht sie breiter, sonst wird ein 1600 Pixel breiter
   Bildschirm in einer 110-Pixel-Kachel zu Brei.

   Die Schlüssel entsprechen data-media in index.html. Eingetragen sind
   bisher die beiden Linux-Projekte; die übrigen Zeilen stehen als
   Vorlage bereit und werden erst angezeigt, wenn die Datei wirklich in
   public/media/ liegt. */
const MEDIA={
  // Eigene Bildschirmfotos aus dem wallsync-Repo. Dasselbe Hintergrundbild
  // einmal vor und einmal nach dem Durchlauf: erst Standardfarben, dann die
  // aus dem Bild errechnete Palette in Leiste, Terminal und Menü.
  wallpaper:{
    format:'quer',
    shots:[
      {src:'media/wallsync-before.jpg',
       alt:'Der Desktop vor dem Durchlauf: Leiste, Terminal und Menü noch in den Standardfarben'},
      {src:'media/wallsync-after.jpg',
       alt:'Derselbe Desktop nach dem Durchlauf: alle Farben stammen jetzt aus dem Hintergrundbild'}
    ]
  },
  // Bildschirmfotos meines Arch-Setups, ebenfalls aus dem eigenen Repo.
  arch:{
    format:'quer',
    shots:[
      {src:'media/arch-terminal.jpg',
       alt:'Alacritty mit der Fish-Shell, darüber die Waybar als Statusleiste'},
      {src:'media/arch-logout-menu.jpg',
       alt:'Das Abmeldemenü, gebaut mit rofi und aus der Waybar heraus aufgerufen'}
    ]
  },
  /* Noch ohne Datei: platzhalter reserviert den Platz, damit jede Karte
     gleich aufgebaut ist. Sobald daneben shots oder video steht, ver-
     schwindet der Rahmen von selbst — der Platzhalter wird nur gezeigt,
     solange nichts Echtes da ist.

     Ob sie ueberhaupt erscheinen, entscheidet PLATZHALTER_ZEIGEN weiter
     unten. Sechs von zehn Karten hatten damit einen gestrichelten Kasten
     mit "Bild folgt" an der auffaelligsten Stelle — das ist genau die
     Unruhe, die eine Uebersicht kaputt macht. Die Eintraege bleiben
     stehen, damit ein einziges Wort sie wieder einschaltet. */
  /* Vier Aufnahmen der laufenden Seite, aufgenommen bei 1600x1000. Der
     Text der Karte nennt Kommandopalette, Terminal und sechs Farbdesigns —
     das eine Bild der Startseite hat davon nichts gezeigt. Jetzt steht
     hinter jeder dieser Behauptungen ein Bild. */
  portfolio:{
    format:'quer',
    shots:[
      {src:'media/portfolio-home.png',
       alt:'Die Startseite dieses Portfolios im VS-Code-Design: Explorer links, luis.json offen im Editor'},
      {src:'media/portfolio-palette.png',
       alt:'Die Kommandopalette mit der Befehlsliste: Farbdesign wechseln, Terminal, Explorer, drucken — jeder Eintrag mit seinem Tastenkürzel'},
      {src:'media/portfolio-terminal.png',
       alt:'Das eingeblendete Terminal, darin der Befehl whoami mit seiner Ausgabe'},
      {src:'media/portfolio-hell.jpg',
       alt:'Dieselbe Seite im hellen Design Light+, offen ist die Projektübersicht mit zwei Karten'}
    ]
  },
  /* Eigene Aufnahmen der beiden Geraete, oben und unten leicht
     zugeschnitten — der dunkle Tisch drumherum nahm sonst mehr Platz ein
     als die Geraete selbst. format:'frei' bleibt: die Kachel nimmt die
     eigene Proportion des Bildes an, statt sie in einen festen 16:10-
     Rahmen zu zwingen und dabei Balken zu riskieren. */
  modding:{
    format:'frei',
    shots:[
      {src:'media/modding-switch.jpg',
       alt:'Die Switch im Bootloader hekate, daneben der RCM-Jig zum Auslösen des Recovery-Modus'},
      {src:'media/modding-3ds.jpg',
       alt:'Der 3DS mit Luma3DS: oben der Homebrew Launcher, unten das Menü mit den installierten Anwendungen'}
    ]
  },
  /* Vier Bildschirmfotos aus der Projektdokumentation, in der Reihenfolge
     der Kette: gebaut, ausgerollt, laeuft, antwortet. Sie sind sehr
     unterschiedlich breit — ein Pipeline-Bild ist mehr als dreimal so
     breit wie hoch — darum format:'frei': die Kacheln nehmen die
     Proportion des Bildes an, statt es in ein festes Raster zu zwingen. */
  urlshortener:{
    format:'frei',
    shots:[
      /* Die Aufnahme der Container Registry ist raus. Die Pipeline-Aufnahme
         liegt weiter unter media/urlshortener-01-pipeline.png, falls
         stattdessen die wieder rein soll:
           {src:'media/urlshortener-01-pipeline.png',
            alt:'Die Pipeline in GitLab CI, alle Stufen grün'}, */
      {src:'media/urlshortener-05-argocd.png',
       alt:'ArgoCD meldet die Anwendung als Synced und Healthy'},
      {src:'media/urlshortener-03-pods.png',
       alt:'kubectl get pods: beide Dienste laufen mit 1/1'},
      {src:'media/urlshortener-04-curl.png',
       alt:'Ein Aufruf über den Ingress: der gekürzte Link leitet weiter'}
    ]
  },
  /* Askel laeuft auf dem Handy, darum kommt hier eine Bildschirmaufnahme
     im Hochformat hin, kein Bild. Die alte Aufnahme ist raus, die neue
     folgt — dann diese Zeilen wieder einkommentieren und den Dateinamen
     anpassen:
       video:{src:'media/askel.mp4', titel:'Askel auf dem Handy',
              dauer:'0:11', format:'hoch'}
     format:'hoch' stellt das Video auf 340px Hoehe, statt es ueber die
     halbe Karte laufen zu lassen. */
  askel:{platzhalter:{video:true}},
  /* Bildschirmaufnahme aus dem Android-Emulator: die Sammlung, dann drei
     Rezepte im Detail. Die Datei ist 1280x720, das Handy darin steht aber
     nur zwischen Pixel 478 und 800 — der Rest ist schwarz. Darum der
     Zuschnitt; sollte die Aufnahme einmal im Hochformat neu exportiert
     werden, kann er ersatzlos weg.

     Was die Aufnahme nicht zeigt, sind Suche, Filter und die Validierung
     der Eingabemaske. Genau darueber redet der Text auf der Karte, also
     waere eine zweite, laengere Aufnahme hier gut angelegt. */
  rezeptbuch:{
    video:{src:'media/rezeptbuch.mp4',
           titel:'Mein Rezeptbuch im Android-Emulator', dauer:'0:18',
           zuschnitt:{x:478, breite:322, quelle:[1280,720], hoehe:440}}
  },
  kobui:{
    format:'quer',
    shots:[
      {src:'media/kobui-docs.png',
       alt:'Die eingebaute Dokumentation von kobui mit Beispielen für Charakterbeschreibung und erste Nachricht'},
      {src:'media/kobui-chat.png',
       alt:'Ein Chat mit einem selbst angelegten Charakter, die erste Nachricht ist schon zu sehen'}
    ]
  },
  // Zwei Aufnahmen der laufenden Anwendung: die Produktübersicht und der
  // gefüllte Warenkorb mit Summe, aufgenommen von einer lokal gestarteten
  // Instanz (eigener Redis + Flask, mit den Testdaten aus seed.py).
  webshop:{
    format:'quer',
    shots:[
      {src:'media/webshop-produkte.png',
       alt:'Die Produktübersicht des Redis-Webshops mit 20 Artikeln in Kacheln, Preis, Lager und Bewertung'},
      {src:'media/webshop-warenkorb.png',
       alt:'Der Warenkorb mit drei Artikeln, Einzelpreisen und berechneter Gesamtsumme'}
    ]
  },
  // Die erste Website liegt als Kopie unter public/erste-website/ und wird
  // deshalb direkt eingebettet statt abfotografiert.
  erstewebsite:{einbettung:{src:'erste-website',
                            titel:'Die Seite von 2024 öffnen'}}
};

/* Interessen: pro Bereich eine Bilderstrecke.
   Bild einbinden: Datei nach public/media/ legen und hier eine Zeile
   eintragen. Bereiche ohne Bilder erscheinen gar nicht — kein leerer
   Rahmen, kein Platzhalter.
     gaming:[{src:'media/gaming-eldenring.jpg', alt:'Elden Ring, …'}]
   Der Text im alt-Attribut steht auch als Bildunterschrift in der
   Vollansicht. */
const INTERESSEN={
  // Key-Art der Spiele, geladen aus der oeffentlichen Bildablage von
  // Steam. Die Bilder gehoeren den jeweiligen Studios; sie stehen hier
  // als Hinweis auf das Spiel, nicht als eigenes Werk.
  gaming:[
    // Sehr breites Bild (1920 x 620), der Kopf steht ganz links. Mittig
    // beschnitten fing die Kachel erst hinter dem Gesicht an, darum der
    // Ausschnitt weit nach links.
    {src:'media/gaming-persona3.jpg', ausschnitt:'12% 50%',
     alt:'Persona 3 — Key-Art des Protagonisten mit SEES-Armbinde'},
    {src:'media/gaming-elden-ring.jpg',
     alt:'Elden Ring — Key-Art'},
    {src:'media/gaming-undertale.jpg',
     alt:'Undertale — Titelschriftzug'},
    {src:'media/gaming-palworld.jpg',
     alt:'Palworld — Key-Art'},
    {src:'media/gaming-ghost-of-tsushima.jpg',
     alt:'Ghost of Tsushima — Key-Art'}
  ],
  // Albumcover, geholt aus der oeffentlichen Suche von Apple Music
  // (1000 x 1000). Auch hier: die Bilder gehoeren den Labels.
  musik:[
    {src:'media/musik-college-dropout.jpg',
     alt:'The College Dropout von Kanye West'},
    {src:'media/musik-ok-computer.jpg',
     alt:'OK Computer von Radiohead'},
    {src:'media/musik-this-is-how-tomorrow-moves.jpg',
     alt:'This Is How Tomorrow Moves von beabadoobee'},
    {src:'media/musik-travelling-without-moving.jpg',
     alt:'Travelling Without Moving von Jamiroquai'},
    {src:'media/musik-lily-chou-chou.jpg',
     alt:'Soundtrack zu All About Lily Chou-Chou'}
  ],
  // Bandcover, gesucht ueber Apple Books und Open Library.
  lesen:[
    {src:'media/lesen-jojolion.jpg',
     alt:'JoJo’s Bizarre Adventure Teil 8 — JoJolion, Band 1'},
    {src:'media/lesen-dragon-ball-z.jpg',
     alt:'Dragon Ball Z, Band 1'},
    {src:'media/lesen-hellsing.jpg',
     alt:'Hellsing, Band 1'},
    {src:'media/lesen-goodnight-punpun.jpg',
     alt:'Goodnight Punpun, Band 1'},
    {src:'media/lesen-berserk.jpg',
     alt:'Berserk, Band 1'}
  ],
  /* Eigene Fotos: der selbst gebaute Rechner und die beiden Konsolen mit
     Custom Firmware — genau das, was der Text ueber der Strecke ankuendigt.
     Die Konsolenbilder sind dieselben wie in der Modding-Karte. */
  hardware:[
    {src:'media/hardware-setup.jpg',
     alt:'Mein Arbeitsplatz: selbst gebauter Rechner mit Wasserkühlung, drei Bildschirme und der Laptop daneben'},
    {src:'media/modding-switch.jpg',
     alt:'Die Switch im Bootloader hekate, daneben der RCM-Jig zum Auslösen des Recovery-Modus'},
    {src:'media/modding-3ds.jpg',
     alt:'Der 3DS mit Luma3DS: oben der Homebrew Launcher, unten das Menü mit den installierten Anwendungen'}
  ]
};

function el(tag,cls,html){
  const n=document.createElement(tag);
  if(cls)n.className=cls;
  if(html!=null)n.innerHTML=html;
  return n;
}

/* Zeitangabe fuer die Spurleiste: 7 Sekunden werden zu "0:07". */
function zeitText(s){
  if(!isFinite(s))s=0;
  const m=Math.floor(s/60);
  return m+':'+String(Math.floor(s%60)).padStart(2,'0');
}

/* Baut einen kleinen Abspieler um ein zugeschnittenes Video.

   Warum nicht die eingebaute Steuerleiste: Der Zuschnitt schiebt das Video
   im Rahmen nach links, und die Leiste des Browsers sitzt am Video, wandert
   also mit. Der Abspielknopf landete dadurch ausserhalb des sichtbaren
   Ausschnitts. Die Leiste hier haengt stattdessen unter dem Rahmen und ist
   so breit wie die Karte, nicht so schmal wie der Ausschnitt.

   Vollbild geht auf den ganzen Abspieler, damit die Leiste mitkommt. Der
   Zuschnitt wird dabei aufgehoben — auf einem grossen Bildschirm ist Platz
   genug fuer das ganze Bild, und die schwarzen Raender stoeren dort nicht,
   weil das Video ohnehin 16:9 ist. */
function baueVideoPlayer(v,zs){
  const skala=zs.hoehe/zs.quelle[1];
  const player=el('div','video-player');
  const rahmen=el('div','video-crop');
  v.classList.remove('hoch');
  v.controls=false;

  /* Setzt den Ausschnitt auf eine bestimmte Anzeigehoehe. Der Zuschnitt
     bleibt auch in der Grossansicht bestehen — dort wird er nur groesser
     gerechnet. Wuerde man ihn stattdessen aufheben, saehe man auf einem
     grossen Bildschirm vor allem den schwarzen Rand in Gross, und das Handy
     bliebe ein Streifen in der Mitte. */
  function zuschnittSetzen(hoehe){
    const s=hoehe/zs.quelle[1];
    const b=Math.round(zs.breite*s);
    /* Auch der Abspieler selbst wird auf die Breite des Ausschnitts
       festgelegt. Sonst zieht ihn die Steuerleiste auf ihre eigene
       Wunschbreite auseinander und steht rechts unter dem Bild hervor.
       In der Grossansicht darf er die volle Breite nehmen, damit die
       Leiste ueber den ganzen Bildschirm laeuft. */
    player.style.width=player.classList.contains('voll')?'':b+'px';
    rahmen.style.width=b+'px';
    rahmen.style.height=Math.round(hoehe)+'px';
    v.style.width=Math.round(zs.quelle[0]*s)+'px';
    v.style.height=Math.round(hoehe)+'px';
    v.style.marginLeft=Math.round(-zs.x*s)+'px';
  }

  /* Anzeigehoehe in der Grossansicht: so hoch wie der Platz ueber der
     Leiste hergibt, aber hoechstens doppelt so hoch wie die Aufnahme
     selbst. Weiter hochgerechnet wird die Schrift auf dem Handy nur
     matschig — dieselbe Grenze wie bei den Screenshots in der
     Vollansicht. */
  function grossHoehe(){
    const leisteH=leiste.offsetHeight||30;
    return Math.min(zs.quelle[1]*2, window.innerHeight-leisteH-8);
  }

  // Grossflaechiger Knopf ueber dem Bild: startet und haelt an.
  const overlay=document.createElement('button');
  overlay.type='button';
  overlay.className='video-play';
  overlay.setAttribute('aria-label',I18N.t('media.playRecording'));
  overlay.innerHTML='<span aria-hidden="true">▶</span>';

  const leiste=el('div','video-bar');
  const btnPlay=document.createElement('button');
  btnPlay.type='button';btnPlay.className='vb-btn';
  btnPlay.setAttribute('aria-label',I18N.t('media.play'));
  btnPlay.innerHTML='<span aria-hidden="true">▶</span>';

  const spur=document.createElement('input');
  spur.type='range';spur.className='vb-seek';
  spur.min=0;spur.max=100;spur.step=0.1;spur.value=0;
  spur.setAttribute('aria-label',I18N.t('media.seekLabel'));

  const zeit=el('span','vb-time','0:00 / 0:00');

  const btnVoll=document.createElement('button');
  btnVoll.type='button';btnVoll.className='vb-btn';
  btnVoll.setAttribute('aria-label',I18N.t('media.fullscreen'));
  btnVoll.innerHTML='<span aria-hidden="true">⛶</span>';

  leiste.append(btnPlay,spur,zeit,btnVoll);
  rahmen.append(v,overlay);
  player.append(rahmen,leiste);
  zuschnittSetzen(zs.hoehe);

  const umschalten=()=>{if(v.paused)v.play();else v.pause();};
  overlay.addEventListener('click',umschalten);
  btnPlay.addEventListener('click',umschalten);

  function zustand(laeuft){
    rahmen.classList.toggle('laeuft',laeuft);
    overlay.setAttribute('aria-label',laeuft?I18N.t('media.pauseRecording'):I18N.t('media.playRecording'));
    btnPlay.setAttribute('aria-label',laeuft?I18N.t('media.pause'):I18N.t('media.play'));
    btnPlay.firstChild.textContent=laeuft?'❚❚':'▶';
  }
  v.addEventListener('play',()=>zustand(true));
  v.addEventListener('pause',()=>zustand(false));
  v.addEventListener('ended',()=>zustand(false));

  /* Waehrend am Regler gezogen wird, darf timeupdate ihn nicht
     zurueckspringen lassen. */
  let zieht=false;
  spur.addEventListener('pointerdown',()=>{zieht=true;});
  spur.addEventListener('input',()=>{
    if(isFinite(v.duration))v.currentTime=v.duration*(spur.value/100);
  });
  const losLassen=()=>{zieht=false;};
  spur.addEventListener('pointerup',losLassen);
  spur.addEventListener('pointercancel',losLassen);
  spur.addEventListener('blur',losLassen);

  function zeitAnzeigen(){
    zeit.textContent=zeitText(v.currentTime)+' / '+zeitText(v.duration);
    if(!zieht&&isFinite(v.duration)&&v.duration>0){
      spur.value=(v.currentTime/v.duration)*100;
    }
  }
  v.addEventListener('loadedmetadata',zeitAnzeigen);
  v.addEventListener('timeupdate',zeitAnzeigen);
  if(v.readyState>=1)zeitAnzeigen();

  /* Grossansicht.

     Der erste Versuch ist echtes Vollbild ueber den ganzen Bildschirm. Das
     klappt aber nicht ueberall: Auf dem iPhone kennt Safari die Funktion
     nur am Video selbst, nicht an einem Kasten drumherum, und eingebettete
     Ansichten duerfen sie teils gar nicht aufrufen. Wenn also etwas dagegen
     spricht, legt sich der Abspieler stattdessen ueber die Seite. Das
     Ergebnis ist fuer den Betrachter praktisch dasselbe und funktioniert
     immer — besser als ein Knopf, der auf manchen Geraeten nichts tut. */
  function ansichtSetzen(gross){
    player.classList.toggle('voll',gross);
    zuschnittSetzen(gross?grossHoehe():zs.hoehe);
    btnVoll.setAttribute('aria-label',gross?I18N.t('media.exitLargeView'):I18N.t('media.largeView'));
  }
  /* Wird das Fenster in der Grossansicht kleiner, muss der Ausschnitt mit. */
  window.addEventListener('resize',()=>{
    if(player.classList.contains('voll'))zuschnittSetzen(grossHoehe());
  });
  function ueberlagernAn(){
    player.classList.add('fix');
    document.body.classList.add('voll-offen');
    ansichtSetzen(true);
    btnVoll.focus();
  }
  function ueberlagernAus(){
    player.classList.remove('fix');
    document.body.classList.remove('voll-offen');
    ansichtSetzen(false);
  }
  btnVoll.addEventListener('click',()=>{
    if(player.classList.contains('fix')){ueberlagernAus();return;}
    if(document.fullscreenElement===player){document.exitFullscreen();return;}
    const versuch=player.requestFullscreen&&player.requestFullscreen();
    if(versuch&&versuch.catch)versuch.catch(ueberlagernAn);
    else if(!versuch)ueberlagernAn();
  });
  document.addEventListener('fullscreenchange',()=>{
    if(player.classList.contains('fix'))return;
    ansichtSetzen(document.fullscreenElement===player);
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&player.classList.contains('fix')){
      e.preventDefault();
      ueberlagernAus();
    }
  });

  return player;
}

function renderProjectMedia(){
  document.querySelectorAll('[data-media]').forEach(box=>{
    const cfg=MEDIA[box.dataset.media];
    box.innerHTML='';
    if(!cfg)return;

    if(cfg.video&&cfg.video.src){
      const v=document.createElement('video');
      v.controls=true;v.preload='metadata';v.playsInline=true;
      v.className='proj-video'+(cfg.video.format==='hoch'?' hoch':'');
      if(cfg.video.poster)v.poster=cfg.video.poster;
      v.src=cfg.video.src;
      v.textContent=I18N.t('media.videoFallback');
      const fig=el('figure','media-figure');

      /* Zuschnitt fuer Aufnahmen, bei denen das Bild breiter ist als das,
         was darauf zu sehen ist. Der Emulator nimmt in 1280x720 auf, das
         Handy darin ist aber nur 322 Pixel breit — drei Viertel der Datei
         sind schwarzer Rand. Ohne Zuschnitt waere die App auf der Karte
         daumennagelgross.

         Geschnitten wird per CSS, nicht in der Datei: Ein Rahmen mit fester
         Groesse blendet aus, das Video wird darin auf Hoehe gerechnet und
         so weit nach links geschoben, dass der gewuenschte Ausschnitt im
         Rahmen steht. Das Video bleibt unangetastet und laesst sich
         jederzeit gegen eine sauber exportierte Fassung tauschen — dann
         faellt einfach diese Angabe weg.

         zuschnitt: {x, breite, quelle:[vollBreite, vollHoehe], hoehe} —
         alle Werte in Pixeln des Originals ausser hoehe, das die
         Darstellungshoehe auf der Karte ist. */
      const zs=cfg.video.zuschnitt;
      if(zs)fig.appendChild(baueVideoPlayer(v,zs));
      else fig.appendChild(v);
      if(cfg.video.titel){
        fig.appendChild(el('figcaption','media-cap',
          esc(cfg.video.titel)+(cfg.video.dauer?' <span class="media-dur">'+esc(cfg.video.dauer)+'</span>':'')));
      }
      box.appendChild(fig);
    }

    /* Statt eines Bildschirmfotos die Seite selbst, verkleinert in einem
       Rahmen. Ein Foto veraltet, sobald sich etwas aendert; die Einbettung
       zeigt immer den aktuellen Stand. Das Fenster ist auf 1280 Pixel
       gestellt und wird auf die Kartenbreite heruntergerechnet, damit die
       Seite so aussieht wie auf einem Rechner und nicht wie auf einem
       schmalen Handy. Ohne Skripte, ohne Mausereignisse — es ist ein Bild,
       kein zweites Fenster zum Bedienen. */
    if(cfg.einbettung&&cfg.einbettung.src){
      const fig=el('figure','media-figure');
      const rahmen=el('div','embed-frame');
      const f=document.createElement('iframe');
      f.src=cfg.einbettung.src;
      f.loading='lazy';
      f.setAttribute('sandbox','');
      f.setAttribute('scrolling','no');
      f.setAttribute('aria-hidden','true');
      f.tabIndex=-1;
      rahmen.appendChild(f);
      // Der Rahmen selbst nimmt keine Klicks an, darum der Verweis darunter.
      const a=document.createElement('a');
      a.className='embed-open';a.href=cfg.einbettung.src;
      a.target='_blank';a.rel='noopener noreferrer';
      a.textContent=cfg.einbettung.titel||I18N.t('media.openPage');
      fig.appendChild(rahmen);
      fig.appendChild(a);
      box.appendChild(fig);

      /* Erst messen, wenn der Rahmen im Dokument haengt — vorher ist seine
         Breite 0 und der Massstab entsprechend auch. Danach bei jeder
         Aenderung nachziehen: ResizeObserver deckt Kartenbreite und
         Seitenleiste ab, das resize-Ereignis aeltere Browser ohne
         ResizeObserver. */
      const massstab=()=>{
        const b=rahmen.clientWidth;
        if(b)f.style.transform='scale('+(b/1280)+')';
      };
      massstab();
      requestAnimationFrame(massstab);
      f.addEventListener('load',massstab);
      window.addEventListener('resize',massstab);
      if(window.ResizeObserver)new ResizeObserver(massstab).observe(rahmen);
    }

    /* Karussell statt Raster: nur ein Bild ist zu sehen, Pfeile und Punkte
       blaettern durch die uebrigen. Bei nur einem Screenshot bleiben Pfeile
       und Punkte weg — da gibt es nichts zum Durchklicken. Ein Klick auf
       das Bild selbst oeffnet weiterhin die Vollansicht (dieselbe
       .shot-Klasse, dieselbe Klick-Delegation wie vorher). */
    if(cfg.shots&&cfg.shots.length){
      const mehrere=cfg.shots.length>1;
      const carousel=el('div','shot-carousel'+(cfg.format?' '+cfg.format:''));
      carousel.dataset.group=box.dataset.media;

      const slide=el('button','shot sc-slide');
      slide.type='button';
      slide.dataset.group=box.dataset.media;
      slide.dataset.index='0';
      slide.setAttribute('aria-label',I18N.t('media.enlargeScreenshot')+(cfg.shots[0].alt||(I18N.t('media.imageFallback')+1)));
      const img=document.createElement('img');
      img.dataset.src=cfg.shots[0].src;img.alt=cfg.shots[0].alt||'';img.loading='lazy';img.decoding='async';
      slide.appendChild(img);
      carousel.appendChild(slide);

      if(mehrere){
        const prev=el('button','sc-nav sc-prev','‹');
        prev.type='button';prev.setAttribute('aria-label',I18N.t('media.prevScreenshot'));
        const next=el('button','sc-nav sc-next','›');
        next.type='button';next.setAttribute('aria-label',I18N.t('media.nextScreenshot'));
        carousel.appendChild(prev);
        carousel.appendChild(next);

        const dots=el('div','sc-dots');
        cfg.shots.forEach((s,i)=>{
          const dot=el('button','sc-dot'+(i===0?' active':''));
          dot.type='button';
          dot.dataset.index=String(i);
          dot.setAttribute('aria-label',I18N.t('media.gotoScreenshot')+(i+1));
          dots.appendChild(dot);
        });
        carousel.appendChild(dots);
      }

      box.appendChild(carousel);
    }

    /* Platzhalter: nur, solange fuer diese Sorte nichts Echtes vorliegt.
       Ein Video ersetzt den Videorahmen, Bilder ersetzen die Kacheln —
       beides kann nebeneinander stehen. */
    const ph=PLATZHALTER_ZEIGEN?cfg.platzhalter:null;
    if(ph){
      if(ph.video&&!(cfg.video&&cfg.video.src)){
        box.appendChild(el('div','video-ph','<span>'+I18N.t('media.videoComing')+'</span>'));
      }
      if(ph.anzahl&&!(cfg.shots&&cfg.shots.length)){
        const grid=el('div','shot-grid ph-grid'+(cfg.format==='quer'?' quer':''));
        for(let i=0;i<ph.anzahl;i++)grid.appendChild(el('div','shot ph','<span>'+I18N.t('media.imageComing')+'</span>'));
        box.appendChild(grid);
      }
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

/* ── Bilderstrecken auf der Interessen-Seite ──
   Ein waagrechter Streifen mit Einrastpunkten. Die Knoepfe scrollen ihn,
   ein Klick auf ein Bild oeffnet dieselbe Vollansicht wie bei den
   Projekten — dafuer werden die Listen unter einem eigenen Namen in
   MEDIA hinterlegt. */
function renderSliders(){
  document.querySelectorAll('[data-slider]').forEach(box=>{
    const key=box.dataset.slider;
    const bilder=INTERESSEN[key]||[];
    box.innerHTML='';

    // Solange keine Bilder eingetragen sind, stehen hier leere Rahmen.
    // Sie zeigen, wo die Bilder hinkommen, und verschwinden von selbst,
    // sobald oben in INTERESSEN die erste Zeile steht.
    if(!bilder.length){
      const track=el('div','sl-track');
      for(let i=0;i<4;i++)track.appendChild(el('div','shot sl-ph','<span>'+I18N.t('media.imageComing')+'</span>'));
      box.appendChild(track);
      return;
    }

    const gruppe='int-'+key;
    MEDIA[gruppe]={shots:bilder};


    const track=el('div','sl-track');
    bilder.forEach((b,i)=>{
      const btn=el('button','shot sl-item');
      btn.type='button';
      btn.dataset.group=gruppe;
      btn.dataset.index=String(i);
      btn.setAttribute('aria-label',I18N.t('media.enlargeImage')+(b.alt||(I18N.t('media.imageFallback')+(i+1))));
      const img=document.createElement('img');
      img.dataset.src=b.src;img.alt=b.alt||'';img.loading='lazy';img.decoding='async';
      // Die Kachel ist immer gleich gross, die Bilder sind es nicht. Steht
      // das Wichtige nicht in der Mitte, verschiebt ausschnitt den
      // sichtbaren Bereich — 0% ganz nach links, 100% ganz nach rechts.
      if(b.ausschnitt)img.style.objectPosition=b.ausschnitt;
      btn.appendChild(img);
      track.appendChild(btn);
    });
    box.appendChild(track);

    // Bei einem einzelnen Bild gibt es nichts zu blaettern.
    if(bilder.length>1){
      const nav=el('div','sl-nav');
      nav.innerHTML=
        '<button type="button" class="sl-btn" data-dir="-1" aria-label="'+esc(I18N.t('media.scrollLeft'))+'">‹</button>'+
        '<button type="button" class="sl-btn" data-dir="1" aria-label="'+esc(I18N.t('media.scrollRight'))+'">›</button>'+
        '<span class="sl-count">'+bilder.length+esc(I18N.t('media.imagesSuffix'))+'</span>';
      box.appendChild(nav);
      dragbar(track);
      track.addEventListener('scroll',()=>randKnoepfe(box),{passive:true});
      // Erst nach dem Layout messen, sonst ist die Breite noch 0.
      requestAnimationFrame(()=>randKnoepfe(box));
    }
  });
}

/* Schrittweite: genau ein Bild samt Abstand. Vorher war es ein Bruchteil
   der sichtbaren Breite — dabei blieb nach jedem Klick ein anderer
   Bildausschnitt am Rand stehen. */
function slSchritt(track){
  const erst=track.querySelector('.shot');
  if(!erst)return track.clientWidth;
  const abstand=parseFloat(getComputedStyle(track).columnGap)||0;
  return erst.getBoundingClientRect().width+abstand;
}

/* Am Anfang und am Ende ist der jeweilige Knopf wirkungslos — dann soll
   er auch so aussehen und von der Tabulatortaste uebersprungen werden. */
function randKnoepfe(box){
  const track=box.querySelector('.sl-track');
  const links=box.querySelector('.sl-btn[data-dir="-1"]');
  const rechts=box.querySelector('.sl-btn[data-dir="1"]');
  if(!track||!links||!rechts)return;
  const rest=track.scrollWidth-track.clientWidth-track.scrollLeft;
  links.disabled=track.scrollLeft<2;
  rechts.disabled=rest<2;
}

/* Ziehen mit der Maus, wie im Datei-Explorer. Am Ende des Ziehens wird der
   Klick verschluckt, sonst oeffnet jedes Ziehen die Vollansicht. */
function dragbar(track){
  let unten=false,startX=0,startL=0,gezogen=false;

  track.addEventListener('pointerdown',e=>{
    if(e.button!==0||e.pointerType==='touch')return; // Finger kann der Browser besser
    unten=true;gezogen=false;
    startX=e.clientX;startL=track.scrollLeft;
    track.classList.add('sl-dragging');
  });

  track.addEventListener('pointermove',e=>{
    if(!unten)return;
    const weg=e.clientX-startX;
    if(Math.abs(weg)>4){
      gezogen=true;
      if(track.hasPointerCapture&&!track.hasPointerCapture(e.pointerId))
        track.setPointerCapture(e.pointerId);
    }
    if(gezogen){track.scrollLeft=startL-weg;e.preventDefault();}
  });

  const los=e=>{
    if(!unten)return;
    unten=false;
    track.classList.remove('sl-dragging');
    if(e&&e.pointerId!=null&&track.hasPointerCapture&&track.hasPointerCapture(e.pointerId))
      track.releasePointerCapture(e.pointerId);
    // Flagge einen Wimpernschlag stehen lassen: der Klick kommt erst danach.
    if(gezogen)setTimeout(()=>{gezogen=false;},0);
  };
  track.addEventListener('pointerup',los);
  track.addEventListener('pointercancel',los);
  track.addEventListener('pointerleave',los);

  track.addEventListener('click',e=>{
    if(gezogen){e.preventDefault();e.stopPropagation();}
  },true);
}

document.addEventListener('click',e=>{
  const b=e.target.closest('.sl-btn');
  if(!b)return;
  const box=b.closest('[data-slider]');
  const track=box.querySelector('.sl-track');
  if(!track)return;
  const sanft=!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  track.scrollBy({left:Number(b.dataset.dir)*slSchritt(track),
                  behavior:sanft?'smooth':'auto'});
});

/* ══════════════════════════════════════════════════════════════════
   HÖRSTATISTIKEN  —  stats.fm

   Die oeffentliche API von stats.fm erlaubt Anfragen aus dem Browser
   (Access-Control-Allow-Origin: *), deshalb braucht es keinen eigenen
   Serverdienst dazwischen. Ein iframe waere nicht gegangen: stats.fm
   schickt x-frame-options: SAMEORIGIN.

   Geladen wird erst, wenn der Abschnitt sichtbar wird — die Startseite
   soll nicht auf einen fremden Dienst warten. Antwortet er nicht, bleibt
   der Verweis auf das Profil stehen, der im HTML schon drin ist.
══════════════════════════════════════════════════════════════════ */
const SFM_API='https://api.stats.fm/api/v1/users/';
const SFM_ZEITRAUM='weeks';   // letzte vier Wochen

async function ladeStatsfm(box){
  const user=box.dataset.user;
  if(!user||box.dataset.geladen)return;
  box.dataset.geladen='1';

  const hole=async pfad=>{
    const r=await fetch(SFM_API+encodeURIComponent(user)+pfad,{headers:{Accept:'application/json'}});
    if(!r.ok)throw new Error('stats.fm antwortet mit '+r.status);
    return r.json();
  };

  try{
    const [profil,titel,kuenstler]=await Promise.all([
      hole(''),
      hole('/top/tracks?range='+SFM_ZEITRAUM+'&limit=5'),
      hole('/top/artists?range='+SFM_ZEITRAUM+'&limit=5')
    ]);
    zeigeStatsfm(box,profil.item||{},
      (titel.items||[]).slice(0,5),(kuenstler.items||[]).slice(0,5));
  }catch(err){
    // Kein Alarm auf der Seite: der Verweis auf das Profil steht ja da.
    console.warn('Hörstatistiken nicht geladen:',err.message);
    box.dataset.geladen='';
  }
}

function zeigeStatsfm(box,profil,titel,kuenstler){
  if(!titel.length&&!kuenstler.length)return;
  const url='https://stats.fm/'+(profil.customId||box.dataset.user);

  const kopf=el('div','sfm-head');
  if(profil.image){
    const img=document.createElement('img');
    img.className='sfm-avatar';img.src=profil.image;img.alt='';
    img.loading='lazy';img.decoding='async';
    kopf.appendChild(img);
  }
  kopf.appendChild(el('div','sfm-ident',
    '<span class="sfm-name">'+esc(profil.displayName||'stats.fm')+'</span>'+
    '<span class="sfm-sub">'+esc(I18N.t('statsfm.lastWeeks'))+'</span>'));

  const spalte=(titel2,eintraege,bild,zeile1,zeile2)=>{
    const s=el('div','sfm-col');
    s.appendChild(el('h4','sfm-col-t',esc(titel2)));
    const ol=document.createElement('ol');
    ol.className='sfm-list';
    eintraege.forEach((e,i)=>{
      const li=document.createElement('li');
      li.className='sfm-item';
      const q=bild(e);
      li.innerHTML='<span class="sfm-pos">'+(i+1)+'</span>'+
        (q?'<img class="sfm-cover" src="'+esc(q)+'" alt="" loading="lazy" decoding="async">':'')+
        '<span class="sfm-txt"><span class="sfm-t1">'+esc(zeile1(e))+'</span>'+
        (zeile2(e)?'<span class="sfm-t2">'+esc(zeile2(e))+'</span>':'')+'</span>';
      ol.appendChild(li);
    });
    s.appendChild(ol);
    return s;
  };

  const raster=el('div','sfm-cols');
  if(titel.length){
    raster.appendChild(spalte(I18N.t('statsfm.tracks'),titel,
      e=>(e.track&&e.track.albums&&e.track.albums[0]||{}).image,
      e=>(e.track||{}).name||'',
      e=>((e.track||{}).artists||[]).map(a=>a.name).join(', ')));
  }
  if(kuenstler.length){
    raster.appendChild(spalte(I18N.t('statsfm.artists'),kuenstler,
      e=>(e.artist||{}).image,
      e=>(e.artist||{}).name||'',
      ()=>''));
  }

  const fuss=document.createElement('a');
  fuss.className='sfm-link';
  fuss.href=url;fuss.target='_blank';fuss.rel='noopener noreferrer';
  fuss.textContent=I18N.t('statsfm.fullProfile');

  box.innerHTML='';
  box.classList.add('sfm-geladen');
  box.appendChild(kopf);
  box.appendChild(raster);
  box.appendChild(fuss);
}

function beobachteStatsfm(){
  const box=$('statsfm');
  if(!box)return;
  if(!('IntersectionObserver'in window)){ladeStatsfm(box);return;}
  const beob=new IntersectionObserver(eintraege=>{
    eintraege.forEach(e=>{
      if(e.isIntersecting){beob.disconnect();ladeStatsfm(box);}
    });
  },{rootMargin:'200px'});
  beob.observe(box);
}

/* ── Karussell-Vorschau in den Projektkarten ──
   Wechselt nur das eine sichtbare Bild aus, statt alle Screenshots als
   Raster gleichzeitig zu zeigen. Ein Klick auf das Bild oeffnet weiterhin
   die Vollansicht unten — dort steckt schon die Pfeiltasten-Navigation. */
function setCarouselSlide(carousel,index){
  const cfg=MEDIA[carousel.dataset.group];
  if(!cfg||!cfg.shots||!cfg.shots.length)return;
  const n=cfg.shots.length;
  index=(index+n)%n;
  const s=cfg.shots[index];
  const slide=carousel.querySelector('.sc-slide');
  const img=slide.querySelector('img');
  slide.dataset.index=String(index);
  slide.setAttribute('aria-label',I18N.t('media.enlargeScreenshot')+(s.alt||(I18N.t('media.imageFallback')+(index+1))));
  img.src=s.src;
  img.alt=s.alt||'';
  carousel.querySelectorAll('.sc-dot').forEach((d,i)=>d.classList.toggle('active',i===index));
}
document.addEventListener('click',e=>{
  const nav=e.target.closest('.sc-prev,.sc-next,.sc-dot');
  if(!nav)return;
  const carousel=nav.closest('.shot-carousel');
  if(!carousel)return;
  const aktuell=Number(carousel.querySelector('.sc-slide').dataset.index);
  if(nav.classList.contains('sc-dot'))setCarouselSlide(carousel,Number(nav.dataset.index));
  else setCarouselSlide(carousel,aktuell+(nav.classList.contains('sc-prev')?-1:1));
});

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
/* Anzeigegroesse in der Vollansicht.

   max-width allein reicht nicht: es kann ein Bild nur kleiner machen, nie
   groesser. Kleine Aufnahmen — der Screenshot von "kubectl get pods" ist
   815 Pixel breit — standen deshalb als Briefmarke mitten in der schwarzen
   Flaeche. Hier wird die Breite ausgerechnet: so gross wie der Platz
   erlaubt, aber hoechstens doppelt so gross wie das Original. Weiter
   hochgerechnet wird Text auf einem Bildschirmfoto nur matschig.

   Die Hoehe bleibt auf auto, damit das Seitenverhaeltnis stimmt und der
   Rahmen genau am Bild sitzt statt mit unsichtbaren Balken daneben. */
function lbGroesse(){
  const img=$('lbImg');
  if(!img.naturalWidth)return;
  const platzB=window.innerWidth*0.94;
  const platzH=window.innerHeight*0.80-40;   // 40px fuer die Bildunterschrift
  const faktor=Math.min(2,platzB/img.naturalWidth,platzH/img.naturalHeight);
  img.style.width=Math.round(img.naturalWidth*faktor)+'px';
}
window.addEventListener('resize',()=>{
  if(lightbox.classList.contains('show'))lbGroesse();
});

function showLbImage(){
  const s=lbGroup[lbIndex];
  const img=$('lbImg');
  img.style.width='';   // Rest vom vorherigen Bild
  img.src=s.src;
  img.alt=s.alt||'';
  if(img.complete)lbGroesse();
  else img.addEventListener('load',lbGroesse,{once:true});
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
  nav.setAttribute('aria-label',I18N.t('outline.navLabel'));
  nav.setAttribute('data-i18n-aria-label','outline.navLabel');
  /* Die Leiste bleibt eine einzige Zeile und laeuft bei Bedarf seitwaerts.
     Mit Umbruch wuchs sie auf schmaleren Bildschirmen auf drei Zeilen und
     nahm oben dauerhaft ueber hundert Pixel Lesebereich weg. Die Beschriftung
     "Abschnitt" faellt weg; die Titel darunter sagen von selbst, was sie
     sind, und fuer Vorleseprogramme steht es weiterhin im aria-label. */
  radSeitwaerts(nav);

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

  /* Die Leiste ist eine einzige Zeile: bei vielen Titeln liegt die gerade
     gelesene Marke leicht ausserhalb des sichtbaren Streifens. Sie wird
     nachgezogen — aber nur waagrecht, "nearest" haelt den Text darunter in
     Ruhe. */
  panel.querySelector('.outline a.current')
    ?.scrollIntoView({block:'nearest',inline:'nearest'});
}
// Der Scroll-Listener dazu steht weiter unten gebuendelt (onEditorScroll).

/* ── Ausfuehrliches einklappen ──
   Sichtbar bleibt, was zum Ueberfliegen reicht: Art des Projekts, Titel,
   Abstract, Bilder, die eigene Rolle, der Stack und die Verweise. Der
   lange Fliesstext und die restlichen Details — Gelerntes, was ich heute
   anders mache — wandern hinter einen Schalter.

   Der Grund: die Details waren mit Abstand der laengste Block einer Karte,
   bei manchen Projekten fast die Haelfte der Hoehe. Zehn Karten mit je
   drei Absaetzen nebeneinander liest niemand; man sucht erst das Projekt
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
    // die Reihenfolge stimmt: erst was bleibt, dann was sich oeffnet.
    const anker = meta || body;
    anker.parentNode.insertBefore(wrap, anker.nextSibling);
    wrap.appendChild(btn);
    wrap.appendChild(holder);
    if(body) holder.appendChild(body);

    // Von den Details bleibt die erste Zeile stehen — das ist die Rolle,
    // und die ist fuer einen Betrieb die wichtigste Angabe der Karte.
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

/* Ein Umschalter fuer alle Faltungen — die erzeugten oben und die, die
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
   Weg ueber ein verstecktes Feld versucht — erst dann gilt es als
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

   Vorher lief bei jedem einzelnen Scroll-Pixel ein querySelectorAll ueber
   das ganze Dokument, und fuer jedes gefundene Element wurde
   getBoundingClientRect() aufgerufen — bei 62 Elementen also 62 erzwungene
   Layoutberechnungen pro Ereignis.

   Ein IntersectionObserver macht dasselbe, aber der Browser rechnet es
   selbst und meldet sich nur, wenn ein Element tatsaechlich sichtbar wird.
   Kein Scroll-Listener noetig.
═══════════════════════════════════ */
const revealObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries,obs)=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        entry.target.classList.add('in');
        obs.unobserve(entry.target); // einmal eingeblendet, bleibt eingeblendet
      });
    },{root:editorScroll,rootMargin:'0px 0px -5% 0px'})
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

   Statt mehrerer Listener, die unabhaengig voneinander bei jedem Pixel
   feuern, gibt es einen einzigen. Er sammelt die Aufgaben und fuehrt sie
   gebuendelt im naechsten Animationsbild aus (requestAnimationFrame) —
   also hoechstens einmal pro Bildwiederholung statt dutzende Male.

   Andere Skripte haengen sich mit onEditorScroll(fn) ein, damit nicht
   jedes seinen eigenen Listener mitbringt.
═══════════════════════════════════ */
const scrollJobs=[];
let scrollScheduled=false;

function onEditorScroll(fn){
  scrollJobs.push(fn);
}

editorScroll.addEventListener('scroll',()=>{
  if(scrollScheduled)return;
  scrollScheduled=true;
  requestAnimationFrame(()=>{
    scrollScheduled=false;
    scrollJobs.forEach(fn=>fn());
  });
},{passive:true});

onEditorScroll(updateOutlineState);

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
  b.setAttribute('aria-label',show?I18N.t('login.hidePw'):I18N.t('login.showPw'));
  i.focus();
}

// Beschriftung des Augensymbols haengt vom Feldzustand ab, nicht von
// data-i18n-aria-label allein — beim Sprachwechsel deshalb nachziehen,
// sonst faellt sie auf die im HTML hinterlegte Grundstellung zurueck.
document.addEventListener('lr:langchange',()=>{
  const i=$('loginInput'),b=$('loginTog');
  if(i&&b)b.setAttribute('aria-label',i.type==='password'?I18N.t('login.showPw'):I18N.t('login.hidePw'));
});

async function doLogin(){
  const pw=$('loginInput').value;
  const btn=$('loginBtn');
  const err=$('loginErr');
  if(!pw)return;
  btn.disabled=true;btn.textContent=I18N.t('login.checking');err.style.display='none';
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
      err.textContent=data.error||I18N.t('login.error');
      err.style.display='flex';
      $('loginInput').focus();
    }
  }catch(e){
    err.textContent=I18N.t('login.connectionError');
    err.style.display='flex';
  }
  btn.disabled=false;btn.textContent=I18N.t('login.enter');
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
  /* Die geholten Zeugnisse liegen als oertliche Adressen im Speicher des
     Tabs. Beim Abmelden gehoeren sie weg, sonst sind sie ueber die alte
     blob:-Adresse weiter lesbar. */
  zeugnisse.forEach(u=>URL.revokeObjectURL(u));
  zeugnisse.clear();
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
  el.textContent=ok?I18N.t('chrome.loggedIn'):I18N.t('chrome.notLoggedIn');
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
            '<div class="note-sem">'+esc(n.semester)+'</div>'+
            (n.datei
              ? '<div class="note-akt">'+
                  '<button type="button" class="note-btn" data-zeugnis="'+esc(n.datei)+'" data-tun="vorschau">'+
                    '<span aria-hidden="true">▤</span> '+esc(I18N.t('noten.preview'))+'</button>'+
                  '<button type="button" class="note-btn" data-zeugnis="'+esc(n.datei)+'" data-tun="laden">'+
                    '<span aria-hidden="true">⭳</span> PDF</button>'+
                '</div>'
              : '')+
            '</div>').join('')+
          '</div>'+
          '<div id="zeugnis-vorschau" class="zeugnis-vorschau" hidden></div>'+
          '<p class="noten-avg">Durchschnitt: <strong>'+avg+'</strong></p>';
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

/* ── Projekte nach Art filtern ──
   Die Seite ist lang: wer nur wissen will, was aus der Schule stammt und was
   aus eigenem Antrieb, soll nicht an allen zehn Karten vorbeiscrollen
   muessen. Geblendet werden die beiden Abschnitte samt Zwischentitel, nicht
   die Karten einzeln — die Trennung steht ohnehin schon im Markup. */
function projekteFiltern(art){
  document.querySelectorAll('.pf-btn').forEach(b=>{
    const an=b.dataset.filter===art;
    b.classList.toggle('aktiv',an);
    b.setAttribute('aria-pressed',an?'true':'false');
  });
  document.querySelectorAll('#panel-projekte [data-art]').forEach(teil=>{
    teil.classList.toggle('is-aus',art!=='alle'&&teil.dataset.art!==art);
  });
  const zahl=$('pfZahl');
  if(zahl){
    const sichtbar=document.querySelectorAll('#panel-projekte .proj-grid:not(.is-aus) .proj-card').length;
    zahl.textContent=sichtbar+' '+I18N.t(sichtbar===1?'projekte.filter.countOne':'projekte.filter.count');
  }
}

document.addEventListener('click',e=>{
  const b=e.target.closest('.pf-btn');
  if(b)projekteFiltern(b.dataset.filter);
});

/* Die Zahl daneben ist der einzige Text, den nicht das Woerterbuch setzt —
   beim Sprachwechsel also selbst nachziehen, mit der gerade gewaehlten Art. */
document.addEventListener('lr:langchange',()=>{
  const an=document.querySelector('.pf-btn.aktiv');
  if(an)projekteFiltern(an.dataset.filter);
});

/* ── Kompetenznachweise (PDF hinter dem Login) ──
   Die Dateien liegen nicht unter public/, sondern kommen von /api/zeugnis —
   und zwar nur gegen ein gueltiges Token. Ein einfaches <a href> nuetzt hier
   nichts: das Token steht im sessionStorage und muss als Kopfzeile mit, also
   wird die Datei geholt und daraus eine oertliche Adresse gemacht.
   Einmal geholt, bleibt sie liegen — Vorschau und Download teilen sie sich. */
const zeugnisse=new Map();

async function zeugnisUrl(modul){
  if(zeugnisse.has(modul))return zeugnisse.get(modul);
  const res=await fetch('/api/zeugnis?modul='+encodeURIComponent(modul),
    {headers:{'Authorization':'Bearer '+token}});
  if(!res.ok){
    if(res.status===401)doLogout();
    throw new Error('Zeugnis nicht erhalten ('+res.status+')');
  }
  const url=URL.createObjectURL(await res.blob());
  zeugnisse.set(modul,url);
  return url;
}

/* Ob eine PDF im Rahmen wirklich erscheint, entscheidet der Browser des
   Besuchers, nicht diese Seite: ohne eingebaute PDF-Anzeige (iOS, abgeschaltet,
   manche Firmenrechner) bleibt der Rahmen einfach leer — ein grauer Kasten
   ohne Erklaerung, ausgerechnet bei den Zeugnissen. Darum wird kurz nach dem
   Laden nachgesehen, ob etwas darin steht, und sonst ehrlich umgeschaltet auf
   einen deutlichen Verweis. Wirft der Zugriff einen Fehler, ist das Dokument
   fremd — dann hat der Browser es sehr wohl angezeigt. */
function pruefeVorschau(feld,url){
  const rahmen=feld.querySelector('iframe');
  if(!rahmen)return;
  setTimeout(()=>{
    if(!rahmen.isConnected)return;
    let leer=false;
    try{
      const doc=rahmen.contentDocument;
      leer=!!doc&&!doc.querySelector('embed')&&(!doc.body||doc.body.childElementCount===0);
    }catch(e){ leer=false; }
    if(!leer)return;
    rahmen.remove();
    const hinweis=el('div','zeugnis-ersatz',
      '<p>'+esc(I18N.t('noten.noEmbed'))+'</p>'+
      '<a class="cta" href="'+url+'" target="_blank" rel="noopener noreferrer">'+
        esc(I18N.t('noten.openTab'))+'</a>');
    feld.appendChild(hinweis);
  },1200);
}

/* Ein Klickfaenger fuer alle Karten statt eines Zuhoerers je Schaltflaeche —
   die Karten werden nach jeder Anmeldung neu gebaut. */
document.addEventListener('click',async e=>{
  const zu=e.target.closest('[data-zu]');
  if(zu){
    const feld=$('zeugnis-vorschau');
    if(feld){feld.hidden=true;feld.innerHTML='';feld.dataset.modul='';}
    return;
  }
  const btn=e.target.closest('.note-btn');
  if(!btn)return;
  const modul=btn.dataset.zeugnis, feld=$('zeugnis-vorschau');
  const beschriftung=btn.innerHTML;
  btn.disabled=true;
  try{
    const url=await zeugnisUrl(modul);
    if(btn.dataset.tun==='laden'){
      const a=document.createElement('a');
      a.href=url;a.download='uek-modul-'+modul+'-luis-rosado.pdf';
      document.body.appendChild(a);a.click();document.body.removeChild(a);
    }else if(feld){
      // Nochmal auf dieselbe Schaltflaeche: wieder zuklappen.
      if(!feld.hidden&&feld.dataset.modul===modul){
        feld.hidden=true;feld.innerHTML='';feld.dataset.modul='';
      }else{
        /* Kopfzeile mit Ausweichweg: manche Browser zeigen eingebettete PDF
           nicht an (Anzeige abgeschaltet, iOS). Dann bliebe ohne den Verweis
           nur eine leere Flaeche stehen. */
        feld.dataset.modul=modul;
        feld.innerHTML=
          '<div class="zeugnis-kopf">'+
            '<span class="zeugnis-titel">'+esc(I18N.t('noten.previewTitle'))+' '+esc(modul)+'</span>'+
            '<a class="zeugnis-link" href="'+url+'" target="_blank" rel="noopener noreferrer">'+
              esc(I18N.t('noten.openTab'))+'</a>'+
            '<button type="button" class="zeugnis-link" data-zu="1">'+esc(I18N.t('noten.close'))+'</button>'+
          '</div>'+
          '<iframe src="'+url+'" title="'+esc(I18N.t('noten.previewTitle'))+' '+esc(modul)+'"></iframe>';
        feld.hidden=false;
        pruefeVorschau(feld,url);
        feld.scrollIntoView({block:'nearest',behavior:reduceMotion?'auto':'smooth'});
      }
    }
  }catch(err){
    console.error(err);
    if(feld){
      feld.dataset.modul='';
      feld.innerHTML='<p class="zeugnis-fehler">'+esc(I18N.t('noten.fileError'))+'</p>';
      feld.hidden=false;
    }
  }finally{
    btn.disabled=false;btn.innerHTML=beschriftung;
  }
});

function downloadNotenCsv(){
  if(!lastNoten||!lastNoten.length)return;
  const rows=[['Fach','Note','Semester'],...lastNoten.map(n=>[n.fach,n.note,n.semester])];
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');
  triggerDownload(new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'}),'noten-luis-rosado.csv');
}

/* jsPDF wird erst geholt, wenn jemand den Lebenslauf als PDF speichert —
   eine drittel Megabyte, die sonst niemand braucht.

   Das ist der einzige fremde Code, der auf dieser Seite ausgefuehrt wird, und
   er laeuft genau dort, wo die geschuetzten Daten liegen. Deshalb haengt am
   Skript eine Pruefsumme: Der Browser rechnet nach dem Laden selbst nach und
   fuehrt die Datei nur aus, wenn sie Byte fuer Byte die erwartete ist. Wird
   die Fassung auf dem CDN je ausgetauscht — versehentlich oder nicht —,
   bleibt sie liegen, statt hier Zugriff auf Noten und Lebenslauf zu bekommen.

   Wird die Version gewechselt, muss die Pruefsumme mit:
   curl -s <URL> | openssl dgst -sha384 -binary | openssl base64 -A */
const JSPDF_URL='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
const JSPDF_SRI='sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk';

let jsPdfLoading=null;
function loadJsPdf(){
  if(window.jspdf)return Promise.resolve();
  if(jsPdfLoading)return jsPdfLoading;
  jsPdfLoading=new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src=JSPDF_URL;
    s.integrity=JSPDF_SRI;
    s.crossOrigin='anonymous';   // ohne das prueft der Browser die Summe nicht
    s.onload=resolve;
    s.onerror=()=>{
      jsPdfLoading=null;   // ein spaeterer Versuch soll es neu probieren duerfen
      reject(new Error('jsPDF konnte nicht geladen oder nicht geprueft werden.'));
    };
    document.head.appendChild(s);
  });
  return jsPdfLoading;
}

async function downloadCvPdf(){
  if(!lastLebenslauf)return;
  const btn=$('cv-dl');
  const orig=btn.textContent;
  btn.textContent=I18N.t('cv.generatingPdf');btn.disabled=true;
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
    alert(I18N.t('cv.pdfError'));
  }
  btn.textContent=orig;btn.disabled=false;
}

/* ═══════════════════════════════════
   START
═══════════════════════════════════ */
function startApp(){
  if(token&&verifyToken())updateAuth(true);
  else{token=null;sessionStorage.removeItem('lr_token');}

  /* Die Zahl an der Projekt-Schaltfläche in der Aktivitätsleiste zählt die
     Karten selbst ab. Sie stand vorher von Hand im HTML und war nach dem
     Nachtragen eines Projekts prompt falsch. */
  projekteFiltern('alle');
  const projZahl=document.getElementById('actProjCount');
  if(projZahl)projZahl.textContent=document.querySelectorAll('#panel-projekte .proj-card').length;
  renderProjectMedia();
  renderSliders();
  beobachteStatsfm();

  const fromHash=location.hash.replace('#','');
  const start=(fromHash&&LANG[fromHash])?fromHash:'home';
  openTab(start);
  initReveals();
}
