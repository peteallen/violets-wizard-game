import { describe, expect, it } from 'vitest';
import {
  AlignedSpriteRig,
  resolveLocalLightSide,
  sampleAlignedSpriteFrame,
  validateAlignedSpriteManifest,
} from '../src/game/render/AlignedSpriteRig.js';

function manifest() {
  const paired = (id) => ({ left: `${id}-left.png`, right: `${id}-right.png` });
  return {
    id: 'puppet.test',
    canvas: { width: 100, height: 160, ground: { x: 50, y: 150 } },
    layerOrder: ['legs', 'body', 'face'],
    assets: {
      'legs.idle': paired('legs-idle'),
      'legs.walkA': paired('legs-walk-a'),
      'legs.walkB': paired('legs-walk-b'),
      'body.casual': paired('body-casual'),
      'face.neutral': paired('face-neutral'),
      'face.blink': paired('face-blink'),
      'face.talk': paired('face-talk'),
    },
    appearances: {
      casual: { slots: { legs: 'legs.idle', body: 'body.casual', face: 'face.neutral' } },
    },
    expressions: {
      neutral: { slots: {} },
      blink: { slots: { face: 'face.blink' } },
      talk: { slots: { face: 'face.talk' } },
    },
    clips: {
      idle: {
        fps: 1,
        loop: true,
        frames: [{}],
        motion: { bobAmplitude: 2, bobFrequency: 1, swayAmplitude: 0.02, swayFrequency: 1 },
      },
      walking: {
        fps: 2,
        loop: true,
        reducedMotionClip: 'idle',
        frames: [
          { slots: { legs: 'legs.walkA' } },
          { slots: { legs: 'legs.walkB' }, expression: 'talk', root: { y: -2 } },
        ],
      },
    },
    aliases: { walk: 'walking', speaking: 'idle' },
    requiredAnchors: ['neck', 'handLeft', 'handRight', 'footLeft', 'footRight'],
    anchors: {
      neck: { x: 50, y: 40 },
      handLeft: { x: 24, y: 94 },
      handRight: { x: 76, y: 94 },
      footLeft: { x: 39, y: 150 },
      footRight: { x: 61, y: 150 },
    },
    bounds: {
      world: { x: 12, y: 8, width: 76, height: 142 },
      portrait: { x: 18, y: 6, width: 64, height: 62 },
      shadow: { x: 24, y: 145, width: 52, height: 10 },
      headSafe: { x: 20, y: 5, width: 60, height: 58 },
    },
  };
}

function recordingContext() {
  const calls = [];
  const context = { calls, fillStyle: null };
  for (const method of ['beginPath', 'drawImage', 'ellipse', 'fill', 'restore', 'rotate', 'save', 'scale', 'translate']) {
    context[method] = (...args) => calls.push([method, ...args]);
  }
  return context;
}

describe('aligned sprite rig contract', () => {
  it('validates aligned layers, required geometry, clips, and light variants', () => {
    expect(validateAlignedSpriteManifest(manifest()).id).toBe('puppet.test');

    const missingAnchor = manifest();
    delete missingAnchor.anchors.neck;
    expect(() => validateAlignedSpriteManifest(missingAnchor)).toThrow('missing neck');

    const unknownAsset = manifest();
    unknownAsset.clips.walking.frames[0].slots.legs = 'legs.missing';
    expect(() => validateAlignedSpriteManifest(unknownAsset)).toThrow('unknown asset legs.missing');
  });

  it('selects deterministic local frames and never silently substitutes an unsupported pose', () => {
    const rig = manifest();
    const first = sampleAlignedSpriteFrame(rig, {
      appearance: 'casual', pose: 'walking', localTime: 0.6, facing: 'right', lightSide: 'left',
    });
    const replayed = sampleAlignedSpriteFrame(rig, {
      appearance: 'casual', pose: 'walking', localTime: 0.6, facing: 'right', lightSide: 'left',
    });
    expect(first).toEqual(replayed);
    expect(first.frameIndex).toBe(1);
    expect(first.expression).toBe('talk');
    expect(first.layers[0]).toEqual({
      slot: 'legs', asset: 'legs.walkB', url: 'legs-walk-b-left.png',
    });
    expect(() => sampleAlignedSpriteFrame(rig, {
      appearance: 'casual', pose: 'victory', localTime: 0,
    })).toThrow('does not support pose victory');
  });

  it('keeps room lighting in world space when a whole puppet faces left', () => {
    expect(resolveLocalLightSide('left', 'right')).toBe('left');
    expect(resolveLocalLightSide('right', 'right')).toBe('right');
    expect(resolveLocalLightSide('left', 'left')).toBe('right');
    expect(resolveLocalLightSide('right', 'left')).toBe('left');

    const sample = sampleAlignedSpriteFrame(manifest(), {
      appearance: 'casual', pose: 'idle', facing: 'left', lightSide: 'left',
    });
    expect(sample.localLightSide).toBe('right');
    expect(sample.layers.every(({ url }) => url.endsWith('-right.png'))).toBe(true);
  });

  it('uses an explicit reduced-motion clip and action-local progress', () => {
    const rig = manifest();
    const reduced = sampleAlignedSpriteFrame(rig, {
      appearance: 'casual', pose: 'walking', localTime: 5, reducedMotion: true,
    });
    expect(reduced.clip).toBe('idle');
    expect(reduced.frameIndex).toBe(0);

    const finish = sampleAlignedSpriteFrame(rig, {
      appearance: 'casual', pose: 'walking', actionProgress: 1,
    });
    expect(finish.frameIndex).toBe(1);
  });

  it('preloads every required variant and draws aligned layers over a planted shadow', async () => {
    const created = [];
    const imageFactory = (url) => {
      const image = { url, onload: null, onerror: null };
      created.push(image);
      return image;
    };
    const rig = new AlignedSpriteRig(manifest(), { imageFactory });
    const loading = rig.preload();
    expect(() => rig.draw(recordingContext(), { appearance: 'casual' })).toThrow('must be preloaded');
    created.forEach((image) => image.onload());
    await loading;

    const context = recordingContext();
    const sampled = rig.draw(context, {
      appearance: 'casual', pose: 'walking', localTime: 0.1,
      x: 300, y: 500, scale: 2, facing: 'left', lightSide: 'right',
    });
    expect(sampled.layers).toHaveLength(3);
    expect(context.calls.filter(([name]) => name === 'drawImage')).toHaveLength(3);
    expect(context.calls).toContainEqual(['scale', -2, 2]);
    const shadowFill = context.calls.findIndex(([name]) => name === 'fill');
    const firstLayer = context.calls.findIndex(([name]) => name === 'drawImage');
    expect(shadowFill).toBeGreaterThan(-1);
    expect(shadowFill).toBeLessThan(firstLayer);
  });
});
