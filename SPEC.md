# ARCHITETTURA PROGETTO OTTIMIZZAZIONE DESTINY ITEM MANAGER

## Requisiti v1.1 (Milestone 4 e Milestone 5)

### Statistiche Armature e Regole (`config/default_rules.js`, `localStorage`)
- **6 Statistiche attuali:** Le build armature usano esclusivamente le 6 statistiche attuali (`health`, `melee`, `grenade`, `super`, `class`, `weapons`) già presenti in `src/parser.js` e `src/armor_ui.js`.
- **Dizionario centralizzato `STAT_LABELS`:** Definito in `config/default_rules.js` con etichette italiane (`Salute`, `Corpo a corpo`, `Granata`, `Super`, `Classe`, `Armi`) e input target validi da `0` a `200`.
- **Migrazione `d2_auditor_rules`:** Al caricamento da `localStorage`, eventuali vecchie chiavi statistiche obsolete (`mobility`, `resilience`, `recovery`, `discipline`, `intellect`, `strength`) vengono scartate/migrate automaticamente sulle 6 chiavi attuali.

### Armi PvE/PvP, Raggruppamento per Hash e Pulizia Perk
- **Modalità `mode` nelle regole armi:** Ogni regola/combo armi include `mode` (`"pve"` | `"pvp"`), con fallback automatico a `"pve"` se assente per retrocompatibilità con `d2_auditor_rules`.
- **Sottocartella duplicati per `hash`:** La scheda **Armi** raggruppa le copie con lo stesso `hash`, mostra la copia migliore e rende il contatore copie un elemento cliccabile che espande una sottocartella/drawer con tutte le copie, i relativi perk e giudizi.
- **Pulizia perk non funzionali:** Filtrare in `parser.js` / `weapons_ui.js` i perk non funzionali (es. tracciatori `"Conta-uccisioni"` e diciture `"Livello prodigioso:"`) per ridurre il rumore visivo nella tabella Armi.

### Armature Equipaggiate, `baseStats` e `mods`
- **Solo pezzi equipaggiati:** Per le **Armature** restano caricate solo quelle equipaggiate (`Equipped === "true"`), rimuovendo il contatore copie sotto i pezzi armatura.
- **Contratto `parser.js` per armature:** Gli oggetti armatura normalizzati includono `baseStats` (dalle colonne `"<Stat> (Base)"`) e `mods` (dalle colonne `"Perks *"`).
- **Audit mod e toggle statistiche base:** Visualizzazione delle mod su ogni pezzo con segnalazione degli sprechi delle mod statistica (`+5`/`+10` oltre cap o fuori multiplo di 10) e spunta per commutare i punteggi statistica con o senza mod/Masterwork.
