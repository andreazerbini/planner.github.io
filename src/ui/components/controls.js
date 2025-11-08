export function createButton(label, { className = '', onClick } = {}) {
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

export function createSelect(options, { value, onChange } = {}) {
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

export function createTextInput(value, { placeholder = '', onInput } = {}) {
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

export function createNumberInput(value, { min = 1, max = 5, onInput } = {}) {
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

export function createDateInput(value, { onInput } = {}) {
  const input = document.createElement('input');
  input.type = 'date';
  input.value = value || '';
  if (onInput) {
    input.addEventListener('input', () => onInput(input.value || null));
  }
  return input;
}

export function createTextarea(value, { onInput } = {}) {
  const textarea = document.createElement('textarea');
  textarea.value = value || '';
  if (onInput) {
    textarea.addEventListener('input', () => onInput(textarea.value));
  }
  return textarea;
}
