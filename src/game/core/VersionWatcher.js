const FULL_GIT_SHA = /^[a-f0-9]{40}$/;

export function validateVersionPayload(value, path = 'version.json') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${path} must be an object.`);
  const keys = Object.keys(value);
  const unsupported = keys.filter((key) => !['sha', 'builtAt'].includes(key));
  if (unsupported.length > 0) throw new TypeError(`${path} has unsupported fields: ${unsupported.join(', ')}.`);
  for (const key of ['sha', 'builtAt']) {
    if (!Object.hasOwn(value, key)) throw new TypeError(`${path}.${key} is required.`);
  }
  if (typeof value.sha !== 'string' || !FULL_GIT_SHA.test(value.sha)) {
    throw new TypeError(`${path}.sha must be a full lowercase 40-character Git SHA.`);
  }
  if (typeof value.builtAt !== 'string' || Number.isNaN(Date.parse(value.builtAt)) || !value.builtAt.endsWith('Z')) {
    throw new TypeError(`${path}.builtAt must be an ISO UTC instant.`);
  }
  return value;
}

export function resolveVersionUrl(baseUrl, locationHref) {
  if (typeof baseUrl !== 'string' || baseUrl.trim() === '') throw new TypeError('VersionWatcher baseUrl must be a non-empty string.');
  if (typeof locationHref !== 'string' || locationHref.trim() === '') throw new TypeError('VersionWatcher locationHref must be a non-empty string.');
  const resolvedBase = new URL(baseUrl, locationHref);
  return new URL('version.json', resolvedBase).href;
}

export class VersionWatcher {
  constructor({
    currentSha,
    baseUrl,
    locationHref = globalThis.location?.href,
    fetcher = globalThis.fetch?.bind(globalThis),
    intervalMs = 60_000,
    onUpdate,
    onError = () => {},
    setTimer = globalThis.setTimeout?.bind(globalThis),
    clearTimer = globalThis.clearTimeout?.bind(globalThis),
  } = {}) {
    if (typeof currentSha !== 'string' || !FULL_GIT_SHA.test(currentSha)) {
      throw new TypeError('VersionWatcher currentSha must be a full lowercase 40-character Git SHA.');
    }
    if (typeof fetcher !== 'function') throw new TypeError('VersionWatcher requires fetch.');
    if (typeof onUpdate !== 'function') throw new TypeError('VersionWatcher requires an onUpdate callback.');
    if (typeof onError !== 'function') throw new TypeError('VersionWatcher onError must be a function.');
    if (!Number.isFinite(intervalMs) || intervalMs < 0) throw new TypeError('VersionWatcher intervalMs must be non-negative.');
    if (typeof setTimer !== 'function' || typeof clearTimer !== 'function') throw new TypeError('VersionWatcher requires timer functions.');
    this.currentSha = currentSha;
    this.versionUrl = resolveVersionUrl(baseUrl, locationHref);
    this.fetcher = fetcher;
    this.intervalMs = intervalMs;
    this.onUpdate = onUpdate;
    this.onError = onError;
    this.setTimer = setTimer;
    this.clearTimer = clearTimer;
    this.running = false;
    this.reported = false;
    this.timer = null;
    this.inFlight = null;
    this.generation = 0;
  }

  async #request(shouldReport) {
    const response = await this.fetcher(this.versionUrl, {
      cache: 'no-store',
      headers: { accept: 'application/json' },
    });
    if (!response?.ok || typeof response.json !== 'function') {
      throw new Error(`Version check failed with HTTP ${response?.status ?? 'unknown'}.`);
    }
    const version = validateVersionPayload(await response.json());
    if (version.sha === this.currentSha) return { status: 'current', version };
    if (this.reported) return { status: 'already-reported', version };
    if (!shouldReport()) return { status: 'stopped', version };
    this.reported = true;
    this.onUpdate(Object.freeze({ ...version, url: this.versionUrl }));
    return { status: 'update-available', version };
  }

  check() {
    if (this.reported) return Promise.resolve({ status: 'already-reported', version: null });
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.#request(() => true).finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  async #cycle(generation) {
    try {
      if (this.inFlight) await this.inFlight;
      else {
        this.inFlight = this.#request(() => this.running && generation === this.generation);
        await this.inFlight;
      }
    } catch (error) {
      if (this.running && generation === this.generation) this.onError(error);
    } finally {
      this.inFlight = null;
    }
    if (!this.running || generation !== this.generation || this.reported) return;
    this.timer = this.setTimer(() => {
      this.timer = null;
      void this.#cycle(generation);
    }, this.intervalMs);
  }

  start() {
    if (this.running || this.reported) return this;
    this.running = true;
    const generation = ++this.generation;
    void this.#cycle(generation);
    return this;
  }

  stop() {
    this.running = false;
    this.generation += 1;
    if (this.timer !== null) this.clearTimer(this.timer);
    this.timer = null;
    return this;
  }
}
