import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  dialogueChoiceLayout,
  UIRenderer,
} from '../src/game/render/UIRenderer.js';

function recordingContext() {
  const assignments = [];
  const calls = [];
  const texts = [];
  let depth = 0;
  const methods = new Set([
    'arc', 'arcTo', 'beginPath', 'bezierCurveTo', 'clip', 'closePath', 'ellipse', 'fill',
    'drawImage', 'fillRect', 'fillText', 'lineTo', 'moveTo', 'quadraticCurveTo', 'rect', 'restore',
    'rotate', 'roundRect', 'save', 'scale', 'setLineDash', 'stroke', 'strokeRect',
    'translate',
  ]);
  const target = {
    assignments,
    calls,
    texts,
    globalAlpha: 1,
    get depth() { return depth; },
  };
  return new Proxy(target, {
    get(object, property) {
      if (property === 'measureText') {
        return (value) => ({ width: String(value).length * 12 });
      }
      if (methods.has(property)) {
        return (...args) => {
          calls.push([property, ...args]);
          if (property === 'fillText') texts.push(String(args[0]));
          if (property === 'save') depth += 1;
          if (property === 'restore') depth -= 1;
        };
      }
      return object[property];
    },
    set(object, property, value) {
      assignments.push([property, value]);
      object[property] = value;
      return true;
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function overlaps(first, second) {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

function expectGenerousDisjointRects(rects) {
  for (const rect of rects) {
    expect(rect.width).toBeGreaterThanOrEqual(88);
    expect(rect.height).toBeGreaterThanOrEqual(88);
  }
  for (let first = 0; first < rects.length; first += 1) {
    for (let second = first + 1; second < rects.length; second += 1) {
      expect(overlaps(rects[first], rects[second])).toBe(false);
    }
  }
}

describe('illustrated choice and selection surfaces', () => {
  it('layers the decoded painted tag under the exact live pet and caption geometry', async () => {
    const decoded = [];
    class ReadyImage {
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
        this.naturalWidth = 640;
        this.naturalHeight = 586;
      }
    }
    vi.stubGlobal('Image', ReadyImage);
    const characterRenderer = { draw: vi.fn() };
    const resolveAsset = vi.fn((key) => `/resolved/${key}.webp`);
    const renderer = new UIRenderer({ characterRenderer, resolveAsset });
    const context = recordingContext();
    const choices = [
      {
        id: 'petCat', icon: 'pet-cat', caption: 'Cat',
        characterId: 'character.cat', characterScale: 0.82,
      },
      {
        id: 'petOwl', icon: 'pet-owl', caption: 'Owl',
        characterId: 'character.pet-owl', characterScale: 0.72,
      },
      {
        id: 'petToad', icon: 'pet-toad', caption: 'Toad',
        characterId: 'character.toad', characterScale: 1.18,
      },
    ];

    await renderer.preloadUiImages({
      title: false,
      hud: false,
      satchel: false,
      choices: true,
    });
    expect(renderer.drawChoices(context, choices, 12, true)).toEqual(dialogueChoiceLayout(3));
    expect(choices.map(({ __rect }) => __rect)).toEqual(dialogueChoiceLayout(3));
    expectGenerousDisjointRects(choices.map(({ __rect }) => __rect));
    expect(characterRenderer.draw.mock.calls.map(([, request, time]) => ({
      characterId: request.characterId,
      surface: request.surface,
      x: request.x,
      y: request.y,
      scale: request.scale,
      pose: request.pose,
      facing: request.facing,
      reducedMotion: request.reducedMotion,
      time,
    }))).toEqual([
      {
        characterId: 'character.cat', surface: 'world', x: 324, y: 380, scale: 0.82,
        pose: 'idle', facing: 'right', reducedMotion: true, time: 0,
      },
      {
        characterId: 'character.pet-owl', surface: 'world', x: 640, y: 380, scale: 0.72,
        pose: 'idle', facing: 'right', reducedMotion: true, time: 0,
      },
      {
        characterId: 'character.toad', surface: 'world', x: 956, y: 380, scale: 1.18,
        pose: 'idle', facing: 'right', reducedMotion: true, time: 0,
      },
    ]);
    expect(resolveAsset).toHaveBeenCalledOnce();
    expect(resolveAsset).toHaveBeenCalledWith('ui/story/choice-tag-v2');
    expect(decoded).toEqual(['/resolved/ui/story/choice-tag-v2.webp']);
    const imageCalls = context.calls.filter(([name]) => name === 'drawImage');
    expect(new Set(imageCalls.map(([, image]) => image))).toHaveProperty('size', 1);
    expect(imageCalls.map(([, image, x, y, width, height]) => ({
      src: image.src, x, y, width, height,
    }))).toEqual(dialogueChoiceLayout(3).map((rect) => ({
      src: '/resolved/ui/story/choice-tag-v2.webp',
      ...rect,
    })));
    expect(new Set(context.texts)).toEqual(new Set(['Cat', 'Owl', 'Toad']));
    expect(context.calls.filter(([name]) => name === 'fillText')).toEqual([
      ['fillText', 'Cat', 324, 440],
      ['fillText', 'Owl', 640, 440],
      ['fillText', 'Toad', 956, 440],
    ]);
    expect(context.calls.some(([name]) => [
      'arc', 'arcTo', 'ellipse', 'rect', 'roundRect', 'setLineDash', 'strokeRect',
    ].includes(name))).toBe(false);
    expect(context.calls.filter(([name]) => name === 'bezierCurveTo')).toHaveLength(12);
    expect(context.assignments.filter((assignment) => (
      assignment[0] === 'fillStyle' && assignment[1] === 'rgba(48,31,29,0.26)'
    ))).toHaveLength(3);
    expect(context.depth).toBe(0);
  });

  it('retains the organic vector shell fallback and exact emblem geometry', () => {
    const renderer = new UIRenderer({ characterRenderer: { draw: vi.fn() } });
    const context = recordingContext();
    const choices = [
      { id: 'petConfirm', icon: 'wax-check', caption: 'Yes!' },
      { id: 'petLookAgain', icon: 'eyes', caption: 'Look again' },
    ];

    expect(renderer.drawReviewScene(context, 'ui-choices-review')).toBe(false);
    expect(renderer.drawReviewScene(context, 'ui-choice-icons-review')).toBe(false);
    expect(renderer.drawChoices(context, choices)).toEqual(dialogueChoiceLayout(2));
    expect(choices.map(({ __rect }) => __rect)).toEqual(dialogueChoiceLayout(2));
    expect(context.calls.some(([name]) => name === 'drawImage')).toBe(false);
    expect(context.calls.filter(([name]) => name === 'bezierCurveTo').length)
      .toBeGreaterThan(35);
    expect(context.calls.filter(([name, , y]) => name === 'translate' && y === 294)).toEqual([
      ['translate', 482, 294],
      ['translate', 798, 294],
    ]);
    expect(context.calls.filter(([name]) => name === 'fillText')).toEqual([
      ['fillText', 'Yes!', 482, 440],
      ['fillText', 'Look again', 798, 440],
    ]);
    expect(context.depth).toBe(0);
  });

  it('subdues the live room behind choice cards without replacing it', () => {
    const renderer = new UIRenderer({ characterRenderer: { draw: vi.fn() } });
    const context = recordingContext();
    const choices = [
      { id: 'petConfirm', icon: 'wax-check', caption: 'Yes!' },
      { id: 'petLookAgain', icon: 'eyes', caption: 'Look again' },
    ];

    expect(renderer.drawDialogue(context, { type: 'choice', choices }, 0, true, true)).toBeNull();
    expect(context.assignments).toContainEqual(['fillStyle', 'rgba(20,17,38,0.56)']);
    expect(context.calls).toContainEqual(['fillRect', 0, 0, 1280, 720]);
    expect(context.depth).toBe(0);
  });

  it('replaces perfect selection circles with organic multi-tone emblems', () => {
    const renderer = new UIRenderer({ characterRenderer: { draw: () => {} } });
    const context = recordingContext();
    const selection = {
      title: 'Choose one',
      options: [
        { id: 'wand', icon: 'wand', label: 'Wand', color: '#6e4b68' },
        { id: 'quill', icon: 'quill', label: 'Quill', color: '#4f6c75' },
      ],
    };

    const rects = renderer.drawSelection(context, selection);
    expectGenerousDisjointRects(rects);
    expect(context.assignments).toContainEqual(['fillStyle', '#6e4b68']);
    expect(context.assignments).toContainEqual(['fillStyle', '#4f6c75']);
    expect(new Set(context.texts)).toEqual(new Set(['Choose one', 'Wand', 'Quill']));
    expect(context.calls.some(([name]) => [
      'arc', 'arcTo', 'ellipse', 'rect', 'roundRect', 'setLineDash', 'strokeRect',
    ].includes(name))).toBe(false);
    expect(context.depth).toBe(0);
  });
});
