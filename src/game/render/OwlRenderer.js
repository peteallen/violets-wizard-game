import { clamp, easeInOutCubic, easeOutCubic, lerp } from '../core/math.js';

const OUTLINE = '#30251f';

const OWL_PALETTES = Object.freeze({
  post: Object.freeze({
    body: '#a77b4f', bodyLight: '#c39a68', bodyShadow: '#6f5038',
    wing: '#7d5a3f', wingDark: '#56402f', facial: '#f0dfb9',
    facialShadow: '#d5bd91', iris: '#d79a2f', beak: '#d6a142',
    foot: '#a87935', fleck: '#4b392c', accent: '#f4d58d',
  }),
  pet: Object.freeze({
    body: '#83788b', bodyLight: '#a79aab', bodyShadow: '#5b5264',
    wing: '#665d72', wingDark: '#474150', facial: '#f1e8d5',
    facialShadow: '#d4c8c4', iris: '#d5a642', beak: '#d6a142',
    foot: '#a87935', fleck: '#443c4d', accent: '#c8a7dc',
  }),
});

export function sampleOwlMotion({
  time = 0,
  phase = 0,
  pose = 'perch',
  lookX = null,
  lookY = null,
  reducedMotion = false,
  variant = 'post',
} = {}) {
  const t = Math.max(0, time + phase);
  const pet = variant === 'pet';
  const automaticLookX = Math.sin(t * 0.77 + 0.8) * 0.52 + Math.sin(t * 0.19 + 1.7) * 0.2;
  const automaticLookY = Math.sin(t * 0.43 + 2.2) * 0.22;
  const trackedX = clamp(lookX ?? automaticLookX, -1, 1);
  const trackedY = clamp(lookY ?? automaticLookY, -1, 1);
  const blinkCycle = (t * 0.91 + (pet ? 1.4 : 0.3)) % 5.2;
  const blink = blinkCycle > 4.92 ? Math.sin(((blinkCycle - 4.92) / 0.28) * Math.PI) : 0;
  const breath = Math.sin(t * 1.72 + phase * 0.5);
  const curiosity = Math.sin(t * 0.71 + 0.4) * 0.055 + trackedX * 0.13;
  const petTilt = pet ? Math.sin(t * 0.58 + 1.2) * 0.085 : 0;

  const motion = {
    bodyBob: breath * (reducedMotion ? 0.55 : 1.35),
    bodyScaleY: 1 + breath * (reducedMotion ? 0.004 : 0.012),
    bodyTilt: Math.sin(t * 0.49 + phase) * (pet ? 0.025 : 0.012),
    headTurn: clamp(curiosity, -0.22, 0.22),
    headTilt: clamp(petTilt + trackedY * 0.045, -0.14, 0.14),
    eyeX: trackedX * 2.8,
    eyeY: trackedY * 1.7,
    blink,
    wingSpread: 0,
    wingBeat: 0,
    wingFlick: 0,
    hop: 0,
    tailFan: pet ? 0.08 : 0,
    beakOpen: 0,
  };

  if (pose === 'takeoff') {
    const launch = clamp(t / 0.55, 0, 1);
    motion.hop = Math.sin(launch * Math.PI) * (reducedMotion ? 4 : 16);
    motion.bodyTilt = -0.08 * launch;
    motion.wingSpread = reducedMotion ? 0.22 : 0.72 * launch;
    motion.wingBeat = reducedMotion ? 0.08 : Math.sin(t * 11.5) * 0.72;
    motion.tailFan = 0.65 * launch;
  } else if (pose === 'flight' || pose === 'delivery') {
    motion.bodyBob = reducedMotion ? 0 : Math.sin(t * 5.4) * 2.4;
    motion.bodyTilt = reducedMotion ? -0.025 : -0.08 + Math.sin(t * 1.8) * 0.035;
    motion.wingSpread = reducedMotion ? 0.25 : 0.92;
    motion.wingBeat = reducedMotion ? 0.08 : Math.sin(t * 13.2) * 0.88;
    motion.tailFan = reducedMotion ? 0.18 : 0.78;
    motion.headTurn *= 0.35;
  } else if (pose === 'settle') {
    const settle = Math.exp(-t * 2.8);
    motion.hop = Math.abs(Math.sin(t * 7.5)) * settle * (reducedMotion ? 2 : 9);
    motion.wingSpread = settle * (reducedMotion ? 0.12 : 0.62);
    motion.wingBeat = Math.sin(t * 10.5) * settle * (reducedMotion ? 0.08 : 0.4);
    motion.tailFan = settle * 0.45;
  } else if (pose === 'follow' || pose === 'pet-follow') {
    const step = Math.max(0, Math.sin(t * 5.3));
    motion.hop = step * step * (reducedMotion ? 2.5 : 8);
    motion.bodyTilt = Math.sin(t * 5.3) * (reducedMotion ? 0.012 : 0.045);
    motion.wingSpread = reducedMotion ? 0.05 : 0.16 + step * 0.16;
    motion.wingBeat = reducedMotion ? 0 : Math.sin(t * 10.6) * 0.24;
    motion.tailFan = 0.18 + step * 0.2;
  } else if (pet) {
    const flickCycle = (t + 0.35) % 4.6;
    const flick = flickCycle > 3.96 && flickCycle < 4.36
      ? Math.sin(((flickCycle - 3.96) / 0.4) * Math.PI)
      : 0;
    motion.wingFlick = reducedMotion ? flick * 0.08 : flick * 0.42;
    motion.wingSpread = motion.wingFlick;
    motion.headTilt += flick * 0.055;
    motion.beakOpen = flick > 0.78 ? 0.35 : 0;
  }

  return Object.freeze(motion);
}

