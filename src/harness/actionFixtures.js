import { ImmutableRegistry, assertExactKeys } from './registry.js';

const SEMANTIC_TARGET_PATTERN = /^[a-z][A-Za-z0-9]*\.[a-z][A-Za-z0-9]*(?:\.[a-z][A-Za-z0-9]*)*$/;

function validateAction(action, index, path) {
  const required = action.type === 'hold'
    ? ['frame', 'type', 'target', 'durationFrames']
    : ['frame', 'type', 'target'];
  assertExactKeys(action, required, `${path}.actions[${index}]`);
  if (!Number.isSafeInteger(action.frame) || action.frame < 0) {
    throw new TypeError(`${path}.actions[${index}].frame must be a non-negative safe integer.`);
  }
  if (!['tap', 'hold'].includes(action.type)) throw new TypeError(`${path}.actions[${index}].type must be tap or hold.`);
  if (typeof action.target !== 'string' || !SEMANTIC_TARGET_PATTERN.test(action.target)) {
    throw new TypeError(`${path}.actions[${index}].target must be a namespaced semantic target.`);
  }
  if (action.type === 'hold' && (!Number.isSafeInteger(action.durationFrames) || action.durationFrames < 1)) {
    throw new TypeError(`${path}.actions[${index}].durationFrames must be a positive safe integer.`);
  }
}

export function validateActionFixture(fixture, path = 'action fixture') {
  assertExactKeys(fixture, ['fixtureVersion', 'description', 'actions'], path);
  if (fixture.fixtureVersion !== 1) throw new TypeError(`${path}.fixtureVersion must be 1.`);
  if (typeof fixture.description !== 'string' || fixture.description.trim() === '') {
    throw new TypeError(`${path}.description must be a non-empty string.`);
  }
  if (!Array.isArray(fixture.actions)) throw new TypeError(`${path}.actions must be an array.`);
  let previousEndFrame = -1;
  fixture.actions.forEach((action, index) => {
    validateAction(action, index, path);
    if (action.frame <= previousEndFrame) {
      throw new TypeError(`${path}.actions must not overlap and must use strictly increasing frames.`);
    }
    previousEndFrame = action.frame + (action.durationFrames ?? 0);
  });
  return fixture;
}

function createFixture(description, actions = []) {
  return { fixtureVersion: 1, description, actions };
}

const registry = new ImmutableRegistry('action', validateActionFixture);

