import { replaceState, isValidState, serializeState, STORAGE_KEYS } from '../../state/store.js';

const driveState = {
  CLIENT_ID: window.localStorage.getItem(STORAGE_KEYS.googleClientId) || '',
  API_KEY: window.localStorage.getItem(STORAGE_KEYS.googleApiKey) || '',
  DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  SCOPES: 'https://www.googleapis.com/auth/drive.file',
  tokenClient: null,
  gapiLoaded: false,
  gisLoaded: false,
  signedIn: false,
  currentFileId: null
};

let ui = {
  statusEl: null,
  signInBtn: null,
  openBtn: null,
  saveBtn: null
};

function updateDriveUI() {
  if (ui.statusEl) {
    ui.statusEl.textContent = driveState.signedIn ? 'Drive: connesso' : 'Drive: offline';
  }
  const disabled = !driveState.signedIn;
  ui.openBtn && (ui.openBtn.disabled = disabled);
  ui.saveBtn && (ui.saveBtn.disabled = disabled);
}

function saveCredentials() {
  window.localStorage.setItem(STORAGE_KEYS.googleClientId, driveState.CLIENT_ID);
  window.localStorage.setItem(STORAGE_KEYS.googleApiKey, driveState.API_KEY);
}

function askForCredentials() {
  const clientId = window.prompt(
    'Inserisci il tuo Google OAuth CLIENT_ID (tipo ...apps.googleusercontent.com):',
    driveState.CLIENT_ID
  );
  if (!clientId) return false;
  const apiKey = window.prompt('Inserisci la tua API Key Google Drive:', driveState.API_KEY);
  if (!apiKey) return false;
  driveState.CLIENT_ID = clientId.trim();
  driveState.API_KEY = apiKey.trim();
  saveCredentials();
  return true;
}

function loadGapi() {
  return new Promise((resolve, reject) => {
    if (driveState.gapiLoaded) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      try {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              apiKey: driveState.API_KEY,
              discoveryDocs: driveState.DISCOVERY_DOCS
            });
            driveState.gapiLoaded = true;
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    };
    script.onerror = reject;
    document.head.append(script);
  });
}

function loadGIS() {
  return new Promise((resolve, reject) => {
    if (driveState.gisLoaded) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      try {
        driveState.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: driveState.CLIENT_ID,
          scope: driveState.SCOPES,
          callback: (response) => {
            if (response && response.access_token) {
              driveState.signedIn = true;
              updateDriveUI();
            }
          }
        });
        driveState.gisLoaded = true;
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    script.onerror = reject;
    document.head.append(script);
  });
}

async function ensureDriveReady() {
  if (window.location.protocol === 'file:') {
    window.alert('Per usare Google Drive apri la pagina da http://localhost o https://');
    return false;
  }
  if (!driveState.CLIENT_ID || !driveState.API_KEY) {
    const ok = askForCredentials();
    if (!ok) return false;
  }
  try {
    await loadGIS();
  } catch (error) {
    window.alert(`Errore GIS: ${error.message}`);
    return false;
  }
  try {
    await loadGapi();
  } catch (error) {
    console.warn('Uso fallback REST (senza discovery):', error);
  }
  return true;
}

function getToken() {
  return window.google?.accounts?.oauth2?.getToken?.()?.access_token || null;
}

