/* ═══════════════════════════════════════════════════════════════════════
   tabs.js: Tableiste, Panels, Adresse und Schublade

   Der Kern der Editor-Metapher: welche Datei offen ist, welche die
   aktive ist, was in der Adresse steht und wie der Explorer auf schmalen
   Schirmen zur Schublade wird.

   Teil der früheren app.js. Gemeinsame Helfer kommen aus basis.js, alles
   übrige zwischen den Modulen läuft über LR.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
const LR=window.LR;
const {LANG, LOCKED, MOBILE, reduceMotion, $, editorScroll, scroller, 
       sidebar, backdrop, sbToggle, overlay}=LR;

/* ═══════════════════════════════════
   TABS & PANELS
═══════════════════════════════════ */
function tabEl(name){return document.querySelector('.tab[data-panel="'+name+'"]');}
function isLocked(name){return LOCKED.indexOf(name)!==-1;}
function openTabNames(){
  return Array.from(document.querySelectorAll('.tab:not(.closed)')).map(t=>t.dataset.panel);
}
/**
 * Tabs, auf die gerade ohne Login umgeschaltet werden darf.
 * Die gesperrten Tabs haben keinen Schliessen-Button und gelten damit
 * immer als "offen". Ohne diesen Filter würde das Schliessen des letzten
 * sichtbaren Tabs ungefragt den Login-Dialog aufreissen.
 */
function switchableTabs(){
  const authed=!!LR.angemeldet();
  return openTabNames().filter(n=>authed||!isLocked(n));
}

/**
 * Öffnet einen Tab. Gesperrte Tabs verlangen vorher ein gültiges Token,
 * ohne das wird der Login-Dialog gezeigt und die Auswahl gemerkt.
 */
/* Bilder eines Bereichs wirklich holen.

   loading="lazy" allein hat hier nicht gereicht. Die Bereiche liegen alle im
   selben Dokument und werden nur über eine Klasse ein- und ausgeblendet; für
   den Browser stehen ihre Bilder damit an Position null und gelten als
   sichtbar. Er hat sie deshalb sofort geladen. Beim ersten Aufruf kamen über
   fünf Megabyte herunter, obwohl der Besucher nur die Startseite sieht und
   die Bilder von Interessen und Projekten vielleicht nie ansteuert.

   Darum steht die Adresse zunächst in data-src, wo sie den Browser nicht
   interessiert, und wandert erst hierher, wenn der Bereich geöffnet wird. */
function bilderFreigeben(panel,sofort){
  if(!panel)return;
  panel.querySelectorAll('img[data-src]').forEach(img=>{
    /* Für den Ausdruck muss "lazy" weg. Die noch nie geöffneten Bereiche
       sind in dem Moment ausgeblendet, und ein ausgeblendetes Bild lädt der
       Browser mit lazy grundsätzlich nicht, es bliebe leer, obwohl es auf
       dem Papier stehen soll. */
    if(sofort)img.loading='eager';
    img.src=img.dataset.src;
    delete img.dataset.src;
  });
}

/* Auf Papier stehen alle Bereiche untereinander, auch die nie geöffneten.
   Deren Bilder müssen also vorher noch geholt werden, sonst bleiben im
   Ausdruck Lücken. Gibt die Rückmeldung, wann alles geladen ist, damit der
   Druckbefehl darauf warten kann; der Druckdialog selbst wartet nicht. */
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
    // können, statt vor einem Dialog zu warten, der nie aufgeht.
    new Promise(fertig=>setTimeout(fertig,3000))
  ]);
}
/* Sicherheitsnetz für Strg+P und das Browsermenü: dort bleibt keine Zeit
   zum Nachladen, aber angestossen ist besser als gar nicht. */
window.addEventListener('beforeprint',()=>{bilderFreigeben(document,true);});

