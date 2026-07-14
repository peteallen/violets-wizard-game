import { describe, expect, it, vi } from 'vitest';
import { sampleAlignedSpriteFrame } from '../src/game/render/AlignedSpriteRig.js';
import {
  CharacterRenderer,
  preloadCharacterReviewScene,
} from '../src/game/render/CharacterRenderer.js';
import {
  FullFrameCharacterRig,
  createFullFrameCharacterManifest,
  fullFrameAssetManifestEntries,
  productionFullFrameCharacterRigs,
  resolveFullFrameCharacterAnimation,
} from '../src/game/render/FullFrameCharacterRig.js';
import { violetFullFrameCharacterRig } from '../src/game/render/VioletFullFrameCharacterRig.js';

function definition() {
  return {
    id: 'puppet.test.full-frame',
    kind: 'violet',
    chapter: 'ch1',
    basePath: 'assets/art/characters/test',
    canvas: { width: 100, height: 160, ground: { x: 50, y: 150 } },
    worldHeight: 142,
    placement: {
      portrait: { scale: 0.5, x: 2, y: 3 },
    },
    bounds: {
      world: { x: 12, y: 8, width: 76, height: 142 },
      portrait: { x: 18, y: 6, width: 64, height: 62 },
      shadow: { x: 24, y: 145, width: 52, height: 10 },
      headSafe: { x: 20, y: 5, width: 60, height: 58 },
    },
    anchors: {
      handLeft: { x: 24, y: 94 },
      handRight: { x: 76, y: 94 },
    },
    appearances: {
      casual: {
        clips: {
          idle: 'casual/idle.png',
          blink: 'casual/blink.png',
          speaking: { fps: 4, frames: ['casual/talk-a.png', 'casual/talk-b.png'] },
          walking: {
            fps: 2,
            reducedMotionClip: 'idle',
            frames: [
              'casual/walk-contact-a.png',
              { file: 'casual/walk-pass-a.png', root: { y: -2 } },
            ],
          },
          proud: 'casual/proud.png',
          'wand-hold': 'casual/wand-hold.png',
          'wand-test': {
            fps: 4,
            loop: false,
            frames: ['casual/wand-test-a.png', 'casual/wand-test-b.png'],
          },
        },
        aliases: { talk: 'speaking', walk: 'walking' },
        actions: { inspect: 'wand-test' },
      },
      robes: {
        clips: {
          idle: 'robes/idle.png',
          speaking: ['robes/talk-a.png', 'robes/talk-b.png'],
          walking: ['robes/walk-a.png', 'robes/walk-b.png'],
        },
        aliases: { talk: 'speaking' },
      },
    },
    appearanceAliases: { robe: 'robes' },
  };
}

function recordingContext() {
  const calls = [];
  const context = { calls, fillStyle: null };
  for (const method of [
    'beginPath', 'drawImage', 'ellipse', 'fill', 'restore', 'rotate', 'save', 'scale', 'translate',
  ]) context[method] = (...args) => calls.push([method, ...args]);
  return context;
}

