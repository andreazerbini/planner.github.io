import {
  getState,
  mutateState,
  createLongTermGoal,
  createShortTermGoal,
  createTask,
  clampChildToParent,
  cascadeAfterParentChange,
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

function confirmDelete(message) {
  return window.confirm(message ?? 'Sei sicuro?');
}

export function renderShortTermView(container) {
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
