import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  CharacterReviewDescriptorRegistry,
  defineCharacterReviewDescriptor,
} from '../src/game/characters/CharacterReviewDescriptor.js';
import { productionCharacterCatalog } from '../src/game/characters/productionCatalog.js';
import { RegisteredCharacterReviewRenderer } from '../src/harness/RegisteredCharacterReviewRenderer.js';
import {
  productionCharacterReviewCatalog,
  productionCharacterReviewDescriptors,
} from '../src/harness/productionCharacterReviewCatalog.js';
import { getStateFixture } from '../src/harness/stateFixtures.js';

const EXPECTED_SCENES = Object.freeze([
  'character-cast-review',
  'character-pets-review',
  'character-portraits-review',
  'owl-motion-review',
  'hagrid-sprite-review',
  'wandmaker-sprite-review',
  'madam-malkin-sprite-review',
  'menagerie-keeper-sprite-review',
  'violet-expression-review',
]);

function entry(overrides = {}) {
  return {
    id: 'review.entry',
    characterId: 'character.violet',
    surface: 'world',
    state: { x: 10, y: 20, pose: 'idle' },
    stateAtTime: null,
    timeOffset: 0,
    inheritReducedMotion: false,
    label: null,
    surround: null,
    ...overrides,
  };
}

function descriptor(overrides = {}) {
  return {
    sceneId: 'review.scene',
    title: 'Review scene',
    characterDependencies: ['character.violet'],
    entries: [entry()],
    ...overrides,
  };
}

function drawingContext() {
  const gradient = Object.freeze({ addColorStop: vi.fn() });
  return new Proxy({}, {
    get(object, property) {
      if (property === 'createLinearGradient') return () => gradient;
      if (property in object) return object[property];
      return () => undefined;
    },
    set(object, property, value) {
      object[property] = value;
      return true;
    },
  });
}

describe('registered character review scenes', () => {
  it('publishes the nine preserved exact scene IDs as immutable descriptors', () => {
    expect(productionCharacterReviewCatalog.sceneIds).toEqual(EXPECTED_SCENES);
    expect(Object.isFrozen(productionCharacterReviewCatalog.sceneIds)).toBe(true);
    expect(Object.isFrozen(productionCharacterReviewDescriptors)).toBe(true);

    for (const sceneId of EXPECTED_SCENES) {
      const review = productionCharacterReviewCatalog.get(sceneId);
      expect(review.sceneId).toBe(sceneId);
      expect(Object.isFrozen(review)).toBe(true);
      expect(Object.isFrozen(review.characterDependencies)).toBe(true);
      expect(Object.isFrozen(review.entries)).toBe(true);
      expect(review.entries.every((reviewEntry) => Object.isFrozen(reviewEntry))).toBe(true);
      expect(getStateFixture(sceneId).characterDependencies)
        .toEqual(review.characterDependencies);
    }
  });

  it('rejects duplicate descriptors, entries, dependencies, and undeclared characters', () => {
    const review = defineCharacterReviewDescriptor(descriptor());
    expect(() => new CharacterReviewDescriptorRegistry([review, review]))
      .toThrow(/duplicates review\.scene/u);
    expect(() => defineCharacterReviewDescriptor(descriptor({
      entries: [entry(), entry()],
    }))).toThrow(/duplicates review\.entry/u);
    expect(() => defineCharacterReviewDescriptor(descriptor({
      characterDependencies: ['character.violet', 'character.violet'],
    }))).toThrow(/duplicates character\.violet/u);
    expect(() => defineCharacterReviewDescriptor(descriptor({
      entries: [entry({ characterId: 'character.hagrid' })],
    }))).toThrow(/undeclared dependency character\.hagrid/u);
  });

  it('links every declared participant to an exact production identity', () => {
    for (const review of productionCharacterReviewDescriptors) {
      for (const characterId of review.characterDependencies) {
        expect(productionCharacterCatalog.registry.getDefinition(characterId).id)
          .toBe(characterId);
      }
      for (const reviewEntry of review.entries) {
        expect(review.characterDependencies).toContain(reviewEntry.characterId);
        expect(['world', 'portrait']).toContain(reviewEntry.surface);
      }
    }
  });

  it('executes descriptors generically with their exact identities and surfaces', () => {
    const draw = vi.fn();
    const renderer = new RegisteredCharacterReviewRenderer({
      characterRenderer: { draw },
      descriptors: productionCharacterReviewCatalog,
    });
    const context = drawingContext();

    expect(renderer.drawReviewScene(context, 'not-a-review', 1)).toBe(false);
    expect(draw).not.toHaveBeenCalled();

    for (const sceneId of EXPECTED_SCENES) {
      draw.mockClear();
      const review = productionCharacterReviewCatalog.get(sceneId);
      expect(renderer.drawReviewScene(context, sceneId, 1.25, { reducedMotion: true }))
        .toBe(true);
      expect(draw).toHaveBeenCalledTimes(review.entries.length);
      review.entries.forEach((reviewEntry, index) => {
        const [, request, renderTime] = draw.mock.calls[index];
        expect(request.characterId).toBe(reviewEntry.characterId);
        expect(request.surface).toBe(reviewEntry.surface);
        expect(renderTime).toBe(1.25 + reviewEntry.timeOffset);
      });
    }
  });

  it('keeps named review routing out of the generic executor and harness boot', () => {
    const executorSource = readFileSync(
      new URL('../src/harness/RegisteredCharacterReviewRenderer.js', import.meta.url),
      'utf8',
    );
    const bootSource = readFileSync(new URL('../src/harness/boot.js', import.meta.url), 'utf8');
    expect(executorSource).not.toMatch(/character\.[a-z]/u);
    for (const sceneId of EXPECTED_SCENES) {
      expect(executorSource).not.toContain(sceneId);
      expect(bootSource).not.toContain(sceneId);
    }
    expect(bootSource).not.toContain("from '../game/render/CharacterRenderer.js'");
    expect(bootSource).not.toMatch(/new CharacterRenderer\b/u);
    expect(bootSource).not.toContain('preloadCharacterReviewScene');
  });
});
