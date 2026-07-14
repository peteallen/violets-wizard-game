import { describe, expect, it } from 'vitest';
import {
  AlignedSpriteRig,
  sampleAlignedSpriteFrame,
  validateAlignedSpriteManifest,
} from '../src/game/render/AlignedSpriteRig.js';
import { violetAlignedSpriteManifest } from '../src/game/render/VioletAlignedSpriteRig.js';

describe('approved aligned Violet rig', () => {
  it('declares the accepted expression set and complete Chapter One human sockets', () => {
    expect(validateAlignedSpriteManifest(violetAlignedSpriteManifest)).toBe(violetAlignedSpriteManifest);
    expect(Object.keys(violetAlignedSpriteManifest.expressions)).toEqual([
      'neutral', 'blink', 'talk-a', 'talk-b', 'wonder', 'proud', 'curious',
    ]);
    expect(violetAlignedSpriteManifest.requiredAnchors).toEqual(expect.arrayContaining([
      'neck',
      'shoulderLeft', 'shoulderRight',
      'elbowLeft', 'elbowRight',
      'wristLeft', 'wristRight',
      'handLeft', 'handRight',
      'hipLeft', 'hipRight',
      'kneeLeft', 'kneeRight',
      'ankleLeft', 'ankleRight',
      'footLeft', 'footRight',
      'wandGrip', 'wandTip',
    ]));
  });

  it('selects each approved full-canvas frame explicitly and rejects silent substitution', () => {
    const proud = sampleAlignedSpriteFrame(violetAlignedSpriteManifest, {
      appearance: 'casual', pose: 'idle', expression: 'proud',
    });
    expect(proud.expression).toBe('proud');
    expect(proud.layers).toEqual([expect.objectContaining({
      slot: 'figure',
      asset: 'proud',
      url: expect.stringMatching(/assets\/art\/characters\/violet\/casual\/proud\.png$/),
    })]);
    expect(() => sampleAlignedSpriteFrame(violetAlignedSpriteManifest, {
      appearance: 'casual', pose: 'idle', expression: 'almost-proud',
    })).toThrow('does not support expression almost-proud');
    expect(() => sampleAlignedSpriteFrame(violetAlignedSpriteManifest, {
      appearance: 'robes', pose: 'idle', expression: 'neutral',
    })).toThrow('does not support appearance robes');
  });

  it('preloads every unique approved frame at the canonical aligned dimensions', async () => {
    const created = [];
    const rig = new AlignedSpriteRig(violetAlignedSpriteManifest, {
      imageFactory: (url) => {
        const image = {
          url,
          onload: null,
          onerror: null,
          naturalWidth: 896,
          naturalHeight: 1200,
        };
        created.push(image);
        return image;
      },
    });
    const loading = rig.preload();
    expect(created).toHaveLength(7);
    created.forEach((image) => image.onload());
    await loading;
    expect(rig.ready).toBe(true);
  });
});
