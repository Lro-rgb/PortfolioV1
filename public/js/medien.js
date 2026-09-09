/* ═══════════════════════════════════════════════════════════════════════
   medien.js: Projektbilder, Videospieler, Bilderreihen und Projektfilter

   Das laengste Modul, weil hier die Daten stehen: MEDIA und INTERESSEN
   beschreiben, welche Aufnahme zu welchem Projekt gehört. Dazu der
   selbstgebaute Videospieler und die waagrechten Bilderreihen.

   Teil der früheren app.js. Gemeinsame Helfer kommen aus basis.js, alles
   übrige zwischen den Modulen läuft über LR.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
const LR=window.LR;
const {$, overlay, el, esc}=LR;

/* ═══════════════════════════════════════════════════════════════
   MEDIEN: Video, Screenshots, Downloads

   Alles läuft über die beiden Objekte unten. Was hier nicht
   eingetragen ist, wird auch nicht gerendert: keine leeren Player,
   keine toten Verweise, kein "kommt noch".

   Neue Datei einbinden:
     1. Datei nach public/media/ legen
     2. Hier beim passenden Projekt eintragen
   Mehr ist nicht nötig, die Anzeige baut sich daraus auf.
═══════════════════════════════════════════════════════════════ */

/* Pro Projekt: video, shots (Screenshots), downloads.
     askel:{
       video:{src:'media/askel.mp4', poster:'media/askel-poster.jpg',
              titel:'Askel zeichnet eine Route auf', dauer:'1:10',
              format:'hoch'},   // hochkant, für Aufnahmen vom Handy
       format:'quer',   // 16:10 statt hochkant, für Bilder vom Rechner
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
/* Die ZIP-Verweise bei den Projekten zeigen auf GitHub, nicht auf eine
   Datei unter public/media/. Der Pfad /archive/HEAD.zip packt immer den
   aktuellen Stand des Standardzweigs. Es liegt also kein Archiv im
   Repository herum, das nach dem nächsten Commit veraltet ist, und die
   Seite wird davon kein Megabyte grösser.

   Die Beschriftung ist bewusst der Dateiname und nicht ein Satz: so
   braucht sie keine Übersetzung, denn MEDIA kennt das Wörterbuch
   nicht. */
