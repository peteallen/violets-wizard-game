import { conditionMatches } from './conditions.js';

export const MAP_FOG_STATES = Object.freeze({
  clear: 'clear',
  soft: 'soft',
});

function sameObjectiveTarget(left, right) {
  return Boolean(
    left
    && right
    && left.room === right.room
    && left.hotspot === right.hotspot,
  );
}

function objectiveLocationFor(locations, objectiveTarget) {
  if (!objectiveTarget) return null;
  const exact = locations.find((location) => (
    sameObjectiveTarget(location.objectiveTarget, objectiveTarget)
  ));
  if (exact) return exact;
  const roomMatches = locations.filter((location) => (
    location.objectiveTarget?.room === objectiveTarget.room
  ));
  return roomMatches.length === 1 ? roomMatches[0] : null;
}

function freezePoint(point) {
  return Object.freeze({ x: point.x, y: point.y });
}

function conditionSave(snapshot) {
  if (snapshot.conditionState) return snapshot.conditionState;
  const known = snapshot.knownSpells
    ?? snapshot.spellbook?.known?.map((spell) => (typeof spell === 'string' ? spell : spell.id))
    ?? [];
  return {
    progress: { questFlags: snapshot.questFlags ?? {} },
    character: snapshot.character ?? {
      house: snapshot.house ?? null,
      pet: snapshot.pet ?? { type: null, name: null },
      appearance: { robeTrim: snapshot.player?.robeTrim ?? null },
      wandId: snapshot.hasWand ? 'known' : null,
    },
    spellbook: { known },
    settings: { learning: snapshot.learningMode ?? 'gentle' },
  };
}

export function buildMapState(map, snapshot = {}) {
  if (!map || !Array.isArray(map.locations) || !Array.isArray(map.routes)) {
    throw new TypeError('buildMapState requires a validated map definition.');
  }

  const unlockedRooms = new Set(snapshot.unlockedRooms ?? []);
  const objectiveTarget = snapshot.objective?.mapStar ?? null;
  const objectiveLocation = objectiveLocationFor(map.locations, objectiveTarget);
  const conditions = conditionSave(snapshot);
  const locationStates = map.locations.map((location) => {
    const isObjective = location === objectiveLocation;
    const conditionUnlocked = location.unlockWhen === undefined
      ? null
      : conditionMatches(location.unlockWhen, conditions);
    const unlocked = Boolean(
      (conditionUnlocked ?? (
        location.alwaysUnlocked
        || unlockedRooms.has(location.to.room)
      ))
      || location.to.room === snapshot.roomId
      || isObjective,
    );
    const completed = unlocked && (location.completeWhen !== undefined
      ? conditionMatches(location.completeWhen, conditions)
      : !isObjective && location.to.room !== snapshot.roomId);
    return Object.freeze({
      id: location.id,
      icon: location.icon,
      caption: location.caption,
      art: location.art ?? null,
      to: Object.freeze({ ...location.to }),
      objectiveTarget: location.objectiveTarget
        ? Object.freeze({ ...location.objectiveTarget })
        : null,
      activeObjectiveTarget: isObjective && objectiveTarget
        ? Object.freeze({ ...objectiveTarget })
        : null,
      vignette: Object.freeze({ ...location.vignette }),
      isCurrent: location.to.room === snapshot.roomId,
      completed,
      unlocked,
      isObjective,
      fogState: unlocked ? MAP_FOG_STATES.clear : MAP_FOG_STATES.soft,
      travelIntent: unlocked
        ? Object.freeze({ type: 'travel.request', ...location.to })
        : null,
    });
  });
  const locationsById = new Map(locationStates.map((location) => [location.id, location]));
  const routes = map.routes.map((route) => {
    const from = locationsById.get(route.from);
    const to = locationsById.get(route.to);
    const unlocked = Boolean(from?.unlocked && to?.unlocked);
    return Object.freeze({
      id: route.id,
      from: route.from,
      to: route.to,
      points: Object.freeze(route.points.map(freezePoint)),
      unlocked,
      fogState: unlocked ? MAP_FOG_STATES.clear : MAP_FOG_STATES.soft,
    });
  });
  const objectiveLocationState = locationStates.find((location) => location.isObjective) ?? null;

  return Object.freeze({
    id: map.id,
    asset: map.asset ?? null,
    objectiveLocationId: objectiveLocationState?.id ?? null,
    locations: Object.freeze(locationStates),
    routes: Object.freeze(routes),
  });
}
