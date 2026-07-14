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
  GUIDE_WALK_REVIEW_SCENES,
  SET_PIECE_REVIEW_SCENES,
  WORLD_AFFORDANCE_REVIEW_SCENES,
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
  it('registers deterministic progression and visual-review states as immutable data', () => {
    expect(STATE_FIXTURE_IDS).toEqual([
      'foundation',
      'foundation-saved-review',
      'ch1-start',
      'ch1-follow-hagrid-review',
      'ch1-follow-hagrid-leaky-review',
      'world-shimmer-review',
      'world-shimmer-hint-review',
      'world-secret-pet-review',
      'ch1-wand-chosen',
      'ch1-complete',
      'ch2-placeholder',
      'sp-letter-open-review',
      'transition-ink-review',
      'transition-sparkle-review',
      'sp-brick-wall-review',
      'sp-wand-vase-review',
      'sp-wand-chosen-review',
      'sp-ch2-ticket-review',
      'parent-panel',
      'parent-settings',
      'parent-save',
      'parent-confirm',
      'parent-yearbook',
      'save-transfer',
      'pet-name-dialog',
      'character-cast-review',
      'character-pets-review',
      'character-portraits-review',
      'owl-motion-review',
      'ui-dialogue-review',
      'ui-dialogue-night-review',
      'ui-dialogue-center-review',
      'ui-dialogue-live-review',
      'ui-dialogue-night-live-review',
      'ui-broom-caption-review',
      'ui-letter-reading-review',
      'ui-robe-picker-review',
      'ui-choices-review',
      'ui-satchel-map-review',
      'ui-satchel-cards-review',
      'ui-objective-review',
      'ui-chapter-card-review',
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
    ]);
    expect(getActionFixture('ch1-start').actions.map((action) => action.frame)).toEqual([30, 480]);
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
  it('registers dedicated gameplay-scale review scenes for the cast, companions, portraits, and owl poses', () => {
    for (const id of ['character-cast-review', 'character-pets-review', 'character-portraits-review', 'owl-motion-review']) {
      expect(STATE_FIXTURE_IDS).toContain(id);
      expect(ACTION_FIXTURE_IDS).toContain(id);
      expect(parseHarnessRequest(`?scene=${id}`)).toMatchObject({ scene: id, state: id, actions: id });
    }
  });

  it('registers speaker-left, speaker-right, and night dialogue review coverage', () => {
    for (const id of [
      'ui-dialogue-review',
      'ui-broom-caption-review',
      'ui-dialogue-night-review',
      'ui-dialogue-center-review',
      'ui-dialogue-live-review',
      'ui-dialogue-night-live-review',
    ]) {
      expect(STATE_FIXTURE_IDS).toContain(id);
      expect(ACTION_FIXTURE_IDS).toContain(id);
      expect(parseHarnessRequest(`?scene=${id}`)).toMatchObject({ scene: id, state: id, actions: id });
    }
  });

  it('registers the real robe picker as a deterministic review scene before its choice is committed', () => {
    const id = 'ui-robe-picker-review';
    expect(STATE_FIXTURE_IDS).toContain(id);
    expect(ACTION_FIXTURE_IDS).toContain(id);
    expect(parseHarnessRequest(`?scene=${id}`)).toMatchObject({ scene: id, state: id, actions: id });
    expect(getStateFixture(id).save).toMatchObject({
      resume: { scene: 'ch1.robeShopping', room: 'ch1.malkins' },
      character: { appearance: { robeTrim: null } },
    });
    expect(getActionFixture(id).actions).toEqual([]);
  });

  it('registers the signature Chapter One set pieces and Chapter Two ticket as direct deterministic review scenes', () => {
    expect(SET_PIECE_REVIEW_SCENES).toEqual({
      'sp-letter-open-review': 'sp.letterOpen',
      'sp-brick-wall-review': 'sp.brickWall',
      'sp-wand-vase-review': 'sp.wandChaos2',
      'sp-wand-chosen-review': 'sp.wandChosen',
      'sp-ch2-ticket-review': 'sp.ch2.previewTicket',
    });
    for (const id of Object.keys(SET_PIECE_REVIEW_SCENES)) {
      expect(parseHarnessRequest(`?scene=${id}`)).toMatchObject({ scene: id, state: id, actions: id });
    }
    expect(getActionFixture('sp-ch2-ticket-review').actions).toEqual([
      { frame: 250, type: 'tap', target: 'hud.quest' },
    ]);
  });

  it('registers normal and hint-escalated world-shimmer review scenes', () => {
    expect(WORLD_AFFORDANCE_REVIEW_SCENES).toEqual({
      'world-shimmer-review': null,
      'world-shimmer-hint-review': 'ollivanders.wand1',
      'world-secret-pet-review': null,
    });
    for (const id of Object.keys(WORLD_AFFORDANCE_REVIEW_SCENES)) {
      expect(STATE_FIXTURE_IDS).toContain(id);
      expect(ACTION_FIXTURE_IDS).toContain(id);
      expect(parseHarnessRequest(`?scene=${id}`)).toMatchObject({ scene: id, state: id, actions: id });
    }
  });

  it('registers the Hagrid tap-to-walk lesson as a deterministic review scene', () => {
    expect(GUIDE_WALK_REVIEW_SCENES).toEqual([
      'ch1-follow-hagrid-review',
      'ch1-follow-hagrid-leaky-review',
    ]);
    for (const id of GUIDE_WALK_REVIEW_SCENES) {
      expect(STATE_FIXTURE_IDS).toContain(id);
      expect(ACTION_FIXTURE_IDS).toContain(id);
      expect(parseHarnessRequest(`?scene=${id}`)).toMatchObject({ scene: id, state: id, actions: id });
    }
  });

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
      'macos-26.5.2-arm64-node22.17.0-pw1.58.2-chromium1208-headless-srgb-en-us-utc-fonts-2bb44ff2.50841fc9.6b73917d',
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
