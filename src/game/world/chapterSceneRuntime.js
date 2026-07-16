import { conditionMatches } from '../core/conditions.js';
import { selectChapterScene } from './sceneSelection.js';

const STORY_LAYER_COLLECTIONS = Object.freeze([
  'occupants',
  'hotspots',
  'exits',
  'ambientSetPieces',
]);

function legacySceneSelection(chapter, roomId, save) {
  return Object.values(chapter?.scenes ?? {}).find((scene) => (
    scene.room === roomId && conditionMatches(scene.when, save)
  )) ?? null;
}

/**
 * Version-two chapters select the latest eligible explicitly ordered scene.
 * Version-one chapters retain insertion-order behavior until their compatibility
 * projection is retired, so this helper cannot silently change Chapter One.
 */
export function selectRuntimeScene({ chapter, roomId, savedSceneId = null, save }) {
  if (chapter?.contractVersion === 2) {
    return selectChapterScene({
      scenes: chapter.scenes,
      roomId,
      savedSceneId,
      save,
    });
  }
  return legacySceneSelection(chapter, roomId, save);
}

/**
 * A room owns persistent physical space. A version-two scene contributes only
 * the story elements active at that point in the chapter. The merged result is
 * ephemeral and never mutates either authored source object.
 */
export function composeSceneRoom(room, scene) {
  const layer = scene?.layer;
  if (!layer) return room;

  return Object.freeze({
    ...room,
    ...Object.fromEntries(STORY_LAYER_COLLECTIONS.map((key) => [
      key,
      Object.freeze([
        ...(room?.[key] ?? []),
        ...(layer[key] ?? []),
      ]),
    ])),
  });
}

export function resolveChapterSceneState({
  chapter,
  roomId,
  savedSceneId = null,
  save,
  legacyRoomVariant = 'base',
}) {
  const scene = selectRuntimeScene({ chapter, roomId, savedSceneId, save });
  const room = chapter?.rooms?.[roomId] ?? null;
  return Object.freeze({
    scene,
    room: composeSceneRoom(room, scene),
    roomVariant: scene?.roomVariant ?? legacyRoomVariant,
  });
}

export { STORY_LAYER_COLLECTIONS };
