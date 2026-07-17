// Compatibility alias for the contracts that remain on v1 during the chapter cutover.
export const CONTRACT_VERSION = 1;
export const LEGACY_CHAPTER_CONTRACT_VERSION = 1;
export const CHAPTER_CONTRACT_VERSION = 2;
export const MAP_CONTRACT_VERSION = 1;

export const PARTICLE_LIMITS = Object.freeze({
  standardCap: 300,
  celebrationCap: 400,
  reducedMotionCap: 120,
  hardCap: 400,
});

export const WORLD_EVENT_TYPES = Object.freeze([
  'state.changed',
  'save.dirty',
  'save.flushRequested',
  'save.persistenceSuppressed',
  'room.transitionRequested',
  'room.entered',
  'dialogue.opened',
  'dialogue.lineChanged',
  'dialogue.choicesChanged',
  'dialogue.closed',
  'quest.objectiveChanged',
  'hint.lookRequested',
  'hint.voiceRequested',
  'hint.trailRequested',
  'hint.assistTriggered',
  'hint.cleared',
  'reward.granted',
  'learning.started',
  'learning.completed',
  'spell.cast',
  'encounter.phaseChanged',
  'setPiece.started',
  'setPiece.completed',
  'actor.animationRequested',
  'audio.command',
  'particles.emit',
  'camera.command',
  'feedback.command',
  'ui.openRequested',
  'ui.closeRequested',
  'yearbook.captureRequested',
  'chapter.completionFailed',
  'chapter.completed',
]);

export const TIMELINE_CUE_EVENT_TYPES = Object.freeze([
  'actor.animationRequested',
  'audio.command',
  'particles.emit',
  'camera.command',
  'feedback.command',
]);

export const ACTION_TYPES = Object.freeze([
  'flag.set',
  'choice.record',
  'character.set',
  'dialogue.start',
  'setPiece.play',
  'travel.request',
  'learning.start',
  'spell.learn',
  'collection.add',
  'reward.grant',
  'ui.open',
  'yearbook.capture',
  'chapter.complete',
  'audio.command',
]);

const WORLD_EVENT_TYPE_SET = new Set(WORLD_EVENT_TYPES);
const TIMELINE_CUE_EVENT_TYPE_SET = new Set(TIMELINE_CUE_EVENT_TYPES);
const ACTION_TYPE_SET = new Set(ACTION_TYPES);
const QUEST_LIFECYCLE_ACTION_TYPE_SET = new Set([
  'flag.set',
  'choice.record',
  'spell.learn',
  'collection.add',
  'reward.grant',
]);
const SAVE_DIRTY_REASONS = Object.freeze([
  'mutation',
  'flag',
  'collection',
  'reward',
  'affordance-spent',
  'choice',
  'character',
]);
const SAVE_FLUSH_REASONS = Object.freeze([
  'scene-change',
  'chapter-change',
  'checkpoint',
  'chapter-complete',
  'dialogue-cursor',
  'story-receipt',
  'set-piece-receipt',
  'quest-receipt',
  'quest-transition',
  'dialogue-completion',
  'scene',
  'spell-learned',
  'action-batch-rollback',
]);
const SAVE_SUPPRESSION_REASONS = Object.freeze([
  'flag',
  'collection',
  'reward',
  'affordance-spent',
  'choice',
  'character',
  'scene-change',
  'chapter-change',
  'dialogue-cursor',
  'story-receipt',
  'set-piece-receipt',
  'quest-receipt',
  'quest-transition',
  'dialogue-completion',
  'scene',
  'spell-learned',
  'action-batch-rollback',
]);
const PACKAGE_ACTION_ARRAY_KEYS = new Set([
  'actions',
  'assistActions',
  'onComplete',
  'onEnter',
  'onExit',
  'onInteract',
  'onSelect',
  'onStart',
]);
const GENERAL_ID = /^[a-z][A-Za-z0-9]*(?:[.-][A-Za-z0-9][A-Za-z0-9-]*)+$/;
const CHAPTER_ID = /^ch[1-9][0-9]*$/;
const CHARACTER_ID = /^character\.[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const FLAG_ID = /^ch[1-9][0-9]*\.[A-Za-z0-9][A-Za-z0-9.-]*$/;
const LOCAL_ID = /^[A-Za-z][A-Za-z0-9_-]*$/;
const PROFILE_PATHS = new Set(['house', 'pet.type', 'pet.name', 'appearance.robeTrim', 'wandId']);
const CHARACTER_FIELDS = new Set([
  'house',
  'wandId',
  'appearance.robeTrim',
  'pet.type',
  'pet.name',
  'commonRoomPassword',
]);
const EASINGS = new Set(['linear', 'easeInOutCubic', 'easeOutCubic', 'easeOutBack']);

export class ContractValidationError extends TypeError {
  constructor(path, message) {
    super(`${path}: ${message}`);
    this.name = 'ContractValidationError';
    this.path = path;
  }
}

function fail(path, message) {
  throw new ContractValidationError(path, message);
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function object(value, path) {
  if (!isPlainObject(value)) fail(path, 'must be a plain object');
  return value;
}

function exactObjectForVersion(value, path, required, optional, version) {
  object(value, path);
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail(`${path}.${key}`, `is not part of contract v${version}`);
  }
  for (const key of required) {
    if (!Object.hasOwn(value, key)) fail(`${path}.${key}`, 'is required');
  }
  return value;
}

function exactObject(value, path, required, optional = []) {
  return exactObjectForVersion(value, path, required, optional, CONTRACT_VERSION);
}

function exactObjectV2(value, path, required, optional = []) {
  return exactObjectForVersion(value, path, required, optional, CHAPTER_CONTRACT_VERSION);
}

function string(value, path, { allowEmpty = false, max = 5000 } = {}) {
  if (typeof value !== 'string') fail(path, 'must be a string');
  if (!allowEmpty && value.trim().length === 0) fail(path, 'must not be empty');
  if (value.length > max) fail(path, `must be at most ${max} characters`);
  return value;
}

function nullableString(value, path) {
  if (value === null) return value;
  return string(value, path);
}

function oneOf(value, allowed, path) {
  if (!allowed.includes(value)) fail(path, `must be one of: ${allowed.join(', ')}`);
  return value;
}

function number(value, path, { min = -Infinity, max = Infinity, integer = false } = {}) {
  if (!Number.isFinite(value)) fail(path, 'must be a finite number');
  if (integer && !Number.isInteger(value)) fail(path, 'must be an integer');
  if (value < min || value > max) fail(path, `must be between ${min} and ${max}`);
  return value;
}

function boolean(value, path) {
  if (typeof value !== 'boolean') fail(path, 'must be a boolean');
  return value;
}

function array(value, path, validate, { min = 0, max = Infinity, unique = false } = {}) {
  if (!Array.isArray(value)) fail(path, 'must be an array');
  if (value.length < min || value.length > max) fail(path, `must contain between ${min} and ${max} items`);
  value.forEach((entry, index) => validate(entry, `${path}[${index}]`));
  if (unique) {
    const seen = new Set();
    value.forEach((entry, index) => {
      const key = typeof entry === 'string' ? entry : JSON.stringify(entry);
      if (seen.has(key)) fail(`${path}[${index}]`, 'must be unique');
      seen.add(key);
    });
  }
  return value;
}

function id(value, path) {
  string(value, path, { max: 160 });
  if (!GENERAL_ID.test(value)) fail(path, 'must be a namespaced identifier such as ch1.letter');
  return value;
}

function chapterId(value, path) {
  string(value, path, { max: 20 });
  if (!CHAPTER_ID.test(value)) fail(path, 'must be a chapter identifier such as ch1');
  return value;
}

function characterId(value, path) {
  string(value, path, { max: 160 });
  if (!CHARACTER_ID.test(value)) {
    fail(path, 'must be a canonical character identity such as character.violet');
  }
  return value;
}

function flagId(value, path) {
  string(value, path, { max: 160 });
  if (!FLAG_ID.test(value)) fail(path, 'must be a chapter-namespaced flag');
  return value;
}

function localId(value, path) {
  string(value, path, { max: 100 });
  if (!LOCAL_ID.test(value)) fail(path, 'must be a local identifier');
  return value;
}

function ref(value, path) {
  return string(value, path, { max: 240 });
}

function scalar(value, path) {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
    if (typeof value === 'number' && !Number.isFinite(value)) fail(path, 'must be JSON-safe');
    return value;
  }
  fail(path, 'must be a JSON scalar');
}

function jsonValue(value, path, depth = 0) {
  if (depth > 12) fail(path, 'is nested too deeply');
  if (value === null || ['string', 'boolean'].includes(typeof value)) return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail(path, 'must contain only finite numbers');
    return value;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => jsonValue(entry, `${path}[${index}]`, depth + 1));
    return value;
  }
  if (isPlainObject(value)) {
    for (const [key, entry] of Object.entries(value)) jsonValue(entry, `${path}.${key}`, depth + 1);
    return value;
  }
  fail(path, 'must be JSON-serializable data');
}

function stringArray(value, path, options = {}) {
  return array(value, path, (entry, entryPath) => ref(entry, entryPath), options);
}

function record(value, path, validate) {
  object(value, path);
  for (const [key, entry] of Object.entries(value)) validate(entry, `${path}.${key}`, key);
  return value;
}

function wordCount(value) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function caption(value, path, maxWords) {
  string(value, path, { max: 80 });
  if (wordCount(value) > maxWords) fail(path, `must contain at most ${maxWords} words`);
  return value;
}

export function validateCondition(value, path = 'condition') {
  exactObject(value, path, [], ['allFlags', 'anyFlags', 'noFlags', 'profileEquals', 'knownSpells']);
  for (const key of ['allFlags', 'anyFlags', 'noFlags']) {
    if (value[key] !== undefined) array(value[key], `${path}.${key}`, flagId, { unique: true });
  }
  if (value.knownSpells !== undefined) stringArray(value.knownSpells, `${path}.knownSpells`, { unique: true });
  if (value.profileEquals !== undefined) {
    record(value.profileEquals, `${path}.profileEquals`, (entry, entryPath, key) => {
      if (!PROFILE_PATHS.has(key)) fail(entryPath, 'is not an allowed profile selector');
      scalar(entry, entryPath);
    });
  }
  return value;
}

