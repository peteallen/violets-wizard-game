const REGISTRATION_KINDS = new Set(['world-effect', 'set-piece']);

export class ProductionPresentationRegistry {
  constructor(packages = []) {
    this.packages = Object.freeze([...packages]);
    this.packageByChapter = new Map();
    this.overlayByRoomVariant = new Map();
    this.roomMusicByChapter = new Map();
    this.worldEffectsByChapter = new Map();
    this.setPieceByChapterAndRenderer = new Map();
    this.mapVignetteAssetsByChapter = new Map();
    this.registerPackages(this.packages);
    Object.freeze(this);
  }

  registerPackages(packages) {
    const ids = new Set();
    for (const presentationPackage of packages) {
      const chapterId = requireId(presentationPackage?.chapterId, 'Presentation package chapterId');
      if (ids.has(chapterId)) throw new TypeError(`Duplicate production presentation package ${chapterId}.`);
      ids.add(chapterId);
      this.packageByChapter.set(chapterId, presentationPackage);
      if (presentationPackage.roomMusic) {
        this.roomMusicByChapter.set(chapterId, presentationPackage.roomMusic);
      }
      for (const overlay of presentationPackage.roomVariantOverlays ?? []) {
        requireId(overlay?.roomId, 'Room-variant overlay roomId');
        requireId(overlay?.variant, 'Room-variant overlay variant');
        const key = `${overlay.roomId}:${overlay.variant}`;
        if (this.overlayByRoomVariant.has(key)) {
          throw new TypeError(`Duplicate room-variant presentation ${key}.`);
        }
        this.overlayByRoomVariant.set(key, overlay);
      }
      const vignetteAssets = presentationPackage.mapVignetteAssets ?? {};
      this.mapVignetteAssetsByChapter.set(chapterId, Object.freeze({ ...vignetteAssets }));
      for (const registration of presentationPackage.registrations ?? []) {
        this.registerPresentation(chapterId, registration);
      }
    }
  }

  registerPresentation(chapterId, registration) {
    requireId(registration?.id, 'Presentation registration id');
    if (!REGISTRATION_KINDS.has(registration?.kind)) {
      throw new TypeError(`Presentation registration ${registration.id} has unsupported kind ${String(registration?.kind)}.`);
    }
    if (typeof registration.draw !== 'function') {
      throw new TypeError(`Presentation registration ${registration.id} requires draw().`);
    }
    if (registration.kind === 'world-effect') {
      const layer = registration.layer ?? 'front-effects';
      const byLayer = this.worldEffectsByChapter.get(chapterId) ?? new Map();
      const registrations = byLayer.get(layer) ?? [];
      registrations.push(registration);
      byLayer.set(layer, registrations);
      this.worldEffectsByChapter.set(chapterId, byLayer);
      return;
    }
    const renderer = requireId(registration.renderer, `Set-piece registration ${registration.id} renderer`);
    const key = `${chapterId}:${renderer}`;
    if (this.setPieceByChapterAndRenderer.has(key)) {
      throw new TypeError(`Duplicate set-piece presentation ${key}.`);
    }
    this.setPieceByChapterAndRenderer.set(key, registration);
  }

  resolveRoomMusic({ chapterId, roomId } = {}) {
    const registration = this.roomMusicByChapter.get(chapterId);
    if (!registration) return null;
    return registration.rooms?.[roomId] ?? registration.default ?? null;
  }

  drawRoomVariantOverlay(context, request = {}) {
    const overlay = this.overlayByRoomVariant.get(`${request.roomId}:${request.variant}`);
    if (!overlay) return false;
    overlay.draw?.(context, request);
    return true;
  }

  drawRoomVariantBackground(context, request = {}, drawBackground) {
    if (typeof drawBackground !== 'function') {
      throw new TypeError('Room presentation requires a drawBackground callback.');
    }
    const overlay = this.overlayByRoomVariant.get(`${request.roomId}:${request.variant}`);
    if (typeof overlay?.drawBackground !== 'function') {
      drawBackground();
      return false;
    }
    overlay.drawBackground(context, request, drawBackground);
    return true;
  }

  drawWorldEffects(context, request = {}) {
    const byLayer = this.worldEffectsByChapter.get(request.chapterId);
    const registrations = byLayer?.get(request.layer) ?? [];
    let drawn = false;
    for (const registration of registrations) {
      if (typeof registration.when === 'function' && !registration.when(request.state, request)) continue;
      registration.draw(context, request);
      drawn = true;
    }
    return drawn;
  }

  drawSetPiece(context, active, worldState, options = {}) {
    const registration = this.setPieceRegistration(active, worldState);
    if (!registration) return false;
    registration.draw(context, { active, state: worldState, ...options });
    return true;
  }

  setPieceInputLockSeconds(active, worldState) {
    const registration = this.setPieceRegistration(active, worldState);
    const seconds = Number(registration?.inputLockSeconds);
    return Number.isFinite(seconds) ? Math.max(0, seconds) : null;
  }

  setPieceRegistration(active, worldState) {
    if (!active || !worldState?.chapterId) return null;
    const renderer = active.descriptor?.renderer;
    if (!renderer) return null;
    return this.setPieceByChapterAndRenderer.get(`${worldState.chapterId}:${renderer}`) ?? null;
  }

  resolveMapVignetteAsset({ chapterId, mapId, locationId, icon } = {}) {
    const mapping = this.mapVignetteAssetsByChapter.get(chapterId) ?? {};
    return mapping[locationId]
      ?? mapping[`${mapId}:${locationId}`]
      ?? mapping[icon]
      ?? (typeof icon === 'string' && icon.includes('/') ? icon : null);
  }
}

function requireId(value, label) {
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError(`${label} must be a non-empty string.`);
  return value;
}

export function createProductionPresentationRegistry(packages) {
  return new ProductionPresentationRegistry(packages);
}
