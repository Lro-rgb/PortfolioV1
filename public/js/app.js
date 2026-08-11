/* ═══════════════════════════════════
   SPLASH SCREEN
═══════════════════════════════════ */
(function(){
  const files=[
    'Lade Erweiterungen...',
    'luis.json',
    'skills.py',
    'techstack.ts',
    'projekte.html',
    'interessen.json',
    'kontakt.sql',
    'unterlagen/noten.csv',
    'unterlagen/lebenslauf.md',
    'Bereit.'
  ];
  const el=document.getElementById('splashFiles');
  const fill=document.getElementById('splashFill');
  const pct=document.getElementById('splashPct');
  const lbl=document.getElementById('splashLabel');
  let i=0;

  function step(){
    if(i>=files.length){
      setTimeout(()=>{
        document.getElementById('splash').classList.add('fade');
        document.getElementById('ide').classList.add('visible');
        setTimeout(()=>{
          document.getElementById('splash').style.display='none';
          initReveals();
          buildLn('home');
        },500);
      },300);
      return;
    }
    const div=document.createElement('div');
    div.className='splash-file active';
    div.textContent='  '+files[i];
    el.appendChild(div);
    if(el.children.length>1) el.children[el.children.length-2].className='splash-file done';
    const p=Math.round((i/(files.length-1))*100);
    fill.style.width=p+'%';
    pct.textContent=p+'%';
    lbl.textContent=i===0?'Initialisiere...':i===files.length-1?'Bereit':'Öffne '+files[i];
    i++;
    setTimeout(step, i===1?400:180);
  }
  step();
})();

/* ═══════════════════════════════════
   TABS & PANELS
═══════════════════════════════════ */
const LANG={home:'JSON',skills:'Python',techstack:'TypeScript',projekte:'HTML',interessen:'JSON',kontakt:'SQL',noten:'CSV',cv:'Markdown'};
let token=sessionStorage.getItem('lr_token')||null;
let pendingPanel=null;

function openTab(el){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.editor-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tree-file').forEach(f=>f.classList.remove('active'));
  el.classList.add('active');
  const name=el.dataset.panel;
  document.getElementById('panel-'+name).classList.add('active');
  document.getElementById('sb-lang').textContent=LANG[name]||'Text';
  syncSb(name);
  buildLn(name);
  document.getElementById('editorScroll').scrollTop=0;
  initReveals();
}
function openTabByName(n){const t=document.querySelector('.tab[data-panel="'+n+'"]');if(t)openTab(t);}
function openLockedTab(el){
  if(token&&verifyToken())unlockOpen(el.dataset.panel);
  else{pendingPanel=el.dataset.panel;showLogin();}
}
function openLockedTabByName(n){const t=document.querySelector('.tab[data-panel="'+n+'"]');if(t)openLockedTab(t);}
function unlockOpen(name){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.editor-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tree-file').forEach(f=>f.classList.remove('active'));
  document.querySelector('.tab[data-panel="'+name+'"]').classList.add('active');
  document.getElementById('panel-'+name).classList.add('active');
  document.getElementById('sb-lang').textContent=LANG[name]||'Text';
  syncSb(name);buildLn(name);
  document.getElementById('editorScroll').scrollTop=0;
  loadProtected(name);
}
function syncSb(name){
  document.querySelectorAll('.tree-file').forEach(f=>{
    const oc=f.getAttribute('onclick')||'';
    if(oc.includes("'"+name+"'"))f.classList.add('active');
  });
}

/* ═══════════════════════════════════
   FOLDER TOGGLES
═══════════════════════════════════ */
function toggleFolder(el){
  el.classList.toggle('open');
  const icon=el.querySelector('.folder-icon');
  if(icon) icon.textContent=el.classList.contains('open')?'📂':'📁';
}
// Open folder1 by default
document.getElementById('folder1').classList.add('open');
document.getElementById('folder1').querySelector('.folder-icon').textContent='📂';

/* ═══════════════════════════════════
   LINE NUMBERS
═══════════════════════════════════ */
function buildLn(name){
  const el=document.getElementById('ln-'+name);
  if(!el)return;
  const cc=document.getElementById('cc-'+name)||document.querySelector('#panel-'+name+' .code-content');
  const lines=Math.max(50,Math.ceil((cc?cc.scrollHeight:900)/31));
  el.innerHTML=Array.from({length:lines},(_,i)=>'<div>'+(i+1)+'</div>').join('');
}
document.getElementById('editorScroll').addEventListener('scroll',function(){
  document.getElementById('sb-ln').textContent=Math.floor(this.scrollTop/31)+1;
});

