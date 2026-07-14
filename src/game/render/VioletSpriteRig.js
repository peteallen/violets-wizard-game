// SP-E spike: Violet assembled from AI-painted sprite parts on the existing
// puppet animation grammar (idle bob, sway, hip-pivot walk, blink via head
// swap). Parts are generated + sliced under art/spikes/sp-e-violet and load
// through Vite asset imports — harness/review use only while the spike is
// evaluated; nothing in gameplay depends on this module.
import headOpenUrl from '../../../art/spikes/sp-e-violet/parts/headOpen.png';
import headBlinkUrl from '../../../art/spikes/sp-e-violet/parts/headBlink.png';
import backHairUrl from '../../../art/spikes/sp-e-violet/parts/backHair.png';
import torsoUrl from '../../../art/spikes/sp-e-violet/parts/torso.png';
import armUrl from '../../../art/spikes/sp-e-violet/parts/arm.png';
import legLeftUrl from '../../../art/spikes/sp-e-violet/parts/legLeft.png';
import legRightUrl from '../../../art/spikes/sp-e-violet/parts/legRight.png';

const PART_URLS = Object.freeze({
  headOpen: headOpenUrl,
  headBlink: headBlinkUrl,
  backHair: backHairUrl,
  torso: torsoUrl,
  arm: armUrl,
  legLeft: legLeftUrl,
  legRight: legRightUrl,
});

// One uniform scale maps part-sheet pixels to world units so the assembled
// figure matches the code-drawn casual Violet's ~180-unit height.
const SHEET_TO_WORLD = 0.26;

// Assembly in part-sheet pixel space. Origin is the ground point between her
// feet; y is negative upward, matching the puppet convention.
const RIG = Object.freeze({
  hipY: -290,
  hipSpread: 30,
  waistOverlap: 46,
  shoulderInset: 40,
  shoulderDrop: 58,
  neckOverlap: 64,
  backHairLift: 14,
});

export class VioletSpriteRig {
  constructor() {
    this.images = null;
    this.ready = false;
    this.failed = false;
  }

  ensureLoading() {
    if (this.images || this.failed) return;
    if (typeof Image === 'undefined') { this.failed = true; return; }
    this.images = {};
    let pending = Object.keys(PART_URLS).length;
    for (const [name, url] of Object.entries(PART_URLS)) {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => { if ((pending -= 1) === 0) this.ready = true; };
      image.onerror = () => { this.failed = true; };
      image.src = url;
      this.images[name] = image;
    }
  }

  // Returns true when it drew; false lets callers fall back to the code-drawn puppet.
  draw(context, { x = 0, y = 0, scale = 1, facing = 'right', pose = 'idle', time = 0, phase = 0 } = {}) {
    this.ensureLoading();
    if (!this.ready || this.failed) return false;

    const img = this.images;
    const direction = facing === 'left' ? -1 : 1;
    const walking = pose === 'walking';
    const walkCycle = Math.sin(time * 7.6 + phase);
    const bob = walking ? -Math.abs(walkCycle) * 2.3 : Math.sin(time * 1.65 + phase) * 1.5;
    const sway = walking ? walkCycle * 0.009 : Math.sin(time * 1.15 + phase) * 0.012;
    const blinkWindow = (time + phase) % 4.7;
    const blinking = blinkWindow > 4.52;
    const s = SHEET_TO_WORLD;

    context.save();
    context.translate(x, y);
    context.scale(direction * scale, scale);

    // Grounding shadow (screen-space stable: drawn before body sway/bob).
    context.fillStyle = 'rgba(27, 18, 24, 0.28)';
    context.beginPath();
    context.ellipse(2, 8, 52, 11, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = 'rgba(45, 27, 22, 0.22)';
    context.beginPath();
    context.ellipse(-1, 6.5, 37, 7, 0, 0, Math.PI * 2);
    context.fill();

    context.translate(0, bob);
    context.rotate(sway);

    const drawPart = (image, cx, topY, { pivotX = 0.5, pivotY = 0, rotate = 0, mirror = false, partScale = 1 } = {}) => {
      const w = image.naturalWidth * s * partScale;
      const h = image.naturalHeight * s * partScale;
      context.save();
      context.translate(cx, topY);
      if (rotate) context.rotate(rotate);
      if (mirror) context.scale(-1, 1);
      context.drawImage(image, -w * pivotX, -h * pivotY, w, h);
      context.restore();
    };

    const legSwing = walking ? walkCycle * 0.18 : 0;
    const hipY = RIG.hipY * s;
    const torsoH = img.torso.naturalHeight * s;
    const torsoTop = hipY - torsoH + RIG.waistOverlap * s;
    const headH = img.headOpen.naturalHeight * s;
    const headTop = torsoTop - headH + RIG.neckOverlap * s;

    // Back hair sits behind everything, hugging the head.
    drawPart(img.backHair, 2 * s, headTop - RIG.backHairLift * s);

    // Legs pivot at the hips.
    drawPart(img.legLeft, -RIG.hipSpread * s, hipY, { rotate: legSwing });
    drawPart(img.legRight, RIG.hipSpread * s, hipY, { rotate: -legSwing });

    // Torso over the leg tops.
    drawPart(img.torso, 0, torsoTop);

    // Arms pivot at the shoulders; the far arm is the same part mirrored.
    const armSwing = walking ? -walkCycle * 0.22 : Math.sin(time * 1.4 + phase) * 0.045;
    const armRest = 0.05; // tuck the mirrored bent arm toward the body
    const shoulderY = torsoTop + RIG.shoulderDrop * s;
    const torsoW = img.torso.naturalWidth * s;
    const shoulderX = torsoW / 2 - RIG.shoulderInset * s;
    drawPart(img.arm, -shoulderX, shoulderY, { pivotX: 0.62, rotate: -armRest + armSwing, mirror: true });
    drawPart(img.arm, shoulderX, shoulderY, { pivotX: 0.62, rotate: armRest - armSwing * 0.8 });

    // Head last; blink swaps the whole face part.
    const head = blinking ? img.headBlink : img.headOpen;
    drawPart(head, 0, headTop, { partScale: blinking ? img.headOpen.naturalWidth / img.headBlink.naturalWidth : 1 });

    context.restore();
    return true;
  }
}

export const violetSpriteRig = new VioletSpriteRig();
