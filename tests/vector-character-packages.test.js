import { describe, expect, it } from 'vitest';
import {
  catCharacterDefinition,
  catCharacterModule,
  loadCatCharacterRuntime,
} from '../src/game/characters/cat/index.js';
import { sampleCatMotion } from '../src/game/characters/cat/runtime.js';
import {
  loadNarratorCharacterRuntime,
  narratorCharacterDefinition,
  narratorCharacterModule,
} from '../src/game/characters/narrator/index.js';
import {
  loadToadCharacterRuntime,
  toadCharacterDefinition,
  toadCharacterModule,
} from '../src/game/characters/toad/index.js';
import { sampleToadMotion } from '../src/game/characters/toad/runtime.js';

function recordingContext() {
  const calls = [];
  let depth = 0;
  const methods = new Set([
    'beginPath', 'bezierCurveTo', 'clip', 'closePath', 'fill', 'lineTo', 'moveTo',
    'quadraticCurveTo', 'restore', 'rotate', 'save', 'scale', 'stroke', 'translate',
  ]);
  const target = {
    globalAlpha: 1,
    calls,
    get depth() { return depth; },
  };
  return new Proxy(target, {
    get(object, property) {
      if (!methods.has(property)) return object[property];
      return (...args) => {
        calls.push([property, ...args]);
        if (property === 'save') depth += 1;
        if (property === 'restore') depth -= 1;
      };
    },
    set(object, property, value) {
      object[property] = value;
      return true;
    },
  });
}

const PACKAGES = [
  {
    definition: narratorCharacterDefinition,
    module: narratorCharacterModule,
    id: 'character.narrator',
    surfaces: ['portrait'],
    poses: ['idle', 'speaking'],
  },
  {
    definition: catCharacterDefinition,
    module: catCharacterModule,
    id: 'character.cat',
    surfaces: ['world', 'portrait'],
    poses: ['idle', 'follow', 'pet-follow', 'paw'],
  },
  {
    definition: toadCharacterDefinition,
    module: toadCharacterModule,
    id: 'character.toad',
    surfaces: ['world', 'portrait'],
    poses: ['idle', 'follow', 'pet-follow'],
  },
];

describe('vector character identity packages', () => {
  it('publishes immutable definitions with only authored surfaces and poses', () => {
    for (const {
      definition, module, id, surfaces, poses,
    } of PACKAGES) {
      expect(definition.id).toBe(id);
      expect(definition.surfaces).toEqual(surfaces);
      expect(definition.capabilities.poses).toEqual(poses);
      expect(definition.capabilities.supportsReducedMotion).toBe(true);
      expect(definition.assets).toEqual({});
      expect(Object.isFrozen(definition)).toBe(true);
      expect(module.definition).toBe(definition);
      expect(module.reviews).toEqual([]);
    }
  });

  it('loads each runtime lazily through a stable package-local loader', async () => {
    const loaders = [
      loadNarratorCharacterRuntime,
      loadCatCharacterRuntime,
      loadToadCharacterRuntime,
    ];
    for (const loadRuntime of loaders) {
      const first = await loadRuntime();
      const second = await loadRuntime();
      expect(first).toBe(second);
      expect(Object.isFrozen(first)).toBe(true);
      expect(Object.isFrozen(first.renderers)).toBe(true);
    }
  });

  it('renders deterministic world and portrait calls without leaking context state', async () => {
    const cases = [
      [await loadNarratorCharacterRuntime(), 'portrait', { pose: 'speaking' }],
      [await loadCatCharacterRuntime(), 'world', { x: 20, y: 80, pose: 'pet-follow' }],
      [await loadCatCharacterRuntime(), 'portrait', { pose: 'idle' }],
      [await loadToadCharacterRuntime(), 'world', { x: 20, y: 80, pose: 'pet-follow' }],
      [await loadToadCharacterRuntime(), 'portrait', { pose: 'idle' }],
    ];
    for (const [runtime, surface, state] of cases) {
      const first = recordingContext();
      const repeated = recordingContext();
      runtime.renderers[surface]({ context: first, time: 1.375, ...state });
      runtime.renderers[surface]({ context: repeated, time: 1.375, ...state });
      expect(first.calls).toEqual(repeated.calls);
      expect(first.depth).toBe(0);
      expect(first.calls.length).toBeGreaterThan(25);
      expect(first.calls.every(([, ...values]) => values.every(
        (value) => typeof value !== 'number' || Number.isFinite(value),
      ))).toBe(true);
    }
  });

  it('samples calmer reduced motion and rejects invalid render state', async () => {
    for (const sample of [sampleCatMotion, sampleToadMotion]) {
      const full = sample({ pose: 'pet-follow', time: 0.25 });
      const reduced = sample({ pose: 'pet-follow', time: 0.25, reducedMotion: true });
      expect(reduced.hop).toBeLessThan(full.hop);
      expect(Math.abs(reduced.tilt)).toBeLessThan(Math.abs(full.tilt));
    }
    const catRuntime = await loadCatCharacterRuntime();
    expect(() => catRuntime.renderers.world({ time: 0 })).toThrow(/drawing context/);
    expect(() => catRuntime.renderers.world({
      context: recordingContext(), scale: 0,
    })).toThrow(/greater than zero/);
    expect(() => catRuntime.renderers.world({
      context: recordingContext(), facing: 'up',
    })).toThrow(/left or right/);
  });
});
