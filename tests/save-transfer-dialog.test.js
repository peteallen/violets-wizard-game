import { describe, expect, it, vi } from 'vitest';
import {
  SaveTransferDialog,
  describeSaveForTransfer,
} from '../src/game/core/SaveTransferDialog.js';
import { createSaveV1, serializeSave } from '../src/game/systems/Save.js';

const NOW = '2026-07-12T18:00:00.000Z';

class FakeElement extends EventTarget {
  constructor(ownerDocument, tagName) {
    super();
    this.ownerDocument = ownerDocument;
    this.tagName = tagName.toUpperCase();
    this.attributes = new Map();
    this.children = [];
    this.parentNode = null;
    this.className = '';
    this.id = '';
    this.textContent = '';
    this.value = '';
    this.hidden = false;
    this.disabled = false;
    this.readOnly = false;
    this.selectionStart = 0;
    this.selectionEnd = 0;
  }

  append(...children) {
    for (const child of children) {
      child.parentNode = this;
      this.children.push(child);
    }
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  focus() {
    this.ownerDocument.activeElement = this;
  }

  select() {
    this.selectionStart = 0;
    this.selectionEnd = this.value.length;
  }

  setSelectionRange(start, end) {
    this.selectionStart = start;
    this.selectionEnd = end;
  }

  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
    this.parentNode = null;
  }
}

class FakeDocument {
  constructor() {
    this.activeElement = null;
    this.body = new FakeElement(this, 'body');
    this.execCommand = vi.fn(() => false);
  }

  createElement(tagName) {
    return new FakeElement(this, tagName);
  }
}

function saveFixture() {
  return createSaveV1({ now: NOW, appVersion: 'test-build', worldSeed: 42 });
}

function dispatch(element, type) {
  element.dispatchEvent(new Event(type));
}

async function settle() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('save transfer summary', () => {
  it('describes the player, current chapter, and completion state without exposing save internals', () => {
    const save = saveFixture();
    expect(describeSaveForTransfer(save)).toEqual({
      name: 'Violet',
      chapter: 1,
      progress: 'adventure in progress',
      text: 'Violet · Chapter 1 · adventure in progress',
    });
    save.progress.completedChapters.push('ch1');
    expect(describeSaveForTransfer(save).progress).toBe('chapter complete');
  });
});

