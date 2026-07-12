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
    ]);
    for (const id of STATE_FIXTURE_IDS) {
      const fixture = getStateFixture(id);
      expect(validateStateFixture(fixture)).toBe(fixture);
      expect(Object.isFrozen(fixture)).toBe(true);
      expect(Object.isFrozen(fixture.save.questFlags)).toBe(true);
    }
  });

  it('returns an isolated mutable state for a harness run', () => {
    const clone = cloneStateFixture('ch1-wand-chosen');
    clone.save.questFlags['ch1.wandChosen'] = false;
    expect(getStateFixture('ch1-wand-chosen').save.questFlags['ch1.wandChosen']).toBe(true);
  });

  it('rejects invalid settings and malformed progression flags', () => {
    const badLearning = cloneStateFixture('ch1-start');
    badLearning.save.settings.learning = 'hard';
    expect(() => validateStateFixture(badLearning)).toThrow(/off, gentle, or stretchy/);

    const badFlag = cloneStateFixture('ch1-start');
    badFlag.save.questFlags.notNamespaced = true;
    expect(() => validateStateFixture(badFlag)).toThrow(/invalid namespaced flag/);
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
    ]);
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
