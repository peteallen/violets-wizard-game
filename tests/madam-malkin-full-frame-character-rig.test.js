import { describe, expect, it, vi } from 'vitest';
import {
  madamMalkinCharacterDefinition,
  madamMalkinCharacterModule,
  madamMalkinCharacterReview,
} from '../src/game/characters/madam-malkin/index.js';
import {
  madamMalkinCharacterRuntime,
  madamMalkinFullFrameCharacterManifest,
  madamMalkinFullFrameCharacterRig,
} from '../src/game/characters/madam-malkin/runtime.js';
import { assetManifest } from '../src/game/core/assetManifest.js';
import { sampleAlignedSpriteFrame } from '../src/game/render/AlignedSpriteRig.js';
import { resolveFullFrameCharacterAnimation } from '../src/game/render/FullFrameCharacterRig.js';

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
  it('is owned by Madam Malkin’s canonical package for world and portrait rendering', async () => {
    expect(madamMalkinCharacterModule.definition).toBe(madamMalkinCharacterDefinition);
    expect(await madamMalkinCharacterModule.loadRuntime()).toBe(madamMalkinCharacterRuntime);
    expect(madamMalkinFullFrameCharacterManifest.id).toBe('character.madam-malkin');
    expect(madamMalkinFullFrameCharacterManifest.fullFrame.placement.portrait.y).toBe(12);

    const failed = { status: 'failed', error: new Error('test decode failure') };
    const draw = vi.spyOn(madamMalkinFullFrameCharacterRig, 'draw').mockReturnValue(failed);
    const worldContext = {};

    expect(madamMalkinCharacterRuntime.renderers.world({
      context: worldContext,
      time: 1.25,
      characterId: 'character.madam-malkin',
      surface: 'world',
      appearance: 'default',
      x: 310,
      y: 610,
      facing: 'right',
      pose: 'idle',
    })).toBe(failed);
    expect(draw).toHaveBeenNthCalledWith(1, worldContext, {
      appearance: 'default',
      x: 310,
      y: 610,
      facing: 'right',
      pose: 'idle',
    }, 1.25, 'world');

    madamMalkinCharacterRuntime.renderers.portrait({
      context: drawingContext(),
      time: 0.75,
      characterId: 'character.madam-malkin',
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
      action: 'measure-violet', actionTime: 0, actionProgress: 0,
    })).toThrow(/does not support action measure-violet/);
  });

  it('publishes its grounded review through Madam Malkin’s package descriptor', () => {
    expect(madamMalkinCharacterReview.sceneIds).toEqual([
      'character-cast-review',
      'character-portraits-review',
      'madam-malkin-sprite-review',
    ]);
    expect(madamMalkinCharacterModule.reviews).toEqual([
      expect.objectContaining({ sceneId: 'madam-malkin-sprite-review' }),
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
