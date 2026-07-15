import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import {
  CharacterRegistry,
  UnsupportedCharacterCapabilityError,
  UnsupportedCharacterSurfaceError,
} from '../src/game/characters/CharacterRegistry.js';
import {
  loadPetOwlCharacterRuntime,
  petOwlCharacterDefinition,
  petOwlCharacterModule,
  petOwlCharacterReview,
} from '../src/game/characters/pet-owl/index.js';
import {
  loadPostOwlCharacterRuntime,
  postOwlCharacterDefinition,
  postOwlCharacterModule,
  postOwlCharacterReview,
} from '../src/game/characters/post-owl/index.js';
import * as legacyOwl from '../src/game/characters/owl/legacyCompatibility.js';
import * as compatibilityOwl from '../src/game/render/OwlRenderer.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function recordingContext() {
  const calls = [];
  const styles = [];
  const lineWidths = [];
  let depth = 0;
  const methods = new Set([
    'beginPath', 'bezierCurveTo', 'clip', 'closePath', 'fill', 'lineTo', 'moveTo',
    'quadraticCurveTo', 'restore', 'rotate', 'save', 'scale', 'stroke', 'translate',
  ]);
  const target = {
    calls,
    styles,
    lineWidths,
    globalAlpha: 1,
    get depth() { return depth; },
  };
  return new Proxy(target, {
    get(object, property) {
      if (methods.has(property)) {
        return (...args) => {
          calls.push([property, ...args]);
          if (property === 'save') depth += 1;
          if (property === 'restore') depth -= 1;
        };
      }
      return object[property];
    },
    set(object, property, value) {
      if (property === 'fillStyle' || property === 'strokeStyle') styles.push([property, value]);
      if (property === 'lineWidth' && Number.isFinite(value)) lineWidths.push(value);
      object[property] = value;
      return true;
    },
  });
}

function recordedFrame() {
  const context = recordingContext();
  return {
    context,
    snapshot: () => ({
      calls: context.calls,
      styles: context.styles,
      lineWidths: context.lineWidths,
      depth: context.depth,
      globalAlpha: context.globalAlpha,
    }),
  };
}

function captureFailure(callback) {
  try {
    callback();
    throw new Error('Expected callback to fail.');
  } catch (error) {
    return { name: error.name, message: error.message, error };
  }
}

describe('owl identity definitions', () => {
  it('publishes immutable, asset-free definitions with only currently rendered surfaces and states', () => {
    expect(postOwlCharacterDefinition).toMatchObject({
      id: 'character.post-owl',
      surfaces: ['world'],
      defaults: { appearance: 'post', pose: 'perch' },
      capabilities: {
        appearances: ['post'],
        poses: ['perch', 'takeoff', 'delivery', 'flight', 'settle'],
        actions: [],
        supportsReducedMotion: true,
      },
      bounds: {
        world: { x: -120, y: -155, width: 240, height: 175 },
      },
      assets: {},
    });
    expect(petOwlCharacterDefinition).toMatchObject({
      id: 'character.pet-owl',
      surfaces: ['world', 'portrait'],
      defaults: { appearance: 'pet', pose: 'idle' },
      capabilities: {
        appearances: ['pet'],
        poses: ['idle', 'perch', 'pet-follow'],
        actions: [],
        supportsReducedMotion: true,
      },
      bounds: {
        world: { x: -80, y: -135, width: 160, height: 155 },
        portrait: { x: -80, y: -135, width: 160, height: 155 },
      },
      assets: {},
    });

    for (const definition of [postOwlCharacterDefinition, petOwlCharacterDefinition]) {
      expect(Object.isFrozen(definition)).toBe(true);
      expect(Object.isFrozen(definition.capabilities.poses)).toBe(true);
      expect(Object.isFrozen(definition.bounds)).toBe(true);
      expect(Object.isFrozen(definition.assets)).toBe(true);
      expect(JSON.parse(JSON.stringify(definition))).toEqual({ ...definition });
    }
  });

  it('assigns each identity only the review scenes that actually render it', () => {
    expect(postOwlCharacterReview).toEqual({
      sceneIds: ['owl-motion-review'],
      captureProfiles: [
        { width: 1280, height: 720 },
        { width: 2560, height: 1440 },
      ],
    });
    expect(petOwlCharacterReview).toEqual({
      sceneIds: [
        'character-pets-review',
        'character-portraits-review',
        'owl-motion-review',
      ],
      captureProfiles: [
        { width: 1280, height: 720 },
        { width: 2560, height: 1440 },
      ],
    });
    expect(postOwlCharacterModule).toMatchObject({
      id: 'character.post-owl',
      definition: postOwlCharacterDefinition,
      loadRuntime: loadPostOwlCharacterRuntime,
    });
    expect(postOwlCharacterModule.reviews).toEqual([
      expect.objectContaining({ sceneId: 'owl-motion-review' }),
    ]);
    expect(petOwlCharacterModule).toMatchObject({
      id: 'character.pet-owl',
      definition: petOwlCharacterDefinition,
      loadRuntime: loadPetOwlCharacterRuntime,
    });
    expect(petOwlCharacterModule.reviews).toEqual([]);
  });
});

