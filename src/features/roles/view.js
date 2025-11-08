import {
  getState,
  mutateState,
  createRole,
  createLongTermGoal,
  datePlus,
  toInt
} from '../../state/store.js';
import { createTable } from '../../ui/components/table.js';
import {
  createButton,
  createNumberInput,
  createTextInput
} from '../../ui/components/controls.js';

function confirmDelete(message) {
  return window.confirm(message ?? 'Sei sicuro?');
}

export function renderRolesView(container) {
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
