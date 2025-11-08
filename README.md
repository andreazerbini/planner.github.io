# planner.github.io

Applicazione Kanban Covey in sola modalità browser. Apri `index.html` da file system oppure da un hosting statico: il loader sceglie automaticamente se utilizzare i moduli ES (quando servi i file via http/https) oppure il bundle compatto in `dist/app.js` per supportare il protocollo `file://` senza errori CORS.

### Aggiornare il bundle offline

Quando modifichi i sorgenti in `src/`, rigenera l'output classico eseguendo:

```bash
node scripts/build.js
```

Questo produce `dist/app.js`, già versionato, che viene caricato quando l'app gira da file system.
