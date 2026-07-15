import { CharacterRegistry } from './CharacterRegistry.js';
import { CharacterModule, defineCharacterModule } from './CharacterModule.js';

export class CharacterCatalogError extends Error {
  constructor(path, message) {
    super(`${path}: ${message}`);
    this.name = 'CharacterCatalogError';
    this.path = path;
  }
}

function fail(path, message) {
  throw new CharacterCatalogError(path, message);
}

function normalizeModules(value) {
  if (!Array.isArray(value)) fail('characterCatalog.modules', 'must be an array');
  return value.map((entry) => (entry instanceof CharacterModule ? entry : defineCharacterModule(entry)));
}

function collectModules(modules) {
  const byId = new Map();
  const assetOwners = new Map();
  const assets = {};
  const reviewOwners = new Map();
  const reviews = {};

  modules.forEach((characterModule, moduleIndex) => {
    const modulePath = `characterCatalog.modules[${moduleIndex}]`;
    if (byId.has(characterModule.id)) {
      fail(`${modulePath}.definition.id`, `duplicates ${characterModule.id}, first declared at ${byId.get(characterModule.id).path}`);
    }
    byId.set(characterModule.id, { module: characterModule, path: modulePath });

    for (const [assetKey, asset] of Object.entries(characterModule.definition.assets)) {
      if (assetOwners.has(assetKey)) {
        fail(
          `${modulePath}.definition.assets.${assetKey}`,
          `duplicates asset key ${assetKey}, first declared by ${assetOwners.get(assetKey)}`,
        );
      }
      assetOwners.set(assetKey, characterModule.id);
      assets[assetKey] = Object.freeze({ ...asset });
    }

    characterModule.reviews.forEach((registration, reviewIndex) => {
      if (reviewOwners.has(registration.sceneId)) {
        fail(
          `${modulePath}.reviews[${reviewIndex}].sceneId`,
          `duplicates review scene ${registration.sceneId}, first declared by ${reviewOwners.get(registration.sceneId)}`,
        );
      }
      reviewOwners.set(registration.sceneId, characterModule.id);
      reviews[registration.sceneId] = registration;
    });
  });

  return {
    byId,
    assets: Object.freeze(assets),
    reviews: Object.freeze(reviews),
  };
}

function buildRegistry(modules) {
  const registry = new CharacterRegistry();
  for (const characterModule of modules) {
    registry.register(characterModule.definition, characterModule.loadRuntime);
  }
  return registry.seal();
}

export class CharacterCatalog {
  #modulesById;

  constructor(modules) {
    const normalized = normalizeModules(modules);
    const collected = collectModules(normalized);
    this.#modulesById = new Map([...collected.byId].map(([id, entry]) => [id, entry.module]));
    this.modules = Object.freeze([...normalized]);
    this.assets = collected.assets;
    this.reviews = collected.reviews;
    this.registry = buildRegistry(normalized);
    Object.freeze(this);
  }

  ids() {
    return Object.freeze([...this.#modulesById.keys()]);
  }

  getModule(reference) {
    return this.#modulesById.get(this.registry.resolveId(reference));
  }

  getReview(sceneId) {
    return this.reviews[sceneId] ?? null;
  }

  resolveDependencies(dependencies) {
    return this.registry.resolveDependencies(dependencies);
  }

  async activateDependencies(dependencies, context = undefined) {
    return this.registry.preload(dependencies, context);
  }

  async releaseDependencies(dependencies, context = undefined) {
    return this.registry.release(dependencies, context);
  }

  async activate(dependencies, context = undefined) {
    const characterIds = await this.activateDependencies(dependencies, context);
    let active = true;
    return Object.freeze({
      characterIds,
      release: async () => {
        if (!active) fail('character activation', 'has already been released');
        active = false;
        try {
          await this.releaseDependencies(characterIds, context);
        } catch (error) {
          active = true;
          throw error;
        }
      },
    });
  }
}

export function buildCharacterCatalog(modules) {
  return new CharacterCatalog(modules);
}
