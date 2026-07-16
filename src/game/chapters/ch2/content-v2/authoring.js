export const noCondition = Object.freeze({});

export function when({ allFlags = [], anyFlags = [], noFlags = [], profileEquals } = {}) {
  return {
    ...(allFlags.length ? { allFlags } : {}),
    ...(anyFlags.length ? { anyFlags } : {}),
    ...(noFlags.length ? { noFlags } : {}),
    ...(profileEquals ? { profileEquals } : {}),
  };
}

export function flagSet(flag, value = true) {
  return { type: 'flag.set', flag, value };
}

export function choiceRecord(id, value) {
  return { type: 'choice.record', id, value };
}

export function characterSet(field, value) {
  return { type: 'character.set', field, value };
}

export function dialogueStart(script) {
  return { type: 'dialogue.start', script };
}

export function setPiecePlay(id) {
  return { type: 'setPiece.play', id };
}

export function travel(room, spawn, transition = 'crossfade') {
  return { type: 'travel.request', room, spawn, transition };
}

export function rewardGrant(receipt, { points = 0, cards = [], treasures = [] } = {}) {
  return { type: 'reward.grant', receipt, points, cards, treasures };
}

export function yearbookCapture(moment) {
  return { type: 'yearbook.capture', moment };
}

export function chapterComplete(chapter, nextChapter) {
  return { type: 'chapter.complete', chapter, nextChapter };
}

export function line({ speaker, voice, text, caption, next, portraitPose = 'talk' }) {
  return {
    type: 'line',
    speaker,
    voice,
    text,
    caption,
    phoneticText: null,
    portraitPose,
    next,
  };
}

export function circle(x, y, radius = 88) {
  return { shape: 'circle', x, y, radius: Math.max(88, radius) };
}

export function rect(x, y, width, height) {
  return { shape: 'rect', x, y, width: Math.max(88, width), height: Math.max(88, height) };
}

export function actionHotspot({
  id,
  hitArea,
  approach = null,
  when: condition = noCondition,
  icon,
  repeat = 'until-condition',
  onInteract,
}) {
  return {
    id,
    kind: 'action',
    hitArea,
    approach,
    when: condition,
    presentation: { icon, glow: 'gold-thread' },
    requiredSpell: null,
    repeat,
    onInteract,
  };
}

export function occupant(npc, x, y, facing = 'right', pose = 'idle', condition = noCondition) {
  return { npc, x, y, facing, pose, when: condition };
}

export function storyLayer({ occupants = [], hotspots = [], exits = [], ambientSetPieces = [] } = {}) {
  return { occupants, hotspots, exits, ambientSetPieces };
}
