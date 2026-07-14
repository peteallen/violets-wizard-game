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

export function sampleAlignedSpriteFrame(manifest, {
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
  validateAlignedSpriteManifest(manifest);
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

export function transformAlignedSpriteAnchor(manifest, sample, anchor, {
  x = 0,
  y = 0,
  scale = 1,
  facing = 'right',
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
  assertFinite(x, 'placement.x');
  assertFinite(y, 'placement.y');
  assertFinite(scale, 'placement.scale');

  const localX = (localAnchor.x - canvas.ground.x) * root.scaleX;
  const localY = (localAnchor.y - canvas.ground.y) * root.scaleY;
  const cosine = Math.cos(root.rotation);
  const sine = Math.sin(root.rotation);
  const movedX = root.x + localX * cosine - localY * sine;
  const movedY = root.y + localX * sine + localY * cosine;
  const direction = facing === 'left' ? -1 : 1;

  return Object.freeze({
    x: x + movedX * direction * scale,
    y: y + movedY * scale,
  });
}

export class AlignedSpriteRig {
  constructor(manifest, { imageFactory } = {}) {
    this.manifest = validateAlignedSpriteManifest(manifest);
    this.imageFactory = imageFactory ?? (() => new Image());
    this.images = new Map();
    this.ready = false;
    this.loading = null;
  }

  preload() {
    if (this.loading) return this.loading;
    const urls = [...new Set(Object.values(this.manifest.assets).flatMap((asset) => [asset.left, asset.right]))];
    this.loading = Promise.all(urls.map((url) => new Promise((resolve, reject) => {
      const image = this.imageFactory(url);
      image.onload = () => {
        const hasNaturalDimensions = image.naturalWidth !== undefined || image.naturalHeight !== undefined;
        if (hasNaturalDimensions && (
          image.naturalWidth !== this.manifest.canvas.width
          || image.naturalHeight !== this.manifest.canvas.height
        )) {
          reject(new Error(
            `${this.manifest.id} asset ${url} is ${image.naturalWidth}x${image.naturalHeight}; `
            + `expected ${this.manifest.canvas.width}x${this.manifest.canvas.height}.`,
          ));
          return;
        }
        this.images.set(url, image);
        resolve();
      };
      image.onerror = () => reject(new Error(`Failed to load ${this.manifest.id} asset ${url}.`));
      image.src = url;
    }))).then(() => { this.ready = true; });
    return this.loading;
  }

  draw(context, options = {}) {
    if (!this.ready) throw new Error(`${this.manifest.id} must be preloaded before drawing.`);
    const sample = sampleAlignedSpriteFrame(this.manifest, options);
    const x = Number.isFinite(options.x) ? options.x : 0;
    const y = Number.isFinite(options.y) ? options.y : 0;
    const scale = Number.isFinite(options.scale) ? options.scale : 1;
    const direction = options.facing === 'left' ? -1 : 1;
    const { canvas } = this.manifest;

    if (options.shadow !== false) {
      const shadow = sample.bounds.shadow;
      context.save();
      context.translate(x, y);
      context.scale(scale, scale);
      context.fillStyle = 'rgba(27, 18, 24, 0.24)';
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
      context.drawImage(
        this.images.get(layer.url),
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
