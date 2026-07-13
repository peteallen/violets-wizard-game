import { describe, expect, it } from 'vitest';
import {
  CHARACTER_REVIEW_SCENES,
  CharacterRenderer,
  VIOLET_STYLE,
  drawVioletGlasses,
  sampleCompanionMotion,
} from '../src/game/render/CharacterRenderer.js';

function recordingContext() {
  const calls = [];
  const styles = [];
  let depth = 0;
  const gradient = { addColorStop: (...args) => calls.push(['addColorStop', ...args]) };
  const methods = new Set([
    'arc', 'arcTo', 'beginPath', 'bezierCurveTo', 'clip', 'closePath', 'ellipse', 'fill', 'fillRect',
    'fillText', 'lineTo', 'moveTo', 'quadraticCurveTo', 'rect', 'restore', 'rotate', 'roundRect',
    'save', 'scale', 'setLineDash', 'stroke', 'strokeRect', 'translate',
  ]);
  const target = { globalAlpha: 1, calls, styles, get depth() { return depth; } };
  return new Proxy(target, {
    get(object, property) {
      if (property === 'createLinearGradient' || property === 'createRadialGradient') {
        return (...args) => { calls.push([property, ...args]); return gradient; };
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

describe('illustrated character renderer', () => {
  it('draws every registered review surface deterministically without leaking canvas state', () => {
    const renderer = new CharacterRenderer();
    for (const scene of CHARACTER_REVIEW_SCENES) {
      const first = recordingContext();
      const second = recordingContext();
      expect(renderer.drawReviewScene(first, scene, 1.375)).toBe(true);
      expect(renderer.drawReviewScene(second, scene, 1.375)).toBe(true);
      expect(first.calls).toEqual(second.calls);
      expect(first.calls.length).toBeGreaterThan(100);
      expect(first.calls
        .filter(([name]) => ['moveTo', 'lineTo', 'quadraticCurveTo', 'bezierCurveTo'].includes(name))
        .every(([, ...values]) => values.every(Number.isFinite))).toBe(true);
      expect(first.depth).toBe(0);
    }
    expect(renderer.drawReviewScene(recordingContext(), 'unrelated-scene', 0)).toBe(false);
  });

  it('provides one balanced portrait API for the whole dialogue cast and narrator', () => {
    const renderer = new CharacterRenderer();
    const speakers = ['Violet', 'Hagrid', 'Ollivander', 'Madam Malkin', 'Menagerie keeper', 'Narrator', 'cat', 'owl', 'toad'];
    for (const speaker of speakers) {
      const context = recordingContext();
      renderer.drawPortrait(context, { speaker, pose: 'speaking', x: 80, y: 90, scale: 1.2 }, 2.25);
      expect(context.calls.length).toBeGreaterThan(35);
      expect(context.depth).toBe(0);
      expect(context.calls.some(([name]) => name === 'clip')).toBe(true);
    }

    const authoredTalk = recordingContext();
    const canonicalSpeaking = recordingContext();
    renderer.drawPortrait(authoredTalk, { speaker: 'Hagrid', pose: 'talk', x: 80, y: 90 }, 0.37);
    renderer.drawPortrait(canonicalSpeaking, { speaker: 'Hagrid', pose: 'speaking', x: 80, y: 90 }, 0.37);
    expect(authoredTalk.calls).toEqual(canonicalSpeaking.calls);
  });

  it('gives Hagrid deterministic walking and beckoning poses without leaking canvas state', () => {
    const renderer = new CharacterRenderer();
    for (const pose of ['walking', 'beckon']) {
      const first = recordingContext();
      const replayed = recordingContext();
      const character = {
        kind: 'guide', x: 180, y: 610, facing: 'right', pose, reducedMotion: false,
      };
      renderer.draw(first, character, 1.25);
      renderer.draw(replayed, character, 1.25);
      expect(first.calls).toEqual(replayed.calls);
      expect(first.calls.every(([, ...values]) => values.every(
        (value) => typeof value !== 'number' || Number.isFinite(value),
      ))).toBe(true);
      expect(first.depth).toBe(0);
    }

    const beckon = recordingContext();
    renderer.draw(beckon, {
      kind: 'guide', x: 180, y: 610, facing: 'right', pose: 'beckon', reducedMotion: true,
    }, 1.25);
    expect(beckon.calls.filter(([name]) => name === 'quadraticCurveTo').length).toBeGreaterThan(15);
  });

  it('keeps Violet photo-matched with ash hair and hand-drawn dark-green glasses', () => {
    expect(VIOLET_STYLE).toMatchObject({
      hairBase: '#806f62',
      hairShadow: '#514640',
      glasses: '#203d34',
    });
    const first = recordingContext();
    const repeated = recordingContext();
    drawVioletGlasses(first);
    drawVioletGlasses(repeated);
    expect(first.calls).toEqual(repeated.calls);
    expect(first.calls.filter(([name]) => name === 'quadraticCurveTo').length).toBeGreaterThanOrEqual(10);
    expect(first.calls.some(([name]) => name === 'fill')).toBe(true);
    expect(first.calls.filter(([name]) => name === 'stroke').length).toBeGreaterThanOrEqual(4);
    expect(first.depth).toBe(0);

    const worldPuppet = recordingContext();
    const dialoguePortrait = recordingContext();
    const renderer = new CharacterRenderer();
    renderer.draw(worldPuppet, { kind: 'violet', x: 0, y: 0, facing: 'right' }, 0.75);
    renderer.drawPortrait(dialoguePortrait, { speaker: 'Violet', x: 0, y: 0 }, 0.75);
    for (const surface of [worldPuppet, dialoguePortrait]) {
      expect(surface.styles).toContainEqual(['fillStyle', VIOLET_STYLE.hairBase]);
      expect(surface.styles).toContainEqual(['strokeStyle', VIOLET_STYLE.glasses]);
    }
  });

  it('keeps cat and toad follow motion deterministic, bounded, and calmer in reduced motion', () => {
    for (const type of ['cat', 'toad']) {
      const input = { type, pose: 'pet-follow', time: 0.25 };
      const full = sampleCompanionMotion(input);
      const repeated = sampleCompanionMotion(input);
      const reduced = sampleCompanionMotion({ ...input, reducedMotion: true });
      expect(repeated).toEqual(full);
      expect(Object.values(full).every(Number.isFinite)).toBe(true);
      expect(Math.abs(full.tilt)).toBeLessThan(0.08);
      expect(full.hop).toBeGreaterThanOrEqual(0);
      expect(Math.abs(reduced.tilt)).toBeLessThan(Math.abs(full.tilt));
      expect(reduced.hop).toBeLessThan(full.hop);
    }

    const idleCat = sampleCompanionMotion({ type: 'cat', pose: 'idle', time: 0.25 });
    const pawingCat = sampleCompanionMotion({ type: 'cat', pose: 'paw', time: 0.25 });
    const reducedPawingCat = sampleCompanionMotion({
      type: 'cat', pose: 'paw', time: 0.25, reducedMotion: true,
    });
    expect(idleCat.pawLift).toBe(0);
    expect(pawingCat.pawLift).toBeGreaterThan(0.4);
    expect(reducedPawingCat.pawLift).toBeLessThan(pawingCat.pawLift);
  });
});