const MEDIA={
  /* Vier Aufnahmen der laufenden App, ebenfalls bei 1600x1000. Die Karte
     nennt Suche, Deck-Editor, Regelprüfung, Kosten und Starthand — hinter
     jeder dieser Behauptungen steht hier ein Bild. Aufgenommen mit einem
     befüllten Deck, ein leerer Editor zeigt nichts von alldem. */
  ygo:{
    format:'quer',
    shots:[
      {src:'media/ygo-suche.jpg',
       alt:'Die Suche mit gesetzten Filtern: Typ Effektmonster, Attribut LIGHT und das Wort dragon, übrig bleiben 150 von 14’293 Karten im Ergebnisraster'},
      {src:'media/ygo-deck.jpg',
       alt:'Der Deck-Editor mit einem Blue-Eyes-Deck: rechts das Main Deck mit 40 Karten, darüber der Preis in Euro, die vier Master-Duel-Töpfe und die Meldung, dass das Deck regelkonform ist'},
      {src:'media/ygo-auswertung.jpg',
       alt:'Die Grossansicht mit der Auswertung: der Balken aus Monstern, Zaubern und Fallen, die Stufenkurve daneben und das Extra Deck nach Fusion, Link, Synchro und XYZ aufgeschlüsselt'},
      {src:'media/ygo-starthand.jpg',
       alt:'Eine gezogene Starthand aus fünf Karten, darunter für jede Karte des Main Decks die Chance, sie in der Starthand zu sehen'}
    ],
    downloads:[{href:'https://github.com/Lro-rgb/ygo-deckbuilder/archive/HEAD.zip',
                label:'ygo-deckbuilder.zip', meta:'GitHub'}]
  },
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
    ],
    downloads:[{href:'https://github.com/Lro-rgb/wallsync/archive/HEAD.zip',
                label:'wallsync.zip', meta:'GitHub'}]
  },
  // Bildschirmfotos meines Arch-Setups, ebenfalls aus dem eigenen Repo.
  arch:{
    format:'quer',
    shots:[
      {src:'media/arch-terminal.jpg',
       alt:'Alacritty mit der Fish-Shell, darüber die Waybar als Statusleiste'},
      {src:'media/arch-logout-menu.jpg',
       alt:'Das Abmeldemenü, gebaut mit rofi und aus der Waybar heraus aufgerufen'}
    ],
    downloads:[{href:'https://github.com/Lro-rgb/arch-hyprland-rice/archive/HEAD.zip',
                label:'arch-hyprland-rice.zip', meta:'GitHub'}]
  },
  /* Vier Aufnahmen der laufenden Seite, aufgenommen bei 1600x1000. Der
     Text der Karte nennt Kommandopalette, Terminal und sechs Farbdesigns, aber
     das eine Bild der Startseite hat davon nichts gezeigt. Jetzt steht
     hinter jeder dieser Behauptungen ein Bild. */
  portfolio:{
    format:'quer',
    shots:[
      {src:'media/portfolio-home.png',
       alt:'Die Startseite dieses Portfolios im VS-Code-Design: Explorer links, luis.json offen im Editor'},
      {src:'media/portfolio-palette.png',
       alt:'Die Kommandopalette mit der Befehlsliste: Farbdesign wechseln, Terminal, Explorer, drucken, jeder Eintrag mit seinem Tastenkürzel'},
      {src:'media/portfolio-terminal.png',
       alt:'Das eingeblendete Terminal, darin der Befehl whoami mit seiner Ausgabe'},
      {src:'media/portfolio-hell.jpg',
       alt:'Dieselbe Seite im hellen Design Light+, offen ist die Projektübersicht mit zwei Karten'}
    ],
    downloads:[{href:'https://github.com/Lro-rgb/PortfolioV1/archive/HEAD.zip',
                label:'PortfolioV1.zip', meta:'GitHub'}]
  },
  /* Eigene Aufnahmen der beiden Geräte, oben und unten leicht
     zugeschnitten, der dunkle Tisch drumherum nahm sonst mehr Platz ein
     als die Geräte selbst. format:'frei' bleibt: die Kachel nimmt die
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
  // Oberfläche von Sailo mit Beispieldaten, aus dem eigenen Repo.
  sailo:{
    format:'quer',
    shots:[
      {src:'media/sailo-oberflaeche.png',
       alt:'Sailo mit Beispieldaten: links die Spiele mit der Anzahl ihrer Sicherungen, rechts die Sicherungen des gewählten Spiels'}
    ],
    downloads:[{href:'https://github.com/Lro-rgb/Sailo/archive/HEAD.zip',
                label:'Sailo.zip', meta:'GitHub'}]
  },
  /* Vier Bildschirmfotos aus der Projektdokumentation, in der Reihenfolge
     der Kette: gebaut, ausgerollt, läuft, antwortet. Sie sind sehr
     unterschiedlich breit, ein Pipeline-Bild ist mehr als dreimal so
     breit wie hoch, darum format:'frei': die Kacheln nehmen die
     Proportion des Bildes an, statt es in ein festes Raster zu zwingen. */
  urlshortener:{
    format:'frei',
    shots:[
      /* Die Aufnahme der Container Registry ist raus. Die Pipeline-Aufnahme
         liegt weiter unter media/urlshortener-01-pipeline.png, falls
         stattdessen die wieder rein soll:
           {src:'media/urlshortener-01-pipeline.png',
            alt:'Die Pipeline in GitLab CI, alle Stufen grün'}, */
      /* Das einzige Bild der Strecke, das kein flacher Streifen ist: 857
         zu 607 Pixel gegen 815 zu 206 bei den anderen. Unverändert stünde
         es auf einer 366 Pixel breiten Karte 259 Pixel hoch und damit
         fast dreimal so hoch wie seine Nachbarn im selben Karussell.

         290 Pixel sind die Obergrenze, die es dabei behält. Auf einer 366
         Pixel breiten Karte stünde es von sich aus rund 260 Pixel hoch,
         dort greift die Angabe also gar nicht und das Bild bleibt
         unverzerrt. Zum Tragen kommt sie auf breiten Bildschirmen, wo die
         Karte auf über 500 Pixel wächst und das Bild sonst 370 Pixel hoch
         würde. Niedrigere Werte waren hier schon eingetragen; sie machten
         die Karte ruhiger, drückten aber die Schrift im Bild sichtbar
         zusammen. */
      {src:'media/urlshortener-05-argocd.png',
       alt:'ArgoCD meldet die Anwendung als Synced und Healthy', hoehe:290},
      {src:'media/urlshortener-03-pods.png',
       alt:'kubectl get pods: beide Dienste laufen mit 1/1'},
      {src:'media/urlshortener-04-curl.png',
       alt:'Ein Aufruf über den Ingress: der gekürzte Link leitet weiter'}
    ],
    // Zwei Archive, weil das Projekt auf zwei Repos liegt: die Anwendung
    // selbst und daneben die GitOps-Beschreibung, aus der ArgoCD ausrollt.
    downloads:[
      {href:'https://github.com/Lro-rgb/url-shortener/archive/HEAD.zip',
       label:'url-shortener.zip', meta:'GitHub'},
      {href:'https://github.com/Lro-rgb/url-shortener-gitops/archive/HEAD.zip',
       label:'url-shortener-gitops.zip', meta:'GitHub'}
    ]
  },
  /* Askel läuft auf dem Handy, darum steht hier eine Bildschirmaufnahme
     im Hochformat statt eines Bildes. Sie zeigt den ganzen Ablauf: Start
     der Aufzeichnung, die laufende Fahrt auf der Karte, das Speichern
     unter Namen und Farbe, die fertige Route mit ihren Messpunkten und
     zum Schluss die Einstellungen.

     Beschleunigt sind nur die beiden Stellen, an denen ausser dem Zähler
     nichts passiert: die ersten Sekunden nach dem Start auf doppeltes
     Tempo, die lange Strecke vor dem Stopp auf zweieinhalbfaches. Alles
     andere läuft in Echtzeit: die Karte, auf der sich die Route zeichnet,
     das Speichern, die fertige Route und die Einstellungen. Damit hetzt
     die Aufnahme an keiner Stelle, an der man etwas mitlesen muss.

     Zwei weitere Schnitte ohne Tempowechsel: Der Standbild-Moment nach dem
     Speichern ist um zwei Sekunden gekürzt, und der Schluss endet auf den
     Einstellungen. In der Rohaufnahme kamen danach noch das Löschen aller
     Daten und die eingeblendete Schaltfläche des Bildschirmrekorders, als
     letzter Eindruck einer Vorführung beides das Falsche.

     Der zuschnitt-Eintrag ist zugleich der Schalter für die eigene
     Steuerleiste mit dem Vollbild-Knopf; x:0 und die volle Quellbreite
     heissen, dass nichts weggeblendet wird; siehe die längere
     Begründung beim Rezeptbuch weiter unten.

     Die Anzeigehöhe von 550 Pixeln ergibt eine Breite von 247 Pixeln.
     Vorher standen hier 400 Pixel und damit 179 Pixel Breite, und neben der
     366 Pixel breiten Karte sah das nach einem vergessenen Streifen aus.
     Den grössten Teil der zusätzlichen Höhe hatte die Karte ohnehin frei:
     Sie steht im Raster neben der Karte zum URL-Shortener, die höher ist,
     und ihr Medienbereich streckt sich mit flex:1 in die Differenz
     hinein. Die Zeile wächst dadurch nur um rund sechzig Pixel. Viel
     weiter sollte man nicht gehen, sonst gibt diese Karte die Zeilenhöhe
     vor und zieht die Nachbarkarte mit. */
  askel:{
    video:{src:'media/askel-demo.mp4',
           titel:'Askel zeichnet eine Route auf', dauer:'0:51',
           zuschnitt:{x:0, breite:720, quelle:[720,1606], hoehe:550}},
    downloads:[{href:'https://github.com/Lro-rgb/Askel/archive/HEAD.zip',
                label:'Askel.zip', meta:'GitHub'}]},
  /* Bildschirmaufnahme aus dem Android-Emulator, im Hochformat und ohne
     schwarzen Rand, abgeschnitten werden muss hier also nichts mehr.
     Die Aufnahme zeigt die Sammlung, die Suche, den Vegetarisch-Filter,
     die Eingabemaske und ein Rezept im Detail.

     Die Rohaufnahme begann mit fünfzehn Sekunden Standbild der Sammlung,
     bevor die erste Eingabe kam; dieser Vorlauf ist herausgeschnitten. Das
     Video setzt jetzt kurz vor der Suche ein.

     Der Dateiname trägt eine Nummer, weil Browser eine bereits geladene
     Aufnahme sonst aus ihrem Zwischenspeicher zeigen und der neue Schnitt
     nicht ankommt. Wird das Video noch einmal ersetzt, gehört die Nummer
     hochgezählt.

     Der zuschnitt-Eintrag steht trotzdem da: Er ist zugleich der Schalter
     für die eigene Steuerleiste mit dem Vollbild-Knopf. x:0 und die volle
     Quellbreite heissen, dass nichts weggeblendet wird, nur die Höhe
     legt fest, wie gross das Video auf der Karte steht. Sie ist dieselbe
     wie bei Askel: Zwei Aufnahmen vom Handy in derselben Übersicht sollen
     gleich gross sein, sonst sieht die kleinere nach Versehen aus. Nach
     unten gibt es eine Grenze, die Leiste ist so breit wie das Bild, und
     bei einem Hochformat bleiben darunter sonst keine 160 Pixel für
     Knöpfe, Regler und Zeitangabe. */
  rezeptbuch:{
    video:{src:'media/rezeptbuch-demo-v2.mp4',
           titel:'Mein Rezeptbuch im Android-Emulator', dauer:'0:50',
           zuschnitt:{x:0, breite:720, quelle:[720,1600], hoehe:550}},
    downloads:[{href:'https://github.com/Lro-rgb/MeinRezeptbuch/archive/HEAD.zip',
                label:'MeinRezeptbuch.zip', meta:'GitHub'}]
  },
  kobui:{
    format:'quer',
    shots:[
      {src:'media/kobui-docs.png',
       alt:'Die eingebaute Dokumentation von kobui mit Beispielen für Charakterbeschreibung und erste Nachricht'},
      {src:'media/kobui-chat.png',
       alt:'Ein Chat mit einem selbst angelegten Charakter, die erste Nachricht ist schon zu sehen'}
    ],
    downloads:[{href:'https://github.com/kiraa1q/kobui/archive/HEAD.zip',
                label:'kobui.zip', meta:'GitHub'}]
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
    ],
    downloads:[{href:'https://github.com/Lro-rgb/redis-webshop/archive/HEAD.zip',
                label:'redis-webshop.zip', meta:'GitHub'}]
  },
  // Die erste Website liegt als Kopie unter public/erste-website/ und wird
  // deshalb direkt eingebettet statt abfotografiert.
  // Für die erste Website gibt es kein Repository, sie lag nur per FTP auf
  // dem Schulserver. Ihr Archiv ist deshalb das einzige, das wirklich unter
  // public/media/ liegt und beim Ändern der Kopie neu gepackt gehört.
  erstewebsite:{einbettung:{src:'erste-website',
                            titel:'Die Seite von 2024 öffnen'},
                downloads:[{href:'media/erste-website.zip',
                            label:'erste-website.zip', meta:'0,9 MB'}]}
};

