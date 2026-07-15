import { assetUrl } from '../core/assetUrl.js';
import { AlignedSpriteRig } from './AlignedSpriteRig.js';

const SURFACES = Object.freeze(['world', 'portrait']);
const SURFACE_SET = new Set(SURFACES);
const REMOVED_STATE_FIELDS = Object.freeze([
  'actorAnimation',
  'detail',
  'outfit',
  'walking',
]);

function object(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${path} must be an object.`);
  }
  return value;
}

function id(value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${path} must be a non-empty string.`);
  }
  return value;
}

function finite(value, path) {
  if (!Number.isFinite(value)) throw new TypeError(`${path} must be finite.`);
  return value;
}

function positive(value, path) {
  finite(value, path);
  if (value <= 0) throw new RangeError(`${path} must be greater than zero.`);
  return value;
}

function surface(value, path = 'surface') {
  if (!SURFACE_SET.has(value)) {
    throw new TypeError(`${path} must be world or portrait.`);
  }
  return value;
}

function rejectRemovedStateFields(value) {
  for (const field of REMOVED_STATE_FIELDS) {
    if (Object.hasOwn(value, field)) {
      throw new TypeError(`Full-frame character state field ${field} is no longer supported.`);
    }
  }
}

function freezeTree(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) freezeTree(child, seen);
  return Object.freeze(value);
}

