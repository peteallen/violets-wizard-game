// Painted sprite-part character rig (D48): AI-painted parts assembled on the
// shared puppet animation grammar (idle bob, sway, hip-pivot walk, blink via
// head swap, optional beckon arm variant). One class, one config per character.
export class SpriteRig {
  /**
   * @param {Object} config
   * @param {Record<string, string>} config.partUrls — headOpen, headBlink,
   *   backHair, torso, arm, legLeft, legRight required; armBeckon optional.
   * @param {number} config.sheetToWorld — sheet pixels → world units.
   * @param {Object} config.rig — hipY, hipSpread, waistOverlap, shoulderInset,
   *   shoulderDrop, neckOverlap, backHairLift (sheet pixels).
   * @param {Object} config.shadow — { rx, ry } ground-shadow radii (world units).
   * @param {Object} [config.motion] — overrides: armRest, armSwing, legSwing.
   */
  constructor({ partUrls, sheetToWorld, rig, shadow, motion = {} }) {
    this.partUrls = partUrls;
    this.sheetToWorld = sheetToWorld;
    this.rig = rig;
    this.shadow = shadow;
    this.motion = { armRest: 0.05, armSwing: 0.22, legSwing: 0.18, ...motion };
    this.images = null;
    this.ready = false;
    this.failed = false;
  }

  ensureLoading() {
    if (this.images || this.failed) return;
    if (typeof Image === 'undefined') { this.failed = true; return; }
    this.images = {};
    let pending = Object.keys(this.partUrls).length;
    for (const [name, url] of Object.entries(this.partUrls)) {
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
    const beckoning = pose === 'beckoning' && img.armBeckon;
    const walkCycle = Math.sin(time * 7.6 + phase);
    const bob = walking ? -Math.abs(walkCycle) * 2.3 : Math.sin(time * 1.65 + phase) * 1.5;
    const sway = walking ? walkCycle * 0.009 : Math.sin(time * 1.15 + phase) * 0.012;
    const blinkWindow = (time + phase) % 4.7;
    const blinking = blinkWindow > 4.52;
    const s = this.sheetToWorld;

    context.save();
    context.translate(x, y);
    context.scale(direction * scale, scale);

    context.fillStyle = 'rgba(27, 18, 24, 0.28)';
    context.beginPath();
    context.ellipse(2, 8, this.shadow.rx, this.shadow.ry, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = 'rgba(45, 27, 22, 0.22)';
    context.beginPath();
    context.ellipse(-1, 6.5, this.shadow.rx * 0.71, this.shadow.ry * 0.64, 0, 0, Math.PI * 2);
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

    const legSwing = walking ? walkCycle * this.motion.legSwing : 0;
    const hipY = this.rig.hipY * s;
    const torsoH = img.torso.naturalHeight * s;
    const torsoTop = hipY - torsoH + this.rig.waistOverlap * s;
    const headH = img.headOpen.naturalHeight * s;
    const headTop = torsoTop - headH + this.rig.neckOverlap * s;

    drawPart(img.backHair, 2 * s, headTop - this.rig.backHairLift * s);
    drawPart(img.legLeft, -this.rig.hipSpread * s, hipY, { rotate: legSwing });
    drawPart(img.legRight, this.rig.hipSpread * s, hipY, { rotate: -legSwing });
    drawPart(img.torso, 0, torsoTop);

    const armSwing = walking ? -walkCycle * this.motion.armSwing : Math.sin(time * 1.4 + phase) * 0.045;
    const armRest = this.motion.armRest;
    const shoulderY = torsoTop + this.rig.shoulderDrop * s;
    const shoulderX = (img.torso.naturalWidth * s) / 2 - this.rig.shoulderInset * s;
    drawPart(img.arm, -shoulderX, shoulderY, { pivotX: 0.62, rotate: -armRest + armSwing, mirror: true });
    if (beckoning) {
      const beckonLift = Math.sin(time * 2.4 + phase) * 0.05;
      drawPart(img.armBeckon, shoulderX, shoulderY, { pivotX: 0.4, rotate: beckonLift });
    } else {
      drawPart(img.arm, shoulderX, shoulderY, { pivotX: 0.62, rotate: armRest - armSwing * 0.8 });
    }

    const head = blinking ? img.headBlink : img.headOpen;
    drawPart(head, 0, headTop, { partScale: blinking ? img.headOpen.naturalWidth / img.headBlink.naturalWidth : 1 });

    context.restore();
    return true;
  }
}
