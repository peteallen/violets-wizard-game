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
  rig: {
    hipY: -232,
    hipSpread: 30,
    waistOverlap: 46,
    shoulderInset: 40,
    shoulderDrop: 58,
    neckOverlap: 64,
    backHairLift: 14,
  },
  shadow: { rx: 38, ry: 9 },
  // Her sheet's arm is painted for the opposite side: without the flip the
  // elbows point inward and the hands curl palm-out in front of the thighs.
  armFlip: true,
});
