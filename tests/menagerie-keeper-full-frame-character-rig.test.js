import { describe, expect, it, vi } from 'vitest';
import {
  menagerieKeeperCharacterDefinition,
  menagerieKeeperCharacterModule,
  menagerieKeeperCharacterReview,
} from '../src/game/characters/menagerie-keeper/index.js';
import {
  menagerieKeeperCharacterRuntime,
  menagerieKeeperFullFrameCharacterManifest,
  menagerieKeeperFullFrameCharacterRig,
} from '../src/game/characters/menagerie-keeper/runtime.js';
import { assetManifest } from '../src/game/core/assetManifest.js';
import { sampleAlignedSpriteFrame } from '../src/game/render/AlignedSpriteRig.js';
import { resolveFullFrameCharacterAnimation } from '../src/game/render/FullFrameCharacterRig.js';

function framePaths(clip) {
  return menagerieKeeperFullFrameCharacterManifest.clips[`default/${clip}`].frames.map((frame) => {
    const asset = menagerieKeeperFullFrameCharacterManifest.assets[frame.slots.figure];
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

describe('Menagerie Keeper production full-frame rig', () => {
  it('is owned by the keeper’s canonical package for world and portrait rendering', async () => {
    expect(menagerieKeeperCharacterModule.definition).toBe(menagerieKeeperCharacterDefinition);
    expect(await menagerieKeeperCharacterModule.loadRuntime()).toBe(menagerieKeeperCharacterRuntime);
    expect(menagerieKeeperFullFrameCharacterManifest.id).toBe('character.menagerie-keeper');
    expect(menagerieKeeperFullFrameCharacterManifest.fullFrame.placement.portrait.y).toBe(12);

    const failed = { status: 'failed', error: new Error('test decode failure') };
    const draw = vi.spyOn(menagerieKeeperFullFrameCharacterRig, 'draw').mockReturnValue(failed);
    const worldContext = {};

    expect(menagerieKeeperCharacterRuntime.renderers.world({
      context: worldContext,
      time: 1.25,
      characterId: 'character.menagerie-keeper',
      surface: 'world',
      appearance: 'default',
      x: 270,
      y: 610,
      facing: 'right',
      pose: 'idle',
    })).toBe(failed);
    expect(draw).toHaveBeenNthCalledWith(1, worldContext, {
      appearance: 'default',
      x: 270,
      y: 610,
      facing: 'right',
      pose: 'idle',
    }, 1.25, 'world');

    menagerieKeeperCharacterRuntime.renderers.portrait({
      context: drawingContext(),
      time: 0.75,
      characterId: 'character.menagerie-keeper',
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
    // code-drawn keeper must never appear underneath it as a hidden fallback.
    expect(draw).toHaveBeenCalledTimes(2);
    draw.mockRestore();
  });

  it('uses exactly the four aligned animal-shop and dialogue paintings', () => {
    expect(framePaths('idle')).toEqual([
      'assets/art/characters/menagerie-keeper/default/neutral.png',
    ]);
    expect(framePaths('neutral')).toEqual([
      'assets/art/characters/menagerie-keeper/default/neutral.png',
    ]);
    expect(framePaths('blink')).toEqual([
      'assets/art/characters/menagerie-keeper/default/blink.png',
    ]);
    expect(framePaths('talk-a')).toEqual([
      'assets/art/characters/menagerie-keeper/default/talk-a.png',
    ]);
    expect(framePaths('talk-b')).toEqual([
      'assets/art/characters/menagerie-keeper/default/talk-b.png',
    ]);
    expect(framePaths('speaking')).toEqual([
      'assets/art/characters/menagerie-keeper/default/talk-a.png',
      'assets/art/characters/menagerie-keeper/default/talk-b.png',
    ]);
    expect(menagerieKeeperFullFrameCharacterManifest.fullFrame.assetFiles).toEqual([
      'assets/art/characters/menagerie-keeper/default/neutral.png',
      'assets/art/characters/menagerie-keeper/default/blink.png',
      'assets/art/characters/menagerie-keeper/default/talk-a.png',
      'assets/art/characters/menagerie-keeper/default/talk-b.png',
    ]);
    expect(menagerieKeeperFullFrameCharacterManifest.layerOrder).toEqual(['figure']);
  });

  it('loops the two speaking mouths at four fps and holds talk A for reduced motion', () => {
    const speaking = resolveFullFrameCharacterAnimation(menagerieKeeperFullFrameCharacterManifest, {
      pose: 'talk',
    });
    expect(speaking).toMatchObject({
      semantic: 'speaking', pose: 'default/speaking', mirror: false,
    });
    expect(menagerieKeeperFullFrameCharacterManifest.clips['default/speaking'].fps).toBe(4);

    const reduced = resolveFullFrameCharacterAnimation(menagerieKeeperFullFrameCharacterManifest, {
      pose: 'speaking', reducedMotion: true,
    });
    expect(sampleAlignedSpriteFrame(menagerieKeeperFullFrameCharacterManifest, reduced).clip)
      .toBe('default/talk-a');
  });

  it('fails visibly for unpainted walking, proud, and speculative pet actions', () => {
    expect(() => resolveFullFrameCharacterAnimation(menagerieKeeperFullFrameCharacterManifest, {
      pose: 'walking',
    })).toThrow(/does not support pose walking/);
    expect(() => resolveFullFrameCharacterAnimation(menagerieKeeperFullFrameCharacterManifest, {
      pose: 'proud',
    })).toThrow(/does not support pose proud/);
    expect(() => resolveFullFrameCharacterAnimation(menagerieKeeperFullFrameCharacterManifest, {
      action: 'present-pets', actionTime: 0, actionProgress: 0,
    })).toThrow(/does not support action present-pets/);
  });

  it('publishes its grounded review through the keeper’s package descriptor', () => {
    expect(menagerieKeeperCharacterReview.sceneIds).toEqual([
      'character-cast-review',
      'character-portraits-review',
      'menagerie-keeper-sprite-review',
    ]);
    expect(menagerieKeeperCharacterModule.reviews).toEqual([
      expect.objectContaining({ sceneId: 'menagerie-keeper-sprite-review' }),
    ]);
  });

  it('keeps every keeper frame in the preload and orphan-check manifest', () => {
    const manifestedPaths = new Set(Object.values(assetManifest).map(({ path }) => path));
    expect(menagerieKeeperFullFrameCharacterManifest.fullFrame.assetFiles).toHaveLength(4);
    for (const path of menagerieKeeperFullFrameCharacterManifest.fullFrame.assetFiles) {
      expect(manifestedPaths, path).toContain(path);
    }
  });
});