function validateCharacterValue(field, value, path) {
  if (field === 'house') {
    if (value !== null) oneOf(value, ['gryffindor', 'hufflepuff', 'ravenclaw', 'slytherin'], path);
  } else if (field === 'pet.type') {
    if (value !== null) oneOf(value, ['owl', 'cat', 'toad'], path);
  } else if (field === 'commonRoomPassword') {
    array(value, path, ref, { min: 3, max: 3 });
  } else if (value !== null) {
    string(value, path, { max: 80 });
  }
}

export function validateAction(value, path = 'action') {
  object(value, path);
  if (!ACTION_TYPE_SET.has(value.type)) fail(`${path}.type`, `must be a registered action type`);

  switch (value.type) {
    case 'flag.set':
      exactObject(value, path, ['type', 'flag', 'value']);
      flagId(value.flag, `${path}.flag`);
      boolean(value.value, `${path}.value`);
      break;
    case 'choice.record':
      exactObject(value, path, ['type', 'id', 'value']);
      id(value.id, `${path}.id`);
      jsonValue(value.value, `${path}.value`);
      break;
    case 'character.set':
      exactObject(value, path, ['type', 'field', 'value']);
      if (!CHARACTER_FIELDS.has(value.field)) fail(`${path}.field`, 'is not an allowed character field');
      validateCharacterValue(value.field, value.value, `${path}.value`);
      break;
    case 'dialogue.start':
      exactObject(value, path, ['type', 'script']);
      id(value.script, `${path}.script`);
      break;
    case 'setPiece.play':
    case 'learning.start':
      exactObject(value, path, ['type', 'id']);
      id(value.id, `${path}.id`);
      break;
    case 'travel.request':
      exactObject(value, path, ['type', 'room', 'spawn'], ['transition']);
      id(value.room, `${path}.room`);
      localId(value.spawn, `${path}.spawn`);
      if (value.transition !== undefined) {
        oneOf(value.transition, ['ink', 'sparkle', 'crossfade', 'none'], `${path}.transition`);
      }
      break;
    case 'spell.learn':
      exactObject(value, path, ['type', 'spell']);
      ref(value.spell, `${path}.spell`);
      break;
    case 'collection.add':
      exactObject(value, path, ['type', 'collection', 'id']);
      oneOf(value.collection, ['cards', 'treasures'], `${path}.collection`);
      ref(value.id, `${path}.id`);
      break;
    case 'reward.grant':
      exactObject(value, path, ['type', 'receipt', 'points', 'cards', 'treasures']);
      id(value.receipt, `${path}.receipt`);
      number(value.points, `${path}.points`, { min: 0, integer: true });
      stringArray(value.cards, `${path}.cards`, { unique: true });
      stringArray(value.treasures, `${path}.treasures`, { unique: true });
      break;
    case 'ui.open':
      exactObject(value, path, ['type', 'surface'], ['tab']);
      ref(value.surface, `${path}.surface`);
      if (value.tab !== undefined) ref(value.tab, `${path}.tab`);
      break;
    case 'yearbook.capture':
      exactObject(value, path, ['type', 'moment']);
      id(value.moment, `${path}.moment`);
      break;
    case 'chapter.complete':
      exactObject(value, path, ['type', 'chapter', 'nextChapter']);
      chapterId(value.chapter, `${path}.chapter`);
      chapterId(value.nextChapter, `${path}.nextChapter`);
      if (value.nextChapter === value.chapter) fail(`${path}.nextChapter`, 'must differ from chapter');
      break;
    case 'audio.command': {
      const { type: _type, ...payload } = value;
      validateAudioPayload(payload, path);
      break;
    }
    default:
      fail(`${path}.type`, 'is unsupported');
  }
  return value;
}

function validateActions(value, path, options = {}) {
  const actions = array(value, path, validateAction, options);
  const completionIndex = actions.findIndex((action) => action.type === 'chapter.complete');
  if (completionIndex >= 0 && completionIndex !== actions.length - 1) {
    fail(`${path}[${completionIndex}]`, 'chapter.complete must be the terminal action');
  }
  return actions;
}

export function validateHitArea(value, path = 'hitArea') {
  object(value, path);
  if (value.shape === 'circle') {
    exactObject(value, path, ['shape', 'x', 'y', 'radius']);
    number(value.x, `${path}.x`);
    number(value.y, `${path}.y`);
    number(value.radius, `${path}.radius`, { min: 88 });
  } else if (value.shape === 'rect') {
    exactObject(value, path, ['shape', 'x', 'y', 'width', 'height']);
    number(value.x, `${path}.x`);
    number(value.y, `${path}.y`);
    number(value.width, `${path}.width`, { min: 88 });
    number(value.height, `${path}.height`, { min: 88 });
  } else {
    fail(`${path}.shape`, 'must be circle or rect');
  }
  return value;
}

function validatePoint(value, path, { normalized = false } = {}) {
  exactObject(value, path, ['x', 'y']);
  const limits = normalized ? { min: 0, max: 1 } : {};
  number(value.x, `${path}.x`, limits);
  number(value.y, `${path}.y`, limits);
  return value;
}

function validateFacing(value, path) {
  return oneOf(value, ['left', 'right'], path);
}

export function validateHotspot(value, path = 'hotspot') {
  exactObject(value, path, [
    'id', 'kind', 'hitArea', 'approach', 'when', 'presentation',
    'requiredSpell', 'repeat', 'onInteract',
  ]);
  id(value.id, `${path}.id`);
  oneOf(value.kind, ['inspect', 'talk', 'spellTarget', 'collectible', 'action'], `${path}.kind`);
  validateHitArea(value.hitArea, `${path}.hitArea`);
  if (value.approach !== null) {
    exactObject(value.approach, `${path}.approach`, ['x', 'y', 'facing']);
    number(value.approach.x, `${path}.approach.x`);
    number(value.approach.y, `${path}.approach.y`);
    validateFacing(value.approach.facing, `${path}.approach.facing`);
  }
  validateCondition(value.when, `${path}.when`);
  exactObject(value.presentation, `${path}.presentation`, ['icon', 'glow']);
  ref(value.presentation.icon, `${path}.presentation.icon`);
  ref(value.presentation.glow, `${path}.presentation.glow`);
  if (value.requiredSpell !== null) ref(value.requiredSpell, `${path}.requiredSpell`);
  oneOf(value.repeat, ['always', 'once', 'until-condition'], `${path}.repeat`);
  validateActions(value.onInteract, `${path}.onInteract`, { min: 1 });
  if (value.kind === 'spellTarget' && value.requiredSpell === null) {
    fail(`${path}.requiredSpell`, 'is required for spellTarget hotspots');
  }
  return value;
}

function validateController(value, path) {
  object(value, path);
  if (value.kind === 'static' || value.kind === 'scripted') {
    exactObject(value, path, ['kind']);
  } else if (value.kind === 'follow') {
    exactObject(value, path, [
      'kind', 'target', 'minimumDistance', 'maxDistance', 'poseMap',
    ], ['facingLookMagnitude']);
    ref(value.target, `${path}.target`);
    number(value.minimumDistance, `${path}.minimumDistance`, { min: 0 });
    number(value.maxDistance, `${path}.maxDistance`, { min: value.minimumDistance });
    exactObject(value.poseMap, `${path}.poseMap`, ['moving', 'hintLook', 'hintAttention']);
    ref(value.poseMap.moving, `${path}.poseMap.moving`);
    ref(value.poseMap.hintLook, `${path}.poseMap.hintLook`);
    ref(value.poseMap.hintAttention, `${path}.poseMap.hintAttention`);
    if (value.facingLookMagnitude !== undefined) {
      number(value.facingLookMagnitude, `${path}.facingLookMagnitude`, { min: 0, max: 1 });
    }
  } else if (value.kind === 'patrol') {
    exactObject(value, path, ['kind', 'points', 'speed']);
    array(value.points, `${path}.points`, validatePoint, { min: 2 });
    number(value.speed, `${path}.speed`, { min: 0.01 });
  } else {
    fail(`${path}.kind`, 'must be static, follow, patrol, or scripted');
  }
  return value;
}

export function validateNpc(value, path = 'npc') {
  exactObject(value, path, [
    'id', 'characterId', 'displayName', 'puppet', 'portrait', 'voiceRole', 'scale',
    'hitRadius', 'defaultPose', 'controller', 'defaultTalk',
  ]);
  id(value.id, `${path}.id`);
  characterId(value.characterId, `${path}.characterId`);
  string(value.displayName, `${path}.displayName`, { max: 80 });
  ref(value.puppet, `${path}.puppet`);
  ref(value.portrait, `${path}.portrait`);
  ref(value.voiceRole, `${path}.voiceRole`);
  number(value.scale, `${path}.scale`, { min: 0.1, max: 10 });
  number(value.hitRadius, `${path}.hitRadius`, { min: 88 });
  ref(value.defaultPose, `${path}.defaultPose`);
  validateController(value.controller, `${path}.controller`);
  if (value.defaultTalk !== null) id(value.defaultTalk, `${path}.defaultTalk`);
  return value;
}

function validateBackground(value, path) {
  exactObject(value, path, ['layers', 'fit', 'focalPoint', 'variants'], ['keyLight']);
  stringArray(value.layers, `${path}.layers`, { min: 1, unique: true });
  oneOf(value.fit, ['cover', 'contain', 'stretch'], `${path}.fit`);
  validatePoint(value.focalPoint, `${path}.focalPoint`, { normalized: true });
  if (value.keyLight !== undefined) oneOf(value.keyLight, ['left', 'right'], `${path}.keyLight`);
  record(value.variants, `${path}.variants`, (entry, entryPath) => {
    stringArray(entry, entryPath, { min: 1, unique: true });
  });
}

function validateExit(value, path) {
  exactObject(value, path, ['id', 'hitArea', 'to', 'icon', 'transition', 'when']);
  id(value.id, `${path}.id`);
  validateHitArea(value.hitArea, `${path}.hitArea`);
  exactObject(value.to, `${path}.to`, ['room', 'spawn']);
  id(value.to.room, `${path}.to.room`);
  localId(value.to.spawn, `${path}.to.spawn`);
  ref(value.icon, `${path}.icon`);
  oneOf(value.transition, ['ink', 'sparkle', 'crossfade', 'none'], `${path}.transition`);
  validateCondition(value.when, `${path}.when`);
}

