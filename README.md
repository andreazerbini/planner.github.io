# planner.github.io

Applicazione Kanban Covey in sola modalità browser. 
Apri `index.html` da file system oppure da un hosting statico.
Se aperto da file-system non sarà possibile integrarsi con le API-GOOGLE.

### Esempio di lancio locale completo

Per poter disporre delle funzionalità complete, è possibile o caricare online l'html, oppure  
avviare sulla cartella root del progetto `/`, un server http, ad esempio:

```bash
py -m http.server 5500
```

### Esempio di pubblicazione online gratuita
Github permette di pubblicare delle pagine statiche gratuitamente, nel seguente:
- Creare un repo pubblico (open source)
- Su pages pubblicarne un branch

### Settings google account
Sul portale https://console.cloud.google.com/ creare un progetto ed emettere una coppia client-id e client-secret, inoltre emettere una api-key.
Accertarsi che siano stati indicati gli fqdn ammessi e gli url di callback per la login open-id.
Accertarsi inoltre che, se il progetto non viene "pubblicato", vengano invitati gli utenti "QA" per poter usare tali api-key e client-id.