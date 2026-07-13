import { describe, expect, it, vi } from 'vitest';
import { cleanPetName, PetNameDialog } from '../src/game/core/PetNameDialog.js';

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

  select() {}

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
  }

  createElement(tagName) {
    return new FakeElement(this, tagName);
  }

  createElementNS(namespace, tagName) {
    const element = new FakeElement(this, tagName);
    element.namespace = namespace;
    return element;
  }
}

function click(element) {
  element.dispatchEvent(new Event('click'));
}

function keydown(element, key, { shiftKey = false } = {}) {
  const event = new Event('keydown', { cancelable: true });
  Object.defineProperty(event, 'key', { value: key });
  Object.defineProperty(event, 'shiftKey', { value: shiftKey });
  element.dispatchEvent(event);
}

describe('pet name cleaning', () => {
  it('normalizes whitespace, removes controls, and caps the visible name', () => {
    expect(cleanPetName('  Moon\n Beam\u0000 and a deliberately long ending ')).toBe('Moon Beam and a delibera');
    expect(cleanPetName('   ')).toBeNull();
    expect(cleanPetName(null)).toBeNull();
  });
});

describe('PetNameDialog', () => {
  it('opens as an accessible modal and resolves a cleaned submitted name', async () => {
    const documentRef = new FakeDocument();
    const returnTarget = documentRef.createElement('button');
    documentRef.body.append(returnTarget);
    returnTarget.focus();
    const onClose = vi.fn();
    const dialog = new PetNameDialog({ documentRef, onClose });

    const result = dialog.open('  Moon Beam  ');
    expect(dialog.isOpen).toBe(true);
    expect(dialog.root.getAttribute('aria-hidden')).toBeNull();
    expect(dialog.elements.dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.elements.dialog.getAttribute('aria-describedby')).toBe(dialog.elements.status.id);
    expect(dialog.elements.input.getAttribute('aria-describedby')).toBe(dialog.elements.status.id);
    expect(dialog.elements.status.className.split(' ')).toContain('visually-hidden');
    expect(dialog.elements.status.getAttribute('role')).toBe('status');
    expect(dialog.elements.status.getAttribute('aria-live')).toBe('polite');
    expect(dialog.elements.status.getAttribute('aria-atomic')).toBe('true');
    expect(dialog.elements.dialog.children.some((child) => child.textContent === 'Name your pet')).toBe(true);
    expect(dialog.elements.dialog.children.some((child) => child.className === 'pet-name-instructions')).toBe(false);
    expect(dialog.elements.submitButton.textContent).toBe('Use this name');
    expect(dialog.elements.cancelButton.textContent).toBe('Name cards');
    expect(dialog.elements.cancelButton.getAttribute('aria-label')).toBe('Choose a name card instead');
    expect(documentRef.activeElement).toBe(dialog.elements.input);

    dialog.elements.input.value = '  Star\n Light  ';
    click(dialog.elements.submitButton);

    await expect(result).resolves.toBe('Star Light');
    expect(dialog.isOpen).toBe(false);
    expect(documentRef.activeElement).toBe(returnTarget);
    expect(onClose).toHaveBeenCalledWith({ reason: 'submitted', value: 'Star Light' });
  });

  it('keeps invalid input open and lets Escape return to the cards', async () => {
    const documentRef = new FakeDocument();
    const dialog = new PetNameDialog({ documentRef });
    const result = dialog.open();

    dialog.elements.input.value = '   ';
    click(dialog.elements.submitButton);
    expect(dialog.isOpen).toBe(true);
    expect(dialog.elements.input.getAttribute('aria-invalid')).toBe('true');
    expect(dialog.elements.input.getAttribute('aria-errormessage')).toBe(dialog.elements.status.id);
    expect(dialog.elements.status.className.split(' ')).toContain('visually-hidden');
    expect(dialog.elements.status.textContent).toBe('Type a name, or choose a name card.');

    keydown(dialog.elements.dialog, 'Escape');
    await expect(result).resolves.toBeNull();
    expect(dialog.isOpen).toBe(false);
  });

  it('keeps keyboard focus inside the naming surface', async () => {
    const documentRef = new FakeDocument();
    const dialog = new PetNameDialog({ documentRef });
    const result = dialog.open();
    dialog.elements.cancelButton.focus();

    keydown(dialog.elements.dialog, 'Tab');
    expect(documentRef.activeElement).toBe(dialog.elements.input);

    keydown(dialog.elements.dialog, 'Tab', { shiftKey: true });
    expect(documentRef.activeElement).toBe(dialog.elements.cancelButton);
    dialog.destroy();
    await expect(result).resolves.toBeNull();
  });

  it('resolves an open request when destroyed and removes its surface', async () => {
    const documentRef = new FakeDocument();
    const dialog = new PetNameDialog({ documentRef });
    const result = dialog.open('Pip');

    dialog.destroy();

    await expect(result).resolves.toBeNull();
    expect(dialog.destroyed).toBe(true);
    expect(dialog.root.parentNode).toBeNull();
  });
});
