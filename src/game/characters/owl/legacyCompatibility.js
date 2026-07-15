import { clamp, easeInOutCubic, easeOutCubic, lerp } from '../../core/math.js';
import { LETTER_ENVELOPE_POSE } from '../../render/LetterRenderer.js';
import { petOwlDrawingProfile } from '../pet-owl/profile.js';
import { postOwlDrawingProfile } from '../post-owl/profile.js';
import {
  drawOwlBookplate,
  drawOwlWithProfile,
  sampleOwlMotionWithProfile,
} from './sharedDrawing.js';

export { drawOwlBookplate };

function profileForVariant(variant) {
  return variant === 'pet' ? petOwlDrawingProfile : postOwlDrawingProfile;
}

/** Compatibility adapter for callers that still pass the old variant field. */
export function sampleOwlMotion(options = {}) {
  const { variant, ...motion } = options;
  return sampleOwlMotionWithProfile(profileForVariant(variant), motion);
}

/** Compatibility adapter for callers that have not moved to character runtimes yet. */
export function drawVectorOwl(context, owl = {}, time = 0) {
  const { variant, ...state } = owl;
  return drawOwlWithProfile(context, state, time, profileForVariant(variant));
}

/**
 * The letter flight remains legacy scene choreography, not a capability of
 * either owl identity. A chapter presentation package can take ownership when
 * SetPieceRenderer is split without changing this compatibility export.
 */
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
        x: lerp(925, LETTER_ENVELOPE_POSE.x, easeInOutCubic(clamp((t - 0.35) / 1.45, 0, 1))),
        y: lerp(310, LETTER_ENVELOPE_POSE.y, easeOutCubic(clamp((t - 0.35) / 1.45, 0, 1))),
        rotation: lerp(-0.04, LETTER_ENVELOPE_POSE.rotation, clamp(t / 1.8, 0, 1)),
        scale: lerp(0.34, LETTER_ENVELOPE_POSE.scale, easeOutCubic(clamp((t - 0.35) / 1.45, 0, 1))),
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
    const progress = easeInOutCubic((t - launchStart) / (releaseAt - launchStart));
    owlX = cubicBezier(1060, 1015, 860, 780, progress);
    owlY = cubicBezier(290, 180, 205, 275, progress);
    owlRotation = lerp(-0.12, 0.08, progress);
    owlPose = 'delivery';
  } else if (t >= releaseAt) {
    const progress = clamp((t - releaseAt) / 0.95, 0, 1);
    owlX = cubicBezier(780, 900, 1110, 1225, progress);
    owlY = cubicBezier(275, 185, 125, 70, progress);
    owlRotation = lerp(0.08, -0.16, progress);
    owlPose = 'flight';
    owlOpacity = 1 - clamp((progress - 0.72) / 0.28, 0, 1);
  }

  let letterX;
  let letterY;
  let letterRotation;
  let letterScale;
  if (t < releaseAt) {
    letterX = owlX - 4;
    letterY = owlY + 45;
    letterRotation = owlRotation * 0.35;
    letterScale = 0.3;
  } else {
    const progress = easeOutCubic(clamp((t - releaseAt) / 1.05, 0, 1));
    letterX = lerp(776, LETTER_ENVELOPE_POSE.x, progress)
      + Math.sin(progress * Math.PI * 2) * (1 - progress) * 18;
    letterY = cubicBezier(320, 300, 270, LETTER_ENVELOPE_POSE.y, progress);
    letterRotation = LETTER_ENVELOPE_POSE.rotation
      + Math.sin(progress * Math.PI * 2.4) * (1 - progress) * 0.12;
    letterScale = lerp(0.3, LETTER_ENVELOPE_POSE.scale, progress);
  }

  return Object.freeze({
    owl: Object.freeze({
      x: owlX,
      y: owlY,
      rotation: owlRotation,
      scale: 1.04,
      opacity: owlOpacity,
      pose: owlPose,
    }),
    letter: Object.freeze({
      x: letterX,
      y: letterY,
      rotation: letterRotation,
      scale: letterScale,
    }),
  });
}

function cubicBezier(a, b, c, d, time) {
  const inverse = 1 - time;
  return inverse ** 3 * a
    + 3 * inverse ** 2 * time * b
    + 3 * inverse * time ** 2 * c
    + time ** 3 * d;
}
