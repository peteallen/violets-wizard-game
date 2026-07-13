export const AFFORDANCE_TIERS = Object.freeze({
  thread: 'thread',
  discoverable: 'discoverable',
  secret: 'secret',
  none: 'none',
});

export const GLINT_SCHEDULE = Object.freeze({
  slotSeconds: 3,
  discoverableSeconds: 1.5,
  secretSeconds: 2,
  secretEverySlots: 3,
});

export const PET_HINT_SCHEDULE = Object.freeze({
  periodSeconds: 18,
  wanderSeconds: 4,
  pawSeconds: 4,
  returnSeconds: 4,
});

const TIME_EPSILON = 1e-9;

export class GlintActivationLedger {
  constructor({
    limit = 2,
    windowSeconds = GLINT_SCHEDULE.slotSeconds,
  } = {}) {
    this.limit = limit;
    this.windowSeconds = windowSeconds;
    this.history = [];
    this.seenScheduleKeys = new Set();
    this.active = null;
    this.lastTime = 0;
  }

  advance(states, time, roomId = '', { quiet = false } = {}) {
    const now = Math.max(0, time);
    if (now + TIME_EPSILON < this.lastTime) {
      throw new RangeError('Glint activation time must be monotonic.');
    }
    this.lastTime = now;

    if (
      this.active
      && (
        quiet
        || this.active.roomId !== roomId
        || now + TIME_EPSILON >= this.active.startedAt + this.active.duration
      )
    ) this.active = null;
    if (quiet || this.active) return this.snapshot(now);

    const candidate = selectGlintCandidate(states, now, roomId);
    if (!candidate || this.seenScheduleKeys.has(candidate.scheduleKey)) return this.snapshot(now);
    this.seenScheduleKeys.add(candidate.scheduleKey);

    const inclusiveWindowStart = now - this.windowSeconds;
    const startsInWindow = this.history.filter(
      ({ startedAt }) => startedAt + TIME_EPSILON >= inclusiveWindowStart
        && startedAt <= now + TIME_EPSILON,
    );
    if (startsInWindow.length >= this.limit) return this.snapshot(now);

    const activation = Object.freeze({
      targetId: candidate.targetId,
      tier: candidate.tier,
      roomId,
      slot: candidate.slot,
      scheduledAt: candidate.scheduledAt,
      startedAt: now,
      duration: candidate.duration,
      scheduleKey: candidate.scheduleKey,
    });
    this.history.push(activation);
    this.active = activation;
    return this.snapshot(now);
  }

  snapshot(time = this.lastTime) {
    const now = Math.max(0, time);
    const active = this.active
      && now + TIME_EPSILON < this.active.startedAt + this.active.duration
      ? glintPresentation(this.active, now)
      : null;
    return Object.freeze({
      active,
      history: Object.freeze([...this.history]),
    });
  }
}

export function affordanceSeenReceipt(chapterId, targetId) {
  return `affordanceSeen:${chapterId}:${targetId}`;
}

export function createAffordancePlan({
  targets = [],
  objective = null,
  activeQuest = null,
  roomId = null,
  save = null,
  hintEscalated = false,
} = {}) {
  const activeTargets = targets.filter((target) => !targetIsSpent(target, save));
  const thread = resolveGoldenThread({ targets: activeTargets, objective, activeQuest, roomId, hintEscalated });
  const states = targets.map((target) => Object.freeze({
    target,
    tier: targetTier(target, thread?.worldTargetId ?? null, save),
  }));
  return Object.freeze({ thread, states: Object.freeze(states) });
}

export function createAffordanceSnapshot({
  targets = [],
  objective = null,
  activeQuest = null,
  roomId = null,
  save = null,
  time = 0,
  quiet = false,
  hintEscalated = false,
  hasPet = false,
  reducedMotion = false,
  scheduledGlint = undefined,
  glintActivationHistory = [],
} = {}) {
  const { thread, states } = createAffordancePlan({
    targets,
    objective,
    activeQuest,
    roomId,
    save,
    hintEscalated,
  });
  const activeGlint = quiet
    ? null
    : scheduledGlint === undefined
      ? scheduleGlint(states, time, roomId)
      : scheduledGlint;
  const targetsWithSalience = states.map(({ target, tier }) => Object.freeze({
    ...target,
    salience: Object.freeze({
      tier,
      visible: quiet
        ? 'none'
        : target.id === thread?.worldTargetId
          ? 'thread'
          : target.id === activeGlint?.targetId
            && tier === activeGlint.tier
            && (!activeGlint.roomId || activeGlint.roomId === roomId)
            ? 'glint'
            : 'none',
      intensity: target.id === thread?.worldTargetId ? thread.intensity : 'quiet',
      glint: target.id === activeGlint?.targetId && tier === activeGlint.tier ? activeGlint : null,
    }),
  }));
  const secretStates = states.filter(({ tier }) => tier === AFFORDANCE_TIERS.secret);
  const petHint = quiet || !hasPet
    ? null
    : schedulePetHint(secretStates, time, roomId, { reducedMotion });

  return Object.freeze({
    thread,
    glints: Object.freeze(activeGlint ? [activeGlint] : []),
    glintActivations: Object.freeze([...glintActivationHistory]),
    glintActivationTimestamps: Object.freeze(glintActivationHistory.map(({ startedAt }) => startedAt)),
    petHint,
    quiet,
    budget: Object.freeze({
      threadLimit: 1,
      glintLimit: 2,
      windowSeconds: GLINT_SCHEDULE.slotSeconds,
    }),
    targets: Object.freeze(targetsWithSalience),
  });
}

