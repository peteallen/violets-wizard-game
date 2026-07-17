import { chapter1PresentationPackage } from '../chapters/ch1/presentation.js';
import { chapter2PresentationPackage } from '../chapters/ch2/presentation.js';
import { chapter3PresentationPackage } from '../chapters/ch3/presentation.js';
import { chapter4PresentationPackage } from '../chapters/ch4/presentation.js';
import { createProductionPresentationRegistry } from './ProductionPresentationRegistry.js';

const presentationPackages = Object.freeze([
  chapter1PresentationPackage,
  chapter2PresentationPackage,
  chapter3PresentationPackage,
  chapter4PresentationPackage,
]);

export const productionPresentationRegistry = createProductionPresentationRegistry(
  presentationPackages,
);

export async function loadProductionPresentationRegistry({
  chapterDescriptors = [],
  loadChapterPackage,
} = {}) {
  if (typeof loadChapterPackage !== 'function') {
    throw new TypeError('Production presentation loading requires loadChapterPackage().');
  }
  const modules = await Promise.all(chapterDescriptors
    .filter((descriptor) => typeof descriptor?.loaders?.presentation === 'function')
    .map((descriptor) => loadChapterPackage(descriptor.id, 'presentation')));
  const packages = modules.map((module, index) => {
    const presentationPackage = module?.default;
    if (!presentationPackage) {
      throw new TypeError(`Presentation loader ${index} did not export a default package.`);
    }
    return presentationPackage;
  });
  return createProductionPresentationRegistry(packages);
}

/** Resolves ordinary room music without teaching the game shell chapter IDs. */
export function resolveProductionRoomMusic({ chapterId, roomId } = {}) {
  return productionPresentationRegistry.resolveRoomMusic({ chapterId, roomId });
}

/** Draws the code-native presentation registered by the owning chapter. */
export function drawProductionRoomVariantOverlay(context, request = {}) {
  return productionPresentationRegistry.drawRoomVariantOverlay(context, request);
}

/** Lets an owning chapter move its painted room before the normal foreground overlay. */
export function drawProductionRoomVariantBackground(context, request = {}, drawBackground) {
  return productionPresentationRegistry.drawRoomVariantBackground(
    context,
    request,
    drawBackground,
  );
}

export function drawProductionWorldEffects(context, request = {}) {
  return productionPresentationRegistry.drawWorldEffects(context, request);
}

export function drawProductionSetPiece(context, active, worldState, options = {}) {
  return productionPresentationRegistry.drawSetPiece(context, active, worldState, options);
}

export function productionSetPieceInputLockSeconds(active, worldState) {
  return productionPresentationRegistry.setPieceInputLockSeconds(active, worldState);
}

export function resolveProductionMapVignetteAsset(request = {}) {
  return productionPresentationRegistry.resolveMapVignetteAsset(request);
}
