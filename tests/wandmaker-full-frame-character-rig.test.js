import { describe, expect, it, vi } from 'vitest';
import {
  wandmakerCharacterDefinition,
  wandmakerCharacterModule,
  wandmakerCharacterReview,
} from '../src/game/characters/wandmaker/index.js';
import {
  wandmakerCharacterRuntime,
  wandmakerFullFrameCharacterManifest,
  wandmakerFullFrameCharacterRig,
} from '../src/game/characters/wandmaker/runtime.js';
import { assetManifest } from '../src/game/core/assetManifest.js';
import { sampleAlignedSpriteFrame } from '../src/game/render/AlignedSpriteRig.js';
import { resolveFullFrameCharacterAnimation } from '../src/game/render/FullFrameCharacterRig.js';

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
  it('is owned by the Wandmaker’s canonical package for world and portrait rendering', async () => {
    expect(wandmakerCharacterModule.definition).toBe(wandmakerCharacterDefinition);
    expect(await wandmakerCharacterModule.loadRuntime()).toBe(wandmakerCharacterRuntime);
    expect(wandmakerFullFrameCharacterManifest.id).toBe('character.wandmaker');
    expect(wandmakerFullFrameCharacterManifest.fullFrame.placement.portrait.y).toBe(12);

    const failed = { status: 'failed', error: new Error('test decode failure') };
    const draw = vi.spyOn(wandmakerFullFrameCharacterRig, 'draw').mockReturnValue(failed);
    const worldContext = {};

    expect(wandmakerCharacterRuntime.renderers.world({
      context: worldContext,
      time: 1.25,
      characterId: 'character.wandmaker',
      surface: 'world',
      appearance: 'default',
      x: 285,
      y: 610,
      facing: 'right',
      pose: 'idle',
    })).toBe(failed);
    expect(draw).toHaveBeenNthCalledWith(1, worldContext, {
      appearance: 'default',
      x: 285,
      y: 610,
      facing: 'right',
      pose: 'idle',
    }, 1.25, 'world');

    wandmakerCharacterRuntime.renderers.portrait({
      context: drawingContext(),
      time: 0.75,
      characterId: 'character.wandmaker',
      surface: 'portrait',
      appearance: 'default',
      pose: 'talk',
      facing: 'left',
      x: 80,
      y: 90,
    });
    expect(draw).toHaveBeenNthCalledWith(2, expect.anything(), expect.objectContaining({
      appearance: 'default',
      pose: 'speaking',
      facing: 'left',
    }), 0.75, 'portrait');

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
      action: 'present-wand', actionTime: 0, actionProgress: 0,
    })).toThrow(/does not support action present-wand/);
  });

  it('publishes its grounded review through the Wandmaker package descriptor', () => {
    expect(wandmakerCharacterReview.sceneIds).toEqual([
      'character-cast-review',
      'character-portraits-review',
      'wandmaker-sprite-review',
    ]);
    expect(wandmakerCharacterModule.reviews).toEqual([
      expect.objectContaining({ sceneId: 'wandmaker-sprite-review' }),
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
