const SIDES = new Set(['left', 'right']);
const REQUIRED_BOUNDS = Object.freeze(['world', 'portrait', 'shadow', 'headSafe']);

function assertObject(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${path} must be an object.`);
  }
  return value;
}

function assertFinite(value, path) {
  if (!Number.isFinite(value)) throw new TypeError(`${path} must be finite.`);
  return value;
}

function assertPositive(value, path) {
  assertFinite(value, path);
  if (value <= 0) throw new RangeError(`${path} must be greater than zero.`);
  return value;
}

function assertId(value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${path} must be a non-empty string.`);
  }
  return value;
}

function assertPoint(value, path) {
  assertObject(value, path);
  assertFinite(value.x, `${path}.x`);
  assertFinite(value.y, `${path}.y`);
}

function assertRect(value, path) {
  assertObject(value, path);
  assertFinite(value.x, `${path}.x`);
  assertFinite(value.y, `${path}.y`);
  assertPositive(value.width, `${path}.width`);
  assertPositive(value.height, `${path}.height`);
}

function assertKnownSlots(slots, path, layerSlots, assets) {
  assertObject(slots, path);
  for (const [slot, asset] of Object.entries(slots)) {
    if (!layerSlots.has(slot)) throw new RangeError(`${path}.${slot} is not in layerOrder.`);
    if (!Object.hasOwn(assets, asset)) throw new RangeError(`${path}.${slot} references unknown asset ${asset}.`);
  }
}

function assertLayerOrder(layerOrder, path, manifestLayerOrder, layerSlots) {
  if (!Array.isArray(layerOrder)) throw new TypeError(`${path} must be an array.`);
  if (layerOrder.length !== manifestLayerOrder.length) {
    throw new RangeError(`${path} must be an exact permutation of manifest.layerOrder.`);
  }
  const seen = new Set();
  layerOrder.forEach((slot, index) => {
    assertId(slot, `${path}[${index}]`);
    if (!layerSlots.has(slot) || seen.has(slot)) {
      throw new RangeError(`${path} must be an exact permutation of manifest.layerOrder.`);
    }
    seen.add(slot);
  });
}

function assertKnownPointOverrides(overrides, path, knownPoints) {
  assertObject(overrides, path);
  for (const [name, point] of Object.entries(overrides)) {
    if (!Object.hasOwn(knownPoints, name)) {
      throw new RangeError(`${path}.${name} is not declared in manifest.anchors.`);
    }
    assertPoint(point, `${path}.${name}`);
  }
}

function assertKnownRectOverrides(overrides, path, knownRects) {
  assertObject(overrides, path);
  for (const [name, rect] of Object.entries(overrides)) {
    if (!Object.hasOwn(knownRects, name)) {
      throw new RangeError(`${path}.${name} is not declared in manifest.bounds.`);
    }
    assertRect(rect, `${path}.${name}`);
  }
}

function validateFrame(
  frame,
  path,
  manifestLayerOrder,
  layerSlots,
  assets,
  expressions,
  anchors,
  bounds,
) {
  assertObject(frame, path);
  if (frame.slots !== undefined) assertKnownSlots(frame.slots, `${path}.slots`, layerSlots, assets);
  if (frame.layerOrder !== undefined) {
    assertLayerOrder(frame.layerOrder, `${path}.layerOrder`, manifestLayerOrder, layerSlots);
  }
  if (frame.anchors !== undefined) {
    assertKnownPointOverrides(frame.anchors, `${path}.anchors`, anchors);
  }
  if (frame.bounds !== undefined) {
    assertKnownRectOverrides(frame.bounds, `${path}.bounds`, bounds);
  }
  if (frame.expression !== undefined && !Object.hasOwn(expressions, frame.expression)) {
    throw new RangeError(`${path}.expression references unknown expression ${frame.expression}.`);
  }
  if (frame.root !== undefined) {
    assertObject(frame.root, `${path}.root`);
    for (const key of ['x', 'y', 'rotation', 'scaleX', 'scaleY']) {
      if (frame.root[key] !== undefined) assertFinite(frame.root[key], `${path}.root.${key}`);
    }
  }
}