function joinAssetPath(basePath, path) {
  id(path, 'frame path');
  if (!basePath || path.startsWith('assets/')) return path.replace(/^\/+/, '');
  return `${basePath.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function normalizeFrameSource(source, basePath, resolveFrame, path) {
  if (typeof source === 'string') {
    const file = joinAssetPath(basePath, source);
    const url = resolveFrame(file);
    id(url, `${path} resolved URL`);
    return { left: url, right: url, files: [file] };
  }

  object(source, path);
  if (source.path !== undefined) {
    const file = joinAssetPath(basePath, source.path);
    const url = resolveFrame(file);
    id(url, `${path}.path resolved URL`);
    return { left: url, right: url, files: [file] };
  }

  const leftFile = joinAssetPath(basePath, id(source.left, `${path}.left`));
  const rightFile = joinAssetPath(basePath, id(source.right, `${path}.right`));
  const left = resolveFrame(leftFile);
  const right = resolveFrame(rightFile);
  id(left, `${path}.left resolved URL`);
  id(right, `${path}.right resolved URL`);
  return { left, right, files: [leftFile, rightFile] };
}

function normalizeFrame(frame, basePath, resolveFrame, path) {
  if (typeof frame === 'string') {
    return { source: normalizeFrameSource(frame, basePath, resolveFrame, path) };
  }
  object(frame, path);
  const source = frame.file ?? frame.source ?? frame.path ?? frame;
  const normalized = { source: normalizeFrameSource(source, basePath, resolveFrame, path) };
  for (const field of ['root', 'anchors', 'bounds']) {
    if (frame[field] !== undefined) normalized[field] = frame[field];
  }
  return normalized;
}

function normalizeClip(clip, basePath, resolveFrame, path) {
  const descriptor = typeof clip === 'string' || Array.isArray(clip)
    ? { frames: Array.isArray(clip) ? clip : [clip] }
    : object(clip, path);
  if (!Array.isArray(descriptor.frames) || descriptor.frames.length === 0) {
    throw new TypeError(`${path}.frames must be a non-empty array.`);
  }
  const fps = descriptor.fps ?? 1;
  positive(fps, `${path}.fps`);
  const loop = descriptor.loop ?? true;
  if (typeof loop !== 'boolean') throw new TypeError(`${path}.loop must be boolean.`);
  if (descriptor.reducedMotionClip !== undefined) {
    id(descriptor.reducedMotionClip, `${path}.reducedMotionClip`);
  }
  return {
    fps,
    loop,
    frames: descriptor.frames.map((frame, index) => normalizeFrame(
      frame,
      basePath,
      resolveFrame,
      `${path}.frames[${index}]`,
    )),
    ...(descriptor.reducedMotionClip
      ? { reducedMotionClip: descriptor.reducedMotionClip }
      : {}),
  };
}

function derivedBounds(canvas) {
  const { width, height, ground } = canvas;
  return {
    world: { x: 0, y: 0, width, height: ground.y },
    portrait: {
      x: width * 0.2,
      y: 0,
      width: width * 0.6,
      height: height * 0.42,
    },
    shadow: {
      x: width * 0.25,
      y: ground.y - height * 0.015,
      width: width * 0.5,
      height: height * 0.03,
    },
    headSafe: {
      x: width * 0.2,
      y: 0,
      width: width * 0.6,
      height: height * 0.42,
    },
  };
}

function normalizePlacement(definition, bounds) {
  const worldHeight = definition.worldHeight ?? 250;
  positive(worldHeight, 'definition.worldHeight');
  const defaultWorldScale = worldHeight / bounds.world.height;
  const placement = definition.placement ?? {};
  object(placement, 'definition.placement');
  return Object.fromEntries(SURFACES.map((surface) => {
    const source = placement[surface] ?? {};
    object(source, `definition.placement.${surface}`);
    const scale = source.scale ?? defaultWorldScale;
    positive(scale, `definition.placement.${surface}.scale`);
    const x = source.x ?? 0;
    const y = source.y ?? 0;
    finite(x, `definition.placement.${surface}.x`);
    finite(y, `definition.placement.${surface}.y`);
    return [surface, { scale, x, y }];
  }));
}

function normalizeStringMap(value, path, knownClips) {
  const source = value ?? {};
  object(source, path);
  const result = {};
  for (const [semantic, clip] of Object.entries(source)) {
    id(semantic, `${path} key`);
    id(clip, `${path}.${semantic}`);
    if (!knownClips.has(clip)) {
      throw new RangeError(`${path}.${semantic} references unknown clip ${clip}.`);
    }
    result[semantic] = clip;
  }
  return result;
}

function normalizeDirectionalMap(value, path, knownClips) {
  const source = value ?? {};
  object(source, path);
  const result = {};
  for (const [semantic, directions] of Object.entries(source)) {
    id(semantic, `${path} key`);
    object(directions, `${path}.${semantic}`);
    result[semantic] = {};
    for (const facing of ['left', 'right']) {
      const clip = id(directions[facing], `${path}.${semantic}.${facing}`);
      if (!knownClips.has(clip)) {
        throw new RangeError(`${path}.${semantic}.${facing} references unknown clip ${clip}.`);
      }
      result[semantic][facing] = clip;
    }
  }
  return result;
}

/**
 * Expands a compact frame-per-PNG character definition into the existing
 * aligned-canvas contract. Every source image remains a whole, same-sized
 * character frame; there is no runtime body-part assembly.
 */
export function createFullFrameCharacterManifest(definition, { resolveFrame = assetUrl } = {}) {
  object(definition, 'definition');
  id(definition.id, 'definition.id');
  if (typeof resolveFrame !== 'function') throw new TypeError('resolveFrame must be a function.');

  const canvas = object(definition.canvas, 'definition.canvas');
  positive(canvas.width, 'definition.canvas.width');
  positive(canvas.height, 'definition.canvas.height');
  object(canvas.ground, 'definition.canvas.ground');
  finite(canvas.ground.x, 'definition.canvas.ground.x');
  finite(canvas.ground.y, 'definition.canvas.ground.y');

  const sourceAppearances = object(definition.appearances, 'definition.appearances');
  if (Object.keys(sourceAppearances).length === 0) {
    throw new TypeError('definition.appearances must not be empty.');
  }
  const defaultAppearance = definition.defaultAppearance ?? Object.keys(sourceAppearances)[0];
  if (!Object.hasOwn(sourceAppearances, defaultAppearance)) {
    throw new RangeError(`definition.defaultAppearance references unknown appearance ${defaultAppearance}.`);
  }

  const assets = {};
  const assetFiles = new Set();
  const assetIds = new Map();
  const alignedAppearances = {};
  const alignedClips = {};
  const runtimeAppearances = {};

  const assetFor = (source) => {
    const key = JSON.stringify([source.left, source.right]);
    if (assetIds.has(key)) return assetIds.get(key);
    const assetId = `frame.${assetIds.size}`;
    assetIds.set(key, assetId);
    assets[assetId] = { left: source.left, right: source.right };
    source.files.forEach((file) => assetFiles.add(file));
    return assetId;
  };

  for (const [appearanceId, appearanceSource] of Object.entries(sourceAppearances)) {
    id(appearanceId, 'definition.appearances key');
    const appearance = object(appearanceSource, `definition.appearances.${appearanceId}`);
    const sourceClips = object(appearance.clips, `definition.appearances.${appearanceId}.clips`);
    if (!Object.hasOwn(sourceClips, 'idle')) {
      throw new RangeError(`definition.appearances.${appearanceId}.clips must define idle.`);
    }
    const clipNames = new Set(Object.keys(sourceClips));
    const runtimeClips = {};
    const normalizedClips = {};

    for (const [clipId, sourceClip] of Object.entries(sourceClips)) {
      id(clipId, `definition.appearances.${appearanceId}.clips key`);
      const clip = normalizeClip(
        sourceClip,
        definition.basePath ?? '',
        resolveFrame,
        `definition.appearances.${appearanceId}.clips.${clipId}`,
      );
      normalizedClips[clipId] = clip;
      const alignedClipId = `${appearanceId}/${clipId}`;
      runtimeClips[clipId] = alignedClipId;
      alignedClips[alignedClipId] = {
        fps: clip.fps,
        loop: clip.loop,
        frames: clip.frames.map((frame) => ({
          slots: { figure: assetFor(frame.source) },
          ...(frame.root ? { root: frame.root } : {}),
          ...(frame.anchors ? { anchors: frame.anchors } : {}),
          ...(frame.bounds ? { bounds: frame.bounds } : {}),
        })),
        ...(clip.reducedMotionClip
          ? { reducedMotionClip: `${appearanceId}/${clip.reducedMotionClip}` }
          : {}),
      };
    }

    for (const [clipId, clip] of Object.entries(normalizedClips)) {
      if (clip.reducedMotionClip && !clipNames.has(clip.reducedMotionClip)) {
        throw new RangeError(
          `definition.appearances.${appearanceId}.clips.${clipId}.reducedMotionClip `
          + `references unknown clip ${clip.reducedMotionClip}.`,
        );
      }
    }

    const directions = normalizeDirectionalMap(
      appearance.directions,
      `definition.appearances.${appearanceId}.directions`,
      clipNames,
    );
    const knownSemantics = new Set([...clipNames, ...Object.keys(directions)]);
    const idleAsset = alignedClips[`${appearanceId}/idle`].frames[0].slots.figure;
    alignedAppearances[appearanceId] = { slots: { figure: idleAsset } };
    runtimeAppearances[appearanceId] = {
      clips: runtimeClips,
      directions,
      aliases: normalizeStringMap(
        appearance.aliases,
        `definition.appearances.${appearanceId}.aliases`,
        knownSemantics,
      ),
      actions: normalizeStringMap(
        appearance.actions,
        `definition.appearances.${appearanceId}.actions`,
        knownSemantics,
      ),
    };
  }

  // AlignedSpriteRig's shared contract requires a top-level idle clip. Runtime
  // selection always uses the appearance-qualified clips, so this is only the
  // explicit validation baseline for the declared default appearance.
  alignedClips.idle = alignedClips[`${defaultAppearance}/idle`];

  const bounds = { ...derivedBounds(canvas), ...(definition.bounds ?? {}) };
  const anchors = { ground: { ...canvas.ground }, ...(definition.anchors ?? {}) };
  const requiredAnchors = definition.requiredAnchors ?? Object.keys(anchors);
  if (!Array.isArray(requiredAnchors) || requiredAnchors.length === 0) {
    throw new TypeError('definition.requiredAnchors must be a non-empty array.');
  }

  const blink = {
    interval: definition.blink?.interval ?? 4.7,
    duration: definition.blink?.duration ?? 0.18,
    offset: definition.blink?.offset ?? 0,
  };
  positive(blink.interval, 'definition.blink.interval');
  positive(blink.duration, 'definition.blink.duration');
  finite(blink.offset, 'definition.blink.offset');
  if (blink.duration >= blink.interval) {
    throw new RangeError('definition.blink.duration must be shorter than definition.blink.interval.');
  }

  return freezeTree({
    id: definition.id,
    canvas: {
      width: canvas.width,
      height: canvas.height,
      ground: { x: canvas.ground.x, y: canvas.ground.y },
    },
    layerOrder: ['figure'],
    assets,
    appearances: alignedAppearances,
    expressions: { neutral: { slots: {} } },
    clips: alignedClips,
    aliases: {},
    requiredAnchors: [...requiredAnchors],
    anchors,
    bounds,
    fullFrame: {
      defaultAppearance,
      appearances: runtimeAppearances,
      placement: normalizePlacement(definition, bounds),
      blink,
      assetFiles: [...assetFiles],
    },
  });
}

function appearanceFor(manifest, character) {
  const runtime = manifest.fullFrame;
  const requested = character.appearance ?? runtime.defaultAppearance;
  if (!Object.hasOwn(runtime.appearances, requested)) {
    throw new RangeError(`${manifest.id} does not support appearance ${requested}.`);
  }
  return requested;
}

function blinkIsActive(blink, time, phase) {
  const elapsed = Math.max(0, time + phase + blink.offset);
  return elapsed % blink.interval >= blink.interval - blink.duration;
}

/** Resolve ordinary movement, dialogue, emotes, and action-local set-piece time. */
export function resolveFullFrameCharacterAnimation(manifest, character = {}, time = 0) {
  object(manifest, 'manifest');
  const runtime = object(manifest.fullFrame, 'manifest.fullFrame');
  object(character, 'character');
  rejectRemovedStateFields(character);
  const appearance = appearanceFor(manifest, character);
  const catalog = runtime.appearances[appearance];
  const action = character.action ?? null;
  const safeTime = Number.isFinite(time) ? time : 0;
  const phase = Number.isFinite(character.phase) ? character.phase : 0;
  const facing = character.facing === 'left' ? 'left' : 'right';
  let semantic;
  let actionProgress;
  let requestedActionProgress;
  let localTime = safeTime;

  if (action !== null) {
    const actionId = id(action, 'character.action');
    semantic = catalog.actions[actionId]
      ?? (catalog.clips[actionId] || catalog.directions[actionId] ? actionId : null);
    if (!semantic) {
      throw new RangeError(`${manifest.id} appearance ${appearance} does not support action ${actionId}.`);
    }
    localTime = Number.isFinite(character.actionTime) ? character.actionTime : safeTime;
    if (Number.isFinite(character.actionProgress)) {
      requestedActionProgress = character.actionProgress;
    }
  } else {
    const requestedPose = character.pose ?? 'idle';
    const requestedExpression = character.expression;
    if (
      requestedExpression
      && requestedExpression !== 'neutral'
      && requestedPose === 'idle'
      && (catalog.clips[requestedExpression] || catalog.directions[requestedExpression])
    ) {
      semantic = requestedExpression;
    } else {
      semantic = catalog.aliases[requestedPose] ?? requestedPose;
    }

    if (semantic === 'idle' && character.wand && catalog.clips['wand-hold']) {
      semantic = 'wand-hold';
    }
    if (!catalog.clips[semantic] && !catalog.directions[semantic]) {
      throw new RangeError(`${manifest.id} appearance ${appearance} does not support pose ${requestedPose}.`);
    }
    if (
      semantic === 'idle'
      && (catalog.clips.blink || catalog.directions.blink)
      && blinkIsActive(runtime.blink, safeTime, phase)
    ) semantic = 'blink';
  }

  const directionalClip = catalog.directions[semantic];
  const frameSemantic = directionalClip?.[facing] ?? semantic;
  const pose = catalog.clips[frameSemantic];
  if (!pose) {
    throw new RangeError(`${manifest.id} appearance ${appearance} does not support pose ${semantic}.`);
  }
  if (requestedActionProgress !== undefined && !manifest.clips[pose].loop) {
    actionProgress = requestedActionProgress;
  }

  return Object.freeze({
    appearance,
    semantic,
    frameSemantic,
    pose,
    mirror: !directionalClip && facing === 'left',
    localTime,
    ...(actionProgress === undefined ? {} : { actionProgress }),
    phase,
    facing,
    lightSide: character.lightSide === 'right' ? 'right' : 'left',
    reducedMotion: Boolean(character.reducedMotion),
  });
}

export class FullFrameCharacterRig {
  constructor(definitionOrManifest, options = {}) {
    this.manifest = definitionOrManifest?.fullFrame
      ? definitionOrManifest
      : createFullFrameCharacterManifest(definitionOrManifest, options);
    this.alignedRig = new AlignedSpriteRig(this.manifest, {
      imageFactory: options.imageFactory,
      maxConcurrentLoads: options.maxConcurrentLoads,
      maxDecodedImages: options.maxDecodedImages,
    });
    if (options.imageTransform !== undefined && typeof options.imageTransform !== 'function') {
      throw new TypeError('imageTransform must be a function.');
    }
    if (
      options.shadowOpacity !== undefined
      && (!Number.isFinite(options.shadowOpacity)
        || options.shadowOpacity < 0
        || options.shadowOpacity > 1)
    ) {
      throw new RangeError('shadowOpacity must be between zero and one.');
    }
    this.imageTransform = options.imageTransform ?? null;
    this.shadowOpacity = options.shadowOpacity;
    this.loadingError = null;
    this.lastReadyFrame = null;
    this.trackedLoadings = new WeakSet();
    this.generation = 0;
  }

  get ready() {
    return this.alignedRig.ready;
  }

  get failed() {
    return this.loadingError !== null;
  }

  preload() {
    const loading = this.alignedRig.preload();
    this.trackLoading(loading);
    return loading;
  }

  trackLoading(loading) {
    if (!this.trackedLoadings.has(loading)) {
      this.trackedLoadings.add(loading);
      const generation = this.generation;
      loading.catch((error) => {
        if (generation === this.generation) this.loadingError = error;
      });
    }
    return loading;
  }

  release() {
    this.generation += 1;
    this.loadingError = null;
    this.lastReadyFrame = null;
    this.trackedLoadings = new WeakSet();
    this.alignedRig.release();
  }

  baselinePoses(animation) {
    const appearance = this.manifest.fullFrame.appearances[animation.appearance];
    const directionalBlink = appearance.directions.blink?.[animation.facing];
    return [...new Set([
      appearance.clips.idle,
      appearance.clips.blink ?? appearance.clips[directionalBlink],
    ].filter(Boolean))];
  }

  drawOptions(character, animation, surface) {
    const placement = this.manifest.fullFrame.placement[surface];
    const characterScale = Number.isFinite(character.scale) ? character.scale : 1;
    return {
      appearance: animation.appearance,
      pose: animation.pose,
      localTime: animation.localTime,
      actionProgress: animation.actionProgress,
      phase: animation.phase,
      facing: animation.facing,
      mirror: animation.mirror,
      lightSide: animation.lightSide,
      reducedMotion: animation.reducedMotion,
      x: (Number.isFinite(character.x) ? character.x : 0) + placement.x * characterScale,
      y: (Number.isFinite(character.y) ? character.y : 0) + placement.y * characterScale,
      scale: placement.scale * characterScale,
      shadow: surface === 'world' && character.shadow !== false,
      shadowOpacity: this.shadowOpacity,
      // Whole-frame rigs do not interpret robe color themselves. Keeping the
      // selected trim on the aligned draw contract gives Violet's production
      // renderer one stable hook for the selective recolor pass.
      robeTrim: animation.appearance === 'robes' ? character.robeTrim : undefined,
      ...(this.imageTransform
        ? {
          resolveImage: ({ image, layer }) => this.imageTransform({
            image,
            layer,
            animation,
            character,
            surface,
          }),
        }
        : {}),
    };
  }

  prepareFrame(character = {}, time = 0, requestedSurface = 'world') {
    const animation = resolveFullFrameCharacterAnimation(this.manifest, character, time);
    const renderSurface = surface(requestedSurface, 'Full-frame render surface');
    const options = this.drawOptions(character, animation, renderSurface);
    const sample = this.alignedRig.sample(options);
    this.alignedRig.protectSamples([this.lastReadyFrame?.sample, sample].filter(Boolean));
    const request = this.alignedRig.requestFrame(options, {
      sample,
      includeClip: true,
      baselinePoses: this.baselinePoses(animation),
    });
    this.trackLoading(request.loading);
    return {
      animation,
      surface: renderSurface,
      options,
      sample,
      loading: request.loading,
    };
  }

  ensureLoading(character = {}, time = 0, requestedSurface = 'world') {
    return this.prepareFrame(character, time, requestedSurface).loading;
  }

  rememberReadyFrame(sample, animation) {
    this.lastReadyFrame = Object.freeze({ sample, animation });
    this.alignedRig.protectSamples([sample]);
  }

  draw(context, character = {}, time = 0, requestedSurface = 'world') {
    const animation = resolveFullFrameCharacterAnimation(this.manifest, character, time);
    const renderSurface = surface(requestedSurface, 'Full-frame render surface');
    if (this.loadingError) {
      return Object.freeze({ status: 'failed', error: this.loadingError, animation });
    }

    const options = this.drawOptions(character, animation, renderSurface);

    // Deterministic review scenes explicitly call preload(), which retains
    // the complete manifest and keeps their historical synchronous draw path.
    if (this.ready) {
      const sample = this.alignedRig.draw(context, options);
      this.rememberReadyFrame(sample, animation);
      return Object.freeze({ status: 'drawn', animation, sample });
    }

    const targetSample = this.alignedRig.sample(options);
    this.alignedRig.protectSamples([this.lastReadyFrame?.sample, targetSample].filter(Boolean));
    const request = this.alignedRig.requestFrame(options, {
      sample: targetSample,
      includeClip: true,
      baselinePoses: this.baselinePoses(animation),
    });
    this.trackLoading(request.loading);

    if (this.alignedRig.isSampleReady(targetSample)) {
      const sample = this.alignedRig.drawSample(context, targetSample, options);
      this.rememberReadyFrame(sample, animation);
      return Object.freeze({ status: 'drawn', animation, sample });
    }

    if (
      this.lastReadyFrame
      && this.alignedRig.isSampleReady(this.lastReadyFrame.sample)
    ) {
      const displayed = this.lastReadyFrame;
      const fallbackOptions = this.drawOptions(character, displayed.animation, renderSurface);
      const sample = this.alignedRig.drawSample(context, displayed.sample, fallbackOptions);
      this.alignedRig.protectSamples([displayed.sample, targetSample]);
      return Object.freeze({
        status: 'drawn',
        animation,
        sample,
        pending: true,
        displayedAnimation: displayed.animation,
        loading: request.loading,
      });
    }

    this.lastReadyFrame = null;
    return Object.freeze({ status: 'loading', animation, loading: request.loading });
  }
}
