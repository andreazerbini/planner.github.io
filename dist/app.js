(() => {
  const modules = {
    'src/main.js': function(require, exports) {
const { initApp } = require('src/app/app.js');

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

},
    'src/app/app.js': function(require, exports) {
const { subscribe } = require('src/state/store.js');
const { renderTabs } = require('src/ui/tabs.js');
const { renderRolesView } = require('src/features/roles/view.js');
const { renderLongTermView } = require('src/features/long-term/view.js');
const { renderShortTermView } = require('src/features/short-term/view.js');
const { renderTasksView } = require('src/features/tasks/view.js');
const { renderDashboardView } = require('src/features/dashboard/view.js');
const { registerFileFeatures } = require('src/features/files/index.js');
const { registerGoogleDriveFeatures } = require('src/features/google-drive/index.js');

const TABS = [
  { id: 'roles', label: 'Ruoli' },
  { id: 'lt', label: 'Obiettivi a lungo termine' },
  { id: 'st', label: 'Obiettivi a breve termine' },
  { id: 'tasks', label: 'Attività' },
  { id: 'dash', label: 'Dashboard' }
];

function initApp({ tabsEl, viewEl, buttons, driveStatusEl, filePicker }) {
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

exports.initApp = initApp;

},
    'src/state/store.js': function(require, exports) {
const STORAGE_KEYS = {
  domain: 'covey_v2_domain_model',
  googleClientId: 'covey_gd_client_id',
  googleApiKey: 'covey_gd_api_key'
};

const SCHEMA_VERSION = 1;

const listeners = new Set();
let state = loadState();

function loadState() {
  const raw = window.localStorage.getItem(STORAGE_KEYS.domain);
  if (!raw) {
    const seeded = createSeedState();
    persistState(seeded);
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw);
    const migrated = migrateState(parsed);
    persistState(migrated);
    return migrated;
  } catch (error) {
    console.warn('Impossibile leggere lo stato salvato, utilizzo dati seed', error);
    const seeded = createSeedState();
    persistState(seeded);
    return seeded;
  }
}

function persistState(value) {
  ensureStateShape(value);
  window.localStorage.setItem(STORAGE_KEYS.domain, JSON.stringify(value));
}

function migrateState(data) {
  if (!data || typeof data !== 'object') {
    return createSeedState();
  }

  const clone = deepClone(data);
  ensureStateShape(clone);

  if (!clone.version || clone.version < SCHEMA_VERSION) {
    clone.version = SCHEMA_VERSION;
  }

  return clone;
}

function ensureStateShape(target) {
  if (!target || typeof target !== 'object') {
    return;
  }

  if (typeof target.version !== 'number') {
    target.version = SCHEMA_VERSION;
  }

  if (!Array.isArray(target.roles)) {
    target.roles = [];
  }

  if (typeof target.nextId !== 'number') {
    target.nextId = 1;
  }
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function notify() {
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch (error) {
      console.error('Errore listener store', error);
    }
  });
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getState() {
  return state;
}

function getStateSnapshot() {
  return deepClone(state);
}

function mutateState(mutator, { silent = false } = {}) {
  const draft = state;
  mutator(draft);
  ensureStateShape(draft);
  persistState(draft);
  if (!silent) {
    notify();
  }
}

function replaceState(nextState) {
  state = migrateState(nextState);
  persistState(state);
  notify();
}

function clearState() {
  const empty = createDefaultState();
  state = empty;
  persistState(state);
  notify();
}

function isValidState(data) {
  return (
    !!data &&
    typeof data === 'object' &&
    Array.isArray(data.roles) &&
    (typeof data.nextId === 'number' || typeof data.nextId === 'string')
  );
}

function serializeState(pretty = true) {
  const spacing = pretty ? 2 : 0;
  return JSON.stringify(state, null, spacing);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function datePlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
}

function toInt(value, fallback = 1) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.min(5, parsed));
}

function toIntNull(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return toInt(value, 1);
}

function nextId(target) {
  const numeric = Number(target.nextId) || 1;
  target.nextId = numeric + 1;
  return String(numeric);
}

function createDefaultState() {
  return {
    version: SCHEMA_VERSION,
    nextId: 1,
    roles: []
  };
}

function createSeedState() {
  const seeded = createDefaultState();
  const nid = () => nextId(seeded);
  const addRole = (title, importance) => ({ id: nid(), title, importance: toInt(importance, 1), lt_goals: [] });
  const addLT = (title, description, importance, due) => ({
    id: nid(),
    title,
    description: description || '',
    importance: toInt(importance, 1),
    due: due || datePlus(120),
    st_goals: []
  });
  const addST = (title, description, importance, due) => ({
    id: nid(),
    title,
    description: description || '',
    importance: toIntNull(importance),
    due: due || null,
    tasks: []
  });
  const addTask = (title, description, importance, due) => ({
    id: nid(),
    title,
    description: description || '',
    importance: toIntNull(importance),
    due: due || null
  });

  const role = addRole('Team Leader', 3);
  const lt = addLT('Introdurre ML nel prodotto', 'Roadmap ML (RAG, valutazione, privacy)', 5, datePlus(120));
  const st = addST('PoC RAG su documentale', 'Pipeline base eval + feedback', null, null);
  const task = addTask(
    'Progettazione schema vector DB',
    'Definire spazio embedding e chunking',
    4,
    datePlus(30)
  );

  st.tasks.push(task);
  lt.st_goals.push(st);
  role.lt_goals.push(lt);
  seeded.roles.push(role);
  return seeded;
}

function createRole(target, title, importance) {
  return {
    id: nextId(target),
    title,
    importance: toInt(importance, 1),
    lt_goals: []
  };
}

function createLongTermGoal(target, title, description, importance, due) {
  return {
    id: nextId(target),
    title,
    description: description || '',
    importance: toInt(importance, 1),
    due: due || today(),
    st_goals: []
  };
}

function createShortTermGoal(target, title, description, importance, due) {
  return {
    id: nextId(target),
    title,
    description: description || '',
    importance: toIntNull(importance),
    due: due || null,
    tasks: []
  };
}

function createTask(target, title, description, importance, due) {
  return {
    id: nextId(target),
    title,
    description: description || '',
    importance: toIntNull(importance),
    due: due || null
  };
}

function effectiveImportance(node, parentImportance) {
  return node.importance != null ? toInt(node.importance, 1) : parentImportance;
}

function effectiveDue(node, parentDue) {
  return node.due || parentDue || null;
}

function clampChildToParent(child, parent) {
  const parentImportance = effectiveImportance(parent, 5);
  const parentDue = parent.due || null;
  if (child.importance != null && child.importance > parentImportance) {
    child.importance = parentImportance;
  }
  if (parentDue && child.due && child.due > parentDue) {
    child.due = parentDue;
  }
}

function cascadeAfterParentChange(target = state) {
  target.roles.forEach((role) => {
    role.lt_goals.forEach((lt) => {
      lt.st_goals.forEach((st) => {
        clampChildToParent(st, lt);
        st.tasks.forEach((task) => clampChildToParent(task, st.due ? st : lt));
      });
    });
  });
}

function findShortTermGoalById(targetId, source = state) {
  for (const role of source.roles) {
    for (const lt of role.lt_goals) {
      const st = lt.st_goals.find((item) => item.id === targetId);
      if (st) {
        return { role, lt, st };
      }
    }
  }
  return null;
}

function findTaskById(targetId, source = state) {
  for (const role of source.roles) {
    for (const lt of role.lt_goals) {
      for (const st of lt.st_goals) {
        const task = st.tasks.find((item) => item.id === targetId);
        if (task) {
          return { role, lt, st, task };
        }
      }
    }
  }
  return null;
}

exports.STORAGE_KEYS = STORAGE_KEYS;

exports.subscribe = subscribe;
exports.getState = getState;
exports.getStateSnapshot = getStateSnapshot;
exports.mutateState = mutateState;
exports.replaceState = replaceState;
exports.clearState = clearState;
exports.isValidState = isValidState;
exports.serializeState = serializeState;
exports.today = today;
exports.datePlus = datePlus;
exports.toInt = toInt;
exports.toIntNull = toIntNull;
exports.createDefaultState = createDefaultState;
exports.createSeedState = createSeedState;
exports.createRole = createRole;
exports.createLongTermGoal = createLongTermGoal;
exports.createShortTermGoal = createShortTermGoal;
exports.createTask = createTask;
exports.effectiveImportance = effectiveImportance;
exports.effectiveDue = effectiveDue;
exports.clampChildToParent = clampChildToParent;
exports.cascadeAfterParentChange = cascadeAfterParentChange;
exports.findShortTermGoalById = findShortTermGoalById;
exports.findTaskById = findTaskById;

},
    'src/ui/tabs.js': function(require, exports) {
function renderTabs(container, tabs, activeId, onSelect) {
  container.innerHTML = '';
  tabs.forEach((tab) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = \`tab\${tab.id === activeId ? ' active' : ''}\`;
    button.textContent = tab.label;
    button.addEventListener('click', () => onSelect(tab.id));
    container.append(button);
  });
}

exports.renderTabs = renderTabs;

},
    'src/features/roles/view.js': function(require, exports) {
const { getState, mutateState, createRole, createLongTermGoal, datePlus, toInt } = require('src/state/store.js');
const { createTable } = require('src/ui/components/table.js');
const { createButton, createNumberInput, createTextInput } = require('src/ui/components/controls.js');

function confirmDelete(message) {
  return window.confirm(message ?? 'Sei sicuro?');
}

function renderRolesView(container) {
  container.innerHTML = '';
  const rows = getState().roles.slice();

  const table = createTable(
    [
      {
        label: 'Titolo',
        key: (role) => (role.title || '').toLowerCase(),
        render: (role) =>
          createTextInput(role.title, {
            placeholder: 'Titolo',
            onInput: (value) =>
              mutateState(() => {
                role.title = value;
              }, { silent: true })
          })
      },
      {
        label: 'Importanza (1-5)',
        key: (role) => role.importance || 0,
        render: (role) =>
          createNumberInput(role.importance, {
            onInput: (value) =>
              mutateState(() => {
                role.importance = toInt(value);
              }, { silent: true })
          })
      },
      {
        label: 'Azioni',
        render: (role) => {
          const controls = document.createElement('div');
          controls.className = 'controls';

          controls.append(
            createButton('+ LT', {
              onClick: () =>
                mutateState((draft) => {
                  const targetRole = draft.roles.find((item) => item.id === role.id);
                  if (!targetRole) return;
                  targetRole.lt_goals.push(createLongTermGoal(draft, 'Nuovo obiettivo LT', '', 3, datePlus(90)));
                })
            })
          );

          controls.append(
            createButton('Elimina', {
              onClick: () => {
                if (!confirmDelete('Eliminare ruolo e tutti i figli?')) return;
                mutateState((draft) => {
                  draft.roles = draft.roles.filter((item) => item.id !== role.id);
                });
              }
            })
          );

          return controls;
        }
      }
    ],
    rows
  );

  const toolbar = document.createElement('div');
  toolbar.className = 'controls';
  toolbar.append(
    createButton('+ Ruolo', {
      className: 'action-btn primary',
      onClick: () =>
        mutateState((draft) => {
          draft.roles.push(createRole(draft, 'Nuovo ruolo', 3));
        })
    })
  );

  container.append(toolbar, table);
}

exports.renderRolesView = renderRolesView;

},
    'src/ui/components/table.js': function(require, exports) {
function createTable(columns, rows) {
  const wrapper = document.createElement('div');
  wrapper.className = 'table-wrap';

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  let sortIndex = -1;
  let sortDir = 1;

  const defaultComparator = (a, b) => {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;
    return (a > b) - (a < b);
  };

  const applySort = () => {
    if (sortIndex < 0) return;
    const column = columns[sortIndex];
    const comparator = column.sort || ((left, right) => defaultComparator(column.key?.(left), column.key?.(right)));
    rows.sort((left, right) => sortDir * comparator(left, right));
  };

  columns.forEach((column, columnIndex) => {
    const th = document.createElement('th');
    th.textContent = column.label;

    if (column.key || column.sort) {
      th.classList.add('sortable');
      th.addEventListener('click', () => {
        if (sortIndex === columnIndex) {
          sortDir = -sortDir;
        } else {
          sortIndex = columnIndex;
          sortDir = 1;
        }

        [...headerRow.children].forEach((cell, index) => {
          cell.classList.remove('asc', 'desc');
          if (index === sortIndex) {
            cell.classList.add(sortDir === 1 ? 'asc' : 'desc');
          }
        });

        applySort();
        mountBody();
      });
    }

    headerRow.append(th);
  });

  thead.append(headerRow);
  table.append(thead);

  const tbody = document.createElement('tbody');

  const mountBody = () => {
    tbody.innerHTML = '';
    rows.forEach((row) => {
      const tr = document.createElement('tr');
      columns.forEach((column) => {
        const td = document.createElement('td');
        td.append(column.render(row));
        tr.append(td);
      });
      tbody.append(tr);
    });
  };

  applySort();
  mountBody();

  table.append(tbody);
  wrapper.append(table);
  return wrapper;
}

exports.createTable = createTable;

},
    'src/ui/components/controls.js': function(require, exports) {
function createButton(label, { className = '', onClick } = {}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  if (className) {
    button.className = className;
  }
  if (onClick) {
    button.addEventListener('click', onClick);
  }
  return button;
}

function createSelect(options, { value, onChange } = {}) {
  const select = document.createElement('select');
  options.forEach(({ label, val }) => {
    const option = document.createElement('option');
    option.value = val;
    option.textContent = label;
    select.append(option);
  });
  if (value !== undefined) {
    select.value = value;
  }
  if (onChange) {
    select.addEventListener('input', () => onChange(select.value));
  }
  return select;
}

function createTextInput(value, { placeholder = '', onInput } = {}) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value || '';
  if (placeholder) {
    input.placeholder = placeholder;
  }
  if (onInput) {
    input.addEventListener('input', () => onInput(input.value));
  }
  return input;
}

function createNumberInput(value, { min = 1, max = 5, onInput } = {}) {
  const input = document.createElement('input');
  input.type = 'number';
  input.min = String(min);
  input.max = String(max);
  input.step = '1';
  input.value = value ?? '';
  if (onInput) {
    input.addEventListener('input', () => onInput(input.value === '' ? null : input.value));
  }
  return input;
}

function createDateInput(value, { onInput } = {}) {
  const input = document.createElement('input');
  input.type = 'date';
  input.value = value || '';
  if (onInput) {
    input.addEventListener('input', () => onInput(input.value || null));
  }
  return input;
}

function createTextarea(value, { onInput } = {}) {
  const textarea = document.createElement('textarea');
  textarea.value = value || '';
  if (onInput) {
    textarea.addEventListener('input', () => onInput(textarea.value));
  }
  return textarea;
}

exports.createButton = createButton;
exports.createSelect = createSelect;
exports.createTextInput = createTextInput;
exports.createNumberInput = createNumberInput;
exports.createDateInput = createDateInput;
exports.createTextarea = createTextarea;

},
    'src/features/long-term/view.js': function(require, exports) {
const { getState, mutateState, createLongTermGoal, createShortTermGoal, cascadeAfterParentChange, datePlus, toInt, today } = require('src/state/store.js');
const { createTable } = require('src/ui/components/table.js');
const { createButton, createDateInput, createNumberInput, createSelect, createTextarea, createTextInput } = require('src/ui/components/controls.js');

function buildRoleOptions(state) {
  return state.roles.map((role) => ({ label: role.title, val: role.id }));
}

function confirmDelete(message) {
  return window.confirm(message ?? 'Sei sicuro?');
}

function renderLongTermView(container) {
  container.innerHTML = '';
  const state = getState();
  const rows = [];
  state.roles.forEach((role) => {
    role.lt_goals.forEach((lt) => {
      rows.push({ role, lt });
    });
  });

  const table = createTable(
    [
      {
        label: 'Ruolo',
        key: (row) => (row.role.title || '').toLowerCase(),
        render: (row) =>
          createSelect(buildRoleOptions(state), {
            value: row.role.id,
            onChange: (value) =>
              mutateState((draft) => {
                if (value === row.role.id) return;
                const fromRole = draft.roles.find((item) => item.id === row.role.id);
                const toRole = draft.roles.find((item) => item.id === value);
                if (!fromRole || !toRole) return;
                const index = fromRole.lt_goals.findIndex((goal) => goal.id === row.lt.id);
                if (index < 0) return;
                const [goal] = fromRole.lt_goals.splice(index, 1);
                toRole.lt_goals.push(goal);
              })
          })
      },
      {
        label: 'Titolo',
        key: (row) => (row.lt.title || '').toLowerCase(),
        render: (row) =>
          createTextInput(row.lt.title, {
            placeholder: 'Titolo',
            onInput: (value) =>
              mutateState(() => {
                row.lt.title = value;
              }, { silent: true })
          })
      },
      {
        label: 'Descrizione',
        render: (row) =>
          createTextarea(row.lt.description, {
            onInput: (value) =>
              mutateState(() => {
                row.lt.description = value;
              }, { silent: true })
          })
      },
      {
        label: 'Importanza (1-5)',
        key: (row) => row.lt.importance || 0,
        render: (row) =>
          createNumberInput(row.lt.importance, {
            onInput: (value) =>
              mutateState(() => {
                row.lt.importance = toInt(value);
                cascadeAfterParentChange();
              })
          })
      },
      {
        label: 'Scadenza',
        key: (row) => row.lt.due || '',
        render: (row) =>
          createDateInput(row.lt.due, {
            onInput: (value) =>
              mutateState(() => {
                row.lt.due = value || today();
                cascadeAfterParentChange();
              })
          })
      },
      {
        label: 'Azioni',
        render: (row) => {
          const controls = document.createElement('div');
          controls.className = 'controls';
          controls.append(
            createButton('+ BT', {
              onClick: () =>
                mutateState((draft) => {
                  const targetRole = draft.roles.find((item) => item.id === row.role.id);
                  if (!targetRole) return;
                  const targetLt = targetRole.lt_goals.find((item) => item.id === row.lt.id);
                  if (!targetLt) return;
                  targetLt.st_goals.push(createShortTermGoal(draft, 'Nuovo obiettivo BT', '', null, null));
                })
            })
          );
          controls.append(
            createButton('Elimina', {
              onClick: () => {
                if (!confirmDelete('Eliminare obiettivo LT e tutti i figli?')) return;
                mutateState((draft) => {
                  const targetRole = draft.roles.find((item) => item.id === row.role.id);
                  if (!targetRole) return;
                  targetRole.lt_goals = targetRole.lt_goals.filter((item) => item.id !== row.lt.id);
                });
              }
            })
          );
          return controls;
        }
      }
    ],
    rows
  );

  const toolbar = document.createElement('div');
  toolbar.className = 'controls';
  toolbar.append(
    createButton('+ Obiettivo LT', {
      className: 'action-btn primary',
      onClick: () =>
        mutateState((draft) => {
          if (!draft.roles.length) {
            window.alert('Prima crea almeno un Ruolo.');
            return;
          }
          const targetRole = draft.roles[0];
          targetRole.lt_goals.push(createLongTermGoal(draft, 'Nuovo obiettivo LT', '', 3, datePlus(120)));
        })
    })
  );

  container.append(toolbar, table);
}

exports.renderLongTermView = renderLongTermView;

},
    'src/features/short-term/view.js': function(require, exports) {
const { getState, mutateState, createLongTermGoal, createShortTermGoal, createTask, clampChildToParent, cascadeAfterParentChange, datePlus, toInt } = require('src/state/store.js');
const { createTable } = require('src/ui/components/table.js');
const { createButton, createDateInput, createNumberInput, createSelect, createTextarea, createTextInput } = require('src/ui/components/controls.js');

function roleOptions(state) {
  return state.roles.map((role) => ({ label: role.title, val: role.id }));
}

function longTermOptions(role) {
  return role.lt_goals.map((lt) => ({ label: lt.title, val: lt.id }));
}

function confirmDelete(message) {
  return window.confirm(message ?? 'Sei sicuro?');
}

function renderShortTermView(container) {
  container.innerHTML = '';
  const state = getState();
  const rows = [];

  state.roles.forEach((role) => {
    role.lt_goals.forEach((lt) => {
      lt.st_goals.forEach((st) => {
        rows.push({ role, lt, st });
      });
    });
  });

  const table = createTable(
    [
      {
        label: 'Ruolo',
        key: (row) => (row.role.title || '').toLowerCase(),
        render: (row) =>
          createSelect(roleOptions(state), {
            value: row.role.id,
            onChange: (value) =>
              mutateState((draft) => {
                if (value === row.role.id) return;
                const fromRole = draft.roles.find((item) => item.id === row.role.id);
                const targetRole = draft.roles.find((item) => item.id === value);
                if (!fromRole || !targetRole) return;
                const fromLt = fromRole.lt_goals.find((item) => item.id === row.lt.id);
                if (!fromLt) return;
                fromLt.st_goals = fromLt.st_goals.filter((goal) => goal.id !== row.st.id);
                if (!targetRole.lt_goals.length) {
                  targetRole.lt_goals.push(
                    createLongTermGoal(draft, 'Auto creato', '', fromLt.importance, fromLt.due)
                  );
                }
                const targetLt = targetRole.lt_goals[0];
                targetLt.st_goals.push(row.st);
                clampChildToParent(row.st, targetLt);
                cascadeAfterParentChange();
              })
          })
      },
      {
        label: 'LT',
        key: (row) => (row.lt.title || '').toLowerCase(),
        render: (row) =>
          createSelect(longTermOptions(row.role), {
            value: row.lt.id,
            onChange: (value) =>
              mutateState((draft) => {
                const targetRole = draft.roles.find((item) => item.id === row.role.id);
                if (!targetRole) return;
                const fromLt = targetRole.lt_goals.find((item) => item.id === row.lt.id);
                const toLt = targetRole.lt_goals.find((item) => item.id === value);
                if (!fromLt || !toLt || fromLt.id === toLt.id) return;
                fromLt.st_goals = fromLt.st_goals.filter((goal) => goal.id !== row.st.id);
                toLt.st_goals.push(row.st);
                clampChildToParent(row.st, toLt);
                cascadeAfterParentChange();
              })
          })
      },
      {
        label: 'Titolo',
        key: (row) => (row.st.title || '').toLowerCase(),
        render: (row) =>
          createTextInput(row.st.title, {
            placeholder: 'Titolo',
            onInput: (value) =>
              mutateState(() => {
                row.st.title = value;
              }, { silent: true })
          })
      },
      {
        label: 'Descrizione',
        render: (row) =>
          createTextarea(row.st.description, {
            onInput: (value) =>
              mutateState(() => {
                row.st.description = value;
              }, { silent: true })
          })
      },
      {
        label: 'Importanza (ereditata se vuota)',
        key: (row) => row.st.importance ?? 0,
        render: (row) =>
          createNumberInput(row.st.importance, {
            onInput: (value) =>
              mutateState(() => {
                row.st.importance = value === null ? null : toInt(value);
                clampChildToParent(row.st, row.lt);
                cascadeAfterParentChange();
              })
          })
      },
      {
        label: 'Scadenza (ereditata se vuota)',
        key: (row) => row.st.due || '',
        render: (row) =>
          createDateInput(row.st.due, {
            onInput: (value) =>
              mutateState(() => {
                row.st.due = value;
                clampChildToParent(row.st, row.lt);
                cascadeAfterParentChange();
              })
          })
      },
      {
        label: 'Azioni',
        render: (row) => {
          const controls = document.createElement('div');
          controls.className = 'controls';
          controls.append(
            createButton('+ Task', {
              onClick: () =>
                mutateState((draft) => {
                  row.st.tasks.push(createTask(draft, 'Nuova attività', ''));
                })
            })
          );
          controls.append(
            createButton('Elimina', {
              onClick: () => {
                if (!confirmDelete('Eliminare obiettivo BT e attività figlie?')) return;
                mutateState((draft) => {
                  const targetRole = draft.roles.find((item) => item.id === row.role.id);
                  if (!targetRole) return;
                  const targetLt = targetRole.lt_goals.find((item) => item.id === row.lt.id);
                  if (!targetLt) return;
                  targetLt.st_goals = targetLt.st_goals.filter((goal) => goal.id !== row.st.id);
                });
              }
            })
          );
          return controls;
        }
      }
    ],
    rows
  );

  const toolbar = document.createElement('div');
  toolbar.className = 'controls';
  toolbar.append(
    createButton('+ Obiettivo BT', {
      className: 'action-btn primary',
      onClick: () => {
        const current = getState();
        if (!current.roles.length) {
          window.alert('Crea prima un Ruolo e un LT.');
          return;
        }
        mutateState((draft) => {
          const role = draft.roles[0];
          if (!role.lt_goals.length) {
            role.lt_goals.push(createLongTermGoal(draft, 'Nuovo LT', '', 3, datePlus(120)));
          }
          role.lt_goals[0].st_goals.push(createShortTermGoal(draft, 'Nuovo obiettivo BT', '', null, null));
        });
      }
    })
  );

  container.append(toolbar, table);
}

exports.renderShortTermView = renderShortTermView;

},
    'src/features/tasks/view.js': function(require, exports) {
const { getState, mutateState, createLongTermGoal, createShortTermGoal, createTask, clampChildToParent, effectiveDue, effectiveImportance, datePlus, toInt } = require('src/state/store.js');
const { createTable } = require('src/ui/components/table.js');
const { createButton, createDateInput, createNumberInput, createSelect, createTextarea, createTextInput } = require('src/ui/components/controls.js');

function roleOptions(state) {
  return state.roles.map((role) => ({ label: role.title, val: role.id }));
}

function longTermOptions(role) {
  return role.lt_goals.map((lt) => ({ label: lt.title, val: lt.id }));
}

function shortTermOptions(lt) {
  return lt.st_goals.map((st) => ({ label: st.title, val: st.id }));
}

function confirmDelete(message) {
  return window.confirm(message ?? 'Sei sicuro?');
}

function renderTasksView(container) {
  container.innerHTML = '';
  const state = getState();
  const rows = [];

  state.roles.forEach((role) => {
    role.lt_goals.forEach((lt) => {
      lt.st_goals.forEach((st) => {
        st.tasks.forEach((task) => {
          rows.push({ role, lt, st, task });
        });
      });
    });
  });

  const table = createTable(
    [
      {
        label: 'Ruolo',
        key: (row) => (row.role.title || '').toLowerCase(),
        render: (row) =>
          createSelect(roleOptions(state), {
            value: row.role.id,
            onChange: (value) =>
              mutateState((draft) => {
                const fromRole = draft.roles.find((item) => item.id === row.role.id);
                const targetRole = draft.roles.find((item) => item.id === value);
                if (!fromRole || !targetRole || targetRole.id === fromRole.id) return;
                const fromLt = fromRole.lt_goals.find((item) => item.id === row.lt.id);
                const fromSt = fromLt?.st_goals.find((item) => item.id === row.st.id);
                if (!fromLt || !fromSt) return;
                fromSt.tasks = fromSt.tasks.filter((task) => task.id !== row.task.id);
                if (!targetRole.lt_goals.length) {
                  targetRole.lt_goals.push(createLongTermGoal(draft, 'Auto creato', '', row.lt.importance, row.lt.due));
                }
                const targetLt = targetRole.lt_goals[0];
                if (!targetLt.st_goals.length) {
                  targetLt.st_goals.push(createShortTermGoal(draft, 'Auto creato', '', row.st.importance, row.st.due));
                }
                const targetSt = targetLt.st_goals[0];
                targetSt.tasks.push(row.task);
                row.role = targetRole;
                row.lt = targetLt;
                row.st = targetSt;
                clampChildToParent(row.task, targetSt.due ? targetSt : targetLt);
              })
          })
      },
      {
        label: 'LT',
        key: (row) => (row.lt.title || '').toLowerCase(),
        render: (row) =>
          createSelect(longTermOptions(row.role), {
            value: row.lt.id,
            onChange: (value) =>
              mutateState((draft) => {
                const role = draft.roles.find((item) => item.id === row.role.id);
                if (!role) return;
                const fromLt = role.lt_goals.find((item) => item.id === row.lt.id);
                const toLt = role.lt_goals.find((item) => item.id === value);
                if (!fromLt || !toLt || fromLt.id === toLt.id) return;
                const fromSt = fromLt.st_goals.find((item) => item.id === row.st.id);
                if (!fromSt) return;
                fromSt.tasks = fromSt.tasks.filter((task) => task.id !== row.task.id);
                if (!toLt.st_goals.length) {
                  toLt.st_goals.push(createShortTermGoal(draft, 'Auto creato', '', row.st.importance, row.st.due));
                }
                const targetSt = toLt.st_goals[0];
                targetSt.tasks.push(row.task);
                row.lt = toLt;
                row.st = targetSt;
                clampChildToParent(row.task, targetSt.due ? targetSt : toLt);
              })
          })
      },
      {
        label: 'BT',
        key: (row) => (row.st.title || '').toLowerCase(),
        render: (row) =>
          createSelect(shortTermOptions(row.lt), {
            value: row.st.id,
            onChange: (value) =>
              mutateState(() => {
                const targetLt = row.lt;
                const fromSt = targetLt.st_goals.find((item) => item.id === row.st.id);
                const toSt = targetLt.st_goals.find((item) => item.id === value);
                if (!fromSt || !toSt || fromSt.id === toSt.id) return;
                fromSt.tasks = fromSt.tasks.filter((task) => task.id !== row.task.id);
                toSt.tasks.push(row.task);
                row.st = toSt;
                clampChildToParent(row.task, toSt.due ? toSt : targetLt);
              })
          })
      },
      {
        label: 'Titolo',
        key: (row) => (row.task.title || '').toLowerCase(),
        render: (row) =>
          createTextInput(row.task.title, {
            placeholder: 'Titolo',
            onInput: (value) =>
              mutateState(() => {
                row.task.title = value;
              }, { silent: true })
          })
      },
      {
        label: 'Descrizione',
        render: (row) =>
          createTextarea(row.task.description, {
            onInput: (value) =>
              mutateState(() => {
                row.task.description = value;
              }, { silent: true })
          })
      },
      {
        label: 'Importanza (ereditata se vuota)',
        key: (row) => effectiveImportance(row.task, effectiveImportance(row.st, row.lt.importance)),
        render: (row) =>
          createNumberInput(row.task.importance, {
            onInput: (value) =>
              mutateState(() => {
                row.task.importance = value === null ? null : toInt(value);
                clampChildToParent(row.task, row.st.due ? row.st : row.lt);
              }, { silent: true })
          })
      },
      {
        label: 'Scadenza (ereditata se vuota)',
        key: (row) => effectiveDue(row.task, effectiveDue(row.st, row.lt.due)) || '',
        render: (row) =>
          createDateInput(row.task.due, {
            onInput: (value) =>
              mutateState(() => {
                row.task.due = value;
                clampChildToParent(row.task, row.st.due ? row.st : row.lt);
              }, { silent: true })
          })
      },
      {
        label: 'Azioni',
        render: (row) => {
          const controls = document.createElement('div');
          controls.className = 'controls';
          controls.append(
            createButton('Elimina', {
              onClick: () => {
                if (!confirmDelete('Eliminare attività?')) return;
                mutateState((draft) => {
                  const targetRole = draft.roles.find((item) => item.id === row.role.id);
                  const targetLt = targetRole?.lt_goals.find((item) => item.id === row.lt.id);
                  const targetSt = targetLt?.st_goals.find((item) => item.id === row.st.id);
                  if (!targetSt) return;
                  targetSt.tasks = targetSt.tasks.filter((task) => task.id !== row.task.id);
                });
              }
            })
          );
          return controls;
        }
      }
    ],
    rows
  );

  const toolbar = document.createElement('div');
  toolbar.className = 'controls';
  toolbar.append(
    createButton('+ Attività', {
      className: 'action-btn primary',
      onClick: () => {
        const current = getState();
        if (!current.roles.length) {
          window.alert('Crea prima Ruolo > LT > BT');
          return;
        }
        mutateState((draft) => {
          const role = draft.roles[0];
          if (!role.lt_goals.length) {
            role.lt_goals.push(createLongTermGoal(draft, 'Nuovo LT', '', 3, datePlus(120)));
          }
          const lt = role.lt_goals[0];
          if (!lt.st_goals.length) {
            lt.st_goals.push(createShortTermGoal(draft, 'Nuovo BT', '', null, null));
          }
          lt.st_goals[0].tasks.push(createTask(draft, 'Nuova attività', ''));
        });
      }
    })
  );

  container.append(toolbar, table);
}

exports.renderTasksView = renderTasksView;

},
    'src/features/dashboard/view.js': function(require, exports) {
const { getState, effectiveDue, effectiveImportance } = require('src/state/store.js');
const { escapeHtml } = require('src/ui/components/text.js');
const { createButton } = require('src/ui/components/controls.js');

function createCard(content) {
  const card = document.createElement('article');
  card.className = 'card';
  card.append(...content);
  return card;
}

function createBadge(text) {
  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.innerHTML = text;
  return badge;
}

function createTitle(text) {
  const title = document.createElement('div');
  title.className = 'title';
  title.textContent = text;
  return title;
}

function renderDashboardView(container, { onNavigate }) {
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'cards';

  const state = getState();

  const longTerms = [];
  state.roles.forEach((role) => {
    role.lt_goals.forEach((lt) => {
      longTerms.push({ role, lt });
    });
  });

  longTerms
    .sort((a, b) => (a.lt.due || '').localeCompare(b.lt.due || ''))
    .slice(0, 8)
    .forEach(({ role, lt }) => {
      const title = createTitle(lt.title);
      const meta = document.createElement('div');
      meta.append(
        createBadge(\`Ruolo: \${escapeHtml(role.title)}\`),
        createBadge(\`Imp: \${lt.importance}\`),
        createBadge(\`Scadenza: \${escapeHtml(lt.due || '-')}\`)
      );
      const description = document.createElement('div');
      description.textContent = lt.description || '—';
      const go = createButton('Vai a LT', {
        onClick: () => onNavigate?.('lt')
      });
      grid.append(createCard([title, meta, description, go]));
    });

  const soonTasks = [];
  const now = new Date();
  state.roles.forEach((role) => {
    role.lt_goals.forEach((lt) => {
      lt.st_goals.forEach((st) => {
        st.tasks.forEach((task) => {
          const due = effectiveDue(task, effectiveDue(st, lt.due));
          if (!due) return;
          const diffDays = (new Date(due).getTime() - now.getTime()) / 86400000;
          if (diffDays <= 14) {
            soonTasks.push({ role, lt, st, task, due });
          }
        });
      });
    });
  });

  soonTasks
    .sort((a, b) => (a.due || '').localeCompare(b.due || ''))
    .slice(0, 8)
    .forEach(({ role, lt, st, task, due }) => {
      const title = createTitle(task.title);
      const meta = document.createElement('div');
      meta.append(
        createBadge(
          \`\${escapeHtml(role.title)} › \${escapeHtml(lt.title)} › \${escapeHtml(st.title)}\`
        ),
        createBadge(\`Imp: \${effectiveImportance(task, effectiveImportance(st, lt.importance))}\`),
        createBadge(\`Scadenza: \${escapeHtml(due || '-')}\`)
      );
      const description = document.createElement('div');
      description.textContent = task.description || '—';
      const go = createButton('Vai a Attività', {
        onClick: () => onNavigate?.('tasks')
      });
      grid.append(createCard([title, meta, description, go]));
    });

  container.append(grid);
}

exports.renderDashboardView = renderDashboardView;

},
    'src/ui/components/text.js': function(require, exports) {
function escapeHtml(value) {
  return (value || '').replace(/[&<>"']/g, (match) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[match]);
}

exports.escapeHtml = escapeHtml;

},
    'src/features/files/index.js': function(require, exports) {
const { replaceState, isValidState, serializeState, clearState } = require('src/state/store.js');

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

function registerFileFeatures({
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
      window.alert(\`Errore export: \${error.message}\`);
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
      window.alert(\`Errore import: \${error.message}\`);
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
        window.alert(\`Errore salvataggio: \${error.message}\`);
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
        window.alert(\`Errore apertura: \${error.message}\`);
      }
    }
  });

  clearBtn?.addEventListener('click', () => {
    if (!window.confirm('Sicuro di azzerare tutto?')) return;
    clearState();
  });
}

exports.registerFileFeatures = registerFileFeatures;

},
    'src/features/google-drive/index.js': function(require, exports) {
const { replaceState, isValidState, serializeState, STORAGE_KEYS } = require('src/state/store.js');

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
    window.alert(\`Errore GIS: \${error.message}\`);
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
  const url = new URL(\`https://www.googleapis.com/drive/v3/\${path}\`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: \`Bearer \${token}\`,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : null
  });
  if (!response.ok) {
    throw new Error(\`Drive REST error \${response.status}: \${await response.text()}\`);
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
    \`https://www.googleapis.com/drive/v3/files/\${encodeURIComponent(fileId)}?alt=media\`,
    {
      headers: { Authorization: \`Bearer \${token}\` }
    }
  );
  if (!response.ok) {
    throw new Error(\`Download error \${response.status}\`);
  }
  return response.text();
}

async function uploadOrUpdateJsonFallback(name, content, fileId) {
  const boundary = '-------314159265358979323846';
  const delimiter = \`\r\n--\${boundary}\r\n\`;
  const closeDelim = \`\r\n--\${boundary}--\`;
  const metadata = { name, mimeType: 'application/json' };
  const body =
    \`\${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n\${JSON.stringify(metadata)}\` +
    \`\${delimiter}Content-Type: application/json\r\n\r\n\${content}\${closeDelim}\`;
  const token = getToken();
  if (!token) throw new Error('Nessun access token disponibile.');
  const method = fileId ? 'PATCH' : 'POST';
  const path = fileId ? \`files/\${encodeURIComponent(fileId)}\` : 'files';
  const response = await fetch(\`https://www.googleapis.com/upload/drive/v3/\${path}?uploadType=multipart\`, {
    method,
    headers: {
      Authorization: \`Bearer \${token}\`,
      'Content-Type': \`multipart/related; boundary=\${boundary}\`
    },
    body
  });
  if (!response.ok) {
    throw new Error(\`Upload error \${response.status}: \${await response.text()}\`);
  }
  const json = await response.json();
  return json.id;
}

function promptForFileSelection(files) {
  const list = files
    .map((file, index) => \`\${index + 1}) \${file.name} — \${new Date(file.modifiedTime).toLocaleString()}\`)
    .join('\n');
  const answer = window.prompt(\`Scegli file da aprire (numero):\n\${list}\`);
  const index = Number(answer) - 1;
  if (Number.isNaN(index) || index < 0 || index >= files.length) return null;
  return files[index];
}

function registerGoogleDriveFeatures({ signInBtn, openBtn, saveBtn, statusEl }) {
  ui = { statusEl, signInBtn, openBtn, saveBtn };
  updateDriveUI();

  signInBtn?.addEventListener('click', async () => {
    if (!(await ensureDriveReady())) return;
    try {
      driveState.tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (error) {
      window.alert(\`Autorizzazione Google fallita: \${error.message}\`);
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
      window.alert(\`Aperto da Drive: \${file.name}\`);
    } catch (error) {
      window.alert(\`Errore apertura Drive: \${error.message}\`);
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
            const delimiter = \`\r\n--\${boundary}\r\n\`;
            const closeDelim = \`\r\n--\${boundary}--\`;
            const metadata = { name: fileName, mimeType: 'application/json' };
            const multipartBody =
              \`\${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n\${JSON.stringify(metadata)}\` +
              \`\${delimiter}Content-Type: application/json\r\n\r\n\${content}\${closeDelim}\`;
            await window.gapi.client.request({
              path: \`/upload/drive/v3/files/\${encodeURIComponent(driveState.currentFileId)}\`,
              method: 'PATCH',
              params: { uploadType: 'multipart' },
              headers: { 'Content-Type': \`multipart/related; boundary=\${boundary}\` },
              body: multipartBody
            });
            window.alert('Aggiornato su Drive ✅');
            return;
          }
          const boundary = '-------314159265358979323846';
          const delimiter = \`\r\n--\${boundary}\r\n\`;
          const closeDelim = \`\r\n--\${boundary}--\`;
          const metadata = { name: fileName, mimeType: 'application/json' };
          const multipartBody =
            \`\${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n\${JSON.stringify(metadata)}\` +
            \`\${delimiter}Content-Type: application/json\r\n\r\n\${content}\${closeDelim}\`;
          const response = await window.gapi.client.request({
            path: '/upload/drive/v3/files',
            method: 'POST',
            params: { uploadType: 'multipart' },
            headers: { 'Content-Type': \`multipart/related; boundary=\${boundary}\` },
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
      window.alert(\`Errore salvataggio Drive: \${error.message}\`);
    }
  });
}

exports.registerGoogleDriveFeatures = registerGoogleDriveFeatures;

}
  };
  const cache = {};
  function localRequire(id) {
    if (cache[id]) {
      return cache[id];
    }
    if (!modules[id]) {
      throw new Error('Modulo non trovato: ' + id);
    }
    const module = { exports: {} };
    cache[id] = module.exports;
    modules[id](localRequire, module.exports);
    return module.exports;
  }
  localRequire('src/main.js');
})();