function validateOccupantRenderState(value, path) {
  exactObject(value, path, [], [
    'offsetX', 'offsetY', 'scale', 'timeOffset', 'lookX', 'lookY', 'lookAt',
    'layoutBounds',
  ]);
  if (value.offsetX !== undefined) number(value.offsetX, `${path}.offsetX`);
  if (value.offsetY !== undefined) number(value.offsetY, `${path}.offsetY`);
  if (value.scale !== undefined) number(value.scale, `${path}.scale`, { min: 0.1, max: 10 });
  if (value.timeOffset !== undefined) number(value.timeOffset, `${path}.timeOffset`);
  if (value.lookX !== undefined) number(value.lookX, `${path}.lookX`, { min: -1, max: 1 });
  if (value.lookY !== undefined) number(value.lookY, `${path}.lookY`, { min: -1, max: 1 });
  if (value.lookAt !== undefined) {
    exactObject(value.lookAt, `${path}.lookAt`, ['target', 'rangeX', 'rangeY'], [
      'offsetX', 'offsetY',
    ]);
    id(value.lookAt.target, `${path}.lookAt.target`);
    number(value.lookAt.rangeX, `${path}.lookAt.rangeX`, { min: Number.EPSILON });
    number(value.lookAt.rangeY, `${path}.lookAt.rangeY`, { min: Number.EPSILON });
    if (value.lookAt.offsetX !== undefined) number(value.lookAt.offsetX, `${path}.lookAt.offsetX`);
    if (value.lookAt.offsetY !== undefined) number(value.lookAt.offsetY, `${path}.lookAt.offsetY`);
  }
  if (value.layoutBounds !== undefined) {
    exactObject(value.layoutBounds, `${path}.layoutBounds`, ['width', 'height', 'ground']);
    number(value.layoutBounds.width, `${path}.layoutBounds.width`, { min: Number.EPSILON });
    number(value.layoutBounds.height, `${path}.layoutBounds.height`, { min: Number.EPSILON });
    number(value.layoutBounds.ground, `${path}.layoutBounds.ground`, { min: 0 });
  }
}

function validateOccupant(value, path) {
  exactObject(value, path, ['npc', 'x', 'y', 'facing', 'pose', 'when'], ['render']);
  id(value.npc, `${path}.npc`);
  number(value.x, `${path}.x`);
  number(value.y, `${path}.y`);
  validateFacing(value.facing, `${path}.facing`);
  ref(value.pose, `${path}.pose`);
  validateCondition(value.when, `${path}.when`);
  if (value.render !== undefined) validateOccupantRenderState(value.render, `${path}.render`);
}

export function validateRoom(value, path = 'room') {
  exactObject(value, path, [
    'id', 'size', 'background', 'walkBand', 'spawns', 'exits',
    'occupants', 'hotspots', 'ambientSetPieces',
  ]);
  id(value.id, `${path}.id`);
  exactObject(value.size, `${path}.size`, ['width', 'height']);
  number(value.size.width, `${path}.size.width`, { min: 1 });
  number(value.size.height, `${path}.size.height`, { min: 1 });
  validateBackground(value.background, `${path}.background`);
  exactObject(value.walkBand, `${path}.walkBand`, ['top', 'bottom']);
  number(value.walkBand.top, `${path}.walkBand.top`, { min: 0, max: value.size.height });
  number(value.walkBand.bottom, `${path}.walkBand.bottom`, { min: value.walkBand.top, max: value.size.height });
  record(value.spawns, `${path}.spawns`, (entry, entryPath, key) => {
    localId(key, `${entryPath} key`);
    exactObject(entry, entryPath, ['x', 'y', 'facing']);
    number(entry.x, `${entryPath}.x`, { min: 0, max: value.size.width });
    number(entry.y, `${entryPath}.y`, { min: value.walkBand.top, max: value.walkBand.bottom });
    validateFacing(entry.facing, `${entryPath}.facing`);
  });
  array(value.exits, `${path}.exits`, validateExit);
  array(value.occupants, `${path}.occupants`, validateOccupant);
  array(value.hotspots, `${path}.hotspots`, validateHotspot);
  stringArray(value.ambientSetPieces, `${path}.ambientSetPieces`, { unique: true });
  return value;
}

function validateDialogueChoice(value, path) {
  exactObject(value, path, ['id', 'icon', 'caption', 'actions', 'next'], [
    'characterId', 'characterScale',
  ]);
  localId(value.id, `${path}.id`);
  ref(value.icon, `${path}.icon`);
  caption(value.caption, `${path}.caption`, 2);
  validateActions(value.actions, `${path}.actions`);
  const completionIndex = value.actions.findIndex((action) => action.type === 'chapter.complete');
  if (completionIndex >= 0) {
    fail(`${path}.actions[${completionIndex}]`, 'chapter.complete is only valid in an end node');
  }
  localId(value.next, `${path}.next`);
  if (value.characterId !== undefined) characterId(value.characterId, `${path}.characterId`);
  if (value.characterScale !== undefined) {
    number(value.characterScale, `${path}.characterScale`, { min: Number.EPSILON, max: 10 });
  }
}

function validateDialogueNode(value, path) {
  object(value, path);
  switch (value.type) {
    case 'line':
      exactObject(value, path, ['type', 'speaker', 'voice', 'text', 'caption', 'phoneticText', 'next'], ['portraitPose']);
      ref(value.speaker, `${path}.speaker`);
      ref(value.voice, `${path}.voice`);
      string(value.text, `${path}.text`, { max: 1000 });
      caption(value.caption, `${path}.caption`, 3);
      if (value.phoneticText !== null) string(value.phoneticText, `${path}.phoneticText`, { max: 1000 });
      if (value.portraitPose !== undefined) ref(value.portraitPose, `${path}.portraitPose`);
      if (value.next !== null) localId(value.next, `${path}.next`);
      break;
    case 'choice':
      exactObject(value, path, ['type', 'choices']);
      array(value.choices, `${path}.choices`, validateDialogueChoice, { min: 2, max: 3 });
      break;
    case 'branch':
      exactObject(value, path, ['type', 'cases', 'fallback']);
      array(value.cases, `${path}.cases`, (entry, entryPath) => {
        exactObject(entry, entryPath, ['when', 'next']);
        validateCondition(entry.when, `${entryPath}.when`);
        localId(entry.next, `${entryPath}.next`);
      }, { min: 1 });
      localId(value.fallback, `${path}.fallback`);
      break;
    case 'action':
      exactObject(value, path, ['type', 'actions', 'next']);
      validateActions(value.actions, `${path}.actions`, { min: 1 });
      if (value.actions.some((action) => action.type === 'chapter.complete')) {
        fail(`${path}.actions`, 'chapter.complete is only valid in an end node');
      }
      localId(value.next, `${path}.next`);
      break;
    case 'end':
      exactObject(value, path, ['type', 'actions']);
      validateActions(value.actions, `${path}.actions`);
      break;
    default:
      fail(`${path}.type`, 'must be line, choice, branch, action, or end');
  }
  return value;
}

function dialogueTargets(node) {
  if (node.type === 'line') return node.next === null ? [] : [node.next];
  if (node.type === 'choice') return node.choices.map((choice) => choice.next);
  if (node.type === 'branch') return [...node.cases.map((entry) => entry.next), node.fallback];
  if (node.type === 'action') return [node.next];
  return [];
}

export function validateDialogue(value, path = 'dialogue') {
  exactObject(value, path, ['id', 'start', 'resumePolicy', 'replayable', 'nodes']);
  id(value.id, `${path}.id`);
  localId(value.start, `${path}.start`);
  oneOf(value.resumePolicy, ['restart-current-node', 'restart-script'], `${path}.resumePolicy`);
  boolean(value.replayable, `${path}.replayable`);
  record(value.nodes, `${path}.nodes`, (entry, entryPath, key) => {
    localId(key, `${entryPath} key`);
    validateDialogueNode(entry, entryPath);
  });
  if (!Object.hasOwn(value.nodes, value.start)) fail(`${path}.start`, 'must reference a node');
  for (const [nodeId, node] of Object.entries(value.nodes)) {
    for (const target of dialogueTargets(node)) {
      if (!Object.hasOwn(value.nodes, target)) fail(`${path}.nodes.${nodeId}`, `references missing node ${target}`);
    }
  }

  const reachable = new Set();
  const pending = [value.start];
  while (pending.length > 0) {
    const nodeId = pending.pop();
    if (reachable.has(nodeId)) continue;
    reachable.add(nodeId);
    pending.push(...dialogueTargets(value.nodes[nodeId]));
  }
  for (const nodeId of Object.keys(value.nodes)) {
    if (!reachable.has(nodeId)) fail(`${path}.nodes.${nodeId}`, 'is unreachable from start');
  }
  return value;
}

function validateObjective(value, path) {
  exactObject(value, path, ['speaker', 'voice', 'text', 'caption', 'mapStar']);
  ref(value.speaker, `${path}.speaker`);
  ref(value.voice, `${path}.voice`);
  string(value.text, `${path}.text`, { max: 1000 });
  caption(value.caption, `${path}.caption`, 3);
  if (value.mapStar !== null) {
    exactObject(value.mapStar, `${path}.mapStar`, ['room', 'hotspot']);
    id(value.mapStar.room, `${path}.mapStar.room`);
    id(value.mapStar.hotspot, `${path}.mapStar.hotspot`);
  }
}

function validateHints(value, path) {
  exactObject(value, path, ['lookTarget', 'repeatVoice', 'trailTarget', 'assistActions']);
  if (value.lookTarget !== null) id(value.lookTarget, `${path}.lookTarget`);
  if (value.repeatVoice !== null) ref(value.repeatVoice, `${path}.repeatVoice`);
  if (value.trailTarget !== null) id(value.trailTarget, `${path}.trailTarget`);
  validateActions(value.assistActions, `${path}.assistActions`);
}

function validateQuestLifecycleActions(value, path) {
  validateActions(value, path);
  value.forEach((action, index) => {
    if (!QUEST_LIFECYCLE_ACTION_TYPE_SET.has(action.type)) {
      fail(
        `${path}[${index}].type`,
        'must be a synchronous durable action in a quest lifecycle batch',
      );
    }
  });
}

function validateQuestLifecycleReceipt(receipt, path) {
  string(receipt, path, { max: 240 });
  if (!FLAG_ID.test(receipt)) {
    fail(path, 'must generate a chapter-namespaced save receipt without underscores');
  }
}

