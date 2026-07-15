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
  wandmakerFullFrameCharacterManifest,
  wandmakerFullFrameCharacterRig,
} from '../src/game/render/WandmakerFullFrameCharacterRig.js';

function framePaths(clip) {
  return wandmakerFullFrameCharacterManifest.clips[`default/${clip}`].frames.map((frame) => {
    const asset = wandmakerFullFrameCharacterManifest.assets[frame.slots.figure];
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

describe('Wandmaker production full-frame rig', () => {
  it('is authoritative for ordinary world and Wandmaker portrait rendering', () => {
    expect(productionFullFrameCharacterRigs.get('wandmaker'))
      .toBe(wandmakerFullFrameCharacterRig);
    expect(wandmakerFullFrameCharacterManifest.fullFrame.kind).toBe('wandmaker');
    expect(wandmakerFullFrameCharacterManifest.fullFrame.placement.portrait.y).toBe(12);

    const renderer = new CharacterRenderer();
    const failed = { status: 'failed', error: new Error('test decode failure') };
    const draw = vi.spyOn(wandmakerFullFrameCharacterRig, 'draw').mockReturnValue(failed);
    const worldCharacter = {
      kind: 'wandmaker', x: 285, y: 610, facing: 'right', pose: 'idle',
    };

    expect(renderer.draw({}, worldCharacter, 1.25)).toBe(failed);
    expect(draw).toHaveBeenNthCalledWith(1, {}, worldCharacter, 1.25);

    renderer.drawPortrait(drawingContext(), {
      speaker: 'Ollivander', pose: 'talk', facing: 'left', x: 80, y: 90,
    }, 0.75);
    expect(draw).toHaveBeenNthCalledWith(2, expect.anything(), expect.objectContaining({
      kind: 'wandmaker',
      pose: 'speaking',
      facing: 'left',
      detail: 'portrait',
    }), 0.75);

    // Loading and decode failures remain visible; the retained vector puppet
    // must never be substituted beneath an authoritative generated identity.
    expect(draw).toHaveBeenCalledTimes(2);
    draw.mockRestore();
  });

  it('uses exactly the four aligned counter-and-dialogue paintings', () => {
    expect(framePaths('idle')).toEqual([
      'assets/art/characters/wandmaker/default/neutral.png',
    ]);
    expect(framePaths('neutral')).toEqual([
      'assets/art/characters/wandmaker/default/neutral.png',
    ]);
    expect(framePaths('blink')).toEqual([
      'assets/art/characters/wandmaker/default/blink.png',
    ]);
    expect(framePaths('talk-a')).toEqual([
      'assets/art/characters/wandmaker/default/talk-a.png',
    ]);
    expect(framePaths('talk-b')).toEqual([
      'assets/art/characters/wandmaker/default/talk-b.png',
    ]);
    expect(framePaths('speaking')).toEqual([
      'assets/art/characters/wandmaker/default/talk-a.png',
      'assets/art/characters/wandmaker/default/talk-b.png',
    ]);
    expect(wandmakerFullFrameCharacterManifest.fullFrame.assetFiles).toEqual([
      'assets/art/characters/wandmaker/default/neutral.png',
      'assets/art/characters/wandmaker/default/blink.png',
      'assets/art/characters/wandmaker/default/talk-a.png',
      'assets/art/characters/wandmaker/default/talk-b.png',
    ]);
    expect(wandmakerFullFrameCharacterManifest.layerOrder).toEqual(['figure']);
    for (const clip of Object.values(wandmakerFullFrameCharacterManifest.clips)) {
      for (const frame of clip.frames) expect(Object.keys(frame.slots)).toEqual(['figure']);
    }
  });

  it('loops the two speaking mouths at four fps and holds talk A for reduced motion', () => {
    const speaking = resolveFullFrameCharacterAnimation(wandmakerFullFrameCharacterManifest, {
      pose: 'talk',
    });
    expect(speaking).toMatchObject({
      semantic: 'speaking', pose: 'default/speaking', mirror: false,
    });
    expect(wandmakerFullFrameCharacterManifest.clips['default/speaking'].fps).toBe(4);

    const reduced = resolveFullFrameCharacterAnimation(wandmakerFullFrameCharacterManifest, {
      pose: 'speaking', reducedMotion: true,
    });
    expect(sampleAlignedSpriteFrame(wandmakerFullFrameCharacterManifest, reduced).clip)
      .toBe('default/talk-a');
  });

  it('fails visibly for walking, profile, and speculative action cues', () => {
    expect(() => resolveFullFrameCharacterAnimation(wandmakerFullFrameCharacterManifest, {
      pose: 'walking',
    })).toThrow(/does not support pose walking/);
    expect(() => resolveFullFrameCharacterAnimation(wandmakerFullFrameCharacterManifest, {
      pose: 'profile-right',
    })).toThrow(/does not support pose profile-right/);
    expect(() => resolveFullFrameCharacterAnimation(wandmakerFullFrameCharacterManifest, {
      actorAnimation: { action: 'present-wand', localTime: 0, progress: 0 },
    })).toThrow(/does not support action present-wand/);
  });

  it('uses a clean grounded review scene for every shipped source state', () => {
    const draw = vi.fn(() => ({ status: 'drawn' }));
    const renderer = new CharacterRenderer({
      fullFrameRigs: new Map([['wandmaker', { draw }]]),
    });

    expect(CHARACTER_REVIEW_SCENES).toContain('wandmaker-sprite-review');
    expect(renderer.drawReviewScene(
      drawingContext(),
      'wandmaker-sprite-review',
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

  it('keeps every Wandmaker frame in the preload and orphan-check manifest', () => {
    const manifestedPaths = new Set(Object.values(assetManifest).map(({ path }) => path));
    expect(wandmakerFullFrameCharacterManifest.fullFrame.assetFiles).toHaveLength(4);
    for (const path of wandmakerFullFrameCharacterManifest.fullFrame.assetFiles) {
      expect(manifestedPaths, path).toContain(path);
    }
  });
});
