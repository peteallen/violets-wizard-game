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
import { STORYBOOK_INK, STORYBOOK_LINE_WEIGHT } from '../src/game/render/storybookInk.js';

function recordingContext() {
  const calls = [];
  const paintEvents = [];
  const propertyWrites = [];
  let depth = 0;
  const methods = new Set([
    'arc', 'arcTo', 'beginPath', 'bezierCurveTo', 'clip', 'closePath', 'ellipse', 'fill', 'fillRect',
    'fillText', 'lineTo', 'moveTo', 'quadraticCurveTo', 'rect', 'restore', 'rotate', 'roundRect',
    'save', 'scale', 'setLineDash', 'stroke', 'translate',
  ]);
  const target = {
    calls,
    paintEvents,
    propertyWrites,
    globalAlpha: 1,
    get depth() { return depth; },
  };
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
          if (property === 'fill') {
            paintEvents.push(['fill', object.fillStyle, object.globalAlpha]);
          } else if (property === 'stroke') {
            paintEvents.push(['stroke', object.strokeStyle, object.globalAlpha]);
          }
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
  it('uses the shared storybook ink family with separate contour and emphasis weights', () => {
    const context = recordingContext();
    drawCompassQuest(context, { x: 20, y: 20, width: 104, height: 104 }, 0, { pulse: false });
    drawVectorIcon(context, 'name-pip', 180, 72, 88);

    const colors = context.propertyWrites
      .filter(([property]) => property === 'fillStyle' || property === 'strokeStyle')
      .map(([, value]) => value);
    const lineWidths = context.propertyWrites
      .filter(([property, value]) => property === 'lineWidth' && Number.isFinite(value))
      .map(([, value]) => value);
    for (const ink of Object.values(STORYBOOK_INK)) expect(colors).toContain(ink);
    expect(lineWidths).toContain(STORYBOOK_LINE_WEIGHT.contour);
    expect(lineWidths).toContain(STORYBOOK_LINE_WEIGHT.emphasis);
    expect(new Set(lineWidths).size).toBeGreaterThan(1);
  });

  it('draws every authored choice icon deterministically without text glyph stand-ins', () => {
    const icons = [
      'owl', 'cat', 'toad', 'wand', 'eyes', 'map', 'cards', 'replay', 'quill', 'satchel',
      'quest', 'close', 'check', 'speaker', 'name-biscuit', 'name-pip', 'name-custom', 'name-star',
      'heart', 'rose', 'circle', 'star',
      'icons/ch2/every-flavor-beans', 'icons/ch2/chocolate-frog', 'icons/ch2/cauldron-cake',
      'icons/ch2/protect-friends', 'icons/ch2/explore-mysteries', 'icons/ch2/help-someone',
      'icons/ch2/step-forward', 'icons/ch2/tell-truth', 'icons/ch2/stay-close',
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
      'name-biscuit', 'name-pip', 'name-custom',
      'icons/ch2/every-flavor-beans', 'icons/ch2/chocolate-frog', 'icons/ch2/cauldron-cake',
      'icons/ch2/protect-friends', 'icons/ch2/explore-mysteries', 'icons/ch2/help-someone',
      'icons/ch2/step-forward', 'icons/ch2/tell-truth', 'icons/ch2/stay-close',
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

  it('gives every Chapter Two sweet and Sorting answer its own readable icon silhouette', () => {
    const icons = [
      'icons/ch2/every-flavor-beans',
      'icons/ch2/chocolate-frog',
      'icons/ch2/cauldron-cake',
      'icons/ch2/protect-friends',
      'icons/ch2/explore-mysteries',
      'icons/ch2/help-someone',
      'icons/ch2/step-forward',
      'icons/ch2/tell-truth',
      'icons/ch2/stay-close',
    ];
    const fingerprints = icons.map((icon) => {
      const context = recordingContext();
      drawVectorIcon(context, icon, 0, 0, 100);
      expect(context.calls.some(([method]) => method === 'fillText'), icon).toBe(false);
      return JSON.stringify(context.calls);
    });
    const fallback = recordingContext();
    drawVectorIcon(fallback, 'unregistered-choice-icon', 0, 0, 100);

    expect(new Set(fingerprints).size).toBe(icons.length);
    expect(fingerprints).not.toContain(JSON.stringify(fallback.calls));
  });

  it('pools wax controls from layered curves instead of straight-edged polygons', () => {
    const forbiddenGeometry = new Set([
      'arc', 'arcTo', 'ellipse', 'lineTo', 'rect', 'roundRect', 'setLineDash',
    ]);
    const variants = [
      ['close', {}],
      ['speaker', { danger: true }],
      ['owl', { selected: true }],
    ];

    for (const [icon, options] of variants) {
      const first = recordingContext();
      const second = recordingContext();
      drawWaxIcon(first, 80, 80, 38, icon, options);
      drawWaxIcon(second, 80, 80, 38, icon, options);

      expect(first.calls, `${icon} seal geometry should be deterministic`).toEqual(second.calls);
      expect(first.propertyWrites, `${icon} seal palette should be deterministic`)
        .toEqual(second.propertyWrites);
      expect(first.calls.some(([method]) => forbiddenGeometry.has(method)), icon).toBe(false);
      expect(first.calls.filter(([method]) => method === 'quadraticCurveTo').length, icon)
        .toBeGreaterThan(50);
      expect(first.calls.filter(([method]) => method === 'fill').length, icon)
        .toBeGreaterThanOrEqual(6);
      expect(first.calls.filter(([method]) => method === 'stroke').length, icon)
        .toBeGreaterThanOrEqual(3);
      expect(first.depth, `${icon} seal should restore Canvas state`).toBe(0);
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
    const forbiddenGeometry = new Set([
      'arc', 'arcTo', 'ellipse', 'fillRect', 'lineTo', 'rect', 'roundRect', 'setLineDash',
    ]);

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
        'createLinearGradient', 'createRadialGradient',
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

  it('grounds every persistent HUD object with exactly two painted organic shadow passes', () => {
    const rect = { x: 20, y: 20, width: 108, height: 108 };
    const drawings = [
      ['satchel', (context) => drawLeatherSatchel(context, rect)],
      ['compass', (context) => drawCompassQuest(context, rect, 0, { pulse: false })],
      ['holster', (context) => drawBrassWandHolster(
        context,
        rect,
        { enabled: true, time: 0 },
      )],
    ];
    const shadowStyles = [
      'rgba(27, 18, 28, 0.17)',
      'rgba(27, 18, 28, 0.34)',
    ];

    for (const [name, draw] of drawings) {
      const context = recordingContext();
      draw(context);
      const shadowPaints = context.paintEvents.filter(
        ([method, style]) => method === 'fill' && shadowStyles.includes(style),
      );

      expect(context.paintEvents.slice(0, 2), `${name} shadows should sit behind the object`)
        .toEqual([
          ['fill', shadowStyles[0], 1],
          ['fill', shadowStyles[1], 1],
        ]);
      expect(shadowPaints, `${name} should have one soft and one core contact shadow`)
        .toEqual([
          ['fill', shadowStyles[0], 1],
          ['fill', shadowStyles[1], 1],
        ]);
      expect(context.calls.slice(1, 7).map(([method]) => method), name).toEqual([
        'beginPath', 'moveTo', 'bezierCurveTo', 'bezierCurveTo', 'closePath', 'fill',
      ]);
      expect(context.calls.slice(7, 13).map(([method]) => method), name).toEqual([
        'beginPath', 'moveTo', 'bezierCurveTo', 'bezierCurveTo', 'closePath', 'fill',
      ]);
      expect(context.depth, name).toBe(0);
    }
  });

  it('keeps the satchel, compass, and wand identifiable through object-specific material marks', () => {
    const rect = { x: 20, y: 20, width: 108, height: 108 };
    const satchel = recordingContext();
    const compass = recordingContext();
    const wand = recordingContext();
    drawLeatherSatchel(satchel, rect);
    drawCompassQuest(compass, rect, 0, { pulse: false });
    drawBrassWandHolster(wand, rect, { enabled: true, time: 0 });

    const fillStyles = (context) => context.paintEvents
      .filter(([method]) => method === 'fill')
      .map(([, style]) => style);
    const strokeStyles = (context) => context.paintEvents
      .filter(([method]) => method === 'stroke')
      .map(([, style]) => style);

    const satchelFills = fillStyles(satchel);
    for (const leatherPlane of ['#6d452d', '#583725', '#a16e47', '#7d5134', '#68412a']) {
      expect(satchelFills, `satchel should retain leather plane ${leatherPlane}`)
        .toContain(leatherPlane);
    }
    for (const claspTone of ['#c99b43', '#f6d58a']) expect(satchelFills).toContain(claspTone);
    expect(satchelFills.filter((style) => style === '#4d2430'))
      .toHaveLength(3);

    const compassFills = fillStyles(compass);
    for (const compassMaterial of [
      '#76522c', '#c89d45', '#f7d992', '#f3e6ca',
      '#a86f36', '#70416e', '#b987b0', 'rgba(222, 241, 239, 0.34)',
    ]) expect(compassFills).toContain(compassMaterial);
    expect(compassFills.indexOf('rgba(222, 241, 239, 0.34)'))
      .toBeGreaterThan(compassFills.indexOf('#70416e'));

    const wandFills = fillStyles(wand);
    for (const holsterMaterial of [
      '#a96f47', '#e0b07b', '#4b3025', '#3a2721', '#d0a450', '#f4d58d',
    ]) expect(wandFills).toContain(holsterMaterial);
    expect(strokeStyles(wand).filter((style) => style === '#5b372a'))
      .toHaveLength(3);

    for (const context of [satchel, compass, wand]) {
      expect(context.calls.filter(([method]) => method === 'save').length)
        .toBe(context.calls.filter(([method]) => method === 'restore').length);
      expect(context.depth).toBe(0);
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
    expect(openSatchel.paintEvents).toContainEqual(['fill', '#2d2020', 1]);
    expect(openSatchel.paintEvents).toContainEqual(['fill', '#6f472e', 1]);
    expect(closedSatchel.paintEvents).toContainEqual(['fill', '#68412a', 1]);

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
    expect(enabledWand.paintEvents).toContainEqual(['fill', '#a96f47', 1]);
    expect(enabledWand.paintEvents).toContainEqual(['stroke', '#5b372a', 1]);
    expect(disabledWandEarly.paintEvents.some(([, style]) => [
      '#a96f47', '#e0b07b', '#5b372a', '#ffd76a', '#fff1b8',
    ].includes(style))).toBe(false);
    expect(disabledWandEarly.paintEvents).toContainEqual(['stroke', '#a5977f', 0.62]);

    for (const context of [
      closedSatchel, openSatchel, mutedSatchel,
      stillQuestEarly, stillQuestLate, pulsingQuest, pulsingQuestRepeat,
      disabledWandEarly, disabledWandLate, enabledWand, enabledWandRepeat,
    ]) expect(context.depth).toBe(0);
  });
});
