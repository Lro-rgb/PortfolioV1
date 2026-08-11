/* ═══════════════════════════════════
   KONSTANTEN
═══════════════════════════════════ */
const LANG={home:'JSON',skills:'Python',techstack:'TypeScript',projekte:'HTML',interessen:'JSON',kontakt:'SQL',noten:'CSV',cv:'Markdown'};
const LOCKED=['noten','cv'];
const LINE_H=31;

const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let token=sessionStorage.getItem('lr_token')||null;
let pendingPanel=null;
let lastFocusedBeforeLogin=null;

const $=id=>document.getElementById(id);
const editorScroll=$('editorScroll');

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
      startApp();
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

  $('sb-lang').textContent=LANG[name]||'Text';
  setEmptyState(false);
  buildLn(name);
  editorScroll.scrollTop=0;
  $('sb-ln').textContent='1';
  initReveals();
  setHash(name);

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
    $('sb-lang').textContent='—';
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
  history.replaceState(null,'',url);
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

editorScroll.addEventListener('scroll',()=>{
  $('sb-ln').textContent=Math.floor(editorScroll.scrollTop/LINE_H)+1;
});

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
const overlay=$('loginOverlay');
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
  el.className='sb-auth'+(ok?' authed':'');
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
      lastLebenslauf=d.lebenslauf||{ausbildung:[],erfahrung:[],zertifikate:[],sprachen:[]};
      const lv=lastLebenslauf;
      const box=$('cv-content'),dl=$('cv-dl');
      const hasAny=lv.ausbildung.length||lv.erfahrung.length||lv.zertifikate.length||lv.sprachen.length;
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

  const fromHash=location.hash.replace('#','');
  const start=(fromHash&&LANG[fromHash])?fromHash:'home';
  openTab(start);
  initReveals();
}