export function sampleOwlDelivery(time, { reducedMotion = false } = {}) {
  const t = Math.max(0, time);
  if (reducedMotion) {
    const settle = easeOutCubic(clamp(t / 1.15, 0, 1));
    return Object.freeze({
      owl: Object.freeze({
        x: lerp(1060, 980, settle),
        y: lerp(290, 275, settle),
        rotation: -0.025 * settle,
        scale: 1.04,
        opacity: 1 - clamp((t - 1.3) / 0.5, 0, 1),
        pose: t < 0.35 ? 'takeoff' : 'settle',
      }),
      letter: Object.freeze({
        x: lerp(925, 650, easeInOutCubic(clamp((t - 0.35) / 1.45, 0, 1))),
        y: lerp(310, 350, easeOutCubic(clamp((t - 0.35) / 1.45, 0, 1))),
        rotation: lerp(-0.04, 0, clamp(t / 1.8, 0, 1)),
        scale: lerp(0.48, 1, easeOutCubic(clamp((t - 0.35) / 1.45, 0, 1))),
      }),
    });
  }

  const launchStart = 0.16;
  const releaseAt = 1.16;
  let owlX = 1060;
  let owlY = 290;
  let owlRotation = 0;
  let owlPose = 'takeoff';
  let owlOpacity = 1;
  if (t >= launchStart && t < releaseAt) {
    const p = easeInOutCubic((t - launchStart) / (releaseAt - launchStart));
    owlX = cubicBezier(1060, 1015, 860, 780, p);
    owlY = cubicBezier(290, 180, 205, 275, p);
    owlRotation = lerp(-0.12, 0.08, p);
    owlPose = 'delivery';
  } else if (t >= releaseAt) {
    const p = clamp((t - releaseAt) / 0.95, 0, 1);
    owlX = cubicBezier(780, 900, 1110, 1225, p);
    owlY = cubicBezier(275, 185, 125, 70, p);
    owlRotation = lerp(0.08, -0.16, p);
    owlPose = 'flight';
    owlOpacity = 1 - clamp((p - 0.72) / 0.28, 0, 1);
  }

  let letterX;
  let letterY;
  let letterRotation;
  let letterScale;
  if (t < releaseAt) {
    letterX = owlX - 4;
    letterY = owlY + 45;
    letterRotation = owlRotation * 0.35;
    letterScale = 0.38;
  } else {
    const p = easeOutCubic(clamp((t - releaseAt) / 1.05, 0, 1));
    letterX = lerp(776, 650, p) + Math.sin(p * Math.PI * 2) * (1 - p) * 18;
    letterY = cubicBezier(320, 305, 330, 350, p);
    letterRotation = Math.sin(p * Math.PI * 2.4) * (1 - p) * 0.12;
    letterScale = lerp(0.38, 1, p);
  }

  return Object.freeze({
    owl: Object.freeze({ x: owlX, y: owlY, rotation: owlRotation, scale: 1.04, opacity: owlOpacity, pose: owlPose }),
    letter: Object.freeze({ x: letterX, y: letterY, rotation: letterRotation, scale: letterScale }),
  });
}

