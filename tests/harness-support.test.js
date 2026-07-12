import { describe, expect, it } from 'vitest';
import {
  ImmutableRegistry,
  cloneFixture,
  deepFreeze,
} from '../src/harness/registry.js';
import {
  STATE_FIXTURE_IDS,
  cloneStateFixture,
  getStateFixture,
  validateStateFixture,
} from '../src/harness/stateFixtures.js';
import {
  ACTION_FIXTURE_IDS,
  cloneActionFixture,
  getActionFixture,
  validateActionFixture,
} from '../src/harness/actionFixtures.js';
import {
  APPROVED_CAPTURE_ENVIRONMENT,
  assertEnvironmentIdentity,
  environmentIdentityId,
  validateEnvironmentIdentity,
} from '../src/harness/environment.js';
import {
  actionsThroughFrame,
  parseHarnessRequest,
  resolveHarnessScenario,
} from '../src/harness/boot.js';
import { validateSaveV1 } from '../src/game/systems/Save.js';

describe('ImmutableRegistry', () => {
  it('freezes registered values, clones them for consumers, and rejects duplicate ids', () => {
    const registry = new ImmutableRegistry('test', () => {});
    registry.register('example', { nested: { value: 1 } });
    expect(Object.isFrozen(registry.get('example'))).toBe(true);
    expect(Object.isFrozen(registry.get('example').nested)).toBe(true);
    expect(() => registry.register('example', {})).toThrow(/already registered/);

    const clone = registry.clone('example');
    clone.nested.value = 2;
    expect(registry.get('example').nested.value).toBe(1);
  });

  it('seals registrations and reports available fixtures for unknown ids', () => {
    const registry = new ImmutableRegistry('test', () => {});
    registry.register('one', {}).seal();
    expect(() => registry.register('two', {})).toThrow(/sealed/);
    expect(() => registry.get('missing')).toThrow(/Available fixtures: one/);
  });

  it('deep-freezes cyclic data and clones ordinary fixture data', () => {
    const cyclic = {};
    cyclic.self = cyclic;
    expect(deepFreeze(cyclic)).toBe(cyclic);
    expect(Object.isFrozen(cyclic)).toBe(true);
    expect(cloneFixture({ values: [1, 2] })).toEqual({ values: [1, 2] });
  });
});

describe('state fixtures', () => {
  it('registers the five deterministic progression states as immutable data', () => {
    expect(STATE_FIXTURE_IDS).toEqual([
      'foundation',
      'ch1-start',
      'ch1-wand-chosen',
      'ch1-complete',
      'ch2-placeholder',
      'parent-panel',
      'parent-settings',
      'parent-save',
      'parent-confirm',
      'parent-yearbook',
      'save-transfer',
    ]);
    for (const id of STATE_FIXTURE_IDS) {
      const fixture = getStateFixture(id);
      expect(validateStateFixture(fixture)).toBe(fixture);
      expect(validateSaveV1(fixture.save)).toBe(fixture.save);
      expect(Object.isFrozen(fixture)).toBe(true);
      expect(Object.isFrozen(fixture.save.progress.questFlags)).toBe(true);
      expect(fixture.save).toHaveProperty('resume.room');
      expect(fixture.save).toHaveProperty('character.appearance.robeTrim');
      expect(fixture.save).toHaveProperty('spellbook.stats');
      expect(fixture.save).toHaveProperty('collections.cards');
      expect(fixture.save).toHaveProperty('yearbook.entries');
      expect(fixture.save).toHaveProperty('settings.volumes.voice');
    }
  });

  it('returns an isolated mutable state for a harness run', () => {
    const clone = cloneStateFixture('ch1-wand-chosen');
    clone.save.progress.questFlags['ch1.wandChosen'] = false;
    expect(getStateFixture('ch1-wand-chosen').save.progress.questFlags['ch1.wandChosen']).toBe(true);
  });

  it('rejects invalid settings and malformed progression flags', () => {
    const badLearning = cloneStateFixture('ch1-start');
    badLearning.save.settings.learning = 'hard';
    expect(() => validateStateFixture(badLearning)).toThrow(/off, gentle, stretchy/);

    const badFlag = cloneStateFixture('ch1-start');
    badFlag.save.progress.questFlags.notNamespaced = true;
    expect(() => validateStateFixture(badFlag)).toThrow(/chapter-namespaced flag/);
  });
});

