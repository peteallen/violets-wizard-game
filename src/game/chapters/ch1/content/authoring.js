export const noCondition = Object.freeze({});
export const standardSpeakerLayoutBounds = Object.freeze({ width: 148, height: 236, ground: 32 });
export const hagridLayoutBounds = Object.freeze({ width: 244, height: 340, ground: 35 });
export const owlLayoutBounds = Object.freeze({ width: 154, height: 188, ground: 25 });
export const petLayoutBounds = Object.freeze({ width: 132, height: 142, ground: 28 });

export function when({ allFlags = [], noFlags = [], profileEquals } = {}) {
  return {
    ...(allFlags.length ? { allFlags } : {}),
    ...(noFlags.length ? { noFlags } : {}),
    ...(profileEquals ? { profileEquals } : {}),
  };
}

export function circle(x, y, radius) {
  return { shape: 'circle', x, y, radius: Math.max(88, radius) };
}

export function rect(x, y, width, height) {
  return { shape: 'rect', x, y, width, height };
}

export function flagSet(flag, value = true) {
  return { type: 'flag.set', flag, value };
}

export function dialogueStart(script) {
  return { type: 'dialogue.start', script };
}

export function setPiecePlay(id) {
  return { type: 'setPiece.play', id };
}

export function uiOpen(surface, tab = null) {
  return { type: 'ui.open', surface, ...(tab ? { tab } : {}) };
}

export function audioSfx(key) {
  return { type: 'audio.command', command: 'sfx', key };
}

export function sfxCue(at, key) {
  return { type: 'cue', at, event: 'audio.command', payload: { command: 'sfx', key } };
}

export function violetActionCue(action, { expression, temporaryProp } = {}) {
  return {
    type: 'cue',
    at: 0,
    event: 'actor.animationRequested',
    payload: {
      actor: 'npc.violet',
      action,
      ...(expression ? { expression } : {}),
      ...(temporaryProp ? { temporaryProp } : {}),
    },
  };
}

export function musicCue(at, key) {
  return {
    type: 'cue',
    at,
    event: 'audio.command',
    payload: { command: 'music', key, mode: 'crossfade', fadeSeconds: 0.8 },
  };
}

export function travel(room, spawn, transition) {
  return {
    type: 'travel.request',
    room,
    spawn: spawn.split('.').at(-1),
    ...(transition ? { transition } : {}),
  };
}

export function mapLocation({ beforeTravel = [], to, ...location }) {
  const destination = { room: to.room, spawn: to.spawn.split('.').at(-1) };
  return {
    ...location,
    alwaysUnlocked: location.alwaysUnlocked ?? false,
    to: destination,
    onSelect: [...beforeTravel, { type: 'travel.request', ...destination }],
  };
}

export function voiceLine({ speaker, voice, text, caption, next, portraitPose = 'talk' }) {
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

export const roomSize = Object.freeze({ width: 1280, height: 720 });
export const streetSize = roomSize;
export const walkBand = Object.freeze({ top: 560, bottom: 640 });
