import { describe, expect, it, vi } from 'vitest';
import {
  CharacterRegistry,
  CharacterRegistryError,
  UnknownCharacterError,
  UnsupportedCharacterCapabilityError,
  UnsupportedCharacterSurfaceError,
  defineCharacter,
  validateCharacterDefinition,
} from '../src/game/characters/index.js';

function definition(id = 'character.violet', overrides = {}) {
  return {
    id,
    metadata: {
      displayName: 'Violet',
      kind: 'human',
      voiceRole: 'silent',
    },
    surfaces: ['world', 'portrait'],
    defaults: { appearance: 'casual', pose: 'idle' },
    capabilities: {
      appearances: ['casual', 'robes'],
      poses: ['idle', 'walking', 'speaking'],
      actions: ['receive-wand'],
      supportsReducedMotion: true,
    },
    bounds: {
      world: { x: 10, y: 6, width: 80, height: 144 },
      portrait: { x: 18, y: 4, width: 64, height: 62 },
    },
    assets: {
      'characters/violet/casual/idle': {
        path: 'assets/art/characters/violet/casual/idle.png',
        kind: 'image',
      },
    },
    ...overrides,
  };
}

function runtime(renderers = {}) {
  return {
    renderers: {
      world: vi.fn(() => 'world-frame'),
      portrait: vi.fn(() => 'portrait-frame'),
      ...renderers,
    },
  };
}

describe('CharacterDefinition', () => {
  it('clones and deeply freezes pure identity metadata, capabilities, bounds, and assets', () => {
    const source = definition();
    const character = defineCharacter(source);

    source.metadata.displayName = 'Changed outside';
    source.capabilities.poses.push('changed-outside');
    source.bounds.world.width = 1;

    expect(character.metadata.displayName).toBe('Violet');
    expect(character.capabilities.poses).not.toContain('changed-outside');
    expect(character.bounds.world.width).toBe(80);
    expect(Object.isFrozen(character)).toBe(true);
    expect(Object.isFrozen(character.capabilities.poses)).toBe(true);
    expect(Object.isFrozen(character.assets['characters/violet/casual/idle'])).toBe(true);
    expect(validateCharacterDefinition(character)).toBe(character);
  });

  it('rejects role aliases and internally inconsistent character data', () => {
    expect(() => defineCharacter(definition('npc.guide'))).toThrow(/stable identity identifier/);

    const unsupportedDefault = definition();
    unsupportedDefault.defaults = { appearance: 'winter', pose: 'idle' };
    expect(() => defineCharacter(unsupportedDefault)).toThrow(/unsupported appearance winter/);

    const missingBounds = definition();
    delete missingBounds.bounds.portrait;
    expect(() => defineCharacter(missingBounds)).toThrow(/bounds\.portrait: is required/);

    const referenceAsset = definition();
    referenceAsset.assets['characters/violet/casual/idle'].path = '../art/spikes/violet.png';
    expect(() => defineCharacter(referenceAsset)).toThrow(/parent path segments/);
  });
});

