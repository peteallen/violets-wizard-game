import { PALETTE, WORLD } from '../config.js';
import { productionPresentationRegistry } from '../presentation/productionRoomVariantOverlays.js';
import { resolveRoomVariant } from '../world/roomVariant.js';

const ROOM_MOODS = Object.freeze({
  'ch1.bedroom': ['#9bc7d5', '#f4d58d', '#87684f'],
  'ch1.leaky': ['#4d3b36', '#d98a3d', '#2c2529'],
  'ch1.courtyard': ['#5a6071', '#8a7a66', '#24253a'],
  'ch1.diagonStreet': ['#47758a', '#e8b44f', '#5e4634'],
  'ch1.ollivanders': ['#273653', '#c3924a', '#4b3024'],
  'ch1.malkins': ['#6e4d72', '#e2b77e', '#493345'],
  'ch1.menagerie': ['#426660', '#d6aa62', '#453426'],
});

export const ROOM_MEMORY_LIMITS = Object.freeze({
  globalCanvasCount: 5,
  reservedCanvasSlots: 3,
  roomCanvasCount: 2,
  decodedImageCount: 3,
});

export class RoomRenderer {
  constructor({
    resolveAsset = () => null,
    presentationRegistry = productionPresentationRegistry,
    imageFactory = defaultImageFactory,
    canvasFactory = defaultCanvasFactory,
    logger = globalThis.console,
    maxCanvasCount = ROOM_MEMORY_LIMITS.globalCanvasCount,
    reservedCanvasSlots = ROOM_MEMORY_LIMITS.reservedCanvasSlots,
    maxRoomCaches = ROOM_MEMORY_LIMITS.roomCanvasCount,
    maxDecodedImages = ROOM_MEMORY_LIMITS.decodedImageCount,
  } = {}) {
    this.resolveAsset = resolveAsset;
    this.presentationRegistry = presentationRegistry;
    this.imageFactory = imageFactory;
    this.canvasFactory = canvasFactory;
    this.logger = logger;
    this.maxCanvasCount = Math.min(ROOM_MEMORY_LIMITS.globalCanvasCount, Math.max(1, maxCanvasCount));
    this.reservedCanvasSlots = Math.min(this.maxCanvasCount, Math.max(0, reservedCanvasSlots));
    this.maxRoomCaches = Math.min(
      ROOM_MEMORY_LIMITS.roomCanvasCount,
      Math.max(0, this.maxCanvasCount - this.reservedCanvasSlots),
      Math.max(0, maxRoomCaches),
    );
    this.maxDecodedImages = Math.min(
      ROOM_MEMORY_LIMITS.decodedImageCount,
      Math.max(1, maxDecodedImages),
    );
    this.images = new Map();
    this.imageUse = new Map();
    this.loads = new Map();
    this.failed = new Set();
    this.gradients = new WeakMap();
    this.roomCaches = new Map();
    this.canvasRecords = new Map();
    this.preparations = new Map();
    this.currentCacheKey = null;
    this.useSequence = 0;
    this.lifecycleGeneration = 0;
    this.destroyed = false;
  }

  async preload(keys = []) {
    const uniqueKeys = [...new Set(keys.filter(Boolean))];
    for (const key of uniqueKeys) await this.load(key);
    const activeComposites = [...this.preparations.values()];
    if (activeComposites.length) await Promise.allSettled(activeComposites);
    return uniqueKeys.map((key) => this.images.get(key) ?? null);
  }

  async load(key) {
    if (this.destroyed || !key || this.failed.has(key)) return null;
    if (this.images.has(key)) {
      this.touchImage(key);
      return this.images.get(key);
    }
    if (this.loads.has(key)) return this.loads.get(key);
    const path = this.resolveAsset(key);
    if (!path) return null;
    const generation = this.lifecycleGeneration;
    const load = this.decodeImage(key, path, generation);
    this.loads.set(key, load);
    try {
      return await load;
    } finally {
      if (this.loads.get(key) === load) this.loads.delete(key);
    }
  }

