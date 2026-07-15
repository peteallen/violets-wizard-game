function nonEmptyString(value, path) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${path} must be a non-empty string.`);
  }
  return value;
}

function dependencyList(value, path) {
  if (!Array.isArray(value)) throw new TypeError(`${path} must be an array.`);
  return Object.freeze([...value]);
}

function loadedPackage(value, chapterId) {
  const chapterPackage = value?.default ?? value;
  if (!chapterPackage || typeof chapterPackage !== 'object' || Array.isArray(chapterPackage)) {
    throw new TypeError(`Chapter ${chapterId} content loader must return a package object.`);
  }
  if (chapterPackage.id !== chapterId) {
    throw new TypeError(`Chapter ${chapterId} content loader returned package ${String(chapterPackage.id)}.`);
  }
  dependencyList(
    chapterPackage.characterDependencies,
    `Chapter ${chapterId} characterDependencies`,
  );
  return chapterPackage;
}

function sameDependencies(left, right) {
  return left.length === right.length && left.every((entry, index) => entry === right[index]);
}

/**
 * Serializes character dependency scopes across title and chapter changes.
 * Incoming runtimes are always ready before the outgoing scope is released,
 * so rendering can never observe a partially loaded cast.
 */
export class CharacterScopeController {
  #catalog;

  #loadChapterPackage;

  #queue = Promise.resolve();

  #title = null;

  #chapter = null;

  #destroyed = false;

  #destroyPromise = null;

  constructor({ catalog, loadChapterPackage } = {}) {
    if (!catalog || typeof catalog.activate !== 'function') {
      throw new TypeError('CharacterScopeController requires a character catalog.');
    }
    if (typeof loadChapterPackage !== 'function') {
      throw new TypeError('CharacterScopeController requires a chapter content loader.');
    }
    this.#catalog = catalog;
    this.#loadChapterPackage = loadChapterPackage;
  }

  get titleCharacterIds() {
    return this.#title?.characterIds ?? Object.freeze([]);
  }

  get chapterId() {
    return this.#chapter?.chapterId ?? null;
  }

  get chapterCharacterIds() {
    return this.#chapter?.characterIds ?? Object.freeze([]);
  }

  activateTitle(dependencies, context = {}) {
    const characterIds = this.#catalog.resolveDependencies(
      dependencyList(dependencies, 'Title character dependencies'),
    );
    return this.#enqueue(async () => {
      if (this.#title && sameDependencies(this.#title.characterIds, characterIds)) {
        return this.#title.characterIds;
      }
      const incoming = await this.#catalog.activate(characterIds, {
        ...context,
        scope: 'title',
      });
      const outgoing = this.#title;
      try {
        await outgoing?.scope.release();
      } catch (error) {
        await incoming.release();
        throw error;
      }
      this.#title = Object.freeze({ characterIds: incoming.characterIds, scope: incoming });
      return this.#title.characterIds;
    });
  }

  activateChapter(chapterId, context = {}) {
    nonEmptyString(chapterId, 'Chapter ID');
    return this.#enqueue(async () => {
      if (this.#chapter?.chapterId === chapterId) return this.#chapter.characterIds;
      const module = await this.#loadChapterPackage(chapterId, 'content');
      const chapterPackage = loadedPackage(module, chapterId);
      const incoming = await this.#catalog.activate(chapterPackage.characterDependencies, {
        ...context,
        scope: 'chapter',
        chapterId,
      });
      const outgoing = this.#chapter;
      try {
        await outgoing?.scope.release();
      } catch (error) {
        await incoming.release();
        throw error;
      }
      this.#chapter = Object.freeze({
        chapterId,
        characterIds: incoming.characterIds,
        scope: incoming,
      });
      return this.#chapter.characterIds;
    });
  }

  releaseTitle() {
    return this.#enqueue(async () => {
      if (!this.#title) return Object.freeze([]);
      const outgoing = this.#title;
      await outgoing.scope.release();
      this.#title = null;
      return outgoing.characterIds;
    });
  }

  releaseChapter() {
    return this.#enqueue(async () => {
      if (!this.#chapter) return Object.freeze([]);
      const outgoing = this.#chapter;
      await outgoing.scope.release();
      this.#chapter = null;
      return outgoing.characterIds;
    });
  }

  releaseAll() {
    return this.#enqueue(async () => {
      const entries = [
        ['chapter', this.#chapter],
        ['title', this.#title],
      ].filter(([, entry]) => Boolean(entry));
      const results = await Promise.allSettled(entries.map(([, { scope }]) => scope.release()));
      const failures = [];
      results.forEach((result, index) => {
        const [kind, entry] = entries[index];
        if (result.status === 'rejected') {
          failures.push(result.reason);
          return;
        }
        if (kind === 'chapter' && this.#chapter === entry) this.#chapter = null;
        if (kind === 'title' && this.#title === entry) this.#title = null;
      });
      if (failures.length > 0) {
        throw new AggregateError(
          failures,
          'Could not release every character dependency scope.',
        );
      }
      return Object.freeze(entries.flatMap(([, { characterIds }]) => characterIds));
    }, { allowDestroyed: true });
  }

  destroy() {
    if (this.#destroyPromise) return this.#destroyPromise;
    this.#destroyed = true;
    this.#destroyPromise = this.releaseAll();
    return this.#destroyPromise;
  }

  #enqueue(operation, { allowDestroyed = false } = {}) {
    if (this.#destroyed && !allowDestroyed) {
      return Promise.reject(new Error('CharacterScopeController is destroyed.'));
    }
    const pending = this.#queue.then(operation, operation);
    this.#queue = pending.catch(() => {});
    return pending;
  }
}
