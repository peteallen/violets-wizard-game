import { describe, expect, it, vi } from 'vitest';
import { assetManifest } from '../src/game/core/assetManifest.js';
import { sampleAlignedSpriteFrame } from '../src/game/render/AlignedSpriteRig.js';
import {
  CHARACTER_REVIEW_SCENES,
  CharacterRenderer,
} from '../src/game/render/CharacterRenderer.js';
import {
  productionFullFrameCharacterRigs,
  resolveFullFrameCharacterAnimation,
} from '../src/game/render/FullFrameCharacterRig.js';
import {
  madamMalkinFullFrameCharacterManifest,
  madamMalkinFullFrameCharacterRig,
} from '../src/game/render/MadamMalkinFullFrameCharacterRig.js';

function framePaths(clip) {
  return madamMalkinFullFrameCharacterManifest.clips[`default/${clip}`].frames.map((frame) => {
    const asset = madamMalkinFullFrameCharacterManifest.assets[frame.slots.figure];
    return asset.left.replace(/^.*assets\//, 'assets/');
  });
}

function drawingContext() {
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

describe('Madam Malkin production full-frame rig', () => {
  it('is authoritative for ordinary world and Madam Malkin portrait rendering', () => {
    expect(productionFullFrameCharacterRigs.get('tailor'))
      .toBe(madamMalkinFullFrameCharacterRig);
    expect(madamMalkinFullFrameCharacterManifest.fullFrame.kind).toBe('tailor');
    expect(madamMalkinFullFrameCharacterManifest.fullFrame.placement.portrait.y).toBe(12);

    const renderer = new CharacterRenderer();
    const failed = { status: 'failed', error: new Error('test decode failure') };
    const draw = vi.spyOn(madamMalkinFullFrameCharacterRig, 'draw').mockReturnValue(failed);
    const worldCharacter = {
      kind: 'tailor', x: 310, y: 610, facing: 'right', pose: 'idle',
    };

    expect(renderer.draw({}, worldCharacter, 1.25)).toBe(failed);
    expect(draw).toHaveBeenNthCalledWith(1, {}, worldCharacter, 1.25);

    renderer.drawPortrait(drawingContext(), {
      speaker: 'Madam Malkin', pose: 'talk', facing: 'left', x: 80, y: 90,
    }, 0.75);
    expect(draw).toHaveBeenNthCalledWith(2, expect.anything(), expect.objectContaining({
      kind: 'tailor',
      pose: 'speaking',
      facing: 'left',
      detail: 'portrait',
    }), 0.75);

    // Generated art remains authoritative while loading or failed; the old
    // code-drawn tailor must never appear underneath it as a hidden fallback.
    expect(draw).toHaveBeenCalledTimes(2);
    draw.mockRestore();
  });

  it('uses exactly the four aligned robe-shop and dialogue paintings', () => {
    expect(framePaths('idle')).toEqual([
      'assets/art/characters/madam-malkin/default/neutral.png',
    ]);
    expect(framePaths('neutral')).toEqual([
      'assets/art/characters/madam-malkin/default/neutral.png',
    ]);
    expect(framePaths('blink')).toEqual([
      'assets/art/characters/madam-malkin/default/blink.png',
    ]);
    expect(framePaths('talk-a')).toEqual([
      'assets/art/characters/madam-malkin/default/talk-a.png',
    ]);
    expect(framePaths('talk-b')).toEqual([
      'assets/art/characters/madam-malkin/default/talk-b.png',
    ]);
    expect(framePaths('speaking')).toEqual([
      'assets/art/characters/madam-malkin/default/talk-a.png',
      'assets/art/characters/madam-malkin/default/talk-b.png',
    ]);
    expect(madamMalkinFullFrameCharacterManifest.fullFrame.assetFiles).toEqual([
      'assets/art/characters/madam-malkin/default/neutral.png',
      'assets/art/characters/madam-malkin/default/blink.png',
      'assets/art/characters/madam-malkin/default/talk-a.png',
      'assets/art/characters/madam-malkin/default/talk-b.png',
    ]);
    expect(madamMalkinFullFrameCharacterManifest.layerOrder).toEqual(['figure']);
    for (const clip of Object.values(madamMalkinFullFrameCharacterManifest.clips)) {
      for (const frame of clip.frames) expect(Object.keys(frame.slots)).toEqual(['figure']);
    }
  });

  it('loops the two speaking mouths at four fps and holds talk A for reduced motion', () => {
    const speaking = resolveFullFrameCharacterAnimation(madamMalkinFullFrameCharacterManifest, {
      pose: 'talk',
    });
    expect(speaking).toMatchObject({
      semantic: 'speaking', pose: 'default/speaking', mirror: false,
    });
    expect(madamMalkinFullFrameCharacterManifest.clips['default/speaking'].fps).toBe(4);

    const reduced = resolveFullFrameCharacterAnimation(madamMalkinFullFrameCharacterManifest, {
      pose: 'speaking', reducedMotion: true,
    });
    expect(sampleAlignedSpriteFrame(madamMalkinFullFrameCharacterManifest, reduced).clip)
      .toBe('default/talk-a');
  });

  it('fails visibly for walking, profile, and speculative fitting actions', () => {
    expect(() => resolveFullFrameCharacterAnimation(madamMalkinFullFrameCharacterManifest, {
      pose: 'walking',
    })).toThrow(/does not support pose walking/);
    expect(() => resolveFullFrameCharacterAnimation(madamMalkinFullFrameCharacterManifest, {
      pose: 'profile-right',
    })).toThrow(/does not support pose profile-right/);
    expect(() => resolveFullFrameCharacterAnimation(madamMalkinFullFrameCharacterManifest, {
      actorAnimation: { action: 'measure-violet', localTime: 0, progress: 0 },
    })).toThrow(/does not support action measure-violet/);
  });

  it('uses a clean grounded review scene for every shipped source state', () => {
    const draw = vi.fn(() => ({ status: 'drawn' }));
    const renderer = new CharacterRenderer({
      fullFrameRigs: new Map([['tailor', { draw }]]),
    });

    expect(CHARACTER_REVIEW_SCENES).toContain('madam-malkin-sprite-review');
    expect(renderer.drawReviewScene(
      drawingContext(),
      'madam-malkin-sprite-review',
      1.25,
    )).toBe(true);

    expect(draw.mock.calls.map(([, character]) => ({
      pose: character.pose,
      facing: character.facing,
      shadow: character.shadow,
    }))).toEqual([
      { pose: 'neutral', facing: 'right', shadow: true },
      { pose: 'blink', facing: 'right', shadow: true },
      { pose: 'talk-a', facing: 'right', shadow: true },
      { pose: 'talk-b', facing: 'right', shadow: true },
    ]);
  });

  it('keeps every Madam Malkin frame in the preload and orphan-check manifest', () => {
    const manifestedPaths = new Set(Object.values(assetManifest).map(({ path }) => path));
    expect(madamMalkinFullFrameCharacterManifest.fullFrame.assetFiles).toHaveLength(4);
    for (const path of madamMalkinFullFrameCharacterManifest.fullFrame.assetFiles) {
      expect(manifestedPaths, path).toContain(path);
    }
  });
});