export function validateAlignedSpriteManifest(manifest) {
  assertObject(manifest, 'manifest');
  assertId(manifest.id, 'manifest.id');

  const canvas = assertObject(manifest.canvas, 'manifest.canvas');
  assertPositive(canvas.width, 'manifest.canvas.width');
  assertPositive(canvas.height, 'manifest.canvas.height');
  assertPoint(canvas.ground, 'manifest.canvas.ground');

  if (!Array.isArray(manifest.layerOrder) || manifest.layerOrder.length === 0) {
    throw new TypeError('manifest.layerOrder must be a non-empty array.');
  }
  const layerSlots = new Set();
  manifest.layerOrder.forEach((slot, index) => {
    assertId(slot, `manifest.layerOrder[${index}]`);
    if (layerSlots.has(slot)) throw new RangeError(`manifest.layerOrder repeats ${slot}.`);
    layerSlots.add(slot);
  });

  const assets = assertObject(manifest.assets, 'manifest.assets');
  if (Object.keys(assets).length === 0) throw new TypeError('manifest.assets must not be empty.');
  for (const [assetId, variants] of Object.entries(assets)) {
    assertId(assetId, `manifest.assets.${assetId}`);
    assertObject(variants, `manifest.assets.${assetId}`);
    for (const side of SIDES) assertId(variants[side], `manifest.assets.${assetId}.${side}`);
  }

  const appearances = assertObject(manifest.appearances, 'manifest.appearances');
  if (Object.keys(appearances).length === 0) throw new TypeError('manifest.appearances must not be empty.');
  for (const [appearanceId, appearance] of Object.entries(appearances)) {
    assertObject(appearance, `manifest.appearances.${appearanceId}`);
    assertKnownSlots(appearance.slots, `manifest.appearances.${appearanceId}.slots`, layerSlots, assets);
    for (const slot of layerSlots) {
      if (!Object.hasOwn(appearance.slots, slot)) {
        throw new RangeError(`manifest.appearances.${appearanceId}.slots is missing ${slot}.`);
      }
    }
  }

  const expressions = assertObject(manifest.expressions, 'manifest.expressions');
  if (!Object.hasOwn(expressions, 'neutral')) {
    throw new RangeError('manifest.expressions must define neutral.');
  }
  for (const [expressionId, expression] of Object.entries(expressions)) {
    assertObject(expression, `manifest.expressions.${expressionId}`);
    assertKnownSlots(expression.slots ?? {}, `manifest.expressions.${expressionId}.slots`, layerSlots, assets);
  }

  const anchors = assertObject(manifest.anchors, 'manifest.anchors');
  for (const [anchor, point] of Object.entries(anchors)) {
    assertId(anchor, `manifest.anchors.${anchor}`);
    assertPoint(point, `manifest.anchors.${anchor}`);
  }
  if (!Array.isArray(manifest.requiredAnchors) || manifest.requiredAnchors.length === 0) {
    throw new TypeError('manifest.requiredAnchors must be a non-empty array.');
  }
  const requiredAnchors = new Set();
  manifest.requiredAnchors.forEach((anchor, index) => {
    assertId(anchor, `manifest.requiredAnchors[${index}]`);
    if (requiredAnchors.has(anchor)) throw new RangeError(`manifest.requiredAnchors repeats ${anchor}.`);
    requiredAnchors.add(anchor);
    if (!Object.hasOwn(anchors, anchor)) throw new RangeError(`manifest.anchors is missing ${anchor}.`);
  });

  const bounds = assertObject(manifest.bounds, 'manifest.bounds');
  for (const [name, rect] of Object.entries(bounds)) {
    assertId(name, `manifest.bounds.${name}`);
    assertRect(rect, `manifest.bounds.${name}`);
  }
  for (const name of REQUIRED_BOUNDS) {
    if (!Object.hasOwn(bounds, name)) throw new RangeError(`manifest.bounds is missing ${name}.`);
  }

  const clips = assertObject(manifest.clips, 'manifest.clips');
  if (!Object.hasOwn(clips, 'idle')) throw new RangeError('manifest.clips must define idle.');
  for (const [clipId, clip] of Object.entries(clips)) {
    assertObject(clip, `manifest.clips.${clipId}`);
    assertPositive(clip.fps, `manifest.clips.${clipId}.fps`);
    if (typeof clip.loop !== 'boolean') throw new TypeError(`manifest.clips.${clipId}.loop must be boolean.`);
    if (!Array.isArray(clip.frames) || clip.frames.length === 0) {
      throw new TypeError(`manifest.clips.${clipId}.frames must be a non-empty array.`);
    }
    clip.frames.forEach((frame, index) => validateFrame(
      frame,
      `manifest.clips.${clipId}.frames[${index}]`,
      manifest.layerOrder,
      layerSlots,
      assets,
      expressions,
      anchors,
      bounds,
    ));
    if (clip.reducedMotionClip !== undefined) assertId(
      clip.reducedMotionClip,
      `manifest.clips.${clipId}.reducedMotionClip`,
    );
    if (clip.motion !== undefined) {
      assertObject(clip.motion, `manifest.clips.${clipId}.motion`);
      for (const key of ['bobAmplitude', 'bobFrequency', 'swayAmplitude', 'swayFrequency']) {
        if (clip.motion[key] !== undefined) assertFinite(clip.motion[key], `manifest.clips.${clipId}.motion.${key}`);
      }
    }
  }
  for (const [clipId, clip] of Object.entries(clips)) {
    if (clip.reducedMotionClip !== undefined && !Object.hasOwn(clips, clip.reducedMotionClip)) {
      throw new RangeError(`manifest.clips.${clipId}.reducedMotionClip references unknown clip ${clip.reducedMotionClip}.`);
    }
  }

  const aliases = manifest.aliases ?? {};
  assertObject(aliases, 'manifest.aliases');
  for (const [alias, clip] of Object.entries(aliases)) {
    assertId(alias, `manifest.aliases.${alias}`);
    if (!Object.hasOwn(clips, clip)) throw new RangeError(`manifest.aliases.${alias} references unknown clip ${clip}.`);
  }

  return manifest;
}