async function driveFetch(path, params = {}, method = 'GET', body = null) {
  const token = getToken();
  if (!token) throw new Error('Nessun access token disponibile. Premi "Connetti Google".');
  const url = new URL(`https://www.googleapis.com/drive/v3/${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : null
  });
  if (!response.ok) {
    throw new Error(`Drive REST error ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function listJsonFilesFallback() {
  const query = "mimeType='application/json' and trashed=false";
  return driveFetch('files', { q: query, fields: 'files(id,name,modifiedTime)', pageSize: '25' });
}

async function getFileContentFallback(fileId) {
  const token = getToken();
  if (!token) throw new Error('Nessun access token disponibile.');
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  if (!response.ok) {
    throw new Error(`Download error ${response.status}`);
  }
  return response.text();
}

async function uploadOrUpdateJsonFallback(name, content, fileId) {
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;
  const metadata = { name, mimeType: 'application/json' };
  const body =
    `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}` +
    `${delimiter}Content-Type: application/json\r\n\r\n${content}${closeDelim}`;
  const token = getToken();
  if (!token) throw new Error('Nessun access token disponibile.');
  const method = fileId ? 'PATCH' : 'POST';
  const path = fileId ? `files/${encodeURIComponent(fileId)}` : 'files';
  const response = await fetch(`https://www.googleapis.com/upload/drive/v3/${path}?uploadType=multipart`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body
  });
  if (!response.ok) {
    throw new Error(`Upload error ${response.status}: ${await response.text()}`);
  }
  const json = await response.json();
  return json.id;
}

function promptForFileSelection(files) {
  const list = files
    .map((file, index) => `${index + 1}) ${file.name} — ${new Date(file.modifiedTime).toLocaleString()}`)
    .join('\n');
  const answer = window.prompt(`Scegli file da aprire (numero):\n${list}`);
  const index = Number(answer) - 1;
  if (Number.isNaN(index) || index < 0 || index >= files.length) return null;
  return files[index];
}

export function registerGoogleDriveFeatures({ signInBtn, openBtn, saveBtn, statusEl }) {
  ui = { statusEl, signInBtn, openBtn, saveBtn };
  updateDriveUI();

  signInBtn?.addEventListener('click', async () => {
    if (!(await ensureDriveReady())) return;
    try {
      driveState.tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (error) {
      window.alert(`Autorizzazione Google fallita: ${error.message}`);
    }
  });

  openBtn?.addEventListener('click', async () => {
    try {
      if (!(await ensureDriveReady())) return;
      let files = [];
      if (driveState.gapiLoaded && window.gapi?.client?.drive) {
        try {
          const response = await window.gapi.client.drive.files.list({
            q: "mimeType='application/json' and trashed=false",
            pageSize: 25,
            fields: 'files(id,name,modifiedTime)'
          });
          files = response.result.files || [];
        } catch (error) {
          console.warn('gapi list fallita, passo a REST fallback:', error);
        }
      }
      if (!files.length) {
        const response = await listJsonFilesFallback();
        files = response.files || [];
      }
      if (!files.length) {
        window.alert('Nessun JSON trovato nel tuo Drive.');
        return;
      }
      const file = promptForFileSelection(files);
      if (!file) return;
      let text;
      if (driveState.gapiLoaded && window.gapi?.client?.drive) {
        try {
          const download = await window.gapi.client.drive.files.get({ fileId: file.id, alt: 'media' });
          text = download.body;
        } catch (error) {
          console.warn('gapi download fallito, uso REST:', error);
          text = await getFileContentFallback(file.id);
        }
      } else {
        text = await getFileContentFallback(file.id);
      }
      const data = JSON.parse(text);
      if (!isValidState(data)) {
        window.alert('JSON non valido');
        return;
      }
      replaceState(data);
      driveState.currentFileId = file.id;
      window.alert(`Aperto da Drive: ${file.name}`);
    } catch (error) {
      window.alert(`Errore apertura Drive: ${error.message}`);
    }
  });

  saveBtn?.addEventListener('click', async () => {
    try {
      if (!(await ensureDriveReady())) return;
      const fileName = 'kanban-covey.json';
      const content = serializeState();
      if (driveState.gapiLoaded && window.gapi?.client?.drive) {
        try {
          if (driveState.currentFileId) {
            const boundary = '-------314159265358979323846';
            const delimiter = `\r\n--${boundary}\r\n`;
            const closeDelim = `\r\n--${boundary}--`;
            const metadata = { name: fileName, mimeType: 'application/json' };
            const multipartBody =
              `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}` +
              `${delimiter}Content-Type: application/json\r\n\r\n${content}${closeDelim}`;
            await window.gapi.client.request({
              path: `/upload/drive/v3/files/${encodeURIComponent(driveState.currentFileId)}`,
              method: 'PATCH',
              params: { uploadType: 'multipart' },
              headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
              body: multipartBody
            });
            window.alert('Aggiornato su Drive ✅');
            return;
          }
          const boundary = '-------314159265358979323846';
          const delimiter = `\r\n--${boundary}\r\n`;
          const closeDelim = `\r\n--${boundary}--`;
          const metadata = { name: fileName, mimeType: 'application/json' };
          const multipartBody =
            `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}` +
            `${delimiter}Content-Type: application/json\r\n\r\n${content}${closeDelim}`;
          const response = await window.gapi.client.request({
            path: '/upload/drive/v3/files',
            method: 'POST',
            params: { uploadType: 'multipart' },
            headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
            body: multipartBody
          });
          driveState.currentFileId = response.result?.id || null;
          window.alert('Salvato su Drive ✅');
          return;
        } catch (error) {
          console.warn('gapi upload fallito, uso REST:', error);
        }
      }
      driveState.currentFileId = await uploadOrUpdateJsonFallback(
        fileName,
        content,
        driveState.currentFileId
      );
      window.alert('Salvato su Drive (REST) ✅');
    } catch (error) {
      window.alert(`Errore salvataggio Drive: ${error.message}`);
    }
  });
}