export function drawVectorOwl(context, owl = {}, time = 0) {
  const variant = owl.variant === 'pet' ? 'pet' : 'post';
  const palette = OWL_PALETTES[variant];
  const scale = owl.scale ?? (variant === 'pet' ? 0.9 : 1);
  const direction = owl.facing === 'left' ? -1 : 1;
  const motion = sampleOwlMotion({
    time,
    phase: owl.phase ?? 0,
    pose: owl.pose ?? (variant === 'pet' ? 'idle' : 'perch'),
    lookX: owl.lookX,
    lookY: owl.lookY,
    reducedMotion: Boolean(owl.reducedMotion),
    variant,
  });

  context.save();
  context.globalAlpha *= owl.opacity ?? 1;
  context.translate(owl.x ?? 0, (owl.y ?? 0) - motion.hop + motion.bodyBob);
  context.rotate((owl.rotation ?? 0) + motion.bodyTilt);
  context.scale(direction * scale, scale);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = OUTLINE;
  context.lineWidth = 3;

  drawTail(context, palette, motion);
  drawFarWing(context, palette, motion);

  context.save();
  context.scale(1, motion.bodyScaleY);
  drawBody(context, palette, variant);
  context.restore();

  drawNearWing(context, palette, motion);
  drawFeet(context, palette, owl.pose ?? 'perch');

  context.save();
  context.translate(motion.headTurn * 22, -1);
  context.rotate(motion.headTilt + motion.headTurn * 0.12);
  context.scale(1 - Math.abs(motion.headTurn) * 0.08, 1);
  drawHead(context, palette, variant, motion);
  context.restore();

  context.restore();
}

