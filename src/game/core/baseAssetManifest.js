import { productionCharacterCatalog } from '../characters/productionCatalog.js';

const UI_IMAGE_PATHS = Object.freeze({
  'ui/title/backdrop-v2': 'assets/art/ui/title/title-backdrop-v2.webp',
  'ui/title/return-envelope-v2': 'assets/art/ui/title/return-envelope-v2.webp',
  'ui/objective/reminder-v2': 'assets/art/ui/objective/objective-reminder-v2.webp',
  'ui/hud/satchel-closed': 'assets/art/ui/hud/satchel-closed.webp',
  'ui/hud/quest-compass-base': 'assets/art/ui/hud/quest-compass-base.webp',
  'ui/hud/quest-compass-needle': 'assets/art/ui/hud/quest-compass-needle.webp',
  'ui/hud/wand-holster': 'assets/art/ui/hud/wand-holster.webp',
  'ui/hud/wands/violet-first-wand': 'assets/art/ui/hud/wand-violet-first-wand.webp',
  'ui/story/choice-tag-v2': 'assets/art/ui/story-surfaces/choice-tag-v2.webp',
  'ui/story/action-note-v2': 'assets/art/ui/story-surfaces/action-note-v2.webp',
  'ui/story/robe-folio-v2': 'assets/art/ui/story-surfaces/robe-folio-v2.webp',
  'ui/story/chapter-one-plaque-v2': 'assets/art/ui/story-surfaces/chapter-one-plaque-v2.webp',
  'ui/dom/dialog-folio-v2': 'assets/art/ui/dom/dialog-folio-v2.webp',
  'ui/browser/owl-clasp-icon-v2': 'assets/art/ui/browser/owl-clasp-icon-v2.webp',
  'ui/browser/owl-clasp-icon-v2-180': 'assets/art/ui/browser/owl-clasp-icon-v2-180.png',
  'ui/browser/owl-clasp-icon-v2-64': 'assets/art/ui/browser/owl-clasp-icon-v2-64.png',
  'ui/satchel/spread-v2': 'assets/art/ui/satchel/spread-v2.webp',
  'ui/satchel/card-frame-v2': 'assets/art/ui/satchel/card-frame-v2.webp',
  'ui/satchel/card-pocket-v2': 'assets/art/ui/satchel/card-pocket-v2.webp',
  'ui/satchel/map-tab': 'assets/art/ui/satchel/map-tab.webp',
  'ui/satchel/cards-tab': 'assets/art/ui/satchel/cards-tab.webp',
  'ui/satchel/grown-ups': 'assets/art/ui/satchel/grown-ups.webp',
  'ui/satchel/start-fresh': 'assets/art/ui/satchel/start-fresh.webp',
  'ui/satchel/close-seal': 'assets/art/ui/satchel/close-seal.webp',
  'ui/satchel/destination-diagon-alley': 'assets/art/ui/satchel/destination-diagon-alley.webp',
  'ui/satchel/destination-ollivanders': 'assets/art/ui/satchel/destination-ollivanders.webp',
  'ui/satchel/destination-malkins': 'assets/art/ui/satchel/destination-malkins.webp',
  'ui/satchel/destination-menagerie': 'assets/art/ui/satchel/destination-menagerie.webp',
});

const DURABLE_CARD_ASSETS = Object.freeze({
  'cards/morgana/portrait': Object.freeze({ path: 'assets/art/cards/morgana.webp', kind: 'image' }),
  'voice/ch1/card/morgana': Object.freeze({ path: 'assets/audio/voice/ch1/card/morgana.mp3', kind: 'voice', volume: 1 }),
  'cards/dumbledore/portrait': Object.freeze({ path: 'assets/art/cards/dumbledore.webp', kind: 'image' }),
  'voice/ch1/card/dumbledore': Object.freeze({ path: 'assets/audio/voice/ch1/card/dumbledore.mp3', kind: 'voice', volume: 1 }),
  'cards/merlin/portrait': Object.freeze({ path: 'assets/art/cards/merlin.webp', kind: 'image' }),
  'voice/ch2/card/merlin': Object.freeze({ path: 'assets/audio/voice/ch2/card/merlin.mp3', kind: 'voice', volume: 1 }),
  'cards/jocunda-sykes/portrait': Object.freeze({ path: 'assets/art/cards/jocunda-sykes.webp', kind: 'image' }),
  'voice/ch2/card/jocunda-sykes': Object.freeze({ path: 'assets/audio/voice/ch2/card/jocunda-sykes.mp3', kind: 'voice', volume: 1 }),
  'cards/circe/portrait': Object.freeze({ path: 'assets/art/cards/circe.webp', kind: 'image' }),
  'voice/ch3/card/circe': Object.freeze({ path: 'assets/audio/voice/ch3/card/circe.mp3', kind: 'voice', volume: 1 }),
  'cards/bertie-bott/portrait': Object.freeze({ path: 'assets/art/cards/bertie-bott.webp', kind: 'image' }),
  'voice/ch3/card/bertie-bott': Object.freeze({ path: 'assets/audio/voice/ch3/card/bertie-bott.mp3', kind: 'voice', volume: 1 }),
});

