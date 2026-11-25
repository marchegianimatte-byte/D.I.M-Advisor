# ARCHITECTURE

## Stack Tecnologico
- **Core:** HTML5, CSS3, Vanilla JavaScript standard (caricato con tag <script defer> e namespace globale window.App, vietato type="module").
- **Dipendenze esterne (solo CDN):** `PapaParse` (parsing CSV veloce nel browser).
- **Storage:** `localStorage` del browser per salvare l'ultimo CSV caricato e le regole JSON utente.
- **Vincolo:** Nessun backend, nessun database, nessun build step (`npm` vietato). Deve funzionare aprendo `index.html` o su GitHub Pages.

## Struttura Directory
```text
d2-auditor/
├── index.html          # Interfaccia unica a schede (Armi / Build Armature / Regole)
├── styles.css          # Layout compatto ad alta densità informativa (dark mode)
├── config/
│   └── default_rules.js # Pesi perk armi e soglie statistiche armature
├── src/
│   ├── app.js          # Gestione drag-and-drop CSV, eventi UI e localStorage
│   ├── parser.js       # Normalizzazione colonne CSV di DIM in oggetti puliti
│   ├── weapon_eval.js  # Logica pura: calcolo score perk e sinergie
│   └── armor_eval.js   # Logica pura: calcolo punti sprecati e verifica bonus set
└── tests/
    └── test_runner.html # Pagina di test unitari eseguiti direttamente nel browser