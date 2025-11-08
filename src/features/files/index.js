import { replaceState, isValidState, serializeState, clearState } from '../../state/store.js';

const supportsFileSystemAccess =
  typeof window.showSaveFilePicker === 'function' && typeof window.showOpenFilePicker === 'function';

let currentFileHandle = null;

function downloadBlob(content, filename) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function readFileAsText(file) {
  return file.text();
}

function validateAndLoad(text) {
  const data = JSON.parse(text);
  if (!isValidState(data)) {
    throw new Error('JSON non valido');
  }
  replaceState(data);
}

export function registerFileFeatures({
  exportBtn,
  importBtn,
  saveFileBtn,
  openFileBtn,
  clearBtn,
  filePicker
}) {
  exportBtn?.addEventListener('click', () => {
    try {
      downloadBlob(serializeState(), 'kanban-covey.json');
    } catch (error) {
      window.alert(`Errore export: ${error.message}`);
    }
  });

  importBtn?.addEventListener('click', () => filePicker?.click());

  filePicker?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      validateAndLoad(text);
    } catch (error) {
      window.alert(`Errore import: ${error.message}`);
    } finally {
      event.target.value = '';
    }
  });

  saveFileBtn?.addEventListener('click', async () => {
    if (!supportsFileSystemAccess) {
      window.alert('Il tuo browser non supporta il salvataggio diretto. Usa Esporta JSON.');
      return;
    }
    try {
      if (!currentFileHandle) {
        currentFileHandle = await window.showSaveFilePicker({
          suggestedName: 'kanban-covey.json',
          types: [
            {
              description: 'JSON',
              accept: { 'application/json': ['.json'] }
            }
          ]
        });
      }
      const writable = await currentFileHandle.createWritable();
      await writable.write(serializeState());
      await writable.close();
      window.alert('Salvato ✅');
    } catch (error) {
      if (error.name !== 'AbortError') {
        window.alert(`Errore salvataggio: ${error.message}`);
      }
    }
  });

  openFileBtn?.addEventListener('click', async () => {
    if (!supportsFileSystemAccess) {
      window.alert("Il tuo browser non supporta l'apertura diretta. Usa Importa JSON.");
      return;
    }
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'JSON',
            accept: { 'application/json': ['.json'] }
          }
        ]
      });
      currentFileHandle = handle;
      const file = await handle.getFile();
      const text = await file.text();
      validateAndLoad(text);
    } catch (error) {
      if (error.name !== 'AbortError') {
        window.alert(`Errore apertura: ${error.message}`);
      }
    }
  });

  clearBtn?.addEventListener('click', () => {
    if (!window.confirm('Sicuro di azzerare tutto?')) return;
    clearState();
  });
}