describe('compact full-frame character manifest', () => {
  it('expands semantic frame paths into deterministic aligned clips and asset entries', () => {
    const manifest = createFullFrameCharacterManifest(definition(), { resolveFrame: (path) => `/base/${path}` });

    expect(manifest.fullFrame).toMatchObject({
      kind: 'violet',
      defaultAppearance: 'casual',
      appearances: {
        casual: {
          clips: {
            idle: 'casual/idle',
            walking: 'casual/walking',
            speaking: 'casual/speaking',
          },
          aliases: { talk: 'speaking', walk: 'walking' },
          actions: { inspect: 'wand-test' },
        },
      },
    });
    expect(manifest.clips['casual/walking']).toMatchObject({
      fps: 2,
      loop: true,
      reducedMotionClip: 'casual/idle',
    });
    expect(manifest.clips['casual/walking'].frames[1].root).toEqual({ y: -2 });
    expect(manifest.assets[manifest.clips['casual/idle'].frames[0].slots.figure]).toEqual({
      left: '/base/assets/art/characters/test/casual/idle.png',
      right: '/base/assets/art/characters/test/casual/idle.png',
    });
    expect(manifest.requiredAnchors).toEqual(['ground', 'handLeft', 'handRight']);
    expect(Object.isFrozen(manifest.fullFrame.appearances.casual.clips)).toBe(true);

    const entries = fullFrameAssetManifestEntries(manifest);
    expect(Object.values(entries)).toContainEqual({
      path: 'assets/art/characters/test/casual/idle.png',
      kind: 'image',
      chapter: 'ch1',
    });
    expect(Object.keys(entries)).toHaveLength(manifest.fullFrame.assetFiles.length);
  });

  it('accepts explicit directional-light files while deduplicating reused whole frames', () => {
    const source = definition();
    source.appearances.casual.clips.idle = {
      frames: [{ left: 'casual/idle-left.png', right: 'casual/idle-right.png' }],
    };
    source.appearances.casual.clips.proud = {
      frames: [{ left: 'casual/idle-left.png', right: 'casual/idle-right.png' }],
    };
    const manifest = createFullFrameCharacterManifest(source, { resolveFrame: (path) => path });

    const idleAsset = manifest.clips['casual/idle'].frames[0].slots.figure;
    const proudAsset = manifest.clips['casual/proud'].frames[0].slots.figure;
    expect(proudAsset).toBe(idleAsset);
    expect(manifest.assets[idleAsset]).toEqual({
      left: 'assets/art/characters/test/casual/idle-left.png',
      right: 'assets/art/characters/test/casual/idle-right.png',
    });
  });

  it('maps authored left and right profile cycles without mirroring either drawing', () => {
    const source = definition();
    delete source.appearances.casual.clips.walking;
    source.appearances.casual.clips['walk-left'] = [
      'casual/walk-left-contact.png', 'casual/walk-left-pass.png',
    ];
    source.appearances.casual.clips['walk-right'] = [
      'casual/walk-right-contact.png', 'casual/walk-right-pass.png',
    ];
    source.appearances.casual.directions = {
      walking: { left: 'walk-left', right: 'walk-right' },
    };
    const manifest = createFullFrameCharacterManifest(source, { resolveFrame: (path) => path });

    expect(resolveFullFrameCharacterAnimation(manifest, {
      walking: true, facing: 'left', lightSide: 'right',
    }, 0)).toMatchObject({
      semantic: 'walking',
      frameSemantic: 'walk-left',
      pose: 'casual/walk-left',
      facing: 'left',
      mirror: false,
    });
    expect(resolveFullFrameCharacterAnimation(manifest, {
      walking: true, facing: 'right', lightSide: 'right',
    }, 0)).toMatchObject({
      semantic: 'walking',
      frameSemantic: 'walk-right',
      pose: 'casual/walk-right',
      facing: 'right',
      mirror: false,
    });
  });

  it('rejects incomplete appearances and bad aliases before runtime', () => {
    const missingIdle = definition();
    delete missingIdle.appearances.casual.clips.idle;
    expect(() => createFullFrameCharacterManifest(missingIdle)).toThrow('clips must define idle');

    const badAction = definition();
    badAction.appearances.casual.actions.inspect = 'missing';
    expect(() => createFullFrameCharacterManifest(badAction)).toThrow('references unknown clip missing');

    const badReducedMotion = definition();
    badReducedMotion.appearances.casual.clips.walking.reducedMotionClip = 'missing';
    expect(() => createFullFrameCharacterManifest(badReducedMotion)).toThrow(
      'reducedMotionClip references unknown clip missing',
    );
  });
});

describe('full-frame animation resolution', () => {
  const manifest = createFullFrameCharacterManifest(definition(), { resolveFrame: (path) => path });

  it('selects movement, dialogue, emotes, wand state, and deterministic blinks', () => {
    expect(resolveFullFrameCharacterAnimation(manifest, { walking: true }, 1.2)).toMatchObject({
      appearance: 'casual', semantic: 'walking', pose: 'casual/walking', localTime: 1.2,
    });
    expect(resolveFullFrameCharacterAnimation(manifest, { pose: 'talk' }, 1.2)).toMatchObject({
      semantic: 'speaking', pose: 'casual/speaking',
    });
    expect(resolveFullFrameCharacterAnimation(manifest, { pose: 'idle', expression: 'proud' }, 1.2)).toMatchObject({
      semantic: 'proud', pose: 'casual/proud',
    });
    expect(resolveFullFrameCharacterAnimation(manifest, { pose: 'idle', wand: true }, 1.2)).toMatchObject({
      semantic: 'wand-hold', pose: 'casual/wand-hold',
    });
    expect(resolveFullFrameCharacterAnimation(manifest, { pose: 'idle' }, 4.6)).toMatchObject({
      semantic: 'blink', pose: 'casual/blink',
    });
    expect(resolveFullFrameCharacterAnimation(manifest, { pose: 'idle' }, 4.2)).toMatchObject({
      semantic: 'idle', pose: 'casual/idle',
    });
  });

  it('uses set-piece-local action time and progress without changing save contracts', () => {
    const resolved = resolveFullFrameCharacterAnimation(manifest, {
      pose: 'idle',
      actorAnimation: { action: 'inspect', localTime: 0.8, progress: 0.4 },
    }, 99);
    expect(resolved).toMatchObject({
      semantic: 'wand-test',
      pose: 'casual/wand-test',
      localTime: 0.8,
      actionProgress: 0.4,
    });
    const sampled = sampleAlignedSpriteFrame(manifest, resolved);
    expect(sampled.frameIndex).toBe(0);
    expect(sampled.layers[0].url).toContain('wand-test-a.png');
  });

  it('resolves explicit appearance aliases and rejects unsupported states rather than substituting idle', () => {
    expect(resolveFullFrameCharacterAnimation(manifest, { outfit: 'robe', pose: 'talk' }, 0)).toMatchObject({
      appearance: 'robes', semantic: 'speaking', pose: 'robes/speaking',
    });
    expect(() => resolveFullFrameCharacterAnimation(manifest, { pose: 'tumble' }, 0)).toThrow(
      'does not support pose tumble',
    );
    expect(() => resolveFullFrameCharacterAnimation(manifest, {
      actorAnimation: { action: 'wrong-wand-one' },
    }, 0)).toThrow('does not support action wrong-wand-one');
    expect(() => resolveFullFrameCharacterAnimation(manifest, { outfit: 'winter', pose: 'idle' }, 0)).toThrow(
      'does not support appearance winter',
    );
  });
});