function openTab(name,opts){
  opts=opts||{};
  const tab=tabEl(name);
  if(!tab)return;

  if(isLocked(name)&&!LR.angemeldet()){
    LR.anmeldenFuer(name);
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
  LR.buildFolds(panel);
  LR.buildOutline(panel);
  scroller().scrollTop=0;
  /* Die Blätterpfeile der Bilderreihen wurden bisher einmal beim Aufbau
     gemessen. Da war das Panel noch ausgeblendet, clientWidth also null und
     beide Pfeile blieben abgeschaltet. Sie wachten erst auf, wenn man die
     Reihe von Hand verschoben hatte. Jetzt wird nachgemessen, sobald der
     Bereich wirklich sichtbar ist. */
  requestAnimationFrame(()=>panel.querySelectorAll('.sl-nav').forEach(nav=>LR.randKnoepfe(nav.parentElement)));
  LR.updateOutlineState();
  LR.initReveals();
  setHash(name);
  closeDrawer(); // auf dem Handy die Schublade nach der Auswahl schliessen

  if(opts.focusTab!==false&&opts.fromKeyboard)tab.focus();
  /* Wer die Datei per Tastatur gewechselt hat, also mit Strg+P, Enter im Explorer,
     Enter auf einem Tab, will danach weiterlesen. Der Fokus stand aber
     noch auf dem Suchfeld, dem Explorer oder der Tableiste, und Bild-ab,
     Leertaste und die Pfeiltasten scrollten deshalb entweder gar nichts
     oder die falsche Leiste. Er wandert jetzt in den Editorbereich, der
     dafür tabindex="-1" trägt. */
  else if(opts.focusEditor)editorScroll.focus({preventScroll:true});
  if(isLocked(name))LR.loadProtected(name);

  tabLauscher.forEach(fn=>fn(name));
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
  if(x){
    e.stopPropagation();
    /* Schliessen nur am aktiven Tab. Die Leiste zeigt alle Dateien von
       Anfang an; an einer, die man noch gar nicht geöffnet hatte, war das
       Kreuz kein Schliessen, sondern ein Fehlgriff. Ein Treffer dort
       öffnet die Datei, wie überall sonst auf dem Tab. */
    const ziel=x.closest('.tab');
    if(ziel.classList.contains('active'))closeTab(ziel.dataset.panel);
    else openTab(ziel.dataset.panel);
    return;
  }
  const tab=e.target.closest('.tab');
  if(tab)openTab(tab.dataset.panel);
});

/* Waagrechte Leisten mit dem Mausrad bedienbar machen: die Tableiste hier,
   die Gliederung in buildOutline. Beide laufen waagrecht, das Rad meldet aber
   nur eine senkrechte Bewegung: ohne Umrechnung scrollt der Inhalt darunter
   und die hinteren Einträge sind auf einem schmaleren Bildschirm gar nicht
   erreichbar. deltaMode 1 heisst "in Zeilen" (Firefox unter Windows);
   ungerechnet wären das drei Pixel pro Umdrehung. */
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
    openTab(tab.dataset.panel,{focusEditor:true});
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

/* ── Explorer & alle anderen [data-open]-Auslöser ──
   detail ist bei einem echten Mausklick die Zahl der Klicks, bei einem
   Klick, den Enter oder die Leertaste auf einem Knopf auslöst, dagegen 0.
   Daran hängt, ob der Fokus anschliessend in den Editor wandert: mit der
   Maus liest man weiter, wo man will; mit der Tastatur bliebe er sonst
   im Explorer hängen und das Blättern ginge ins Leere. */
document.addEventListener('click',e=>{
  const trigger=e.target.closest('[data-open]');
  if(trigger)openTab(trigger.dataset.open,{focusEditor:e.detail===0});
});

$('reopenAll').addEventListener('click',reopenAll);

/* ═══════════════════════════════════
   DEEP LINKING  (#projekte lässt sich verschicken)
═══════════════════════════════════ */
function currentHashPanel(){
  const n=location.hash.replace('#','');
  return LANG[n]?n:'home';
}

