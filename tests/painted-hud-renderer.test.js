import { afterEach, describe, expect, it, vi } from 'vitest';
import { UIRenderer } from '../src/game/render/UIRenderer.js';
import {
  drawBrassWandHolster,
  drawCompassQuest,
  drawLeatherSatchel,
} from '../src/game/render/uiIllustrations.js';

function recordingContext() {
  const calls = [];
  const paintEvents = [];
  const methods = new Set([
    'beginPath', 'bezierCurveTo', 'closePath', 'drawImage', 'fill', 'moveTo',
    'quadraticCurveTo', 'restore', 'rotate', 'save', 'scale', 'stroke', 'translate',
  ]);
  const target = { calls, paintEvents, globalAlpha: 1 };
  return new Proxy(target, {
    get(object, property) {
      if (!methods.has(property)) return object[property];
      return (...args) => {
        calls.push([property, ...args]);
        if (property === 'fill') paintEvents.push(['fill', object.fillStyle, object.globalAlpha]);
        if (property === 'stroke') {
          paintEvents.push(['stroke', object.strokeStyle, object.globalAlpha]);
        }
      };
    },
    set(object, property, value) {
      object[property] = value;
      return true;
    },
  });
}

function readyImage(id) {
  return { id, complete: true, naturalWidth: 512, naturalHeight: 512 };
}