function validateQuestStep(value, path, { durableLifecycle = false } = {}) {
  exactObject(value, path, ['id', 'objective', 'doneWhen', 'hints', 'onEnter', 'onComplete', 'next']);
  localId(value.id, `${path}.id`);
  validateObjective(value.objective, `${path}.objective`);
  validateCondition(value.doneWhen, `${path}.doneWhen`);
  validateHints(value.hints, `${path}.hints`);
  const validateLifecycleActions = durableLifecycle
    ? validateQuestLifecycleActions
    : validateActions;
  validateLifecycleActions(value.onEnter, `${path}.onEnter`);
  validateLifecycleActions(value.onComplete, `${path}.onComplete`);
  if (value.next !== null) localId(value.next, `${path}.next`);
}

export function validateQuest(value, path = 'quest', { durableLifecycle = false } = {}) {
  exactObject(value, path, ['id', 'kind', 'offerScript', 'startWhen', 'startStep', 'steps', 'onComplete']);
  id(value.id, `${path}.id`);
  oneOf(value.kind, ['main', 'side'], `${path}.kind`);
  if (value.offerScript !== null) id(value.offerScript, `${path}.offerScript`);
  validateCondition(value.startWhen, `${path}.startWhen`);
  localId(value.startStep, `${path}.startStep`);
  record(value.steps, `${path}.steps`, (entry, entryPath, key) => {
    localId(key, `${entryPath} key`);
    validateQuestStep(entry, entryPath, { durableLifecycle });
    if (entry.id !== key) fail(`${entryPath}.id`, 'must match its map key');
  });
  const validateLifecycleActions = durableLifecycle
    ? validateQuestLifecycleActions
    : validateActions;
  validateLifecycleActions(value.onComplete, `${path}.onComplete`);
  if (!Object.hasOwn(value.steps, value.startStep)) fail(`${path}.startStep`, 'must reference a quest step');

  if (durableLifecycle) {
    validateQuestLifecycleReceipt(`${value.id}.quest.v1.adopted`, `${path}.id`);
    validateQuestLifecycleReceipt(`${value.id}.quest.v1.completed`, `${path}.id`);
    for (const stepId of Object.keys(value.steps)) {
      validateQuestLifecycleReceipt(
        `${value.id}.quest.v1.step.${stepId}.entered`,
        `${path}.steps.${stepId}.id`,
      );
      validateQuestLifecycleReceipt(
        `${value.id}.quest.v1.step.${stepId}.completed`,
        `${path}.steps.${stepId}.id`,
      );
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const walk = (stepId) => {
    if (visiting.has(stepId)) fail(`${path}.steps.${stepId}.next`, 'creates a cycle in a quest');
    if (visited.has(stepId)) return;
    const step = value.steps[stepId];
    if (!step) fail(`${path}.steps`, `references missing step ${stepId}`);
    visiting.add(stepId);
    if (step.next !== null) walk(step.next);
    visiting.delete(stepId);
    visited.add(stepId);
  };
  walk(value.startStep);
  for (const stepId of Object.keys(value.steps)) {
    if (!visited.has(stepId)) fail(`${path}.steps.${stepId}`, 'is unreachable from startStep');
  }
  return value;
}

function validateLearningUnit(value, path) {
  exactObject(value, path, ['id', 'glyph', 'voice']);
  localId(value.id, `${path}.id`);
  string(value.glyph, `${path}.glyph`, { max: 30 });
  ref(value.voice, `${path}.voice`);
}

function validateAssemblyContent(value, path, { spellRequired = true } = {}) {
  exactObject(value, path, spellRequired
    ? ['spell', 'presentation', 'units', 'order', 'distractors']
    : ['presentation', 'units', 'order', 'distractors'], spellRequired ? [] : ['spell']);
  if (value.spell !== undefined) ref(value.spell, `${path}.spell`);
  ref(value.presentation, `${path}.presentation`);
  array(value.units, `${path}.units`, validateLearningUnit, { min: 1 });
  const unitIds = new Set(value.units.map((unit) => unit.id));
  array(value.order, `${path}.order`, (entry, entryPath) => {
    localId(entry, entryPath);
    if (!unitIds.has(entry)) fail(entryPath, 'must reference a unit');
  }, { min: 1, unique: true });
  if (value.order.length !== value.units.length) fail(`${path}.order`, 'must include every unit exactly once');
  stringArray(value.distractors, `${path}.distractors`, { unique: true });
}

function validateLearningContent(kind, value, path) {
  if (kind === 'assembly') {
    validateAssemblyContent(value, path);
  } else if (kind === 'sequence') {
    validateAssemblyContent(value, path, { spellRequired: false });
  } else if (kind === 'wordTap') {
    exactObject(value, path, ['targets', 'correct']);
    array(value.targets, `${path}.targets`, (entry, entryPath) => {
      exactObject(entry, entryPath, ['id', 'label', 'voice']);
      localId(entry.id, `${entryPath}.id`);
      string(entry.label, `${entryPath}.label`, { max: 40 });
      ref(entry.voice, `${entryPath}.voice`);
    }, { min: 1 });
    localId(value.correct, `${path}.correct`);
    if (!value.targets.some((target) => target.id === value.correct)) fail(`${path}.correct`, 'must reference a target');
  } else if (kind === 'count') {
    exactObject(value, path, ['item', 'count', 'countVoicePack']);
    ref(value.item, `${path}.item`);
    number(value.count, `${path}.count`, { min: 1, max: 20, integer: true });
    ref(value.countVoicePack, `${path}.countVoicePack`);
  } else if (kind === 'match') {
    exactObject(value, path, ['pairs']);
    array(value.pairs, `${path}.pairs`, (entry, entryPath) => {
      exactObject(entry, entryPath, ['word', 'icon', 'voice']);
      string(entry.word, `${entryPath}.word`, { max: 40 });
      ref(entry.icon, `${entryPath}.icon`);
      ref(entry.voice, `${entryPath}.voice`);
    }, { min: 1 });
  }
}

function validateLearningModes(value, path) {
  exactObject(value, path, ['off', 'gentle', 'stretchy']);
  exactObject(value.off, `${path}.off`, ['interaction']);
  oneOf(value.off.interaction, ['singleTap'], `${path}.off.interaction`);
  for (const mode of ['gentle', 'stretchy']) {
    exactObject(value[mode], `${path}.${mode}`, [], ['interaction', 'tileFace', 'distractorCount']);
    if (value[mode].interaction !== undefined) ref(value[mode].interaction, `${path}.${mode}.interaction`);
    if (value[mode].tileFace !== undefined) oneOf(value[mode].tileFace, ['shown', 'adaptive', 'hidden'], `${path}.${mode}.tileFace`);
    if (value[mode].distractorCount !== undefined) number(value[mode].distractorCount, `${path}.${mode}.distractorCount`, { min: 0, max: 20, integer: true });
  }
}

export function validateLearningBeat(value, path = 'learningBeat') {
  exactObject(value, path, [
    'id', 'kind', 'scene', 'skill', 'completionFlag', 'replayable',
    'assistanceProfile', 'content', 'modes', 'onComplete',
  ]);
  id(value.id, `${path}.id`);
  oneOf(value.kind, ['assembly', 'wordTap', 'count', 'match', 'sequence'], `${path}.kind`);
  id(value.scene, `${path}.scene`);
  oneOf(value.skill, ['letters', 'phonics', 'counting', 'matching', 'sequence'], `${path}.skill`);
  flagId(value.completionFlag, `${path}.completionFlag`);
  boolean(value.replayable, `${path}.replayable`);
  ref(value.assistanceProfile, `${path}.assistanceProfile`);
  validateLearningContent(value.kind, value.content, `${path}.content`);
  validateLearningModes(value.modes, `${path}.modes`);
  validateActions(value.onComplete, `${path}.onComplete`, { min: 1 });
  const completionAction = value.onComplete.some((action) => (
    action.type === 'flag.set' && action.flag === value.completionFlag && action.value === true
  ));
  if (!completionAction) fail(`${path}.onComplete`, 'must set completionFlag to true');
  return value;
}

function validateTimelineTarget(value, path) {
  string(value, path, { max: 240 });
  if (!/^[A-Za-z$][A-Za-z0-9$_.-]*$/.test(value)) fail(path, 'must be a channel path');
}

function validateStaggerItem(value, path) {
  if (typeof value === 'string') return ref(value, path);
  exactObject(value, path, ['id'], ['x', 'y']);
  ref(value.id, `${path}.id`);
  if ((value.x === undefined) !== (value.y === undefined)) fail(path, 'must provide both x and y');
  if (value.x !== undefined) {
    number(value.x, `${path}.x`);
    number(value.y, `${path}.y`);
  }
}

export function validateTimelineTrack(value, path = 'track') {
  object(value, path);
  if (value.type === 'set') {
    exactObject(value, path, ['type', 'target', 'at', 'value']);
    validateTimelineTarget(value.target, `${path}.target`);
    number(value.at, `${path}.at`, { min: 0 });
    jsonValue(value.value, `${path}.value`);
  } else if (value.type === 'tween') {
    exactObject(value, path, ['type', 'target', 'start', 'end', 'from', 'to', 'easing']);
    validateTimelineTarget(value.target, `${path}.target`);
    number(value.start, `${path}.start`, { min: 0 });
    number(value.end, `${path}.end`, { min: value.start });
    if (value.end === value.start) fail(`${path}.end`, 'must be greater than start');
    number(value.from, `${path}.from`);
    number(value.to, `${path}.to`);
    oneOf(value.easing, [...EASINGS], `${path}.easing`);
  } else if (value.type === 'cue') {
    exactObject(value, path, ['type', 'at', 'event', 'payload']);
    number(value.at, `${path}.at`, { min: 0 });
    if (!TIMELINE_CUE_EVENT_TYPE_SET.has(value.event)) fail(`${path}.event`, 'is not a permitted timeline cue event');
    validateWorldEventPayload(value.event, value.payload, `${path}.payload`);
  } else if (value.type === 'stagger') {
    exactObject(value, path, ['type', 'start', 'interval', 'items', 'order', 'child']);
    number(value.start, `${path}.start`, { min: 0 });
    number(value.interval, `${path}.interval`, { min: 0 });
    if (typeof value.items === 'string') {
      validateTimelineTarget(value.items, `${path}.items`);
    } else {
      array(value.items, `${path}.items`, validateStaggerItem, { min: 1 });
    }
    exactObject(value.order, `${path}.order`, ['by'], ['origin']);
    oneOf(value.order.by, ['source', 'reverse', 'distance'], `${path}.order.by`);
    if (value.order.by === 'distance') {
      if (value.order.origin === undefined) fail(`${path}.order.origin`, 'is required for distance order');
      if (typeof value.order.origin === 'string') validateTimelineTarget(value.order.origin, `${path}.order.origin`);
      else validatePoint(value.order.origin, `${path}.order.origin`);
    } else if (value.order.origin !== undefined) {
      fail(`${path}.order.origin`, 'is only valid for distance order');
    }
    exactObject(value.child, `${path}.child`, ['type', 'target', 'duration', 'from', 'to', 'easing']);
    if (value.child.type !== 'tween') fail(`${path}.child.type`, 'must be tween in contract v1');
    validateTimelineTarget(value.child.target, `${path}.child.target`);
    if (!value.child.target.includes('$item')) fail(`${path}.child.target`, 'must contain $item');
    number(value.child.duration, `${path}.child.duration`, { min: Number.EPSILON });
    number(value.child.from, `${path}.child.from`);
    number(value.child.to, `${path}.child.to`);
    oneOf(value.child.easing, [...EASINGS], `${path}.child.easing`);
  } else {
    fail(`${path}.type`, 'must be set, tween, cue, or stagger');
  }
  return value;
}

export function validateTimeline(value, path = 'timeline') {
  exactObject(value, path, ['tracks']);
  array(value.tracks, `${path}.tracks`, validateTimelineTrack);
  return value;
}

function latestTrackTime(track) {
  if (track.type === 'set' || track.type === 'cue') return track.at;
  if (track.type === 'tween') return track.end;
  if (Array.isArray(track.items)) return track.start + (track.items.length - 1) * track.interval + track.child.duration;
  return track.start + track.child.duration;
}

export function validateSetPiece(value, path = 'setPiece') {
  exactObject(value, path, [
    'id', 'tier', 'duration', 'clock', 'blocksInput', 'particleBudget',
    'assets', 'fallback', 'reducedMotion', 'params', 'timeline',
    'verification', 'onComplete',
  ]);
  id(value.id, `${path}.id`);
  oneOf(value.tier, ['T1', 'T2', 'T3'], `${path}.tier`);
  number(value.duration, `${path}.duration`, { min: Number.EPSILON, max: 10 });
  if (value.clock !== 'world') fail(`${path}.clock`, 'must be world');
  boolean(value.blocksInput, `${path}.blocksInput`);
  oneOf(value.particleBudget, ['standard', 'celebration', 'reduced'], `${path}.particleBudget`);
  stringArray(value.assets, `${path}.assets`, { unique: true });
  if (value.fallback !== null) id(value.fallback, `${path}.fallback`);
  if (value.reducedMotion !== null) id(value.reducedMotion, `${path}.reducedMotion`);
  object(value.params, `${path}.params`);
  jsonValue(value.params, `${path}.params`);
  validateTimeline(value.timeline, `${path}.timeline`);
  for (let index = 0; index < value.timeline.tracks.length; index += 1) {
    const track = value.timeline.tracks[index];
    if (latestTrackTime(track) > value.duration + 1e-9) {
      fail(`${path}.timeline.tracks[${index}]`, 'extends beyond set-piece duration');
    }
  }
  exactObject(value.verification, `${path}.verification`, ['keyframes', 'checklist']);
  array(value.verification.keyframes, `${path}.verification.keyframes`, (entry, entryPath) => {
    number(entry, entryPath, { min: 0, max: value.duration });
  }, { unique: true });
  stringArray(value.verification.checklist, `${path}.verification.checklist`, { unique: true });
  validateActions(value.onComplete, `${path}.onComplete`);
  return value;
}

function validateSceneV1(value, path) {
  exactObject(value, path, ['id', 'room', 'spawn', 'when', 'onEnter', 'doneWhen', 'next', 'resumeAt']);
  id(value.id, `${path}.id`);
  id(value.room, `${path}.room`);
  localId(value.spawn, `${path}.spawn`);
  validateCondition(value.when, `${path}.when`);
  validateActions(value.onEnter, `${path}.onEnter`);
  validateCondition(value.doneWhen, `${path}.doneWhen`);
  if (value.next !== null) id(value.next, `${path}.next`);
  exactObject(value.resumeAt, `${path}.resumeAt`, ['room', 'spawn']);
  id(value.resumeAt.room, `${path}.resumeAt.room`);
  localId(value.resumeAt.spawn, `${path}.resumeAt.spawn`);
}

function validateSceneLayerV2(value, path) {
  exactObjectV2(value, path, ['occupants', 'hotspots', 'exits', 'ambientSetPieces']);
  for (const key of ['occupants', 'hotspots', 'exits']) {
    array(value[key], `${path}.${key}`, (entry, entryPath) => {
      object(entry, entryPath);
      jsonValue(entry, entryPath);
    });
  }
  stringArray(value.ambientSetPieces, `${path}.ambientSetPieces`, { unique: true });
  return value;
}

function validateSceneV2(value, path) {
  exactObjectV2(
    value,
    path,
    ['id', 'order', 'room', 'spawn', 'when', 'onEnter'],
    ['quest', 'roomVariant', 'mapId', 'resumeAt', 'layer'],
  );
  id(value.id, `${path}.id`);
  number(value.order, `${path}.order`, { min: 0, integer: true });
  id(value.room, `${path}.room`);
  localId(value.spawn, `${path}.spawn`);
  validateCondition(value.when, `${path}.when`);
  validateActions(value.onEnter, `${path}.onEnter`);
  if (value.quest !== undefined && value.quest !== null) id(value.quest, `${path}.quest`);
  if (value.roomVariant !== undefined) ref(value.roomVariant, `${path}.roomVariant`);
  if (value.mapId !== undefined) id(value.mapId, `${path}.mapId`);
  if (value.resumeAt !== undefined) {
    exactObjectV2(value.resumeAt, `${path}.resumeAt`, ['room', 'spawn']);
    id(value.resumeAt.room, `${path}.resumeAt.room`);
    localId(value.resumeAt.spawn, `${path}.resumeAt.spawn`);
  }
  if (value.layer !== undefined) validateSceneLayerV2(value.layer, `${path}.layer`);
  return value;
}

function validateIdMap(value, path, validate) {
  return record(value, path, (entry, entryPath, key) => {
    id(key, `${entryPath} key`);
    validate(entry, entryPath);
    if (entry.id !== key) fail(`${entryPath}.id`, 'must match its map key');
  });
}

function validateMapLocation(value, path) {
  exactObject(value, path, [
    'id', 'icon', 'caption', 'alwaysUnlocked', 'to', 'objectiveTarget',
    'vignette', 'onSelect',
  ]);
  id(value.id, `${path}.id`);
  ref(value.icon, `${path}.icon`);
  caption(value.caption, `${path}.caption`, 3);
  boolean(value.alwaysUnlocked, `${path}.alwaysUnlocked`);
  exactObject(value.to, `${path}.to`, ['room', 'spawn']);
  id(value.to.room, `${path}.to.room`);
  localId(value.to.spawn, `${path}.to.spawn`);
  if (value.objectiveTarget !== null) {
    exactObject(value.objectiveTarget, `${path}.objectiveTarget`, ['room', 'hotspot']);
    id(value.objectiveTarget.room, `${path}.objectiveTarget.room`);
    id(value.objectiveTarget.hotspot, `${path}.objectiveTarget.hotspot`);
  }
  exactObject(value.vignette, `${path}.vignette`, ['x', 'y', 'width', 'height']);
  number(value.vignette.x, `${path}.vignette.x`, { min: 0 });
  number(value.vignette.y, `${path}.vignette.y`, { min: 0 });
  number(value.vignette.width, `${path}.vignette.width`, { min: 88 });
  number(value.vignette.height, `${path}.vignette.height`, { min: 88 });
  validateActions(value.onSelect, `${path}.onSelect`, { min: 1 });

  const travelActions = value.onSelect
    .map((action, index) => ({ action, index }))
    .filter(({ action }) => action.type === 'travel.request');
  if (travelActions.length !== 1) fail(`${path}.onSelect`, 'must contain exactly one travel.request action');
  const [{ action: travelAction, index: travelIndex }] = travelActions;
  if (travelAction.room !== value.to.room || travelAction.spawn !== value.to.spawn) {
    fail(`${path}.onSelect[${travelIndex}]`, 'travel destination must exactly match to');
  }
  if (travelIndex !== value.onSelect.length - 1) {
    fail(`${path}.onSelect[${travelIndex}]`, 'travel.request must be the final action');
  }
}

function validateMapRoute(value, path) {
  exactObject(value, path, ['id', 'from', 'to', 'points']);
  id(value.id, `${path}.id`);
  id(value.from, `${path}.from`);
  id(value.to, `${path}.to`);
  if (value.from === value.to) fail(`${path}.to`, 'must differ from from');
  array(value.points, `${path}.points`, (point, pointPath) => {
    exactObject(point, pointPath, ['x', 'y']);
    number(point.x, `${pointPath}.x`, { min: 0 });
    number(point.y, `${pointPath}.y`, { min: 0 });
  }, { min: 2, max: 12 });
}

export function validateMap(value, path = 'map') {
  exactObject(value, path, ['contractVersion', 'id', 'asset', 'locations', 'routes']);
  if (value.contractVersion !== MAP_CONTRACT_VERSION) {
    fail(`${path}.contractVersion`, `must be ${MAP_CONTRACT_VERSION}`);
  }
  id(value.id, `${path}.id`);
  ref(value.asset, `${path}.asset`);
  array(value.locations, `${path}.locations`, validateMapLocation, { min: 1, max: 64 });
  array(value.routes, `${path}.routes`, validateMapRoute, { min: 1, max: 128 });

  const locationIds = new Set();
  const objectiveTargets = new Set();
  value.locations.forEach((location, index) => {
    if (locationIds.has(location.id)) fail(`${path}.locations[${index}].id`, 'must be unique');
    locationIds.add(location.id);
    if (location.objectiveTarget === null) return;
    const targetKey = `${location.objectiveTarget.room}:${location.objectiveTarget.hotspot}`;
    if (objectiveTargets.has(targetKey)) {
      fail(`${path}.locations[${index}].objectiveTarget`, 'must identify a unique objective target');
    }
    objectiveTargets.add(targetKey);
  });

  const routeIds = new Set();
  value.routes.forEach((route, index) => {
    if (routeIds.has(route.id)) fail(`${path}.routes[${index}].id`, 'must be unique');
    routeIds.add(route.id);
    if (!locationIds.has(route.from)) fail(`${path}.routes[${index}].from`, 'must reference a map location');
    if (!locationIds.has(route.to)) fail(`${path}.routes[${index}].to`, 'must reference a map location');
  });
  return value;
}

function validatePackageMapLocationV2(value, path) {
  exactObjectV2(
    value,
    path,
    ['id', 'to', 'onSelect'],
    ['icon', 'caption', 'alwaysUnlocked', 'objectiveTarget', 'vignette'],
  );
  id(value.id, `${path}.id`);
  if (value.icon !== undefined) ref(value.icon, `${path}.icon`);
  if (value.caption !== undefined) caption(value.caption, `${path}.caption`, 3);
  if (value.alwaysUnlocked !== undefined) boolean(value.alwaysUnlocked, `${path}.alwaysUnlocked`);
  exactObjectV2(value.to, `${path}.to`, ['room', 'spawn']);
  id(value.to.room, `${path}.to.room`);
  localId(value.to.spawn, `${path}.to.spawn`);
  if (value.objectiveTarget !== undefined && value.objectiveTarget !== null) {
    exactObjectV2(value.objectiveTarget, `${path}.objectiveTarget`, ['room', 'hotspot']);
    id(value.objectiveTarget.room, `${path}.objectiveTarget.room`);
    id(value.objectiveTarget.hotspot, `${path}.objectiveTarget.hotspot`);
  }
  if (value.vignette !== undefined) {
    exactObjectV2(value.vignette, `${path}.vignette`, ['x', 'y', 'width', 'height']);
    number(value.vignette.x, `${path}.vignette.x`, { min: 0 });
    number(value.vignette.y, `${path}.vignette.y`, { min: 0 });
    number(value.vignette.width, `${path}.vignette.width`, { min: 88 });
    number(value.vignette.height, `${path}.vignette.height`, { min: 88 });
  }
  validateActions(value.onSelect, `${path}.onSelect`, { min: 1 });

  const travelActions = value.onSelect
    .map((action, index) => ({ action, index }))
    .filter(({ action }) => action.type === 'travel.request');
  if (travelActions.length !== 1) fail(`${path}.onSelect`, 'must contain exactly one travel.request action');
  const [{ action: travelAction, index: travelIndex }] = travelActions;
  if (travelAction.room !== value.to.room || travelAction.spawn !== value.to.spawn) {
    fail(`${path}.onSelect[${travelIndex}]`, 'travel destination must exactly match to');
  }
  if (travelIndex !== value.onSelect.length - 1) {
    fail(`${path}.onSelect[${travelIndex}]`, 'travel.request must be the final action');
  }
}

function validatePackageMapRouteV2(value, path) {
  exactObjectV2(value, path, ['id', 'from', 'to', 'points']);
  id(value.id, `${path}.id`);
  id(value.from, `${path}.from`);
  id(value.to, `${path}.to`);
  if (value.from === value.to) fail(`${path}.to`, 'must differ from from');
  array(value.points, `${path}.points`, (point, pointPath) => {
    exactObjectV2(point, pointPath, ['x', 'y']);
    number(point.x, `${pointPath}.x`, { min: 0 });
    number(point.y, `${pointPath}.y`, { min: 0 });
  }, { min: 2, max: 12 });
}

function validatePackageMapV2(value, path) {
  exactObjectV2(value, path, ['id', 'asset', 'locations', 'routes']);
  id(value.id, `${path}.id`);
  ref(value.asset, `${path}.asset`);
  array(value.locations, `${path}.locations`, validatePackageMapLocationV2, { min: 1, max: 64 });
  array(value.routes, `${path}.routes`, validatePackageMapRouteV2, { max: 128 });

  const locationIds = new Set();
  const objectiveTargets = new Set();
  value.locations.forEach((location, index) => {
    if (locationIds.has(location.id)) fail(`${path}.locations[${index}].id`, 'must be unique');
    locationIds.add(location.id);
    if (!location.objectiveTarget) return;
    const targetKey = `${location.objectiveTarget.room}:${location.objectiveTarget.hotspot}`;
    if (objectiveTargets.has(targetKey)) {
      fail(`${path}.locations[${index}].objectiveTarget`, 'must identify a unique objective target');
    }
    objectiveTargets.add(targetKey);
  });

  const routeIds = new Set();
  value.routes.forEach((route, index) => {
    if (routeIds.has(route.id)) fail(`${path}.routes[${index}].id`, 'must be unique');
    routeIds.add(route.id);
    if (!locationIds.has(route.from)) fail(`${path}.routes[${index}].from`, 'must reference a map location');
    if (!locationIds.has(route.to)) fail(`${path}.routes[${index}].to`, 'must reference a map location');
  });
  return value;
}

function validateRecapV2(value, path) {
  exactObjectV2(value, path, ['id', 'voice', 'text', 'caption'], ['step']);
  id(value.id, `${path}.id`);
  ref(value.voice, `${path}.voice`);
  string(value.text, `${path}.text`, { max: 1000 });
  caption(value.caption, `${path}.caption`, 3);
  if (value.step !== undefined) localId(value.step, `${path}.step`);
}

function validateAssetRecordV2(value, path) {
  exactObjectV2(value, path, ['key', 'path', 'kind'], ['volume']);
  ref(value.key, `${path}.key`);
  ref(value.path, `${path}.path`);
  oneOf(value.kind, ['image', 'voice', 'sfx', 'music', 'font'], `${path}.kind`);
  if (value.volume !== undefined) number(value.volume, `${path}.volume`, { min: 0, max: 1 });
  if (value.volume !== undefined && !['voice', 'sfx', 'music'].includes(value.kind)) {
    fail(`${path}.volume`, 'is only valid for audio assets');
  }
}

function validatePackageActionOwnershipV2(action, path, chapterId, yearbookMoments) {
  const durableWrite = action.type === 'flag.set'
    ? ['flag', action.flag]
    : action.type === 'choice.record'
      ? ['id', action.id]
      : action.type === 'reward.grant'
        ? ['receipt', action.receipt]
        : null;
  if (durableWrite && !durableWrite[1].startsWith(`${chapterId}.`)) {
    fail(`${path}.${durableWrite[0]}`, `durable write must belong to ${chapterId}`);
  }
  if (action.type === 'yearbook.capture' && !yearbookMoments.has(action.moment)) {
    fail(`${path}.moment`, `must be declared in ${chapterId}.yearbookMoments`);
  }
  if (action.type === 'chapter.complete' && action.chapter !== chapterId) {
    fail(`${path}.chapter`, `must match package owner ${chapterId}`);
  }
}

function validatePackageActionsV2(
  value,
  path,
  chapterId,
  yearbookMoments,
  visited = new WeakSet(),
) {
  if (value === null || typeof value !== 'object') return;
  if (visited.has(value)) return;
  visited.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => validatePackageActionsV2(
      entry,
      `${path}[${index}]`,
      chapterId,
      yearbookMoments,
      visited,
    ));
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    const entryPath = `${path}.${key}`;
    if (PACKAGE_ACTION_ARRAY_KEYS.has(key) && Array.isArray(entry)) {
      validateActions(entry, entryPath);
      entry.forEach((action, index) => {
        validatePackageActionOwnershipV2(
          action,
          `${entryPath}[${index}]`,
          chapterId,
          yearbookMoments,
        );
      });
    } else {
      validatePackageActionsV2(entry, entryPath, chapterId, yearbookMoments, visited);
    }
  }
}

