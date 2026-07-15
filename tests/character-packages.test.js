import { describe, expect, it, vi } from 'vitest';
import {
  CharacterRegistry,
  hagridCharacterDefinition,
  hagridCharacterReview,
  hagridFullFrameCharacterDefinition,
  loadHagridCharacterRuntime,
  loadMadamMalkinCharacterRuntime,
  loadVioletCharacterRuntime,
  loadWandmakerCharacterRuntime,
  madamMalkinCharacterDefinition,
  madamMalkinCharacterReview,
  madamMalkinFullFrameCharacterDefinition,
  violetCharacterDefinition,
  violetCharacterReview,
  violetFullFrameCharacterDefinition,
  wandmakerCharacterDefinition,
  wandmakerCharacterReview,
  wandmakerFullFrameCharacterDefinition,
} from '../src/game/characters/index.js';
import { resolveFullFrameCharacterAnimation } from '../src/game/render/FullFrameCharacterRig.js';

const PACKAGES = [
  {
    definition: violetCharacterDefinition,
    source: violetFullFrameCharacterDefinition,
    review: violetCharacterReview,
    loadRuntime: loadVioletCharacterRuntime,
    loadModule: () => import('../src/game/characters/violet/runtime.js'),
    manifestExport: 'violetFullFrameCharacterManifest',
    runtimeExport: 'violetCharacterRuntime',
  },
  {
    definition: hagridCharacterDefinition,
    source: hagridFullFrameCharacterDefinition,
    review: hagridCharacterReview,
    loadRuntime: loadHagridCharacterRuntime,
    loadModule: () => import('../src/game/characters/hagrid/runtime.js'),
    manifestExport: 'hagridFullFrameCharacterManifest',
    runtimeExport: 'hagridCharacterRuntime',
  },
  {
    definition: wandmakerCharacterDefinition,
    source: wandmakerFullFrameCharacterDefinition,
    review: wandmakerCharacterReview,
    loadRuntime: loadWandmakerCharacterRuntime,
    loadModule: () => import('../src/game/characters/wandmaker/runtime.js'),
    manifestExport: 'wandmakerFullFrameCharacterManifest',
    runtimeExport: 'wandmakerCharacterRuntime',
  },
  {
    definition: madamMalkinCharacterDefinition,
    source: madamMalkinFullFrameCharacterDefinition,
    review: madamMalkinCharacterReview,
    loadRuntime: loadMadamMalkinCharacterRuntime,
    loadModule: () => import('../src/game/characters/madam-malkin/runtime.js'),
    manifestExport: 'madamMalkinFullFrameCharacterManifest',
    runtimeExport: 'madamMalkinCharacterRuntime',
  },
];

function authoredCapabilities(source) {
  const poses = new Set();
  const actions = new Set();
  for (const appearance of Object.values(source.appearances)) {
    Object.keys(appearance.clips).forEach((pose) => poses.add(pose));
    Object.keys(appearance.aliases ?? {}).forEach((pose) => poses.add(pose));
    Object.keys(appearance.actions ?? {}).forEach((action) => actions.add(action));
  }
  return {
    poses: [...poses].sort(),
    actions: [...actions].sort(),
  };
}

function assetPaths(definition) {
  return Object.values(definition.assets).map(({ path }) => path).sort();
}

