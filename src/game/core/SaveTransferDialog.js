import { parseSave, serializeSave } from '../systems/Save.js';

let nextDialogId = 0;

function requireFunction(value, name) {
  if (typeof value !== 'function') throw new TypeError(`SaveTransferDialog ${name} must be a function.`);
  return value;
}

function appendTextElement(documentRef, parent, tagName, className, text) {
  const element = documentRef.createElement(tagName);
  element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function chapterNumber(chapterId) {
  return Number(chapterId.slice(2));
}

export function describeSaveForTransfer(save) {
  // serializeSave provides the same complete schema validation used for storage.
  serializeSave(save);
  const name = save.character.name;
  const chapter = chapterNumber(save.resume.chapter);
  const chapterComplete = save.progress.completedChapters.includes(save.resume.chapter);
  const progress = chapterComplete ? 'chapter complete' : 'adventure in progress';
  return Object.freeze({
    name,
    chapter,
    progress,
    text: `${name} · Chapter ${chapter} · ${progress}`,
  });
}

export class SaveTransferDialog {
  constructor({
    documentRef = globalThis.document,
    clipboard = globalThis.navigator?.clipboard,
    onImport,
    onResult = () => {},
    onClose = () => {},
  } = {}) {
    if (!documentRef?.body || typeof documentRef.createElement !== 'function') {
      throw new TypeError('SaveTransferDialog requires a document with a body.');
    }
    this.document = documentRef;
    this.clipboard = clipboard;
    this.onImport = requireFunction(onImport, 'onImport');
    this.onResult = requireFunction(onResult, 'onResult');
    this.onClose = requireFunction(onClose, 'onClose');
    this.mode = null;
    this.phase = 'closed';
    this.canonicalExport = '';
    this.importCandidate = null;
    this.previouslyFocused = null;
    this.#build();
  }

  #build() {
    const documentRef = this.document;
    const id = `save-transfer-${++nextDialogId}`;
    const root = documentRef.createElement('div');
    root.className = 'save-transfer-backdrop';
    root.hidden = true;
    root.setAttribute('aria-hidden', 'true');

    const dialog = documentRef.createElement('section');
    dialog.className = 'save-transfer-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', `${id}-title`);
    dialog.setAttribute('aria-describedby', `${id}-instructions ${id}-status`);
    dialog.setAttribute('tabindex', '-1');
    root.append(dialog);

    const title = appendTextElement(documentRef, dialog, 'h2', 'save-transfer-title', 'Move Violet’s save');
    title.id = `${id}-title`;
    const instructions = appendTextElement(documentRef, dialog, 'p', 'save-transfer-instructions', '');
    instructions.id = `${id}-instructions`;

    const label = appendTextElement(documentRef, dialog, 'label', 'save-transfer-label', 'Save data');
    label.setAttribute('for', `${id}-data`);
    const textarea = documentRef.createElement('textarea');
    textarea.id = `${id}-data`;
    textarea.className = 'save-transfer-data';
    textarea.setAttribute('aria-describedby', `${id}-instructions ${id}-preview ${id}-status`);
    textarea.setAttribute('aria-label', 'Violet’s save data');
    textarea.setAttribute('autocomplete', 'off');
    textarea.setAttribute('autocapitalize', 'off');
    textarea.setAttribute('autocorrect', 'off');
    textarea.setAttribute('spellcheck', 'false');
    textarea.setAttribute('wrap', 'off');
    dialog.append(textarea);

    const preview = documentRef.createElement('div');
    preview.id = `${id}-preview`;
    preview.className = 'save-transfer-preview';
    preview.hidden = true;
    preview.setAttribute('aria-live', 'polite');
    appendTextElement(documentRef, preview, 'p', 'save-transfer-preview-heading', 'Ready to replace');
    const previewText = appendTextElement(documentRef, preview, 'p', 'save-transfer-preview-text', '');
    appendTextElement(
      documentRef,
      preview,
      'p',
      'save-transfer-warning',
      'This will replace the save currently on this iPad.',
    );
    dialog.append(preview);

    const status = appendTextElement(documentRef, dialog, 'p', 'save-transfer-status', '');
    status.id = `${id}-status`;
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    const actions = documentRef.createElement('div');
    actions.className = 'save-transfer-actions';
    const primaryButton = documentRef.createElement('button');
    primaryButton.className = 'save-transfer-button save-transfer-button-primary';
    primaryButton.type = 'button';
    actions.append(primaryButton);
    const cancelButton = documentRef.createElement('button');
    cancelButton.className = 'save-transfer-button save-transfer-button-secondary';
    cancelButton.type = 'button';
    cancelButton.textContent = 'Cancel';
    actions.append(cancelButton);
    dialog.append(actions);

    this.root = root;
    this.elements = Object.freeze({
      dialog,
      title,
      instructions,
      textarea,
      preview,
      previewText,
      status,
      primaryButton,
      cancelButton,
    });

    this.boundPrimary = () => { void this.#activatePrimary(); };
    this.boundCancel = () => this.close('cancelled');
    this.boundInput = () => this.#handleInput();
    this.boundTextareaClick = () => {
      if (this.mode === 'export') this.#selectExportText();
    };
    this.boundKeydown = (event) => this.#handleKeydown(event);
    primaryButton.addEventListener('click', this.boundPrimary);
    cancelButton.addEventListener('click', this.boundCancel);
    textarea.addEventListener('input', this.boundInput);
    textarea.addEventListener('click', this.boundTextareaClick);
    dialog.addEventListener('keydown', this.boundKeydown);
    documentRef.body.append(root);
  }

  get isOpen() {
    return !this.root.hidden;
  }

  openExport(raw) {
    const save = parseSave(raw);
    this.canonicalExport = serializeSave(save);
    this.mode = 'export';
    this.phase = 'ready';
    this.importCandidate = null;
    const { title, instructions, textarea, preview, primaryButton, cancelButton } = this.elements;
    title.textContent = 'Copy Violet’s save';
    instructions.textContent = 'Copy this text and keep it somewhere safe. It includes Violet’s progress and yearbook.';
    textarea.value = this.canonicalExport;
    textarea.readOnly = true;
    textarea.disabled = false;
    textarea.removeAttribute('aria-invalid');
    preview.hidden = true;
    primaryButton.textContent = 'Copy save';
    primaryButton.disabled = false;
    cancelButton.textContent = 'Cancel';
    this.#setStatus('');
    this.#show(this.elements.dialog);
    return this;
  }

  openImport() {
    this.mode = 'import';
    this.phase = 'editing';
    this.canonicalExport = '';
    this.importCandidate = null;
    const { title, instructions, textarea, preview, primaryButton, cancelButton } = this.elements;
    title.textContent = 'Bring back Violet’s save';
    instructions.textContent = 'Paste save text below. You can check it before anything on this iPad changes.';
    textarea.value = '';
    textarea.readOnly = false;
    textarea.disabled = false;
    textarea.removeAttribute('aria-invalid');
    preview.hidden = true;
    primaryButton.textContent = 'Check save';
    primaryButton.disabled = false;
    cancelButton.textContent = 'Cancel';
    this.#setStatus('');
    this.#show(textarea);
    return this;
  }

  #show(focusTarget) {
    if (!this.isOpen) this.previouslyFocused = this.document.activeElement ?? null;
    this.root.hidden = false;
    this.root.removeAttribute('aria-hidden');
    focusTarget.focus?.();
  }

  close(reason = 'cancelled') {
    if (!this.isOpen) return this;
    const mode = this.mode;
    this.root.hidden = true;
    this.root.setAttribute('aria-hidden', 'true');
    this.mode = null;
    this.phase = 'closed';
    this.importCandidate = null;
    const focusTarget = this.previouslyFocused;
    this.previouslyFocused = null;
    focusTarget?.focus?.();
    this.onClose(Object.freeze({ reason, mode }));
    return this;
  }

  destroy() {
    if (this.isOpen) {
      this.root.hidden = true;
      this.previouslyFocused?.focus?.();
    }
    this.elements.primaryButton.removeEventListener('click', this.boundPrimary);
    this.elements.cancelButton.removeEventListener('click', this.boundCancel);
    this.elements.textarea.removeEventListener('input', this.boundInput);
    this.elements.textarea.removeEventListener('click', this.boundTextareaClick);
    this.elements.dialog.removeEventListener('keydown', this.boundKeydown);
    this.root.remove();
    this.mode = null;
    this.phase = 'destroyed';
    this.importCandidate = null;
    this.previouslyFocused = null;
  }

  async #activatePrimary() {
    if (!this.isOpen || this.elements.primaryButton.disabled) return;
    if (this.mode === 'export') {
      await this.#copyExport();
      return;
    }
    if (this.mode !== 'import') return;
    if (this.phase === 'editing') {
      this.#validateImport();
      return;
    }
    if (this.phase === 'confirming') {
      await this.#replaceImport();
      return;
    }
    if (this.phase === 'imported') this.close('imported');
  }

  async #copyExport() {
    let copied = false;
    let error = null;
    if (typeof this.clipboard?.writeText === 'function') {
      try {
        await this.clipboard.writeText(this.canonicalExport);
        copied = true;
      } catch (clipboardError) {
        error = clipboardError;
      }
    }
    if (!copied) {
      this.#selectExportText();
      try {
        copied = this.document.execCommand?.('copy') === true;
      } catch (copyError) {
        error = copyError;
      }
    }
    if (copied) {
      this.#setStatus('Copied. Paste it somewhere safe.', 'success');
    } else {
      this.#setStatus('Copy was blocked. Touch and hold the selected text, then choose Copy.', 'error');
    }
    this.#report({ operation: 'copy', ok: copied, status: copied ? 'copied' : 'copy-failed', error });
  }

  #selectExportText() {
    const textarea = this.elements.textarea;
    textarea.focus?.();
    textarea.select?.();
    textarea.setSelectionRange?.(0, textarea.value.length);
  }

  #handleInput() {
    if (this.mode !== 'import' || this.phase === 'importing' || this.phase === 'imported') return;
    this.phase = 'editing';
    this.importCandidate = null;
    this.elements.preview.hidden = true;
    this.elements.primaryButton.textContent = 'Check save';
    this.elements.textarea.removeAttribute('aria-invalid');
    this.#setStatus('');
  }

  #validateImport() {
    const raw = this.elements.textarea.value.trim();
    let save;
    try {
      save = parseSave(raw);
    } catch (error) {
      this.importCandidate = null;
      this.elements.preview.hidden = true;
      this.elements.textarea.setAttribute('aria-invalid', 'true');
      this.#setStatus('That does not look like a Violet save. Nothing was changed.', 'error');
      this.#report({ operation: 'validation', ok: false, status: 'invalid-import', error });
      return;
    }
    const summary = describeSaveForTransfer(save);
    this.importCandidate = Object.freeze({ raw: serializeSave(save), save, summary });
    this.phase = 'confirming';
    this.elements.textarea.removeAttribute('aria-invalid');
    this.elements.previewText.textContent = summary.text;
    this.elements.preview.hidden = false;
    this.elements.primaryButton.textContent = 'Replace Violet’s save';
    this.#setStatus('Save checked. Review the details, then choose Replace.', 'success');
    this.#report({ operation: 'validation', ok: true, status: 'valid-import', save, summary });
  }

  async #replaceImport() {
    const candidate = this.importCandidate;
    if (!candidate) {
      this.phase = 'editing';
      return;
    }
    this.phase = 'importing';
    this.elements.dialog.setAttribute('aria-busy', 'true');
    this.elements.primaryButton.disabled = true;
    this.elements.cancelButton.disabled = true;
    this.elements.textarea.readOnly = true;
    this.#setStatus('Replacing Violet’s save…');

    let result;
    try {
      result = await this.onImport(Object.freeze({ raw: candidate.raw, save: candidate.save, summary: candidate.summary }));
    } catch (error) {
      result = { ok: false, status: 'import-error', error };
    }

    this.elements.dialog.removeAttribute('aria-busy');
    this.elements.primaryButton.disabled = false;
    this.elements.cancelButton.disabled = false;
    if (result?.ok === true) {
      this.phase = 'imported';
      this.elements.primaryButton.textContent = 'Done';
      this.elements.cancelButton.textContent = 'Return to game';
      this.#setStatus('Violet’s save was replaced.', 'success');
      this.#report({ operation: 'import', ...result, ok: true, save: result.save ?? candidate.save });
      return;
    }

    this.phase = 'confirming';
    this.elements.textarea.readOnly = false;
    this.elements.primaryButton.textContent = 'Replace Violet’s save';
    this.#setStatus('The save could not be replaced. The current game is still safe.', 'error');
    this.#report({
      operation: 'import',
      ok: false,
      status: result?.status ?? 'import-error',
      error: result?.error,
    });
  }

  #setStatus(message, tone = '') {
    this.elements.status.textContent = message;
    if (tone) this.elements.status.setAttribute('data-tone', tone);
    else this.elements.status.removeAttribute('data-tone');
  }

  #report(result) {
    this.onResult(Object.freeze(result));
  }

  #handleKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close('cancelled');
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [
      this.elements.textarea,
      this.elements.primaryButton,
      this.elements.cancelButton,
    ].filter((element) => !element.hidden && !element.disabled);
    if (focusable.length === 0) return;
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