describe('owl character runtimes', () => {
  it('loads each vector runtime lazily and releases its asset-free dependency scope cleanly', async () => {
    const postLoader = vi.fn(loadPostOwlCharacterRuntime);
    const petLoader = vi.fn(loadPetOwlCharacterRuntime);
    const registry = new CharacterRegistry();
    registry.register(postOwlCharacterDefinition, postLoader);
    registry.register(petOwlCharacterDefinition, petLoader);
    registry.seal();

    expect(registry.getBounds('character.post-owl', 'world')).toEqual(
      postOwlCharacterDefinition.bounds.world,
    );
    expect(postLoader).not.toHaveBeenCalled();
    expect(petLoader).not.toHaveBeenCalled();

    const active = await registry.preload(['character.post-owl'], { chapterId: 'ch1' });
    expect(active).toEqual(['character.post-owl']);
    expect(postLoader).toHaveBeenCalledOnce();
    expect(petLoader).not.toHaveBeenCalled();
    const postRuntime = await registry.loadRuntime('character.post-owl');
    expect(postRuntime.preload()).toBeUndefined();
    expect(postRuntime.release()).toBeUndefined();

    await registry.release(active, { chapterId: 'ch1' });
    expect(registry.isLoaded('character.post-owl')).toBe(true);
    await registry.preload(['character.post-owl']);
    expect(postLoader).toHaveBeenCalledOnce();
    await registry.release(['character.post-owl']);
  });

  it('fails with exact identity-specific errors for every unsupported surface and state', async () => {
    const registry = new CharacterRegistry();
    registry.register(postOwlCharacterDefinition, loadPostOwlCharacterRuntime);
    registry.register(petOwlCharacterDefinition, loadPetOwlCharacterRuntime);
    await registry.loadRuntime('character.post-owl');
    await registry.loadRuntime('character.pet-owl');

    const postPortrait = captureFailure(() => (
      registry.render('character.post-owl', 'portrait', {})
    ));
    expect(postPortrait.error).toBeInstanceOf(UnsupportedCharacterSurfaceError);
    expect(postPortrait).toMatchObject({
      name: 'UnsupportedCharacterSurfaceError',
      message: 'Character "character.post-owl" does not support the "portrait" surface. Supported surfaces: world.',
    });

    const postAppearance = captureFailure(() => (
      registry.render('character.post-owl', 'world', { appearance: 'pet' })
    ));
    expect(postAppearance.error).toBeInstanceOf(UnsupportedCharacterCapabilityError);
    expect(postAppearance).toMatchObject({
      name: 'UnsupportedCharacterCapabilityError',
      message: 'Character "character.post-owl" does not support appearance "pet". Supported appearance values: post.',
    });

    const postPose = captureFailure(() => (
      registry.render('character.post-owl', 'world', { pose: 'idle' })
    ));
    expect(postPose.error).toBeInstanceOf(UnsupportedCharacterCapabilityError);
    expect(postPose).toMatchObject({
      name: 'UnsupportedCharacterCapabilityError',
      message: 'Character "character.post-owl" does not support pose "idle". Supported pose values: perch, takeoff, delivery, flight, settle.',
    });

    const postAction = captureFailure(() => (
      registry.render('character.post-owl', 'world', { action: 'release-letter' })
    ));
    expect(postAction.error).toBeInstanceOf(UnsupportedCharacterCapabilityError);
    expect(postAction).toMatchObject({
      name: 'UnsupportedCharacterCapabilityError',
      message: 'Character "character.post-owl" does not support action "release-letter". Supported action values: (none).',
    });

    const petPose = captureFailure(() => (
      registry.render('character.pet-owl', 'world', { pose: 'flight' })
    ));
    expect(petPose.error).toBeInstanceOf(UnsupportedCharacterCapabilityError);
    expect(petPose).toMatchObject({
      name: 'UnsupportedCharacterCapabilityError',
      message: 'Character "character.pet-owl" does not support pose "flight". Supported pose values: idle, perch, pet-follow.',
    });
  });

  it('renders both identities with exactly the legacy world output in full and reduced motion', async () => {
    const postRuntime = await loadPostOwlCharacterRuntime();
    const petRuntime = await loadPetOwlCharacterRuntime();
    const cases = [
      {
        variant: 'post',
        surface: 'world',
        runtime: postRuntime,
        state: {
          appearance: 'post', pose: 'delivery', x: 280, y: 340, scale: 1.04,
          facing: 'right', lightSide: 'right', lookX: -0.45, lookY: 0.2,
        },
      },
      {
        variant: 'post',
        surface: 'world',
        runtime: postRuntime,
        state: {
          appearance: 'post', pose: 'flight', x: 280, y: 340, scale: 1.04,
          facing: 'left', lightSide: 'left', reducedMotion: true,
        },
      },
      {
        variant: 'pet',
        surface: 'world',
        runtime: petRuntime,
        state: {
          appearance: 'pet', pose: 'pet-follow', x: 420, y: 510, scale: 0.92,
          facing: 'left', lightSide: 'right', lookX: 0.55, lookY: -0.15,
        },
      },
    ];

    for (const entry of cases) {
      const legacy = recordedFrame();
      const packaged = recordedFrame();
      const { appearance: _appearance, ...legacyState } = entry.state;
      legacyOwl.drawVectorOwl(legacy.context, {
        ...legacyState,
        variant: entry.variant,
      }, 3.875);
      entry.runtime.renderers[entry.surface]({
        context: packaged.context,
        time: 3.875,
        ...entry.state,
      });

      expect(packaged.snapshot()).toEqual(legacy.snapshot());
      expect(packaged.context.depth).toBe(0);
    }
  });

  it('keeps the old renderer path as a thin compatibility re-export', async () => {
    expect(compatibilityOwl.drawOwlBookplate).toBe(legacyOwl.drawOwlBookplate);
    expect(compatibilityOwl.drawVectorOwl).toBe(legacyOwl.drawVectorOwl);
    expect(compatibilityOwl.sampleOwlDelivery).toBe(legacyOwl.sampleOwlDelivery);
    expect(compatibilityOwl.sampleOwlMotion).toBe(legacyOwl.sampleOwlMotion);

    const source = await readFile(resolve(ROOT, 'src/game/render/OwlRenderer.js'), 'utf8');
    expect(source).not.toMatch(/\bfunction\b|\bclass\b/);
    expect(source.trim().split('\n')).toHaveLength(6);
  });
});
