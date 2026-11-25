\# D2 Auditor (`v1.2.0`)



\*\*D2 Auditor\*\* è una web app \*\*100% locale e statica\*\* (HTML, CSS, JavaScript vanilla) per analizzare l'inventario di \*Destiny 2\* partendo dai file CSV esportati da \*\*Destiny Item Manager (DIM)\*\*.



Permette di individuare i god roll tra le armi nel deposito confrontandoli con le wishlist della community (\*\*Aegis\*\* e \*\*Voltron\*\*) e di ottimizzare le build armature confrontando i pezzi equipaggiati con le alternative presenti nel Vault, senza richiedere login Bungie né server esterni.



\---



\## ⚠️ Requisito fondamentale: Lingua Italiana



\* \*\*DIM deve essere impostato in Italiano\*\* prima di esportare i file CSV (`destinyWeapons.csv` e `destinyArmor.csv`).

\* Il parser delle armature (slot, statistiche base, archetipi) e il dizionario di traduzione dei perk scaricato dal Manifest pubblico di Bungie (`it`) sono cablati sulla localizzazione italiana. Esportazioni in inglese o altre lingue producono falsi negativi.



\---



\## ✨ Funzionalità principali



\### 1. Audit Armi \& Wishlist Native (Aegis + Voltron)

\* \*\*Raggruppamento duplicati:\*\* accorpa automaticamente tutte le copie della stessa arma (`Nome + Tipo`) per confrontare i perk a colpo d'occhio.

\* \*\*Sincronizzazione Wishlist `.txt`:\*\* scarica direttamente le liste ufficiali da GitHub (\*\*Aegis Endgame\*\*, \*\*Aegis Major Perks\*\* e \*\*Voltron\*\*), traduce gli hash numerici dei perk in italiano tramite le API pubbliche del Manifest di Bungie e salva la cache deduplicata in \*\*IndexedDB\*\* (superando il limite di 5 MB di `localStorage`).

\* \*\*Filtri combinati:\*\* filtra l'inventario per sorgente wishlist (`Aegis`, `Voltron`, `Tutte`), modalità (`PvE`, `PvP`), esito (`TIENI`, `ROLL PARZIALE`, `INFONDI/SCARTA`), tipo arma o ricerca testuale.

\* \*\*Regole personalizzate:\*\* nella scheda \*\*Regole\*\* puoi definire, importare ed esportare criteri custom per perk specifici.



\### 2. Audit Build Armature \& Confronto con il Deposito (Vault)

\* \*\*Analisi build attiva:\*\* valuta i 5 pezzi equipaggiati per classe (`Titano`, `Cacciatore`, `Stregone`), calcolando i punti statistica sprecati e lo stato dei bonus set (`2/4` e `4/4`).

\* \*\*Confronto diretto per slot (`Confronta (N)`):\*\* per ogni pezzo indossato, ispeziona tutte le armature compatibili nel deposito (filtrate tramite la colonna `Equippable`) e simula la sostituzione mostrando:

&#x20; \* Impatto sulla \*\*coerenza del set\*\* (`Mantiene 4/4`, `Completa 2/2`, ecc.)

&#x20; \* \*\*Grado (`Tier 1–5`)\*\* e \*\*Totale Statistiche Base\*\*

&#x20; \* \*\*Archetipo\*\* (le due statistiche base principali del pezzo)

&#x20; \* \*\*Delta punti sprecati\*\* rispetto alla configurazione attuale



\---



\## 🚀 Guida rapida all'uso



1\. \*\*Esporta i dati da DIM:\*\*

&#x20;  \* Apri \[Destiny Item Manager](https://app.destinyitemmanager.com/) (verifica che la lingua sia \*\*Italiano\*\*).

&#x20;  \* Vai su \*\*Impostazioni → Fogli di calcolo\*\* e scarica sia il CSV delle \*\*Armi\*\* (`destinyWeapons.csv`) sia quello delle \*\*Armature\*\* (`destinyArmor.csv`).

2\. \*\*Carica i CSV nell'Auditor:\*\*

&#x20;  \* Apri l'applicazione (da browser locale o link GitHub Pages / Cloudflare Pages) e trascina entrambi i file nella dropzone.

3\. \*\*Sincronizza le Wishlist:\*\*

&#x20;  \* Nella scheda \*\*Armi\*\*, clicca su \*\*`Sincronizza Wishlist (Aegis/Voltron)`\*\* e attendi qualche secondo il download delle liste e del Manifest italiano.

&#x20;  \* I dati restano salvati nel tuo browser (`localStorage` + `IndexedDB`) anche dopo aver ricaricato la pagina (`F5`).



\---



\## 💻 Avvio in locale e Hosting



L'applicazione non richiede build step, bundler o dipendenze npm:



\* \*\*Uso immediato:\*\* apri direttamente `index.html` con doppio clic in Chrome o Edge.

\* \*\*Server HTTP locale (consigliato per evitare eventuali restrizioni CORS su `file://`):\*\*

&#x20; ```bash

&#x20; python -m http.server 8080