/* Solange die Seite noch aufbaut, darf kein Verlaufseintrag entstehen: Der
   erste openTab-Aufruf in startApp soll die Adresse angleichen, nicht einen
   zweiten Eintrag neben den Einstieg legen. Sonst bräuchte es zweimal
   Zurück, um die Seite wieder zu verlassen. */
let navigationBereit=false;

/**
 * Adresse an den offenen Tab angleichen.
 *
 * pushState statt "location.hash = …": eine Zuweisung an location.hash
 * stellt ein hashchange-Event in die Warteschlange, das erst nach dem
 * aktuellen Skriptdurchlauf ankommt. Wer den letzten Tab schliesst, bekäme
 * dann kurz darauf genau diesen Tab wieder aufgerissen. pushState schreibt
 * die Adresse, ohne ein Event auszulösen.
 *
 * Und pushState statt replaceState, damit die Zurück-Taste zwischen den
 * Dateien blättert. Vorher überschrieb jeder Wechsel denselben Eintrag:
 * Wer sich durch fünf Dateien gelesen hatte, verliess mit einem Druck auf
 * Zurück die Seite, statt zur vorigen Datei zu kommen.
 */
function setHash(name){
  if(currentHashPanel()===name)return;
  const url=location.pathname+location.search+(name==='home'?'':'#'+name);
  try{
    if(navigationBereit)history.pushState({panel:name},'',url);
    else history.replaceState({panel:name},'',url);
  }catch(e){
    // Beim Öffnen als lokale Datei oder in einer Vorschau-Ansicht lehnen
    // manche Browser die History-API ab. Die Adresse ist dann nur Beiwerk,
    // ein Fehler hier darf nicht den Rest der Navigation abbrechen.
  }
}

/* Zurück und Vorwärts. Beide Ereignisse können zum selben Schritt
   feuern (popstate und hashchange), der Abgleich mit dem aktiven Tab lässt
   den zweiten Aufruf dann ins Leere laufen. Und weil openTab am Ende selbst
   setHash aufruft, dort aber die Adresse schon stimmt, entsteht beim
   Zurückblättern kein neuer Eintrag. */
function navigiereZuAdresse(){
  const name=currentHashPanel();
  const active=document.querySelector('.tab.active');
  if(active&&active.dataset.panel===name)return;
  openTab(name);
}

window.addEventListener('popstate',navigiereZuAdresse);
// Bleibt zusätzlich für von Hand geänderte Adressen zuständig.
window.addEventListener('hashchange',navigiereZuAdresse);

/* ═══════════════════════════════════
   EXPLORER-SCHUBLADE (nur schmale Bildschirme)

   Auf dem Handy hat die Sidebar keinen Platz neben dem Editor. Statt sie
   ersatzlos auszublenden, dort stehen die Ordnerstruktur und die
   gesperrten Dateien, fährt sie über einen Schalter in der Titelleiste
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
  // Fokus nur zurückholen, wenn er noch in der Schublade steckt,
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

/* Wer nach einem Dateiwechsel etwas nachziehen muss, meldet sich hier an.
   vscode.js nutzt das für die Statusleiste und die zuletzt geöffneten
   Dateien in der Kommandopalette. Früher hat es dafür openTab von aussen
   umschlossen (window.openTab = …), was voraussetzte, dass alle Aufrufe
   über genau diese eine globale Bindung laufen. */
const tabLauscher=[];
function beiTabWechsel(fn){tabLauscher.push(fn);}

/* Waehrend des Seitenaufbaus soll kein Verlaufseintrag entstehen; start.js
   gibt die Navigation frei, sobald der erste Tab offen ist. */
function navigationFreigeben(){navigationBereit=true;}

Object.assign(LR,{openTab, closeTab, reopenAll, alleBilderFreigeben, 
  radSeitwaerts, navigationFreigeben, beiTabWechsel});

})();
