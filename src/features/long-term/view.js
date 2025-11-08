import {
  getState,
  mutateState,
  createLongTermGoal,
  createShortTermGoal,
  cascadeAfterParentChange,
  datePlus,
  toInt,
  today
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

function buildRoleOptions(state) {
  return state.roles.map((role) => ({ label: role.title, val: role.id }));
}

function confirmDelete(message) {
  return window.confirm(message ?? 'Sei sicuro?');
}

export function renderLongTermView(container) {
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
