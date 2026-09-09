/* ═══════════════════════════════════════════════════════════════════════
   geschuetzt.js: Anmeldung, geschützte Daten und Downloads

   Alles hinter dem Passwort: der Anmeldedialog, die Noten und der
   Lebenslauf von /api/protected, die PDF von /api/zeugnis und das
   selbstgebaute ZIP. Token und Zustand bleiben in diesem Modul, nach
   aussen gehen nur angemeldet() und anmeldenFuer().

   Teil der früheren app.js. Gemeinsame Helfer kommen aus basis.js, alles
   übrige zwischen den Modulen läuft über LR.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
const LR=window.LR;
const {LOCKED, reduceMotion, $, overlay, el, esc}=LR;

let token=sessionStorage.getItem('lr_token')||null;
let pendingPanel=null;
let lastFocusedBeforeLogin=null;

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
  /* :not([disabled]) ist nötig, weil die Schaltfläche während der
     Prüfung abgeschaltet ist: ohne den Filter landet der Fokus mitten im
     Anmeldevorgang auf einem Knopf, der nichts tut, und die Falle rechnet
     ausserdem mit dem falschen letzten Element. */
  const f=loginBox.querySelectorAll('button:not([disabled]), input:not([disabled]), [href]');
  if(!f.length)return;
  const first=f[0],last=f[f.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
});

// Das Formular fängt die Eingabetaste und den Klick auf ENTER selbst ab.
$('loginForm').addEventListener('submit',e=>{e.preventDefault();doLogin();});
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

// Beschriftung des Augensymbols hängt vom Feldzustand ab, nicht von
// data-i18n-aria-label allein, beim Sprachwechsel deshalb nachziehen,
// sonst fällt sie auf die im HTML hinterlegte Grundstellung zurück.
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
    /* Antwortet nicht die Funktion, sondern z.B. eine Fehlerseite von
       Vercel, ist der Rumpf HTML und res.json() wirft. Früher fiel das mit
       dem echten Verbindungsfehler zusammen und die Seite meldete "keine
       Verbindung", obwohl der Server sehr wohl geantwortet hat. */
    let data=null;
    try{
      data=await res.json();
    }catch(e){
      data=null;
    }
    if(res.ok&&data&&data.token){
      token=data.token;
      sessionStorage.setItem('lr_token',token);
      const target=pendingPanel;
      overlay.classList.remove('show');
      overlay.setAttribute('aria-hidden','true');
      pendingPanel=null;
      lastFocusedBeforeLogin=null;
      updateAuth(true);
      if(target)LR.openTab(target);
    }else{
      err.textContent=(data&&data.error)||
        (res.ok?I18N.t('login.error')
               :I18N.t('login.serverError')+' ('+res.status+')');
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
    if(box)box.innerHTML=hinweis('protected.locked');
    const dl=$(n==='noten'?'noten-dl':'cv-dl');
    if(dl)dl.style.display='none';
    const zip=$(n==='noten'?'noten-zip':'cv-zip');
    if(zip)zip.style.display='none';
  });
  lastNoten=null;lastLebenslauf=null;
  /* Die geholten Zeugnisse liegen als örtliche Adressen im Speicher des
     Tabs. Beim Abmelden gehören sie weg, sonst sind sie über die alte
     blob:-Adresse weiter lesbar. */
  zeugnisse.forEach(u=>URL.revokeObjectURL(u));
  zeugnisse.clear();
  LR.openTab('home');
}

function verifyToken(){
  if(!token)return false;
  try{
    const p=JSON.parse(atob(token.split('.')[1]));
    return p.exp*1000>Date.now();
  }catch(e){return false;}
}

/* Wer auf den Anmeldestatus reagieren muss, meldet sich hier an; vscode.js
   zieht damit die Statusleiste nach. Auch das lief früher über ein
   Umschliessen von window.updateAuth. */
const authLauscher=[];
function beiAnmeldung(fn){authLauscher.push(fn);}

function updateAuth(ok){
  const el=$('sbAuth');
  el.className='tb-auth'+(ok?' authed':'');
  // Die Beschriftung trägt das Schloss als Markup, deshalb innerHTML.
  el.innerHTML=ok?I18N.t('chrome.loggedIn'):I18N.t('chrome.notLoggedIn');
  authLauscher.forEach(fn=>fn(ok));
}

