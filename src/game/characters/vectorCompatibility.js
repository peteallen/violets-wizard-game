import {
  catPresentation,
  catStyle,
} from './cat/definition.js';
import {
  catCharacterRuntime,
  sampleCatMotion,
} from './cat/runtime.js';
import {
  menagerieKeeperPresentation,
  menagerieKeeperStyle,
} from './menagerie-keeper/definition.js';
import {
  menagerieKeeperCharacterRuntime,
  sampleKeeperMotion,
} from './menagerie-keeper/runtime.js';
import {
  narratorPresentation,
} from './narrator/definition.js';
import {
  narratorCharacterRuntime,
} from './narrator/runtime.js';
import {
  toadPresentation,
  toadStyle,
} from './toad/definition.js';
import {
  sampleToadMotion,
  toadCharacterRuntime,
} from './toad/runtime.js';

export const KEEPER_STYLE = menagerieKeeperStyle;
export const CAT_STYLE = catStyle;
export const TOAD_STYLE = toadStyle;

export { sampleKeeperMotion };

export function sampleCompanionMotion(options = {}) {
  return options.type === toadPresentation.legacyType
    ? sampleToadMotion(options)
    : sampleCatMotion(options);
}

const WORLD_RENDERERS = new Map([
  [menagerieKeeperPresentation.legacyKind, menagerieKeeperCharacterRuntime.renderers.world],
]);

const COMPANION_RENDERERS = new Map([
  [catPresentation.legacyType, catCharacterRuntime.renderers.world],
  [toadPresentation.legacyType, toadCharacterRuntime.renderers.world],
]);

const PORTRAIT_RENDERERS = new Map([
  [menagerieKeeperPresentation.legacyKind, menagerieKeeperCharacterRuntime.renderers.portrait],
  [narratorPresentation.reviews.portrait.speaker, narratorCharacterRuntime.renderers.portrait],
  [catPresentation.legacyType, catCharacterRuntime.renderers.portrait],
  [toadPresentation.legacyType, toadCharacterRuntime.renderers.portrait],
]);

export function drawCompatibleVectorWorld(context, character, time = 0) {
  const renderer = WORLD_RENDERERS.get(character?.kind);
  if (!renderer) return false;
  renderer({ ...character, context, time });
  return true;
}

export function drawCompatibleVectorCompanion(context, pet, time = 0) {
  const renderer = COMPANION_RENDERERS.get(pet?.type);
  if (!renderer) return false;
  renderer({ ...pet, context, time });
  return true;
}

export function drawCompatibleVectorPortrait(context, speaker, portrait, time = 0) {
  const renderer = PORTRAIT_RENDERERS.get(speaker);
  if (!renderer) return false;
  renderer({ ...portrait, context, time });
  return true;
}

const PRESENTATIONS = Object.freeze([
  menagerieKeeperPresentation,
  narratorPresentation,
  catPresentation,
  toadPresentation,
]);

export function resolveCompatibleVectorPortraitSpeaker(value) {
  const speaker = String(value ?? '').trim().toLowerCase();
  for (const presentation of PRESENTATIONS) {
    if (presentation.portraitAliases.some((alias) => speaker.includes(alias))) {
      return presentation.legacyKind
        ?? presentation.legacyType
        ?? presentation.reviews.portrait.speaker;
    }
  }
  return null;
}

export const VECTOR_PORTRAIT_BACKDROPS = Object.freeze(Object.fromEntries(
  PRESENTATIONS.map((presentation) => {
    const speaker = presentation.legacyKind
      ?? presentation.legacyType
      ?? presentation.reviews.portrait.speaker;
    return [speaker, presentation.portrait.backdrop];
  }),
));

export const VECTOR_CAST_REVIEW_ENTRIES = Object.freeze([
  Object.freeze({
    ...menagerieKeeperPresentation.reviews.cast,
    kind: menagerieKeeperPresentation.legacyKind,
  }),
]);

export const VECTOR_PET_REVIEW_ENTRIES = Object.freeze([
  Object.freeze({
    ...catPresentation.reviews.pet,
    type: catPresentation.legacyType,
  }),
  Object.freeze({
    ...toadPresentation.reviews.pet,
    type: toadPresentation.legacyType,
  }),
]);

export const VECTOR_PORTRAIT_REVIEW_ENTRIES = Object.freeze(PRESENTATIONS
  .map((presentation) => presentation.reviews.portrait)
  .filter(Boolean));