const SHARED_RUNTIME_ASSETS = Object.freeze({
  'sfx/ch1/coin': Object.freeze({
    path: 'assets/audio/sfx/ch1/coin.mp3',
    kind: 'sfx',
    volume: 0.8,
  }),
  'sfx/ch1/owlFlap': Object.freeze({
    path: 'assets/audio/sfx/ch1/owlFlap.mp3',
    kind: 'sfx',
    volume: 0.8,
  }),
  'sfx/ch1/paperSlide': Object.freeze({
    path: 'assets/audio/sfx/ch1/paperSlide.mp3',
    kind: 'sfx',
    volume: 0.8,
  }),
  'sfx/ch2/chapter-turn': Object.freeze({
    path: 'assets/audio/sfx/ch2/chapter-turn.mp3',
    kind: 'sfx',
    volume: 0.8,
  }),
  'music/ch2/common-room': Object.freeze({
    path: 'assets/audio/music/ch2/common-room.mp3',
    kind: 'music',
    volume: 0.55,
  }),
  'ui/spells/spellbook-spread': Object.freeze({
    path: 'assets/art/ui/ch3/spellbook-spread.webp',
    kind: 'image',
  }),
  'ui/spells/card-shell': Object.freeze({
    path: 'assets/art/ui/ch3/card-shell.webp',
    kind: 'image',
  }),
  'ui/spells/card-shell-selected': Object.freeze({
    path: 'assets/art/ui/ch3/card-shell-selected.webp',
    kind: 'image',
  }),
  'ui/spells/incantation-ribbon': Object.freeze({
    path: 'assets/art/ui/ch3/incantation-ribbon.webp',
    kind: 'image',
  }),
  'sfx/ch3/lumos-bloom': Object.freeze({
    path: 'assets/audio/sfx/ch3/lumos-bloom.mp3',
    kind: 'sfx',
    volume: 0.8,
  }),
  'sfx/ch3/leviosa-harp': Object.freeze({
    path: 'assets/audio/sfx/ch3/leviosa-harp.mp3',
    kind: 'sfx',
    volume: 0.8,
  }),
  'sfx/ch3/comic-fizzle-1': Object.freeze({
    path: 'assets/audio/sfx/ch3/comic-fizzle-1.mp3',
    kind: 'sfx',
    volume: 0.8,
  }),
});

const characterAssets = Object.fromEntries(
  Object.entries(productionCharacterCatalog.assets).map(([key, asset]) => [
    key,
    Object.freeze({ ...asset, chapter: null }),
  ]),
);

const uiAssets = Object.fromEntries(
  Object.entries(UI_IMAGE_PATHS).map(([key, path]) => [
    key,
    Object.freeze({ path, kind: 'image', chapter: null }),
  ]),
);

const durableCardAssets = Object.fromEntries(
  Object.entries(DURABLE_CARD_ASSETS).map(([key, asset]) => [
    key,
    Object.freeze({ ...asset, chapter: null }),
  ]),
);

/** Title, shared UI, character art, and already-earned keepsakes are always available. */
export const baseAssetManifest = Object.freeze({
  ...characterAssets,
  ...uiAssets,
  ...durableCardAssets,
  ...Object.fromEntries(Object.entries(SHARED_RUNTIME_ASSETS).map(([key, asset]) => [
    key,
    Object.freeze({ ...asset, chapter: null }),
  ])),
});

export default baseAssetManifest;
