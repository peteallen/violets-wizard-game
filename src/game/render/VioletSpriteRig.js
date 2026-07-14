// SP-E spike: Violet assembled from AI-painted sprite parts (D48). Parts are
// generated + sliced under art/spikes/sp-e-violet and load through Vite asset
// imports — harness/review use only while the rollout is evaluated; nothing in
// gameplay depends on this module. The rig mechanics live in SpriteRig.js.
import { SpriteRig } from './SpriteRig.js';
import headOpenUrl from '../../../art/spikes/sp-e-violet/parts/headOpen.png';
import headBlinkUrl from '../../../art/spikes/sp-e-violet/parts/headBlink.png';
import backHairUrl from '../../../art/spikes/sp-e-violet/parts/backHair.png';
import torsoUrl from '../../../art/spikes/sp-e-violet/parts/torso.png';
import armUrl from '../../../art/spikes/sp-e-violet/parts/arm.png';
import legLeftUrl from '../../../art/spikes/sp-e-violet/parts/legLeft.png';
import legRightUrl from '../../../art/spikes/sp-e-violet/parts/legRight.png';

export const violetSpriteRig = new SpriteRig({
  partUrls: {
    headOpen: headOpenUrl,
    headBlink: headBlinkUrl,
    backHair: backHairUrl,
    torso: torsoUrl,
    arm: armUrl,
    legLeft: legLeftUrl,
    legRight: legRightUrl,
  },
  sheetToWorld: 0.26,
  // Numbers tuned for the v4 sheet's part dimensions (heads ~311×348,
  // torso 221×254, legs 111×324, arm 68×294).
  rig: {
    hipY: -248,
    hipSpread: 44,
    waistOverlap: 46,
    shoulderInset: 28,
    shoulderDrop: 55,
    neckOverlap: 44,
    backHairLift: 14,
  },
  shadow: { rx: 38, ry: 9 },
  motion: { legSwing: 0.13 },
  armFlip: false,
});