export function resolveLocalLightSide(lightSide = 'left', facing = 'right') {
  if (!SIDES.has(lightSide)) throw new RangeError(`Unknown light side ${lightSide}.`);
  if (!SIDES.has(facing)) throw new RangeError(`Unknown facing ${facing}.`);
  if (facing === 'right') return lightSide;
  return lightSide === 'left' ? 'right' : 'left';
}

function selectFrameIndex(clip, localTime, actionProgress) {
  if (Number.isFinite(actionProgress)) {
    const progress = Math.max(0, Math.min(1, actionProgress));
    return Math.min(clip.frames.length - 1, Math.floor(progress * clip.frames.length));
  }
  const raw = Math.max(0, localTime) * clip.fps;
  if (clip.loop) return Math.floor(raw) % clip.frames.length;
  return Math.min(clip.frames.length - 1, Math.floor(raw));
}

function resolvedPoints(points, overrides = {}) {
  return Object.freeze(Object.fromEntries(Object.entries({ ...points, ...overrides }).map(([name, point]) => [
    name,
    Object.freeze({ x: point.x, y: point.y }),
  ])));
}

function resolvedRects(rects, overrides = {}) {
  return Object.freeze(Object.fromEntries(Object.entries({ ...rects, ...overrides }).map(([name, rect]) => [
    name,
    Object.freeze({ x: rect.x, y: rect.y, width: rect.width, height: rect.height }),
  ])));
}

