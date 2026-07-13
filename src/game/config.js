export const WORLD = Object.freeze({
  width: 1280,
  height: 720,
  step: 1 / 60,
  maxFrameSeconds: 0.1,
  maxDpr: 2,
});

export const PALETTE = Object.freeze({
  ink: '#141126',
  night: '#1b2a4a',
  twilight: '#3a2d5e',
  candle: '#e8b44f',
  honey: '#f4d58d',
  parchment: '#f0e3c8',
  oak: '#5e4634',
  stone: '#8a7a66',
  violet: '#7a4fc9',
  interactive: '#ffd76a',
});

export const INPUT = Object.freeze({
  minimumTarget: 88,
  tapSlop: 20,
  parentHoldSeconds: 3,
});

export const HINTS = Object.freeze({
  petLookSeconds: 20,
  repeatSeconds: 45,
  sparkleFailures: 3,
  autoCompleteFailures: 5,
});

export const OBJECTIVE = Object.freeze({
  emphasisSeconds: 8,
});

export const EFFECTS = Object.freeze({
  particleCap: 300,
  celebrationParticleCap: 400,
  reducedParticleCap: 120,
  hardParticleCap: 400,
});

export const DUEL = Object.freeze({
  openingWindowSeconds: 1.2,
  minimumWindowSeconds: 0.7,
  missAssistMultiplier: 1.15,
});