export function resolveGoldenThread({
  targets = [],
  objective = null,
  activeQuest = null,
  roomId = null,
  hintEscalated = false,
} = {}) {
  if (!objective || !activeQuest) return null;
  const hintTargetId = activeQuest.step?.hints?.trailTarget ?? activeQuest.step?.hints?.lookTarget ?? null;
  const localHintTarget = findTarget(targets, hintTargetId);
  if (localHintTarget) return threadState(localHintTarget.id, objective, hintEscalated, 'world');

  if (hintTargetId?.startsWith('hud.')) {
    return threadState(hintTargetId, objective, hintEscalated, 'hud', null);
  }

  const mapTargetId = objective.mapStar?.hotspot ?? null;
  const localMapTarget = findTarget(targets, mapTargetId);
  if (localMapTarget) return threadState(localMapTarget.id, objective, hintEscalated, 'world');

  const destinationRoom = objective.mapStar?.room ?? null;
  const routeExit = destinationRoom
    ? targets.find((target) => target.source === 'exit' && target.actions?.some(
      (action) => action.type === 'travel.request' && action.room === destinationRoom,
    ))
    : null;
  const hintRoom = hintTargetId?.split('.')[0] ?? null;
  const currentRoom = roomId?.split('.').at(-1) ?? null;
  if (hintRoom && hintRoom !== currentRoom) {
    const wayBack = routeExit ?? targets.find((target) => target.source === 'exit');
    if (wayBack) return threadState(wayBack.id, objective, hintEscalated, 'world');
  }

  const authoredObjective = targets.find((target) => target.presentation?.glow === 'objective');
  if (authoredObjective) return threadState(authoredObjective.id, objective, hintEscalated, 'world');

  if (routeExit) return threadState(routeExit.id, objective, hintEscalated, 'world');

  const onlyWayForward = targets.find((target) => target.source === 'exit');
  if (onlyWayForward) return threadState(onlyWayForward.id, objective, hintEscalated, 'world');

  if (mapTargetId) return threadState(mapTargetId, objective, hintEscalated, 'map', null);
  if (hintTargetId) return threadState(hintTargetId, objective, hintEscalated, externalChannel(hintTargetId), null);
  return threadState(
    `objective.${activeQuest.quest.id}.${activeQuest.stepId}`,
    objective,
    hintEscalated,
    'pending',
    null,
  );
}

export function scheduleGlint(states, time, roomId = '') {
  const candidate = selectGlintCandidate(states, time, roomId);
  if (!candidate) return null;
  return glintPresentation({ ...candidate, startedAt: candidate.scheduledAt, roomId }, time);
}

export function selectGlintCandidate(states, time, roomId = '') {
  const discoverables = states.filter(({ tier }) => tier === AFFORDANCE_TIERS.discoverable);
  const secrets = states.filter(({ tier }) => tier === AFFORDANCE_TIERS.secret);
  if (discoverables.length === 0 && secrets.length === 0) return null;

  const slot = Math.floor(Math.max(0, time) / GLINT_SCHEDULE.slotSeconds);
  const scheduledAt = slot * GLINT_SCHEDULE.slotSeconds;
  const elapsed = Math.max(0, time) - scheduledAt;
  const secretPhase = Math.floor(stablePhase(roomId) * GLINT_SCHEDULE.secretEverySlots);
  const cyclePosition = positiveModulo(slot + secretPhase, GLINT_SCHEDULE.secretEverySlots);
  const secretTurn = secrets.length > 0 && cyclePosition === 0;
  const discoverableTurn = secrets.length > 0
    ? cyclePosition === 1
    : positiveModulo(slot + secretPhase, 2) === 0;
  if (!secretTurn && !discoverableTurn) return null;
  const pool = secretTurn ? secrets : discoverables;
  if (pool.length === 0) return null;
  const selectionCycle = secretTurn
    ? Math.floor((slot + secretPhase) / GLINT_SCHEDULE.secretEverySlots)
    : slot;
  const selected = pool[positiveModulo(selectionCycle, pool.length)];
  const duration = selected.tier === AFFORDANCE_TIERS.secret
    ? GLINT_SCHEDULE.secretSeconds
    : GLINT_SCHEDULE.discoverableSeconds;
  if (elapsed >= duration) return null;
  return Object.freeze({
    targetId: selected.target.id,
    tier: selected.tier,
    slot,
    scheduledAt,
    duration,
    scheduleKey: `${roomId}:${slot}:${selected.target.id}`,
  });
}

