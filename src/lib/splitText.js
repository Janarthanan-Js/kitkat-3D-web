// 3. Tiny headline splitter: words stay unbreakable, characters sit in masks.
export function splitChars(element) {
  if (!element) return [];

  if (element.dataset.split === 'true') {
    return Array.from(element.querySelectorAll('.split-char-inner'));
  }

  const source = element.textContent ?? '';
  if (!source.trim()) return [];

  element.textContent = '';
  element.setAttribute('aria-label', source);

  const chars = [];

  source.split(/(\s+)/).forEach((token) => {
    if (!token) return;

    if (/^\s+$/.test(token)) {
      element.appendChild(document.createTextNode(token));
      return;
    }

    const word = document.createElement('span');
    word.className = 'split-word';
    word.setAttribute('aria-hidden', 'true');

    Array.from(token).forEach((character) => {
      const mask = document.createElement('span');
      mask.className = 'split-char';

      const inner = document.createElement('span');
      inner.className = 'split-char-inner';
      inner.textContent = character;

      mask.appendChild(inner);
      word.appendChild(mask);
      chars.push(inner);
    });

    element.appendChild(word);
  });

  element.dataset.split = 'true';
  return chars;
}
