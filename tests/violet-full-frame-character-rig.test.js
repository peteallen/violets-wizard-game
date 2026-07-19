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

function scarfContext() {
  const fills = [];
  let fillStyle = null;
  return {
    fills,
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(() => fills.push(fillStyle)),
    stroke: vi.fn(),
    set fillStyle(value) { fillStyle = value; },
    get fillStyle() { return fillStyle; },
    set strokeStyle(_value) {},
    set lineWidth(_value) {},
    set lineJoin(_value) {},
  };
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

  it('keeps Violet child-sized in the world without shrinking dialogue close-ups', () => {
    const { placement } = violetFullFrameCharacterManifest.fullFrame;
    const alignedWorldHeight = violetFullFrameCharacterManifest.bounds.world.height;

    expect(placement.world.scale * alignedWorldHeight).toBe(185);
    expect(placement.portrait.scale * alignedWorldHeight).toBe(235);
    expect(placement.world.scale).toBeLessThan(placement.portrait.scale);
  });

  it('uses the approved casual expressions and mirrors one coherent profile walk', () => {
    for (const expression of ['neutral', 'blink', 'talk-a', 'talk-b', 'wonder', 'proud', 'curious']) {
      expect(sampledPath({ appearance: 'casual', pose: 'idle', expression })).toBe(
        `assets/art/characters/violet/casual/${expression}.webp`,
      );
    }
    expect(framePaths('casual', 'speaking')).toEqual([
      'assets/art/characters/violet/casual/talk-a.webp',
      'assets/art/characters/violet/casual/talk-b.webp',
    ]);
    expect(framePaths('casual', 'walking')).toEqual([
      'assets/art/characters/violet/casual/profile-right.webp',
      'assets/art/characters/violet/casual/walk-contact.webp',
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
    expect(wrongWand('wrong-wand-one', 0)).toContain('/wand-hold.webp');
    expect(wrongWand('wrong-wand-one', 0.99)).toContain('/wand-hold.webp');
    expect(wrongWand('wrong-wand-two', 0)).toContain('/tumble.webp');
    expect(wrongWand('wrong-wand-two', 0.99)).toContain('/tumble.webp');
    expect(sampledPath({
      appearance: 'casual', action: 'chosen-wand', actionProgress: 0.5,
    })).toContain('/cheer.webp');
  });

  it('provides the complete robed vocabulary from aligned robed frames', () => {
    for (const expression of ['neutral', 'blink', 'talk-a', 'talk-b', 'wonder', 'proud', 'curious']) {
      expect(sampledPath({ appearance: 'robes', pose: 'idle', expression })).toBe(
        `assets/art/characters/violet/robes/${expression}.webp`,
      );
    }
    expect(framePaths('robes', 'walking')).toEqual([
      'assets/art/characters/violet/robes/profile-right.webp',
      'assets/art/characters/violet/robes/walk-contact.webp',
      'assets/art/characters/violet/robes/walk-pass.webp',
    ]);
    expect(sampledPath({ appearance: 'robes', pose: 'talk' })).toContain('/talk-a.webp');
    expect(sampledPath({ appearance: 'robes', pose: 'wonder' })).toContain('/wonder.webp');
    expect(sampledPath({
      appearance: 'robes', action: 'admire-robes', actionProgress: 0.5,
    })).toContain('/robe-present.webp');
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

  it('adds a restrained scarlet-and-gold scarf only when Violet’s saved house is Gryffindor', () => {
    const sample = {
      root: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    };
    const result = {
      status: 'drawn',
      animation: {
        appearance: 'robes', semantic: 'idle', mirror: false, facing: 'right',
      },
      sample,
    };
    const unsorted = scarfContext();
    const gryffindor = scarfContext();
    const draw = vi.spyOn(violetFullFrameCharacterRig, 'draw').mockReturnValue(result);

    violetCharacterRuntime.renderers.world({
      context: unsorted,
      time: 0,
      characterId: 'character.violet',
      surface: 'world',
      appearance: 'robes',
      house: null,
      x: 340,
      y: 610,
    });
    expect(unsorted.fills).toEqual([]);

    violetCharacterRuntime.renderers.world({
      context: gryffindor,
      time: 0,
      characterId: 'character.violet',
      surface: 'world',
      appearance: 'robes',
      house: 'gryffindor',
      x: 340,
      y: 610,
    });
    expect(gryffindor.fills).toContain('#8f2638');
    expect(gryffindor.fills).toContain('#5b1c2b');
    expect(gryffindor.translate).toHaveBeenCalledWith(340, 610);
    expect(draw).toHaveBeenLastCalledWith(gryffindor, expect.objectContaining({
      house: 'gryffindor',
    }), 0, 'world');
    draw.mockRestore();
  });

  it('puts every production frame in the core preload and orphan-check manifest', () => {
    const manifestedPaths = new Set(Object.values(assetManifest).map(({ path }) => path));
    expect(violetFullFrameCharacterManifest.fullFrame.assetFiles.length).toBeGreaterThan(20);
    for (const path of violetFullFrameCharacterManifest.fullFrame.assetFiles) {
      expect(manifestedPaths, path).toContain(path);
    }
  });
});
