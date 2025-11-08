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

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState() {
  return state;
}

export function getStateSnapshot() {
  return deepClone(state);
}

export function mutateState(mutator, { silent = false } = {}) {
  const draft = state;
  mutator(draft);
  ensureStateShape(draft);
  persistState(draft);
  if (!silent) {
    notify();
  }
}

export function replaceState(nextState) {
  state = migrateState(nextState);
  persistState(state);
  notify();
}

export function clearState() {
  const empty = createDefaultState();
  state = empty;
  persistState(state);
  notify();
}

export function isValidState(data) {
  return (
    !!data &&
    typeof data === 'object' &&
    Array.isArray(data.roles) &&
    (typeof data.nextId === 'number' || typeof data.nextId === 'string')
  );
}

export function serializeState(pretty = true) {
  const spacing = pretty ? 2 : 0;
  return JSON.stringify(state, null, spacing);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function datePlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
}

export function toInt(value, fallback = 1) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.min(5, parsed));
}

export function toIntNull(value) {
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

export function createDefaultState() {
  return {
    version: SCHEMA_VERSION,
    nextId: 1,
    roles: []
  };
}

export function createSeedState() {
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

export function createRole(target, title, importance) {
  return {
    id: nextId(target),
    title,
    importance: toInt(importance, 1),
    lt_goals: []
  };
}

export function createLongTermGoal(target, title, description, importance, due) {
  return {
    id: nextId(target),
    title,
    description: description || '',
    importance: toInt(importance, 1),
    due: due || today(),
    st_goals: []
  };
}

export function createShortTermGoal(target, title, description, importance, due) {
  return {
    id: nextId(target),
    title,
    description: description || '',
    importance: toIntNull(importance),
    due: due || null,
    tasks: []
  };
}

export function createTask(target, title, description, importance, due) {
  return {
    id: nextId(target),
    title,
    description: description || '',
    importance: toIntNull(importance),
    due: due || null
  };
}

export function effectiveImportance(node, parentImportance) {
  return node.importance != null ? toInt(node.importance, 1) : parentImportance;
}

export function effectiveDue(node, parentDue) {
  return node.due || parentDue || null;
}

export function clampChildToParent(child, parent) {
  const parentImportance = effectiveImportance(parent, 5);
  const parentDue = parent.due || null;
  if (child.importance != null && child.importance > parentImportance) {
    child.importance = parentImportance;
  }
  if (parentDue && child.due && child.due > parentDue) {
    child.due = parentDue;
  }
}

export function cascadeAfterParentChange(target = state) {
  target.roles.forEach((role) => {
    role.lt_goals.forEach((lt) => {
      lt.st_goals.forEach((st) => {
        clampChildToParent(st, lt);
        st.tasks.forEach((task) => clampChildToParent(task, st.due ? st : lt));
      });
    });
  });
}

export function findShortTermGoalById(targetId, source = state) {
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

export function findTaskById(targetId, source = state) {
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

export { STORAGE_KEYS };