describe('SaveTransferDialog', () => {
  it('opens an accessible export dialog with canonical, selectable save text and copy feedback', async () => {
    const documentRef = new FakeDocument();
    const returnTarget = documentRef.createElement('button');
    documentRef.body.append(returnTarget);
    returnTarget.focus();
    const clipboard = { writeText: vi.fn(async () => {}) };
    const onResult = vi.fn();
    const onClose = vi.fn();
    const dialog = new SaveTransferDialog({
      documentRef,
      clipboard,
      onImport: vi.fn(),
      onResult,
      onClose,
    });
    const raw = JSON.stringify(saveFixture(), null, 2);

    dialog.openExport(raw);

    expect(dialog.isOpen).toBe(true);
    expect(dialog.elements.dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.elements.dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.elements.dialog.getAttribute('aria-labelledby')).toBe(dialog.elements.title.id);
    expect(dialog.elements.textarea.readOnly).toBe(true);
    expect(dialog.elements.textarea.value).toBe(serializeSave(saveFixture()));
    expect(documentRef.activeElement).toBe(dialog.elements.dialog);

    dispatch(dialog.elements.textarea, 'click');
    expect(dialog.elements.textarea.selectionEnd).toBe(dialog.elements.textarea.value.length);
    dispatch(dialog.elements.primaryButton, 'click');
    await settle();

    expect(clipboard.writeText).toHaveBeenCalledWith(serializeSave(saveFixture()));
    expect(dialog.elements.status.textContent).toMatch(/Copied/);
    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'copy', ok: true, status: 'copied',
    }));

    dispatch(dialog.elements.cancelButton, 'click');
    expect(dialog.isOpen).toBe(false);
    expect(documentRef.activeElement).toBe(returnTarget);
    expect(onClose).toHaveBeenCalledWith({ reason: 'cancelled', mode: 'export' });
  });

  it('falls back to selecting the text when iPad clipboard access is unavailable', async () => {
    const documentRef = new FakeDocument();
    documentRef.execCommand.mockReturnValue(true);
    const clipboardError = new Error('clipboard permission denied');
    const dialog = new SaveTransferDialog({
      documentRef,
      clipboard: { writeText: vi.fn(async () => { throw clipboardError; }) },
      onImport: vi.fn(),
    });
    dialog.openExport(serializeSave(saveFixture()));

    dispatch(dialog.elements.primaryButton, 'click');
    await settle();

    expect(documentRef.execCommand).toHaveBeenCalledWith('copy');
    expect(dialog.elements.textarea.selectionEnd).toBe(dialog.elements.textarea.value.length);
    expect(dialog.elements.status.textContent).toMatch(/Copied/);
  });

  it('validates and previews pasted JSON before requiring a separate Replace confirmation', async () => {
    const documentRef = new FakeDocument();
    const imported = saveFixture();
    imported.character.pet = { type: 'cat', name: 'Biscuit' };
    const onImport = vi.fn(async ({ save }) => ({ ok: true, status: 'imported', save }));
    const onResult = vi.fn();
    const dialog = new SaveTransferDialog({ documentRef, onImport, onResult });
    dialog.openImport();
    dialog.elements.textarea.value = JSON.stringify(imported, null, 2);
    dispatch(dialog.elements.textarea, 'input');

    dispatch(dialog.elements.primaryButton, 'click');

    expect(onImport).not.toHaveBeenCalled();
    expect(dialog.elements.preview.hidden).toBe(false);
    expect(dialog.elements.previewText.textContent).toBe('Violet · Chapter 1 · adventure in progress');
    expect(dialog.elements.primaryButton.textContent).toBe('Replace Violet’s save');
    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'validation', ok: true, status: 'valid-import',
    }));

    dispatch(dialog.elements.primaryButton, 'click');
    await settle();

    expect(onImport).toHaveBeenCalledOnce();
    expect(onImport.mock.calls[0][0]).toMatchObject({
      raw: serializeSave(imported),
      summary: { name: 'Violet', chapter: 1 },
    });
    expect(dialog.elements.status.textContent).toBe('Violet’s save was replaced.');
    expect(dialog.elements.primaryButton.textContent).toBe('Done');
    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'import', ok: true, status: 'imported',
    }));

    dispatch(dialog.elements.primaryButton, 'click');
    expect(dialog.isOpen).toBe(false);
  });

  it('keeps invalid or failed replacements open without claiming the current save changed', async () => {
    const documentRef = new FakeDocument();
    const onImport = vi.fn(async () => ({
      ok: false,
      status: 'storage-error',
      error: new Error('quota exceeded'),
    }));
    const onResult = vi.fn();
    const dialog = new SaveTransferDialog({ documentRef, onImport, onResult });
    dialog.openImport();
    dialog.elements.textarea.value = '{broken';

    dispatch(dialog.elements.primaryButton, 'click');

    expect(onImport).not.toHaveBeenCalled();
    expect(dialog.elements.textarea.getAttribute('aria-invalid')).toBe('true');
    expect(dialog.elements.status.textContent).toMatch(/Nothing was changed/);
    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'validation', ok: false, status: 'invalid-import',
    }));

    dialog.elements.textarea.value = serializeSave(saveFixture());
    dispatch(dialog.elements.textarea, 'input');
    dispatch(dialog.elements.primaryButton, 'click');
    dispatch(dialog.elements.primaryButton, 'click');
    await settle();

    expect(onImport).toHaveBeenCalledOnce();
    expect(dialog.isOpen).toBe(true);
    expect(dialog.elements.textarea.readOnly).toBe(false);
    expect(dialog.elements.primaryButton.textContent).toBe('Replace Violet’s save');
    expect(dialog.elements.status.textContent).toMatch(/current game is still safe/);
    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'import', ok: false, status: 'storage-error',
    }));
  });
});
