// Hagrid assembled from AI-painted sprite parts (D48/D51). Parts are sliced
// from art/spikes/sp-f-hagrid (the best sheet to date; its full verdict trail
// lives in that folder's README) and load through Vite asset imports. The
// whole set swaps wholesale whenever a better sheet passes the art director —
// gameplay code never references individual parts.
import { SpriteRig } from './SpriteRig.js';
import headOpenUrl from '../../../art/spikes/sp-f-hagrid/parts/headOpen.png';
import headBlinkUrl from '../../../art/spikes/sp-f-hagrid/parts/headBlink.png';
import backHairUrl from '../../../art/spikes/sp-f-hagrid/parts/backHair.png';
import torsoUrl from '../../../art/spikes/sp-f-hagrid/parts/torso.png';
import armUrl from '../../../art/spikes/sp-f-hagrid/parts/arm.png';
import armBeckonUrl from '../../../art/spikes/sp-f-hagrid/parts/armBeckon.png';
import legLeftUrl from '../../../art/spikes/sp-f-hagrid/parts/legLeft.png';
import legRightUrl from '../../../art/spikes/sp-f-hagrid/parts/legRight.png';

export const hagridSpriteRig = new SpriteRig({
  partUrls: {
    headOpen: headOpenUrl,
    headBlink: headBlinkUrl,
    backHair: backHairUrl,
    torso: torsoUrl,
    arm: armUrl,
    armBeckon: armBeckonUrl,
    legLeft: legLeftUrl,
    legRight: legRightUrl,
  },
  sheetToWorld: 0.41,
  rig: {
    hipY: -320,
    hipSpread: 48,
    waistOverlap: 120,
    shoulderInset: 66,
    shoulderDrop: 70,
    neckOverlap: 95,
    backHairLift: 12,
  },
  shadow: { rx: 76, ry: 13 },
  motion: { armRest: 0.04, armSwing: 0.16, legSwing: 0.13 },
  // The painted beckon part's shoulder is at its bottom-left; the forearm
  // rises to the raised hand at top-right.
  beckonPivot: { x: 0.12, y: 0.85 },
});
