import { describe, expect, it } from 'vitest';
import {
  drawOwlBookplate,
  drawVectorOwl,
  sampleOwlDelivery,
  sampleOwlMotion,
} from '../src/game/render/OwlRenderer.js';
import { LETTER_ENVELOPE_POSE } from '../src/game/render/LetterRenderer.js';

function recordingContext() {
  const calls = [];
  const styles = [];
  let depth = 0;
  const methods = new Set([
    'arc', 'arcTo', 'beginPath', 'bezierCurveTo', 'closePath', 'ellipse', 'fill',
    'fillRect', 'lineTo', 'moveTo', 'quadraticCurveTo', 'rect', 'restore', 'rotate',
    'roundRect', 'save', 'scale', 'setLineDash', 'stroke', 'strokeRect', 'translate',
  ]);
  const target = { calls, styles, globalAlpha: 1, get depth() { return depth; } };
  return new Proxy(target, {
    get(object, property) {
      if (property === 'createLinearGradient' || property === 'createRadialGradient') {
        return (...args) => {
          calls.push([property, ...args]);
          return { addColorStop: (...stop) => calls.push(['addColorStop', ...stop]) };
        };
      }
      if (methods.has(property)) {
        return (...args) => {
          calls.push([property, ...args]);
          if (property === 'save') depth += 1;
          if (property === 'restore') depth -= 1;
        };
      }
      return object[property];
    },
    set(object, property, value) {
      if (property === 'fillStyle' || property === 'strokeStyle') styles.push([property, value]);
      object[property] = value;
      return true;
    },
  });
}

describe('vector owl motion', () => {
  it('is deterministic and keeps sampled transforms finite and bounded', () => {
    for (const pose of ['perch', 'idle', 'takeoff', 'flight', 'settle', 'pet-follow']) {
      const input = { time: 2.375, phase: 0.42, pose, lookX: 0.7, lookY: -0.3, variant: 'pet' };
      const first = sampleOwlMotion(input);
      const second = sampleOwlMotion(input);
      expect(first).toEqual(second);
      for (const value of Object.values(first)) expect(Number.isFinite(value)).toBe(true);
      expect(Math.abs(first.headTurn)).toBeLessThanOrEqual(0.22);
      expect(Math.abs(first.headTilt)).toBeLessThanOrEqual(0.2);
      expect(first.blink).toBeGreaterThanOrEqual(0);
      expect(first.blink).toBeLessThanOrEqual(1);
      expect(first.wingSpread).toBeGreaterThanOrEqual(0);
      expect(first.wingSpread).toBeLessThanOrEqual(1);
    }
  });

  it('gives the pet owl a distinct curious follow and wing-flick personality', () => {
    const post = sampleOwlMotion({ time: 3.85, pose: 'perch', variant: 'post' });
    const pet = sampleOwlMotion({ time: 3.85, pose: 'idle', variant: 'pet' });
    const follow = sampleOwlMotion({ time: 3.85, pose: 'pet-follow', variant: 'pet' });

    expect(Math.abs(pet.headTilt)).toBeGreaterThan(Math.abs(post.headTilt));
    expect(pet.wingFlick).toBeGreaterThan(0);
    expect(follow.hop).toBeGreaterThanOrEqual(0);
    expect(follow.wingSpread).toBeGreaterThan(post.wingSpread);
  });

  it('keeps reduced motion expressive while substantially limiting flight beats', () => {
    const full = sampleOwlMotion({ time: 0.42, pose: 'flight', variant: 'post' });
    const reduced = sampleOwlMotion({ time: 0.42, pose: 'flight', variant: 'post', reducedMotion: true });

    expect(Math.abs(reduced.wingBeat)).toBeLessThan(Math.abs(full.wingBeat));
    expect(reduced.wingSpread).toBeLessThan(full.wingSpread);
    expect(Math.abs(reduced.headTurn)).toBeGreaterThan(0);
    expect(Math.abs(reduced.bodyBob)).toBeLessThan(Math.abs(full.bodyBob));
  });
});