  async decodeImage(key, path, generation) {
    let image;
    try {
      image = this.imageFactory();
      if (!image) throw new Error('Image allocation returned no object.');
      image.decoding = 'async';
      image.src = path;
      if (typeof image.decode !== 'function') throw new Error('Image.decode() is unavailable.');
      await image.decode();
      if (!image.complete || !(image.naturalWidth > 0) || !(image.naturalHeight > 0)) {
        throw new Error('Decoded image has no drawable pixels.');
      }
      if (this.destroyed || generation !== this.lifecycleGeneration) return null;
      this.images.set(key, image);
      this.touchImage(key);
      this.enforceDecodedImageLimit();
      return image;
    } catch {
      this.failed.add(key);
      return null;
    }
  }

  touchImage(key) {
    this.imageUse.set(key, ++this.useSequence);
  }

  enforceDecodedImageLimit() {
    while (this.images.size > this.maxDecodedImages) {
      const oldest = [...this.images.keys()].sort((left, right) => {
        return (this.imageUse.get(left) ?? 0) - (this.imageUse.get(right) ?? 0);
      })[0];
      this.releaseDecodedImage(oldest);
    }
  }

  releaseDecodedImage(key, expectedImage = null) {
    if (expectedImage && this.images.get(key) !== expectedImage) return false;
    const removed = this.images.delete(key);
    this.imageUse.delete(key);
    return removed;
  }

  async preloadRoom(room, state = {}, { scale = 1 } = {}) {
    return this.prepareRoom(room, state, { scale });
  }

  async prepareRoom(room, state = {}, { scale = 1 } = {}) {
    if (this.destroyed) return null;
    const description = describeRoomCache(room, state, scale, this.resolveAsset);
    if (!description.keys.length || this.maxRoomCaches === 0) return null;
    const cached = this.roomCaches.get(description.key);
    if (cached) {
      this.touchCache(cached);
      return cached;
    }
    if (this.preparations.has(description.key)) return this.preparations.get(description.key);

    const generation = this.lifecycleGeneration;
    const preparation = this.compositeRoom(description, generation);
    this.preparations.set(description.key, preparation);
    try {
      return await preparation;
    } finally {
      if (this.preparations.get(description.key) === preparation) this.preparations.delete(description.key);
    }
  }

  async compositeRoom(description, generation) {
    let record = null;
    let drawnLayers = 0;
    const paths = new Set();
    try {
      for (const key of description.keys) {
        const path = this.resolveAsset(key);
        if (!path || paths.has(path)) continue;
        paths.add(path);
        const image = await this.load(key);
        if (!image) continue;
        try {
          if (this.destroyed || generation !== this.lifecycleGeneration) return null;
          if (!record) {
            record = this.allocateRoomCanvas(description);
            if (!record) return null;
          }
          compositeLayer(record.context, image, description);
          drawnLayers += 1;
        } finally {
          this.releaseDecodedImage(key, image);
        }
      }

      if (!record || drawnLayers === 0 || this.destroyed || generation !== this.lifecycleGeneration) return null;

      record.status = 'ready';
      record.lastUsed = ++this.useSequence;
      const cache = {
        key: description.key,
        roomId: description.roomId,
        variant: description.variant,
        keys: [...description.keys],
        canvas: record.canvas,
        width: description.width,
        height: description.height,
        lastUsed: record.lastUsed,
        record,
      };
      this.roomCaches.set(description.key, cache);
      record = null;
      return cache;
    } finally {
      if (record) this.releaseCanvasRecord(record);
    }
  }

  allocateRoomCanvas(description, retry = true) {
    while (this.canvasRecords.size >= this.maxRoomCaches) {
      const evicted = this.evictLeastRecentlyUsed(this.currentCacheKey);
      if (!evicted) return null;
    }

    let canvas;
    let context;
    try {
      canvas = this.canvasFactory(description.width, description.height);
      if (!canvas) throw new Error('Canvas allocation returned no object.');
      canvas.width = description.width;
      canvas.height = description.height;
      context = canvas.getContext?.('2d', { alpha: false }) ?? null;
    } catch (error) {
      this.releaseUntrackedCanvas(canvas);
      this.handleCanvasAllocationFailure(error);
      if (retry) return this.allocateRoomCanvas(description, false);
      return null;
    }

    if (!context) {
      this.releaseUntrackedCanvas(canvas);
      this.handleCanvasAllocationFailure(new Error('Canvas 2D context allocation returned null.'));
      if (retry) return this.allocateRoomCanvas(description, false);
      return null;
    }

    const record = {
      key: description.key,
      canvas,
      context,
      status: 'building',
      lastUsed: ++this.useSequence,
    };
    this.canvasRecords.set(canvas, record);
    return record;
  }

