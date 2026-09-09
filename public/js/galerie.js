/* ═══════════════════════════════════════════════════════════════════════
   galerie.js: Karussell, Lightbox und die Seite in Vollansicht

   Alles, was ein Bild oder eine Seite gross macht: das Karussell in den
   Projektkarten, die Lightbox darüber und der Rahmen, in dem die alte
   Schulwebsite läuft.

   Teil der früheren app.js. Gemeinsame Helfer kommen aus basis.js, alles
   übrige zwischen den Modulen läuft über LR.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
const LR=window.LR;
const {$}=LR;

function shotHoeheSetzen(img,s){
  img.style.maxHeight=s&&s.hoehe?s.hoehe+'px':'';
}

function setCarouselSlide(carousel,index){
  const cfg=LR.MEDIA[carousel.dataset.group];
  if(!cfg||!cfg.shots||!cfg.shots.length)return;
  const n=cfg.shots.length;
  index=(index+n)%n;
  const s=cfg.shots[index];
  const slide=carousel.querySelector('.sc-slide');
  const img=slide.querySelector('img');
  shotHoeheSetzen(img,s);
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
  const cfg=LR.MEDIA[group];
  if(!cfg||!cfg.shots||!cfg.shots.length)return;
  lbGroup=cfg.shots;lbIndex=index;lbReturnFocus=document.activeElement;
  lightbox.classList.add('show');
  lightbox.setAttribute('aria-hidden','false');
  showLbImage();
  $('lbClose').focus();
}
/* Anzeigegrösse in der Vollansicht.

   max-width allein reicht nicht: es kann ein Bild nur kleiner machen, nie
   grösser. Kleine Aufnahmen wie der Screenshot von "kubectl get pods", der nur
   815 Pixel breit ist, standen deshalb als Briefmarke mitten in der schwarzen
   Fläche. Hier wird die Breite ausgerechnet: so gross wie der Platz
   erlaubt, aber höchstens doppelt so gross wie das Original. Weiter
   hochgerechnet wird Text auf einem Bildschirmfoto nur matschig.

   Die Höhe bleibt auf auto, damit das Seitenverhältnis stimmt und der
   Rahmen genau am Bild sitzt statt mit unsichtbaren Balken daneben. */
function lbGroesse(){
  const img=$('lbImg');
  if(!img.naturalWidth)return;
  const platzB=window.innerWidth*0.94;
  const platzH=window.innerHeight*0.80-40;   // 40px für die Bildunterschrift
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
   SEITE IN VOLLANSICHT

   Die erste Website steckte bisher als klickdichte Vorschau in ihrer Karte,
   sie sah aus wie ein Bildschirmfoto und verhielt sich auch so. Hier läuft
   sie in einem nachgebauten Browserfenster wirklich: eigene Verweise,
   eigener Verlauf, Adresszeile, die mitzieht.

   Das Fenster steckt den Rahmen ab. Ohne ihn wäre nicht zu erkennen, wo
   diese Seite aufhört und die von 2024 anfängt, und der Unterschied
   zwischen beiden ist genau das, was die Karte zeigen will.
═══════════════════════════════════ */
const siteview=$('siteview'),svFrame=$('svFrame');
/* Eigener Zähler statt history.length: Ein Rahmen teilt sich den Verlauf mit
   der Seite, in der er steckt. history.length zählt also auch die Schritte
   des Portfolios mit und stünde schon beim Öffnen auf zwei oder mehr. Der
   Zurück-Schalter wäre damit von Anfang an bedienbar, und ein Druck darauf
   würde nicht im Rahmen blättern, sondern das Portfolio verlassen. */
let svSchritte=0;

/* Der Rahmen läuft mit sandbox="allow-same-origin", aber ohne allow-scripts.
   Lesen ist damit erlaubt (deshalb steht in der Adresszeile, wo man gerade
   ist), Ausführen nicht. Sollte die Kopie irgendwann doch ein Skript
   bekommen, bleibt sie stumm, und dieser Zugriff wirft dann eine Ausnahme
   statt die Anzeige abzubrechen. */
function svAdresseNachziehen(){
  let pfad='';
  try{
    pfad=svFrame.contentWindow.location.pathname;
  }catch(e){ /* fremder Ursprung: Adresse bleibt stehen */ }
  if(pfad)$('svUrl').textContent=location.host+pfad;
  svSchritte++;
  $('svBack').disabled=svSchritte<2;
}

document.addEventListener('click',e=>{
  const hit=e.target.closest('[data-siteview]');
  if(!hit)return;
  const src=hit.dataset.siteview;
  svSchritte=0;
  svFrame.src=src;
  $('svNew').href=src;
  $('svUrl').textContent=location.host+'/'+src.replace(/^\//,'');
  $('svBack').disabled=true;
  siteview.showModal();   // Escape, Fokusfalle und Abdunklung macht der Browser
});
svFrame.addEventListener('load',svAdresseNachziehen);
$('svClose').addEventListener('click',()=>siteview.close());
$('svBack').addEventListener('click',()=>{
  try{svFrame.contentWindow.history.back();}catch(e){ /* nichts zu tun */ }
});
// Klick auf die Abdunklung: das <dialog> selbst füllt den Bildschirm, das
// Fenster darin nicht, ein Treffer daneben landet also hier.
siteview.addEventListener('click',e=>{if(e.target===siteview)siteview.close();});

Object.assign(LR,{shotHoeheSetzen});

})();
