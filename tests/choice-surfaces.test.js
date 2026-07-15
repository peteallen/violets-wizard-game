import { describe, expect, it, vi } from 'vitest';
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
    'fillRect', 'fillText', 'lineTo', 'moveTo', 'quadraticCurveTo', 'rect', 'restore',
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
  it('previews the real companion puppets on three organic shop tags', () => {
    const characterRenderer = { draw: vi.fn() };
    const renderer = new UIRenderer({ characterRenderer });
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

    expect(renderer.drawChoices(context, choices, 12, true)).toEqual(dialogueChoiceLayout(3));
    expect(choices.map(({ __rect }) => __rect)).toEqual(dialogueChoiceLayout(3));
    expectGenerousDisjointRects(choices.map(({ __rect }) => __rect));
    expect(characterRenderer.draw.mock.calls.map(([, request, time]) => ({
      characterId: request.characterId,
      surface: request.surface,
      scale: request.scale,
      pose: request.pose,
      reducedMotion: request.reducedMotion,
      time,
    }))).toEqual([
      {
        characterId: 'character.cat', surface: 'world', scale: 0.82,
        pose: 'idle', reducedMotion: true, time: 0,
      },
      {
        characterId: 'character.pet-owl', surface: 'world', scale: 0.72,
        pose: 'idle', reducedMotion: true, time: 0,
      },
      {
        characterId: 'character.toad', surface: 'world', scale: 1.18,
        pose: 'idle', reducedMotion: true, time: 0,
      },
    ]);
    expect(new Set(context.texts)).toEqual(new Set(['Cat', 'Owl', 'Toad']));
    expect(context.calls.some(([name]) => [
      'arc', 'arcTo', 'ellipse', 'rect', 'roundRect', 'setLineDash', 'strokeRect',
    ].includes(name))).toBe(false);
    expect(context.calls.filter(([name]) => name === 'bezierCurveTo').length).toBeGreaterThan(45);
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