/* ═══════════════════════════════════
   GESCHÜTZTE DATEN LADEN
═══════════════════════════════════ */
/* Als Funktion und nicht als Konstante: Der Text hängt an der gewählten
   Sprache, und die kann sich ändern, nachdem die Datei einmal geladen ist. */
const hinweis=schluessel=>'<span class="protected-hint" data-i18n="'+schluessel+'">'+
  esc(I18N.t(schluessel))+'</span>';
const emptyMsg=()=>'<p class="protected-hint protected-leer">'+
  esc(I18N.t('protected.empty'))+'</p>';
let lastNoten=null,lastLebenslauf=null;

/* Vorschau und Download für eine geschützte PDF. Denselben Knopfsatz
   tragen die Notenkarten und die Unterlagen im Lebenslauf. */
function dokKnoepfe(schluessel){
  return '<div class="note-akt">'+
    '<button type="button" class="note-btn" data-zeugnis="'+esc(schluessel)+'" data-tun="vorschau">'+
      '<span aria-hidden="true">▤</span> '+esc(I18N.t('noten.preview'))+'</button>'+
    '<button type="button" class="note-btn" data-zeugnis="'+esc(schluessel)+'" data-tun="laden">'+
      '<span aria-hidden="true">⭳</span> PDF</button>'+
  '</div>';
}

