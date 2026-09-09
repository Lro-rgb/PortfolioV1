/* ═══════════════════════════════════════════════════════════════════════
   start.js: Bedienelemente und Start

   Zuletzt geladen. Bindet die data-aktion-Schaltflächen an ihre
   Funktionen und startet die Seite, sobald das Dokument geparst ist.

   Teil der früheren app.js. Gemeinsame Helfer kommen aus basis.js, alles
   übrige zwischen den Modulen läuft über LR.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
const LR=window.LR;

/* ═══════════════════════════════════
   BEDIENELEMENTE IM DOKUMENT
═══════════════════════════════════ */
/* Die Schaltflächen tragen data-aktion statt onclick. Grund ist die
   Sicherheitsregel in vercel.json: script-src kommt ohne 'unsafe-inline'
   aus, und damit fallen auch onclick-Attribute weg, nicht nur <script>
   im Dokument. Ein einziger Lauscher am Dokument statt neun einzelner
   Bindungen — die Schaltflächen tauchen teils erst nach dem Anmelden auf. */
const AKTIONEN={
  loginSchliessen:LR.closeLogin,
  passwortZeigen:LR.togglePw,
  abmelden:LR.doLogout,
  notenCsv:LR.downloadNotenCsv,
  lebenslaufPdfs:LR.downloadLebenslaufAlle,
  allesAlsZip:LR.downloadAllesAlsZip
};

document.addEventListener('click',e=>{
  const knopf=e.target.closest&&e.target.closest('[data-aktion]');
  if(!knopf)return;
  const fn=AKTIONEN[knopf.dataset.aktion];
  if(fn)fn();
});

/* ═══════════════════════════════════
   START
═══════════════════════════════════ */
function startApp(){
  if(LR.angemeldet())LR.updateAuth(true);
  else LR.tokenVerwerfen();

  /* Die Zahl an der Projekt-Schaltfläche in der Aktivitätsleiste zählt die
     Karten selbst ab. Sie stand vorher von Hand im HTML und war nach dem
     Nachtragen eines Projekts prompt falsch. */
  LR.projekteFiltern('alle');
  const projZahl=document.getElementById('actProjCount');
  if(projZahl)projZahl.textContent=document.querySelectorAll('#panel-projekte .proj-card').length;
  LR.renderProjectMedia();
  LR.renderSliders();
  LR.beobachteStatsfm();

  const fromHash=location.hash.replace('#','');
  const start=(fromHash&&LR.LANG[fromHash])?fromHash:'home';
  LR.openTab(start);
  LR.initReveals();

  // Ab hier zählt jeder Dateiwechsel als eigener Schritt im Verlauf.
  LR.navigationFreigeben();
}

/* Erst wenn das Dokument fertig geparst ist. Die Skripte stehen zwar am
   Ende des <body>, aber vscode.js lädt nach diesen Modulen, und startApp
   öffnet Tabs, auf die dort gelauscht wird. DOMContentLoaded feuert nach
   allen Dateien und hält die Reihenfolge damit gerade. */
document.addEventListener('DOMContentLoaded',startApp);

})();