/* ═══════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════ */
function initReveals(){
  document.querySelectorAll('.reveal:not(.in)').forEach(el=>{
    if(isInView(el))el.classList.add('in');
  });
}
function isInView(el){
  const r=el.getBoundingClientRect();
  return r.top<window.innerHeight&&r.bottom>0;
}
document.getElementById('editorScroll').addEventListener('scroll',()=>{
  document.querySelectorAll('.reveal:not(.in)').forEach(el=>{
    if(isInView(el))el.classList.add('in');
  });
});
// Timeline entries
function animateTl(){
  document.querySelectorAll('.tl-e:not(.in)').forEach(el=>{
    if(isInView(el))el.classList.add('in');
  });
}
document.getElementById('editorScroll').addEventListener('scroll',animateTl);

/* ═══════════════════════════════════
   LOGIN
═══════════════════════════════════ */
function showLogin(){
  document.getElementById('loginOverlay').classList.add('show');
  document.getElementById('loginInput').value='';
  document.getElementById('loginErr').style.display='none';
  setTimeout(()=>document.getElementById('loginInput').focus(),120);
}
function closeLogin(){document.getElementById('loginOverlay').classList.remove('show');pendingPanel=null;}
document.getElementById('loginInput').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLogin();});
document.getElementById('loginOverlay').addEventListener('click',function(e){if(e.target===this)closeLogin();});
function togglePw(){const i=document.getElementById('loginInput');i.type=i.type==='password'?'text':'password';}

async function doLogin(){
  const pw=document.getElementById('loginInput').value;
  const btn=document.getElementById('loginBtn');
  const err=document.getElementById('loginErr');
  if(!pw)return;
  btn.disabled=true;btn.textContent='Prüfe...';err.style.display='none';
  try{
    const res=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});
    const data=await res.json();
    if(res.ok&&data.token){
      token=data.token;sessionStorage.setItem('lr_token',token);
      document.getElementById('loginOverlay').classList.remove('show');
      updateAuth(true);
      if(pendingPanel){unlockOpen(pendingPanel);pendingPanel=null;}
    }else{
      err.textContent=data.error||'Falsches Passwort.';err.style.display='flex';
    }
  }catch(e){err.textContent='Verbindungsfehler.';err.style.display='flex';}
  btn.disabled=false;btn.textContent='ENTER ↵';
}
function doLogout(){token=null;sessionStorage.removeItem('lr_token');updateAuth(false);openTabByName('home');}
function verifyToken(){
  if(!token)return false;
  try{const p=JSON.parse(atob(token.split('.')[1]));return p.exp*1000>Date.now();}catch{return false;}
}
function updateAuth(ok){
  const el=document.getElementById('sbAuth');
  el.className='sb-auth'+(ok?' authed':'');
  el.textContent=ok?'🔓 Eingeloggt':'🔒 Nicht eingeloggt';
}
if(token&&verifyToken())updateAuth(true);

/* ═══════════════════════════════════
   LOAD PROTECTED DATA
═══════════════════════════════════ */
const EMPTY_MSG='<div style="color:var(--dim);font-family:var(--mono);font-size:.8rem;padding:1.2rem 0">// Noch keine Daten hinterlegt.</div>';
let lastNoten=null, lastLebenslauf=null;