async function loadProtected(panel){
  if(!token)return;
  /* Bis die Antwort da ist, steht im Feld noch "gesperrt". Das stimmt in
     diesem Moment nicht mehr, der Login ist ja durch. */
  const feld=$(panel==='noten'?'noten-content':'cv-content');
  if(feld)feld.innerHTML=hinweis('protected.loading');
  try{
    const res=await fetch('/api/protected',{headers:{'Authorization':'Bearer '+token}});
    if(!res.ok){doLogout();return;}
    const d=await res.json();

    if(panel==='noten'){
      lastNoten=d.noten||[];
      const box=$('noten-content'),dl=$('noten-dl'),zip=$('noten-zip');
      // Die ZIP fasst immer Lebenslauf und Arbeitsbestätigung mit ein,
      // sie ist also auch ohne eingetragene Noten sinnvoll.
      if(zip)zip.style.display='inline-flex';
      if(!lastNoten.length){
        box.innerHTML=emptyMsg();
        if(dl)dl.style.display='none';
      }else{
        const cc=n=>n>=5?'note-5':n>=4?'note-4':n>=3?'note-3':'note-2';
        const karte=n=>
            '<div class="note-card"><div class="note-fach">'+esc(n.fach)+'</div>'+
            '<div class="note-val '+cc(n.note)+'">'+Number(n.note).toFixed(1)+'</div>'+
            '<div class="note-sem">'+esc(n.semester)+'</div>'+
            (n.datei?dokKnoepfe(n.datei):'')+
            '</div>';
        /* Zwei Klappgruppen statt einer durchgehenden Liste: oben die
           Kompetenznachweise der überbetrieblichen Kurse, darunter die
           Schulzeugnisse. Das Auf- und Zuklappen kann <details> selbst,
           dafür braucht es kein eigenes Javascript. */
        const gruppe=(titel,list,schnitt)=>
          '<details class="doc-gruppe" open><summary>'+esc(titel)+
            '<span class="dg-zahl">'+list.length+'</span></summary>'+
          (list.length
            ? '<div class="noten-grid">'+list.map(karte).join('')+'</div>'+
              (schnitt
                ? '<p class="noten-avg">'+esc(I18N.t('noten.avg'))+' <strong>'+
                    (list.reduce((s,n)=>s+n.note,0)/list.length).toFixed(2)+'</strong></p>'
                : '')
            : emptyMsg())+
          '</details>';
        /* Nur die üK-Module bekommen einen Durchschnitt: sie sind
           gleichartige Einzelnoten. Im Zeugnisblock stehen ein
           Zeugnisdurchschnitt, eine Fachnote und eine Erfahrungsnote
           nebeneinander; deren Mittel wäre keine Note, die es gibt, und
           läge über dem echten Zeugnisdurchschnitt. */
        box.innerHTML=
          gruppe(I18N.t('noten.h.uek'),lastNoten.filter(n=>n.art!=='zeugnis'),true)+
          gruppe(I18N.t('noten.h.zeugnisse'),lastNoten.filter(n=>n.art==='zeugnis'),false)+
          '<div class="zeugnis-vorschau" hidden></div>';
        if(dl)dl.style.display='inline-flex';
      }
    }

    if(panel==='cv'){
      lastLebenslauf=Object.assign(
        {personalien:{},ausbildung:[],erfahrung:[],nebenjobs:[],zertifikate:[],sprachen:[],referenzen:[]},
        d.lebenslauf||{});
      const lv=lastLebenslauf;
      const box=$('cv-content'),dl=$('cv-dl'),zip=$('cv-zip');
      if(zip)zip.style.display='inline-flex';
      const hasAny=lv.ausbildung.length||lv.erfahrung.length||lv.nebenjobs.length||
                   lv.zertifikate.length||lv.sprachen.length;
      {
        const h=(schluessel,abstand)=>'<h3 class="ed-h2"'+(abstand?' style="margin-top:2rem"':'')+'>'+
          esc(I18N.t(schluessel))+'</h3>';
        const tl=list=>list.length
          ? list.map(e=>'<div class="tl-e in"><div class="tl-date">'+esc(e.zeitraum)+'</div>'+
              '<div class="tl-title">'+esc(e.titel)+'</div>'+
              '<div class="tl-sub">'+esc(e.ort)+'<br>'+esc(e.notiz)+'</div></div>').join('')
          : emptyMsg();

        /* Personalien: nur die Felder, die auch gefüllt sind. Ein Lebenslauf
           mit einer leeren Zeile "Telefon:" sagt einem Betrieb nur, was
           fehlt, genauso wie bei den Zertifikaten weiter unten. */
        const felder=[['cv.p.geboren','geburtsdatum'],['cv.p.adresse','adresse'],
                      ['cv.p.telefon','telefon'],['cv.p.email','email'],
                      ['cv.p.nation','staatsangehoerigkeit']]
          .filter(([,f])=>lv.personalien[f])
          .map(([k,f])=>'<div class="fact"><dt>'+esc(I18N.t(k))+'</dt><dd>'+
            (f==='email'
              ? '<a href="mailto:'+esc(lv.personalien[f])+'">'+esc(lv.personalien[f])+'</a>'
              : esc(lv.personalien[f]))+'</dd></div>').join('');
        const personalien=(lv.personalien.name||felder)
          ? h('cv.h.personalien')+
            (lv.personalien.name?'<p class="cv-name">'+esc(lv.personalien.name)+'</p>':'')+
            (felder?'<dl class="fact-row fluss">'+felder+'</dl>':'')
          : '';

        const inhalt=
          personalien+
          '<div class="cv-cols"'+(personalien?' style="margin-top:2rem"':'')+'>'+
            '<div>'+h('cv.h.ausbildung')+'<div class="tl">'+tl(lv.ausbildung)+'</div></div>'+
            '<div>'+h('cv.h.erfahrung')+'<div class="tl">'+tl(lv.erfahrung)+'</div></div>'+
          '</div>'+
          (lv.nebenjobs.length
            ? h('cv.h.nebenjobs',true)+'<div class="tl">'+tl(lv.nebenjobs)+'</div>'
            : '')+
          h('cv.h.sprachen',true)+
          (lv.sprachen.length
            ? '<table class="ed-table"><tr><th>'+esc(I18N.t('cv.th.sprache'))+'</th>'+
              '<th>'+esc(I18N.t('cv.th.niveau'))+'</th></tr>'+
              lv.sprachen.map(s=>'<tr><td>'+esc(s.sprache)+'</td><td><span class="badge bb">'+esc(s.niveau)+'</span></td></tr>').join('')+
              '</table>'
            : emptyMsg())+
          /* Zertifikate erscheinen erst, wenn welche eingetragen sind; eine
             Überschrift mit "noch keine Daten" darunter sagt einem Betrieb
             nur, was fehlt. */
          (lv.zertifikate.length
            ? h('cv.h.zertifikate')+
              '<table class="ed-table"><tr><th>'+esc(I18N.t('cv.th.jahr'))+'</th>'+
              '<th>'+esc(I18N.t('cv.th.titel'))+'</th><th>'+esc(I18N.t('cv.th.anbieter'))+'</th></tr>'+
              lv.zertifikate.map(z=>'<tr><td>'+esc(z.jahr)+'</td><td>'+esc(z.titel)+'</td><td>'+esc(z.anbieter)+'</td></tr>').join('')+
              '</table>'
            : '')+
          /* Referenzen: Telefon/E-Mail bleiben leer, solange die zugehörige
             Umgebungsvariable fehlt, statt eine leere Spalte anzuzeigen. */
          (lv.referenzen.length
            ? h('cv.h.referenzen',true)+
              '<table class="ed-table"><tr><th>'+esc(I18N.t('cv.th.name'))+'</th>'+
              '<th>'+esc(I18N.t('cv.th.rolle'))+'</th><th>'+esc(I18N.t('cv.p.telefon'))+'</th>'+
              '<th>'+esc(I18N.t('cv.p.email'))+'</th></tr>'+
              lv.referenzen.map(r=>'<tr><td>'+esc(r.name)+'</td><td>'+esc(r.rolle)+'</td>'+
                '<td>'+esc(r.telefon||'')+'</td>'+
                '<td>'+(r.email?'<a href="mailto:'+esc(r.email)+'">'+esc(r.email)+'</a>':'')+'</td></tr>').join('')+
              '</table>'
            : '');
        /* Die abgetippten Angaben oben und die unterschriebenen Unterlagen
           unten: derselbe Weg wie bei den Kompetenznachweisen, die Dateien
           kommen erst nach der Tokenprüfung aus /api/zeugnis.

           Die Zeile unter "Arbeitsbestätigung" kommt aus dem ersten Eintrag
           der Berufserfahrung, statt Betrieb und Rolle ein zweites Mal von
           Hand hinzuschreiben, sonst stimmen die beiden Stellen nach der
           ersten Änderung nicht mehr überein. */
        const stelle=lv.erfahrung[0];
        box.innerHTML=(hasAny?inhalt:emptyMsg())+
          h('cv.h.pdf',true)+
          dokKnoepfe('cv')+
          '<div class="zeugnis-vorschau" hidden></div>'+
          h('cv.h.arbeitsbestaetigung',true)+
          (stelle?'<p class="cv-dok-notiz">'+esc(stelle.ort)+', '+esc(stelle.titel)+'.</p>':'')+
          dokKnoepfe('arbeitsbestaetigung')+
          '<div class="zeugnis-vorschau" hidden></div>';
        if(dl)dl.style.display='inline-flex';
      }
    }
  }catch(e){
    /* Ohne diesen Zweig blieb bei einer abgebrochenen Anfrage der Hinweis
       "Lade Daten…" stehen, und zwar für immer. */
    console.error(e);
    if(feld)feld.innerHTML=hinweis('protected.error');
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
  document.body.removeChild(a);
  /* Firefox liest den Blob asynchron nach dem Klick. Wird die URL sofort
     widerrufen, bricht der Download dort manchmal ab, obwohl Chrome und
     Edge das nicht stört. Eine kurze Verzögerung lässt ihn sicher anlaufen. */
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}


/* Noten und Lebenslauf baut das Javascript zusammen, das Wörterbuch
   erwischt sie beim Sprachwechsel also nicht. Steht gerade einer der
   beiden Bereiche offen, wird er neu aufgebaut. */
document.addEventListener('lr:langchange',()=>{
  const aktiv=document.querySelector('.tab.active');
  const name=aktiv&&aktiv.dataset.panel;
  if((name==='noten'||name==='cv')&&angemeldet())loadProtected(name);
});

/* ── Kompetenznachweise (PDF hinter dem Login) ──
   Die Dateien liegen nicht unter public/, sondern kommen von /api/zeugnis,
   und zwar nur gegen ein gültiges Token. Ein einfaches <a href> nützt hier
   nichts: das Token steht im sessionStorage und muss als Kopfzeile mit, also
   wird die Datei geholt und daraus eine örtliche Adresse gemacht.
   Einmal geholt, bleibt sie liegen, Vorschau und Download teilen sie sich. */
const zeugnisse=new Map();

/* Unterlagen, die kein Modulnachweis sind: gleicher Weg, nur mit eigenem
   Titel und eigenem Dateinamen beim Speichern. */
const DOKUMENTE={
  cv:{titel:'dok.cv',datei:'lebenslauf-luis-rosado.pdf'},
  arbeitsbestaetigung:{titel:'dok.arbeitsbestaetigung',datei:'arbeitsbestaetigung-luis-rosado.pdf'}
};
const dokTitel=k=>DOKUMENTE[k]?I18N.t(DOKUMENTE[k].titel):I18N.t('noten.previewTitle')+' '+k;
const dokDatei=k=>DOKUMENTE[k]?DOKUMENTE[k].datei:'uek-modul-'+k+'-luis-rosado.pdf';

/* Welches Vorschaufeld zu einer Schaltfläche gehört, in dieser Reihenfolge:
   das Feld, in dem die Schaltfläche selbst steht (der Schliessen-Knopf),
   dann das Feld direkt unter dem Knopfpaar, so schiebt die Vorschau im
   Lebenslauf die Arbeitsbestätigung nach unten, statt ganz unten
   aufzugehen, und zuletzt das gemeinsame Feld des Reiters, das unter dem
   Notenraster steht. */
const vorschaufeld=el=>{
  const drin=el.closest('.zeugnis-vorschau');
  if(drin)return drin;
  const akt=el.closest('.note-akt'),nach=akt&&akt.nextElementSibling;
  if(nach&&nach.classList.contains('zeugnis-vorschau'))return nach;
  const p=el.closest('.editor-panel');
  return p?p.querySelector('.zeugnis-vorschau'):null;
};

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

/* Früher stand hier eine Prüfung, ob der Browser die PDF im Rahmen wirklich
   anzeigt, und falls nicht, wurde auf einen Verweis umgeschaltet. Die
   Erkennung war nicht zu trauen: Chromes eingebaute PDF-Anzeige meldet einen
   leeren Körper, obwohl sie anzeigt. Die Vorschau ging auf und verschwand
   eine Sekunde später wieder. Jetzt bleibt der Rahmen einfach stehen; wer
   lieber eine ganze Seite will, nimmt "In neuem Tab öffnen" in der
   Kopfzeile. Lieber eindeutig als klug. */

/* Ein Klickfänger für alle Karten statt eines Zuhörers je Schaltfläche,
   die Karten werden nach jeder Anmeldung neu gebaut. */
document.addEventListener('click',async e=>{
  const zu=e.target.closest('[data-zu]');
  if(zu){
    const feld=vorschaufeld(zu);
    if(feld){feld.hidden=true;feld.innerHTML='';feld.dataset.modul='';}
    return;
  }
  const btn=e.target.closest('.note-btn');
  if(!btn)return;
  const modul=btn.dataset.zeugnis, feld=vorschaufeld(btn);
  const beschriftung=btn.innerHTML;
  btn.disabled=true;
  try{
    const url=await zeugnisUrl(modul);
    if(btn.dataset.tun==='laden'){
      const a=document.createElement('a');
      a.href=url;a.download=dokDatei(modul);
      document.body.appendChild(a);a.click();document.body.removeChild(a);
    }else if(feld){
      // Nochmal auf dieselbe Schaltfläche: wieder zuklappen.
      if(!feld.hidden&&feld.dataset.modul===modul){
        feld.hidden=true;feld.innerHTML='';feld.dataset.modul='';
      }else{
        /* Im Notenraster wandert das Vorschaufeld unter die angeklickte
           Karte und läuft dort über alle Spalten, in einem Drittel der
           Breite wäre ein A4-Blatt nicht zu lesen, ganz unten am Ende des
           Rasters sucht man es. */
        const karte=btn.closest('.note-card');
        if(karte&&karte.nextElementSibling!==feld)karte.after(feld);
        /* Kopfzeile mit Ausweichweg: manche Browser zeigen eingebettete PDF
           nicht an (Anzeige abgeschaltet, iOS). Dann bliebe ohne den Verweis
           nur eine leere Fläche stehen. */
        feld.dataset.modul=modul;
        feld.innerHTML=
          '<div class="zeugnis-kopf">'+
            '<span class="zeugnis-titel">'+esc(dokTitel(modul))+'</span>'+
            /* Kein rel="noopener": Safari löst eine blob:-Adresse in einem
               neuen Tab nur auf, wenn der noch den öffnenden Tab als
               Opener kennt. Unbedenklich, die Adresse zeigt auf eine PDF
               ohne Skript, kein Angriffsziel für den Opener-Zugriff. */
            '<a class="zeugnis-link" href="'+url+'" target="_blank" rel="noreferrer">'+
              esc(I18N.t('noten.openTab'))+'</a>'+
            '<button type="button" class="zeugnis-link" data-zu="1">'+esc(I18N.t('noten.close'))+'</button>'+
          '</div>'+
          '<iframe src="'+url+'" title="'+esc(dokTitel(modul))+'"></iframe>';
        feld.hidden=false;
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

/* Lebenslauf und Arbeitsbestätigung liegen als fertige PDF hinter dem Login,
   die Schaltfläche in der Brotkrumenleiste holt beide Dateien dieses Tabs,
   dieselben, die auch die Vorschau zeigt. Früher wurde hier mit jsPDF eine
   eigene PDF aus den Daten gebaut; das war eine zweite, schlechtere Fassung
   desselben Dokuments. */
async function downloadLebenslaufAlle(){
  const btn=$('cv-dl');
  btn.disabled=true;
  try{
    for(const modul of ['cv','arbeitsbestaetigung']){
      const a=document.createElement('a');
      a.href=await zeugnisUrl(modul);a.download=dokDatei(modul);
      document.body.appendChild(a);a.click();document.body.removeChild(a);
    }
  }catch(e){
    console.error(e);
    alert(I18N.t('noten.fileError'));
  }
  btn.disabled=false;
}

/* ── ZIP-Writer von Hand ──
   Diese Seite kommt bewusst ohne eine einzige externe Abhängigkeit aus
   (siehe README), eine Bibliothek wie JSZip nur für den Sammel-Download
   würde das aufgeben. Die Dateien sind PDFs und damit selbst schon
   komprimiert, eine zweite Kompressionsstufe (DEFLATE) brächte kaum etwas
   und bräuchte eine eigene Implementierung davon. Methode "Stored" reicht:
   das ist ein regulärer, gültiger ZIP-Eintrag, nur ohne Kompression. */
const CRC_TABLE=(()=>{
  const t=new Uint32Array(256);
  for(let n=0;n<256;n++){
    let c=n;
    for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);
    t[n]=c>>>0;
  }
  return t;
})();
function crc32(bytes){
  let c=0xFFFFFFFF;
  for(let i=0;i<bytes.length;i++)c=CRC_TABLE[(c^bytes[i])&0xFF]^(c>>>8);
  return (c^0xFFFFFFFF)>>>0;
}
function u16(n){return new Uint8Array([n&0xFF,(n>>>8)&0xFF]);}
function u32(n){return new Uint8Array([n&0xFF,(n>>>8)&0xFF,(n>>>16)&0xFF,(n>>>24)&0xFF]);}
function zipDatum(){
  const d=new Date();
  const zeit=((d.getHours()&0x1F)<<11)|((d.getMinutes()&0x3F)<<5)|((d.getSeconds()>>1)&0x1F);
  const datum=(((d.getFullYear()-1980)&0x7F)<<9)|(((d.getMonth()+1)&0xF)<<5)|(d.getDate()&0x1F);
  return {zeit,datum};
}
function zipBauen(dateien){
  const enc=new TextEncoder();
  const {zeit,datum}=zipDatum();
  const teile=[];      // Blob-Teile, in Reihenfolge
  const eintraege=[];  // für das zentrale Verzeichnis am Ende
  let offset=0;

  dateien.forEach(({name,data})=>{
    const nameBytes=enc.encode(name);
    const crc=crc32(data);
    const groesse=data.length;
    const kopf=[
      u32(0x04034b50),u16(20),u16(0),u16(0),u16(zeit),u16(datum),
      u32(crc),u32(groesse),u32(groesse),u16(nameBytes.length),u16(0),
      nameBytes
    ];
    kopf.forEach(t=>teile.push(t));
    teile.push(data);
    eintraege.push({name:nameBytes,crc,groesse,offset});
    offset+=kopf.reduce((s,t)=>s+t.length,0)+groesse;
  });

  const zentralStart=offset;
  eintraege.forEach(e=>{
    const kopf=[
      u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(zeit),u16(datum),
      u32(e.crc),u32(e.groesse),u32(e.groesse),u16(e.name.length),u16(0),u16(0),
      u16(0),u16(0),u32(0),u32(e.offset),e.name
    ];
    kopf.forEach(t=>teile.push(t));
    offset+=kopf.reduce((s,t)=>s+t.length,0);
  });
  const zentralGroesse=offset-zentralStart;

  teile.push(u32(0x06054b50),u16(0),u16(0),u16(eintraege.length),u16(eintraege.length),
    u32(zentralGroesse),u32(zentralStart),u16(0));

  return new Blob(teile,{type:'application/zip'});
}

/* Ein Download für alles: Kompetenznachweise, Zeugnisse, Lebenslauf und
   Arbeitsbestätigung in einer einzigen ZIP-Datei. Holt die Notenliste bei
   Bedarf selbst nach, falls die Noten-Ansicht noch nie offen war. */
async function downloadAllesAlsZip(){
  const btns=document.querySelectorAll('[data-zip-alles]');
  btns.forEach(b=>b.disabled=true);
  try{
    if(!lastNoten){
      const res=await fetch('/api/protected',{headers:{'Authorization':'Bearer '+token}});
      if(!res.ok){doLogout();return;}
      lastNoten=(await res.json()).noten||[];
    }
    const module=[...new Set(lastNoten.map(n=>n.datei).filter(Boolean))];
    const dateien=[];
    const fehlgeschlagen=[];
    // Eine einzelne kaputte Datei soll nicht die ganze ZIP verhindern, nur
    // eine abgelaufene Sitzung: die betrifft alle Dateien gleichermassen
    // und bricht darum sofort ab, statt jede einzeln scheitern zu lassen.
    for(const modul of ['cv','arbeitsbestaetigung',...module]){
      try{
        const url=await zeugnisUrl(modul);
        const buf=await (await fetch(url)).arrayBuffer();
        dateien.push({name:dokDatei(modul),data:new Uint8Array(buf)});
      }catch(e){
        if(!token||!verifyToken())throw e;
        console.error('ZIP: Datei übersprungen ('+modul+')',e);
        fehlgeschlagen.push(dokDatei(modul));
      }
    }
    if(!dateien.length)throw new Error('Keine Datei konnte geladen werden.');
    triggerDownload(zipBauen(dateien),'unterlagen-luis-rosado.zip');
    if(fehlgeschlagen.length)alert(I18N.t('noten.zip.partial')+fehlgeschlagen.join(', '));
  }catch(e){
    console.error(e);
    alert(I18N.t('noten.fileError'));
  }
  btns.forEach(b=>b.disabled=false);
}

/* ═══════════════════════════════════
   SCHNITTSTELLE NACH AUSSEN
═══════════════════════════════════ */
/* Das Token, der gemerkte Dateiname und der Fokus vor dem Dialog bleiben in
   diesem Modul. Nach draussen gehen nur zwei Fragen: ob jemand angemeldet
   ist, und die Bitte, sich für eine bestimmte Datei anzumelden. */
function angemeldet(){return !!(token&&verifyToken());}

function anmeldenFuer(name){
  pendingPanel=name;
  showLogin();
}

/* Beim Start: ein abgelaufenes Token gleich wegräumen, damit es nicht bei
   jedem Klick erneut geprüft wird. */
function tokenVerwerfen(){
  token=null;
  sessionStorage.removeItem('lr_token');
}

Object.assign(LR,{angemeldet, anmeldenFuer, tokenVerwerfen, updateAuth, 
  doLogout, closeLogin, togglePw, downloadNotenCsv, downloadLebenslaufAlle, 
  downloadAllesAlsZip, loadProtected, beiAnmeldung});

})();
