/* ═══════════════════════════════════════════════════════════════════════
   statsfm.js: Hörstatistiken von stats.fm

   Einziger fremder Dienst auf der Seite. Laedt erst, wenn der Abschnitt
   sichtbar wird, und faellt bei jedem Fehler still auf den Verweis
   zurück, der im HTML schon steht.

   Teil der früheren app.js. Gemeinsame Helfer kommen aus basis.js, alles
   übrige zwischen den Modulen läuft über LR.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
const LR=window.LR;
const {$, el, esc}=LR;

/* ══════════════════════════════════════════════════════════════════
   HÖRSTATISTIKEN: stats.fm

   Die öffentliche API von stats.fm erlaubt Anfragen aus dem Browser
   (Access-Control-Allow-Origin: *), deshalb braucht es keinen eigenen
   Serverdienst dazwischen. Ein iframe wäre nicht gegangen: stats.fm
   schickt x-frame-options: SAMEORIGIN.

   Geladen wird erst, wenn der Abschnitt sichtbar wird, die Startseite
   soll nicht auf einen fremden Dienst warten. Antwortet er nicht, bleibt
   der Verweis auf das Profil stehen, der im HTML schon drin ist.
══════════════════════════════════════════════════════════════════ */
const SFM_API='https://api.stats.fm/api/v1/users/';
const SFM_ZEITRAUM='weeks';   // letzte vier Wochen
const SFM_FRIST=8000;         // Millisekunden, bis der Abruf abgebrochen wird

/* Ein fremder Dienst kann auch einfach gar nicht antworten. Ohne Frist
   hängt die Anfrage, bis der Browser von sich aus aufgibt, und der
   Abschnitt bleibt bis dahin leer statt auf den Verweis zurückzufallen.
   AbortController statt AbortSignal.timeout, weil es den länger gibt. */
async function holeMitFrist(url,optionen,ms){
  const abbruch=new AbortController();
  const zeit=setTimeout(()=>abbruch.abort(),ms);
  try{
    return await fetch(url,Object.assign({},optionen,{signal:abbruch.signal}));
  }finally{
    clearTimeout(zeit);
  }
}

async function ladeStatsfm(box){
  const user=box.dataset.user;
  if(!user||box.dataset.geladen)return;
  box.dataset.geladen='1';

  const hole=async pfad=>{
    const r=await holeMitFrist(SFM_API+encodeURIComponent(user)+pfad,
      {headers:{Accept:'application/json'}},SFM_FRIST);
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
    console.warn('Hörstatistiken nicht geladen:',
      err.name==='AbortError'?'stats.fm hat nicht innert '+(SFM_FRIST/1000)+' s geantwortet':err.message);
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
   Raster gleichzeitig zu zeigen. Ein Klick auf das Bild öffnet weiterhin
   die Vollansicht unten, dort steckt schon die Pfeiltasten-Navigation. */
/* Setzt die Anzeigehöhe eines einzelnen Screenshots.

   Nötig, weil in einer Strecke sehr unterschiedliche Seitenverhältnisse
   nebeneinander stehen können: Ein Terminalausschnitt ist ein flacher
   Streifen, ein Fensterausschnitt fast quadratisch. Beide über die volle
   Kartenbreite gezogen heisst, dass der quadratische dreimal so hoch
   steht wie der flache und die Karte beherrscht.

   Das Bild behält dabei die volle Breite und wird auf die angegebene
   Höhe gezogen, die Strecken in den Projektkarten stehen ohnehin auf
   object-fit:fill. Es wird also verzerrt und nicht beschnitten: Bei
   einem Beleg soll nichts wegfallen, und wer den Inhalt lesen will,
   öffnet das Bild mit einem Klick unverzerrt in der Vollansicht.

   Gesetzt wird max-height und nicht height: Auf einer schmalen Karte ist
   das Bild von sich aus flacher als der Wert, und eine feste Höhe würde
   es dort in die Gegenrichtung ziehen, hoch und schmal statt breit und
   flach. So greift die Angabe nur, solange sie das Bild kleiner macht. */

Object.assign(LR,{beobachteStatsfm});

})();
