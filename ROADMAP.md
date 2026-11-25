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