function pendingImage(id) {
  return { id, complete: false, naturalWidth: 0, naturalHeight: 0 };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('painted HUD art', () => {
  it('layers the painted props under the existing contact shadows, pulse, and wand spark', () => {
    const rect = { x: 20, y: 30, width: 108, height: 108 };
    const satchelImage = readyImage('satchel');
    const compassBase = readyImage('compass-base');
    const compassNeedle = readyImage('compass-needle');
    const holsterImage = readyImage('holster');
    const wandImage = readyImage('wand');

    const satchel = recordingContext();
    drawLeatherSatchel(satchel, rect, { image: satchelImage });
    expect(satchel.calls.filter(([method]) => method === 'drawImage')).toEqual([
      ['drawImage', satchelImage, 20, 30, 108, 108],
    ]);

    const compass = recordingContext();
    drawCompassQuest(compass, rect, 1.25, {
      pulse: true,
      baseImage: compassBase,
      needleImage: compassNeedle,
    });
    const compassImages = compass.calls.filter(([method]) => method === 'drawImage');
    expect(compassImages).toHaveLength(2);
    expect(compassImages[0][1]).toBe(compassBase);
    expect(compassImages[1][1]).toBe(compassNeedle);
    expect(compass.calls).toContainEqual(['translate', 74, 84]);
    expect(compass.calls).toContainEqual(['rotate', -0.12]);
    expect(compassImages[0][2] + (254.5 / 512) * compassImages[0][4]).toBeCloseTo(0);
    expect(compassImages[0][3] + (290.5 / 512) * compassImages[0][5]).toBeCloseTo(0);
    expect(compassImages[1][4]).toBeCloseTo(108 * 0.54);
    expect(compassImages[1][2] + (255.4 / 512) * compassImages[1][4]).toBeCloseTo(0);
    expect(compassImages[1][3] + (307 / 512) * compassImages[1][5]).toBeCloseTo(0);

    const wand = recordingContext();
    drawBrassWandHolster(wand, rect, {
      enabled: true,
      time: 1.25,
      holsterImage,
      wandImage,
    });
    expect(wand.calls.filter(([method]) => method === 'drawImage')).toEqual([
      ['drawImage', wandImage, -54, -54, 108, 108],
      ['drawImage', holsterImage, -54, -54, 108, 108],
    ]);
    expect(wand.calls).toContainEqual(['translate', 0, -108 * 0.16]);
    const glow = 108 * (0.062 + (Math.sin(1.25 * 3.1) + 1) * 0.009);
    const sparkStart = wand.calls.findLast(([method]) => method === 'moveTo');
    expect(sparkStart[2] + glow * 0.48).toBeCloseTo(-108 * (0.465 + 0.16));
    expect(wand.paintEvents).toContainEqual(['fill', '#ffd76a', 1]);
    expect(wand.paintEvents).toContainEqual(['fill', '#fff1b8', 1]);

    const shadowStyles = ['rgba(27, 18, 28, 0.17)', 'rgba(27, 18, 28, 0.34)'];
    for (const context of [satchel, compass, wand]) {
      expect(context.paintEvents.slice(0, 2).map(([, style]) => style)).toEqual(shadowStyles);
    }
  });

  it('switches paired props atomically and keeps every vector fallback available', () => {
    const rect = { x: 20, y: 30, width: 108, height: 108 };
    const compass = recordingContext();
    drawCompassQuest(compass, rect, 0, {
      baseImage: readyImage('compass-base'),
      needleImage: pendingImage('compass-needle'),
    });
    expect(compass.calls.some(([method]) => method === 'drawImage')).toBe(false);
    expect(compass.calls.filter(([method]) => method === 'bezierCurveTo').length)
      .toBeGreaterThan(10);

    const holster = recordingContext();
    drawBrassWandHolster(holster, rect, {
      holsterImage: readyImage('holster'),
      wandImage: pendingImage('wand'),
    });
    expect(holster.calls.some(([method]) => method === 'drawImage')).toBe(false);
    expect(holster.calls.filter(([method]) => method === 'bezierCurveTo').length)
      .toBeGreaterThan(10);

    const openSatchel = recordingContext();
    drawLeatherSatchel(openSatchel, rect, {
      open: true,
      image: readyImage('closed-satchel'),
    });
    expect(openSatchel.calls.some(([method]) => method === 'drawImage')).toBe(false);
    expect(openSatchel.paintEvents).toContainEqual(['fill', '#2d2020', 1]);
  });

  it('resolves the five manifest keys and freezes painted animation for reduced motion', () => {
    class ReadyImage {
      constructor() {
        this.complete = true;
        this.naturalWidth = 512;
        this.naturalHeight = 512;
      }

      set src(value) {
        this.url = value;
      }

      get src() {
        return this.url;
      }
    }
    vi.stubGlobal('Image', ReadyImage);
    const resolveAsset = vi.fn((key) => `/resolved/${key}.webp`);
    const renderer = new UIRenderer({
      resolveAsset,
      characterRenderer: { draw: vi.fn() },
    });
    const state = {
      screen: 'playing',
      overlay: null,
      dialogue: null,
      selection: null,
      newObjective: true,
      hasSatchel: true,
      hasWand: true,
      affordances: {},
    };
    const early = recordingContext();
    const late = recordingContext();

    renderer.drawHud(early, state, 1.25, true);
    renderer.drawHud(late, state, 91, true);

    expect(resolveAsset.mock.calls.map(([key]) => key)).toEqual([
      'ui/hud/quest-compass-base',
      'ui/hud/quest-compass-needle',
      'ui/hud/satchel-closed',
      'ui/hud/wand-holster',
      'ui/hud/wands/violet-first-wand',
    ]);
    expect(early.calls.filter(([method]) => method === 'drawImage').map(([, image]) => image.src))
      .toEqual([
        '/resolved/ui/hud/quest-compass-base.webp',
        '/resolved/ui/hud/quest-compass-needle.webp',
        '/resolved/ui/hud/satchel-closed.webp',
        '/resolved/ui/hud/wands/violet-first-wand.webp',
        '/resolved/ui/hud/wand-holster.webp',
      ]);
    expect(late.calls).toEqual(early.calls);
  });

  it('decodes every UI image before a deterministic harness frame is captured', async () => {
    const decoded = [];
    class DecodedImage {
      constructor() {
        this.complete = false;
        this.naturalWidth = 0;
        this.naturalHeight = 0;
      }

      set src(value) {
        this.url = value;
      }

      get src() {
        return this.url;
      }

      async decode() {
        decoded.push(this.url);
        this.complete = true;
        this.naturalWidth = 512;
        this.naturalHeight = 512;
      }
    }
    vi.stubGlobal('Image', DecodedImage);
    const resolveAsset = vi.fn((key) => `/resolved/${key}`);
    const renderer = new UIRenderer({
      resolveAsset,
      characterRenderer: { draw: vi.fn() },
    });

    await renderer.preloadUiImages();

    const resolvedKeys = resolveAsset.mock.calls.map(([key]) => key);
    expect(resolvedKeys).toEqual(expect.arrayContaining([
      'ui/title/backdrop-v2',
      'ui/objective/reminder-v2',
      'ui/hud/satchel-closed',
      'ui/hud/quest-compass-base',
      'ui/hud/quest-compass-needle',
      'ui/hud/wand-holster',
      'ui/hud/wands/violet-first-wand',
      'ui/satchel/spread-v2',
      'cards/jocunda-sykes/portrait',
    ]));
    expect(decoded).toHaveLength(resolvedKeys.length);
    expect(decoded).toContain('/resolved/ui/hud/quest-compass-base');

    const hudOnlyResolve = vi.fn((key) => `/hud-only/${key}`);
    const hudOnlyRenderer = new UIRenderer({
      resolveAsset: hudOnlyResolve,
      characterRenderer: { draw: vi.fn() },
    });
    await hudOnlyRenderer.preloadUiImages({ title: false, hud: true, satchel: false });
    expect(hudOnlyResolve.mock.calls.map(([key]) => key)).toEqual([
      'ui/objective/reminder-v2',
      'ui/hud/satchel-closed',
      'ui/hud/quest-compass-base',
      'ui/hud/quest-compass-needle',
      'ui/hud/wand-holster',
      'ui/hud/wands/violet-first-wand',
    ]);
  });
});