  handleCanvasAllocationFailure(error) {
    this.logger?.warn?.('Room canvas allocation failed; evicting cached rooms before retrying.', error);
    this.emergencyEvict('get-context-null');
  }

  emergencyEvict(reason = 'emergency') {
    for (const key of [...this.roomCaches.keys()]) this.evictCache(key, reason);
    for (const key of [...this.images.keys()]) this.releaseDecodedImage(key);
  }

  evictLeastRecentlyUsed(protectedKey = null) {
    const candidates = [...this.roomCaches.values()]
      .filter((cache) => cache.key !== protectedKey)
      .sort((left, right) => left.lastUsed - right.lastUsed || left.key.localeCompare(right.key));
    const selected = candidates[0]
      ?? [...this.roomCaches.values()].sort((left, right) => left.lastUsed - right.lastUsed || left.key.localeCompare(right.key))[0];
    if (!selected) return false;
    return this.evictCache(selected.key, 'lru');
  }

  evictCache(key) {
    const cache = this.roomCaches.get(key);
    if (!cache) return false;
    this.roomCaches.delete(key);
    if (this.currentCacheKey === key) this.currentCacheKey = null;
    this.releaseCanvasRecord(cache.record);
    return true;
  }

  releaseCanvasRecord(record) {
    if (!record) return;
    this.canvasRecords.delete(record.canvas);
    this.releaseUntrackedCanvas(record.canvas);
    record.status = 'evicted';
  }

  releaseUntrackedCanvas(canvas) {
    if (!canvas) return;
    canvas.width = 1;
    canvas.height = 1;
  }

  touchCache(cache) {
    const used = ++this.useSequence;
    cache.lastUsed = used;
    cache.record.lastUsed = used;
  }

  clear() {
    this.lifecycleGeneration += 1;
    for (const key of [...this.roomCaches.keys()]) this.evictCache(key, 'clear');
    for (const record of [...this.canvasRecords.values()]) this.releaseCanvasRecord(record);
    for (const key of [...this.images.keys()]) this.releaseDecodedImage(key);
    this.preparations.clear();
    this.loads.clear();
    this.currentCacheKey = null;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.clear();
    this.loads.clear();
    this.failed.clear();
    this.gradients = new WeakMap();
  }

  memorySnapshot() {
    return Object.freeze({
      globalCanvasLimit: this.maxCanvasCount,
      reservedCanvasSlots: this.reservedCanvasSlots,
      roomCanvasLimit: this.maxRoomCaches,
      roomCanvasCount: this.canvasRecords.size,
      fullScreenCanvasEquivalentCount: this.reservedCanvasSlots + this.canvasRecords.size,
      decodedImageLimit: this.maxDecodedImages,
      decodedImageCount: this.images.size,
      cacheKeys: Object.freeze([...this.roomCaches.keys()]),
      decodedImageKeys: Object.freeze([...this.images.keys()]),
    });
  }

  draw(context, room, state, time, camera = { x: 0 }, { reducedMotion = false } = {}) {
    const roomId = room?.id ?? state?.roomId ?? 'ch1.bedroom';
    const variant = resolveRoomVariant(room, state?.roomVariant);
    const scale = contextScale(context);
    const description = describeRoomCache(room, state, scale, this.resolveAsset);
    this.currentCacheKey = description.key;
    const cache = this.roomCaches.get(description.key);

    const presentationRequest = {
      roomId,
      variant,
      cameraX: camera.x,
      time,
      reducedMotion: Boolean(reducedMotion),
      state,
    };
    this.presentationRegistry.drawRoomVariantBackground(context, presentationRequest, () => {
      if (cache?.canvas && cache.canvas.width > 1 && cache.canvas.height > 1) {
        this.touchCache(cache);
        const roomWidth = room?.size?.width ?? WORLD.width;
        const sourceWidth = Math.min(cache.width, cache.height * (WORLD.width / WORLD.height));
        const cameraRatio = Math.max(0, Math.min(1, camera.x / Math.max(1, roomWidth - WORLD.width)));
        const sourceX = (cache.width - sourceWidth) * cameraRatio;
        context.drawImage(cache.canvas, sourceX, 0, sourceWidth, cache.height, 0, 0, WORLD.width, WORLD.height);
      } else {
        this.drawProcedural(context, roomId, variant, time, camera.x);
        if (description.keys.length) {
          void this.prepareRoom(room, state, { scale }).catch((error) => {
            this.logger?.warn?.('Room cache preparation failed; keeping the procedural fallback.', error);
          });
        }
      }
    });

    this.presentationRegistry.drawRoomVariantOverlay(context, presentationRequest);
  }

