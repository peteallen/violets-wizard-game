import { resolveAsset } from '../core/assetManifest.js';
import { AlignedSpriteRig } from './AlignedSpriteRig.js';

function pairedAsset(key) {
  const url = resolveAsset(`characters/violet/casual/${key}`);
  if (!url) throw new Error(`Missing production asset for approved Violet ${key}.`);
  // Directional lighting variants are deliberately not invented here. The
  // approved source supplies both slots until reviewed left/right edits exist.
  return Object.freeze({ left: url, right: url });
}

export const violetAlignedSpriteManifest = Object.freeze({
  id: 'violet.casual.approved',
  canvas: Object.freeze({
    width: 896,
    height: 1200,
    ground: Object.freeze({ x: 448, y: 1133 }),
  }),
  layerOrder: Object.freeze(['figure']),
  assets: Object.freeze({
    neutral: pairedAsset('neutral'),
    blink: pairedAsset('blink'),
    'talk-a': pairedAsset('talk-a'),
    'talk-b': pairedAsset('talk-b'),
    wonder: pairedAsset('wonder'),
    proud: pairedAsset('proud'),
    curious: pairedAsset('curious'),
  }),
  appearances: Object.freeze({
    casual: Object.freeze({ slots: Object.freeze({ figure: 'neutral' }) }),
  }),
  expressions: Object.freeze({
    neutral: Object.freeze({ slots: Object.freeze({}) }),
    blink: Object.freeze({ slots: Object.freeze({ figure: 'blink' }) }),
    'talk-a': Object.freeze({ slots: Object.freeze({ figure: 'talk-a' }) }),
    'talk-b': Object.freeze({ slots: Object.freeze({ figure: 'talk-b' }) }),
    wonder: Object.freeze({ slots: Object.freeze({ figure: 'wonder' }) }),
    proud: Object.freeze({ slots: Object.freeze({ figure: 'proud' }) }),
    curious: Object.freeze({ slots: Object.freeze({ figure: 'curious' }) }),
  }),
  clips: Object.freeze({
    idle: Object.freeze({
      fps: 1,
      loop: true,
      frames: Object.freeze([Object.freeze({})]),
    }),
  }),
  aliases: Object.freeze({}),
  requiredAnchors: Object.freeze([
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
  ]),
  anchors: Object.freeze({
    neck: Object.freeze({ x: 448, y: 414 }),
    shoulderLeft: Object.freeze({ x: 336, y: 438 }),
    shoulderRight: Object.freeze({ x: 560, y: 438 }),
    elbowLeft: Object.freeze({ x: 309, y: 604 }),
    elbowRight: Object.freeze({ x: 587, y: 604 }),
    wristLeft: Object.freeze({ x: 299, y: 733 }),
    wristRight: Object.freeze({ x: 597, y: 733 }),
    handLeft: Object.freeze({ x: 303, y: 765 }),
    handRight: Object.freeze({ x: 593, y: 765 }),
    hipLeft: Object.freeze({ x: 402, y: 724 }),
    hipRight: Object.freeze({ x: 494, y: 724 }),
    kneeLeft: Object.freeze({ x: 401, y: 894 }),
    kneeRight: Object.freeze({ x: 497, y: 894 }),
    ankleLeft: Object.freeze({ x: 396, y: 1033 }),
    ankleRight: Object.freeze({ x: 500, y: 1033 }),
    footLeft: Object.freeze({ x: 369, y: 1128 }),
    footRight: Object.freeze({ x: 548, y: 1128 }),
    wandGrip: Object.freeze({ x: 593, y: 765 }),
    wandTip: Object.freeze({ x: 686, y: 616 }),
  }),
  bounds: Object.freeze({
    world: Object.freeze({ x: 239, y: 85, width: 410, height: 1048 }),
    portrait: Object.freeze({ x: 285, y: 90, width: 326, height: 330 }),
    shadow: Object.freeze({ x: 299, y: 1114, width: 310, height: 28 }),
    headSafe: Object.freeze({ x: 350, y: 195, width: 195, height: 180 }),
  }),
});

export const violetAlignedSpriteRig = new AlignedSpriteRig(violetAlignedSpriteManifest);
