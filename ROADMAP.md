# ROADMAP

## Milestone 0: Drag & Drop e Parsing CSV [x]
- **Obiettivo:** Creare `index.html`, `src/app.js` e `src/parser.js` per trascinare `destinyWeapons.csv` e `destinyArmor.csv` nella pagina, salvarli in `localStorage` e mostrare il conteggio degli oggetti caricati.
- **Definition of Done (DoD):** Trascinando un CSV reale di DIM, la pagina mostra il numero esatto di armi/armature e, ricaricando con `F5`, i dati restano caricati senza doverli reinserire.

## Milestone 1: Audit Rapido Armi [x]
- **Obiettivo:** Implementare `src/weapon_eval.js` e `config/default_rules.js` per incrociare i perk di ogni arma con le combinazioni desiderate per archetipo.
- **DoD:** La scheda "Armi" mostra una tabella filtrabile con badge immediati (`TIENI`, `INFONDI/SCARTA`, `ROLL PARZIALE`) e evidenzia in verde i perk che attivano la sinergia.

## Milestone 2: Audit Coerenza Build Armature [x]
- **Obiettivo:** Implementare `src/armor_eval.js` per analizzare i pezzi equipaggiati (o raggruppati per set), calcolando i punti statistica sprecati oltre i multipli di 10 e verificando il raggiungimento dei bonus set (es. 2/4 pezzi).
- **DoD:** La scheda "Armature" segnala chiaramente il totale dei punti sprecati (es. "14 punti persi tra Resilienza e Forza") e indica quali pezzi sostituire.

## Milestone 3: Editor Regole Integrato [x]
- **Obiettivo:** Aggiungere una scheda "Regole" nell'interfaccia per modificare i perk ricercati e i target delle statistiche senza dover aprire il codice, salvando tutto in `localStorage` con pulsante di export JSON.
- **DoD:** Modificando un target statistica dalla UI, i badge nelle schede Armi e Armature si aggiornano istantaneamente.

## Milestone 4: Fix Statistiche/Target, Armi PvE/PvP e Sottocartella Duplicati [x]
- **Obiettivo:** Allineare chiavi ed etichette statistiche tramite `STAT_LABELS` (`health`, `melee`, `grenade`, `super`, `class`, `weapons`, range `0-200`) migrando `d2_auditor_rules`; aggiungere selettore/regole `mode` PvE vs PvP su **Armi** e **Regole** (con fallback `"pve"`); raggruppare le armi per `hash` mostrando la copia migliore con contatore cliccabile che espande la sottocartella/drawer di tutte le copie; rimuovere il contatore copie sotto le armature.
- **DoD:** La scheda **Regole** e **Build Armature** usano le 6 statistiche attuali (`0-200`) migrando eventuali vecchie chiavi; la scheda **Armi** filtra per modalità PvE/PvP e espande la sottocartella duplicati al click sul contatore copie; sotto le armature non compare alcun contatore copie.

## Milestone 5: Audit Mod Armature e Toggle Statistiche Base [x]
- **Obiettivo:** Parsare `baseStats` (`"<Stat> (Base)"`) e `mods` (`"Perks *"`) da `destinyArmor.csv` in `parser.js`; visualizzare le mod su ogni pezzo segnalando sprechi delle mod statistica (`+5`/`+10` oltre cap o fuori multiplo di 10) e aggiungere la spunta per commutare i punteggi statistica con o senza mod/Masterwork.
- **DoD:** La scheda **Build Armature** mostra le mod equipaggiate per pezzo, segnala gli sprechi delle mod statistica e aggiorna istantaneamente i totali e gli sprechi al cambio della spunta statistiche base/totali.