  drawProcedural(context, roomId, variant, time, cameraX = 0) {
    const [sky, light, floor] = ROOM_MOODS[roomId] ?? ROOM_MOODS['ch1.bedroom'];
    const dusk = variant === 'dusk';
    const key = `${roomId}:${variant}`;
    let gradients = this.gradients.get(context);
    if (!gradients) {
      gradients = new Map();
      this.gradients.set(context, gradients);
    }
    if (!gradients.has(key)) {
      const gradient = context.createLinearGradient(0, 0, 0, WORLD.height);
      gradient.addColorStop(0, dusk ? '#2c3152' : sky);
      gradient.addColorStop(0.63, dusk ? '#584653' : light);
      gradient.addColorStop(1, floor);
      gradients.set(key, gradient);
    }
    context.fillStyle = gradients.get(key);
    context.fillRect(0, 0, WORLD.width, WORLD.height);

    context.save();
    context.translate(-cameraX, 0);
    switch (roomId) {
      case 'ch1.bedroom':
        drawBedroom(context, time);
        break;
      case 'ch1.leaky':
        drawLeaky(context, time);
        break;
      case 'ch1.courtyard':
        drawCourtyard(context);
        break;
      case 'ch1.diagonStreet':
        drawDiagon(context, dusk, time);
        break;
      case 'ch1.ollivanders':
        drawOllivanders(context, time);
        break;
      case 'ch1.malkins':
        drawMalkins(context);
        break;
      case 'ch1.menagerie':
        drawMenagerie(context, time);
        break;
      default:
        break;
    }
    context.restore();

    context.fillStyle = 'rgba(20,17,38,0.17)';
    context.fillRect(0, 640, WORLD.width, 80);
  }
}

function defaultImageFactory() {
  return typeof globalThis.Image === 'function' ? new globalThis.Image() : null;
}

function defaultCanvasFactory(width, height) {
  if (globalThis.document?.createElement) {
    const canvas = globalThis.document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  if (typeof globalThis.OffscreenCanvas === 'function') return new globalThis.OffscreenCanvas(width, height);
  return null;
}

function contextScale(context) {
  const transform = context?.getTransform?.();
  const candidate = Math.max(Math.abs(transform?.a ?? 1), Math.abs(transform?.d ?? 1));
  if (!Number.isFinite(candidate) || candidate <= 0) return 1;
  return Math.max(0.25, Math.min(2, candidate));
}

function describeRoomCache(room, state, scale, resolveAsset) {
  const roomId = room?.id ?? state?.roomId ?? 'ch1.bedroom';
  const variant = resolveRoomVariant(room, state?.roomVariant);
  const variantLayers = room?.background?.variants?.[variant];
  const layers = variantLayers?.length ? variantLayers : (room?.background?.layers ?? []);
  const keys = [...new Set(layers.filter((key) => key && resolveAsset(key)))];
  const safeScale = Number.isFinite(scale) && scale > 0 ? Math.max(0.25, Math.min(2, scale)) : 1;
  const width = Math.max(1, Math.round(WORLD.width * safeScale));
  const height = Math.max(1, Math.round(WORLD.height * safeScale));
  const key = `${roomId}:${variant}:${width}x${height}:${keys.join('|')}`;
  return {
    key,
    roomId,
    variant,
    keys,
    width,
    height,
    fit: room?.background?.fit ?? 'cover',
    focalPoint: room?.background?.focalPoint ?? { x: 0.5, y: 0.5 },
  };
}

function compositeLayer(context, image, description) {
  const destinationAspect = description.width / description.height;
  const imageAspect = image.naturalWidth / image.naturalHeight;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;
  if (description.fit === 'cover') {
    if (imageAspect > destinationAspect) sourceWidth = image.naturalHeight * destinationAspect;
    else sourceHeight = image.naturalWidth / destinationAspect;
  }
  const focalX = Math.max(0, Math.min(1, description.focalPoint.x ?? 0.5));
  const focalY = Math.max(0, Math.min(1, description.focalPoint.y ?? 0.5));
  const sourceX = (image.naturalWidth - sourceWidth) * focalX;
  const sourceY = (image.naturalHeight - sourceHeight) * focalY;
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    description.width,
    description.height,
  );
}

