import { describe, expect, it } from 'vitest';
import {
  GuideFootprintRenderer,
  guideFootprintPresentation,
} from '../src/game/render/GuideFootprintRenderer.js';
import { createGuideWalkCueSnapshot } from '../src/game/world/GuideWalkCue.js';

function recordingContext() {
  const calls = [];
  let depth = 0;
  const methods = new Set([
    'beginPath', 'bezierCurveTo', 'closePath', 'fill', 'moveTo', 'quadraticCurveTo',
    'restore', 'rotate', 'save', 'scale', 'translate',
  ]);
  const target = { calls, globalAlpha: 1, get depth() { return depth; } };
  return new Proxy(target, {
    get(object, property) {
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
      object[property] = value;
      return true;
    },
  });
}

function cueAt(time, reducedMotion = false) {
  return createGuideWalkCueSnapshot({
    time,
    startedAt: 0,
    playerStart: { x: 360, y: 610 },
    reducedMotion,
  });
}

describe('guide sparkle-footprint renderer', () => {
  it('builds an alternating deterministic ground trail as the cue reveals', () => {
    const cue = cueAt(1.25);
    const first = guideFootprintPresentation(cue, 1.25);
    const replayed = guideFootprintPresentation(cue, 1.25);
    expect(first).toEqual(replayed);
    expect(first.footprints.length).toBeGreaterThanOrEqual(2);
    expect(new Set(first.footprints.map(({ side }) => side))).toEqual(new Set([-1, 1]));
    expect(first.footprints.every(({ alpha }) => alpha > 0 && alpha <= 1)).toBe(true);

    const cameraShifted = guideFootprintPresentation(cue, 1.25, { cameraX: 40 });
    for (let index = 0; index < first.footprints.length; index += 1) {
      expect(cameraShifted.footprints[index].x).toBeCloseTo(first.footprints[index].x - 40);
      expect(cameraShifted.footprints[index].y).toBe(first.footprints[index].y);
    }
  });

  it('keeps reduced-motion footprints still and draws only organic paths', () => {
    const cue = cueAt(0, true);
    const start = guideFootprintPresentation(cue, 0, { reducedMotion: true });
    const later = guideFootprintPresentation(cue, 8, { reducedMotion: true });
    expect(later).toEqual(start);

    const context = recordingContext();
    const renderer = new GuideFootprintRenderer();
    renderer.draw(context, { tapToWalkCue: cue, cameraX: 0 }, 0, { reducedMotion: true });
    expect(context.calls.filter(([name]) => name === 'fill').length).toBeGreaterThan(5);
    expect(context.calls.some(([name]) => name === 'bezierCurveTo')).toBe(true);
    expect(context.calls.some(([name]) => name === 'ellipse' || name === 'arc')).toBe(false);
    expect(context.depth).toBe(0);
  });

  it('renders nothing before the first footprint is revealed', () => {
    const context = recordingContext();
    const renderer = new GuideFootprintRenderer();
    renderer.draw(context, { tapToWalkCue: cueAt(0), cameraX: 0 }, 0);
    expect(context.calls).toEqual([]);
  });
});