function validatePackageEntryV2(value, path) {
  object(value, path);
  id(value.id, `${path}.id`);
  jsonValue(value, path);
  return value;
}

function validatePackageRoomV2(value, path) {
  validatePackageEntryV2(value, path);
  object(value.spawns, `${path}.spawns`);
  for (const [spawnId, spawn] of Object.entries(value.spawns)) {
    localId(spawnId, `${path}.spawns.${spawnId} key`);
    object(spawn, `${path}.spawns.${spawnId}`);
    jsonValue(spawn, `${path}.spawns.${spawnId}`);
  }
  return value;
}

function packageIdOwnedByChapter(idValue, chapter, category) {
  if (idValue.startsWith(`${chapter}.`)) return true;
  if (category === 'npcs') return idValue.startsWith('npc.');
  if (category === 'setPieces') {
    return ['sp.', 'reduced.', 'fallback.', 'am.'].some((prefix) => idValue.startsWith(prefix));
  }
  if (category === 'maps' || category === 'mapLocations') {
    return idValue.startsWith(`map.${chapter}.`);
  }
  if (category === 'mapRoutes') return idValue.startsWith(`route.${chapter}.`);
  return false;
}

function validatePackageIdsV2(value, path) {
  const seen = new Map();
  const register = (idValue, idPath, category) => {
    if (!packageIdOwnedByChapter(idValue, value.id, category)) {
      fail(idPath, `must belong to ${value.id} using the ${category} identity convention`);
    }
    const previous = seen.get(idValue);
    if (previous) fail(idPath, `duplicates package id first declared at ${previous}`);
    seen.set(idValue, idPath);
  };

  for (const category of [
    'scenes',
    'rooms',
    'npcs',
    'dialogues',
    'quests',
    'learningBeats',
    'setPieces',
    'encounters',
    'minigames',
    'maps',
  ]) {
    for (const [idValue] of Object.entries(value[category])) {
      register(idValue, `${path}.${category}.${idValue}.id`, category);
    }
  }
  value.recaps.forEach((recap, index) => {
    register(recap.id, `${path}.recaps[${index}].id`, 'recaps');
  });
  for (const [mapId, map] of Object.entries(value.maps)) {
    map.locations.forEach((location, index) => {
      register(
        location.id,
        `${path}.maps.${mapId}.locations[${index}].id`,
        'mapLocations',
      );
    });
    map.routes.forEach((route, index) => {
      register(route.id, `${path}.maps.${mapId}.routes[${index}].id`, 'mapRoutes');
    });
  }
}

