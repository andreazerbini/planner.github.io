export function createTable(columns, rows) {
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
