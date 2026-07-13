let nextDialogId = 0;

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

function appendTextElement(documentRef, parent, tagName, className, text) {
  const element = documentRef.createElement(tagName);
  element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function svgElement(documentRef, tagName, attributes) {
  const element = documentRef.createElementNS(SVG_NAMESPACE, tagName);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  return element;
}

function appendOwlMedallion(documentRef, parent) {
  const svg = svgElement(documentRef, 'svg', {
    class: 'pet-name-owl',
    viewBox: '0 0 120 120',
    'aria-hidden': 'true',
  });
  svg.append(
    svgElement(documentRef, 'circle', { class: 'pet-name-owl-halo', cx: '60', cy: '60', r: '55' }),
    svgElement(documentRef, 'path', {
      class: 'pet-name-owl-body',
      d: 'M22 38 41 19c12-7 26-7 38 0l19 19c5 33-8 56-38 72C30 94 17 71 22 38Z',
    }),
    svgElement(documentRef, 'ellipse', { class: 'pet-name-owl-eye', cx: '44', cy: '52', rx: '17', ry: '19' }),
    svgElement(documentRef, 'ellipse', { class: 'pet-name-owl-eye', cx: '76', cy: '52', rx: '17', ry: '19' }),
    svgElement(documentRef, 'circle', { class: 'pet-name-owl-pupil', cx: '44', cy: '52', r: '6' }),
    svgElement(documentRef, 'circle', { class: 'pet-name-owl-pupil', cx: '76', cy: '52', r: '6' }),
    svgElement(documentRef, 'path', { class: 'pet-name-owl-beak', d: 'm52 69 8 10 8-10Z' }),
    svgElement(documentRef, 'path', { class: 'pet-name-owl-feathers', d: 'M38 85q11 11 22 0 11 11 22 0' }),
  );
  parent.append(svg);
}

export function cleanPetName(value) {
  if (value === null || value === undefined) return null;
  const name = String(value)
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 24)
    .trim();
  return name || null;
}

export class PetNameDialog {
  constructor({ documentRef = globalThis.document, onClose = () => {} } = {}) {
    if (!documentRef?.body || typeof documentRef.createElement !== 'function') {
      throw new TypeError('PetNameDialog requires a document with a body.');
    }
    if (typeof onClose !== 'function') throw new TypeError('PetNameDialog onClose must be a function.');
    this.document = documentRef;
    this.onClose = onClose;
    this.pendingResolve = null;
    this.previouslyFocused = null;
    this.destroyed = false;
    this.#build();
  }

  #build() {
    const documentRef = this.document;
    const id = `pet-name-${++nextDialogId}`;
    const root = documentRef.createElement('div');
    root.className = 'pet-name-backdrop';
    root.hidden = true;
    root.setAttribute('aria-hidden', 'true');