function sampleValidatedAlignedSpriteFrame(manifest, {
  appearance,
  pose = 'idle',
  expression,
  localTime = 0,
  actionProgress,
  phase = 0,
  facing = 'right',
  lightSide = 'left',
  reducedMotion = false,
} = {}) {
  if (!Object.hasOwn(manifest.appearances, appearance)) {
    throw new RangeError(`${manifest.id} does not support appearance ${appearance}.`);
  }
  const requestedClip = manifest.aliases?.[pose] ?? pose;
  if (!Object.hasOwn(manifest.clips, requestedClip)) {
    throw new RangeError(`${manifest.id} does not support pose ${pose}.`);
  }
  let clipId = requestedClip;
  if (reducedMotion && manifest.clips[clipId].reducedMotionClip) {
    clipId = manifest.clips[clipId].reducedMotionClip;
  }
  const clip = manifest.clips[clipId];
  const safeTime = Number.isFinite(localTime) ? localTime : 0;
  const frameIndex = selectFrameIndex(clip, safeTime, actionProgress);
  const frame = clip.frames[frameIndex];
  const expressionId = expression ?? frame.expression ?? 'neutral';
  if (!Object.hasOwn(manifest.expressions, expressionId)) {
    throw new RangeError(`${manifest.id} does not support expression ${expressionId}.`);
  }

  const slots = {
    ...manifest.appearances[appearance].slots,
    ...(frame.slots ?? {}),
    ...(manifest.expressions[expressionId].slots ?? {}),
  };
  const localLightSide = resolveLocalLightSide(lightSide, facing);
  const layerOrder = frame.layerOrder ?? manifest.layerOrder;
  const layers = layerOrder.map((slot) => {
    const asset = slots[slot];
    return Object.freeze({ slot, asset, url: manifest.assets[asset][localLightSide] });
  });

  const root = {
    x: frame.root?.x ?? 0,
    y: frame.root?.y ?? 0,
    rotation: frame.root?.rotation ?? 0,
    scaleX: frame.root?.scaleX ?? 1,
    scaleY: frame.root?.scaleY ?? 1,
  };
  const motionScale = reducedMotion ? 0.25 : 1;
  const motion = clip.motion ?? {};
  root.y += Math.sin(safeTime * (motion.bobFrequency ?? 0) + phase) * (motion.bobAmplitude ?? 0) * motionScale;
  root.rotation += Math.sin(safeTime * (motion.swayFrequency ?? 0) + phase) * (motion.swayAmplitude ?? 0) * motionScale;

  const anchors = resolvedPoints(manifest.anchors, frame.anchors);
  const bounds = resolvedRects(manifest.bounds, frame.bounds);

  return Object.freeze({
    clip: clipId,
    frameIndex,
    expression: expressionId,
    localLightSide,
    layers: Object.freeze(layers),
    root: Object.freeze(root),
    anchors,
    bounds,
  });
}

export function sampleAlignedSpriteFrame(manifest, options = {}) {
  validateAlignedSpriteManifest(manifest);
  return sampleValidatedAlignedSpriteFrame(manifest, options);
}

export function transformAlignedSpriteAnchor(manifest, sample, anchor, {
  x = 0,
  y = 0,
  scale = 1,
  facing = 'right',
  mirror,
} = {}) {
  assertObject(manifest, 'manifest');
  const canvas = assertObject(manifest.canvas, 'manifest.canvas');
  assertPoint(canvas.ground, 'manifest.canvas.ground');
  assertObject(sample, 'sample');
  const anchors = assertObject(sample.anchors, 'sample.anchors');
  const root = assertObject(sample.root, 'sample.root');

  let localAnchor = anchor;
  if (typeof anchor === 'string') {
    assertId(anchor, 'anchor');
    if (!Object.hasOwn(anchors, anchor)) {
      throw new RangeError(`${manifest.id ?? 'manifest'} sample does not define anchor ${anchor}.`);
    }
    localAnchor = anchors[anchor];
  }
  assertPoint(localAnchor, 'anchor');
  for (const key of ['x', 'y', 'rotation', 'scaleX', 'scaleY']) {
    assertFinite(root[key], `sample.root.${key}`);
  }
  if (!SIDES.has(facing)) throw new RangeError(`Unknown facing ${facing}.`);
  if (mirror !== undefined && typeof mirror !== 'boolean') {
    throw new TypeError('placement.mirror must be boolean.');
  }
  assertFinite(x, 'placement.x');
  assertFinite(y, 'placement.y');
  assertFinite(scale, 'placement.scale');

  const localX = (localAnchor.x - canvas.ground.x) * root.scaleX;
  const localY = (localAnchor.y - canvas.ground.y) * root.scaleY;
  const cosine = Math.cos(root.rotation);
  const sine = Math.sin(root.rotation);
  const movedX = root.x + localX * cosine - localY * sine;
  const movedY = root.y + localX * sine + localY * cosine;
  const direction = (mirror ?? (facing === 'left')) ? -1 : 1;

  return Object.freeze({
    x: x + movedX * direction * scale,
    y: y + movedY * scale,
  });
}