export function drawOwlBookplate(context, x, y, scale = 1, { color = '#5e4634', accent = '#e8b44f' } = {}) {
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.fillStyle = color;
  context.strokeStyle = accent;
  context.lineWidth = 2.5;
  context.beginPath();
  context.moveTo(-22, -12);
  context.lineTo(-13, -27);
  context.quadraticCurveTo(0, -34, 13, -27);
  context.lineTo(22, -12);
  context.quadraticCurveTo(25, 8, 0, 25);
  context.quadraticCurveTo(-25, 8, -22, -12);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = '#fff8e8';
  context.beginPath();
  context.ellipse(-8, -9, 7.5, 9, 0.2, 0, Math.PI * 2);
  context.ellipse(8, -9, 7.5, 9, -0.2, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#241b18';
  context.beginPath();
  context.arc(-7, -8, 3, 0, Math.PI * 2);
  context.arc(7, -8, 3, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = accent;
  context.beginPath();
  context.moveTo(-3, 0);
  context.lineTo(0, 6);
  context.lineTo(3, 0);
  context.closePath();
  context.fill();
  context.restore();
}

function drawTail(context, palette, motion) {
  const fan = motion.tailFan;
  for (let index = -2; index <= 2; index += 1) {
    const spread = index * (5 + fan * 4);
    context.save();
    context.translate(spread, -15);
    context.rotate(index * fan * 0.08);
    context.fillStyle = index % 2 === 0 ? palette.wing : palette.wingDark;
    context.beginPath();
    context.moveTo(-7, -12);
    context.quadraticCurveTo(-8, 11, 0, 25 + Math.abs(index) * 2);
    context.quadraticCurveTo(8, 11, 7, -12);
    context.closePath();
    fillStroke(context, 2.2);
    context.restore();
  }
}

function drawFarWing(context, palette, motion) {
  drawWing(context, -1, palette, motion, true);
}

function drawNearWing(context, palette, motion) {
  drawWing(context, 1, palette, motion, false);
}

function drawWing(context, side, palette, motion, far) {
  const spread = motion.wingSpread;
  const beat = motion.wingBeat + (side > 0 ? motion.wingFlick : motion.wingFlick * 0.35);
  const shoulderX = side * 25;
  const angle = side * (0.11 + spread * 0.36) + side * beat * 0.52;
  context.save();
  context.globalAlpha *= far ? 0.94 : 1;
  context.translate(shoulderX, -73);
  context.rotate(angle);
  context.scale(side, 1);
  const reach = 31 + spread * 55;
  const lift = beat * 26 - spread * 17;

  context.fillStyle = far ? palette.wingDark : palette.wing;
  context.beginPath();
  context.moveTo(0, -14);
  context.bezierCurveTo(reach * 0.52, -25 + lift, reach, -12 + lift, reach + 4, 5 + lift);
  context.bezierCurveTo(reach * 0.88, 17 + lift, reach * 0.72, 28 + lift, reach * 0.52, 35 + lift);
  context.quadraticCurveTo(23, 45, 4, 29);
  context.closePath();
  fillStroke(context, 2.8);

  for (let index = 0; index < 5; index += 1) {
    const p = index / 4;
    const featherX = lerp(12, reach * 0.78, p);
    const featherY = lerp(18, 6 + lift, p) + Math.sin(p * Math.PI) * 10;
    context.fillStyle = index % 2 ? palette.bodyShadow : palette.wingDark;
    context.beginPath();
    context.moveTo(featherX - 5, featherY - 12);
    context.quadraticCurveTo(featherX + 7, featherY - 1, featherX + 2, featherY + 15 + p * 6);
    context.quadraticCurveTo(featherX - 6, featherY + 6, featherX - 5, featherY - 12);
    context.closePath();
    context.fill();
  }
  context.strokeStyle = palette.bodyLight;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(5, -5);
  context.quadraticCurveTo(reach * 0.48, 5 + lift, reach * 0.82, 2 + lift);
  context.stroke();
  context.restore();
}

function drawBody(context, palette, variant) {
  context.fillStyle = palette.body;
  context.beginPath();
  context.moveTo(-25, -87);
  context.bezierCurveTo(-43, -72, -42, -25, -28, -5);
  context.quadraticCurveTo(0, 12, 28, -5);
  context.bezierCurveTo(42, -25, 43, -72, 25, -87);
  context.quadraticCurveTo(0, -102, -25, -87);
  context.closePath();
  fillStroke(context, 3.2);

  context.fillStyle = palette.bodyLight;
  context.beginPath();
  context.ellipse(0, -39, 23, 39, 0, 0, Math.PI * 2);
  context.fill();

  const rows = variant === 'pet' ? 4 : 5;
  for (let row = 0; row < rows; row += 1) {
    const count = row % 2 === 0 ? 4 : 3;
    const y = -62 + row * 13;
    for (let column = 0; column < count; column += 1) {
      const x = (column - (count - 1) / 2) * 11;
      context.fillStyle = row % 2 ? palette.bodyShadow : palette.body;
      context.globalAlpha = 0.46;
      context.beginPath();
      context.moveTo(x - 5, y - 4);
      context.quadraticCurveTo(x, y + 8, x + 5, y - 4);
      context.quadraticCurveTo(x, y, x - 5, y - 4);
      context.fill();
    }
  }
  context.globalAlpha = 1;
  context.strokeStyle = palette.accent;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-17, -70);
  context.quadraticCurveTo(-6, -79, 0, -68);
  context.stroke();
}

function drawFeet(context, palette, pose) {
  const tucked = pose === 'flight' || pose === 'delivery';
  const footY = tucked ? -15 : 0;
  for (const side of [-1, 1]) {
    context.strokeStyle = palette.foot;
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(side * 13, -15);
    context.lineTo(side * 13, footY);
    if (!tucked) {
      context.moveTo(side * 13, footY);
      context.quadraticCurveTo(side * 20, 4, side * 25, 1);
      context.moveTo(side * 13, footY);
      context.quadraticCurveTo(side * 9, 5, side * 5, 2);
    }
    context.stroke();
  }
}

function drawHead(context, palette, variant, motion) {
  context.fillStyle = palette.body;
  context.beginPath();
  context.moveTo(-35, -91);
  context.lineTo(-27, -120);
  context.lineTo(-12, -111);
  context.quadraticCurveTo(0, -119, 14, -110);
  context.lineTo(29, -121);
  context.lineTo(35, -91);
  context.quadraticCurveTo(32, -68, 0, -61);
  context.quadraticCurveTo(-32, -68, -35, -91);
  context.closePath();
  fillStroke(context, 3.2);

  context.fillStyle = palette.facialShadow;
  context.beginPath();
  context.moveTo(-29, -95);
  context.bezierCurveTo(-25, -115, -6, -114, 0, -98);
  context.bezierCurveTo(7, -114, 26, -114, 29, -94);
  context.bezierCurveTo(24, -72, 8, -68, 0, -59);
  context.bezierCurveTo(-8, -68, -24, -73, -29, -95);
  context.closePath();
  context.fill();

  context.fillStyle = palette.facial;
  context.beginPath();
  context.moveTo(-25, -94);
  context.bezierCurveTo(-21, -109, -6, -109, 0, -94);
  context.bezierCurveTo(6, -109, 21, -109, 25, -94);
  context.bezierCurveTo(21, -78, 7, -74, 0, -64);
  context.bezierCurveTo(-7, -74, -21, -78, -25, -94);
  context.closePath();
  context.fill();

  for (const side of [-1, 1]) {
    context.strokeStyle = palette.fleck;
    context.lineWidth = 2.4;
    context.beginPath();
    context.moveTo(side * 6, -105);
    context.quadraticCurveTo(side * 14, -111 + side, side * 21, -104);
    context.stroke();
  }

  drawOwlEye(context, -11, -91, palette, motion);
  drawOwlEye(context, 11, -91, palette, motion);

  context.fillStyle = palette.beak;
  context.beginPath();
  context.moveTo(-5, -81);
  context.quadraticCurveTo(0, -74 + motion.beakOpen * 5, 5, -81);
  context.lineTo(0, -66 - motion.beakOpen * 2);
  context.closePath();
  fillStroke(context, 1.8);

  context.fillStyle = palette.fleck;
  context.globalAlpha = 0.5;
  const flecks = variant === 'pet'
    ? [[-27, -88], [28, -85], [-21, -72], [23, -71]]
    : [[-27, -102], [27, -99], [-30, -84], [30, -82], [-21, -70], [22, -70]];
  for (const [x, y] of flecks) {
    context.beginPath();
    context.ellipse(x, y, 2.2, 4.2, x < 0 ? -0.35 : 0.35, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
  context.strokeStyle = 'rgba(255,241,201,0.65)';
  context.lineWidth = 2.3;
  context.beginPath();
  context.moveTo(-29, -103);
  context.quadraticCurveTo(-18, -119, -5, -112);
  context.stroke();
}

function drawOwlEye(context, x, y, palette, motion) {
  context.save();
  context.translate(x, y);
  context.fillStyle = '#fff8e8';
  context.beginPath();
  context.ellipse(0, 0, 10, 11, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = OUTLINE;
  context.lineWidth = 2.2;
  context.stroke();

  context.fillStyle = palette.iris;
  context.beginPath();
  context.arc(motion.eyeX, motion.eyeY, 6.8, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = palette.fleck;
  context.lineWidth = 1.4;
  context.stroke();
  context.fillStyle = '#171311';
  context.beginPath();
  context.arc(motion.eyeX, motion.eyeY, 3.7, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = 'rgba(255,255,255,0.9)';
  context.beginPath();
  context.arc(motion.eyeX - 2.2, motion.eyeY - 2.7, 1.8, 0, Math.PI * 2);
  context.fill();

  if (motion.blink > 0) {
    const cover = clamp(motion.blink, 0, 1);
    context.fillStyle = palette.facialShadow;
    context.beginPath();
    context.ellipse(0, -11 + cover * 10.5, 10.4, 11, 0, Math.PI, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.ellipse(0, 11 - cover * 10.5, 10.4, 11, 0, 0, Math.PI);
    context.fill();
    context.strokeStyle = OUTLINE;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(-8, 0);
    context.quadraticCurveTo(0, 2, 8, 0);
    context.globalAlpha = cover;
    context.stroke();
  }
  context.restore();
}

function fillStroke(context, lineWidth = null) {
  context.fill();
  const previous = context.lineWidth;
  if (lineWidth !== null) context.lineWidth = lineWidth;
  context.strokeStyle = OUTLINE;
  context.stroke();
  context.lineWidth = previous;
}

function cubicBezier(a, b, c, d, t) {
  const inverse = 1 - t;
  return inverse ** 3 * a + 3 * inverse ** 2 * t * b + 3 * inverse * t ** 2 * c + t ** 3 * d;
}
