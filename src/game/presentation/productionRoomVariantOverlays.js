import { chapter1PresentationPackage } from '../chapters/ch1/presentation.js';
import { chapter2PresentationPackage } from '../chapters/ch2/presentation.js';

const presentationPackages = Object.freeze([
  chapter1PresentationPackage,
  chapter2PresentationPackage,
]);

const overlayByRoomVariant = new Map();
const roomMusicByChapter = new Map();
for (const presentationPackage of presentationPackages) {
  for (const overlay of presentationPackage.roomVariantOverlays ?? []) {
    overlayByRoomVariant.set(`${overlay.roomId}:${overlay.variant}`, overlay);
  }
  if (presentationPackage.roomMusic) {
    roomMusicByChapter.set(presentationPackage.chapterId, presentationPackage.roomMusic);
  }
}

/** Resolves ordinary room music without teaching the game shell chapter IDs. */
export function resolveProductionRoomMusic({ chapterId, roomId } = {}) {
  const registration = roomMusicByChapter.get(chapterId);
  if (!registration) return null;
  return registration.rooms?.[roomId] ?? registration.default ?? null;
}

/** Draws the code-native presentation registered by the owning chapter. */
export function drawProductionRoomVariantOverlay(context, request = {}) {
  const overlay = overlayByRoomVariant.get(`${request.roomId}:${request.variant}`);
  if (!overlay) return false;
  overlay.draw(context, request);
  return true;
}

/** Lets an owning chapter move its painted room before the normal foreground overlay. */
export function drawProductionRoomVariantBackground(context, request = {}, drawBackground) {
  if (typeof drawBackground !== 'function') {
    throw new TypeError('Room presentation requires a drawBackground callback.');
  }
  const overlay = overlayByRoomVariant.get(`${request.roomId}:${request.variant}`);
  if (typeof overlay?.drawBackground !== 'function') {
    drawBackground();
    return false;
  }
  overlay.drawBackground(context, request, drawBackground);
  return true;
}