/* Interessen: pro Bereich eine Bilderstrecke.
   Bild einbinden: Datei nach public/media/ legen und hier eine Zeile
   eintragen. Bereiche ohne Bilder erscheinen gar nicht: kein leerer
   Rahmen, kein Platzhalter.
     gaming:[{src:'media/gaming-eldenring.jpg', alt:'Elden Ring, …'}]
   Der Text im alt-Attribut steht auch als Bildunterschrift in der
   Vollansicht. */
const INTERESSEN={
  // Key-Art der Spiele, geladen aus der öffentlichen Bildablage von
  // Steam. Die Bilder gehören den jeweiligen Studios; sie stehen hier
  // als Hinweis auf das Spiel, nicht als eigenes Werk.
  gaming:[
    // Sehr breites Bild (1920 x 620), der Kopf steht ganz links. Mittig
    // beschnitten fing die Kachel erst hinter dem Gesicht an, darum der
    // Ausschnitt weit nach links.
    {src:'media/gaming-persona3.jpg', ausschnitt:'12% 50%',
     alt:'Persona 3, Key-Art des Protagonisten mit SEES-Armbinde'},
    {src:'media/gaming-elden-ring.jpg',
     alt:'Elden Ring, Key-Art'},
    {src:'media/gaming-undertale.jpg',
     alt:'Undertale, Titelschriftzug'},
    {src:'media/gaming-palworld.jpg',
     alt:'Palworld, Key-Art'},
    {src:'media/gaming-ghost-of-tsushima.jpg',
     alt:'Ghost of Tsushima, Key-Art'}
  ],
  // Albumcover, geholt aus der öffentlichen Suche von Apple Music
  // (1000 x 1000). Auch hier: die Bilder gehören den Labels.
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
  // Bandcover, gesucht über Apple Books und Open Library.
  lesen:[
    {src:'media/lesen-jojolion.jpg',
     alt:'JoJo’s Bizarre Adventure Teil 8: JoJolion, Band 1'},
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
     Custom Firmware, genau das, was der Text über der Strecke ankündigt.
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

/* Zeitangabe für die Spurleiste: 7 Sekunden werden zu "0:07". */
function zeitText(s){
  if(!isFinite(s))s=0;
  const m=Math.floor(s/60);
  return m+':'+String(Math.floor(s%60)).padStart(2,'0');
}

/* Baut einen kleinen Abspieler um ein zugeschnittenes Video.

   Warum nicht die eingebaute Steuerleiste: Der Zuschnitt schiebt das Video
   im Rahmen nach links, und die Leiste des Browsers sitzt am Video, wandert
   also mit. Der Abspielknopf landete dadurch ausserhalb des sichtbaren
   Ausschnitts. Die Leiste hier hängt stattdessen unter dem Rahmen und ist
   so breit wie die Karte, nicht so schmal wie der Ausschnitt.

   Vollbild geht auf den ganzen Abspieler, damit die Leiste mitkommt. Der
   Zuschnitt wird dabei aufgehoben; auf einem grossen Bildschirm ist Platz
   genug für das ganze Bild, und die schwarzen Ränder stören dort nicht,
   weil das Video ohnehin 16:9 ist. */
function baueVideoPlayer(v,zs){
  const skala=zs.hoehe/zs.quelle[1];
  const player=el('div','video-player');
  const rahmen=el('div','video-crop');
  v.classList.remove('hoch');
  v.controls=false;

  /* Setzt den Ausschnitt auf eine bestimmte Anzeigehöhe. Der Zuschnitt
     bleibt auch in der Grossansicht bestehen, dort wird er nur grösser
     gerechnet. Würde man ihn stattdessen aufheben, sähe man auf einem
     grossen Bildschirm vor allem den schwarzen Rand in Gross, und das Handy
     bliebe ein Streifen in der Mitte. */
  function zuschnittSetzen(hoehe){
    /* Auf schmalen Bildschirmen darf der Ausschnitt nicht breiter werden
       als der Platz in der Karte. Der Rahmen selbst wird zwar von
       max-width:100% gebremst, das Video darin aber nicht, es stünde
       weiter in voller Breite da und der rechte Rand der Aufnahme wäre
       abgeschnitten. Ist der Platz knapp, gibt darum die Breite die Höhe
       vor und nicht umgekehrt. In der Grossansicht gilt das nicht, dort
       rechnet grossHoehe() ohnehin mit dem ganzen Fenster. */
    if(!player.classList.contains('voll')){
      /* Gemessen wird am Medienbereich der Karte, nicht am Rahmen direkt
         darüber: Der nimmt per CSS die Breite des Videos an und wüsste
         darum immer nur, wie breit das Video schon ist. */
      const box=player.closest('.proj-media');
      const platz=box&&box.clientWidth;
      if(platz)hoehe=Math.min(hoehe,platz*zs.quelle[1]/zs.breite);
    }
    const s=hoehe/zs.quelle[1];
    const b=Math.round(zs.breite*s);
    /* Auch der Abspieler selbst wird auf die Breite des Ausschnitts
       festgelegt. Sonst zieht ihn die Steuerleiste auf ihre eigene
       Wunschbreite auseinander und steht rechts unter dem Bild hervor.
       In der Grossansicht darf er die volle Breite nehmen, damit die
       Leiste über den ganzen Bildschirm läuft. */
    player.style.width=player.classList.contains('voll')?'':b+'px';
    rahmen.style.width=b+'px';
    rahmen.style.height=Math.round(hoehe)+'px';
    v.style.width=Math.round(zs.quelle[0]*s)+'px';
    v.style.height=Math.round(hoehe)+'px';
    v.style.marginLeft=Math.round(-zs.x*s)+'px';
  }

  /* Anzeigehöhe in der Grossansicht: so hoch wie der Platz über der
     Leiste hergibt, aber höchstens doppelt so hoch wie die Aufnahme
     selbst. Weiter hochgerechnet wird die Schrift auf dem Handy nur
     matschig, dieselbe Grenze wie bei den Screenshots in der
     Vollansicht. */
  function grossHoehe(){
    const leisteH=leiste.offsetHeight||30;
    return Math.min(zs.quelle[1]*2, window.innerHeight-leisteH-8);
  }

  // Grossflächiger Knopf über dem Bild: startet und hält an.
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
  /* Beim ersten Aufruf hängt der Abspieler noch nicht in der Seite, und die
     Projektübersicht ist beim Laden ohnehin ausgeblendet, gemessen käme
     dort nur eine Breite von null heraus. Ein ResizeObserver auf dem
     Medienbereich rechnet darum genau dann nach, wenn dieser eine Breite
     bekommt: beim ersten Öffnen des Tabs und später bei jeder Änderung. */
  requestAnimationFrame(()=>{
    const box=player.closest('.proj-media');
    zuschnittSetzen(zs.hoehe);
    if(box&&window.ResizeObserver){
      new ResizeObserver(()=>{
        if(!player.classList.contains('voll'))zuschnittSetzen(zs.hoehe);
      }).observe(box);
    }
  });

  const umschalten=()=>{if(v.paused)v.play();else v.pause();};
  overlay.addEventListener('click',umschalten);
  btnPlay.addEventListener('click',umschalten);

  function zustand(laeuft){
    rahmen.classList.toggle('laeuft',laeuft);
    overlay.setAttribute('aria-label',laeuft?I18N.t('media.pauseRecording'):I18N.t('media.playRecording'));
    btnPlay.setAttribute('aria-label',laeuft?I18N.t('media.pause'):I18N.t('media.play'));
    btnPlay.firstChild.textContent=laeuft?'❚❚':'▶';
    overlay.firstChild.textContent=laeuft?'❚❚':'▶';
  }
  v.addEventListener('play',()=>zustand(true));
  v.addEventListener('pause',()=>zustand(false));
  v.addEventListener('ended',()=>zustand(false));

  /* Während am Regler gezogen wird, darf timeupdate ihn nicht
     zurückspringen lassen. */
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

     Der erste Versuch ist echtes Vollbild über den ganzen Bildschirm. Das
     klappt aber nicht überall: Auf dem iPhone kennt Safari die Funktion
     nur am Video selbst, nicht an einem Kasten drumherum, und eingebettete
     Ansichten dürfen sie teils gar nicht aufrufen. Wenn also etwas dagegen
     spricht, legt sich der Abspieler stattdessen über die Seite. Das
     Ergebnis ist für den Betrachter praktisch dasselbe und funktioniert
     immer, und das ist besser als ein Knopf, der auf manchen Geräten nichts tut. */
  function ansichtSetzen(gross){
    player.classList.toggle('voll',gross);
    zuschnittSetzen(gross?grossHoehe():zs.hoehe);
    btnVoll.setAttribute('aria-label',gross?I18N.t('media.exitLargeView'):I18N.t('media.largeView'));
  }
  /* Wird das Fenster kleiner, muss der Ausschnitt mit: in der Grossansicht
     auf die neue Fensterhöhe, in der Karte auf die neue Kartenbreite. */
  window.addEventListener('resize',()=>{
    zuschnittSetzen(player.classList.contains('voll')?grossHoehe():zs.hoehe);
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

      /* Zuschnitt für Aufnahmen, bei denen das Bild breiter ist als das,
         was darauf zu sehen ist. Der Emulator nimmt in 1280x720 auf, das
         Handy darin ist aber nur 322 Pixel breit, drei Viertel der Datei
         sind schwarzer Rand. Ohne Zuschnitt wäre die App auf der Karte
         daumennagelgross.

         Geschnitten wird per CSS, nicht in der Datei: Ein Rahmen mit fester
         Grösse blendet aus, das Video wird darin auf Höhe gerechnet und
         so weit nach links geschoben, dass der gewünschte Ausschnitt im
         Rahmen steht. Das Video bleibt unangetastet und lässt sich
         jederzeit gegen eine sauber exportierte Fassung tauschen, dann
         fällt einfach diese Angabe weg.

         zuschnitt: {x, breite, quelle:[vollBreite, vollHoehe], hoehe},
         alle Werte in Pixeln des Originals ausser hoehe, das die
         Darstellungshöhe auf der Karte ist. */
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
       Rahmen. Ein Foto veraltet, sobald sich etwas ändert; die Einbettung
       zeigt immer den aktuellen Stand. Das Fenster ist auf 1280 Pixel
       gestellt und wird auf die Kartenbreite heruntergerechnet, damit die
       Seite so aussieht wie auf einem Rechner und nicht wie auf einem
       schmalen Handy. Ohne Skripte, ohne Mausereignisse: es ist ein Bild,
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

      /* Darüber die Schaltfläche, die dieselbe Seite gross und bedienbar
         aufmacht. Der verkleinerte Rahmen bleibt klickdicht: bei 40 Prozent
         Grösse wäre jeder Verweis darin ein Zufallstreffer. */
      const hit=el('button','embed-hit');
      hit.type='button';
      hit.dataset.siteview=cfg.einbettung.src;
      hit.setAttribute('aria-label',I18N.t('siteview.openLabel'));
      hit.appendChild(el('span','',esc(I18N.t('siteview.open'))));
      rahmen.appendChild(hit);

      // Wer die Seite lieber in einem eigenen Tab hat, nimmt den Verweis darunter.
      const a=document.createElement('a');
      a.className='embed-open';a.href=cfg.einbettung.src;
      a.target='_blank';a.rel='noopener noreferrer';
      a.textContent=cfg.einbettung.titel||I18N.t('media.openPage');
      fig.appendChild(rahmen);
      fig.appendChild(a);
      box.appendChild(fig);

      /* Erst messen, wenn der Rahmen im Dokument hängt, vorher ist seine
         Breite 0 und der Massstab entsprechend auch. Danach bei jeder
         Änderung nachziehen: ResizeObserver deckt Kartenbreite und
         Seitenleiste ab, das resize-Ereignis ältere Browser ohne
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
       blättern durch die übrigen. Bei nur einem Screenshot bleiben Pfeile
       und Punkte weg, da gibt es nichts zum Durchklicken. Ein Klick auf
       das Bild selbst öffnet weiterhin die Vollansicht (dieselbe
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
      LR.shotHoeheSetzen(img,cfg.shots[0]);
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
   Ein waagrechter Streifen mit Einrastpunkten. Die Knöpfe scrollen ihn,
   ein Klick auf ein Bild öffnet dieselbe Vollansicht wie bei den
   Projekten, dafür werden die Listen unter einem eigenen Namen in
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
      // sichtbaren Bereich: 0% ganz nach links, 100% ganz nach rechts.
      if(b.ausschnitt)img.style.objectPosition=b.ausschnitt;
      btn.appendChild(img);
      track.appendChild(btn);
    });
    box.appendChild(track);

    // Bei einem einzelnen Bild gibt es nichts zu blättern.
    if(bilder.length>1){
      const nav=el('div','sl-nav');
      nav.innerHTML=
        '<button type="button" class="sl-btn" data-dir="-1" aria-label="'+esc(I18N.t('media.scrollLeft'))+'">‹</button>'+
        '<button type="button" class="sl-btn" data-dir="1" aria-label="'+esc(I18N.t('media.scrollRight'))+'">›</button>'+
        '<span class="sl-count">'+bilder.length+esc(I18N.t('media.imagesSuffix'))+'</span>';
      box.appendChild(nav);
      dragbar(track);
      track.addEventListener('scroll',()=>randKnoepfe(box),{passive:true});
      /* Ob geblättert werden muss, hängt allein an der Breite der Reihe.
         Ein Beobachter darauf trifft jeden Fall: Fenster geändert,
         Explorer aus- oder eingeklappt, Bereich zum ersten Mal sichtbar
         (vorher war die Breite null). Erst nach dem Layout messen, sonst
         ist die Breite noch 0. */
      if(window.ResizeObserver)new ResizeObserver(()=>randKnoepfe(box)).observe(track);
      else requestAnimationFrame(()=>randKnoepfe(box));
      /* Die Kacheln ohne festes Seitenverhältnis bekommen ihre Breite erst
         mit dem geladenen Bild. Der Beobachter oben sieht das nicht, er
         hängt am Rahmen, nicht am Inhalt. */
      track.querySelectorAll('img').forEach(im=>
        im.addEventListener('load',()=>randKnoepfe(box),{once:true}));
    }
  });
}

/* Schrittweite: genau ein Bild samt Abstand. Vorher war es ein Bruchteil
   der sichtbaren Breite, dabei blieb nach jedem Klick ein anderer
   Bildausschnitt am Rand stehen. */
function slSchritt(track){
  const erst=track.querySelector('.shot');
  if(!erst)return track.clientWidth;
  const abstand=parseFloat(getComputedStyle(track).columnGap)||0;
  return erst.getBoundingClientRect().width+abstand;
}

/* Am Anfang und am Ende ist der jeweilige Knopf wirkungslos, dann soll
   er auch so aussehen und von der Tabulatortaste übersprungen werden. */
function randKnoepfe(box){
  const track=box.querySelector('.sl-track');
  const links=box.querySelector('.sl-btn[data-dir="-1"]');
  const rechts=box.querySelector('.sl-btn[data-dir="1"]');
  if(!track||!links||!rechts)return;
  /* Passt die ganze Reihe auf den Bildschirm, gibt es nichts zu blättern,
     dann verschwinden die Pfeile ganz statt abgeschaltet dazustehen. Auf
     schmalen Bildschirmen kommen sie von selbst zurück. Die Zahl daneben
     bleibt, sie stimmt in beiden Fällen. */
  box.classList.toggle('sl-passt',track.scrollWidth-track.clientWidth<2);
  const rest=track.scrollWidth-track.clientWidth-track.scrollLeft;
  links.disabled=track.scrollLeft<2;
  rechts.disabled=rest<2;
}


/* Ziehen mit der Maus, wie im Datei-Explorer. Am Ende des Ziehens wird der
   Klick verschluckt, sonst öffnet jedes Ziehen die Vollansicht. */
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

/* ── Projekte nach Art filtern ──
   Die Seite ist lang: wer nur wissen will, was aus der Schule stammt und was
   aus eigenem Antrieb, soll nicht an allen zehn Karten vorbeiscrollen
   müssen. Geblendet werden die beiden Abschnitte samt Zwischentitel, nicht
   die Karten einzeln, die Trennung steht ohnehin schon im Markup. */
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

/* Die Zahl neben dem Projektfilter ist der einzige Text im Panel ohne
   data-i18n, das Wörterbuch geht beim Sprachwechsel an ihr vorbei. */
document.addEventListener('lr:langchange',()=>{
  const an=document.querySelector('.pf-btn.aktiv');
  if(an)projekteFiltern(an.dataset.filter);
});

Object.assign(LR,{MEDIA, renderProjectMedia, renderSliders, randKnoepfe, 
  projekteFiltern});

})();
