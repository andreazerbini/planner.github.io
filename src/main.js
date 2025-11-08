import { initApp } from './app/app.js';

document.addEventListener('DOMContentLoaded', () => {
  initApp({
    tabsEl: document.getElementById('tabs'),
    viewEl: document.getElementById('view'),
    buttons: {
      exportBtn: document.getElementById('export'),
      importBtn: document.getElementById('importBtn'),
      saveFileBtn: document.getElementById('saveFile'),
      openFileBtn: document.getElementById('openFile'),
      clearBtn: document.getElementById('clear'),
      googleSignInBtn: document.getElementById('gSignIn'),
      driveOpenBtn: document.getElementById('driveOpen'),
      driveSaveBtn: document.getElementById('driveSave')
    },
    driveStatusEl: document.getElementById('driveStatus'),
    filePicker: document.getElementById('filePicker')
  });
});