describe('full-frame character loader and renderer opt-in', () => {
  it('loads every equal-sized frame, reports loading explicitly, and draws at configured placement', async () => {
    const created = [];
    const rig = new FullFrameCharacterRig(definition(), {
      resolveFrame: (path) => path,
      imageFactory: (url) => {
        const image = {
          url, onload: null, onerror: null, naturalWidth: 100, naturalHeight: 160,
        };
        created.push(image);
        return image;
      },
    });
    const context = recordingContext();

    expect(rig.draw(context, { pose: 'walking', x: 300, y: 500 }, 0).status).toBe('loading');
    expect(context.calls).toEqual([]);
    created.forEach((image) => image.onload());
    await rig.preload();

    const world = rig.draw(context, {
      pose: 'walking', x: 300, y: 500, scale: 2, facing: 'left', lightSide: 'right',
    }, 0.6);
    expect(world.status).toBe('drawn');
    expect(world.sample.frameIndex).toBe(1);
    expect(context.calls).toContainEqual(['scale', -2, 2]);

    const portrait = recordingContext();
    const portraitResult = rig.draw(portrait, {
      pose: 'talk', x: 10, y: 20, scale: 0.8, detail: 'portrait',
    }, 0.3);
    expect(portraitResult.status).toBe('drawn');
    expect(portrait.calls).toContainEqual(['translate', 11.6, 22.4]);
    expect(portrait.calls).toContainEqual(['scale', 0.4, 0.4]);
    expect(portrait.calls.some(([name]) => name === 'ellipse')).toBe(false);
  });

  it('can transform a loaded whole-frame image at draw time without changing clip selection', async () => {
    const created = [];
    const transformed = { kind: 'recolored-canvas' };
    const imageTransform = vi.fn(() => transformed);
    const rig = new FullFrameCharacterRig(definition(), {
      resolveFrame: (path) => path,
      imageTransform,
      imageFactory: (url) => {
        const image = {
          url, onload: null, onerror: null, naturalWidth: 100, naturalHeight: 160,
        };
        created.push(image);
        return image;
      },
    });
    const loading = rig.preload();
    created.forEach((image) => image.onload());
    await loading;
    const context = recordingContext();

    const result = rig.draw(context, {
      outfit: 'robes', pose: 'idle', robeTrim: '#3f8c88', detail: 'portrait',
    }, 0);

    expect(result.animation).toMatchObject({ appearance: 'robes', semantic: 'idle' });
    expect(imageTransform).toHaveBeenCalledWith(expect.objectContaining({
      image: expect.objectContaining({ url: expect.stringContaining('robes/idle.png') }),
      animation: expect.objectContaining({ appearance: 'robes' }),
      character: expect.objectContaining({ robeTrim: '#3f8c88' }),
      surface: 'portrait',
    }));
    expect(context.calls.some(([name, image]) => name === 'drawImage' && image === transformed)).toBe(true);
  });

  it('keeps a registered generated character authoritative while its images load', () => {
    const generatedRig = { draw: vi.fn(() => ({ status: 'loading' })) };
    const renderer = new CharacterRenderer({
      fullFrameRigs: new Map([['violet', generatedRig], ['guide', generatedRig]]),
    });
    const context = recordingContext();

    expect(renderer.draw(context, {
      kind: 'violet', x: 100, y: 500, outfit: 'casual', pose: 'walking',
    }, 2)).toEqual({ status: 'loading' });
    expect(renderer.draw(context, {
      kind: 'guide', x: 200, y: 500, pose: 'speaking',
    }, 3)).toEqual({ status: 'loading' });
    expect(generatedRig.draw).toHaveBeenCalledTimes(2);
    expect(context.calls).toEqual([]);
  });

  it('rejects malformed generated-rig registrations immediately', () => {
    expect(() => new CharacterRenderer({ fullFrameRigs: { violet: {} } })).toThrow(
      'must map character kinds to drawable rigs',
    );
  });

  it('awaits every opted-in rig before an existing registered harness capture', async () => {
    const rig = { preload: vi.fn(async () => {}) };
    const violetPreload = vi.spyOn(violetFullFrameCharacterRig, 'preload').mockResolvedValue();
    productionFullFrameCharacterRigs.set('review-test', rig);
    try {
      await preloadCharacterReviewScene('character-cast-review');
      expect(violetPreload).toHaveBeenCalledOnce();
      expect(rig.preload).toHaveBeenCalledOnce();
    } finally {
      productionFullFrameCharacterRigs.delete('review-test');
      violetPreload.mockRestore();
    }
  });
});
