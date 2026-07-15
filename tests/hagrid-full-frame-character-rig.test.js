import { describe, expect, it, vi } from 'vitest';
import { assetManifest } from '../src/game/core/assetManifest.js';
import { sampleAlignedSpriteFrame } from '../src/game/render/AlignedSpriteRig.js';
import { CharacterRenderer } from '../src/game/render/CharacterRenderer.js';
import {
  FullFrameCharacterRig,
  productionFullFrameCharacterRigs,
  resolveFullFrameCharacterAnimation,
} from '../src/game/render/FullFrameCharacterRig.js';
import {
  hagridFullFrameCharacterDefinition,
  hagridFullFrameCharacterManifest,
  hagridFullFrameCharacterRig,
} from '../src/game/render/HagridFullFrameCharacterRig.js';

function framePaths(clip) {
  return hagridFullFrameCharacterManifest.clips[`default/${clip}`].frames.map((frame) => {
    const asset = hagridFullFrameCharacterManifest.assets[frame.slots.figure];
    return asset.left.replace(/^.*assets\//, 'assets/');
  });
}

function portraitContext() {
  const gradient = { addColorStop() {} };
  return new Proxy({ globalAlpha: 1 }, {
    get(target, property) {
      if (property in target) return target[property];
      if (property === 'createLinearGradient' || property === 'createRadialGradient') {
        return () => gradient;
      }
      return () => {};
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    },
  });
}

describe('Hagrid production full-frame rig', () => {
  it('is authoritative for ordinary world and Hagrid portrait rendering', () => {
    expect(productionFullFrameCharacterRigs.get('guide')).toBe(hagridFullFrameCharacterRig);
    expect(hagridFullFrameCharacterManifest.fullFrame.kind).toBe('guide');
    expect(hagridFullFrameCharacterManifest.fullFrame.placement.portrait.y).toBe(58);
    expect(hagridFullFrameCharacterManifest.bounds.shadow).toEqual({
      x: 110, y: 1100, width: 676, height: 64,
    });
    expect(hagridFullFrameCharacterRig.shadowOpacity).toBe(0.34);

    const renderer = new CharacterRenderer();
    const draw = vi.spyOn(hagridFullFrameCharacterRig, 'draw').mockReturnValue({ status: 'loading' });
    const worldCharacter = {
      kind: 'guide', x: 720, y: 610, facing: 'left', pose: 'walking',
    };

    expect(renderer.draw({}, worldCharacter, 1.25)).toEqual({ status: 'loading' });
    expect(draw).toHaveBeenNthCalledWith(1, {}, worldCharacter, 1.25);

    renderer.drawPortrait(portraitContext(), {
      speaker: 'Hagrid', pose: 'talk', facing: 'right', x: 80, y: 90,
    }, 0.75);
    expect(draw).toHaveBeenNthCalledWith(2, expect.anything(), expect.objectContaining({
      kind: 'guide',
      pose: 'speaking',
      facing: 'right',
      detail: 'portrait',
    }), 0.75);

    // A registered full-frame Hagrid owns loading and failure states. The
    // renderer must not substitute the old assembled-hand puppet underneath.
    expect(draw).toHaveBeenCalledTimes(2);
    draw.mockRestore();
  });

  it('uses exactly the six aligned production paintings', () => {
    expect(framePaths('idle')).toEqual([
      'assets/art/characters/hagrid/default/neutral.png',
    ]);
    expect(framePaths('neutral')).toEqual([
      'assets/art/characters/hagrid/default/neutral.png',
    ]);
    expect(framePaths('blink')).toEqual([
      'assets/art/characters/hagrid/default/blink.png',
    ]);
    expect(framePaths('speaking')).toEqual([
      'assets/art/characters/hagrid/default/talk-a.png',
      'assets/art/characters/hagrid/default/talk-b.png',
    ]);
    expect(framePaths('walking')).toEqual([
      'assets/art/characters/hagrid/default/profile-right.png',
      'assets/art/characters/hagrid/default/walk-contact.png',
    ]);
    expect(hagridFullFrameCharacterManifest.fullFrame.assetFiles).toEqual([
      'assets/art/characters/hagrid/default/neutral.png',
      'assets/art/characters/hagrid/default/blink.png',
      'assets/art/characters/hagrid/default/talk-a.png',
      'assets/art/characters/hagrid/default/talk-b.png',
      'assets/art/characters/hagrid/default/profile-right.png',
      'assets/art/characters/hagrid/default/walk-contact.png',
    ]);
  });

  it('mirrors one complete right-profile frame for leftward walking', () => {
    expect(hagridFullFrameCharacterManifest.layerOrder).toEqual(['figure']);
    for (const clip of Object.values(hagridFullFrameCharacterManifest.clips)) {
      for (const frame of clip.frames) expect(Object.keys(frame.slots)).toEqual(['figure']);
    }

    expect(resolveFullFrameCharacterAnimation(hagridFullFrameCharacterManifest, {
      pose: 'walk', facing: 'right',
    })).toMatchObject({
      semantic: 'walking', pose: 'default/walking', mirror: false,
    });
    expect(resolveFullFrameCharacterAnimation(hagridFullFrameCharacterManifest, {
      pose: 'walk', facing: 'left',
    })).toMatchObject({
      semantic: 'walking', pose: 'default/walking', mirror: true,
    });

    const rig = new FullFrameCharacterRig(
      hagridFullFrameCharacterDefinition,
      { shadowOpacity: 0.34 },
    );
    const alignedDraw = vi.fn(() => ({}));
    rig.alignedRig.ready = true;
    rig.alignedRig.loading = Promise.resolve();
    rig.alignedRig.draw = alignedDraw;
    expect(rig.draw({}, {
      pose: 'walking', facing: 'left', x: 330, y: 610,
    }, 0).status).toBe('drawn');
    expect(alignedDraw).toHaveBeenCalledWith({}, expect.objectContaining({
      pose: 'default/walking',
      facing: 'left',
      mirror: true,
      shadowOpacity: 0.34,
    }));
  });

  it('holds readable source poses when reduced motion is requested', () => {
    const speaking = resolveFullFrameCharacterAnimation(hagridFullFrameCharacterManifest, {
      pose: 'talk', reducedMotion: true,
    });
    const walking = resolveFullFrameCharacterAnimation(hagridFullFrameCharacterManifest, {
      pose: 'walking', reducedMotion: true,
    });

    expect(sampleAlignedSpriteFrame(hagridFullFrameCharacterManifest, speaking).clip)
      .toBe('default/talk-a');
    expect(sampleAlignedSpriteFrame(hagridFullFrameCharacterManifest, walking).clip)
      .toBe('default/profile-right');
  });

  it('uses the clean Hagrid review scene for production poses rather than part assembly', () => {
    const draw = vi.fn(() => ({ status: 'drawn' }));
    const renderer = new CharacterRenderer({
      fullFrameRigs: new Map([['guide', { draw }]]),
    });

    renderer.drawHagridSpriteReview(portraitContext(), 1.25);

    expect(draw.mock.calls.map(([, character]) => ({
      pose: character.pose,
      facing: character.facing,
    }))).toEqual([
      { pose: 'idle', facing: 'right' },
      { pose: 'blink', facing: 'right' },
      { pose: 'speaking', facing: 'right' },
      { pose: 'walking', facing: 'right' },
      { pose: 'walking', facing: 'left' },
    ]);
  });

  it('keeps every Hagrid frame in the preload and orphan-check manifest', () => {
    const manifestedPaths = new Set(Object.values(assetManifest).map(({ path }) => path));
    expect(hagridFullFrameCharacterManifest.fullFrame.assetFiles).toHaveLength(6);
    for (const path of hagridFullFrameCharacterManifest.fullFrame.assetFiles) {
      expect(manifestedPaths, path).toContain(path);
    }
  });
});