export function validateChapterV2(value, path = 'chapter') {
  exactObjectV2(value, path, [
    'contractVersion', 'id', 'number', 'title', 'season', 'start', 'sceneOrder',
    'scenes', 'rooms', 'npcs', 'dialogues', 'quests', 'learningBeats', 'setPieces',
    'encounters', 'minigames', 'chapterCard', 'yearbookMoments', 'maps', 'recaps',
    'assets', 'characterDependencies',
  ]);
  if (value.contractVersion !== CHAPTER_CONTRACT_VERSION) {
    fail(`${path}.contractVersion`, `must be ${CHAPTER_CONTRACT_VERSION}`);
  }
  chapterId(value.id, `${path}.id`);
  number(value.number, `${path}.number`, { min: 1, integer: true });
  if (value.id !== `ch${value.number}`) fail(`${path}.id`, 'must match chapter number');
  string(value.title, `${path}.title`, { max: 120 });
  ref(value.season, `${path}.season`);
  exactObjectV2(value.start, `${path}.start`, ['scene', 'room', 'spawn']);
  id(value.start.scene, `${path}.start.scene`);
  id(value.start.room, `${path}.start.room`);
  localId(value.start.spawn, `${path}.start.spawn`);
  array(value.sceneOrder, `${path}.sceneOrder`, id, { min: 1, unique: true });
  validateIdMap(value.scenes, `${path}.scenes`, validateSceneV2);
  validateIdMap(value.rooms, `${path}.rooms`, validatePackageRoomV2);
  validateIdMap(value.npcs, `${path}.npcs`, validatePackageEntryV2);
  validateIdMap(value.dialogues, `${path}.dialogues`, validateDialogue);
  validateIdMap(value.quests, `${path}.quests`, (quest, questPath) => (
    validateQuest(quest, questPath, { durableLifecycle: true })
  ));
  validateIdMap(value.learningBeats, `${path}.learningBeats`, validatePackageEntryV2);
  validateIdMap(value.setPieces, `${path}.setPieces`, validatePackageEntryV2);
  validateIdMap(value.encounters, `${path}.encounters`, validatePackageEntryV2);
  validateIdMap(value.minigames, `${path}.minigames`, validatePackageEntryV2);
  exactObjectV2(value.chapterCard, `${path}.chapterCard`, ['art', 'voice', 'title']);
  ref(value.chapterCard.art, `${path}.chapterCard.art`);
  ref(value.chapterCard.voice, `${path}.chapterCard.voice`);
  string(value.chapterCard.title, `${path}.chapterCard.title`, { max: 120 });
  array(value.yearbookMoments, `${path}.yearbookMoments`, id, { unique: true });
  value.yearbookMoments.forEach((moment, index) => {
    if (!moment.startsWith(`${value.id}.`)) {
      fail(`${path}.yearbookMoments[${index}]`, `must belong to ${value.id}`);
    }
  });
  validatePackageActionsV2(value, path, value.id, new Set(value.yearbookMoments));
  validateIdMap(value.maps, `${path}.maps`, validatePackageMapV2);
  array(value.recaps, `${path}.recaps`, validateRecapV2);
  record(value.assets, `${path}.assets`, (asset, assetPath, key) => {
    validateAssetRecordV2(asset, assetPath);
    if (asset.key !== key) fail(`${assetPath}.key`, 'must match its map key');
  });
  array(value.characterDependencies, `${path}.characterDependencies`, characterId, { unique: true });
  validatePackageIdsV2(value, path);

  const sceneIds = Object.keys(value.scenes);
  if (sceneIds.length !== value.sceneOrder.length) {
    fail(`${path}.sceneOrder`, 'must contain every scene exactly once');
  }
  const sceneOrders = new Map();
  let previousOrder = -1;
  value.sceneOrder.forEach((sceneId, index) => {
    if (sceneIds[index] !== sceneId) {
      fail(`${path}.sceneOrder[${index}]`, 'must exactly match scenes map order');
    }
    const scene = value.scenes[sceneId];
    if (!scene) fail(`${path}.sceneOrder[${index}]`, 'must reference a scene');
    const duplicate = sceneOrders.get(scene.order);
    if (duplicate) fail(`${path}.scenes.${sceneId}.order`, `duplicates scene order used by ${duplicate}`);
    sceneOrders.set(scene.order, sceneId);
    if (scene.order <= previousOrder) {
      fail(`${path}.sceneOrder[${index}]`, 'must follow ascending scene.order');
    }
    previousOrder = scene.order;
  });

  if (!Object.hasOwn(value.scenes, value.start.scene)) fail(`${path}.start.scene`, 'must reference a scene');
  if (!Object.hasOwn(value.rooms, value.start.room)) fail(`${path}.start.room`, 'must reference a room');
  const startRoom = value.rooms[value.start.room];
  if (startRoom && !Object.hasOwn(startRoom.spawns, value.start.spawn)) {
    fail(`${path}.start.spawn`, 'must reference a room spawn');
  }
  const startScene = value.scenes[value.start.scene];
  if (startScene && startScene.room !== value.start.room) fail(`${path}.start.room`, 'must match the start scene room');
  if (startScene && startScene.spawn !== value.start.spawn) fail(`${path}.start.spawn`, 'must match the start scene spawn');

  for (const [sceneKey, scene] of Object.entries(value.scenes)) {
    if (!Object.hasOwn(value.rooms, scene.room)) fail(`${path}.scenes.${sceneKey}.room`, 'must reference a room');
    const sceneRoom = value.rooms[scene.room];
    if (sceneRoom && !Object.hasOwn(sceneRoom.spawns, scene.spawn)) {
      fail(`${path}.scenes.${sceneKey}.spawn`, 'must reference a room spawn');
    }
    if (scene.quest !== undefined && scene.quest !== null && !Object.hasOwn(value.quests, scene.quest)) {
      fail(`${path}.scenes.${sceneKey}.quest`, 'must reference a quest');
    }
    if (scene.mapId !== undefined && !Object.hasOwn(value.maps, scene.mapId)) {
      fail(`${path}.scenes.${sceneKey}.mapId`, 'must reference a package map');
    }
    if (scene.resumeAt !== undefined) {
      const resumeRoom = value.rooms[scene.resumeAt.room];
      if (!resumeRoom) fail(`${path}.scenes.${sceneKey}.resumeAt.room`, 'must reference a room');
      if (resumeRoom && !Object.hasOwn(resumeRoom.spawns, scene.resumeAt.spawn)) {
        fail(`${path}.scenes.${sceneKey}.resumeAt.spawn`, 'must reference a room spawn');
      }
    }
  }
  for (const [mapKey, map] of Object.entries(value.maps)) {
    map.locations.forEach((location, index) => {
      const locationPath = `${path}.maps.${mapKey}.locations[${index}].to`;
      const room = value.rooms[location.to.room];
      if (!room) fail(`${locationPath}.room`, 'must reference a room');
      if (room && !Object.hasOwn(room.spawns, location.to.spawn)) {
        fail(`${locationPath}.spawn`, 'must reference a room spawn');
      }
    });
  }
  const recapIds = new Set();
  value.recaps.forEach((recap, index) => {
    if (recapIds.has(recap.id)) fail(`${path}.recaps[${index}].id`, 'must be unique');
    recapIds.add(recap.id);
  });
  return value;
}

