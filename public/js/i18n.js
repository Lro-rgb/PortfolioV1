/* ═══════════════════════════════════════════════════════════════════════
   i18n.js — Sprachumschaltung Deutsch / Englisch

   Woerterbuch-Ansatz: jedes uebersetzbare Element traegt data-i18n="key"
   (fuer innerHTML) oder data-i18n-<attribut>="key" (fuer aria-label, title,
   placeholder, alt, content). apply() liest bei jedem Sprachwechsel alle
   passenden Elemente neu ein — auch spaeter per JS erzeugte, z.B. die
   Gliederung oder die "Ausfuehrlich"-Schalter bei den Projekten.

   Muss vor app.js geladen werden: app.js und vscode.js rufen I18N.t() an
   mehreren Stellen auf (Splash, Login, Terminal, Kommandopalette, ...).
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var translations = {
    de: {
      "meta.title": "Luis Rosado · Informatiker EFZ Applikationsentwicklung",
      "meta.description": "Portfolio von Luis Rosado · Informatiker EFZ Applikationsentwicklung, IMS an der BWD Bern. Skills, Projekte, Tech Stack und Kontakt.",
      "meta.twitterDescription": "Portfolio von Luis Rosado · Informatiker EFZ Applikationsentwicklung, IMS an der BWD Bern.",

      "chrome.skipLink": "Zum Inhalt springen",
      "splash.ariaLabel": "Seite wird geladen",
      "splash.init": "Initialisiere...",
      "splash.skip": "Überspringen ↵",
      "splash.loadingExtensions": "Lade Erweiterungen...",
      "splash.ready": "Bereit.",
      "splash.readyLabel": "Bereit",
      "splash.opening": "Öffne ",

      "login.close": "Dialog schliessen",
      "login.title": "authentication.js · Zugang erforderlich",
      "login.comment": "// Diese Datei ist passwortgeschützt.<br>// Nur für berechtigte Personen.",
      "login.label": "const password =",
      "login.showPw": "Passwort anzeigen",
      "login.hidePw": "Passwort verbergen",
      "login.enter": "ENTER ↵",
      "login.checking": "Prüfe...",
      "login.error": "Falsches Passwort.",
      "login.connectionError": "Verbindungsfehler.",
      "login.cancel": "Abbrechen (ESC)",

      "menu.goto": "Gehe zu",
      "menu.terminal": "Terminal",
      "menu.theme": "Design",
      "chrome.searchPlaceholder": "Dateien und Befehle durchsuchen",
      "chrome.notLoggedIn": "🔒 Nicht eingeloggt",
      "chrome.loggedIn": "🔓 Eingeloggt",
      "chrome.guest": "🔒 Gast",
      "chrome.authed": "🔓 Angemeldet",

      "chrome.activityBar": "Aktivitätsleiste",
      "chrome.explorerShortcut": "Explorer (Strg+Umschalt+E)",
      "chrome.explorerToggle": "Explorer ein- und ausblenden",
      "chrome.explorerOpen": "Explorer öffnen",
      "chrome.explorerClose": "Explorer schliessen",
      "chrome.searchShortcut": "Suchen (Strg+P)",
      "chrome.search": "Suchen",
      "nav.projects": "Projekte",
      "chrome.terminalShortcut": "Terminal (Strg+^)",
      "chrome.documentsLocked": "Unterlagen (passwortgeschützt)",
      "chrome.protectedDocuments": "Geschützte Unterlagen",
      "chrome.switchTheme": "Farbdesign wechseln",

      "chrome.files": "Dateien",
      "tabbar.close.home": "luis.json schliessen",
      "tabbar.close.skills": "skills.py schliessen",
      "tabbar.close.techstack": "techstack.ts schliessen",
      "tabbar.close.projekte": "projekte.html schliessen",
      "tabbar.close.interessen": "interessen.json schliessen",
      "tabbar.close.kontakt": "kontakt.sql schliessen",
      "tabbar.close.readme": "README.md schliessen",

      "file.projekte": "projekte.html",
      "file.interessen": "interessen.json",
      "file.kontakt": "kontakt.sql",
      "file.noten": "noten.csv",
      "file.lebenslauf": "lebenslauf.md",
      "folder.unterlagen": "unterlagen",
      "cmt.skills": "# skills.py · Technische Fähigkeiten",
      "cmt.techstack": "// techstack.ts · Technologien &amp; Tools",
      "cmt.projekte": "&lt;!-- projekte.html --&gt;",
      "cmt.interessen": "// interessen.json",
      "cmt.kontakt": "-- kontakt.sql",
      "cmt.readme": "# README.md · Wie diese Seite gebaut ist",
      "cmt.noten": "# noten.csv",
      "cmt.lebenslauf": "# lebenslauf.md",

      "chrome.fileExplorer": "Datei-Explorer",
      "chrome.noFileOpen": "Keine Datei geöffnet.",
      "chrome.reopenAll": "Alle Dateien wieder öffnen",
      "chrome.closePanel": "Panel schliessen",
      "chrome.sourceOnGithub": "Quellcode auf GitHub",
      "chrome.toggleTerminal": "Terminal ein- und ausblenden",
      "chrome.noProblems": "Keine bekannten Probleme",
      "chrome.problemsCount": "0 Fehler, 0 Warnungen",

      "noten.preview": "Vorschau",
      "noten.previewTitle": "Kompetenznachweis Modul",
      "noten.openTab": "In neuem Tab öffnen",
      "noten.close": "Schliessen",
      "noten.fileError": "Der Kompetenznachweis konnte nicht geladen werden. Bitte erneut anmelden und nochmals versuchen.",

      "outline.navLabel": "Gliederung dieses Abschnitts",
      "chrome.detailed": "Ausführlich",
      "kontakt.copied": "Kopiert",
      "kontakt.copyFailed": "Kopieren nicht möglich",

      "cv.generatingPdf": "Erstelle PDF…",
      "cv.pdfError": "PDF konnte nicht erstellt werden. Bitte Internetverbindung prüfen.",

      "media.videoFallback": "Ihr Browser kann dieses Video nicht abspielen.",
      "media.play": "Abspielen",
      "media.pause": "Anhalten",
      "media.playRecording": "Aufnahme abspielen",
      "media.pauseRecording": "Aufnahme anhalten",
      "media.seekLabel": "Position in der Aufnahme",
      "media.fullscreen": "Vollbild",
      "media.exitLargeView": "Grossansicht verlassen",
      "media.largeView": "Grossansicht",
      "media.openPage": "Seite öffnen",
      "media.enlargeScreenshot": "Screenshot vergrössern: ",
      "media.enlargeImage": "Bild vergrössern: ",
      "media.imageFallback": "Bild ",
      "media.imageComing": "Bild folgt",
      "media.videoComing": "Video folgt",
      "media.scrollLeft": "Weiter nach links",
      "media.scrollRight": "Weiter nach rechts",
      "media.imagesSuffix": " Bilder",
      "media.prevScreenshot": "Vorheriger Screenshot",
      "media.nextScreenshot": "Nächster Screenshot",
      "media.gotoScreenshot": "Zu Screenshot ",

      "statsfm.lastWeeks": "Letzte vier Wochen · stats.fm",
      "statsfm.tracks": "Titel",
      "statsfm.artists": "Künstler",
      "statsfm.fullProfile": "Ganzes Profil auf stats.fm",

      "palette.ariaLabel": "Gehe zu Datei oder Befehl",
      "palette.placeholder": "Datei eingeben, oder > für Befehle",
      "palette.results": "Ergebnisse",
      "palette.group.files": "Dateien",
      "palette.group.commands": "Befehle",
      "palette.noResults": "Kein Treffer.",
      "palette.hint.locked": "passwortgeschützt",
      "palette.hint.active": "aktiv",
      "palette.cmd.theme": "Design: nächstes Farbdesign",
      "palette.cmd.terminal": "Ansicht: Terminal ein-/ausblenden",
      "palette.cmd.explorer": "Ansicht: Explorer ein-/ausblenden",
      "palette.cmd.reopen": "Ansicht: alle Dateien wieder öffnen",
      "palette.cmd.print": "Datei: Seite drucken oder als PDF sichern",
      "palette.cmd.printHint": "Strg+P im Browser",
      "palette.hint.themeCycle": "Strg+K Strg+T",
      "palette.hint.terminal": "Strg+^",
      "palette.hint.explorer": "Strg+Umschalt+E",
      "palette.cmd.mail": "Kontakt: E-Mail schreiben",
      "palette.cmd.github": "Kontakt: GitHub-Profil öffnen",
      "palette.cmd.logout": "Konto: abmelden",
      "palette.cmd.themePrefix": "Design: ",

      "theme.name.dark-plus": "Dark+ (Standard)",
      "theme.name.github-dark": "GitHub Dark",
      "theme.name.dracula": "Dracula",
      "theme.name.one-dark": "One Dark Pro",
      "theme.name.nord": "Nord",
      "theme.name.light-plus": "Light+ (hell)",

      "status.readPrefix": "Gelesen ",
      "status.readSuffix": " %",

      "terminal.inputLabel": "Terminal-Eingabe",
      "terminal.intro": "Portfolio-Shell. <code>help</code> zeigt alle Befehle.",
      "term.help.intro": "Verfügbare Befehle:",
      "term.help.body": "  <b>ls</b>            Dateien auflisten<br>  <b>open</b> &lt;datei&gt;  Datei öffnen (z. B. <code>open projekte</code>)<br>  <b>projects</b>      Projekte kurz auflisten<br>  <b>whoami</b>        Kurzvorstellung<br>  <b>contact</b>       Kontaktdaten<br>  <b>design</b> [name] Farbdesign anzeigen oder wechseln<br>  <b>clear</b>         Terminal leeren<br>  <b>exit</b>          Terminal schliessen",
      "term.openNeedsArg": "Bitte einen Dateinamen angeben — <code>ls</code> zeigt alle.",
      "term.fileNotFound": "Datei nicht gefunden: ",
      "term.opening": "Öffne ",
      "term.projectsLoading": "Projekte werden geladen — <code>open projekte</code>.",
      "term.whoami": "Luis Rosado — Informatiker EFZ, Applikationsentwicklung<br>IMS an der BWD Bern, 3. Ausbildungsjahr, Burgdorf BE<br>Status: auf der Suche nach einer Praktikumsstelle",
      "term.contact": "E-Mail:  <code>luisrosado008@gmail.com</code><br>GitHub:  <code>github.com/Lro-rgb</code><br>Schreiben: <code>open kontakt</code>",
      "term.design.current": "Aktuell: ",
      "term.design.available": "Verfügbar: ",
      "term.design.switchHint": "Wechseln mit <code>design dracula</code> — oder ohne Namen mit dem Kreis links unten.",
      "term.design.changed": "Design gewechselt: ",
      "term.design.unknown": "Unbekanntes Design: ",
      "term.unknownCommand": "Unbekannter Befehl: ",
      "term.unknownCommandSuffix": " — <code>help</code> zeigt alle.",

      "lightbox.ariaLabel": "Screenshot in Vollansicht",
      "lightbox.prev": "Vorheriges Bild",
      "lightbox.next": "Nächstes Bild",
      "lightbox.close": "Vollansicht schliessen",

      "home.role": "Informatiker EFZ Applikationsentwicklung&nbsp;<span class=\"blink\" aria-hidden=\"true\"></span>",
      "home.intro": "<p>Ich mache die IMS an der BWD Bern und bin im dritten Jahr auf dem Weg zum Informatiker EFZ, Fachrichtung Applikationsentwicklung.</p><p>Wenn mich etwas interessiert, baue ich es meistens einmal selbst nach, bis ich verstehe, warum es funktioniert. Aus dieser Angewohnheit sind die meisten Projekte auf dieser Seite entstanden.</p><p>Jetzt suche ich ein Praktikum, in dem ich in einem Team an Anwendungen mitarbeite, die auch wirklich jemand benutzt.</p>",
      "home.cta.mail": "E-Mail schreiben",
      "home.cta.github": "GitHub ansehen",
      "home.cta.projects": "Projekte ansehen",
      "home.fact.location": "Wohnort",
      "home.fact.school": "Schule",
      "home.fact.status": "Stand",
      "home.fact.statusValue": "3. Ausbildungsjahr",
      "home.fact.focus": "Schwerpunkt",
      "home.fact.focusValue": "Web und Backend",
      "home.fact.likes": "Arbeitet gern mit",
      "home.fact.reachable": "Erreichbar",

      "readme.facts": "<div class=\"fact\"><dt>Aufbau</dt><dd>Code-Editor als Oberfläche</dd></div><div class=\"fact\"><dt>Technik</dt><dd>HTML, CSS, JavaScript von Hand</dd></div><div class=\"fact\"><dt>Abhängigkeiten</dt><dd>keine</dd></div><div class=\"fact\"><dt>Farbdesigns</dt><dd>sechs, umschaltbar</dd></div><div class=\"fact\"><dt>Sprachen</dt><dd>Deutsch und Englisch</dd></div><div class=\"fact\"><dt>Bedienung</dt><dd>vollständig per Tastatur</dd></div>",
      "readme.colorChips": "<li><span class=\"farbfeld\" style=\"background:#1e1e1e\" aria-hidden=\"true\"></span>Editor <code>#1e1e1e</code></li><li><span class=\"farbfeld\" style=\"background:#252526\" aria-hidden=\"true\"></span>Seitenleiste <code>#252526</code></li><li><span class=\"farbfeld\" style=\"background:#333333\" aria-hidden=\"true\"></span>Aktivitätsleiste <code>#333333</code></li><li><span class=\"farbfeld\" style=\"background:#2d5876\" aria-hidden=\"true\"></span>Statusleiste <code>#2d5876</code></li><li><span class=\"farbfeld\" style=\"background:#4FA3E3\" aria-hidden=\"true\"></span>Akzent <code>#4FA3E3</code></li>",

      "projekte.filter.label": "Projekte nach Art filtern",
      "projekte.filter.all": "Alle",
      "projekte.filter.school": "Schule",
      "projekte.filter.personal": "Persönlich",
      "projekte.filter.count": "Projekte",
      "projekte.filter.countOne": "Projekt",

      "home.credits.title": "Quellen",
      "home.credits": "<p class=\"quellen-intro\">Was auf dieser Seite nicht von mir ist:</p><dl class=\"quellen-liste\"><div class=\"q-e\"><dt>Visual Studio Code</dt><dd>Microsoft. Die Oberfläche ist dem Editor nachgebaut, ebenso die Farbdesigns Dark+ und Light+.</dd></div><div class=\"q-e\"><dt><a href=\"https://devicon.dev\" target=\"_blank\" rel=\"noopener noreferrer\">Devicon 2.16.0</a></dt><dd>Die Technologie-Logos bei Skills, Tech-Stack, Explorer und Tableiste. MIT-Lizenz.</dd></div><div class=\"q-e\"><dt>JetBrains Mono</dt><dd>Die Schrift für Code und Beschriftungen. JetBrains, SIL Open Font License.</dd></div><div class=\"q-e\"><dt>Inter</dt><dd>Die Schrift für den Fliesstext. Rasmus Andersson, SIL Open Font License.</dd></div><div class=\"q-e\"><dt>jsPDF 2.5.1</dt><dd>Erzeugt den Lebenslauf als PDF, erst beim Klick geladen. MIT-Lizenz.</dd></div><div class=\"q-e\"><dt><a href=\"https://stats.fm\" target=\"_blank\" rel=\"noopener noreferrer\">stats.fm</a></dt><dd>Meine Hördaten bei den Interessen. Die Cover kommen von Spotify und Apple Music.</dd></div><div class=\"q-e\"><dt>Weitere Farbdesigns</dt><dd>Dracula (Zeno Rocha), Nord (Sven Greb), One Dark (Atom) und GitHub Dark — alle MIT-Lizenz.</dd></div></dl><p class=\"quellen-fuss\">Text, Aufbau, CSS, JavaScript, die Serverfunktionen und die Bilder der Projekte sind von mir. Die Bildquellen meiner ersten Website stehen <a href=\"erste-website/quellen.html\" target=\"_blank\" rel=\"noopener noreferrer\">dort auf ihrer eigenen Seite</a>.</p>",

      "skills.intro": "<p>Neben jeder Technologie steht das Projekt, in dem ich sie eingesetzt habe. Was ich dort genau gebaut habe, steht bei den Projekten.</p>",
      "skills.legend.proj": "in einem Projekt eingesetzt",
      "skills.legend.base": "Grundlagen aus dem Unterricht",
      "skills.legend.new": "arbeite ich mich gerade ein",
      "skills.vh.proj": " — in einem Projekt eingesetzt",
      "skills.vh.base": " — Grundlagen aus dem Unterricht",
      "skills.chip.rezeptbuch": "Mein Rezeptbuch",
      "skills.h.backend": "Backend &amp; Daten",
      "skills.chip.webshop": "Redis-Webshop",
      "skills.chip.urlshortener": "URL-Shortener",
      "skills.chip.class": "Unterricht",
      "skills.h.ops": "Betrieb &amp; Werkzeuge",
      "skills.chip.allProjects": "alle Projekte",
      "skills.name.ci": "CI-Pipeline",
      "skills.name.azure": "Azure / Betrieb",
      "skills.chip.devopsModule": "DevOps-Modul",
      "skills.name.network": "Netzwerke / TCP-IP",
      "skills.next": "Als Nächstes: REST-APIs von Grund auf, nach den zwei Endpunkten dieser Website.",

      "techstack.cat.programming": "Programmierung",
      "techstack.cat.database": "Datenbank",
      "techstack.cat.deploy": "Ausliefern",
      "techstack.cat.ops": "Betrieb",
      "techstack.cat.vcs": "Versionierung",
      "techstack.cat.collab": "Kollaboration",
      "techstack.cat.school": "Schule",
      "techstack.cat.mainsystem": "Hauptsystem",
      "techstack.cat.devsetup": "Dev-Setup",
      "techstack.cat.terminal": "Terminal / Skripte",
      "techstack.setup": "<p>Für die Schule nutze ich ein Lenovo ThinkPad mit Dual-Boot: Windows 11 für den Alltag, Arch Linux fürs Programmieren. Entwickelt wird in VS Code, versioniert über GitLab. Zuhause steht zusätzlich ein Desktop-PC mit Windows.</p>",

      "projekte.title": "Projekte",
      "projekte.intro": "<p>Jedes Projekt beginnt mit einem Abstract, also der Kurzfassung in zwei bis drei Sätzen. Darunter stehen die Details, der eingesetzte Stack und, wo vorhanden, Quellcode und Demo.</p>",
      "projekte.h.personal": "Persönliche Projekte",
      "projekte.h.school": "Schulprojekte",

      "proj.portfolio.type": "// Persönlich · eigenständig · laufend",
      "proj.portfolio.abstract": "<strong>Abstract</strong>Diese Seite hier. Die Oberfläche ist einem Code-Editor nachgebaut, mit Tabs, Explorer, Terminal und Kommandopalette. Öffentlich sind Skills und Projekte, hinter einem Passwort liegen Noten und Lebenslauf. Alles von Hand geschrieben, ohne Framework und ohne eine einzige externe Abhängigkeit.",
      "proj.portfolio.body": "Drin steckt unter anderem eine Tabverwaltung mit Tastatursteuerung, ein Explorer, der auf dem Handy zur Schublade wird, sechs Farbdesigns und ein eigenes Druck-Stylesheet. Der Login geht an eine Serverless Function, die das Passwort gegen einen gesalzenen scrypt-Hash prüft und ein Token mit vier Stunden Laufzeit zurückgibt. Noten und Lebenslauf liegen auf dem Server und stehen nie im ausgelieferten HTML. Wer den Quelltext im Browser öffnet, findet dort nichts.",
      "proj.portfolio.meta": "<div><dt>Meine Rolle</dt><dd>Alleine umgesetzt: Konzept, Gestaltung, Frontend und Backend</dd></div><div><dt>Besonderheit</dt><dd>Kein Framework, keine npm-Abhängigkeiten. Was im Browser ankommt, habe ich geschrieben.</dd></div>",
      "proj.portfolio.links": "<a href=\"https://github.com/Lro-rgb/PortfolioV1\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">🐙 Quellcode auf GitHub</a>",

      "proj.wallpaper.type": "// Persönlich · eigenständig · eigenes Skript",
      "proj.wallpaper.title": "Wallpaper-Switcher mit automatischem Farbschema",
      "proj.wallpaper.abstract": "<strong>Abstract</strong>Ein Bash-Skript, das aus meinem Hintergrundbild ein Farbschema errechnet und es auf das ganze System anwendet. Ein Bildwechsel färbt damit Fensterrahmen, Leiste, Menü und Terminal automatisch mit um, ohne dass ich eine Konfigurationsdatei anfassen muss.",
      "proj.wallpaper.body": "Das Skript verkettet vier Werkzeuge: <code>waypaper</code> setzt das Bild, <code>matugen</code> leitet die Farbpalette daraus ab, <code>rofi</code> ist das Auswahlmenü und <code>waybar</code> die Statusleiste. Danach schreibt es die Konfigurationsdateien der beteiligten Programme neu und startet sie kontrolliert neu. Der knifflige Teil waren nicht die Farben, sondern die Reihenfolge: Lädt ein Programm zu früh neu, liest es noch die alte Palette.",
      "proj.wallpaper.meta": "<div><dt>Meine Rolle</dt><dd>Alleine geschrieben</dd></div><div><dt>Gelernt</dt><dd>Bash, Kommandozeilenwerkzeuge verketten, Konfigurationsdateien und Prozesse unter Linux</dd></div>",
      "proj.wallpaper.links": "<a href=\"https://github.com/Lro-rgb/wallsync\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">🐙 Quellcode auf GitHub</a>",

      "proj.arch.type": "// Persönlich · eigenständig",
      "proj.arch.abstract": "<strong>Abstract</strong>Ein selbst aufgesetztes Dual-Boot-System auf meinem ThinkPad: Windows 11 für den Alltag, Arch Linux mit dem Window Manager Hyprland fürs Programmieren. Eingerichtet, weil ich wissen wollte, wie ein Linux-System unter der Oberfläche zusammengesetzt ist.",
      "proj.arch.body": "Arch über <code>archinstall</code> installiert und Hyprland von Grund auf konfiguriert. Bei Hyprland gibt es keine fertige Oberfläche: Jede Taste und jedes Fensterverhalten steht in einer Konfigurationsdatei. Dazu Alacritty als Terminal, die Fish-Shell, <code>waybar</code> als Statusleiste, <code>fuzzel</code> als Programmstarter und Nautilus als Dateimanager. Das Abmeldemenü ist kein fertiges Programm, sondern ein <code>rofi</code>-Skript, das aus der Leiste heraus aufgerufen wird. Aus diesem Setup ist auch der Wallpaper-Switcher entstanden, der inzwischen ein eigenes Repository hat.",
      "proj.arch.meta": "<div><dt>Meine Rolle</dt><dd>Alleine umgesetzt</dd></div><div><dt>Gelernt</dt><dd>Partitionierung und Bootloader, Konfigurationsverwaltung, Fehlersuche ohne grafische Oberfläche</dd></div>",
      "proj.arch.links": "<a href=\"https://github.com/Lro-rgb/arch-hyprland-rice\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">🐙 Konfiguration auf GitHub</a>",

      "proj.modding.type": "// Persönlich · eigenständig",
      "proj.modding.title": "Konsolen-Modding: Switch &amp; 3DS",
      "proj.modding.abstract": "<strong>Abstract</strong>Auf meiner eigenen Nintendo Switch und meinem 3DS eine Custom Firmware eingerichtet. Mich hat interessiert, wie ein Bootvorgang abläuft und an welcher Stelle ein System seine Signaturen prüft.",
      "proj.modding.body": "Bei der Switch über ein RCM-Jig im Recovery-Modus den Payload Hekate geladen und ein EmuMMC aufgesetzt, also eine abgetrennte Systemkopie, damit das Originalsystem unangetastet bleibt. Das ging nur, weil die Firmware noch nicht gepatcht war. Auf dem 3DS läuft Luma3DS. Beide Geräte gehören mir, und es ging um die Boot-Kette, nicht um Inhalte.",
      "proj.modding.meta": "<div><dt>Meine Rolle</dt><dd>Alleine umgesetzt</dd></div><div><dt>Gelernt</dt><dd>Bootvorgang, Recovery-Modi, Signaturprüfung und der Umgang mit englischer Fachdokumentation</dd></div>",

      "proj.urlshortener.type": "// Schulprojekt · Modul 210 · eigenständig",
      "proj.urlshortener.title": "URL-Shortener mit GitOps-Kette",
      "proj.urlshortener.abstract": "<strong>Abstract</strong>Ein URL-Shortener aus zwei NestJS-Diensten und einer MariaDB, der nicht nur läuft, sondern auch ausgeliefert wird: containerisiert, über eine CI-Pipeline gebaut und von ArgoCD automatisch in einen Kubernetes-Cluster deployt. Das Interessante war weniger das Kürzen von Links als der Weg vom Commit bis in den laufenden Cluster.",
      "proj.urlshortener.body": "<strong>Die Anwendung.</strong> <code>shorty</code> nimmt lange URLs entgegen, gibt einen Kurzcode zurück und leitet beim Aufruf per 302 weiter. <code>keeper</code> ist der einzige Dienst, der die Datenbank sieht, und ist per API-Key geschützt. Von aussen erreichbar ist nur <code>shorty</code> über den Ingress, <code>keeper</code> hängt als ClusterIP dahinter. Ein Angreifer, der von aussen kommt, hat also keinen direkten Weg zur Datenbank.<br><br><strong>Der Weg in den Cluster.</strong> Beide Dienste laufen in Containern, gebaut über eine GitLab-Pipeline. Die Kubernetes-Manifeste liegen bewusst in einem <em>zweiten</em> Repo: Anwendungscode und gewünschter Cluster-Zustand sind getrennt. ArgoCD beobachtet dieses GitOps-Repo und gleicht den Cluster automatisch an. Ein Deployment ist damit ein Commit, kein <code>kubectl</code>-Befehl von Hand. Wer den Zustand ändern will, muss durch Git, und dort ist jede Änderung nachvollziehbar.<br><br>Dazu kam schriftliche Arbeit, die ich sonst nirgends gemacht habe: ein Rollenkonzept mit IAM und RBAC, ein Sicherheitskonzept und eine Kostenanalyse für einen Betrieb in AWS. Alle drei theoretisch, aber sie haben mich zum ersten Mal darüber nachdenken lassen, was der Betrieb einer Anwendung tatsächlich kostet und wer worauf zugreifen darf.",
      "proj.urlshortener.meta": "<div><dt>Meine Rolle</dt><dd>Alleine umgesetzt. Der Kurs stellte ein leeres Grundgerüst mit den ersten sechs Commits, alles ab der Containerisierung stammt von mir: 17 der 23 Commits.</dd></div><div><dt>Gelernt</dt><dd><ul class=\"proj-ul\"><li>Warum man Anwendungscode und Deployment-Zustand trennt</li><li>Dass Container zur Sicherheit gehören, nicht nur zum Ausliefern, etwa wenn sie nicht als root laufen</li><li>Einen Dienst so schneiden, dass nur einer nach aussen zeigt</li><li>Dass ein Deployment reproduzierbar sein muss, sonst ist es Glückssache</li></ul></dd></div>",
      "proj.urlshortener.links": "<a href=\"https://github.com/Lro-rgb/url-shortener\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">🐙 Anwendung</a><a href=\"https://github.com/Lro-rgb/url-shortener-gitops\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">🐙 GitOps-Repo</a>",

      "proj.askel.type": "// Schulprojekt · Modul 335 · Dreierteam",
      "proj.askel.abstract": "<strong>Abstract</strong>Askel heisst auf Finnisch «Schritt» und ist eine mobile App, die eine Fahrt per GPS aufzeichnet: Position, Höhe und Geschwindigkeit. Routen lassen sich speichern, benennen, farblich markieren und auf einer Karte anzeigen. Alle Daten bleiben auf dem Gerät, ein Backend gibt es nicht.",
      "proj.askel.body": "Umgesetzt mit React Native und Expo. Die Standortdaten kommen über <code>expo-location</code>, die Aufzeichnung läuft während der Fahrt weiter und die Routen werden lokal gespeichert. Dass es kein Backend gibt, war eine bewusste Entscheidung: Bewegungsprofile sind heikle Daten, und was das Gerät nie verlässt, kann auch nicht abfliessen.",
      "proj.askel.meta": "<div><dt>Meine Rolle</dt><dd>Co-Developer im Dreierteam. Von mir stammen unter anderem:</dd></div><div><dt>Umgesetzt</dt><dd><ul class=\"proj-ul\"><li>Dauerhaftes Speichern der aufgezeichneten Routen auf dem Gerät</li><li>GPS-Aufzeichnung mit Distanzberechnung (<code>lib/distance.ts</code>)</li><li>Einstellungsbereich der App samt Formatierung der Messwerte</li><li>Farbauswahl beim Speichern einer Route</li><li>Schaltfläche zum Zentrieren der Karte auf die eigene Position</li><li>Automatisierte Tests für Distanzberechnung, Formatierung und Speicherung</li></ul></dd></div>",
      "proj.askel.links": "<a href=\"https://github.com/Lro-rgb/Askel\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">🐙 Quellcode auf GitHub</a>",

      "proj.rezeptbuch.type": "// Schulprojekt · Modul 322 · eigenständig",
      "proj.rezeptbuch.title": "Mein Rezeptbuch",
      "proj.rezeptbuch.abstract": "<strong>Abstract</strong>Eine Android-App zum Verwalten von Rezepten, geschrieben in C# mit .NET MAUI. Vier Bereiche über eine Tab-Leiste: die Sammlung mit Suche und Vegetarisch-Filter, eine Eingabemaske mit Validierung, eine FAQ-Seite und eine Info-Seite. Auftrag im Modul 322 für einen fiktiven Kunden, von der Oberfläche bis zur Logik allein umgesetzt.",
      "proj.rezeptbuch.body": "<strong>Aufbau.</strong> Die App folgt MVVM, also der Trennung von Oberfläche und Logik. Die Views sind XAML-Dateien und enthalten keine Logik, der Zustand liegt in den ViewModels, und ein <code>RezeptService</code> als Singleton hält die Rezepte. Eine <code>BaseViewModel</code> mit <code>SetProperty</code> und <code>INotifyPropertyChanged</code> sorgt dafür, dass die Oberfläche jede Änderung von selbst mitbekommt: Ich setze eine Eigenschaft im Code, und das Feld auf dem Bildschirm aktualisiert sich, ohne dass ich es anfasse. Das war der Punkt, an dem Datenbindung für mich zum ersten Mal Sinn ergeben hat.<br><br><strong>Validierung.</strong> Titel und Beschreibung sind Pflichtfelder und werden beim Tippen geprüft, nicht erst beim Speichern. Der Titel braucht mindestens drei Zeichen, die Beschreibung zehn; die Meldung steht direkt am Feld statt in einem Dialog, der erst nach dem Absenden aufgeht. Die Navigation läuft über die Shell mit benannten Routen, das Detail einer Karte wird als <code>RezeptDetailPage?RezeptId=…</code> aufgerufen.<br><br><strong>Was sie nicht kann.</strong> Die Rezepte liegen nur im Arbeitsspeicher. Schliesst man die App, sind die selbst angelegten wieder weg und nur die vier Beispielrezepte da. Bilder gibt es ebenfalls keine, nur Platzhalter. Beides war im Auftrag nicht verlangt — es ging um Oberfläche und Datenbindung — aber es ist die erste Sache, die ich nachziehen würde: eine SQLite-Datei hinter denselben <code>RezeptService</code> hängen, damit der Rest der App unverändert bleibt.",
      "proj.rezeptbuch.meta": "<div><dt>Meine Rolle</dt><dd>Alleine umgesetzt: Oberfläche, ViewModels und Datenhaltung</dd></div><div><dt>Gelernt</dt><dd><ul class=\"proj-ul\"><li>C# in einem echten Projekt statt in Übungsaufgaben</li><li>MVVM: warum die Oberfläche nichts über die Datenhaltung wissen soll</li><li>Datenbindung mit <code>INotifyPropertyChanged</code> statt Felder von Hand nachzuführen</li><li>Oberflächen in XAML aufbauen und über Styles zentral gestalten</li><li>Eingaben prüfen, während getippt wird, nicht erst beim Absenden</li></ul></dd></div>",
      "proj.rezeptbuch.links": "<a href=\"https://github.com/Lro-rgb/MeinRezeptbuch\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">🐙 Quellcode auf GitHub</a>",

      "proj.kobui.type": "// Schulprojekt · überbetrieblicher Kurs (ÜK) · Dreierteam",
      "proj.kobui.abstract": "<strong>Abstract</strong>Kobui ist eine Web-App, die ein lokal laufendes Sprachmodell (KoboldCpp) an ein eigenes React-Frontend anbindet. Gedacht als datenschutzfreundliche Alternative zu Cloud-Diensten: Weil das Modell auf dem eigenen Rechner läuft, verlässt keine Eingabe das Gerät.",
      "proj.kobui.body": "Frontend mit TypeScript, React und Vite, gestaltet über CSS Modules. Die Anwendung spricht die lokale Schnittstelle von KoboldCpp an und bringt eine eigene Anleitung mit, damit man sie auch ohne Vorwissen aufsetzen kann.",
      "proj.kobui.meta": "<div><dt>Meine Rolle</dt><dd>Organisation und Gestaltung im Dreierteam. Ich habe Aufgaben verteilt, den Zeitplan im Blick behalten und bin eingesprungen, wo es gegen Ende knapp wurde.</dd></div><div><dt>Beigetragen</dt><dd>Installationsanleitung für das lokale Backend, Ergänzung alternativer Modelle und Korrekturen an der Bedienoberfläche</dd></div><div><dt>Gelernt</dt><dd>Wie viel Abstimmung ein Dreierteam braucht. Und dass ein realistischer Zeitplan mehr wert ist als ein ehrgeiziger.</dd></div>",
      "proj.kobui.links": "<a href=\"https://github.com/kiraa1q/kobui\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">🐙 Quellcode auf GitHub</a>",

      "proj.webshop.type": "// Schulprojekt · über drei Module gewachsen · laufend",
      "proj.webshop.abstract": "<strong>Abstract</strong>Ein Webshop, der seine Daten nicht in einer Tabellendatenbank hält, sondern komplett in Redis. Entstanden ist er im NoSQL-Modul als ziemlich leeres Grundgerüst. Seither ist er mein Übungsprojekt: In jedem folgenden Modul, in dem es gepasst hat, habe ich ihn um das erweitert, was gerade dran war.",
      "proj.webshop.body": "<strong>NoSQL-Modul: das Datenmodell.</strong> Jeder Datensatz liegt als Hash unter einem sprechenden Schlüssel, also <code>product:12</code>, <code>user:3</code>, <code>cart:3</code>. Redis kennt kein <code>WHERE</code>, deshalb braucht jede Suche einen eigenen Index. Die Kategorien liegen als Mengen unter <code>idx:kategorie:*</code> und enthalten die Produkt-IDs. Genau das war der Lerneffekt: In SQL wäre es eine einzige Abfrage gewesen, hier muss ich den Index beim Speichern von Hand mitschreiben. Vergesse ich das an einer Stelle, findet die Suche das Produkt nie wieder.<br><br><strong>Docker-Modul: das Ausliefern.</strong> Anwendung und Datenbank starten seither zusammen über Docker Compose, damit der Shop auch auf einem fremden Rechner ohne Einrichtung läuft. Aus derselben Zeit stammt eine Kleinigkeit, über die ich mich immer noch freue: Die Verbindung sucht sich ihren Port selbst. Steht keine Umgebungsvariable, probiert sie 6379 und 6380 durch. In der Schule lief Redis auf einem anderen Port als zuhause, und statt die Datei jedes Mal zu ändern, klärt das Programm es eben selbst.<br><br><strong>DevOps- und Azure-Modul: der Betrieb.</strong> Zuletzt ging es darum, die Anwendung nicht nur lokal laufen zu lassen, sondern auf einem Server zu betreiben und im Blick zu behalten.<br><br>Heute kann der Shop: Anmeldung mit Rollen für Admins und Kundschaft, Produkte anlegen, bearbeiten und löschen, einen Warenkorb pro Benutzer und Skripte, die alles mit Testdaten füllen.",
      "proj.webshop.meta": "<div><dt>Meine Rolle</dt><dd>Eigenes Repository, von mir umgesetzt und über die Module hinweg weiterentwickelt</dd></div><div><dt>Warum immer dasselbe Projekt</dt><dd>Ein neues Thema an bekanntem Code zu lernen zeigt den Unterschied deutlicher als ein frisches Beispielprojekt. Nebenbei sieht man an der Historie, wie sich derselbe Shop über ein Jahr verändert hat.</dd></div><div><dt>Gelernt</dt><dd><ul class=\"proj-ul\"><li>Datenmodellierung ohne Tabellen: der Schlüssel ist die Struktur</li><li>Warum eine Key-Value-Datenbank schnell ist und was man dafür aufgibt</li><li>Indizes selbst pflegen, statt sie von der Datenbank zu bekommen</li><li>Mehrere Dienste gemeinsam starten und ausliefern</li><li>Dass eine Anwendung auf einem Server andere Fragen stellt als eine, die nur lokal läuft</li></ul></dd></div>",
      "proj.webshop.links": "<a href=\"https://github.com/Lro-rgb/redis-webshop\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">🐙 Quellcode auf GitHub</a>",

      "proj.erstewebsite.type": "// Schulprojekt · 1. Lehrjahr · eigenständig · mein erstes Projekt",
      "proj.erstewebsite.title": "Erste eigene Website",
      "proj.erstewebsite.abstract": "<strong>Abstract</strong>Eine Info-Seite über mich mit fünf Unterseiten: Home, Über mich, Freizeit, Ausbildung und Kontakt. Reines HTML und CSS, ohne JavaScript, von Hand geschrieben und über FTP auf den Klassenserver geladen. Das war im ersten Lehrjahr meine erste Website überhaupt.",
      "proj.erstewebsite.body": "Inhaltlich ging es um mich selbst, technisch um die Grundlagen: eine gemeinsame Navigation auf jeder Seite, ein durchgehendes Layout, eingebundene Bilder und eine Quellenseite für alles, was nicht von mir stammt. Die Seite liegt bis heute unverändert auf dem Schulserver; eine Kopie davon liegt als Unterseite hier, damit sie erreichbar bleibt, wenn der Schulserver es irgendwann nicht mehr ist.<br><br>Ich zeige sie bewusst im Originalzustand. Die Rechtschreibung ist stellenweise daneben, jede Unterseite wiederholt dieselbe Navigation als Kopie, und es gibt kein Layout fürs Handy. Genau daran sehe ich den Abstand zu dem, was ich heute baue: Das Portfolio, auf dem Sie gerade sind, ist dasselbe Vorhaben — eine Seite über mich — nur ein Jahr später.",
      "proj.erstewebsite.meta": "<div><dt>Meine Rolle</dt><dd>Alleine umgesetzt: Inhalt, Layout und Umsetzung</dd></div><div><dt>Gelernt</dt><dd><ul class=\"proj-ul\"><li>HTML-Grundgerüst, Verlinkung zwischen mehreren Seiten und Einbinden von Bildern</li><li>CSS auslagern, statt jede Seite einzeln zu gestalten</li><li>Dateien per FTP auf einen Webserver bringen</li><li>Dass Quellen anzugeben dazugehört, auch bei Bildern</li></ul></dd></div><div><dt>Was ich heute anders mache</dt><dd>Navigation nicht mehr in jede Datei kopieren, Layout von Anfang an fürs Handy mitdenken und den Text vor dem Veröffentlichen gegenlesen</dd></div>",
      "proj.erstewebsite.links": "<a href=\"erste-website\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">🌐 Kopie hier ansehen</a><a href=\"http://datastaff.com.br/rosado/\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">🏫 Original auf dem Schulserver</a>",

      "interessen.title": "Interessen",
      "interessen.intro": "<p>Was ich neben der Schule mache.</p>",
      "interessen.h.hardware": "Hardware und Softmods",
      "interessen.hardware": "<p>Ich habe einen PC selbst zusammengebaut und zwei Konsolen mit Custom Firmware versehen.</p>",
      "interessen.gaming": "<p>Ich habe über hundert Spiele gespielt. Wenn mir eines gefällt, spiele ich es auf 100 Prozent: alle Trophäen, alle Nebenaufgaben, alle Sammelobjekte. Die meiste Zeit habe ich in Persona 3 FES, Palworld und Elden Ring verbracht.</p>",
      "interessen.h.music": "Musik",
      "interessen.music": "<p>Ich höre den ganzen Tag Musik und sammle Alben auch physisch. Das sind meine liebsten:</p>",
      "interessen.music2": "<p>Dazu The Smiths, bei denen ich mich auf kein einzelnes Album festlegen kann. Was ich tatsächlich höre, steht in meinen Hörstatistiken:</p>",
      "interessen.statsfm.text": "Meine Hörstatistiken, direkt aus Spotify: meistgehörte Künstler, Alben und Titel",
      "interessen.h.reading": "Lesen",
      "interessen.reading": "<p>Ich lese hauptsächlich Mangas und sammle die Reihen bis zum letzten Band. Zu einigen davon habe ich auch Figuren.</p>",
      "interessen.credits": "Bildnachweis: Key-Art der Spiele von Steam, Album- und Bandcover aus dem Angebot von Apple und der Open Library. Die Rechte liegen bei den jeweiligen Studios, Labels und Verlagen; die Bilder stehen hier als Hinweis auf das Werk.",

      "kontakt.title": "Kontakt",
      "kontakt.intro": "<p>Ich suche eine Praktikumsstelle in der Applikationsentwicklung. Bei Fragen oder wenn Sie Unterlagen brauchen, schreiben Sie mir. Ich antworte meistens am gleichen Tag.</p>",
      "kontakt.viewSource": "Quellcode ansehen",
      "kontakt.copyAddress": "Adresse kopieren",
      "kontakt.hint": "Burgdorf BE · erreichbar auch über die Schule",
      "kontakt.h.access": "Zugang zum geschützten Bereich",
      "kontakt.access": "<p>Noten und Lebenslauf liegen im Ordner <code>unterlagen</code> hinter einem Passwort. Die Zugangsdaten bekommen die Schulleitung, die betreuenden Lehrpersonen und Betriebe, bei denen ich mich bewerbe. Falls Sie den Zugang brauchen und noch nicht haben, genügt eine kurze Mail.</p>",
      "kontakt.loginOpen": "Anmelden und öffnen",
      "kontakt.legal": "Impressum",
      "kontakt.legalContent": "<div><dt>Verantwortlich</dt><dd>Luis Rosado</dd></div><div><dt>Anschrift</dt><dd><a href=\"https://www.google.com/maps/search/?api=1&amp;query=Pleerweg+13D%2C+3400+Burgdorf%2C+Schweiz\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"Auf Google Maps ansehen\">Pleerweg 13D, 3400 Burgdorf, Schweiz</a></dd></div><div><dt>E-Mail</dt><dd><a href=\"mailto:luisrosado008@gmail.com\">luisrosado008@gmail.com</a></dd></div><div><dt>Zweck</dt><dd>Persönliche Portfolio- und Bewerbungswebsite im Rahmen der Ausbildung an der IMS an der BWD Bern. Keine kommerzielle Nutzung.</dd></div><div><dt>Hosting</dt><dd>Vercel Inc.</dd></div><div><dt>Quellcode</dt><dd><a href=\"https://github.com/Lro-rgb/PortfolioV1\" target=\"_blank\" rel=\"noopener noreferrer\">github.com/Lro-rgb/PortfolioV1</a></dd></div><div><dt>Schriften</dt><dd>JetBrains Mono und Inter über Google Fonts (SIL Open Font License)</dd></div><div><dt>Bildnachweis</dt><dd>Technologie-Logos von <a href=\"https://devicon.dev\" target=\"_blank\" rel=\"noopener noreferrer\">Devicon</a> (MIT-Lizenz). Key-Art der Spiele von Steam, Album- und Bandcover aus dem Angebot von Apple und der Open Library — Rechte bei den jeweiligen Studios, Labels und Verlagen. Alle übrigen Inhalte stammen von mir.</dd></div><div><dt>Externe Daten</dt><dd>Die Hörstatistiken auf der Interessen-Seite werden beim Aufruf von <a href=\"https://stats.fm\" target=\"_blank\" rel=\"noopener noreferrer\">stats.fm</a> geladen. Dabei erfährt stats.fm Ihre IP-Adresse. Der Verweis auf die Anschrift führt zu Google Maps — dorthin gelangen Ihre Daten aber erst, wenn Sie ihn anklicken.</dd></div>",

      "readme.h.about": "Über diese Seite",
      "readme.about": "<p>Diese Seite ist meine persönliche Website im Rahmen der IMS-Ausbildung und gleichzeitig Teil meiner Bewerbungsunterlagen. Ich habe sie von Hand gebaut, ohne Baukasten und ohne Framework.</p><p>Hier steht, warum sie so aussieht und funktioniert, wie sie es tut. Gestalterische Entscheidungen sind nachvollziehbar oder sie sind Zufall; ich möchte, dass meine nachvollziehbar sind.</p>",
      "readme.h.editor": "Warum ein Code-Editor als Oberfläche",
      "readme.editor": "<p>Die Seite richtet sich an Betriebe, die Applikationsentwicklung ausbilden. Deshalb ist die Oberfläche selbst eine Arbeitsprobe: Sie ist einem Code-Editor nachempfunden, also der Umgebung, in der ich täglich arbeite.</p><p>Jeder Abschnitt ist eine Datei, deren Endung zum Inhalt passt: <code>skills.py</code>, <code>techstack.ts</code>, <code>kontakt.sql</code>. Das ist kein Selbstzweck: Die Endung sagt schon vor dem Lesen, worum es geht, und der Explorer links zeigt die ganze Struktur auf einen Blick. Wer lieber klassisch navigiert, benutzt die Tableiste oben; beides führt zum selben Inhalt.</p>",
      "readme.h.fonts": "Schrift",
      "readme.fontsTable": "<tr><th>Schrift</th><th>Eingesetzt für</th><th>Begründung</th></tr><tr><td>JetBrains&nbsp;Mono</td><td>Überschriften, Tabellen, Codeblöcke, Navigation</td><td>Für Code entworfen: feste Zeichenbreite, klar unterscheidbares 0/O und 1/l/I. Hält Tabellenspalten optisch in Flucht.</td></tr><tr><td>Inter</td><td>Fliesstext und Beschreibungen</td><td>Eine Monospace-Schrift ermüdet über mehrere Sätze. Inter ist für Bildschirme optimiert und auch in kleinen Graden gut lesbar.</td></tr>",
      "readme.fonts2": "<p>Zwei Schriften mit klarer Aufgabenteilung: Monospace für Struktur und Daten, Inter für Sprache. Der Wechsel ist kein Stilmittel, sondern ein Hinweis darauf, welche Art von Information gerade folgt.</p>",
      "readme.h.colors": "Farben",
      "readme.colors": "<p>Die Farben stammen aus den echten VS-Code-Themes. Ein einziger Akzentton führt durch die ganze Seite: aktiver Tab, Links, Schaltflächen, Fokusrahmen. Wer ihn einmal zugeordnet hat, findet sich überall zurecht.</p><p>Grün, Orange und Rot sind für Bedeutung reserviert, nicht für Dekoration: Einstufungen bei den Skills, Notenwerte, Fehlermeldungen. Farbe ist dabei nie der einzige Träger einer Information. Überall steht auch der Text dabei, damit die Seite bei einer Farbsehschwäche verständlich bleibt.</p>",
      "readme.colorsComment": "/* Dark+, das Standarddesign von VS Code */",
      "readme.statusBarComment": "/* statusBar, gedämpft */",
      "readme.h.graphics": "Grafische Elemente",
      "readme.graphics": "<p>Es gibt bewusst keine Schmuckbilder und keine Symbolfotos. Jedes grafische Element hat eine Aufgabe:</p>",
      "readme.graphicsTable": "<tr><th>Element</th><th>Warum es da ist</th></tr><tr><td>Technologie-Icons</td><td>Originallogos der jeweiligen Technologie. Ein Stack ist damit auf einen Blick erfassbar, ohne jede Zeile zu lesen.</td></tr><tr><td>Tableiste &amp; Explorer</td><td>Tragen die Editor-Metapher und sind gleichzeitig die Navigation. Zwei Wege zum selben Ziel.</td></tr><tr><td>Zeilennummern</td><td>Verstärken die Metapher und zeigen nebenbei, wie lang ein Abschnitt ist. Auf schmalen Bildschirmen ausgeblendet, weil dort der Platz wichtiger ist.</td></tr><tr><td>Farbige Syntax</td><td>Die Codeblöcke sind echt eingefärbt statt als Bild eingebunden. Dadurch bleiben sie markierbar, durchsuchbar und für Screenreader lesbar.</td></tr><tr><td>Ladebildschirm</td><td>Führt die Editor-Metapher ein, bevor der Inhalt erscheint. Überspringbar und läuft nur einmal pro Besuch.</td></tr>",
      "readme.h.a11y": "Bedienung und Barrierefreiheit",
      "readme.a11y": "<p>Die ganze Seite lässt sich ohne Maus bedienen. In der Tableiste wechseln die Pfeiltasten zwischen den Dateien, <code>Pos1</code> und <code>Ende</code> springen an den Rand, <code>Entf</code> schliesst einen Tab. Jedes bedienbare Element hat einen sichtbaren Fokusrahmen, und ganz oben führt eine Sprungmarke direkt zum Inhalt.</p><p>Wer im Betriebssystem reduzierte Bewegung eingestellt hat, bekommt die Seite ohne Animationen und ohne Ladebildschirm. Jeder Abschnitt hat eine eigene Adresse: <code>#projekte</code> lässt sich zum Beispiel direkt verschicken.</p>",
      "readme.h.tech": "Technische Angaben",
      "readme.techTable": "<tr><th>Bereich</th><th>Umsetzung</th></tr><tr><td>Frontend</td><td>HTML, CSS und JavaScript von Hand, ohne Framework und ohne Build-Schritt. Was im Browser ankommt, ist genau das, was ich geschrieben habe.</td></tr><tr><td>Backend</td><td>Serverless Functions (Node.js) für Login und geschützte Inhalte</td></tr><tr><td>Passwortschutz</td><td>scrypt mit Salt, Vergleich in konstanter Zeit; Sitzung über ein signiertes Token mit vier Stunden Laufzeit</td></tr><tr><td>Abhängigkeiten</td><td>Keine. Weder Frontend noch Backend laden ein npm-Paket.</td></tr><tr><td>Hosting</td><td>Vercel</td></tr><tr><td>Versionsverwaltung</td><td><a href=\"https://github.com/Lro-rgb/PortfolioV1\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">github.com/Lro-rgb/PortfolioV1</a>, der komplette Quellcode dieser Seite ist öffentlich einsehbar</td></tr><tr><td>Browser</td><td>Getestet in Chrome, Edge und Firefox. Funktioniert in jedem aktuellen Browser; ältere bekommen dieselben Inhalte, nur ohne einzelne visuelle Effekte.</td></tr>",
      "readme.h.noFramework": "Warum ohne Framework",
      "readme.noFramework": "<p>Ein Framework hätte mir Arbeit abgenommen, und genau deshalb habe ich darauf verzichtet. Tabverwaltung, Tastatursteuerung, Fokusverwaltung und der Login-Ablauf sind Dinge, die ich verstehen will, statt sie einzubinden.</p>"
    },
    en: {
      "meta.title": "Luis Rosado · Application Development Apprentice (EFZ)",
      "meta.description": "Portfolio of Luis Rosado · Application Development Apprentice (EFZ), IMS at BWD Bern. Skills, projects, tech stack and contact.",
      "meta.twitterDescription": "Portfolio of Luis Rosado · Application Development Apprentice (EFZ), IMS at BWD Bern.",

      "chrome.skipLink": "Skip to content",
      "splash.ariaLabel": "Page is loading",
      "splash.init": "Initializing...",
      "splash.skip": "Skip ↵",
      "splash.loadingExtensions": "Loading extensions...",
      "splash.ready": "Ready.",
      "splash.readyLabel": "Ready",
      "splash.opening": "Opening ",

      "login.close": "Close dialog",
      "login.title": "authentication.js · Access required",
      "login.comment": "// This file is password protected.<br>// Authorized personnel only.",
      "login.label": "const password =",
      "login.showPw": "Show password",
      "login.hidePw": "Hide password",
      "login.enter": "ENTER ↵",
      "login.checking": "Checking...",
      "login.error": "Incorrect password.",
      "login.connectionError": "Connection error.",
      "login.cancel": "Cancel (ESC)",

      "menu.goto": "Go to",
      "menu.terminal": "Terminal",
      "menu.theme": "Theme",
      "chrome.searchPlaceholder": "Search files and commands",
      "chrome.notLoggedIn": "🔒 Not logged in",
      "chrome.loggedIn": "🔓 Logged in",
      "chrome.guest": "🔒 Guest",
      "chrome.authed": "🔓 Signed in",

      "chrome.activityBar": "Activity bar",
      "chrome.explorerShortcut": "Explorer (Ctrl+Shift+E)",
      "chrome.explorerToggle": "Toggle explorer",
      "chrome.explorerOpen": "Open explorer",
      "chrome.explorerClose": "Close explorer",
      "chrome.searchShortcut": "Search (Ctrl+P)",
      "chrome.search": "Search",
      "nav.projects": "Projects",
      "chrome.terminalShortcut": "Terminal (Ctrl+`)",
      "chrome.documentsLocked": "Documents (password protected)",
      "chrome.protectedDocuments": "Protected documents",
      "chrome.switchTheme": "Switch color theme",

      "chrome.files": "Files",
      "tabbar.close.home": "Close luis.json",
      "tabbar.close.skills": "Close skills.py",
      "tabbar.close.techstack": "Close techstack.ts",
      "tabbar.close.projekte": "Close projects.html",
      "tabbar.close.interessen": "Close interests.json",
      "tabbar.close.kontakt": "Close contact.sql",
      "tabbar.close.readme": "Close README.md",

      "file.projekte": "projects.html",
      "file.interessen": "interests.json",
      "file.kontakt": "contact.sql",
      "file.noten": "grades.csv",
      "file.lebenslauf": "resume.md",
      "folder.unterlagen": "documents",
      "cmt.skills": "# skills.py · Technical Skills",
      "cmt.techstack": "// techstack.ts · Technologies &amp; Tools",
      "cmt.projekte": "&lt;!-- projects.html --&gt;",
      "cmt.interessen": "// interests.json",
      "cmt.kontakt": "-- contact.sql",
      "cmt.readme": "# README.md · How this site is built",
      "cmt.noten": "# grades.csv",
      "cmt.lebenslauf": "# resume.md",

      "chrome.fileExplorer": "File explorer",
      "chrome.noFileOpen": "No file open.",
      "chrome.reopenAll": "Reopen all files",
      "chrome.closePanel": "Close panel",
      "chrome.sourceOnGithub": "Source code on GitHub",
      "chrome.toggleTerminal": "Toggle terminal",
      "chrome.noProblems": "No known problems",
      "chrome.problemsCount": "0 errors, 0 warnings",

      "noten.preview": "Preview",
      "noten.previewTitle": "Certificate of competence, module",
      "noten.openTab": "Open in new tab",
      "noten.close": "Close",
      "noten.fileError": "The certificate could not be loaded. Please sign in again and retry.",

      "outline.navLabel": "Outline of this section",
      "chrome.detailed": "Details",
      "kontakt.copied": "Copied",
      "kontakt.copyFailed": "Copy failed",

      "cv.generatingPdf": "Generating PDF…",
      "cv.pdfError": "Could not create the PDF. Please check your internet connection.",

      "media.videoFallback": "Your browser can't play this video.",
      "media.play": "Play",
      "media.pause": "Pause",
      "media.playRecording": "Play recording",
      "media.pauseRecording": "Pause recording",
      "media.seekLabel": "Position in the recording",
      "media.fullscreen": "Fullscreen",
      "media.exitLargeView": "Exit large view",
      "media.largeView": "Large view",
      "media.openPage": "Open page",
      "media.enlargeScreenshot": "Enlarge screenshot: ",
      "media.enlargeImage": "Enlarge image: ",
      "media.imageFallback": "Image ",
      "media.imageComing": "Image coming soon",
      "media.videoComing": "Video coming soon",
      "media.scrollLeft": "Scroll left",
      "media.scrollRight": "Scroll right",
      "media.imagesSuffix": " images",
      "media.prevScreenshot": "Previous screenshot",
      "media.nextScreenshot": "Next screenshot",
      "media.gotoScreenshot": "Go to screenshot ",

      "statsfm.lastWeeks": "Last four weeks · stats.fm",
      "statsfm.tracks": "Tracks",
      "statsfm.artists": "Artists",
      "statsfm.fullProfile": "Full profile on stats.fm",

      "palette.ariaLabel": "Go to file or command",
      "palette.placeholder": "Type a file name, or > for commands",
      "palette.results": "Results",
      "palette.group.files": "Files",
      "palette.group.commands": "Commands",
      "palette.noResults": "No matches.",
      "palette.hint.locked": "password protected",
      "palette.hint.active": "active",
      "palette.cmd.theme": "Theme: next color theme",
      "palette.cmd.terminal": "View: toggle terminal",
      "palette.cmd.explorer": "View: toggle explorer",
      "palette.cmd.reopen": "View: reopen all files",
      "palette.cmd.print": "File: print page or save as PDF",
      "palette.cmd.printHint": "Ctrl+P in the browser",
      "palette.hint.themeCycle": "Ctrl+K Ctrl+T",
      "palette.hint.terminal": "Ctrl+`",
      "palette.hint.explorer": "Ctrl+Shift+E",
      "palette.cmd.mail": "Contact: send email",
      "palette.cmd.github": "Contact: open GitHub profile",
      "palette.cmd.logout": "Account: log out",
      "palette.cmd.themePrefix": "Theme: ",

      "theme.name.dark-plus": "Dark+ (Default)",
      "theme.name.github-dark": "GitHub Dark",
      "theme.name.dracula": "Dracula",
      "theme.name.one-dark": "One Dark Pro",
      "theme.name.nord": "Nord",
      "theme.name.light-plus": "Light+ (Light)",

      "status.readPrefix": "Read ",
      "status.readSuffix": "%",

      "terminal.inputLabel": "Terminal input",
      "terminal.intro": "Portfolio shell. <code>help</code> shows all commands.",
      "term.help.intro": "Available commands:",
      "term.help.body": "  <b>ls</b>            List files<br>  <b>open</b> &lt;file&gt;  Open a file (e.g. <code>open projekte</code>)<br>  <b>projects</b>      List projects briefly<br>  <b>whoami</b>        Short introduction<br>  <b>contact</b>       Contact details<br>  <b>design</b> [name] Show or switch color theme<br>  <b>clear</b>         Clear the terminal<br>  <b>exit</b>          Close the terminal",
      "term.openNeedsArg": "Please provide a file name — <code>ls</code> shows all of them.",
      "term.fileNotFound": "File not found: ",
      "term.opening": "Opening ",
      "term.projectsLoading": "Projects are still loading — <code>open projekte</code>.",
      "term.whoami": "Luis Rosado — Application Development Apprentice (EFZ)<br>IMS at BWD Bern, 3rd year of apprenticeship, Burgdorf BE<br>Status: looking for an internship",
      "term.contact": "Email:  <code>luisrosado008@gmail.com</code><br>GitHub:  <code>github.com/Lro-rgb</code><br>Write to me: <code>open kontakt</code>",
      "term.design.current": "Current: ",
      "term.design.available": "Available: ",
      "term.design.switchHint": "Switch with <code>design dracula</code> — or without a name using the circle in the bottom left.",
      "term.design.changed": "Theme switched: ",
      "term.design.unknown": "Unknown theme: ",
      "term.unknownCommand": "Unknown command: ",
      "term.unknownCommandSuffix": " — <code>help</code> shows all of them.",

      "lightbox.ariaLabel": "Screenshot in full view",
      "lightbox.prev": "Previous image",
      "lightbox.next": "Next image",
      "lightbox.close": "Close full view",

      "home.role": "Application Development Apprentice (EFZ)&nbsp;<span class=\"blink\" aria-hidden=\"true\"></span>",
      "home.intro": "<p>I attend the IMS at BWD Bern and am in my third year working toward a federal VET diploma (EFZ) in application development.</p><p>When something interests me, I usually build my own version of it until I understand why it works. Most of the projects on this site started that way.</p><p>Right now I'm looking for an internship where I can work on a team building applications that real people actually use.</p>",
      "home.cta.mail": "Send email",
      "home.cta.github": "View GitHub",
      "home.cta.projects": "View projects",
      "home.fact.location": "Location",
      "home.fact.school": "School",
      "home.fact.status": "Status",
      "home.fact.statusValue": "3rd year of apprenticeship",
      "home.fact.focus": "Focus",
      "home.fact.focusValue": "Web and backend",
      "home.fact.likes": "Enjoys working with",
      "home.fact.reachable": "Reach me at",

      "readme.facts": "<div class=\"fact\"><dt>Structure</dt><dd>code editor as the interface</dd></div><div class=\"fact\"><dt>Technology</dt><dd>hand-written HTML, CSS, JavaScript</dd></div><div class=\"fact\"><dt>Dependencies</dt><dd>none</dd></div><div class=\"fact\"><dt>Colour themes</dt><dd>six, switchable</dd></div><div class=\"fact\"><dt>Languages</dt><dd>German and English</dd></div><div class=\"fact\"><dt>Operation</dt><dd>fully keyboard-driven</dd></div>",
      "readme.colorChips": "<li><span class=\"farbfeld\" style=\"background:#1e1e1e\" aria-hidden=\"true\"></span>Editor <code>#1e1e1e</code></li><li><span class=\"farbfeld\" style=\"background:#252526\" aria-hidden=\"true\"></span>Side bar <code>#252526</code></li><li><span class=\"farbfeld\" style=\"background:#333333\" aria-hidden=\"true\"></span>Activity bar <code>#333333</code></li><li><span class=\"farbfeld\" style=\"background:#2d5876\" aria-hidden=\"true\"></span>Status bar <code>#2d5876</code></li><li><span class=\"farbfeld\" style=\"background:#4FA3E3\" aria-hidden=\"true\"></span>Accent <code>#4FA3E3</code></li>",

      "projekte.filter.label": "Filter projects by kind",
      "projekte.filter.all": "All",
      "projekte.filter.school": "School",
      "projekte.filter.personal": "Personal",
      "projekte.filter.count": "projects",
      "projekte.filter.countOne": "project",

      "home.credits.title": "Credits",
      "home.credits": "<p class=\"quellen-intro\">What on this page isn't mine:</p><dl class=\"quellen-liste\"><div class=\"q-e\"><dt>Visual Studio Code</dt><dd>Microsoft. The interface is a rebuild of the editor, as are the Dark+ and Light+ colour themes.</dd></div><div class=\"q-e\"><dt><a href=\"https://devicon.dev\" target=\"_blank\" rel=\"noopener noreferrer\">Devicon 2.16.0</a></dt><dd>The technology logos in skills, tech stack, explorer and tab bar. MIT licence.</dd></div><div class=\"q-e\"><dt>JetBrains Mono</dt><dd>The typeface for code and labels. JetBrains, SIL Open Font License.</dd></div><div class=\"q-e\"><dt>Inter</dt><dd>The typeface for body text. Rasmus Andersson, SIL Open Font License.</dd></div><div class=\"q-e\"><dt>jsPDF 2.5.1</dt><dd>Builds the CV as a PDF, fetched only on click. MIT licence.</dd></div><div class=\"q-e\"><dt><a href=\"https://stats.fm\" target=\"_blank\" rel=\"noopener noreferrer\">stats.fm</a></dt><dd>My listening data in the interests section. Cover art comes from Spotify and Apple Music.</dd></div><div class=\"q-e\"><dt>Further colour themes</dt><dd>Dracula (Zeno Rocha), Nord (Sven Greb), One Dark (Atom) and GitHub Dark — all MIT licence.</dd></div></dl><p class=\"quellen-fuss\">Text, structure, CSS, JavaScript, the server functions and the project images are mine. The image sources for my first website are listed <a href=\"erste-website/quellen.html\" target=\"_blank\" rel=\"noopener noreferrer\">on its own page</a>.</p>",

      "skills.intro": "<p>Next to each technology is the project where I used it. What exactly I built is described over in the projects section.</p>",
      "skills.legend.proj": "used in a project",
      "skills.legend.base": "fundamentals from class",
      "skills.legend.new": "currently learning",
      "skills.vh.proj": " — used in a project",
      "skills.vh.base": " — fundamentals from class",
      "skills.chip.rezeptbuch": "My Recipe Book",
      "skills.h.backend": "Backend &amp; Data",
      "skills.chip.webshop": "Redis Webshop",
      "skills.chip.urlshortener": "URL Shortener",
      "skills.chip.class": "Coursework",
      "skills.h.ops": "Operations &amp; Tools",
      "skills.chip.allProjects": "all projects",
      "skills.name.ci": "CI pipeline",
      "skills.name.azure": "Azure / Operations",
      "skills.chip.devopsModule": "DevOps module",
      "skills.name.network": "Networks / TCP-IP",
      "skills.next": "Next up: REST APIs from scratch, modeled on this site's two endpoints.",

      "techstack.cat.programming": "Programming",
      "techstack.cat.database": "Database",
      "techstack.cat.deploy": "Deployment",
      "techstack.cat.ops": "Operations",
      "techstack.cat.vcs": "Version control",
      "techstack.cat.collab": "Collaboration",
      "techstack.cat.school": "School",
      "techstack.cat.mainsystem": "Main system",
      "techstack.cat.devsetup": "Dev setup",
      "techstack.cat.terminal": "Terminal / Scripts",
      "techstack.setup": "<p>For school I use a Lenovo ThinkPad set up as dual-boot: Windows 11 for everyday use, Arch Linux for coding. Development happens in VS Code, versioned through GitLab. At home I also have a Windows desktop PC.</p>",

      "projekte.title": "Projects",
      "projekte.intro": "<p>Every project starts with an abstract — a two-to-three-sentence summary. Below that are the details, the stack used, and, where available, source code and a demo.</p>",
      "projekte.h.personal": "Personal Projects",
      "projekte.h.school": "School Projects",

      "proj.portfolio.type": "// Personal · solo · ongoing",
      "proj.portfolio.abstract": "<strong>Abstract</strong>This site right here. The interface mimics a code editor, with tabs, an explorer, a terminal and a command palette. Skills and projects are public; grades and CV sit behind a password. Everything is hand-written, with no framework and not a single external dependency.",
      "proj.portfolio.body": "Under the hood there's tab management with full keyboard control, an explorer that turns into a drawer on mobile, six color themes and a dedicated print stylesheet. Login goes through a serverless function that checks the password against a salted scrypt hash and returns a token valid for four hours. Grades and CV live on the server and never ship in the delivered HTML. Anyone who opens the page source finds nothing there.",
      "proj.portfolio.meta": "<div><dt>My role</dt><dd>Built solo: concept, design, frontend and backend</dd></div><div><dt>Notable</dt><dd>No framework, no npm dependencies. What ships to the browser is what I wrote.</dd></div>",
      "proj.portfolio.links": "<a href=\"https://github.com/Lro-rgb/PortfolioV1\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">🐙 Source code on GitHub</a>",

      "proj.wallpaper.type": "// Personal · solo · custom script",
      "proj.wallpaper.title": "Wallpaper Switcher with Automatic Color Scheme",
      "proj.wallpaper.abstract": "<strong>Abstract</strong>A Bash script that computes a color scheme from my wallpaper and applies it across the whole system. Changing the wallpaper automatically recolors window borders, bar, menu and terminal, without me touching a single config file.",
      "proj.wallpaper.body": "The script chains four tools: <code>waypaper</code> sets the image, <code>matugen</code> derives the color palette from it, <code>rofi</code> is the selection menu and <code>waybar</code> the status bar. It then rewrites the config files of the programs involved and restarts them in a controlled way. The tricky part wasn't the colors but the order: if a program reloads too early, it still reads the old palette.",
      "proj.wallpaper.meta": "<div><dt>My role</dt><dd>Written solo</dd></div><div><dt>What I learned</dt><dd>Bash, chaining command-line tools, config files and processes on Linux</dd></div>",
      "proj.wallpaper.links": "<a href=\"https://github.com/Lro-rgb/wallsync\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">🐙 Source code on GitHub</a>",

      "proj.arch.type": "// Personal · solo",
      "proj.arch.abstract": "<strong>Abstract</strong>A self-configured dual-boot system on my ThinkPad: Windows 11 for everyday use, Arch Linux with the Hyprland window manager for coding. Set up because I wanted to know how a Linux system is put together under the hood.",
      "proj.arch.body": "Installed Arch via <code>archinstall</code> and configured Hyprland from scratch. Hyprland has no ready-made interface: every keybind and window behavior lives in a config file. Alongside it: Alacritty as the terminal, the Fish shell, <code>waybar</code> as the status bar, <code>fuzzel</code> as the app launcher and Nautilus as the file manager. The logout menu isn't a ready-made program but a <code>rofi</code> script invoked from the bar. This setup is also where the wallpaper switcher came from, which now has its own repository.",
      "proj.arch.meta": "<div><dt>My role</dt><dd>Built solo</dd></div><div><dt>What I learned</dt><dd>Partitioning and bootloaders, configuration management, troubleshooting without a graphical interface</dd></div>",
      "proj.arch.links": "<a href=\"https://github.com/Lro-rgb/arch-hyprland-rice\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">🐙 Configuration on GitHub</a>",

      "proj.modding.type": "// Personal · solo",
      "proj.modding.title": "Console Modding: Switch &amp; 3DS",
      "proj.modding.abstract": "<strong>Abstract</strong>Set up custom firmware on my own Nintendo Switch and my 3DS. I was interested in how a boot process works and at which point a system checks its signatures.",
      "proj.modding.body": "On the Switch, I loaded the Hekate payload via an RCM jig in recovery mode and set up an EmuMMC — a separate system copy so the original system stays untouched. That only worked because the firmware hadn't been patched yet. The 3DS runs Luma3DS. Both devices are mine, and this was about the boot chain, not about content.",
      "proj.modding.meta": "<div><dt>My role</dt><dd>Done solo</dd></div><div><dt>What I learned</dt><dd>Boot process, recovery modes, signature verification, and working with English-language technical documentation</dd></div>",

      "proj.urlshortener.type": "// School project · Module 210 · solo",
      "proj.urlshortener.title": "URL Shortener with a GitOps Pipeline",
      "proj.urlshortener.abstract": "<strong>Abstract</strong>A URL shortener made of two NestJS services and a MariaDB — one that doesn't just run, but ships: containerized, built through a CI pipeline, and deployed automatically into a Kubernetes cluster by ArgoCD. The interesting part wasn't shortening links so much as the path from commit to running cluster.",
      "proj.urlshortener.body": "<strong>The application.</strong> <code>shorty</code> accepts long URLs, returns a short code, and redirects with a 302 on lookup. <code>keeper</code> is the only service that sees the database, and it's protected by an API key. Only <code>shorty</code> is reachable from outside, through the ingress; <code>keeper</code> sits behind it as a ClusterIP. So an attacker coming from outside has no direct path to the database.<br><br><strong>The path into the cluster.</strong> Both services run in containers, built via a GitLab pipeline. The Kubernetes manifests deliberately live in a <em>second</em> repo: application code and desired cluster state are kept separate. ArgoCD watches this GitOps repo and reconciles the cluster automatically. A deployment is therefore a commit, not a manual <code>kubectl</code> command. Anyone who wants to change the state has to go through Git, where every change is traceable.<br><br>On top of that came written work I hadn't done anywhere else: a role concept with IAM and RBAC, a security concept, and a cost analysis for running it on AWS. All three were theoretical, but they were the first time I really thought about what running an application actually costs and who gets access to what.",
      "proj.urlshortener.meta": "<div><dt>My role</dt><dd>Built solo. The course provided an empty skeleton with the first six commits; everything from containerization onward is mine: 17 of the 23 commits.</dd></div><div><dt>What I learned</dt><dd><ul class=\"proj-ul\"><li>Why you separate application code from deployment state</li><li>That containers are a security concern, not just a delivery mechanism — for instance, not running as root</li><li>How to split a service so only one is exposed to the outside</li><li>That a deployment has to be reproducible, or it's down to luck</li></ul></dd></div>",
      "proj.urlshortener.links": "<a href=\"https://github.com/Lro-rgb/url-shortener\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">🐙 Application</a><a href=\"https://github.com/Lro-rgb/url-shortener-gitops\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">🐙 GitOps repo</a>",

      "proj.askel.type": "// School project · Module 335 · team of three",
      "proj.askel.abstract": "<strong>Abstract</strong>Askel is Finnish for “step” and is a mobile app that records a trip via GPS: position, elevation and speed. Routes can be saved, named, color-coded and shown on a map. All data stays on the device — there's no backend.",
      "proj.askel.body": "Built with React Native and Expo. Location data comes through <code>expo-location</code>, recording keeps running throughout the trip, and routes are stored locally. Having no backend was a deliberate choice: movement data is sensitive, and what never leaves the device can't leak.",
      "proj.askel.meta": "<div><dt>My role</dt><dd>Co-developer on a team of three. Among other things, I built:</dd></div><div><dt>Implemented</dt><dd><ul class=\"proj-ul\"><li>Persistent on-device storage of recorded routes</li><li>GPS recording with distance calculation (<code>lib/distance.ts</code>)</li><li>The app's settings area, including formatting of measurement values</li><li>Color selection when saving a route</li><li>A button to center the map on the user's own position</li><li>Automated tests for distance calculation, formatting and storage</li></ul></dd></div>",
      "proj.askel.links": "<a href=\"https://github.com/Lro-rgb/Askel\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">🐙 Source code on GitHub</a>",

      "proj.rezeptbuch.type": "// School project · Module 322 · solo",
      "proj.rezeptbuch.title": "My Recipe Book",
      "proj.rezeptbuch.abstract": "<strong>Abstract</strong>An Android app for managing recipes, written in C# with .NET MAUI. Four areas via a tab bar: the collection with search and a vegetarian filter, an entry form with validation, an FAQ page and an info page. A Module 322 assignment for a fictional client, built solo from the UI down to the logic.",
      "proj.rezeptbuch.body": "<strong>Structure.</strong> The app follows MVVM — the separation of UI and logic. The views are XAML files and contain no logic; state lives in the ViewModels, and a <code>RezeptService</code> singleton holds the recipes. A <code>BaseViewModel</code> with <code>SetProperty</code> and <code>INotifyPropertyChanged</code> makes sure the UI picks up every change on its own: I set a property in code, and the field on screen updates itself without me touching it. That was the point where data binding first made sense to me.<br><br><strong>Validation.</strong> Title and description are required fields, checked as you type rather than only on save. The title needs at least three characters, the description ten; the message sits right next to the field instead of in a dialog that only appears after submitting. Navigation runs through the Shell with named routes; a card's detail view is opened as <code>RezeptDetailPage?RezeptId=…</code>.<br><br><strong>What it can't do.</strong> Recipes only live in memory. Close the app and any you added are gone again, leaving just the four sample recipes. There are no images either, only placeholders. Neither was required by the brief — it was about UI and data binding — but it's the first thing I'd tackle next: hang a SQLite file behind the same <code>RezeptService</code> so the rest of the app stays unchanged.",
      "proj.rezeptbuch.meta": "<div><dt>My role</dt><dd>Built solo: UI, ViewModels and data handling</dd></div><div><dt>What I learned</dt><dd><ul class=\"proj-ul\"><li>C# in a real project instead of exercises</li><li>MVVM: why the UI shouldn't know anything about data storage</li><li>Data binding with <code>INotifyPropertyChanged</code> instead of updating fields by hand</li><li>Building UIs in XAML and styling them centrally</li><li>Validating input as it's typed, not only on submit</li></ul></dd></div>",
      "proj.rezeptbuch.links": "<a href=\"https://github.com/Lro-rgb/MeinRezeptbuch\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">🐙 Source code on GitHub</a>",

      "proj.kobui.type": "// School project · inter-company course (ÜK) · team of three",
      "proj.kobui.abstract": "<strong>Abstract</strong>Kobui is a web app that connects a locally running language model (KoboldCpp) to a custom React frontend. Designed as a privacy-friendly alternative to cloud services: because the model runs on your own machine, no input ever leaves the device.",
      "proj.kobui.body": "Frontend built with TypeScript, React and Vite, styled with CSS Modules. The app talks to KoboldCpp's local interface and ships its own setup guide so it can be installed without prior knowledge.",
      "proj.kobui.meta": "<div><dt>My role</dt><dd>Organization and design within a team of three. I distributed tasks, kept an eye on the schedule, and stepped in wherever things got tight near the end.</dd></div><div><dt>Contributed</dt><dd>Installation guide for the local backend, added support for alternative models, and fixes to the UI</dd></div><div><dt>What I learned</dt><dd>How much coordination a three-person team needs — and that a realistic schedule is worth more than an ambitious one.</dd></div>",
      "proj.kobui.links": "<a href=\"https://github.com/kiraa1q/kobui\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">🐙 Source code on GitHub</a>",

      "proj.webshop.type": "// School project · grown across three modules · ongoing",
      "proj.webshop.abstract": "<strong>Abstract</strong>A webshop that keeps its data not in a relational database but entirely in Redis. It started out in the NoSQL module as a pretty bare skeleton. Since then it's been my practice project: in every following module where it fit, I extended it with whatever was on the syllabus.",
      "proj.webshop.body": "<strong>NoSQL module: the data model.</strong> Every record lives as a hash under a descriptive key, e.g. <code>product:12</code>, <code>user:3</code>, <code>cart:3</code>. Redis has no <code>WHERE</code>, so every kind of search needs its own index. Categories live as sets under <code>idx:kategorie:*</code> and hold the product IDs. That was exactly the learning moment: in SQL it would have been a single query; here I have to maintain the index by hand on every write. Forget it in one place and search never finds that product again.<br><br><strong>Docker module: shipping it.</strong> Since then, the application and database start together via Docker Compose, so the shop runs on someone else's machine without setup. From the same period comes a small detail I'm still happy about: the connection finds its own port. If no environment variable is set, it tries 6379 and then 6380. Redis ran on a different port at school than at home, and instead of editing the config every time, the program now just figures it out itself.<br><br><strong>DevOps and Azure module: operations.</strong> Most recently it was about not just running the application locally, but operating it on a server and keeping an eye on it.<br><br>Today the shop can: log in with roles for admins and customers, create/edit/delete products, maintain a cart per user, and run scripts that seed it all with test data.",
      "proj.webshop.meta": "<div><dt>My role</dt><dd>Own repository, built and evolved by me across modules</dd></div><div><dt>Why the same project every time</dt><dd>Learning a new topic on code you already know shows the difference more clearly than a fresh sample project. As a bonus, the history shows how the same shop changed over a year.</dd></div><div><dt>What I learned</dt><dd><ul class=\"proj-ul\"><li>Data modeling without tables: the key is the structure</li><li>Why a key-value store is fast, and what you give up for it</li><li>Maintaining indexes yourself instead of getting them from the database</li><li>Starting and shipping multiple services together</li><li>That an application running on a server raises different questions than one that only runs locally</li></ul></dd></div>",
      "proj.webshop.links": "<a href=\"https://github.com/Lro-rgb/redis-webshop\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">🐙 Source code on GitHub</a>",

      "proj.erstewebsite.type": "// School project · 1st year of apprenticeship · solo · my first project",
      "proj.erstewebsite.title": "My First Website",
      "proj.erstewebsite.abstract": "<strong>Abstract</strong>An info page about me with five subpages: home, about me, free time, education and contact. Plain HTML and CSS, no JavaScript, hand-written and uploaded to the class server via FTP. This was my very first website, back in my first year of the apprenticeship.",
      "proj.erstewebsite.body": "Content-wise it was about me; technically it was about the basics: shared navigation on every page, a consistent layout, embedded images, and a sources page for anything that wasn't mine. The site still sits unchanged on the school server; a copy of it lives here as a subpage so it stays reachable if the school server eventually doesn't.<br><br>I show it deliberately in its original state. The spelling is off in places, every subpage repeats the same navigation as a copy, and there's no mobile layout. That's exactly where I see the distance to what I build today: the portfolio you're looking at right now is the same undertaking — a page about me — just a year later.",
      "proj.erstewebsite.meta": "<div><dt>My role</dt><dd>Built solo: content, layout and implementation</dd></div><div><dt>What I learned</dt><dd><ul class=\"proj-ul\"><li>Basic HTML structure, linking between multiple pages, and embedding images</li><li>Extracting CSS instead of styling every page individually</li><li>Uploading files to a web server via FTP</li><li>That citing sources matters, even for images</li></ul></dd></div><div><dt>What I'd do differently today</dt><dd>Not copy navigation into every file, think about mobile layout from the start, and proofread the text before publishing</dd></div>",
      "proj.erstewebsite.links": "<a href=\"erste-website\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">🌐 View copy here</a><a href=\"http://datastaff.com.br/rosado/\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">🏫 Original on the school server</a>",

      "interessen.title": "Interests",
      "interessen.intro": "<p>What I do outside of school.</p>",
      "interessen.h.hardware": "Hardware and Softmods",
      "interessen.hardware": "<p>I built my own PC and put custom firmware on two consoles.</p>",
      "interessen.gaming": "<p>I've played over a hundred games. When I like one, I take it to 100 percent: every trophy, every side quest, every collectible. I've spent the most time in Persona 3 FES, Palworld and Elden Ring.</p>",
      "interessen.h.music": "Music",
      "interessen.music": "<p>I listen to music all day and collect albums physically too. These are my favorites:</p>",
      "interessen.music2": "<p>Plus The Smiths, where I can't settle on a single album. What I actually listen to shows up in my listening stats:</p>",
      "interessen.statsfm.text": "My listening stats, straight from Spotify: most-played artists, albums and tracks",
      "interessen.h.reading": "Reading",
      "interessen.reading": "<p>I mostly read manga and collect series through to the final volume. I have figures for some of them too.</p>",
      "interessen.credits": "Image credits: game key art from Steam, album and manga covers from Apple's catalog and the Open Library. Rights belong to the respective studios, labels and publishers; the images serve here only as a reference to the work.",

      "kontakt.title": "Contact",
      "kontakt.intro": "<p>I'm looking for an internship in application development. If you have questions or need documents, write to me. I usually reply the same day.</p>",
      "kontakt.viewSource": "View source code",
      "kontakt.copyAddress": "Copy address",
      "kontakt.hint": "Burgdorf BE · also reachable through the school",
      "kontakt.h.access": "Access to the Protected Area",
      "kontakt.access": "<p>Grades and CV sit behind a password in the <code>unterlagen</code> folder. Access is given to the school administration, supervising teachers, and companies I'm applying to. If you need access and don't have it yet, a short email is enough.</p>",
      "kontakt.loginOpen": "Log in and open",
      "kontakt.legal": "Legal Notice",
      "kontakt.legalContent": "<div><dt>Responsible</dt><dd>Luis Rosado</dd></div><div><dt>Address</dt><dd><a href=\"https://www.google.com/maps/search/?api=1&amp;query=Pleerweg+13D%2C+3400+Burgdorf%2C+Schweiz\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"View on Google Maps\">Pleerweg 13D, 3400 Burgdorf, Switzerland</a></dd></div><div><dt>Email</dt><dd><a href=\"mailto:luisrosado008@gmail.com\">luisrosado008@gmail.com</a></dd></div><div><dt>Purpose</dt><dd>Personal portfolio and application website as part of my training at the IMS at BWD Bern. No commercial use.</dd></div><div><dt>Hosting</dt><dd>Vercel Inc.</dd></div><div><dt>Source code</dt><dd><a href=\"https://github.com/Lro-rgb/PortfolioV1\" target=\"_blank\" rel=\"noopener noreferrer\">github.com/Lro-rgb/PortfolioV1</a></dd></div><div><dt>Fonts</dt><dd>JetBrains Mono and Inter via Google Fonts (SIL Open Font License)</dd></div><div><dt>Image credits</dt><dd>Technology logos from <a href=\"https://devicon.dev\" target=\"_blank\" rel=\"noopener noreferrer\">Devicon</a> (MIT license). Game key art from Steam, album and manga covers from Apple's catalog and the Open Library — rights belong to the respective studios, labels and publishers. All other content is mine.</dd></div><div><dt>External data</dt><dd>The listening stats on the Interests page are loaded from <a href=\"https://stats.fm\" target=\"_blank\" rel=\"noopener noreferrer\">stats.fm</a> when the page opens. This lets stats.fm see your IP address. The address link goes to Google Maps — your data only reaches Google once you click it.</dd></div>",

      "readme.h.about": "About This Site",
      "readme.about": "<p>This site is my personal website as part of my IMS education, and at the same time part of my application materials. I built it by hand, with no site builder and no framework.</p><p>This page explains why it looks and works the way it does. Design decisions are either traceable or they're arbitrary; I want mine to be traceable.</p>",
      "readme.h.editor": "Why a Code Editor as the Interface",
      "readme.editor": "<p>This site targets companies that train application developers. So the interface itself is a work sample: it's modeled on a code editor, the environment I work in every day.</p><p>Every section is a file whose extension matches its content: <code>skills.py</code>, <code>techstack.ts</code>, <code>contact.sql</code>. That's not just for show: the extension tells you what a section is about before you even read it, and the explorer on the left shows the whole structure at a glance. If you'd rather navigate the usual way, use the tab bar up top; both lead to the same content.</p>",
      "readme.h.fonts": "Typography",
      "readme.fontsTable": "<tr><th>Font</th><th>Used for</th><th>Rationale</th></tr><tr><td>JetBrains&nbsp;Mono</td><td>Headings, tables, code blocks, navigation</td><td>Designed for code: fixed character width, clearly distinguishable 0/O and 1/l/I. Keeps table columns visually aligned.</td></tr><tr><td>Inter</td><td>Body text and descriptions</td><td>A monospace font gets tiring across multiple sentences. Inter is optimized for screens and stays legible even at small sizes.</td></tr>",
      "readme.fonts2": "<p>Two fonts with a clear division of labor: monospace for structure and data, Inter for language. The switch isn't a stylistic flourish — it signals what kind of information follows.</p>",
      "readme.h.colors": "Colors",
      "readme.colors": "<p>The colors come from real VS Code themes. A single accent color runs through the whole site: active tab, links, buttons, focus rings. Once you've mapped it once, you can find your way around anywhere.</p><p>Green, orange and red are reserved for meaning, not decoration: skill ratings, grade values, error messages. Color is never the only carrier of information — there's always accompanying text, so the site stays understandable for color-blind visitors.</p>",
      "readme.colorsComment": "/* Dark+, VS Code's default theme */",
      "readme.statusBarComment": "/* statusBar, muted */",
      "readme.h.graphics": "Graphic Elements",
      "readme.graphics": "<p>There are deliberately no decorative images and no stock photos. Every graphic element has a job:</p>",
      "readme.graphicsTable": "<tr><th>Element</th><th>Why it's there</th></tr><tr><td>Technology icons</td><td>Original logos of each technology. A stack becomes recognizable at a glance, without reading every line.</td></tr><tr><td>Tab bar &amp; explorer</td><td>Carry the editor metaphor while also serving as navigation. Two paths to the same destination.</td></tr><tr><td>Line numbers</td><td>Reinforce the metaphor and show, as a side effect, how long a section is. Hidden on narrow screens, where space matters more.</td></tr><tr><td>Colored syntax</td><td>The code blocks are genuinely colored rather than embedded as images. That keeps them selectable, searchable and readable by screen readers.</td></tr><tr><td>Loading screen</td><td>Introduces the editor metaphor before the content appears. Skippable, and runs only once per visit.</td></tr>",
      "readme.h.a11y": "Usability and Accessibility",
      "readme.a11y": "<p>The whole site can be operated without a mouse. In the tab bar, arrow keys move between files, <code>Home</code> and <code>End</code> jump to either edge, <code>Delete</code> closes a tab. Every operable element has a visible focus ring, and a skip link at the very top jumps straight to the content.</p><p>If you've set reduced motion at the OS level, you get the site without animations and without the loading screen. Every section has its own address: <code>#projekte</code>, for example, can be sent directly.</p>",
      "readme.h.tech": "Technical Details",
      "readme.techTable": "<tr><th>Area</th><th>Implementation</th></tr><tr><td>Frontend</td><td>Hand-written HTML, CSS and JavaScript, no framework and no build step. What reaches the browser is exactly what I wrote.</td></tr><tr><td>Backend</td><td>Serverless functions (Node.js) for login and protected content</td></tr><tr><td>Password protection</td><td>Salted scrypt, constant-time comparison; session via a signed token valid for four hours</td></tr><tr><td>Dependencies</td><td>None. Neither the frontend nor the backend load an npm package.</td></tr><tr><td>Hosting</td><td>Vercel</td></tr><tr><td>Version control</td><td><a href=\"https://github.com/Lro-rgb/PortfolioV1\" class=\"proj-link\" target=\"_blank\" rel=\"noopener noreferrer\">github.com/Lro-rgb/PortfolioV1</a>, the complete source code of this site is publicly viewable</td></tr><tr><td>Browser</td><td>Tested in Chrome, Edge and Firefox. Works in any current browser; older ones get the same content, just without some visual effects.</td></tr>",
      "readme.h.noFramework": "Why No Framework",
      "readme.noFramework": "<p>A framework would have taken work off my hands, and that's exactly why I skipped it. Tab management, keyboard control, focus management and the login flow are things I want to understand, not just plug in.</p>"
    }
  };

  window.I18N_TRANSLATIONS = translations;

  var ATTR_MAP = ["aria-label", "title", "placeholder", "alt", "content"];

  function getLang() {
    try {
      var l = localStorage.getItem("lang");
      if (l === "de" || l === "en") return l;
    } catch (e) { /* privater Modus */ }
    return "de";
  }

  function setStoredLang(l) {
    try { localStorage.setItem("lang", l); } catch (e) { /* privater Modus */ }
  }

  var currentLang = getLang();

  function t(key) {
    var dict = translations[currentLang] || translations.de;
    if (Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
    var de = translations.de;
    if (Object.prototype.hasOwnProperty.call(de, key)) return de[key];
    return "";
  }

  function applyLang() {
    var dict = translations[currentLang] || translations.de;
    document.documentElement.lang = currentLang;

    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var elNode = nodes[i];
      var key = elNode.getAttribute("data-i18n");
      if (Object.prototype.hasOwnProperty.call(dict, key)) {
        elNode.innerHTML = dict[key];
      }
    }

    ATTR_MAP.forEach(function (attr) {
      var els = document.querySelectorAll("[data-i18n-" + attr + "]");
      for (var j = 0; j < els.length; j++) {
        var e = els[j];
        var k = e.getAttribute("data-i18n-" + attr);
        if (Object.prototype.hasOwnProperty.call(dict, k)) {
          e.setAttribute(attr, dict[k]);
        }
      }
    });

    var btn = document.getElementById("langToggle");
    if (btn) btn.textContent = currentLang.toUpperCase();

    try {
      document.dispatchEvent(new CustomEvent("lr:langchange", { detail: { lang: currentLang } }));
    } catch (e) { /* sehr alter Browser ohne CustomEvent-Konstruktor */ }
  }

  function setLang(l) {
    if (l !== "de" && l !== "en") return;
    currentLang = l;
    setStoredLang(l);
    applyLang();
  }

  function toggleLang() {
    setLang(currentLang === "de" ? "en" : "de");
  }

  window.I18N = {
    t: t,
    lang: function () { return currentLang; },
    setLang: setLang,
    toggle: toggleLang,
    apply: applyLang,
    translations: translations
  };

  applyLang();
  var toggleBtn = document.getElementById("langToggle");
  if (toggleBtn) toggleBtn.addEventListener("click", toggleLang);
})();