registry
  .register('foundation', createFixture(
    'Tap the integrated storybook title’s new-player envelope after its initial animation settles.',
    [{ frame: 30, type: 'tap', target: 'foundation.start' }],
  ))
  .register('foundation-saved-review', createFixture(
    'Hold the integrated storybook title and its returning-player envelope for deterministic visual review.',
  ))
  .register('ch1-start', createFixture(
    'Open the Chapter 1 letter and hold its player-paced reading surface.',
    [
      { frame: 30, type: 'tap', target: 'letter.owl' },
      { frame: 480, type: 'tap', target: 'letter.envelope' },
    ],
  ))
  .register('ch1-follow-hagrid-review', createFixture(
    'Hold Hagrid’s deterministic bedroom departure and the sparkle-footprint path he leaves for Violet.',
  ))
  .register('ch1-follow-hagrid-leaky-review', createFixture(
    'Hold Hagrid’s deterministic Leaky Cauldron departure and the sparkle-footprint path to the courtyard door.',
  ))
  .register('world-shimmer-review', createFixture(
    'Hold Ollivanders across the globally staggered discoverable and secret glint schedule.',
  ))
  .register('world-shimmer-hint-review', createFixture(
    'Hold Ollivanders with only the first-wand golden thread escalated by the hint ladder.',
  ))
  .register('world-secret-pet-review', createFixture(
    'Hold Ollivanders across the pet’s deterministic wander, paw, and return cue for the hidden card.',
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
  .register('sp-letter-open-review', createFixture(
    'Hold the letter-open choreography on its deterministic timeline.',
  ))
  .register('transition-ink-review', createFixture(
    'Tap the courtyard door once so the destination is revealed through the authored ink bloom.',
    [{ frame: 30, type: 'tap', target: 'leaky.courtyardDoor' }],
  ))
  .register('transition-sparkle-review', createFixture(
    'Open the satchel and travel to Ollivanders so map sparkles ride the reveal edge.',
    [
      { frame: 15, type: 'tap', target: 'hud.satchel' },
      { frame: 30, type: 'tap', target: 'satchel.map.ch1.ollivanders' },
    ],
  ))
  .register('sp-brick-wall-review', createFixture(
    'Hold the ten-by-eight wall reveal on its deterministic timeline.',
  ))
  .register('sp-wand-vase-review', createFixture(
    'Hold the second wrong-wand vase mishap on its deterministic timeline.',
  ))
  .register('sp-wand-chosen-review', createFixture(
    'Hold the chosen-wand crescendo on its deterministic timeline.',
  ))
  .register('sp-ch2-ticket-review', createFixture(
    'Advance the preview narration after the ticket settles so both intentional next-step choices can be reviewed.',
    [{ frame: 250, type: 'tap', target: 'hud.quest' }],
  ))
  .register('parent-panel', createFixture(
    'Open the satchel and hold its grown-up brass keyhole for the full three-second gate.',
    [
      { frame: 30, type: 'tap', target: 'hud.satchel' },
      { frame: 60, type: 'hold', target: 'satchel.grownups', durationFrames: 180 },
    ],
  ))
  .register('parent-settings', createFixture(
    'Open the grown-up book and turn to its sound and feel page.',
    [
      { frame: 30, type: 'tap', target: 'hud.satchel' },
      { frame: 60, type: 'hold', target: 'satchel.grownups', durationFrames: 180 },
      { frame: 260, type: 'tap', target: 'parent.tab.settings' },
    ],
  ))
  .register('parent-save', createFixture(
    'Open the grown-up book and turn to its save page.',
    [
      { frame: 30, type: 'tap', target: 'hud.satchel' },
      { frame: 60, type: 'hold', target: 'satchel.grownups', durationFrames: 180 },
      { frame: 260, type: 'tap', target: 'parent.tab.save' },
    ],
  ))
  .register('parent-confirm', createFixture(
    'Open the guarded Start Over confirmation without accepting it.',
    [
      { frame: 30, type: 'tap', target: 'hud.satchel' },
      { frame: 60, type: 'hold', target: 'satchel.grownups', durationFrames: 180 },
      { frame: 260, type: 'tap', target: 'parent.tab.save' },
      { frame: 280, type: 'tap', target: 'parent.save.start' },
    ],
  ))
  .register('parent-yearbook', createFixture(
    'Open Violet’s yearbook from the grown-up book.',
    [
      { frame: 30, type: 'tap', target: 'hud.satchel' },
      { frame: 60, type: 'hold', target: 'satchel.grownups', durationFrames: 180 },
      { frame: 260, type: 'tap', target: 'parent.play.yearbook' },
    ],
  ))
  .register('save-transfer', createFixture(
    'Open the accessible save export dialog from the grown-up book.',
    [
      { frame: 30, type: 'tap', target: 'hud.satchel' },
      { frame: 60, type: 'hold', target: 'satchel.grownups', durationFrames: 180 },
      { frame: 260, type: 'tap', target: 'parent.tab.save' },
      { frame: 280, type: 'tap', target: 'parent.save.export' },
    ],
  ))
  .register('pet-name-dialog', createFixture(
    'Hold the custom pet naming dialog open for visual and keyboard review.',
  ))
  .register('character-cast-review', createFixture(
    'Hold the full cast on their deterministic idle and speaking loops.',
  ))
  .register('character-pets-review', createFixture(
    'Hold all companion choices on their deterministic follow loops.',
  ))
  .register('character-portraits-review', createFixture(
    'Hold every dialogue cameo on its deterministic speaking loop.',
  ))
  .register('owl-motion-review', createFixture(
    'Hold the hero owl pose library on deterministic motion loops.',
  ))
  .register('character-sprite-spike-review', createFixture(
    'Hold the code-drawn and painted-part Violets side by side on deterministic loops.',
  ))
  .register('hagrid-sprite-review', createFixture(
    'Hold the code-drawn and painted-part Hagrids side by side on deterministic loops.',
  ))
  .register('violet-expression-review', createFixture(
    'Hold every approved aligned Violet expression without animation or input.',
  ))
  .register('ui-dialogue-review', createFixture(
    'Hold the illustrated voiced-dialogue frame and replay control.',
  ))
  .register('ui-dialogue-night-review', createFixture(
    'Hold the warm-dark dialogue scroll opposite its active speaker.',
  ))
  .register('ui-dialogue-center-review', createFixture(
    'Hold the narrowed scroll beside centered Violet and its two-line caption.',
  ))
  .register('ui-dialogue-live-review', createFixture(
    'Walk to Hagrid and hold his first bedroom line against the painted room.',
    [{ frame: 30, type: 'tap', target: 'bedroom.guide' }],
  ))
  .register('ui-dialogue-night-live-review', createFixture(
    'Walk to Hagrid and hold his ticket line against the painted dusk street.',
    [{ frame: 30, type: 'tap', target: 'street.guideTicket' }],
  ))
  .register('ui-broom-caption-review', createFixture(
    'Hold Violet’s broom reaction and caption for deterministic visual review.',
  ))
  .register('ui-letter-reading-review', createFixture(
    'Hold the readable invitation and its explicit hear-the-letter action.',
  ))
  .register('ui-robe-picker-review', createFixture(
    'Hold the real robe picker with Gold selected for deterministic full-body, swatch, and control review.',
  ))
  .register('ui-choices-review', createFixture(
    'Hold a complete set of authored vector choice cards.',
  ))
  .register('ui-satchel-map-review', createFixture(
    'Hold the code-only illustrated satchel map with soft fog and a D31 objective destination.',
  ))
  .register('ui-satchel-cards-review', createFixture(
    'Hold the card album with the grown-up brass keyhole above the keepsakes.',
  ))
  .register('ui-objective-review', createFixture(
    'Hold the illustrated quest-compass objective page.',
  ))
  .register('ui-chapter-card-review', createFixture(
    'Hold the illustrated Chapter One completion page.',
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
