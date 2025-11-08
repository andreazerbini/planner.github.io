import { getState, effectiveDue, effectiveImportance } from '../../state/store.js';
import { escapeHtml } from '../../ui/components/text.js';
import { createButton } from '../../ui/components/controls.js';

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

export function renderDashboardView(container, { onNavigate }) {
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
        createBadge(`Ruolo: ${escapeHtml(role.title)}`),
        createBadge(`Imp: ${lt.importance}`),
        createBadge(`Scadenza: ${escapeHtml(lt.due || '-')}`)
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
          `${escapeHtml(role.title)} › ${escapeHtml(lt.title)} › ${escapeHtml(st.title)}`
        ),
        createBadge(`Imp: ${effectiveImportance(task, effectiveImportance(st, lt.importance))}`),
        createBadge(`Scadenza: ${escapeHtml(due || '-')}`)
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