describe('action fixtures', () => {
  it('registers semantic scripts for every foundation progression state', () => {
    expect(ACTION_FIXTURE_IDS).toEqual(STATE_FIXTURE_IDS);
    for (const id of ACTION_FIXTURE_IDS) {
      const fixture = getActionFixture(id);
      expect(validateActionFixture(fixture)).toBe(fixture);
      expect(Object.isFrozen(fixture.actions)).toBe(true);
    }
    expect(getActionFixture('ch1-start').actions.map((action) => action.target)).toEqual([
      'letter.owl',
      'letter.envelope',
      'letter.seal',
      'letter.seal',
    ]);
    expect(getActionFixture('ch1-start').actions.map((action) => action.frame)).toEqual([30, 480, 520, 540]);
    expect(getActionFixture('parent-panel').actions.at(-1)).toEqual({
      frame: 60,
      type: 'hold',
      target: 'satchel.grownups',
      durationFrames: 180,
    });
  });

  it('rejects coordinate-like targets and non-monotonic scripts', () => {
    const coordinates = cloneActionFixture('foundation');
    coordinates.actions[0].target = '640,360';
    expect(() => validateActionFixture(coordinates)).toThrow(/namespaced semantic target/);

    const unordered = cloneActionFixture('ch1-start');
    unordered.actions[1].frame = unordered.actions[0].frame;
    expect(() => validateActionFixture(unordered)).toThrow(/strictly increasing/);
  });
});

describe('registered harness scenarios', () => {
  it('defaults manual scene URLs to matching immutable state and action fixtures', () => {
    expect(parseHarnessRequest('?scene=ch1-start&frame=120&seed=1337')).toEqual({
      scene: 'ch1-start',
      state: 'ch1-start',
      actions: 'ch1-start',
      frame: 120,
      seed: 1337,
      width: 640,
      height: 360,
      dpr: 1,
      motion: 'full',
      learning: 'gentle',
    });
  });

  it('clones registered saves and applies only capture-profile overrides', () => {
    const request = parseHarnessRequest(
      '?scene=ch1-wand-chosen&state=ch1-wand-chosen&actions=ch1-wand-chosen&seed=99&motion=reduced&learning=off',
    );
    const scenario = resolveHarnessScenario(request);
    expect(scenario.stateFixture.save.worldSeed).toBe(99);
    expect(scenario.stateFixture.save.settings).toMatchObject({ reducedMotion: true, learning: 'off' });
    expect(scenario.stateFixture.save.resume).toEqual({
      chapter: 'ch1', scene: 'ch1.wandShopping', room: 'ch1.ollivanders', spawn: 'entry',
    });
    expect(getStateFixture('ch1-wand-chosen').save.worldSeed).toBe(42);
    expect(getStateFixture('ch1-wand-chosen').save.settings.reducedMotion).toBe(false);
  });

  it('selects semantic actions deterministically through an exact frame', () => {
    const fixture = cloneActionFixture('ch1-start');
    expect(actionsThroughFrame(fixture, 519).map((action) => action.target)).toEqual([
      'letter.owl', 'letter.envelope',
    ]);
    expect(actionsThroughFrame(fixture, 540)).toEqual(fixture.actions);
  });

  it('rejects unknown registry selectors and off-grid times', () => {
    expect(() => resolveHarnessScenario(parseHarnessRequest('?state=missing'))).toThrow(/Available fixtures/);
    expect(() => parseHarnessRequest('?t=0.06')).toThrow(/60 fps simulation grid/);
  });
});

describe('capture environment identity', () => {
  it('pins every rendering-sensitive foundation dependency', () => {
    expect(validateEnvironmentIdentity(APPROVED_CAPTURE_ENVIRONMENT)).toBe(APPROVED_CAPTURE_ENVIRONMENT);
    expect(APPROVED_CAPTURE_ENVIRONMENT.id).toBe(
      'macos-26.5-arm64-node22.17.0-pw1.58.2-chromium1208-headless-srgb-en-us-utc-fonts-none',
    );
    expect(Object.isFrozen(APPROVED_CAPTURE_ENVIRONMENT.rendering.fonts)).toBe(true);
  });

  it('rejects stale ids and valid but unapproved environments', () => {
    const stale = structuredClone(APPROVED_CAPTURE_ENVIRONMENT);
    stale.browser.revision = '1209';
    expect(() => validateEnvironmentIdentity(stale)).toThrow(/\.id must be/);

    stale.id = environmentIdentityId(stale);
    expect(() => assertEnvironmentIdentity(stale)).toThrow(/mismatch/);
    expect(assertEnvironmentIdentity(structuredClone(APPROVED_CAPTURE_ENVIRONMENT))).toEqual(APPROVED_CAPTURE_ENVIRONMENT);
  });
});
