export function renderTabs(container, tabs, activeId, onSelect) {
  container.innerHTML = '';
  tabs.forEach((tab) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `tab${tab.id === activeId ? ' active' : ''}`;
    button.textContent = tab.label;
    button.addEventListener('click', () => onSelect(tab.id));
    container.append(button);
  });
}
