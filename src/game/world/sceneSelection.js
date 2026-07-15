import { conditionMatches } from '../core/conditions.js';

function scenesInRoom(scenes, roomId, save) {
  return Object.values(scenes ?? {}).filter((scene) => (
    scene.room === roomId && conditionMatches(scene.when, save)
  ));
}

/**
 * Preserve a valid saved scene. When content changes make that scene invalid,
 * resume at the latest eligible authored story state for the physical room.
 */
export function selectChapterScene({ scenes, roomId, savedSceneId = null, save }) {
  const eligible = scenesInRoom(scenes, roomId, save);
  const saved = savedSceneId === null ? null : scenes?.[savedSceneId];
  if (saved && eligible.includes(saved)) return saved;
  return eligible.reduce((latest, scene) => (
    latest === null || scene.order > latest.order ? scene : latest
  ), null);
}
