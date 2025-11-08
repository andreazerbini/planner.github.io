import { subscribe } from '../state/store.js';
import { renderTabs } from '../ui/tabs.js';
import { renderRolesView } from '../features/roles/view.js';
import { renderLongTermView } from '../features/long-term/view.js';
import { renderShortTermView } from '../features/short-term/view.js';
import { renderTasksView } from '../features/tasks/view.js';
import { renderDashboardView } from '../features/dashboard/view.js';
import { registerFileFeatures } from '../features/files/index.js';
import { registerGoogleDriveFeatures } from '../features/google-drive/index.js';

const TABS = [
  { id: 'roles', label: 'Ruoli' },
  { id: 'lt', label: 'Obiettivi a lungo termine' },
  { id: 'st', label: 'Obiettivi a breve termine' },
  { id: 'tasks', label: 'Attività' },
  { id: 'dash', label: 'Dashboard' }
];

export function initApp({ tabsEl, viewEl, buttons, driveStatusEl, filePicker }) {
  if (!tabsEl || !viewEl) {
    throw new Error('Elementi UI principali mancanti');
  }

  let activeTab = 'roles';

  const focusView = () => {
    viewEl.focus({ preventScroll: true });
  };

  const navigateTo = (tabId) => {
    activeTab = tabId;
    render();
    focusView();
  };

  const renderView = () => {
    switch (activeTab) {
      case 'roles':
        renderRolesView(viewEl);
        break;
      case 'lt':
        renderLongTermView(viewEl);
        break;
      case 'st':
        renderShortTermView(viewEl);
        break;
      case 'tasks':
        renderTasksView(viewEl);
        break;
      case 'dash':
        renderDashboardView(viewEl, { onNavigate: navigateTo });
        break;
      default:
        viewEl.textContent = 'Vista non disponibile.';
    }
  };

  const render = () => {
    renderTabs(tabsEl, TABS, activeTab, navigateTo);
    renderView();
  };

  render();
  focusView();

  subscribe(() => {
    renderView();
  });

  registerFileFeatures({
    exportBtn: buttons?.exportBtn,
    importBtn: buttons?.importBtn,
    saveFileBtn: buttons?.saveFileBtn,
    openFileBtn: buttons?.openFileBtn,
    clearBtn: buttons?.clearBtn,
    filePicker
  });

  registerGoogleDriveFeatures({
    signInBtn: buttons?.googleSignInBtn,
    openBtn: buttons?.driveOpenBtn,
    saveBtn: buttons?.driveSaveBtn,
    statusEl: driveStatusEl
  });
}
