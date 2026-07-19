export class SupersededBootAttemptError extends Error {
  constructor() {
    super('This boot attempt was superseded.');
    this.name = 'SupersededBootAttemptError';
  }
}

/**
 * Owns the replaceable asynchronous work that happens before the first playable
 * frame. The controller deliberately knows nothing about the DOM or Game so its
 * retry and late-result behavior can be proved without a browser.
 */
export class BootAttemptController {
  #runAttempt;

  #disposeResult;

  #onStage;

  #onFailure;

  #onReady;

  #onCleanupError;

  #generation = 0;

  #started = false;

  #disposed = false;

  #readyResult = null;

  #currentPromise = null;

  constructor({
    runAttempt,
    disposeResult = () => {},
    onStage = () => {},
    onFailure = () => {},
    onReady = () => {},
    onCleanupError = () => {},
  } = {}) {
    if (typeof runAttempt !== 'function') {
      throw new TypeError('BootAttemptController requires runAttempt().');
    }
    for (const [name, callback] of Object.entries({
      disposeResult,
      onStage,
      onFailure,
      onReady,
      onCleanupError,
    })) {
      if (typeof callback !== 'function') {
        throw new TypeError(`BootAttemptController ${name} must be a function.`);
      }
    }
    this.#runAttempt = runAttempt;
    this.#disposeResult = disposeResult;
    this.#onStage = onStage;
    this.#onFailure = onFailure;
    this.#onReady = onReady;
    this.#onCleanupError = onCleanupError;
  }

  start() {
    if (this.#started) return this.#currentPromise;
    this.#started = true;
    return this.#beginAttempt();
  }

  retry() {
    if (!this.#started) return this.start();
    return this.#beginAttempt();
  }

  dispose() {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#generation += 1;
    const result = this.#readyResult;
    this.#readyResult = null;
    if (result !== null) void this.#disposeSafely(result);
  }

  #beginAttempt() {
    if (this.#disposed) return Promise.resolve(Object.freeze({ status: 'disposed' }));
    if (this.#readyResult !== null) {
      return Promise.resolve(Object.freeze({ status: 'ready', result: this.#readyResult }));
    }

    const generation = ++this.#generation;
    const isCurrent = () => (
      !this.#disposed
      && this.#readyResult === null
      && generation === this.#generation
    );
    const attempt = Object.freeze({
      generation,
      isCurrent,
      assertCurrent() {
        if (!isCurrent()) throw new SupersededBootAttemptError();
      },
      stage: (stage) => {
        if (isCurrent()) this.#onStage(stage);
      },
    });

    let operation;
    try {
      operation = Promise.resolve(this.#runAttempt(attempt));
    } catch (error) {
      operation = Promise.reject(error);
    }

    this.#currentPromise = operation.then(
      (result) => this.#acceptResult(generation, result),
      (error) => this.#acceptFailure(generation, error),
    );
    return this.#currentPromise;
  }

  async #acceptResult(generation, result) {
    if (this.#disposed || generation !== this.#generation || this.#readyResult !== null) {
      await this.#disposeSafely(result);
      return Object.freeze({ status: 'superseded' });
    }

    this.#readyResult = result;
    try {
      this.#onReady(result);
    } catch (error) {
      this.#readyResult = null;
      await this.#disposeSafely(result);
      if (!this.#disposed && generation === this.#generation) this.#onFailure(error);
      return Object.freeze({ status: 'failed', error });
    }
    return Object.freeze({ status: 'ready', result });
  }

  #acceptFailure(generation, error) {
    if (
      this.#disposed
      || generation !== this.#generation
      || error instanceof SupersededBootAttemptError
    ) {
      return Object.freeze({ status: 'superseded' });
    }
    this.#onFailure(error);
    return Object.freeze({ status: 'failed', error });
  }

  async #disposeSafely(result) {
    try {
      await this.#disposeResult(result);
    } catch (error) {
      this.#onCleanupError(error);
    }
  }
}