export function validateChapterV1(value, path = 'chapter') {
  exactObject(value, path, [
    'contractVersion', 'id', 'number', 'title', 'season', 'start', 'scenes',
    'rooms', 'npcs', 'dialogues', 'quests', 'learningBeats', 'setPieces',
    'encounters', 'minigames', 'chapterCard', 'yearbookMoments',
  ]);
  if (value.contractVersion !== LEGACY_CHAPTER_CONTRACT_VERSION) {
    fail(`${path}.contractVersion`, `must be ${LEGACY_CHAPTER_CONTRACT_VERSION}`);
  }
  chapterId(value.id, `${path}.id`);
  number(value.number, `${path}.number`, { min: 1, integer: true });
  if (value.id !== `ch${value.number}`) fail(`${path}.id`, 'must match chapter number');
  string(value.title, `${path}.title`, { max: 120 });
  ref(value.season, `${path}.season`);
  exactObject(value.start, `${path}.start`, ['scene', 'room', 'spawn']);
  id(value.start.scene, `${path}.start.scene`);
  id(value.start.room, `${path}.start.room`);
  localId(value.start.spawn, `${path}.start.spawn`);
  validateIdMap(value.scenes, `${path}.scenes`, validateSceneV1);
  validateIdMap(value.rooms, `${path}.rooms`, validateRoom);
  validateIdMap(value.npcs, `${path}.npcs`, validateNpc);
  validateIdMap(value.dialogues, `${path}.dialogues`, validateDialogue);
  validateIdMap(value.quests, `${path}.quests`, validateQuest);
  validateIdMap(value.learningBeats, `${path}.learningBeats`, validateLearningBeat);
  validateIdMap(value.setPieces, `${path}.setPieces`, validateSetPiece);
  object(value.encounters, `${path}.encounters`);
  jsonValue(value.encounters, `${path}.encounters`);
  object(value.minigames, `${path}.minigames`);
  jsonValue(value.minigames, `${path}.minigames`);
  exactObject(value.chapterCard, `${path}.chapterCard`, ['art', 'voice', 'title']);
  ref(value.chapterCard.art, `${path}.chapterCard.art`);
  ref(value.chapterCard.voice, `${path}.chapterCard.voice`);
  string(value.chapterCard.title, `${path}.chapterCard.title`, { max: 120 });
  array(value.yearbookMoments, `${path}.yearbookMoments`, id, { unique: true });

  if (!Object.hasOwn(value.scenes, value.start.scene)) fail(`${path}.start.scene`, 'must reference a scene');
  if (!Object.hasOwn(value.rooms, value.start.room)) fail(`${path}.start.room`, 'must reference a room');
  const startRoom = value.rooms[value.start.room];
  if (startRoom && !Object.hasOwn(startRoom.spawns, value.start.spawn)) fail(`${path}.start.spawn`, 'must reference a room spawn');
  for (const [sceneKey, scene] of Object.entries(value.scenes)) {
    if (!Object.hasOwn(value.rooms, scene.room)) fail(`${path}.scenes.${sceneKey}.room`, 'must reference a room');
    const sceneRoom = value.rooms[scene.room];
    if (sceneRoom && !Object.hasOwn(sceneRoom.spawns, scene.spawn)) fail(`${path}.scenes.${sceneKey}.spawn`, 'must reference a room spawn');
    if (scene.next !== null && !Object.hasOwn(value.scenes, scene.next)) fail(`${path}.scenes.${sceneKey}.next`, 'must reference a scene');
  }
  return value;
}