async function loadProtected(panel){
  if(!token)return;
  try{
    const res=await fetch('/api/protected',{headers:{'Authorization':'Bearer '+token}});
    if(!res.ok){doLogout();return;}
    const d=await res.json();
    if(panel==='noten'){
      lastNoten=d.noten||[];
      const box=document.getElementById('noten-content');
      const dl=document.getElementById('noten-dl');
      if(!lastNoten.length){
        box.innerHTML=EMPTY_MSG;
        if(dl)dl.style.display='none';
      }else{
        const avg=(lastNoten.reduce((s,n)=>s+n.note,0)/lastNoten.length).toFixed(2);
        const cc=n=>n>=5?'note-5':n>=4?'note-4':n>=3?'note-3':'note-2';
        box.innerHTML=
          '<div class="noten-grid">'+
          lastNoten.map(n=>'<div class="note-card"><div class="note-fach">'+n.fach+'</div><div class="note-val '+cc(n.note)+'">'+n.note.toFixed(1)+'</div><div class="note-sem">'+n.semester+'</div></div>').join('')+
          '</div><div class="noten-avg">Durchschnitt: <strong>'+avg+'</strong></div>';
        if(dl)dl.style.display='inline-flex';
      }
    }
    if(panel==='cv'){
      lastLebenslauf=d.lebenslauf||{ausbildung:[],erfahrung:[],zertifikate:[],sprachen:[]};
      const lv=lastLebenslauf;
      const box=document.getElementById('cv-content');
      const dl=document.getElementById('cv-dl');
      const hasAny=lv.ausbildung.length||lv.erfahrung.length||lv.zertifikate.length||lv.sprachen.length;
      if(!hasAny){
        box.innerHTML=EMPTY_MSG;
        if(dl)dl.style.display='none';
      }else{
        box.innerHTML=
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:3rem">'+
          '<div><div class="ed-h2">Ausbildung</div><div class="tl">'+
          (lv.ausbildung.length?lv.ausbildung.map(e=>'<div class="tl-e in"><div class="tl-date">'+e.zeitraum+'</div><div class="tl-title">'+e.titel+'</div><div class="tl-sub">'+e.ort+'<br>'+e.notiz+'</div></div>').join(''):EMPTY_MSG)+
          '</div></div>'+
          '<div><div class="ed-h2">Berufserfahrung</div><div class="tl">'+
          (lv.erfahrung.length?lv.erfahrung.map(e=>'<div class="tl-e in"><div class="tl-date">'+e.zeitraum+'</div><div class="tl-title">'+e.titel+'</div><div class="tl-sub">'+e.ort+'<br>'+e.notiz+'</div></div>').join(''):EMPTY_MSG)+
          '</div></div></div>'+
          '<div class="ed-h2" style="margin-top:2rem">Sprachen</div>'+
          (lv.sprachen.length?'<table class="ed-table"><tr><th>Sprache</th><th>Niveau</th></tr>'+lv.sprachen.map(s=>'<tr><td>'+s.sprache+'</td><td><span class="badge bb">'+s.niveau+'</span></td></tr>').join('')+'</table>':EMPTY_MSG)+
          '<div class="ed-h2">Zertifikate</div>'+
          (lv.zertifikate.length?'<table class="ed-table"><tr><th>Jahr</th><th>Titel</th><th>Anbieter</th></tr>'+lv.zertifikate.map(z=>'<tr><td>'+z.jahr+'</td><td>'+z.titel+'</td><td>'+z.anbieter+'</td></tr>').join('')+'</table>':EMPTY_MSG);
        if(dl)dl.style.display='inline-flex';
      }
    }
    setTimeout(()=>buildLn(panel),150);
  }catch(e){console.error(e);}
}

/* ═══════════════════════════════════
   DOWNLOADS (Noten-CSV, Lebenslauf-PDF)
═══════════════════════════════════ */
function triggerDownload(blob,filename){
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();
  document.body.removeChild(a);URL.revokeObjectURL(url);
}

function downloadNotenCsv(){
  if(!lastNoten||!lastNoten.length)return;
  const rows=[['Fach','Note','Semester'],...lastNoten.map(n=>[n.fach,n.note,n.semester])];
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');
  triggerDownload(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),'noten-luis-rosado.csv');
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
  const btn=document.getElementById('cv-dl');
  const orig=btn.textContent;
  btn.textContent='Erstelle PDF…';btn.disabled=true;
  try{
    await loadJsPdf();
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({unit:'mm',format:'a4'});
    const marginX=18;let y=22;
    const lineGap=6.5;
    const pageBottom=280;
    function ensureSpace(extra){if(y+extra>pageBottom){doc.addPage();y=22;}}
    function h1(t){ensureSpace(10);doc.setFont('helvetica','bold');doc.setFontSize(18);doc.text(t,marginX,y);y+=10;}
    function h2(t){ensureSpace(9);doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(30,80,160);doc.text(t,marginX,y);doc.setTextColor(20,20,20);y+=7;}
    function body(t){ensureSpace(lineGap);doc.setFont('helvetica','normal');doc.setFontSize(10);doc.text(t,marginX,y);y+=lineGap;}
    function sub(t){ensureSpace(5.5);doc.setFont('helvetica','italic');doc.setFontSize(9);doc.setTextColor(100,100,100);doc.text(t,marginX,y);doc.setTextColor(20,20,20);y+=5.5;}

    h1('Lebenslauf — Luis Rosado');
    y+=2;
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