function glintPresentation(activation, time) {
  const progress = Math.max(0, Math.min(1, (time - activation.startedAt) / activation.duration));
  const tierStrength = activation.tier === AFFORDANCE_TIERS.secret ? 0.34 : 0.58;
  return Object.freeze({
    ...activation,
    progress,
    alpha: Math.sin(progress * Math.PI) * tierStrength,
  });
}

export function schedulePetHint(secretStates, time, roomId = '', { reducedMotion = false } = {}) {
  if (secretStates.length === 0) return null;
  const totalCueSeconds = PET_HINT_SCHEDULE.wanderSeconds
    + PET_HINT_SCHEDULE.pawSeconds
    + PET_HINT_SCHEDULE.returnSeconds;
  const offset = stablePhase(`${roomId}:pet`) * PET_HINT_SCHEDULE.periodSeconds;
  const shiftedTime = Math.max(0, time) + offset;
  const cycle = positiveModulo(shiftedTime, PET_HINT_SCHEDULE.periodSeconds);
  if (cycle >= totalCueSeconds) return null;
  const cycleIndex = Math.floor(shiftedTime / PET_HINT_SCHEDULE.periodSeconds);
  const selected = secretStates[positiveModulo(cycleIndex, secretStates.length)];
  const center = hitAreaCenter(selected.target.hitArea);
  if (reducedMotion) {
    return Object.freeze({
      targetId: selected.target.id,
      stage: 'look',
      approach: 0,
      x: center.x,
      y: center.y,
    });
  }
  if (cycle < PET_HINT_SCHEDULE.wanderSeconds) {
    return Object.freeze({
      targetId: selected.target.id,
      stage: 'wander',
      approach: smoothstep(cycle / PET_HINT_SCHEDULE.wanderSeconds),
      x: center.x,
      y: center.y,
    });
  }
  if (cycle < PET_HINT_SCHEDULE.wanderSeconds + PET_HINT_SCHEDULE.pawSeconds) {
    return Object.freeze({ targetId: selected.target.id, stage: 'paw', approach: 1, x: center.x, y: center.y });
  }
  const returnProgress = (cycle - PET_HINT_SCHEDULE.wanderSeconds - PET_HINT_SCHEDULE.pawSeconds)
    / PET_HINT_SCHEDULE.returnSeconds;
  return Object.freeze({
    targetId: selected.target.id,
    stage: 'return',
    approach: 1 - smoothstep(returnProgress),
    x: center.x,
    y: center.y,
  });
}

function targetTier(target, worldThreadTargetId, save) {
  if (target.id === worldThreadTargetId) return AFFORDANCE_TIERS.thread;
  if (targetIsSpent(target, save)) return AFFORDANCE_TIERS.none;
  if (target.presentation?.glow === 'hidden') return AFFORDANCE_TIERS.secret;
  if (
    target.presentation?.glow === 'soft'
    || target.presentation?.glow === 'interactionGold'
    || target.source === 'exit'
    || target.source === 'occupant'
  ) return AFFORDANCE_TIERS.discoverable;
  return AFFORDANCE_TIERS.none;
}

export function targetIsSpent(target, save) {
  if (
    target.advertisementReceipt
    && save?.progress?.storyChoices?.[target.advertisementReceipt] === true
  ) return true;
  for (const action of target.actions ?? []) {
    if (action.type === 'collection.add') {
      if (save?.collections?.[action.collection]?.includes(action.id)) return true;
    }
    if (action.type === 'flag.set' && save?.progress?.questFlags?.[action.flag] === (action.value ?? true)) return true;
  }
  return false;
}

function threadState(targetId, objective, hintEscalated, channel, worldTargetId = targetId) {
  return Object.freeze({
    targetId,
    worldTargetId,
    mapTargetId: objective.mapStar?.hotspot ?? null,
    channel,
    intensity: hintEscalated ? 'hint' : 'normal',
  });
}

function findTarget(targets, targetId) {
  if (!targetId) return null;
  return targets.find((target) => target.id === targetId || target.semanticId === targetId) ?? null;
}

function externalChannel(targetId) {
  return targetId?.split('.')[0] ?? 'external';
}

function hitAreaCenter(area) {
  if (area?.shape === 'rect') return { x: area.x + area.width / 2, y: area.y + area.height / 2 };
  return { x: area?.x ?? 0, y: area?.y ?? 0 };
}

function stablePhase(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffffffff;
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function smoothstep(value) {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}
