import {
  getState,
  mutateState,
  createLongTermGoal,
  createShortTermGoal,
  createTask,
  clampChildToParent,
  effectiveDue,
  effectiveImportance,
  datePlus,
  toInt
} from '../../state/store.js';
import { createTable } from '../../ui/components/table.js';
import {
  createButton,
  createDateInput,
  createNumberInput,
  createSelect,
  createTextarea,
  createTextInput
} from '../../ui/components/controls.js';

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

export function renderTasksView(container) {
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