describe('storybook owl drawing', () => {
  const forbiddenGeometry = new Set([
    'arc', 'arcTo', 'ellipse', 'fillRect', 'lineTo', 'rect', 'roundRect',
    'setLineDash', 'strokeRect', 'createLinearGradient', 'createRadialGradient',
  ]);

  it('draws both owl identities as deterministic layered organic puppets', () => {
    const variants = [
      {
        owl: { variant: 'post', pose: 'delivery', facing: 'right', x: 280, y: 340 },
        tones: ['#a77b4f', '#c39a68', '#6f5038', '#7d5a3f', '#efd19a'],
      },
      {
        owl: { variant: 'pet', pose: 'pet-follow', facing: 'left', x: 280, y: 340 },
        tones: ['#83788b', '#a79aab', '#5b5264', '#665d72', '#dec8e3'],
      },
    ];

    for (const { owl, tones } of variants) {
      const first = recordingContext();
      const replayed = recordingContext();
      drawVectorOwl(first, owl, 3.875);
      drawVectorOwl(replayed, owl, 3.875);

      expect(first.calls).toEqual(replayed.calls);
      expect(first.styles).toEqual(replayed.styles);
      expect(first.calls.filter(([name]) => name === 'bezierCurveTo').length).toBeGreaterThan(45);
      expect(first.calls.filter(([name]) => name === 'quadraticCurveTo').length).toBeGreaterThan(45);
      expect(first.calls.some(([name]) => forbiddenGeometry.has(name))).toBe(false);
      expect(first.calls.every(([, ...values]) => values.every(
        (value) => typeof value !== 'number' || Number.isFinite(value),
      ))).toBe(true);
      expect(first.styles.some(([property]) => ['filter', 'shadowBlur'].includes(property))).toBe(false);
      for (const tone of tones) expect(first.styles.some(([, value]) => value === tone)).toBe(true);
      expect(first.depth).toBe(0);
    }
  });

  it('closes shaped eyelids over the same organic eyes without reverting to geometric covers', () => {
    const open = recordingContext();
    const blink = recordingContext();
    drawVectorOwl(open, { variant: 'post', pose: 'perch' }, 0);
    drawVectorOwl(blink, { variant: 'post', pose: 'perch' }, 5.23);

    expect(sampleOwlMotion({ time: 5.23, variant: 'post' }).blink).toBeGreaterThan(0.5);
    expect(blink.calls.filter(([name]) => name === 'fill').length)
      .toBeGreaterThan(open.calls.filter(([name]) => name === 'fill').length);
    expect(blink.calls.some(([name]) => forbiddenGeometry.has(name))).toBe(false);
    expect(blink.depth).toBe(0);
  });

  it('uses the same organic shape language for the recurring owl bookplate', () => {
    const context = recordingContext();
    drawOwlBookplate(context, 80, 90, 1.4);

    expect(context.calls.filter(([name]) => name === 'bezierCurveTo').length).toBeGreaterThan(10);
    expect(context.calls.some(([name]) => forbiddenGeometry.has(name))).toBe(false);
    expect(context.depth).toBe(0);
  });

  it('mirrors material light and rim from the authored room side while the shadow stays planted', () => {
    for (const facing of ['left', 'right']) {
      const left = recordingContext();
      const explicitLeft = recordingContext();
      const right = recordingContext();
      const replayedRight = recordingContext();
      const owl = { variant: 'post', pose: 'perch', facing, x: 280, y: 340 };

      drawVectorOwl(left, owl, 1.375);
      drawVectorOwl(explicitLeft, { ...owl, lightSide: 'left' }, 1.375);
      drawVectorOwl(right, { ...owl, lightSide: 'right' }, 1.375);
      drawVectorOwl(replayedRight, { ...owl, lightSide: 'right' }, 1.375);

      expect(left.calls).toEqual(explicitLeft.calls);
      expect(right.calls).toEqual(replayedRight.calls);
      expect(right.calls).not.toEqual(left.calls);
      const leftMirrors = left.calls.filter(([name, x, y]) => (
        name === 'scale' && x === -1 && y === 1
      )).length;
      const rightMirrors = right.calls.filter(([name, x, y]) => (
        name === 'scale' && x === -1 && y === 1
      )).length;
      if (facing === 'right') expect(rightMirrors).toBeGreaterThan(leftMirrors);
      else expect(rightMirrors).toBeLessThan(leftMirrors);

      const translates = right.calls.filter(([name]) => name === 'translate');
      expect(translates[0]).toEqual(['translate', 280, 340]);
      expect(translates[1][1]).toBe(280);
      expect(translates[1][2]).not.toBe(340);
      expect(right.depth).toBe(0);
    }
  });
});

describe('owl delivery choreography', () => {
  it('moves through perch, carried-letter flight, release, and exit deterministically', () => {
    const perch = sampleOwlDelivery(0);
    const flight = sampleOwlDelivery(0.75);
    const release = sampleOwlDelivery(1.5);
    const exit = sampleOwlDelivery(2.2);

    expect(perch.owl).toMatchObject({ x: 1060, y: 290, pose: 'takeoff', opacity: 1 });
    expect(flight.owl.pose).toBe('delivery');
    expect(flight.letter.scale).toBe(0.3);
    expect(release.letter.scale).toBeGreaterThan(0.3);
    expect(release.letter.x).toBeLessThan(flight.letter.x);
    expect(exit.owl.opacity).toBe(0);
    expect(exit.letter.x).toBeCloseTo(LETTER_ENVELOPE_POSE.x, 3);
    expect(exit.letter.y).toBeCloseTo(LETTER_ENVELOPE_POSE.y, 3);
    expect(exit.letter.scale).toBeCloseTo(LETTER_ENVELOPE_POSE.scale, 3);
    expect(exit.letter.rotation).toBeCloseTo(LETTER_ENVELOPE_POSE.rotation, 3);
    expect(sampleOwlDelivery(1.5)).toEqual(release);
  });

  it('uses a short, low-displacement settle for reduced motion', () => {
    const full = sampleOwlDelivery(0.75);
    const reduced = sampleOwlDelivery(0.75, { reducedMotion: true });
    const fullDisplacement = Math.hypot(full.owl.x - 1060, full.owl.y - 290);
    const reducedDisplacement = Math.hypot(reduced.owl.x - 1060, reduced.owl.y - 290);

    expect(reducedDisplacement).toBeLessThan(fullDisplacement);
    expect(reduced.owl.pose).toBe('settle');
    expect(reduced.letter.scale).toBeGreaterThan(0.34);
  });
});