describe('canonical full-frame character packages', () => {
  it('publishes immutable identity metadata and only actually authored capabilities', () => {
    expect(PACKAGES.map(({ definition }) => definition.id)).toEqual([
      'character.violet',
      'character.hagrid',
      'character.wandmaker',
      'character.madam-malkin',
    ]);

    for (const { definition, source, review } of PACKAGES) {
      const authored = authoredCapabilities(source);
      expect([...definition.capabilities.poses].sort()).toEqual(authored.poses);
      expect([...definition.capabilities.actions].sort()).toEqual(authored.actions);
      expect(definition.surfaces).toEqual(['world', 'portrait']);
      expect(definition.capabilities.supportsReducedMotion).toBe(true);
      expect(Object.isFrozen(definition)).toBe(true);
      expect(Object.isFrozen(definition.assets)).toBe(true);
      expect(Object.isFrozen(review)).toBe(true);
      expect(review.captureProfiles).toEqual([
        { width: 1280, height: 720 },
        { width: 2560, height: 1440 },
      ]);
    }

    expect(hagridCharacterDefinition.capabilities.actions).toEqual([]);
    expect(wandmakerCharacterDefinition.capabilities.actions).toEqual([]);
    expect(madamMalkinCharacterDefinition.capabilities.actions).toEqual([]);
    expect(violetCharacterDefinition.capabilities.actions).toEqual([
      'inspect',
      'wrong-wand-one',
      'wrong-wand-two',
      'chosen-wand',
      'receive-wand',
      'admire-robes',
      'broom-wonder',
    ]);
  });

  it('owns every runtime frame and Violet’s one retained casual walk source', async () => {
    for (const characterPackage of PACKAGES) {
      const runtimeModule = await characterPackage.loadModule();
      const manifest = runtimeModule[characterPackage.manifestExport];
      const declared = new Set(assetPaths(characterPackage.definition));
      for (const path of manifest.fullFrame.assetFiles) expect(declared, path).toContain(path);

      const retainedOnly = [...declared].filter((path) => !manifest.fullFrame.assetFiles.includes(path));
      expect(retainedOnly).toEqual(characterPackage.definition.id === 'character.violet'
        ? ['assets/art/characters/violet/casual/walk-pass.png']
        : []);
    }
  });

  it('loads registry-compatible runtimes without preloading unrelated identities', async () => {
    const registry = new CharacterRegistry();
    for (const { definition, loadRuntime } of PACKAGES) registry.register(definition, loadRuntime);
    registry.seal();

    expect(registry.ids()).toEqual(PACKAGES.map(({ definition }) => definition.id));
    expect(PACKAGES.every(({ definition }) => !registry.isLoaded(definition.id))).toBe(true);

    const runtime = await registry.loadRuntime('character.hagrid');
    expect(typeof runtime.renderers.world).toBe('function');
    expect(typeof runtime.renderers.portrait).toBe('function');
    expect(typeof runtime.preload).toBe('function');
    expect(typeof runtime.release).toBe('function');
    expect(registry.isLoaded('character.hagrid')).toBe(true);
    expect(registry.isLoaded('character.violet')).toBe(false);
  });

  it('keeps every declared pose and action resolvable by its full-frame manifest', async () => {
    for (const characterPackage of PACKAGES) {
      const runtimeModule = await characterPackage.loadModule();
      const manifest = runtimeModule[characterPackage.manifestExport];
      const { definition } = characterPackage;
      for (const appearance of definition.capabilities.appearances) {
        for (const pose of definition.capabilities.poses) {
          expect(() => resolveFullFrameCharacterAnimation(manifest, { appearance, pose }))
            .not.toThrow();
        }
        for (const action of definition.capabilities.actions) {
          expect(() => resolveFullFrameCharacterAnimation(manifest, {
            appearance,
            actorAnimation: { action, localTime: 0, progress: 0 },
          })).not.toThrow();
        }
      }
    }
  });

  it('translates explicit registry surfaces and actions into the legacy rig contract', async () => {
    const runtimeModule = await import('../src/game/characters/violet/runtime.js');
    const runtime = runtimeModule.violetCharacterRuntime;
    const draw = vi.spyOn(runtimeModule.violetFullFrameCharacterRig, 'draw')
      .mockReturnValue({ status: 'drawn' });
    const context = {};

    expect(runtime.renderers.portrait({
      context,
      time: 1.5,
      appearance: 'robes',
      pose: 'idle',
      action: 'chosen-wand',
      actionProgress: 0.5,
      outfit: 'casual',
      walking: true,
      actorAnimation: { action: 'unregistered-action' },
    })).toEqual({ status: 'drawn' });
    expect(draw).toHaveBeenCalledWith(context, {
      appearance: 'robes',
      pose: 'idle',
      actorAnimation: {
        action: 'chosen-wand',
        localTime: 1.5,
        progress: 0.5,
      },
      detail: 'portrait',
    }, 1.5);
    draw.mockRestore();
  });

  it('keeps chapter activation clip-scoped while review activation preloads every frame', async () => {
    const runtimeModule = await import('../src/game/characters/hagrid/runtime.js');
    const preload = vi.spyOn(runtimeModule.hagridFullFrameCharacterRig, 'preload')
      .mockResolvedValue();

    await runtimeModule.hagridCharacterRuntime.preload({ context: { chapterId: 'ch1' } });
    expect(preload).not.toHaveBeenCalled();

    await runtimeModule.hagridCharacterRuntime.preload({
      context: { chapterId: 'ch1', review: true },
    });
    expect(preload).toHaveBeenCalledOnce();
    preload.mockRestore();
  });

  it('keeps Violet robe recoloring owned once and re-exported at the old path', async () => {
    const identityModule = await import('../src/game/characters/violet/robeRecolor.js');
    const compatibilityModule = await import('../src/game/render/VioletRobeRecolor.js');

    expect(compatibilityModule.VioletRobeRecolorer).toBe(identityModule.VioletRobeRecolorer);
    expect(compatibilityModule.violetRobeRecolorer).toBe(identityModule.violetRobeRecolorer);
    expect(compatibilityModule.recolorVioletRobeFrame).toBe(identityModule.recolorVioletRobeFrame);
  });
});