export function validateChapter(value, path = 'chapter') {
  object(value, path);
  if (value.contractVersion === CHAPTER_CONTRACT_VERSION) return validateChapterV2(value, path);
  if (value.contractVersion === LEGACY_CHAPTER_CONTRACT_VERSION) return validateChapterV1(value, path);
  fail(
    `${path}.contractVersion`,
    `must be ${LEGACY_CHAPTER_CONTRACT_VERSION} or ${CHAPTER_CONTRACT_VERSION}`,
  );
}

function payloadObject(value, path, required, optional = []) {
  return exactObject(value, path, required, optional);
}

function validateAudioPayload(value, path) {
  object(value, path);
  if (value.command === 'sfx' || value.command === 'voice') {
    payloadObject(value, path, ['command', 'key'], ['volume']);
    ref(value.key, `${path}.key`);
    if (value.volume !== undefined) number(value.volume, `${path}.volume`, { min: 0, max: 1 });
  } else if (value.command === 'music') {
    payloadObject(value, path, ['command', 'key', 'mode'], ['fadeSeconds']);
    ref(value.key, `${path}.key`);
    oneOf(value.mode, ['play', 'crossfade', 'stop'], `${path}.mode`);
    if (value.fadeSeconds !== undefined) number(value.fadeSeconds, `${path}.fadeSeconds`, { min: 0 });
  } else if (value.command === 'stopVoice') {
    payloadObject(value, path, ['command']);
  } else {
    fail(`${path}.command`, 'must be sfx, voice, music, or stopVoice');
  }
}

function validateCameraPayload(value, path) {
  object(value, path);
  if (value.command === 'shake') {
    payloadObject(value, path, ['command', 'strength', 'duration']);
    number(value.strength, `${path}.strength`, { min: 0 });
    number(value.duration, `${path}.duration`, { min: 0 });
  } else if (value.command === 'focus') {
    payloadObject(value, path, ['command', 'x', 'y', 'zoom', 'duration']);
    number(value.x, `${path}.x`);
    number(value.y, `${path}.y`);
    number(value.zoom, `${path}.zoom`, { min: 0.01 });
    number(value.duration, `${path}.duration`, { min: 0 });
  } else if (value.command === 'reset') {
    payloadObject(value, path, ['command'], ['duration']);
    if (value.duration !== undefined) number(value.duration, `${path}.duration`, { min: 0 });
  } else {
    fail(`${path}.command`, 'must be shake, focus, or reset');
  }
}

export function validateWorldEventPayload(type, value, path = 'event.payload') {
  if (!WORLD_EVENT_TYPE_SET.has(type)) fail(path, `has unregistered event type ${type}`);
  switch (type) {
    case 'state.changed':
      payloadObject(value, path, ['paths', 'reason']);
      stringArray(value.paths, `${path}.paths`, { min: 1, unique: true });
      ref(value.reason, `${path}.reason`);
      break;
    case 'save.dirty':
      payloadObject(value, path, ['reason']);
      oneOf(value.reason, SAVE_DIRTY_REASONS, `${path}.reason`);
      break;
    case 'save.flushRequested':
      payloadObject(value, path, ['reason']);
      oneOf(value.reason, SAVE_FLUSH_REASONS, `${path}.reason`);
      break;
    case 'save.persistenceSuppressed':
      payloadObject(value, path, ['reason']);
      oneOf(value.reason, SAVE_SUPPRESSION_REASONS, `${path}.reason`);
      break;
    case 'room.transitionRequested':
      payloadObject(value, path, ['from', 'to', 'spawn', 'effect']);
      id(value.from, `${path}.from`);
      id(value.to, `${path}.to`);
      localId(value.spawn, `${path}.spawn`);
      oneOf(value.effect, ['ink', 'sparkle', 'crossfade', 'none'], `${path}.effect`);
      break;
    case 'room.entered':
      payloadObject(value, path, ['room', 'spawn']);
      id(value.room, `${path}.room`);
      localId(value.spawn, `${path}.spawn`);
      break;
    case 'dialogue.opened':
    case 'dialogue.lineChanged':
    case 'dialogue.choicesChanged':
      payloadObject(value, path, ['script', 'node']);
      id(value.script, `${path}.script`);
      localId(value.node, `${path}.node`);
      break;
    case 'dialogue.closed':
      payloadObject(value, path, ['script', 'reason']);
      id(value.script, `${path}.script`);
      oneOf(value.reason, ['completed', 'cancelled', 'interrupted'], `${path}.reason`);
      break;
    case 'quest.objectiveChanged':
      payloadObject(value, path, ['quest', 'step']);
      id(value.quest, `${path}.quest`);
      localId(value.step, `${path}.step`);
      break;
    case 'hint.lookRequested':
    case 'hint.trailRequested':
    case 'hint.assistTriggered':
      payloadObject(value, path, ['quest', 'step', 'target']);
      id(value.quest, `${path}.quest`);
      localId(value.step, `${path}.step`);
      id(value.target, `${path}.target`);
      break;
    case 'hint.voiceRequested':
      payloadObject(value, path, ['quest', 'step', 'voice', 'text']);
      id(value.quest, `${path}.quest`);
      localId(value.step, `${path}.step`);
      ref(value.voice, `${path}.voice`);
      string(value.text, `${path}.text`, { max: 1000 });
      break;
    case 'hint.cleared':
      payloadObject(value, path, ['quest', 'step', 'reason']);
      id(value.quest, `${path}.quest`);
      localId(value.step, `${path}.step`);
      oneOf(value.reason, ['input', 'progress', 'objective'], `${path}.reason`);
      break;
    case 'reward.granted':
      if (Object.hasOwn(value, 'receipt')) {
        payloadObject(value, path, ['receipt']);
        id(value.receipt, `${path}.receipt`);
      } else {
        payloadObject(value, path, ['collection', 'id']);
        oneOf(value.collection, ['cards', 'treasures'], `${path}.collection`);
        ref(value.id, `${path}.id`);
      }
      break;
    case 'learning.started':
    case 'learning.completed':
      payloadObject(value, path, ['beat']);
      id(value.beat, `${path}.beat`);
      break;
    case 'spell.cast':
      payloadObject(value, path, ['spell', 'target', 'masteryTier']);
      ref(value.spell, `${path}.spell`);
      id(value.target, `${path}.target`);
      number(value.masteryTier, `${path}.masteryTier`, { min: 0, max: 3, integer: true });
      break;
    case 'encounter.phaseChanged':
      payloadObject(value, path, ['encounter', 'phase']);
      id(value.encounter, `${path}.encounter`);
      number(value.phase, `${path}.phase`, { min: 1, integer: true });
      break;
    case 'setPiece.started':
      payloadObject(value, path, ['id', 'startedAt']);
      id(value.id, `${path}.id`);
      number(value.startedAt, `${path}.startedAt`, { min: 0 });
      break;
    case 'setPiece.completed':
      payloadObject(value, path, ['id']);
      id(value.id, `${path}.id`);
      break;
    case 'actor.animationRequested':
      payloadObject(value, path, ['actor', 'action'], ['expression', 'temporaryProp']);
      id(value.actor, `${path}.actor`);
      localId(value.action, `${path}.action`);
      if (value.expression !== undefined) localId(value.expression, `${path}.expression`);
      if (value.temporaryProp !== undefined) ref(value.temporaryProp, `${path}.temporaryProp`);
      break;
    case 'audio.command':
      validateAudioPayload(value, path);
      break;
    case 'particles.emit':
      payloadObject(value, path, ['preset', 'x', 'y', 'count']);
      ref(value.preset, `${path}.preset`);
      number(value.x, `${path}.x`);
      number(value.y, `${path}.y`);
      number(value.count, `${path}.count`, { min: 0, max: PARTICLE_LIMITS.hardCap, integer: true });
      break;
    case 'camera.command':
      validateCameraPayload(value, path);
      break;
    case 'feedback.command':
      payloadObject(value, path, ['kind', 'x', 'y']);
      ref(value.kind, `${path}.kind`);
      number(value.x, `${path}.x`);
      number(value.y, `${path}.y`);
      break;
    case 'ui.openRequested':
      payloadObject(value, path, ['surface'], ['tab']);
      ref(value.surface, `${path}.surface`);
      if (value.tab !== undefined) ref(value.tab, `${path}.tab`);
      break;
    case 'ui.closeRequested':
      payloadObject(value, path, ['surface']);
      ref(value.surface, `${path}.surface`);
      break;
    case 'yearbook.captureRequested':
      payloadObject(value, path, ['moment', 'caption']);
      id(value.moment, `${path}.moment`);
      caption(value.caption, `${path}.caption`, 3);
      break;
    case 'chapter.completionFailed':
      payloadObject(value, path, ['chapter', 'nextChapter']);
      chapterId(value.chapter, `${path}.chapter`);
      chapterId(value.nextChapter, `${path}.nextChapter`);
      break;
    case 'chapter.completed':
      payloadObject(value, path, ['chapter', 'nextChapter']);
      chapterId(value.chapter, `${path}.chapter`);
      if (value.nextChapter !== null) chapterId(value.nextChapter, `${path}.nextChapter`);
      break;
    default:
      fail(path, `has unsupported event type ${type}`);
  }
  return value;
}

export function validateWorldEvent(value, path = 'event') {
  exactObject(value, path, ['seq', 'at', 'type', 'payload']);
  number(value.seq, `${path}.seq`, { min: 0, integer: true });
  number(value.at, `${path}.at`, { min: 0 });
  if (!WORLD_EVENT_TYPE_SET.has(value.type)) fail(`${path}.type`, 'must be a registered World-to-Game event');
  validateWorldEventPayload(value.type, value.payload, `${path}.payload`);
  return value;
}

export const ASSET_KINDS = Object.freeze(['image', 'voice', 'sfx', 'music', 'font']);

export function validateAssetManifestEntry(value, path = 'asset') {
  exactObject(value, path, ['path', 'kind', 'chapter'], ['volume']);
  ref(value.path, `${path}.path`);
  oneOf(value.kind, ASSET_KINDS, `${path}.kind`);
  if (value.chapter !== null) chapterId(value.chapter, `${path}.chapter`);
  if (value.volume !== undefined) number(value.volume, `${path}.volume`, { min: 0, max: 1 });
  if (value.volume !== undefined && !['voice', 'sfx', 'music'].includes(value.kind)) {
    fail(`${path}.volume`, 'is only valid for audio assets');
  }
  return value;
}
