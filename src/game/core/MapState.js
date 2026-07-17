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

function freezePoint(point) {
  return Object.freeze({ x: point.x, y: point.y });
}

export function buildMapState(map, snapshot = {}) {
  if (!map || !Array.isArray(map.locations) || !Array.isArray(map.routes)) {
    throw new TypeError('buildMapState requires a validated map definition.');
  }

  const unlockedRooms = new Set(snapshot.unlockedRooms ?? []);
  const objectiveTarget = snapshot.objective?.mapStar ?? null;
  const locationStates = map.locations.map((location) => {
    const isObjective = sameObjectiveTarget(location.objectiveTarget, objectiveTarget);
    const unlocked = Boolean(
      location.alwaysUnlocked
      || location.to.room === snapshot.roomId
      || unlockedRooms.has(location.to.room)
      || isObjective,
    );
    return Object.freeze({
      id: location.id,
      icon: location.icon,
      caption: location.caption,
      to: Object.freeze({ ...location.to }),
      objectiveTarget: location.objectiveTarget
        ? Object.freeze({ ...location.objectiveTarget })
        : null,
      vignette: Object.freeze({ ...location.vignette }),
      isCurrent: location.to.room === snapshot.roomId,
      completed: unlocked && !isObjective && location.to.room !== snapshot.roomId,
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
  const objectiveLocation = locationStates.find((location) => location.isObjective) ?? null;

  return Object.freeze({
    id: map.id,
    objectiveLocationId: objectiveLocation?.id ?? null,
    locations: Object.freeze(locationStates),
    routes: Object.freeze(routes),
  });
}
