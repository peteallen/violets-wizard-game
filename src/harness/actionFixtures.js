import { ImmutableRegistry, assertExactKeys } from './registry.js';

const SEMANTIC_TARGET_PATTERN = /^[a-z][A-Za-z0-9]*\.[a-z][A-Za-z0-9]*(?:\.[a-z][A-Za-z0-9]*)*$/;

function validateAction(action, index, path) {
  assertExactKeys(action, ['frame', 'type', 'target'], `${path}.actions[${index}]`);
  if (!Number.isSafeInteger(action.frame) || action.frame < 0) {
    throw new TypeError(`${path}.actions[${index}].frame must be a non-negative safe integer.`);
  }
  if (action.type !== 'tap') throw new TypeError(`${path}.actions[${index}].type must be tap.`);
  if (typeof action.target !== 'string' || !SEMANTIC_TARGET_PATTERN.test(action.target)) {
    throw new TypeError(`${path}.actions[${index}].target must be a namespaced semantic target.`);
  }
}

export function validateActionFixture(fixture, path = 'action fixture') {
  assertExactKeys(fixture, ['fixtureVersion', 'description', 'actions'], path);
  if (fixture.fixtureVersion !== 1) throw new TypeError(`${path}.fixtureVersion must be 1.`);
  if (typeof fixture.description !== 'string' || fixture.description.trim() === '') {
    throw new TypeError(`${path}.description must be a non-empty string.`);
  }
  if (!Array.isArray(fixture.actions)) throw new TypeError(`${path}.actions must be an array.`);
  let previousFrame = -1;
  fixture.actions.forEach((action, index) => {
    validateAction(action, index, path);
    if (action.frame <= previousFrame) {
      throw new TypeError(`${path}.actions must use strictly increasing frames.`);
    }
    previousFrame = action.frame;
  });
  return fixture;
}

function createFixture(description, actions = []) {
  return { fixtureVersion: 1, description, actions };
}

const registry = new ImmutableRegistry('action', validateActionFixture);

registry
  .register('foundation', createFixture(
    'Tap the foundation call to action after its initial animation settles.',
    [{ frame: 30, type: 'tap', target: 'foundation.start' }],
  ))
  .register('ch1-start', createFixture(
    'Open the Chapter 1 letter using the real semantic interaction targets.',
    [
      { frame: 30, type: 'tap', target: 'letter.owl' },
      { frame: 120, type: 'tap', target: 'letter.envelope' },
      { frame: 180, type: 'tap', target: 'letter.seal' },
    ],
  ))
  .register('ch1-wand-chosen', createFixture(
    'Hold the post-choice wand state without introducing another interaction.',
  ))
  .register('ch1-complete', createFixture(
    'Hold the Chapter 1 completion state for a stable review frame.',
  ))
  .register('ch2-placeholder', createFixture(
    'Hold the Chapter 2 placeholder state before its content is authored.',
  ))
  .seal();

export const ACTION_FIXTURE_IDS = registry.ids();

export function getActionFixture(id) {
  return registry.get(id);
}

export function cloneActionFixture(id) {
  return registry.clone(id);
}

export function listActionFixtures() {
  return registry.entries();
}