export const ALIGNED_SPRITE_LOADING_LIMITS = Object.freeze({
  concurrentImages: 2,
  decodedImages: 8,
});

function positiveInteger(value, path) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${path} must be a positive integer.`);
  }
  return value;
}

export class AlignedSpriteRig {
  constructor(manifest, {
    imageFactory,
    maxConcurrentLoads = ALIGNED_SPRITE_LOADING_LIMITS.concurrentImages,
    maxDecodedImages = ALIGNED_SPRITE_LOADING_LIMITS.decodedImages,
  } = {}) {
    this.manifest = validateAlignedSpriteManifest(manifest);
    this.imageFactory = imageFactory ?? (() => new Image());
    this.maxConcurrentLoads = positiveInteger(maxConcurrentLoads, 'maxConcurrentLoads');
    // Keeping one complete displayed sample while its replacement decodes
    // requires room for two samples. Whole-frame characters have one layer;
    // layered rigs retain the same guarantee without allowing an undersized
    // caller-provided limit to make a complete sample impossible.
    this.maxDecodedImages = Math.max(
      positiveInteger(maxDecodedImages, 'maxDecodedImages'),
      this.manifest.layerOrder.length * 2,
    );
    this.images = new Map();
    this.imageUse = new Map();
    this.loads = new Map();
    this.failures = new Map();
    this.loadQueue = [];
    this.activeLoadCount = 0;
    this.useSequence = 0;
    this.protectedUrls = new Set();
    this.loadGroups = new Map();
    this.activeTasks = new Set();
    this.retainAllImages = false;
    this.ready = false;
    this.loading = null;
    this.generation = 0;
  }

  preload() {
    if (this.loading) return this.loading;
    const generation = this.generation;
    const urls = [...new Set(Object.values(this.manifest.assets).flatMap((asset) => [asset.left, asset.right]))];
    // This exhaustive path is reserved for deterministic review captures.
    // Ordinary character draws use requestFrame() and remain cache-bounded.
    this.retainAllImages = true;
    const loading = this.loadUrls(urls).then(() => {
      if (generation === this.generation) this.ready = true;
    }, (error) => {
      if (generation === this.generation) {
        this.retainAllImages = false;
        this.enforceDecodedImageLimit();
      }
      throw error;
    });
    this.loading = loading;
    return this.loading;
  }

  release() {
    this.generation += 1;
    const error = new Error(`${this.manifest.id} image loading was released.`);
    for (const task of this.loadQueue) task.reject(error);
    for (const task of this.activeTasks) task.reject(error);
    this.loadQueue = [];
    this.images.clear();
    this.imageUse.clear();
    this.loads.clear();
    this.failures.clear();
    this.loadGroups.clear();
    this.protectedUrls.clear();
    this.useSequence = 0;
    this.retainAllImages = false;
    this.ready = false;
    this.loading = null;
  }

  sample(options = {}) {
    return sampleValidatedAlignedSpriteFrame(this.manifest, options);
  }

  samplesForClip(sample, options = {}) {
    const clip = this.manifest.clips[sample.clip];
    return clip.frames.map((unused, index) => sampleValidatedAlignedSpriteFrame(this.manifest, {
      ...options,
      pose: sample.clip,
      localTime: index / clip.fps,
      actionProgress: undefined,
      // sample.clip has already resolved the reduced-motion redirect. Turning
      // this off avoids following a second redirect while enumerating it.
      reducedMotion: false,
    }));
  }

  requestFrame(options = {}, {
    includeClip = false,
    baselinePoses = [],
    sample = this.sample(options),
  } = {}) {
    if (!Array.isArray(baselinePoses)) {
      throw new TypeError('baselinePoses must be an array.');
    }
    const samples = [sample];
    if (includeClip) samples.push(...this.samplesForClip(sample, options));
    for (const pose of baselinePoses) {
      const baseline = this.sample({
        ...options,
        pose,
        localTime: 0,
        actionProgress: undefined,
        reducedMotion: false,
      });
      samples.push(...this.samplesForClip(baseline, {
        ...options,
        pose,
        actionProgress: undefined,
        reducedMotion: false,
      }));
    }
    const urls = [...new Set(samples.flatMap((entry) => entry.layers.map(({ url }) => url)))];
    return Object.freeze({
      sample,
      urls: Object.freeze(urls),
      loading: this.loadUrls(urls),
    });
  }

  loadUrls(urls) {
    const uniqueUrls = [...new Set(urls)];
    const key = [...uniqueUrls].sort().join('\n');
    if (this.loadGroups.has(key)) return this.loadGroups.get(key);
    const loading = Promise.all(uniqueUrls.map((url) => this.loadUrl(url)));
    this.loadGroups.set(key, loading);
    loading.then(
      () => { if (this.loadGroups.get(key) === loading) this.loadGroups.delete(key); },
      () => { if (this.loadGroups.get(key) === loading) this.loadGroups.delete(key); },
    );
    return loading;
  }

  loadUrl(url) {
    assertId(url, 'asset URL');
    if (this.images.has(url)) {
      this.touchImage(url);
      return Promise.resolve(this.images.get(url));
    }
    if (this.failures.has(url)) return Promise.reject(this.failures.get(url));
    if (this.loads.has(url)) return this.loads.get(url);

    let resolveLoad;
    let rejectLoad;
    const loading = new Promise((resolve, reject) => {
      resolveLoad = resolve;
      rejectLoad = reject;
    });
    this.loads.set(url, loading);
    this.loadQueue.push({
      url,
      loading,
      resolve: resolveLoad,
      reject: rejectLoad,
      generation: this.generation,
    });
    this.pumpLoadQueue();
    return loading;
  }

  pumpLoadQueue() {
    while (this.activeLoadCount < this.maxConcurrentLoads && this.loadQueue.length > 0) {
      const task = this.loadQueue.shift();
      this.activeLoadCount += 1;
      this.activeTasks.add(task);
      void this.decodeImage(task.url).then((image) => {
        if (task.generation !== this.generation) return;
        this.images.set(task.url, image);
        this.touchImage(task.url);
        this.enforceDecodedImageLimit();
        task.resolve(image);
      }, (error) => {
        if (task.generation !== this.generation) return;
        this.failures.set(task.url, error);
        task.reject(error);
      }).finally(() => {
        this.activeTasks.delete(task);
        if (this.loads.get(task.url) === task.loading) this.loads.delete(task.url);
        this.activeLoadCount -= 1;
        this.pumpLoadQueue();
      });
    }
  }

  async decodeImage(url) {
    const image = this.imageFactory(url);
    if (!image || (typeof image !== 'object' && typeof image !== 'function')) {
      throw new TypeError(`Image factory returned no source for ${url}.`);
    }
    try {
      image.decoding = 'async';
    } catch {
      // A minimal canvas-image shim may expose decoding as read-only.
    }

    if (typeof image.decode === 'function') {
      image.src = url;
      try {
        await image.decode();
      } catch (cause) {
        throw new Error(`Failed to load ${this.manifest.id} asset ${url}.`, { cause });
      }
    } else {
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error(`Failed to load ${this.manifest.id} asset ${url}.`));
        image.src = url;
      });
    }

    const hasNaturalDimensions = image.naturalWidth !== undefined || image.naturalHeight !== undefined;
    if (hasNaturalDimensions && (
      image.naturalWidth !== this.manifest.canvas.width
      || image.naturalHeight !== this.manifest.canvas.height
    )) {
      throw new Error(
        `${this.manifest.id} asset ${url} is ${image.naturalWidth}x${image.naturalHeight}; `
        + `expected ${this.manifest.canvas.width}x${this.manifest.canvas.height}.`,
      );
    }
    return image;
  }

  touchImage(url) {
    this.imageUse.set(url, ++this.useSequence);
  }

  protectSamples(samples = []) {
    this.protectedUrls = new Set(samples.flatMap((sample) => (
      sample?.layers?.map(({ url }) => url) ?? []
    )));
    this.enforceDecodedImageLimit();
  }

  enforceDecodedImageLimit() {
    if (this.retainAllImages) return;
    while (this.images.size > this.maxDecodedImages) {
      const oldest = [...this.images.keys()]
        .filter((url) => !this.protectedUrls.has(url))
        .sort((left, right) => (this.imageUse.get(left) ?? 0) - (this.imageUse.get(right) ?? 0))[0];
      if (!oldest) break;
      this.images.delete(oldest);
      this.imageUse.delete(oldest);
    }
  }

  isSampleReady(sample, { touch = false } = {}) {
    const ready = sample.layers.every(({ url }) => this.images.has(url));
    if (ready && touch) sample.layers.forEach(({ url }) => this.touchImage(url));
    return ready;
  }

  draw(context, options = {}) {
    const sample = this.sample(options);
    if (!this.isSampleReady(sample)) {
      throw new Error(`${this.manifest.id} must be preloaded before drawing.`);
    }
    return this.drawSample(context, sample, options);
  }

  drawSample(context, sample, options = {}) {
    if (!this.isSampleReady(sample, { touch: true })) {
      throw new Error(`${this.manifest.id} frame must finish loading before drawing.`);
    }
    if (options.resolveImage !== undefined && typeof options.resolveImage !== 'function') {
      throw new TypeError('options.resolveImage must be a function.');
    }
    const x = Number.isFinite(options.x) ? options.x : 0;
    const y = Number.isFinite(options.y) ? options.y : 0;
    const scale = Number.isFinite(options.scale) ? options.scale : 1;
    const shadowOpacity = options.shadowOpacity ?? 0.24;
    if (!Number.isFinite(shadowOpacity) || shadowOpacity < 0 || shadowOpacity > 1) {
      throw new RangeError('options.shadowOpacity must be between zero and one.');
    }
    if (options.mirror !== undefined && typeof options.mirror !== 'boolean') {
      throw new TypeError('options.mirror must be boolean.');
    }
    const direction = (options.mirror ?? (options.facing === 'left')) ? -1 : 1;
    const { canvas } = this.manifest;

    if (options.shadow !== false) {
      const shadow = sample.bounds.shadow;
      context.save();
      context.translate(x, y);
      context.scale(scale, scale);
      context.fillStyle = `rgba(27, 18, 24, ${shadowOpacity})`;
      context.beginPath();
      context.ellipse(
        shadow.x + shadow.width / 2 - canvas.ground.x,
        shadow.y + shadow.height / 2 - canvas.ground.y,
        shadow.width / 2,
        shadow.height / 2,
        0,
        0,
        Math.PI * 2,
      );
      context.fill();
      context.restore();
    }

    context.save();
    context.translate(x, y);
    context.scale(direction * scale, scale);
    context.translate(sample.root.x, sample.root.y);
    context.rotate(sample.root.rotation);
    context.scale(sample.root.scaleX, sample.root.scaleY);
    for (const layer of sample.layers) {
      const loadedImage = this.images.get(layer.url);
      const image = options.resolveImage
        ? options.resolveImage({ image: loadedImage, layer, sample })
        : loadedImage;
      if (!image) throw new TypeError(`Image resolver returned no source for ${layer.url}.`);
      context.drawImage(
        image,
        -canvas.ground.x,
        -canvas.ground.y,
        canvas.width,
        canvas.height,
      );
    }
    context.restore();
    return sample;
  }
}