function drawBedroom(context, time) {
  context.fillStyle = '#f2d9b2';
  context.fillRect(0, 110, 1280, 480);
  context.fillStyle = '#b7d9e7';
  context.fillRect(870, 150, 270, 250);
  context.strokeStyle = '#5e4634';
  context.lineWidth = 18;
  context.strokeRect(870, 150, 270, 250);
  context.lineWidth = 8;
  context.beginPath();
  context.moveTo(1005, 155);
  context.lineTo(1005, 395);
  context.moveTo(875, 275);
  context.lineTo(1135, 275);
  context.stroke();
  context.fillStyle = '#70526f';
  context.fillRect(130, 440, 370, 155);
  context.fillStyle = '#b18ac0';
  context.fillRect(150, 405, 335, 90);
  context.fillStyle = '#e8e1cf';
  context.beginPath();
  context.ellipse(290, 432, 100, 34, -0.08, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#7a4fc9';
  for (let index = 0; index < 7; index += 1) {
    const x = 610 + index * 45;
    const height = 80 + (index % 3) * 25;
    context.fillRect(x, 570 - height, 34, height);
  }
  context.fillStyle = 'rgba(255,247,193,0.22)';
  context.beginPath();
  context.moveTo(850, 400);
  context.lineTo(1160, 400);
  context.lineTo(900 + Math.sin(time * 0.4) * 8, 620);
  context.lineTo(680, 620);
  context.closePath();
  context.fill();
}

function drawLeaky(context, time) {
  context.fillStyle = '#352b28';
  context.fillRect(0, 90, 1280, 510);
  context.fillStyle = '#5e4634';
  for (let x = 90; x < 1180; x += 220) {
    context.fillRect(x, 330, 150, 25);
    context.fillRect(x + 18, 355, 16, 150);
    context.fillRect(x + 118, 355, 16, 150);
  }
  context.fillStyle = '#f0d18c';
  for (let index = 0; index < 5; index += 1) {
    const x = 160 + index * 245;
    const flicker = 6 + Math.sin(time * 5 + index) * 2;
    context.beginPath();
    context.ellipse(x, 220, flicker, 18, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#b78945';
    context.fillRect(x - 5, 230, 10, 70);
    context.fillStyle = '#f0d18c';
  }
  context.fillStyle = '#271f21';
  context.fillRect(1120, 255, 130, 345);
  context.strokeStyle = '#b1844f';
  context.lineWidth = 8;
  context.strokeRect(1120, 255, 130, 345);
}

function drawCourtyard(context) {
  context.fillStyle = '#7c7a76';
  context.fillRect(0, 80, 1280, 550);
  context.strokeStyle = '#5d5c60';
  context.lineWidth = 4;
  for (let row = 0; row < 10; row += 1) {
    const y = 105 + row * 51;
    for (let col = -1; col < 15; col += 1) {
      const offset = row % 2 ? 48 : 0;
      context.strokeRect(col * 96 + offset, y, 96, 51);
    }
  }
  context.fillStyle = '#4c4b50';
  context.fillRect(40, 235, 180, 395);
  context.fillStyle = '#45454b';
  context.fillRect(1050, 235, 180, 395);
}

function drawDiagon(context, dusk, time) {
  const buildingColors = ['#6d4b53', '#475d66', '#7a603e', '#53486d', '#6f493f', '#496653'];
  for (let index = 0; index < 10; index += 1) {
    const x = index * 215 - 30;
    const height = 360 + (index % 3) * 55;
    context.save();
    context.translate(x, 610 - height);
    context.rotate((index % 2 ? 1 : -1) * 0.012);
    context.fillStyle = buildingColors[index % buildingColors.length];
    context.fillRect(0, 0, 200, height);
    context.fillStyle = '#352b2d';
    context.beginPath();
    context.moveTo(-12, 0);
    context.lineTo(100, -90 - (index % 2) * 25);
    context.lineTo(212, 0);
    context.closePath();
    context.fill();
    for (let row = 0; row < 3; row += 1) {
      context.fillStyle = dusk ? '#f4d58d' : '#96b7bf';
      context.fillRect(25, 55 + row * 83, 47, 55);
      context.fillRect(128, 55 + row * 83, 47, 55);
    }
    context.fillStyle = '#372820';
    context.fillRect(70, height - 142, 70, 142);
    context.restore();
  }
  context.fillStyle = '#736451';
  context.beginPath();
  context.moveTo(0, 610);
  context.lineTo(2100, 610);
  context.lineTo(1940, 720);
  context.lineTo(140, 720);
  context.closePath();
  context.fill();
  for (let index = 0; index < 18; index += 1) {
    context.fillStyle = `rgba(255,215,106,${0.18 + (index % 3) * 0.08})`;
    context.beginPath();
    context.arc(80 + index * 108, 180 + Math.sin(time * 0.7 + index) * 9, 3 + (index % 2) * 2, 0, Math.PI * 2);
    context.fill();
  }
}

function drawOllivanders(context, time) {
  context.fillStyle = '#253044';
  context.fillRect(0, 70, 1280, 550);
  context.fillStyle = '#60452e';
  for (let shelf = 0; shelf < 4; shelf += 1) {
    const y = 160 + shelf * 105;
    context.fillRect(70, y, 1140, 16);
    for (let box = 0; box < 13; box += 1) {
      const x = 85 + box * 86 + (shelf % 2) * 15;
      context.fillStyle = ['#8d6f4f', '#6e543b', '#9e7e59'][box % 3];
      context.fillRect(x, y - 40 - (box % 2) * 8, 72, 35 + (box % 2) * 8);
    }
    context.fillStyle = '#60452e';
  }
  context.fillStyle = 'rgba(244,213,141,0.24)';
  context.beginPath();
  context.arc(965, 305, 85 + Math.sin(time * 2) * 4, 0, Math.PI * 2);
  context.fill();
}

function drawMalkins(context) {
  context.fillStyle = '#684c69';
  context.fillRect(0, 80, 1280, 540);
  context.fillStyle = '#dbbd94';
  context.fillRect(70, 140, 260, 410);
  context.fillStyle = '#352b35';
  context.beginPath();
  context.arc(200, 305, 70, Math.PI, Math.PI * 2);
  context.lineTo(272, 515);
  context.lineTo(128, 515);
  context.closePath();
  context.fill();
  context.fillStyle = '#e5ca9e';
  context.fillRect(560, 510, 175, 62);
  context.strokeStyle = '#ba8e53';
  context.lineWidth = 16;
  context.strokeRect(865, 130, 290, 385);
  context.fillStyle = '#9ab3ba';
  context.fillRect(884, 149, 252, 347);
}

function drawMenagerie(context, time) {
  context.fillStyle = '#38564f';
  context.fillRect(0, 80, 1280, 540);
  context.fillStyle = '#72513a';
  for (let index = 0; index < 5; index += 1) {
    const x = 510 + index * 135;
    const y = 245 + (index % 2) * 70;
    context.fillRect(x, y, 105, 155);
    context.strokeStyle = '#c3a461';
    context.lineWidth = 6;
    context.strokeRect(x, y, 105, 155);
    for (let bar = 1; bar < 4; bar += 1) {
      context.beginPath();
      context.moveTo(x + bar * 26, y);
      context.lineTo(x + bar * 26, y + 155);
      context.stroke();
    }
  }
  context.fillStyle = 'rgba(244,213,141,0.28)';
  for (let index = 0; index < 8; index += 1) {
    context.beginPath();
    context.arc(550 + index * 80, 160 + Math.sin(time * 1.3 + index) * 12, 4, 0, Math.PI * 2);
    context.fill();
  }
}
