export const GUIDE_WALK_CUE = Object.freeze({
  id: 'ch1.guideTapToWalk',
  chapterId: 'ch1',
  roomId: 'ch1.bedroom',
  guideNpc: 'npc.guide',
  startX: 250,
  destinationX: 155,
  y: 610,
  walkSeconds: 1.6,
  turnSeconds: 0.35,
  footprintDelaySeconds: 0.2,
  footprintRevealSeconds: 1.55,
});

export function guideWalkCueAvailable({ chapterId, roomId, flags } = {}) {
  return chapterId === GUIDE_WALK_CUE.chapterId
    && roomId === GUIDE_WALK_CUE.roomId
    && flags?.['ch1.guideMet'] === true
    && flags?.['ch1.leakyReached'] !== true;
}

export function createGuideWalkCueSnapshot({
  time = 0,
  startedAt = 0,
  playerStart = null,
  reducedMotion = false,
} = {}) {
  const elapsed = Math.max(0, time - startedAt);
  const rawWalkProgress = reducedMotion
    ? 1
    : clamp01(elapsed / GUIDE_WALK_CUE.walkSeconds);
  const walkProgress = smoothstep(rawWalkProgress);
  const guideX = mix(GUIDE_WALK_CUE.startX, GUIDE_WALK_CUE.destinationX, walkProgress);
  const stage = reducedMotion || elapsed >= GUIDE_WALK_CUE.walkSeconds + GUIDE_WALK_CUE.turnSeconds
    ? 'beckon'
    : elapsed >= GUIDE_WALK_CUE.walkSeconds
      ? 'turn'
      : 'walk';
  const footprintProgress = reducedMotion
    ? 1
    : smoothstep(clamp01(
      (elapsed - GUIDE_WALK_CUE.footprintDelaySeconds) / GUIDE_WALK_CUE.footprintRevealSeconds,
    ));
  const violetX = Number.isFinite(playerStart?.x) ? playerStart.x : 360;
  const violetY = Number.isFinite(playerStart?.y) ? playerStart.y : GUIDE_WALK_CUE.y;
  const direction = Math.sign(GUIDE_WALK_CUE.destinationX - violetX) || -1;

  return Object.freeze({
    id: GUIDE_WALK_CUE.id,
    stage,
    elapsed,
    progress: walkProgress,
    guide: Object.freeze({
      npc: GUIDE_WALK_CUE.guideNpc,
      x: guideX,
      y: GUIDE_WALK_CUE.y,
      facing: stage === 'walk' ? 'left' : 'right',
      pose: stage === 'walk' ? 'walking' : stage === 'beckon' ? 'beckon' : 'idle',
      walking: stage === 'walk',
    }),
    footprints: Object.freeze({
      from: Object.freeze({ x: violetX + direction * 24, y: violetY + 7 }),
      to: Object.freeze({ x: GUIDE_WALK_CUE.destinationX - direction * 48, y: GUIDE_WALK_CUE.y + 7 }),
      progress: footprintProgress,
    }),
    // The authored "This way!" clip will attach here when its voice pass resumes.
    // Keeping the hook null makes the current code-only cue intentionally silent.
    voice: null,
  });
}

export function applyGuideWalkCueToOccupants(occupants, cue) {
  if (!cue) return occupants;
  return occupants.map((occupant) => occupant.npc === cue.guide.npc
    ? Object.freeze({
        ...occupant,
        x: cue.guide.x,
        y: cue.guide.y,
        facing: cue.guide.facing,
        pose: cue.guide.pose,
      })
    : occupant);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function mix(from, to, progress) {
  return from + (to - from) * progress;
}

function smoothstep(value) {
  return value * value * (3 - 2 * value);
}
