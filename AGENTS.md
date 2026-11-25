# AGENTS.md - Regole di Esecuzione

1. **Ambito stretto:** Implementa SOLO la milestone richiesta nel prompt corrente. Non anticipare milestone successive.
2. **File inviolabili:** Non modificare `SPEC.md` o `ARCHITECTURE.md` senza esplicita autorizzazione.
3. **Niente codice monolitico:** Ogni modulo in `src/` e `config/` non deve superare le 180 righe (escluso `tests/test_runner.html`); se cresce, proponi uno split prima di scrivere.
4. **Verifica obbligatoria:** Prima di dichiarare completata una milestone, scrivi ed esegui almeno un test in `tests/` che dimostri la Definition of Done.