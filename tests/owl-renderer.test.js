import { describe, expect, it } from 'vitest';
import { sampleOwlDelivery, sampleOwlMotion } from '../src/game/render/OwlRenderer.js';

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

describe('owl delivery choreography', () => {
  it('moves through perch, carried-letter flight, release, and exit deterministically', () => {
    const perch = sampleOwlDelivery(0);
    const flight = sampleOwlDelivery(0.75);
    const release = sampleOwlDelivery(1.5);
    const exit = sampleOwlDelivery(2.2);

    expect(perch.owl).toMatchObject({ x: 1060, y: 290, pose: 'takeoff', opacity: 1 });
    expect(flight.owl.pose).toBe('delivery');
    expect(flight.letter.scale).toBe(0.38);
    expect(release.letter.scale).toBeGreaterThan(0.38);
    expect(release.letter.x).toBeLessThan(flight.letter.x);
    expect(exit.owl.opacity).toBe(0);
    expect(exit.letter.x).toBeCloseTo(650);
    expect(sampleOwlDelivery(1.5)).toEqual(release);
  });

  it('uses a short, low-displacement settle for reduced motion', () => {
    const full = sampleOwlDelivery(0.75);
    const reduced = sampleOwlDelivery(0.75, { reducedMotion: true });
    const fullDisplacement = Math.hypot(full.owl.x - 1060, full.owl.y - 290);
    const reducedDisplacement = Math.hypot(reduced.owl.x - 1060, reduced.owl.y - 290);

    expect(reducedDisplacement).toBeLessThan(fullDisplacement);
    expect(reduced.owl.pose).toBe('settle');
    expect(reduced.letter.scale).toBeGreaterThan(0.48);
  });
});
