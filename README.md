# Planner App

Applicazione Kanban basata sui principi di Stephen Covey costruita con **Expo Router** e **React Native**.

## Requisiti

- Node.js 18+
- pnpm, npm o yarn

## Installazione

```bash
npm install
```

## Avvio in locale

```bash
npm start
```

Quindi apri il progetto con Expo Go su dispositivo fisico oppure con un emulatore Android/iOS.

## Struttura

- `app/`: routing file-based fornito da Expo Router.
- `src/features/kanban/`: logica, componenti e dati del dominio Covey organizzati per feature.
- `src/features/kanban/hooks/usePlannerModel.js`: hook per la gestione dello stato locale e della persistenza con AsyncStorage.

## Note

- Il modello è salvato in locale su AsyncStorage.
- È possibile condividere l'intero modello come JSON tramite il foglio di condivisione nativo.
