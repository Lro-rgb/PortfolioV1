/* ═══════════════════════════════════════════════════════════════════════
   vscode.js — die Oberflaechenteile, die VS Code ausmachen

   Laeuft nach app.js und baut darauf auf: openTab(), LANG und updateAuth()
   stammen von dort. Hier kommen dazu:

     1. Farbdesigns (echte VS-Code-Themes)
     2. Activity Bar
     3. Statusleiste
     4. Kommandopalette (Strg+P)
     5. Terminal (Strg+^)

   Alles davon ist bedienbar, ohne die Maus zu benutzen — und nichts davon
   ist Attrappe: Jeder Knopf tut etwas.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* $() und esc() kommen aus app.js — sie dort und hier getrennt zu
     definieren waere derselbe Code an zwei Stellen. Diese Datei baut
     ohnehin auf app.js auf (openTab, LANG, updateAuth) und wird nach ihr
     geladen. */
  const ide = $('ide');

  /* ═══════════════════════════════════════════════════════════════════
     1. FARBDESIGNS
     ═══════════════════════════════════════════════════════════════════ */

  const THEMES = [
    { id: 'dark-plus', name: 'Dark+ (Standard)' },
    { id: 'github-dark', name: 'GitHub Dark' },
    { id: 'dracula', name: 'Dracula' },
    { id: 'one-dark', name: 'One Dark Pro' },
    { id: 'nord', name: 'Nord' },
    { id: 'light-plus', name: 'Light+ (hell)' }
  ];

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark-plus';
  }

  function setTheme(id) {
    const theme = THEMES.find((t) => t.id === id);
    if (!theme) return false;

    document.documentElement.setAttribute('data-theme', theme.id);
    try {
      localStorage.setItem('lr_theme', theme.id);
    } catch (e) {
      // Privater Modus: das Design gilt dann nur fuer diesen Besuch.
    }

    const label = $('stTheme');
    if (label) label.textContent = theme.name.replace(/ \(.*\)$/, '');

    // Die Farbe der Browserleiste auf dem Handy mitziehen.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.content = getComputedStyle(document.documentElement)
        .getPropertyValue('--bg').trim() || '#1e1e1e';
    }
    return true;
  }

  /** Wechselt zum naechsten Design in der Liste. */
  function cycleTheme() {
    const i = THEMES.findIndex((t) => t.id === currentTheme());
    const next = THEMES[(i + 1) % THEMES.length];
    setTheme(next.id);
    return next;
  }

  setTheme(currentTheme()); // Beschriftung beim Start angleichen

  /* ═══════════════════════════════════════════════════════════════════
     2. ACTIVITY BAR UND SEITENLEISTE
     ═══════════════════════════════════════════════════════════════════ */

  const actExplorer = $('actExplorer');

  function sidebarHidden() {
    return ide.getAttribute('data-sidebar') === 'hidden';
  }

  function toggleSidebar() {
    // Auf schmalen Bildschirmen ist die Seitenleiste eine Schublade —
    // dort regelt app.js das Auf und Zu.
    if (window.matchMedia('(max-width: 820px)').matches) {
      const toggle = $('sbToggle');
      if (toggle) toggle.click();
      return;
    }
    const hide = !sidebarHidden();
    ide.setAttribute('data-sidebar', hide ? 'hidden' : 'shown');
    if (actExplorer) actExplorer.setAttribute('aria-pressed', hide ? 'false' : 'true');
  }

  if (actExplorer) actExplorer.addEventListener('click', toggleSidebar);

  /* ═══════════════════════════════════════════════════════════════════
     3. BEFEHLE
     Ein Ort fuer alles, was von mehreren Stellen aus ausgeloest wird:
     Menue, Activity Bar, Statusleiste, Palette und Terminal greifen
     alle hierauf zu.
     ═══════════════════════════════════════════════════════════════════ */

  const CMD = {
    palette: () => openPalette(''),
    commands: () => openPalette('>'),
    terminal: () => togglePanel(),
    theme: () => openPalette('>design '),
    explorer: toggleSidebar,
    print: () => window.print(),
    mail: () => {
      window.location.href =
        'mailto:luisrosado008@gmail.com?subject=Praktikumsstelle%20Applikationsentwicklung';
    },
    github: () => window.open('https://github.com/Lro-rgb', '_blank', 'noopener'),
    reopen: () => {
      if (typeof reopenAll === 'function') reopenAll();
    },
    logout: () => {
      if (typeof doLogout === 'function') doLogout();
    }
  };

  // Alles mit data-cmd verdrahten — Menue, Activity Bar, Statusleiste.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cmd]');
    if (!btn) return;
    const fn = CMD[btn.dataset.cmd];
    if (fn) {
      e.preventDefault();
      fn();
    }
  });

  /* ═══════════════════════════════════════════════════════════════════
     4. STATUSLEISTE
     ═══════════════════════════════════════════════════════════════════ */

  const stLang = $('stLang');
  const stLines = $('stLines');
  const stAuth = $('stAuth');
  const editorScroll = $('editorScroll');

  function activePanelName() {
    const tab = document.querySelector('.tab.active');
    return tab ? tab.dataset.panel : 'home';
  }

  function updateStatusFile() {
    const name = activePanelName();
    // LANG stammt aus app.js und ordnet jeder Datei ihre Sprache zu.
    if (stLang) stLang.textContent = (typeof LANG !== 'undefined' && LANG[name]) || 'Text';
  }

  /* Leseanteil statt erfundener Zeile/Spalte.
     Im echten VS Code steht dort die Cursorposition. Die gibt es hier nicht
     — eine erfundene Zahl waere nur Dekoration. Der Leseanteil ist dagegen
     eine echte Angabe und beantwortet die Frage, die sich beim Lesen
     tatsaechlich stellt: Wie viel kommt noch? */
  function updateStatusProgress() {
    if (!stLines || !editorScroll) return;
    const max = editorScroll.scrollHeight - editorScroll.clientHeight;
    const pct = max > 8 ? Math.round((editorScroll.scrollTop / max) * 100) : 100;
    stLines.textContent = 'Gelesen ' + pct + ' %';
  }

  /* Kein eigener Scroll-Listener: app.js buendelt alle Scroll-Aufgaben in
     einem einzigen, der hoechstens einmal pro Bild laeuft. */
  if (typeof onEditorScroll === 'function') onEditorScroll(updateStatusProgress);

  /* Anmeldestatus: app.js meldet ihn an die Titelleiste. Hier wird die
     Funktion umschlossen, damit die Statusleiste unten mitzieht — ohne
     app.js dafuer anfassen zu muessen. */
  if (typeof window.updateAuth === 'function') {
    const original = window.updateAuth;
    window.updateAuth = function (ok) {
      original(ok);
      if (stAuth) stAuth.textContent = ok ? '🔓 Angemeldet' : '🔒 Gast';
    };
  }

  /* Dasselbe fuer openTab: nach jedem Dateiwechsel Sprache und Leseanteil
     angleichen. */
  if (typeof window.openTab === 'function') {
    const original = window.openTab;
    window.openTab = function (name, opts) {
      original(name, opts);
      updateStatusFile();
      updateStatusProgress();
      updatePaletteRecent(name);
    };
  }

  updateStatusFile();
  updateStatusProgress();

  /* ═══════════════════════════════════════════════════════════════════
     5. KOMMANDOPALETTE (Strg+P)

     Zwei Modi wie im Original: ohne Praefix wird nach Dateien gesucht,
     mit ">" nach Befehlen.
     ═══════════════════════════════════════════════════════════════════ */

  const qiBackdrop = $('qiBackdrop');
  const qiInput = $('qiInput');
  const qiList = $('qiList');
  let qiIndex = 0;
  let qiResults = [];
  let qiReturnFocus = null;
  let recentFiles = [];

  function updatePaletteRecent(name) {
    recentFiles = [name].concat(recentFiles.filter((n) => n !== name)).slice(0, 8);
  }

  /** Liest den Dateinamen aus einem Tab.
   *
   *  textContent allein reicht nicht: Im Tab stecken auch das Dateisymbol
   *  (bei JSON-Dateien die Zeichen "{ }"), das Schloss bei geschuetzten
   *  Dateien, der Schliessen-Knopf und der Zeilenumbruch des Quelltextes.
   *  Ungefiltert stand in der Palette dann "{ }      luis.json  ×". */
  function fileLabel(tab) {
    return tab.textContent
      .replace(/[×✕🔒]/g, '')      // Schliessen-Kreuz und Schloss
      .replace(/\{\s*\}/g, '')      // das JSON-Symbol "{ }"
      .replace(/\s+/g, ' ')         // Zeilenumbrueche und Einrueckung
      .trim();
  }

  /** Dateien aus der Tableiste lesen statt sie hier nochmal aufzuzaehlen —
   *  eine neue Datei im HTML taucht damit automatisch in der Palette auf. */
  function fileEntries() {
    return Array.from(document.querySelectorAll('.tab')).map((tab) => ({
      type: 'file',
      id: tab.dataset.panel,
      label: fileLabel(tab),
      // Der interne Name wird mitdurchsucht, ist aber nicht sichtbar:
      // Wer "projekte" tippt, findet damit auch projekte.html.
      search: tab.dataset.panel,
      hint: tab.dataset.locked === 'true' ? 'passwortgeschützt' : '',
      run: () => openTab(tab.dataset.panel)
    }));
  }

  function commandEntries() {
    const list = [
      { label: 'Design: nächstes Farbdesign', hint: 'Strg+K Strg+T', run: () => cycleTheme() },
      { label: 'Ansicht: Terminal ein-/ausblenden', hint: 'Strg+^', run: CMD.terminal },
      { label: 'Ansicht: Explorer ein-/ausblenden', hint: 'Strg+Umschalt+E', run: CMD.explorer },
      { label: 'Ansicht: alle Dateien wieder öffnen', hint: '', run: CMD.reopen },
      { label: 'Datei: Seite drucken oder als PDF sichern', hint: 'Strg+P im Browser', run: CMD.print },
      { label: 'Kontakt: E-Mail schreiben', hint: 'luisrosado008@gmail.com', run: CMD.mail },
      { label: 'Kontakt: GitHub-Profil öffnen', hint: 'Lro-rgb', run: CMD.github },
      { label: 'Konto: abmelden', hint: '', run: CMD.logout }
    ];

    // Jedes Design einzeln aufrufbar — so wie "Farbdesign" in VS Code.
    THEMES.forEach((t) => {
      list.push({
        label: 'Design: ' + t.name,
        hint: t.id === currentTheme() ? 'aktiv' : '',
        run: () => setTheme(t.id)
      });
    });

    return list.map((c) => Object.assign({ type: 'cmd' }, c));
  }

  /** Bewertet einen Eintrag gegen die Eingabe. Kleiner ist besser, -1
   *  bedeutet "passt nicht".
   *
   *  Zwei Stufen: Erst der zusammenhaengende Treffer (wer "skill" tippt,
   *  will skills.py zuoberst). Findet sich keiner, wird geprueft, ob die
   *  Buchstaben wenigstens der Reihe nach vorkommen — so findet "prj" auch
   *  projekte.html, wie man es von VS Code kennt. */
  function scoreEntry(entry, query) {
    if (!query) return 0;
    const hay = (entry.label + ' ' + (entry.search || '') + ' ' + (entry.hint || '')).toLowerCase();

    const direct = hay.indexOf(query);
    if (direct !== -1) return direct;

    let pos = 0;
    for (const ch of query) {
      pos = hay.indexOf(ch, pos);
      if (pos === -1) return -1;
      pos++;
    }
    // Verstreute Treffer landen hinter allen zusammenhaengenden.
    return 1000 + pos;
  }

  function renderPalette() {
    const raw = qiInput.value;
    const isCmd = raw.startsWith('>');
    const query = (isCmd ? raw.slice(1) : raw).trim().toLowerCase();

    let entries = isCmd ? commandEntries() : fileEntries();

    if (query) {
      entries = entries
        .map((e) => ({ e: e, s: scoreEntry(e, query) }))
        .filter((x) => x.s !== -1)
        .sort((a, b) => a.s - b.s)
        .map((x) => x.e);
    } else if (!isCmd) {
      // Ohne Eingabe zeigt VS Code die zuletzt geoeffneten Dateien zuerst.
      entries.sort(
        (a, b) =>
          (recentFiles.indexOf(a.id) + 1 || 99) - (recentFiles.indexOf(b.id) + 1 || 99)
      );
    }

    qiResults = entries;
    if (qiIndex >= entries.length) qiIndex = 0;

    if (!entries.length) {
      qiList.innerHTML = '<li class="qi-empty">Kein Treffer.</li>';
      return;
    }

    const head = isCmd ? 'Befehle' : 'Dateien';
    qiList.innerHTML =
      '<li class="qi-group">' + head + '</li>' +
      entries
        .map(
          (e, i) =>
            '<li><button type="button" role="option" class="qi-item" data-i="' + i + '"' +
            ' data-active="' + (i === qiIndex) + '" aria-selected="' + (i === qiIndex) + '">' +
            '<span>' + esc(e.label) + '</span>' +
            (e.hint ? '<span class="qi-hint">' + esc(e.hint) + '</span>' : '') +
            '</button></li>'
        )
        .join('');
  }

  function openPalette(prefill) {
    qiReturnFocus = document.activeElement;
    qiBackdrop.hidden = false;
    qiInput.value = prefill || '';
    qiIndex = 0;
    renderPalette();
    qiInput.focus();
    qiInput.setSelectionRange(qiInput.value.length, qiInput.value.length);
  }

  function closePalette() {
    if (qiBackdrop.hidden) return;
    qiBackdrop.hidden = true;
    if (qiReturnFocus && document.contains(qiReturnFocus)) qiReturnFocus.focus();
    qiReturnFocus = null;
  }

  function runPalette(i) {
    const entry = qiResults[i];
    if (!entry) return;
    closePalette();
    entry.run();
  }

  if (qiInput) {
    qiInput.addEventListener('input', () => {
      qiIndex = 0;
      renderPalette();
    });

    qiInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closePalette(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        qiIndex = qiResults.length ? (qiIndex + 1) % qiResults.length : 0;
        renderPalette();
        qiList.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        qiIndex = qiResults.length ? (qiIndex - 1 + qiResults.length) % qiResults.length : 0;
        renderPalette();
        qiList.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
        return;
      }
      if (e.key === 'Enter') { e.preventDefault(); runPalette(qiIndex); }
    });

    qiList.addEventListener('click', (e) => {
      const btn = e.target.closest('.qi-item');
      if (btn) runPalette(Number(btn.dataset.i));
    });

    qiBackdrop.addEventListener('mousedown', (e) => {
      if (e.target === qiBackdrop) closePalette();
    });
  }

  const tbSearch = $('tbSearch');
  if (tbSearch) tbSearch.addEventListener('click', () => openPalette(''));

  /* ═══════════════════════════════════════════════════════════════════
     6. TERMINAL (Strg+^)
     ═══════════════════════════════════════════════════════════════════ */

  const panel = $('panelTerminal');
  const termOut = $('termOut');
  const termInput = $('termInput');
  const inputRow = termOut ? termOut.querySelector('.term-input-row') : null;
  const history = [];
  let historyIndex = -1;

  function panelOpen() { return panel && !panel.hidden; }

  function togglePanel(force) {
    if (!panel) return;
    const show = force === undefined ? panel.hidden : force;
    panel.hidden = !show;
    if (show && termInput) termInput.focus();
  }

  const closeBtn = $('panelClose');
  if (closeBtn) closeBtn.addEventListener('click', () => togglePanel(false));

  function print(text, cls) {
    if (!termOut || !inputRow) return;
    const line = document.createElement('div');
    line.className = 'term-line ' + (cls || 'out');
    line.innerHTML = text;
    termOut.insertBefore(line, inputRow);
    termOut.scrollTop = termOut.scrollHeight;
  }

  const FILE_NAMES = () =>
    Array.from(document.querySelectorAll('.tab')).map((t) => ({
      panel: t.dataset.panel,
      name: t.textContent.replace('×', '').trim(),
      locked: t.dataset.locked === 'true'
    }));

  const COMMANDS = {
    help() {
      print('Verfügbare Befehle:', 'ok');
      print(
        '  <b>ls</b>            Dateien auflisten<br>' +
        '  <b>open</b> &lt;datei&gt;  Datei öffnen (z. B. <code>open projekte</code>)<br>' +
        '  <b>projects</b>      Projekte kurz auflisten<br>' +
        '  <b>whoami</b>        Kurzvorstellung<br>' +
        '  <b>contact</b>       Kontaktdaten<br>' +
        '  <b>design</b> [name] Farbdesign anzeigen oder wechseln<br>' +
        '  <b>clear</b>         Terminal leeren<br>' +
        '  <b>exit</b>          Terminal schliessen'
      );
    },

    ls() {
      print(
        FILE_NAMES()
          .map((f) => (f.locked ? '🔒 ' : '   ') + esc(f.name))
          .join('<br>')
      );
    },

    open(arg) {
      if (!arg) { print('Bitte einen Dateinamen angeben — <code>ls</code> zeigt alle.', 'err'); return; }
      const q = arg.toLowerCase();
      const hit = FILE_NAMES().find(
        (f) => f.panel === q || f.name.toLowerCase().indexOf(q) !== -1
      );
      if (!hit) { print('Datei nicht gefunden: ' + esc(arg), 'err'); return; }
      print('Öffne ' + esc(hit.name) + ' …', 'ok');
      openTab(hit.panel);
    },

    projects() {
      const cards = document.querySelectorAll('#panel-projekte .proj-t');
      if (!cards.length) { print('Projekte werden geladen — <code>open projekte</code>.', 'err'); return; }
      print(Array.from(cards).map((c, i) => '  ' + (i + 1) + '. ' + esc(c.textContent)).join('<br>'));
      print('Details: <code>open projekte</code>');
    },

    whoami() {
      print(
        'Luis Rosado — Informatiker EFZ, Applikationsentwicklung<br>' +
        'IMS an der BWD Bern, 3. Ausbildungsjahr, Burgdorf BE<br>' +
        'Status: auf der Suche nach einer Praktikumsstelle'
      );
    },

    contact() {
      print(
        'E-Mail:  <code>luisrosado008@gmail.com</code><br>' +
        'GitHub:  <code>github.com/Lro-rgb</code><br>' +
        'Schreiben: <code>open kontakt</code>'
      );
    },

    design(arg) {
      if (!arg) {
        print('Aktuell: <b>' + esc(currentTheme()) + '</b>');
        print('Verfügbar: ' + THEMES.map((t) => '<code>' + t.id + '</code>').join(', '));
        print('Wechseln mit <code>design dracula</code> — oder ohne Namen mit dem Kreis links unten.');
        return;
      }
      if (setTheme(arg.toLowerCase())) print('Design gewechselt: ' + esc(arg), 'ok');
      else print('Unbekanntes Design: ' + esc(arg), 'err');
    },

    clear() {
      Array.from(termOut.querySelectorAll('.term-line')).forEach((l) => l.remove());
    },

    exit() { togglePanel(false); }
  };

  // Ein paar gebraeuchliche Zweitnamen, damit niemand raten muss.
  COMMANDS.dir = COMMANDS.ls;
  COMMANDS.cat = COMMANDS.open;
  COMMANDS.theme = COMMANDS.design;
  COMMANDS.mail = COMMANDS.contact;
  COMMANDS.about = COMMANDS.whoami;

  function runCommand(raw) {
    const input = raw.trim();
    print(
      '<span class="term-prompt">luis@portfolio</span> <span class="term-path">~$</span> ' +
        esc(input),
      'cmd'
    );
    if (!input) return;

    const parts = input.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    if (COMMANDS[cmd]) COMMANDS[cmd](arg);
    else print('Unbekannter Befehl: ' + esc(cmd) + ' — <code>help</code> zeigt alle.', 'err');
  }

  if (termInput) {
    termInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = termInput.value;
        if (value.trim()) { history.unshift(value); historyIndex = -1; }
        termInput.value = '';
        runCommand(value);
        return;
      }
      // Pfeiltasten blaettern durch die bisherigen Eingaben — wie in einer
      // echten Shell.
      if (e.key === 'ArrowUp' && history.length) {
        e.preventDefault();
        historyIndex = Math.min(historyIndex + 1, history.length - 1);
        termInput.value = history[historyIndex];
        return;
      }
      if (e.key === 'ArrowDown' && history.length) {
        e.preventDefault();
        historyIndex = Math.max(historyIndex - 1, -1);
        termInput.value = historyIndex === -1 ? '' : history[historyIndex];
        return;
      }
      if (e.key === 'Escape') { e.preventDefault(); togglePanel(false); }
    });

    // Klick irgendwo ins Terminal setzt den Cursor in die Eingabe.
    termOut.addEventListener('click', (e) => {
      if (!e.target.closest('a, code, button')) termInput.focus();
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
     7. TASTENKUERZEL
     Dieselben wie im Original, soweit der Browser sie nicht selbst belegt.
     ═══════════════════════════════════════════════════════════════════ */

  document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;

    // Strg+P — Datei suchen. Der Browser druckt sonst; das ist hier
    // gewollt uebernommen, weil die Palette der haeufigere Wunsch ist.
    // Drucken bleibt ueber die Palette erreichbar ("Datei: Seite drucken").
    if (e.key.toLowerCase() === 'p' && !e.shiftKey) {
      e.preventDefault();
      qiBackdrop.hidden ? openPalette('') : closePalette();
      return;
    }

    // Strg+Umschalt+P — Befehle
    if (e.key.toLowerCase() === 'p' && e.shiftKey) {
      e.preventDefault();
      openPalette('>');
      return;
    }

    // Strg+^ beziehungsweise Strg+` — Terminal
    if (e.key === '^' || e.key === '`' || e.code === 'Backquote' || e.code === 'IntlBackslash') {
      e.preventDefault();
      togglePanel();
      return;
    }

    // Strg+Umschalt+E — Explorer
    if (e.key.toLowerCase() === 'e' && e.shiftKey) {
      e.preventDefault();
      toggleSidebar();
    }
  });

  /* Escape als Notausgang.
     Vorher lag das nur auf dem Eingabefeld der Palette — wer den Fokus
     verloren hatte, kam nicht mehr heraus. Jetzt hoert das Dokument mit,
     und zwar in der Erfassungsphase (capture), damit es auch dann greift,
     wenn ein anderer Handler das Ereignis vorher abfaengt. */
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== 'Escape') return;

      if (!qiBackdrop.hidden) {
        e.preventDefault();
        e.stopPropagation();
        closePalette();
        return;
      }

      const login = document.getElementById('loginOverlay');
      if (login && login.classList.contains('show')) return;
      if (panelOpen()) togglePanel(false);
    },
    true
  );
})();