describe('CharacterRegistry identity and runtime boundaries', () => {
  it('rejects duplicate identities and resolves only explicitly declared compatibility aliases', () => {
    const registry = new CharacterRegistry({
      aliases: {
        'npc.guide': 'character.hagrid',
        'npc.guideLegacy': 'character.hagrid',
      },
    });
    registry.register(definition('character.hagrid'), async () => runtime());

    expect(registry.resolveId('character.hagrid')).toBe('character.hagrid');
    expect(registry.resolveId('npc.guide')).toBe('character.hagrid');
    expect(registry.resolveId('npc.guideLegacy')).toBe('character.hagrid');
    expect(registry.aliases()).toEqual({
      'npc.guide': 'character.hagrid',
      'npc.guideLegacy': 'character.hagrid',
    });
    expect(() => registry.resolveId('guide')).toThrow(UnknownCharacterError);
    expect(() => registry.register(definition('character.hagrid'), async () => runtime())).toThrow(
      /already registered/,
    );
  });

  it('validates alias targets when sealed and prevents later side-effect registration', () => {
    const unresolved = new CharacterRegistry({ aliases: { 'npc.guide': 'character.hagrid' } });
    expect(() => unresolved.seal()).toThrow(/targets unregistered character/);

    const registry = new CharacterRegistry();
    registry.register(definition(), async () => runtime()).seal();
    expect(registry.sealed).toBe(true);
    expect(() => registry.registerAlias('npc.violet', 'character.violet')).toThrow(/sealed/);
    expect(() => registry.register(definition('character.hagrid'), async () => runtime())).toThrow(/sealed/);
  });

  it('loads each runtime lazily once and requires an exact renderer for every declared surface', async () => {
    const characterRuntime = runtime();
    const loader = vi.fn(async () => ({ default: characterRuntime }));
    const registry = new CharacterRegistry();
    registry.register(definition(), loader);

    expect(loader).not.toHaveBeenCalled();
    expect(registry.getDefinition('character.violet').metadata.displayName).toBe('Violet');
    expect(registry.getBounds('character.violet', 'portrait')).toEqual({ x: 18, y: 4, width: 64, height: 62 });
    expect(loader).not.toHaveBeenCalled();

    const [first, second] = await Promise.all([
      registry.loadRuntime('character.violet'),
      registry.loadRuntime('character.violet'),
    ]);
    expect(first).toBe(second);
    expect(loader).toHaveBeenCalledTimes(1);

    const incomplete = new CharacterRegistry();
    incomplete.register(definition('character.hagrid'), async () => ({
      renderers: { world: vi.fn() },
    }));
    await expect(incomplete.loadRuntime('character.hagrid')).rejects.toThrow(/renderers\.portrait must be a function/);
  });

  it('dispatches world and portrait exactly while supplying canonical defaults', async () => {
    const characterRuntime = runtime();
    const registry = new CharacterRegistry({ aliases: { 'npc.violet': 'character.violet' } });
    registry.register(definition(), async () => characterRuntime);
    await registry.loadRuntime('character.violet');

    expect(registry.render('npc.violet', 'world', { x: 20 })).toBe('world-frame');
    expect(registry.render('character.violet', 'portrait', {
      appearance: 'robes',
      pose: 'speaking',
      action: 'receive-wand',
    })).toBe('portrait-frame');
    expect(characterRuntime.renderers.world).toHaveBeenCalledWith(expect.objectContaining({
      characterId: 'character.violet',
      surface: 'world',
      appearance: 'casual',
      pose: 'idle',
      action: null,
      x: 20,
    }), expect.objectContaining({ id: 'character.violet' }));
    expect(characterRuntime.renderers.portrait).toHaveBeenCalledTimes(1);
    expect(characterRuntime.renderers.world).toHaveBeenCalledTimes(1);
  });

  it('fails clearly for unknown identities, unloaded runtimes, surfaces, poses, appearances, and actions', async () => {
    const worldOnly = definition('character.post-owl', {
      surfaces: ['world'],
      bounds: { world: { x: 0, y: 0, width: 60, height: 48 } },
    });
    const registry = new CharacterRegistry();
    registry.register(worldOnly, async () => ({ renderers: { world: vi.fn() } }));

    expect(() => registry.getDefinition('character.missing')).toThrow(UnknownCharacterError);
    expect(() => registry.render('character.post-owl', 'world')).toThrow(/is not loaded/);
    await registry.loadRuntime('character.post-owl');
    expect(() => registry.render('character.post-owl', 'portrait')).toThrow(UnsupportedCharacterSurfaceError);
    expect(() => registry.render('character.post-owl', 'world', { appearance: 'winter' })).toThrow(
      UnsupportedCharacterCapabilityError,
    );
    expect(() => registry.render('character.post-owl', 'world', { pose: 'flight' })).toThrow(
      /does not support pose "flight"/,
    );
    expect(() => registry.render('character.post-owl', 'world', { action: 'deliver' })).toThrow(
      /does not support action "deliver"/,
    );
  });
});

describe('CharacterRegistry dependency scopes', () => {
  it('preloads and releases only requested character dependencies, with aliases deduplicated', async () => {
    const lifecycle = new Map();
    const loaders = new Map();
    const registry = new CharacterRegistry({ aliases: { 'npc.guide': 'character.hagrid' } });
    for (const characterId of ['character.violet', 'character.hagrid', 'character.wandmaker']) {
      const preload = vi.fn();
      const release = vi.fn();
      lifecycle.set(characterId, { preload, release });
      const loader = vi.fn(async () => ({ ...runtime(), preload, release }));
      loaders.set(characterId, loader);
      registry.register(definition(characterId), loader);
    }

    const dependencies = await registry.preload([
      'character.violet',
      'npc.guide',
      'character.hagrid',
    ], { chapterId: 'ch1' });

    expect(dependencies).toEqual(['character.violet', 'character.hagrid']);
    expect(loaders.get('character.violet')).toHaveBeenCalledTimes(1);
    expect(loaders.get('character.hagrid')).toHaveBeenCalledTimes(1);
    expect(loaders.get('character.wandmaker')).not.toHaveBeenCalled();
    expect(lifecycle.get('character.violet').preload).toHaveBeenCalledWith(expect.objectContaining({
      characterId: 'character.violet',
      context: { chapterId: 'ch1' },
    }));

    await registry.preload(['character.violet']);
    await registry.release(['character.violet']);
    expect(lifecycle.get('character.violet').release).not.toHaveBeenCalled();

    await registry.release(dependencies, { chapterId: 'ch1' });
    expect(lifecycle.get('character.violet').release).toHaveBeenCalledTimes(1);
    expect(lifecycle.get('character.hagrid').release).toHaveBeenCalledTimes(1);
    expect(lifecycle.get('character.wandmaker').release).not.toHaveBeenCalled();
    await expect(registry.release(['character.violet'])).rejects.toThrow(CharacterRegistryError);
  });
});
