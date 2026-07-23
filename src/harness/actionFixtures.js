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
  .register('boot-loading-review', createFixture(
    'Hold the production boot surface in its presentation-loading state.',
  ))
  .register('boot-failure-review', createFixture(
    'Hold the production boot surface in its retryable presentation-failure state.',
  ))
  .register('composition-loading-review', createFixture(
    'Hold the production in-game composition overlay while a first visible frame prepares.',
  ))
  .register('composition-failure-review', createFixture(
    'Hold the production in-game composition overlay in its retryable failure state.',
  ))
  .register('foundation', createFixture(
    'Tap the integrated storybook title’s new-player envelope after its initial animation settles.',
    [{ frame: 30, type: 'tap', target: 'foundation.start' }],
  ))
  .register('foundation-saved-review', createFixture(
    'Hold the integrated storybook title and its returning-player envelope for deterministic visual review.',
  ))
  .register('ch1-start', createFixture(
    'Open the Chapter 1 letter as soon as its delivery settles and hold its player-paced reading surface.',
    [
      { frame: 30, type: 'tap', target: 'letter.owl' },
      { frame: 250, type: 'tap', target: 'letter.envelope' },
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
  .register('sp-letter-open-review', createFixture(
    'Hold the letter-open choreography on its deterministic timeline.',
  ))
  .register('transition-ink-review', createFixture(
    'Tap Ollivanders’ open doorway once so Violet walks into it before the destination is revealed through the authored ink bloom.',
    [{ frame: 30, type: 'tap', target: 'ollivanders.exit' }],
  ))
  .register('transition-sparkle-review', createFixture(
    'Open the satchel and travel to Ollivanders so map sparkles ride the reveal edge.',
    [
      { frame: 15, type: 'tap', target: 'hud.satchel' },
      { frame: 30, type: 'tap', target: 'satchel.map.ch1.ollivanders' },
    ],
  ))
  .register('sp-brick-wall-review', createFixture(
    'Hold the intact-courtyard, individual-brick reveal and the following full-room street transition on their deterministic timeline.',
  ))
  .register('sp-wand-vase-review', createFixture(
    'Hold the second wrong-wand vase mishap on its deterministic timeline.',
  ))
  .register('sp-wand-chosen-review', createFixture(
    'Hold the chosen-wand crescendo on its deterministic timeline.',
  ))
  .register('sp-ch2-barrier-run-review', createFixture(
    'Hold the Chapter Two barrier run and opaque platform reveal on their deterministic timeline.',
  ))
  .register('sp-ch2-sweet-reaction-review', createFixture(
    'Hold Violet’s chosen-sweet reaction on its deterministic timeline.',
  ))
  .register('sp-ch2-lake-vista-review', createFixture(
    'Hold the first castle vista on its deterministic full-screen timeline.',
  ))
  .register('sp-ch2-sorting-reveal-review', createFixture(
    'Hold the canonical Gryffindor Sorting reveal on its deterministic timeline.',
  ))
  .register('sp-ch2-common-room-arrival-review', createFixture(
    'Hold Violet’s Gryffindor common-room welcome on its deterministic timeline.',
  ))
  .register('sp-ch2-chapter-card-review', createFixture(
    'Hold the Chapter Two completion page on its deterministic page-turn timeline.',
  ))
  .register('sp-ch3-spellbook-reveal-review', createFixture(
    'Hold the wrapped spellbook reveal and opening fan on their deterministic timeline.',
  ))
  .register('learning-ch3-lumos-review', createFixture(
    'Begin the real Lumos lesson, land its self-teaching first rune, and hold the next guided match.',
    [
      { frame: 0, type: 'tap', target: 'ch3.charms.flitwickLumos' },
      { frame: 150, type: 'tap', target: 'dialogue.advance' },
      { frame: 180, type: 'tap', target: 'dialogue.advance' },
      { frame: 210, type: 'tap', target: 'learning.tile.l' },
    ],
  ))
  .register('ui-ch3-spellbook-review', createFixture(
    'Complete the real Lumos rune sequence and hold its permanent illustrated spell detail page.',
    [
      { frame: 0, type: 'tap', target: 'ch3.charms.flitwickLumos' },
      { frame: 150, type: 'tap', target: 'dialogue.advance' },
      { frame: 180, type: 'tap', target: 'dialogue.advance' },
      { frame: 210, type: 'tap', target: 'learning.tile.l' },
      { frame: 240, type: 'tap', target: 'learning.tile.u' },
      { frame: 270, type: 'tap', target: 'learning.tile.m' },
      { frame: 300, type: 'tap', target: 'learning.tile.o' },
      { frame: 330, type: 'tap', target: 'learning.tile.s' },
    ],
  ))
  .register('sp-ch3-lumos-bloom-review', createFixture(
    'Hold Violet’s first free Lumos cast and responsive lantern bloom on their deterministic timeline.',
  ))
  .register('learning-ch3-leviosa-review', createFixture(
    'Begin the real Leviosa chant, land three spoken syllables, and hold its half-lifted feather performance.',
    [
      { frame: 0, type: 'tap', target: 'ch3.charms.flitwickLeviosa' },
      { frame: 90, type: 'tap', target: 'dialogue.advance' },
      { frame: 120, type: 'tap', target: 'dialogue.advance' },
      { frame: 150, type: 'tap', target: 'learning.tile.win' },
      { frame: 180, type: 'tap', target: 'learning.tile.gar' },
      { frame: 210, type: 'tap', target: 'learning.tile.dium' },
    ],
  ))
  .register('sp-ch3-leviosa-feather-review', createFixture(
    'Hold the completed Leviosa feather sail and restrained gold celebration on their deterministic timeline.',
  ))
  .register('ui-ch3-map-review', createFixture(
    'Open the live Chapter Three castle map at the second-corridor objective.',
    [{ frame: 30, type: 'tap', target: 'hud.satchel' }],
  ))
  .register('sp-ch3-corridor-one-reveal-review', createFixture(
    'Hold the first corridor’s Lumos pool and wet-footprint reveal on their deterministic timeline.',
  ))
  .register('ui-ch3-corridor-two-lumos-review', createFixture(
    'Open Violet’s two-spell wand fan, choose Lumos, and hold both valid second-corridor targets.',
    [
      { frame: 30, type: 'tap', target: 'hud.wand' },
      { frame: 60, type: 'tap', target: 'spellbook.cast.lumos' },
    ],
  ))
  .register('ui-ch3-corridor-three-lumos-review', createFixture(
    'Open Violet’s two-spell wand fan, choose Lumos, and hold the three distinct third-corridor hiding shapes.',
    [
      { frame: 30, type: 'tap', target: 'hud.wand' },
      { frame: 60, type: 'tap', target: 'spellbook.cast.lumos' },
    ],
  ))
  .register('sp-ch3-trevor-reveal-review', createFixture(
    'Hold the valid Lumos reveal as reflected eyes resolve into Trevor on its deterministic timeline.',
  ))
  .register('sp-ch3-trevor-found-review', createFixture(
    'Hold Trevor’s hop, croak, and short Found Trevor celebration on their deterministic timeline.',
  ))
  .register('sp-ch3-trevor-reunion-review', createFixture(
    'Hold Neville and Trevor’s reunion, points, and toad-token reward on their deterministic timeline.',
  ))
  .register('room-ch3-friendly-ghost-review', createFixture(
    'Approach the friendly ghost and hold his torn-book request against the real night corridor.',
    [
      { frame: 0, type: 'tap', target: 'ch3.corridorOne.friendlyGhost' },
      { frame: 150, type: 'tap', target: 'dialogue.replay' },
    ],
  ))
  .register('ui-ch3-quest-journal-review', createFixture(
    'Open the real quest journal with its active gold main thread and sleeping silver Fix the book promise.',
    [{ frame: 30, type: 'tap', target: 'hud.quest' }],
  ))
  .register('ui-ch3-cards-review', createFixture(
    'Open the satchel’s Cards tab and turn to the live Circe and Bertie Bott keepsake page.',
    [
      { frame: 15, type: 'tap', target: 'hud.satchel' },
      { frame: 30, type: 'tap', target: 'satchel.cards' },
      { frame: 45, type: 'tap', target: 'satchel.cards.next' },
    ],
  ))
  .register('sp-ch3-chapter-close-review', createFixture(
    'Hold Violet’s First Spells and the truthful flying-lesson page turn on their deterministic timeline.',
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
  .register('hagrid-sprite-review', createFixture(
    'Hold Hagrid’s aligned neutral, blink, speaking, and walking poses on deterministic loops.',
  ))
  .register('wandmaker-sprite-review', createFixture(
    'Hold the Wandmaker’s aligned neutral, blink, and two speaking mouth shapes without input.',
  ))
  .register('wandmaker-live-review', createFixture(
    'Hold the Wandmaker’s automatic welcome dialogue in the painted shop.',
  ))
  .register('madam-malkin-sprite-review', createFixture(
    'Hold Madam Malkin’s aligned neutral, blink, and two speaking mouth shapes without input.',
  ))
  .register('madam-malkin-live-review', createFixture(
    'Approach the robe-shop stool and hold Madam Malkin’s welcome dialogue in the painted shop.',
    [{ frame: 30, type: 'tap', target: 'malkins.stool' }],
  ))
  .register('menagerie-keeper-sprite-review', createFixture(
    'Hold the Menagerie Keeper’s aligned neutral, blink, and two speaking mouth shapes without input.',
  ))
  .register('menagerie-keeper-live-review', createFixture(
    'Approach the keeper and hold her welcome dialogue in the painted Menagerie.',
    [{ frame: 30, type: 'tap', target: 'menagerie.keeper' }],
  ))
  .register('violet-expression-review', createFixture(
    'Hold every approved aligned Violet expression without animation or input.',
  ))
  .register('flitwick-sprite-review', createFixture(
    'Hold Professor Flitwick’s production portraits and teaching, casting, and celebration actions.',
  ))
  .register('neville-sprite-review', createFixture(
    'Hold Neville’s production portraits and worried, relieved, and reunion states.',
  ))
  .register('trevor-sprite-review', createFixture(
    'Hold Trevor’s production portrait, reveal, croak, hop, held, and reunion states.',
  ))
  .register('friendly-ghost-sprite-review', createFixture(
    'Hold the friendly ghost’s production portrait, emergence, dialogue, reward, and delighted states.',
  ))
  .register('ui-dialogue-review', createFixture(
    'Hold the illustrated voiced-dialogue frame and replay control.',
  ))
  .register('ui-dialogue-night-review', createFixture(
    'Hold the warm-dark dialogue scroll opposite its active speaker.',
  ))
  .register('ui-dialogue-center-review', createFixture(
    'Hold the narrated scroll beside centered, silent Violet and its two-line caption.',
  ))
  .register('ui-dialogue-live-review', createFixture(
    'Walk to Hagrid and hold his first bedroom line against the painted room.',
    [{ frame: 30, type: 'tap', target: 'bedroom.guide' }],
  ))
  .register('ui-dialogue-night-live-review', createFixture(
    'Walk to Hagrid and hold his ticket line against the painted dusk street.',
    [{ frame: 30, type: 'tap', target: 'street.guideTicket' }],
  ))
  .register('ui-letter-reading-review', createFixture(
    'Open the delivered envelope and hold the real readable invitation with both painted actions.',
    [{ frame: 30, type: 'tap', target: 'letter.envelope' }],
  ))
  .register('ui-letter-reading-playing-review', createFixture(
    'Hold the visible active reading state while the optional narration remains in flight.',
  ))
  .register('ui-pet-name-welcome-review', createFixture(
    'Hold the Menagerie Keeper’s post-name welcome for Juniper without advancing its dialogue.',
  ))
  .register('ui-robe-picker-review', createFixture(
    'Hold the real robe picker with Gold selected for deterministic full-body, swatch, and control review.',
  ))
  .register('ui-choices-review', createFixture(
    'Approach the keeper, advance her welcome, and hold the real three-pet choice.',
    [
      { frame: 0, type: 'tap', target: 'menagerie.keeper' },
      { frame: 30, type: 'tap', target: 'dialogue.advance' },
    ],
  ))
  .register('ui-choice-icons-review', createFixture(
    'Choose the owl, advance the keeper’s confirmation, and hold the real two-icon choice.',
    [
      { frame: 0, type: 'tap', target: 'menagerie.keeper' },
      { frame: 30, type: 'tap', target: 'dialogue.advance' },
      { frame: 45, type: 'tap', target: 'dialogue.petOwl' },
      { frame: 60, type: 'tap', target: 'dialogue.advance' },
    ],
  ))
  .register('ui-satchel-map-early-review', createFixture(
    'Hold the early painted satchel map with soft fog and Ollivanders marked Next.',
  ))
  .register('ui-satchel-map-review', createFixture(
    'Hold the late painted satchel map with completed stops and Menagerie marked Next.',
  ))
  .register('ui-satchel-cards-review', createFixture(
    'Hold the Chapter One card album with Map and Cards navigation.',
  ))
  .register('ui-satchel-ch2-cards-review', createFixture(
    'Hold the Chapter Two cards-only satchel with three earned keepsakes.',
  ))
  .register('ui-satchel-ch3-cards-review', createFixture(
    'Hold the Chapter Three cards-only satchel with all four keepsakes.',
  ))
  .register('ui-objective-review', createFixture(
    'Open the compact objective reminder from the live Chapter One quest compass.',
    [{ frame: 30, type: 'tap', target: 'hud.quest' }],
  ))
  .register('ui-chapter-card-review', createFixture(
    'Hold the real Chapter One platform painting with its compact plaque and Continue note.',
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