    const dialog = documentRef.createElement('section');
    dialog.className = 'pet-name-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', `${id}-title`);
    dialog.setAttribute('aria-describedby', `${id}-status`);
    root.append(dialog);

    appendOwlMedallion(documentRef, dialog);
    const title = appendTextElement(documentRef, dialog, 'h2', 'pet-name-title', 'Name your pet');
    title.id = `${id}-title`;

    const label = appendTextElement(documentRef, dialog, 'label', 'pet-name-label', 'Pet name');
    label.setAttribute('for', `${id}-input`);
    const input = documentRef.createElement('input');
    input.id = `${id}-input`;
    input.className = 'pet-name-input';
    input.type = 'text';
    input.maxLength = 24;
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocapitalize', 'words');
    input.setAttribute('enterkeyhint', 'done');
    input.setAttribute('spellcheck', 'false');
    input.setAttribute('aria-describedby', `${id}-status`);
    dialog.append(input);

    const status = appendTextElement(
      documentRef,
      dialog,
      'p',
      'pet-name-status visually-hidden',
      'Up to 24 letters and spaces.',
    );
    status.id = `${id}-status`;
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');

    const actions = documentRef.createElement('div');
    actions.className = 'pet-name-actions';
    const submitButton = documentRef.createElement('button');
    submitButton.className = 'pet-name-button pet-name-button-primary';
    submitButton.type = 'button';
    submitButton.textContent = 'Use this name';
    actions.append(submitButton);
    const cancelButton = documentRef.createElement('button');
    cancelButton.className = 'pet-name-button pet-name-button-secondary';
    cancelButton.type = 'button';
    cancelButton.textContent = 'Name cards';
    cancelButton.setAttribute('aria-label', 'Choose a name card instead');
    actions.append(cancelButton);
    dialog.append(actions);
    documentRef.body.append(root);

    this.root = root;
    this.elements = Object.freeze({ dialog, input, status, submitButton, cancelButton });
    this.boundSubmit = () => this.#submit();
    this.boundCancel = () => this.close(null, 'cancelled');
    this.boundInput = () => this.#clearError();
    this.boundKeydown = (event) => this.#handleKeydown(event);
    submitButton.addEventListener('click', this.boundSubmit);
    cancelButton.addEventListener('click', this.boundCancel);
    input.addEventListener('input', this.boundInput);
    dialog.addEventListener('keydown', this.boundKeydown);
  }

  get isOpen() {
    return !this.root.hidden;
  }

  open(initialValue = '') {
    if (this.destroyed) return Promise.resolve(null);
    if (this.pendingResolve) return this.pendingPromise;
    this.previouslyFocused = this.document.activeElement ?? null;
    this.elements.input.value = cleanPetName(initialValue) ?? '';
    this.#clearError();
    this.root.hidden = false;
    this.root.removeAttribute('aria-hidden');
    this.elements.input.focus?.();
    const caret = this.elements.input.value.length;
    this.elements.input.setSelectionRange?.(caret, caret);
    this.pendingPromise = new Promise((resolve) => { this.pendingResolve = resolve; });
    return this.pendingPromise;
  }

  close(value = null, reason = 'closed') {
    if (!this.isOpen && !this.pendingResolve) return this;
    const resolve = this.pendingResolve;
    this.pendingResolve = null;
    this.pendingPromise = null;
    this.root.hidden = true;
    this.root.setAttribute('aria-hidden', 'true');
    const focusTarget = this.previouslyFocused;
    this.previouslyFocused = null;
    focusTarget?.focus?.();
    resolve?.(value);
    this.onClose(Object.freeze({ reason, value }));
    return this;
  }

  destroy() {
    if (this.destroyed) return;
    this.close(null, 'destroyed');
    this.elements.submitButton.removeEventListener('click', this.boundSubmit);
    this.elements.cancelButton.removeEventListener('click', this.boundCancel);
    this.elements.input.removeEventListener('input', this.boundInput);
    this.elements.dialog.removeEventListener('keydown', this.boundKeydown);
    this.root.remove();
    this.destroyed = true;
  }

  #submit() {
    const name = cleanPetName(this.elements.input.value);
    if (!name) {
      this.elements.input.setAttribute('aria-invalid', 'true');
      this.elements.input.setAttribute('aria-errormessage', this.elements.status.id);
      this.elements.status.textContent = 'Type a name, or choose a name card.';
      this.elements.input.focus?.();
      return;
    }
    this.close(name, 'submitted');
  }

  #clearError() {
    this.elements.input.removeAttribute('aria-invalid');
    this.elements.input.removeAttribute('aria-errormessage');
    this.elements.status.textContent = 'Up to 24 letters and spaces.';
  }

  #handleKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close(null, 'cancelled');
    } else if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      this.#submit();
    } else if (event.key === 'Tab') {
      const focusable = [this.elements.input, this.elements.submitButton, this.elements.cancelButton];
      const currentIndex = focusable.indexOf(this.document.activeElement);
      const shouldWrap = currentIndex === -1
        || (event.shiftKey && currentIndex === 0)
        || (!event.shiftKey && currentIndex === focusable.length - 1);
      if (shouldWrap) {
        event.preventDefault();
        const nextIndex = event.shiftKey ? focusable.length - 1 : 0;
        focusable[nextIndex]?.focus?.();
      }
    }
  }
}
