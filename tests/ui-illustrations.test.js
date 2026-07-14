import { describe, expect, it } from 'vitest';
import {
  drawBrassCameoFrame,
  drawBrassKeyhole,
  drawBrassWandHolster,
  drawCompassQuest,
  drawDeckledParchment,
  drawDialogueScroll,
  drawLeatherBookmark,
  drawLeatherSatchel,
  drawVectorIcon,
  drawWaxIcon,
  traceDeckledRect,
} from '../src/game/render/uiIllustrations.js';

function recordingContext() {
  const calls = [];
  const propertyWrites = [];
  let depth = 0;
  const methods = new Set([
    'arc', 'arcTo', 'beginPath', 'bezierCurveTo', 'clip', 'closePath', 'ellipse', 'fill', 'fillRect',
    'fillText', 'lineTo', 'moveTo', 'quadraticCurveTo', 'rect', 'restore', 'rotate', 'roundRect',
    'save', 'scale', 'setLineDash', 'stroke', 'translate',
  ]);
  const target = { calls, propertyWrites, globalAlpha: 1, get depth() { return depth; } };
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
      object[property] = value;
      propertyWrites.push([property, value]);
      return true;
    },
  });
}

describe('illustrated interface primitives', () => {
  it('draws every authored choice icon deterministically without text glyph stand-ins', () => {
    const icons = [
      'owl', 'cat', 'toad', 'wand', 'eyes', 'map', 'cards', 'replay', 'quill', 'satchel',
      'quest', 'close', 'check', 'speaker', 'name-biscuit', 'name-pip', 'name-star',
      'heart', 'rose', 'circle', 'star',
    ];
    for (const icon of icons) {
      const first = recordingContext();
      const second = recordingContext();
      drawVectorIcon(first, icon, 60, 70, 88);
      drawVectorIcon(second, icon, 60, 70, 88);
      expect(first.calls).toEqual(second.calls);
      expect(first.calls.length).toBeGreaterThan(5);
      expect(first.calls.some(([name]) => name === 'fillText')).toBe(false);
      expect(first.depth).toBe(0);
    }
  });

  it('builds every live child-facing icon from balanced organic storybook paths', () => {
    const icons = [
      'speaker', 'check', 'map', 'cards', 'close', 'replay', 'quill',
      'owl', 'cat', 'toad', 'wand', 'eyes', 'satchel', 'quest',
    ];
    const forbiddenGeometry = new Set([
      'arc', 'arcTo', 'ellipse', 'lineTo', 'rect', 'roundRect', 'setLineDash',
    ]);
    const pureNeutrals = new Set([
      '#000', '#0000', '#000000', '#00000000', '#000f', '#000000ff',
      '#fff', '#ffff', '#ffffff', '#ffffffff', 'black', 'white',
      'rgb(0,0,0)', 'rgba(0,0,0,1)', 'rgb(255,255,255)', 'rgba(255,255,255,1)',
    ]);

    for (const icon of icons) {
      const first = recordingContext();
      const second = recordingContext();
      drawVectorIcon(first, icon, 0, 0, 100);
      drawVectorIcon(second, icon, 0, 0, 100);

      expect(first.calls, `${icon} geometry should be deterministic`).toEqual(second.calls);
      expect(first.propertyWrites, `${icon} palette should be deterministic`)
        .toEqual(second.propertyWrites);
      expect(first.calls.some(([method]) => forbiddenGeometry.has(method)), icon).toBe(false);
      expect(first.calls.some(([method]) => method === 'fillText'), icon).toBe(false);

      const curves = first.calls.filter(([method]) => [
        'bezierCurveTo', 'quadraticCurveTo',
      ].includes(method));
      expect(curves.length, `${icon} should be shaped by authored curves`).toBeGreaterThan(10);
      expect(first.calls.filter(([method]) => method === 'fill').length, icon)
        .toBeGreaterThanOrEqual(2);
      expect(first.calls.filter(([method]) => method === 'stroke').length, icon)
        .toBeGreaterThanOrEqual(1);

      const numericGeometry = first.calls
        .flatMap(([, ...args]) => args.filter((value) => typeof value === 'number'));
      const numericProperties = first.propertyWrites
        .map(([, value]) => value)
        .filter((value) => typeof value === 'number');
      expect(numericGeometry.length, icon).toBeGreaterThan(50);
      expect(numericGeometry.every(Number.isFinite), icon).toBe(true);
      expect(numericProperties.every(Number.isFinite), icon).toBe(true);

      const materialTones = first.propertyWrites
        .filter(([property, value]) => ['fillStyle', 'strokeStyle'].includes(property)
          && typeof value === 'string')
        .map(([, value]) => value.toLowerCase().replaceAll(' ', ''));
      expect(new Set(materialTones).size, `${icon} should have painted light, body, and ink tones`)
        .toBeGreaterThanOrEqual(4);
      expect(materialTones.some((tone) => pureNeutrals.has(tone)), icon).toBe(false);

      expect(first.calls.filter(([method]) => method === 'save').length, icon)
        .toBe(first.calls.filter(([method]) => method === 'restore').length);
      expect(first.depth, `${icon} should restore Canvas state`).toBe(0);
    }
  });

  it('keeps the parchment, wax, brass, leather, compass, and holster drawings balanced', () => {
    const context = recordingContext();
    traceDeckledRect(context, 10, 12, 300, 160);
    drawDeckledParchment(context, { x: 10, y: 12, width: 300, height: 160 });
    drawDialogueScroll(context, { x: 20, y: 548, width: 760, height: 155 });
    drawDialogueScroll(context, { x: 20, y: 548, width: 760, height: 155 }, { night: true });
    drawWaxIcon(context, 80, 80, 38, 'owl');
    drawBrassCameoFrame(context, 100, 100, 70);
    drawBrassKeyhole(context, { x: 20, y: 20, width: 96, height: 96 }, { progress: 0.65 });
    drawLeatherBookmark(context, { x: 20, y: 20, width: 210, height: 88 }, { active: true });
    drawLeatherSatchel(context, { x: 20, y: 20, width: 108, height: 108 });
    drawCompassQuest(context, { x: 20, y: 20, width: 104, height: 104 }, 1.25, { pulse: true });
    drawBrassWandHolster(context, { x: 20, y: 20, width: 108, height: 108 }, { time: 1.25 });
    expect(context.calls.length).toBeGreaterThan(150);
    expect(context.depth).toBe(0);
  });

  it('renders both dialogue parchment palettes from the same deterministic deckled construction', () => {
    const first = recordingContext();
    const second = recordingContext();
    const night = recordingContext();
    const rect = { x: 250, y: 548, width: 780, height: 155 };
    drawDialogueScroll(first, rect);
    drawDialogueScroll(second, rect);
    drawDialogueScroll(night, rect, { night: true });

    expect(first.calls).toEqual(second.calls);
    expect(first.strokeStyle).not.toBe(night.strokeStyle);
    expect(first.calls.filter(([name]) => name === 'quadraticCurveTo').length).toBeGreaterThan(15);
    expect(first.depth).toBe(0);
    expect(night.depth).toBe(0);
  });

  it('turns the three-second grown-up hold into deterministic, clamped brass inlay progress', () => {
    const rect = { x: 20, y: 20, width: 96, height: 96 };
    const draw = (progress) => {
      const context = recordingContext();
      drawBrassKeyhole(context, rect, { progress });
      return context;
    };
    const empty = draw(0);
    const emptyRepeat = draw(0);
    const underflow = draw(-0.4);
    const nonFinite = draw(Number.NaN);
    const partial = draw(0.42);
    const full = draw(1);
    const overflow = draw(1.6);
    const interactiveWrites = (context) => context.propertyWrites
      .filter(([property, value]) => property === 'fillStyle' && value === '#ffd76a')
      .length;

    expect(empty.calls).toEqual(emptyRepeat.calls);
    expect(empty.propertyWrites).toEqual(emptyRepeat.propertyWrites);
    expect(underflow.calls).toEqual(empty.calls);
    expect(underflow.propertyWrites).toEqual(empty.propertyWrites);
    expect(nonFinite.calls).toEqual(empty.calls);
    expect(nonFinite.propertyWrites).toEqual(empty.propertyWrites);
    expect(overflow.calls).toEqual(full.calls);
    expect(overflow.propertyWrites).toEqual(full.propertyWrites);
    expect(partial.calls.length).toBeGreaterThan(empty.calls.length);
    expect(full.calls.length).toBeGreaterThan(partial.calls.length);
    expect(interactiveWrites(empty)).toBeLessThan(interactiveWrites(partial));
    expect(interactiveWrites(partial)).toBeLessThan(interactiveWrites(full));
  });

  it('builds the keyhole from organic, finite, layered brass paths with balanced Canvas state', () => {
    const forbiddenGeometry = new Set([
      'arc', 'arcTo', 'ellipse', 'fillRect', 'rect', 'roundRect', 'setLineDash',
      'createLinearGradient', 'createRadialGradient',
    ]);

    for (const progress of [0, 0.42, 1]) {
      const context = recordingContext();
      drawBrassKeyhole(
        context,
        { x: -14.5, y: 27.25, width: 117.5, height: 96.25 },
        { progress },
      );

      expect(context.calls.filter(([name]) => name === 'bezierCurveTo').length)
        .toBeGreaterThan(30);
      expect(context.calls.filter(([name]) => name === 'quadraticCurveTo').length)
        .toBeGreaterThan(20);
      expect(context.calls.some(([name]) => forbiddenGeometry.has(name))).toBe(false);
      expect(context.calls.some(([name]) => name === 'fillText')).toBe(false);
      expect(context.propertyWrites.some(([property]) => [
        'filter', 'shadowBlur', 'shadowColor',
      ].includes(property))).toBe(false);

      const numericGeometry = context.calls
        .flatMap(([, ...args]) => args.filter((value) => typeof value === 'number'));
      const numericProperties = context.propertyWrites
        .map(([, value]) => value)
        .filter((value) => typeof value === 'number');
      expect(numericGeometry.length).toBeGreaterThan(250);
      expect(numericGeometry.every(Number.isFinite)).toBe(true);
      expect(numericProperties.every(Number.isFinite)).toBe(true);

      const tones = new Set(context.propertyWrites
        .filter(([property, value]) => ['fillStyle', 'strokeStyle'].includes(property)
          && typeof value === 'string')
        .map(([, value]) => value));
      expect(tones.size).toBeGreaterThanOrEqual(14);
      for (const tone of ['#c89d45', '#f4d58d', '#76522c', '#ffd76a', '#2f2724']) {
        expect(tones.has(tone)).toBe(true);
      }
      expect(context.calls.filter(([name]) => name === 'save').length)
        .toBe(context.calls.filter(([name]) => name === 'restore').length);
      expect(context.depth).toBe(0);
    }
  });

  it('draws satchel tabs as stitched, multi-tone organic leather bookmarks', () => {
    const active = recordingContext();
    const inactive = recordingContext();
    drawLeatherBookmark(active, { x: 20, y: 20, width: 210, height: 88 }, { active: true });
    drawLeatherBookmark(inactive, { x: 20, y: 20, width: 210, height: 88 });

    expect(active.calls.filter(([name]) => name === 'fill').length).toBeGreaterThanOrEqual(4);
    expect(active.calls.filter(([name]) => name === 'stroke').length).toBeGreaterThan(12);
    expect(active.calls.some(([name]) => name === 'bezierCurveTo')).toBe(true);
    expect(active.calls.some(([name]) => [
      'arc', 'ellipse', 'fillRect', 'lineTo', 'rect', 'setLineDash',
    ].includes(name)))
      .toBe(false);
    expect(active.calls).not.toEqual(inactive.calls);
    expect(active.depth).toBe(0);
    expect(inactive.depth).toBe(0);
  });

  it('constructs each always-visible HUD object from deterministic organic materials', () => {
    const drawings = [
      ['satchel', (context) => drawLeatherSatchel(context, { x: 20, y: 20, width: 108, height: 108 })],
      ['quest', (context) => drawCompassQuest(
        context,
        { x: 20, y: 20, width: 104, height: 104 },
        1.25,
        { pulse: true },
      )],
      ['wand', (context) => drawBrassWandHolster(
        context,
        { x: 20, y: 20, width: 108, height: 108 },
        { enabled: true, time: 1.25 },
      )],
    ];
    const forbiddenGeometry = new Set(['arc', 'arcTo', 'ellipse', 'fillRect', 'rect', 'roundRect']);

    for (const [name, draw] of drawings) {
      const first = recordingContext();
      const second = recordingContext();
      draw(first);
      draw(second);

      expect(first.calls, `${name} should be deterministic`).toEqual(second.calls);
      expect(first.propertyWrites, `${name} material palette should be deterministic`)
        .toEqual(second.propertyWrites);
      expect(first.calls.filter(([method]) => method === 'bezierCurveTo').length, name)
        .toBeGreaterThan(12);
      expect(first.calls.some(([method]) => forbiddenGeometry.has(method)), name).toBe(false);
      expect(first.calls.some(([method]) => [
        'createLinearGradient', 'createRadialGradient', 'setLineDash',
      ].includes(method)), name).toBe(false);
      expect(first.propertyWrites.some(([property]) => [
        'filter', 'shadowBlur', 'shadowColor',
      ].includes(property)), name).toBe(false);

      const numericGeometry = first.calls.flatMap(([, ...args]) => args.filter((value) => typeof value === 'number'));
      expect(numericGeometry.length, name).toBeGreaterThan(30);
      expect(numericGeometry.every(Number.isFinite), name).toBe(true);

      const tones = new Set(first.propertyWrites
        .filter(([property, value]) => ['fillStyle', 'strokeStyle'].includes(property) && typeof value === 'string')
        .map(([, value]) => value));
      expect(tones.size, `${name} should have base, shadow, highlight, and material-mark tones`)
        .toBeGreaterThanOrEqual(7);
      expect(first.depth, `${name} should restore Canvas state`).toBe(0);
    }
  });

  it('keeps HUD animation deterministic and still when its reduced-motion inputs are still', () => {
    const rect = { x: 20, y: 20, width: 108, height: 108 };

    const closedSatchel = recordingContext();
    const openSatchel = recordingContext();
    const mutedSatchel = recordingContext();
    drawLeatherSatchel(closedSatchel, rect);
    drawLeatherSatchel(openSatchel, rect, { open: true });
    drawLeatherSatchel(mutedSatchel, rect, { muted: true });
    expect(openSatchel.calls).not.toEqual(closedSatchel.calls);
    expect(mutedSatchel.propertyWrites).toContainEqual(['globalAlpha', 0.55]);

    const stillQuestEarly = recordingContext();
    const stillQuestLate = recordingContext();
    const pulsingQuest = recordingContext();
    const pulsingQuestRepeat = recordingContext();
    drawCompassQuest(stillQuestEarly, rect, 0, { pulse: false });
    drawCompassQuest(stillQuestLate, rect, 91, { pulse: false });
    drawCompassQuest(pulsingQuest, rect, 1.25, { pulse: true });
    drawCompassQuest(pulsingQuestRepeat, rect, 1.25, { pulse: true });
    expect(stillQuestEarly.calls).toEqual(stillQuestLate.calls);
    expect(pulsingQuest.calls).toEqual(pulsingQuestRepeat.calls);
    expect(pulsingQuest.calls).not.toEqual(stillQuestEarly.calls);

    const disabledWandEarly = recordingContext();
    const disabledWandLate = recordingContext();
    const enabledWand = recordingContext();
    const enabledWandRepeat = recordingContext();
    drawBrassWandHolster(disabledWandEarly, rect, { enabled: false, time: 0 });
    drawBrassWandHolster(disabledWandLate, rect, { enabled: false, time: 91 });
    drawBrassWandHolster(enabledWand, rect, { enabled: true, time: 1.25 });
    drawBrassWandHolster(enabledWandRepeat, rect, { enabled: true, time: 1.25 });
    expect(disabledWandEarly.calls).toEqual(disabledWandLate.calls);
    expect(disabledWandEarly.propertyWrites).toEqual(disabledWandLate.propertyWrites);
    expect(enabledWand.calls).toEqual(enabledWandRepeat.calls);
    expect(enabledWand.calls).not.toEqual(disabledWandEarly.calls);

    for (const context of [
      closedSatchel, openSatchel, mutedSatchel,
      stillQuestEarly, stillQuestLate, pulsingQuest, pulsingQuestRepeat,
      disabledWandEarly, disabledWandLate, enabledWand, enabledWandRepeat,
    ]) expect(context.depth).toBe(0);
  });
});
