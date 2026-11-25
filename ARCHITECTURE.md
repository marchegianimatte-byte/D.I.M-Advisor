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
│   ├── wishlist_db.js  # Persistenza IndexedDB (d2_auditor_db) e cache in memoria wishlist
│   ├── wishlist_sync.js # Sync wishlist Aegis/Voltron (.txt) e Manifest Bungie IT
│   ├── weapons_ui.js   # Rendering tabella, filtri e badge della scheda Armi
│   ├── armor_eval.js   # Logica pura: calcolo punti sprecati e verifica bonus set
│   ├── armor_ui.js     # Rendering riepilogo, statistiche, set e tabella Build Armature
│   └── rules_ui.js     # Editor regole perk/statistiche, export JSON e ripristino default
└── tests/
    └── test_runner.html # Pagina di test unitari eseguiti direttamente nel browser
```

## Estensioni pianificate v1.1 (Milestone 4 e Milestone 5)
- `config/default_rules.js`: dizionario centralizzato `STAT_LABELS` per le 6 statistiche attuali (`health` -> `Salute`, `melee` -> `Corpo a corpo`, `grenade` -> `Granata`, `super` -> `Super`, `class` -> `Classe`, `weapons` -> `Armi`), target validi `0..200`, e campo `mode` (`"pve"` | `"pvp"`, fallback `"pve"`) sulle combinazioni perk armi.
- `src/app.js`: migrazione automatica di `d2_auditor_rules` in `localStorage` per scartare/migrare le vecchie chiavi (`mobility`, `resilience`, `recovery`, `discipline`, `intellect`, `strength`) verso le 6 chiavi attuali e mantenere retrocompatibilità su `mode`.
- `src/parser.js`: estensione del contratto armature con `rarity` (string, colonna `Rarity`), `baseStats` (colonne `"<Stat> (Base)"`) e `mods` (colonne `"Perks *"`), mantenendo per le armature solo i pezzi equipaggiati (`Equipped === "true"`); sulle armi salva `intrinsic` (string, da `Perks 0`, mantenendo `hash` sugli oggetti) e filtra i perk non funzionali (`"Livello "`, `"Conta-uccisioni"`, `"Kill Tracker"`, `"Tracciatore"`).
- `src/weapon_eval.js` / `src/weapons_ui.js`: filtro/selettore `mode` PvE vs PvP, raggruppamento delle armi per `Name normalizzato + Type` (mantenendo comunque il campo `hash` sugli oggetti) mostrando la copia migliore e contatore copie cliccabile per espandere una sottocartella/drawer con tutte le copie, i relativi perk (divisi in colonne `Attivi` / `Alternativi`) e giudizi.
- `src/armor_eval.js` / `src/armor_ui.js`: rimozione del contatore copie sotto i pezzi armatura, audit mod statistica (`+5`/`+10` oltre cap o fuori multiplo di 10) e toggle per commutare tra statistiche totali e `baseStats` (con o senza mod/Masterwork).

## Estensioni pianificate v1.2.0 (Milestone 6 e Milestone 7)
- `src/parser.js`: estensione schema Arma con `wishlistMatch` (`boolean`, colonna `"Wishlist"`) e `wishlistNote` (`string`, colonna `"Wishlist Note"`); estensione schema Armatura conservando tutti i pezzi di `destinyArmor.csv` (non solo `Equipped === "true"`) con `equipped` (`boolean`), `classType` (`string`, colonna `"Equippable"`), `baseTotal` (`number`) e `archetype` (`string`, ricavato dalle due statistiche base principali).
- `src/weapon_eval.js` / `src/rules_ui.js`: priorità `"TIENI (Wishlist DIM)"` quando `wishlistMatch === true` con fallback su regole custom; import/export regole custom anche da file `.json`/`.csv` o URL raw CORS-enabled con nomi perk testuali (esclusi `.txt` a hash numerici).
- `src/armor_eval.js` / `src/armor_ui.js`: calcolo build sui soli pezzi `equipped === true` del personaggio selezionato e confronto on-demand per ogni slot con i pezzi in deposito (`classType` e slot corrispondenti) ordinati per Set, Tier, Archetipo e riduzione punti sprecati.