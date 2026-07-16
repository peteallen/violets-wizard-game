export const GUIDE_WALK_CUES = Object.freeze({
  bedroom: Object.freeze({
    id: 'ch1.guideLeavesBedroom',
    chapterId: 'ch1',
    roomId: 'ch1.bedroom',
    guideNpc: 'npc.guide',
    destinationTargetId: 'bedroom.exit',
    startX: 315,
    destinationX: 72,
    y: 610,
    walkSeconds: 1.55,
    footprintDelaySeconds: 0.12,
    footprintRevealSeconds: 1.35,
    available: (flags) => flags?.['ch1.guideMet'] === true
      && flags?.['ch1.leakyReached'] !== true,
  }),
  leaky: Object.freeze({
    id: 'ch1.guideLeavesLeaky',
    chapterId: 'ch1',
    roomId: 'ch1.leaky',
    guideNpc: 'npc.guide',
    destinationTargetId: 'leaky.courtyardDoor',
    startX: 760,
    destinationX: 1250,
    y: 610,
    walkSeconds: 1.9,
    footprintDelaySeconds: 0.16,
    footprintRevealSeconds: 1.68,
    available: (flags) => flags?.['ch1.leakyReached'] === true
      && flags?.['ch1.courtyardReached'] !== true,
  }),
});

// Retained as the bedroom default for focused render tests and existing callers.
export const GUIDE_WALK_CUE = GUIDE_WALK_CUES.bedroom;

export function resolveGuideWalkCue({ chapterId, roomId, flags } = {}) {
  return Object.values(GUIDE_WALK_CUES).find((cue) => (
    chapterId === cue.chapterId
      && roomId === cue.roomId
      && cue.available(flags)
  )) ?? null;
}

export function guideWalkCueAvailable({ chapterId, roomId, flags } = {}) {
  return Boolean(resolveGuideWalkCue({ chapterId, roomId, flags }));
}

export function createGuideWalkCueSnapshot({
  time = 0,
  startedAt = 0,
  playerStart = null,
  reducedMotion = false,
  cue = GUIDE_WALK_CUE,
} = {}) {
  const elapsed = Math.max(0, time - startedAt);
  const rawWalkProgress = reducedMotion
    ? 1
    : clamp01(elapsed / cue.walkSeconds);
  const walkProgress = smoothstep(rawWalkProgress);
  const guideX = mix(cue.startX, cue.destinationX, walkProgress);
  const departed = reducedMotion || elapsed >= cue.walkSeconds;
  const stage = departed ? 'departed' : 'walk';
  const footprintProgress = reducedMotion
    ? 1
    : smoothstep(clamp01(
      (elapsed - cue.footprintDelaySeconds) / cue.footprintRevealSeconds,
    ));
  const violetX = Number.isFinite(playerStart?.x) ? playerStart.x : cue.startX;
  const violetY = Number.isFinite(playerStart?.y) ? playerStart.y : cue.y;
  const direction = Math.sign(cue.destinationX - violetX) || -1;

  return Object.freeze({
    id: cue.id,
    roomId: cue.roomId,
    destinationTargetId: cue.destinationTargetId,
    stage,
    elapsed,
    progress: walkProgress,
    guide: Object.freeze({
      npc: cue.guideNpc,
      x: guideX,
      y: cue.y,
      facing: direction < 0 ? 'left' : 'right',
      pose: departed ? 'idle' : 'walking',
      walking: !departed,
      visible: !departed,
    }),
    footprints: Object.freeze({
      from: Object.freeze({ x: violetX + direction * 24, y: violetY + 7 }),
      to: Object.freeze({ x: cue.destinationX - direction * 82, y: cue.y + 7 }),
      progress: footprintProgress,
    }),
    // Each departure begins only after Hagrid's existing voiced line completes,
    // so the movement itself does not repeat or overlap another voice clip.
    voice: null,
  });
}

export function applyGuideWalkCueToOccupants(occupants, cue) {
  if (!cue) return occupants;
  if (!cue.guide.visible) {
    return occupants.filter((occupant) => occupant.npc !== cue.guide.npc);
  }
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
