export function resolveServiceWorkerUrl(baseUrl, locationHref) {
  const base = new URL(baseUrl || './', locationHref);
  return new URL('service-worker.js', base).href;
}

function serviceWorkerScope(baseUrl, locationHref) {
  return new URL(baseUrl || './', locationHref);
}

function waitForEvent(target, type, {
  timeoutMs,
  setTimer,
  clearTimer,
} = {}) {
  if (typeof target?.addEventListener !== 'function') return Promise.resolve(false);
  return new Promise((resolve) => {
    let settled = false;
    let timer = null;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      if (timer !== null) clearTimer(timer);
      target.removeEventListener?.(type, onEvent);
      resolve(value);
    };
    const onEvent = () => finish(true);
    target.addEventListener(type, onEvent, { once: true });
    timer = setTimer(() => finish(false), timeoutMs);
  });
}

async function waitingWorker(registration, timers) {
  if (registration?.waiting) return registration.waiting;
  const installing = registration?.installing;
  if (!installing) return null;
  if (installing.state === 'installed') return registration.waiting ?? installing;
  await waitForEvent(installing, 'statechange', timers);
  return registration.waiting ?? (installing.state === 'installed' ? installing : null);
}

export async function registerGameServiceWorker({
  navigatorRef = globalThis.navigator,
  locationHref = globalThis.location?.href,
  baseUrl = import.meta.env.BASE_URL,
  production = import.meta.env.PROD,
  logger = globalThis.console,
} = {}) {
  if (!production || !navigatorRef?.serviceWorker?.register || !locationHref) {
    return Object.freeze({ status: 'unsupported', registration: null });
  }

  try {
    const url = resolveServiceWorkerUrl(baseUrl, locationHref);
    const scope = serviceWorkerScope(baseUrl, locationHref).pathname;
    const registration = await navigatorRef.serviceWorker.register(url, {
      scope,
      updateViaCache: 'none',
    });
    return Object.freeze({ status: 'registered', registration });
  } catch (error) {
    logger?.warn?.('Offline game caching could not start; continuing with normal network loading.', error);
    return Object.freeze({ status: 'failed', registration: null, error });
  }
}

/**
 * Promotes an installed update only after the player accepts the calm-moment
 * reload offer. Navigation remains network-first as a fallback, so Reload still
 * reaches the deployed build when no waiting worker is observable yet.
 */
export async function activateGameServiceWorkerUpdate({
  navigatorRef = globalThis.navigator,
  locationHref = globalThis.location?.href,
  baseUrl = import.meta.env.BASE_URL,
  reload = () => globalThis.location?.reload?.(),
  timeoutMs = 4_000,
  setTimer = globalThis.setTimeout?.bind(globalThis),
  clearTimer = globalThis.clearTimeout?.bind(globalThis),
  logger = globalThis.console,
} = {}) {
  if (typeof reload !== 'function') throw new TypeError('Service worker update activation requires reload().');
  if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
    throw new TypeError('Service worker update activation timeoutMs must be non-negative.');
  }
  if (typeof setTimer !== 'function' || typeof clearTimer !== 'function') {
    throw new TypeError('Service worker update activation requires timer functions.');
  }

  const serviceWorker = navigatorRef?.serviceWorker;
  if (!serviceWorker || !locationHref) {
    reload();
    return Object.freeze({ status: 'reloading', registration: null });
  }

  let registration = null;
  try {
    const scope = serviceWorkerScope(baseUrl, locationHref);
    if (typeof serviceWorker.getRegistration === 'function') {
      registration = await serviceWorker.getRegistration(scope.href);
    }
    if (!registration && typeof serviceWorker.register === 'function') {
      registration = await serviceWorker.register(
        resolveServiceWorkerUrl(baseUrl, locationHref),
        { scope: scope.pathname, updateViaCache: 'none' },
      );
    } else if (typeof registration?.update === 'function') {
      await registration.update();
    }

    const worker = await waitingWorker(registration, {
      timeoutMs,
      setTimer,
      clearTimer,
    });
    if (!worker || typeof worker.postMessage !== 'function') {
      reload();
      return Object.freeze({ status: 'reloading', registration });
    }

    const controllerChanged = waitForEvent(serviceWorker, 'controllerchange', {
      timeoutMs,
      setTimer,
      clearTimer,
    });
    worker.postMessage({ type: 'SKIP_WAITING' });
    const activated = await controllerChanged;
    reload();
    return Object.freeze({
      status: activated ? 'activated-and-reloading' : 'activation-timeout-reloading',
      registration,
    });
  } catch (error) {
    logger?.warn?.('The cached game update could not activate before reload.', error);
    reload();
    return Object.freeze({ status: 'failed-and-reloading', registration, error });
  }
}
