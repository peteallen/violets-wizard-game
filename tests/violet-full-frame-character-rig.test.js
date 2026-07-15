import { describe, expect, it, vi } from 'vitest';
import {
  violetCharacterDefinition,
  violetCharacterModule,
} from '../src/game/characters/violet/index.js';
import {
  violetCharacterRuntime,
  violetFullFrameCharacterManifest,
  violetFullFrameCharacterRig,
} from '../src/game/characters/violet/runtime.js';
import { assetManifest } from '../src/game/core/assetManifest.js';
import { sampleAlignedSpriteFrame } from '../src/game/render/AlignedSpriteRig.js';
import {
  FullFrameCharacterRig,
  resolveFullFrameCharacterAnimation,
} from '../src/game/render/FullFrameCharacterRig.js';
import { violetFullFrameCharacterDefinition } from '../src/game/characters/violet/definition.js';

function framePaths(appearance, clip) {
  return violetFullFrameCharacterManifest.clips[`${appearance}/${clip}`].frames.map((frame) => {
    const asset = violetFullFrameCharacterManifest.assets[frame.slots.figure];
    return asset.left.replace(/^.*assets\//, 'assets/');
  });
}

function sampledPath(character, time = 0) {
  const animation = resolveFullFrameCharacterAnimation(
    violetFullFrameCharacterManifest,
    character,
    time,
  );
  const sample = sampleAlignedSpriteFrame(violetFullFrameCharacterManifest, animation);
  return sample.layers[0].url.replace(/^.*assets\//, 'assets/');
}

describe('Violet production full-frame rig', () => {
  it('is owned by Violet’s canonical package and world runtime', async () => {
    expect(violetCharacterModule.definition).toBe(violetCharacterDefinition);
    expect(await violetCharacterModule.loadRuntime()).toBe(violetCharacterRuntime);
    expect(violetFullFrameCharacterManifest.id).toBe('character.violet');

    const draw = vi.spyOn(violetFullFrameCharacterRig, 'draw').mockReturnValue({ status: 'drawn' });
    const context = {};
    expect(violetCharacterRuntime.renderers.world({
      context,
      time: 1.25,
      characterId: 'character.violet',
      surface: 'world',
      appearance: 'casual',
      pose: 'walking',
      x: 340,
      y: 610,
    })).toEqual({ status: 'drawn' });
    expect(draw).toHaveBeenCalledWith(context, {
      appearance: 'casual',
      pose: 'walking',
      x: 340,
      y: 610,
    }, 1.25, 'world');
    draw.mockRestore();
  });

  it('uses the approved casual expressions and mirrors one coherent profile walk', () => {
    for (const expression of ['neutral', 'blink', 'talk-a', 'talk-b', 'wonder', 'proud', 'curious']) {
      expect(sampledPath({ appearance: 'casual', pose: 'idle', expression })).toBe(
        `assets/art/characters/violet/casual/${expression}.png`,
      );
    }
    expect(framePaths('casual', 'speaking')).toEqual([
      'assets/art/characters/violet/casual/talk-a.png',
      'assets/art/characters/violet/casual/talk-b.png',
    ]);
    expect(framePaths('casual', 'walking')).toEqual([
      'assets/art/characters/violet/casual/profile-right.png',
      'assets/art/characters/violet/casual/walk-contact.png',
    ]);
    expect(resolveFullFrameCharacterAnimation(violetFullFrameCharacterManifest, {
      appearance: 'casual', pose: 'walking', facing: 'right',
    })).toMatchObject({ pose: 'casual/walking', mirror: false });
    expect(resolveFullFrameCharacterAnimation(violetFullFrameCharacterManifest, {
      appearance: 'casual', pose: 'walking', facing: 'left',
    })).toMatchObject({ pose: 'casual/walking', mirror: true });
    expect(resolveFullFrameCharacterAnimation(violetFullFrameCharacterManifest, {
      appearance: 'casual', pose: 'walking', wand: true, facing: 'right',
    })).toMatchObject({ semantic: 'walking', pose: 'casual/walking' });
    expect(sampleAlignedSpriteFrame(violetFullFrameCharacterManifest, {
      appearance: 'casual', pose: 'casual/walking', reducedMotion: true,
    }).clip).toBe('casual/profile-right');
  });

  it('keeps each wand set piece on one readable, stable prop pose', () => {
    const wrongWand = (action, progress) => sampledPath({
      appearance: 'casual',
      action,
      actionTime: progress * 2.6,
      actionProgress: progress,
    });
    expect(wrongWand('wrong-wand-one', 0)).toContain('/wand-hold.png');
    expect(wrongWand('wrong-wand-one', 0.99)).toContain('/wand-hold.png');
    expect(wrongWand('wrong-wand-two', 0)).toContain('/tumble.png');
    expect(wrongWand('wrong-wand-two', 0.99)).toContain('/tumble.png');
    expect(sampledPath({
      appearance: 'casual', action: 'chosen-wand', actionProgress: 0.5,
    })).toContain('/cheer.png');
  });

  it('provides the complete robed vocabulary from aligned robed frames', () => {
    for (const expression of ['neutral', 'blink', 'talk-a', 'talk-b', 'wonder', 'proud', 'curious']) {
      expect(sampledPath({ appearance: 'robes', pose: 'idle', expression })).toBe(
        `assets/art/characters/violet/robes/${expression}.png`,
      );
    }
    expect(framePaths('robes', 'walking')).toEqual([
      'assets/art/characters/violet/robes/profile-right.png',
      'assets/art/characters/violet/robes/walk-contact.png',
      'assets/art/characters/violet/robes/walk-pass.png',
    ]);
    expect(sampledPath({ appearance: 'robes', pose: 'talk' })).toContain('/talk-a.png');
    expect(sampledPath({ appearance: 'robes', pose: 'wonder' })).toContain('/wonder.png');
    expect(sampledPath({
      appearance: 'robes', action: 'admire-robes', actionProgress: 0.5,
    })).toContain('/robe-present.png');
  });

  it('passes the saved robe color through the aligned-frame draw hook', () => {
    const rig = new FullFrameCharacterRig(violetFullFrameCharacterDefinition);
    const alignedDraw = vi.fn(() => ({}));
    rig.alignedRig.ready = true;
    rig.alignedRig.loading = Promise.resolve();
    rig.alignedRig.draw = alignedDraw;

    expect(rig.draw({}, {
      appearance: 'robes', pose: 'wonder', robeTrim: '#4e83b7', x: 315, y: 528,
    }, 0).status).toBe('drawn');
    expect(alignedDraw).toHaveBeenCalledWith({}, expect.objectContaining({
      appearance: 'robes',
      robeTrim: '#4e83b7',
    }));
  });

  it('puts every production frame in the core preload and orphan-check manifest', () => {
    const manifestedPaths = new Set(Object.values(assetManifest).map(({ path }) => path));
    expect(violetFullFrameCharacterManifest.fullFrame.assetFiles.length).toBeGreaterThan(20);
    for (const path of violetFullFrameCharacterManifest.fullFrame.assetFiles) {
      expect(manifestedPaths, path).toContain(path);
    }
  });
});
