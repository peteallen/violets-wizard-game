import { ChapterAuthoringError } from './chapterAuthoring.js';
import {
  defineChapterDescriptor,
  validateChapterLoader,
} from './chapterDescriptor.js';

export class ChapterCatalogError extends ChapterAuthoringError {
  constructor(path, message) {
    super(path, message);
    this.name = 'ChapterCatalogError';
  }
}

function fail(path, message) {
  throw new ChapterCatalogError(path, message);
}

function normalizeDescriptors(value) {
  if (!Array.isArray(value)) fail('chapterCatalog.descriptors', 'must be an array');
  return value.map((descriptor) => defineChapterDescriptor(descriptor));
}

export class ChapterCatalog {
  #byId;

  #byNumber;

  constructor(descriptors) {
    const normalized = normalizeDescriptors(descriptors);
    const byId = new Map();
    const byNumber = new Map();

    normalized.forEach((descriptor, index) => {
      const path = `chapterCatalog.descriptors[${index}]`;
      const previousId = byId.get(descriptor.id);
      if (previousId) {
        fail(`${path}.id`, `duplicates ${descriptor.id}, first declared at ${previousId.path}`);
      }
      const previousNumber = byNumber.get(descriptor.number);
      if (previousNumber) {
        fail(
          `${path}.number`,
          `duplicates chapter number ${descriptor.number}, first declared by ${previousNumber.descriptor.id}`,
        );
      }
      const entry = Object.freeze({ descriptor, path });
      byId.set(descriptor.id, entry);
      byNumber.set(descriptor.number, entry);
    });

    this.#byId = byId;
    this.#byNumber = byNumber;
    this.descriptors = Object.freeze([...normalized]);
    Object.freeze(this);
  }

  ids() {
    return Object.freeze(this.descriptors.map((descriptor) => descriptor.id));
  }

  getDescriptor(idOrNumber) {
    const entry = typeof idOrNumber === 'number'
      ? this.#byNumber.get(idOrNumber)
      : this.#byId.get(idOrNumber);
    return entry?.descriptor ?? null;
  }

  has(idOrNumber) {
    return this.getDescriptor(idOrNumber) !== null;
  }

  load(idOrNumber, kind = 'content') {
    const descriptor = this.getDescriptor(idOrNumber);
    if (!descriptor) {
      fail('chapterCatalog.load', `does not contain chapter ${String(idOrNumber)}`);
    }
    const loader = validateChapterLoader(descriptor, kind);
    return loader ? loader() : null;
  }
}

export function buildChapterCatalog(descriptors) {
  return new ChapterCatalog(descriptors);
}
