import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chapter1LetterLines } from '../src/game/content/chapters/ch1-letter.js';
import { ROBE_TRIMS } from '../src/game/core/RobeTrims.js';
import {
  UIRenderer,
  drawYearbookPageDots,
  isAllowedChildFacingUiText,
} from '../src/game/render/UIRenderer.js';
import { drawReplayRibbon } from '../src/game/render/uiPrimitives.js';

const setPieceSource = readFileSync(
  new URL('../src/game/render/SetPieceRenderer.js', import.meta.url),
  'utf8',
);
const uiPrimitiveSource = readFileSync(
  new URL('../src/game/render/uiPrimitives.js', import.meta.url),
  'utf8',
);
const pageSource = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function recordingContext() {
  const calls = [];
  const texts = [];
  const methods = new Set([
    'arc', 'arcTo', 'beginPath', 'bezierCurveTo', 'clip', 'closePath', 'drawImage', 'ellipse',
    'fill', 'fillRect', 'lineTo', 'moveTo', 'quadraticCurveTo', 'rect', 'restore', 'rotate',
    'save', 'scale', 'setLineDash', 'setTransform', 'stroke', 'strokeRect', 'transform', 'translate',
  ]);
  const target = { calls, texts, font: '28px "Andika"', globalAlpha: 1 };
  return new Proxy(target, {
    get(object, property) {
      if (property === 'createLinearGradient' || property === 'createRadialGradient') {
        return (...args) => {
          calls.push([property, ...args]);
          return { addColorStop: (...stop) => calls.push(['addColorStop', ...stop]) };
        };
      }
      if (property === 'measureText') {
        return (text) => ({ width: String(text).length * 10 });
      }
      if (property === 'fillText' || property === 'strokeText') {
        return (text, ...position) => {
          const value = String(text);
          texts.push(value);
          calls.push([property, value, ...position]);
        };
      }
      if (methods.has(property)) {
        return (...args) => calls.push([property, ...args]);
      }
      return object[property];
    },
    set(object, property, value) {
      object[property] = value;
      return true;
    },
  });
}

function visibleTexts(draw) {
  const context = recordingContext();
  draw(context);
  return [...new Set(context.texts.map((text) => text.trim()).filter(Boolean))];
}

function roleForVisibleText(text, { properNames = [], storyObjects = [], actions = [], symbols = [] } = {}) {
  if (storyObjects.includes(text)) return 'story-object';
  if (properNames.includes(text)) return 'proper-name';
  if (actions.includes(text)) return 'action';
  if (symbols.includes(text)) return 'symbol';
  return 'caption';
}

describe('player-visible copy', () => {
  it('expresses the D28 and D36 Canvas policy in semantic roles', () => {
    expect(isAllowedChildFacingUiText('Choose a pet', 'caption')).toBe(true);
    expect(isAllowedChildFacingUiText('Open Violet’s letter', 'action')).toBe(true);
    expect(isAllowedChildFacingUiText('Tap this glowing picture now', 'action')).toBe(false);
    expect(isAllowedChildFacingUiText('Platform Nine and Three-Quarters', 'proper-name')).toBe(true);
    expect(isAllowedChildFacingUiText(chapter1LetterLines[1], 'story-object')).toBe(true);
    expect(isAllowedChildFacingUiText('Settings and keepsakes for Violet’s adventure.', 'parent')).toBe(true);
    expect(isAllowedChildFacingUiText('‹', 'symbol')).toBe(true);
    expect(isAllowedChildFacingUiText('Previous', 'symbol')).toBe(false);
    expect(isAllowedChildFacingUiText('Still hidden', 'state')).toBe(false);
  });

  it('keeps each child-facing Canvas surface to captions, actions, names, and story text', () => {
    const renderer = new UIRenderer({ characterRenderer: { draw: () => {} } });
    const surfaces = [
      {
        name: 'title',
        draw: (context) => renderer.drawTitle(context, 0, false, true),
        expected: ['Violet', 'at Hogwarts', 'Open Violet’s letter'],
        roles: {
          properNames: ['Violet', 'at Hogwarts'],
          actions: ['Open Violet’s letter'],
        },
      },
      {
        name: 'letter',
        draw: (context) => renderer.drawLetterReading(context),
        expected: [...chapter1LetterLines, 'Hear the letter', 'Let’s go!'],
        roles: {
          storyObjects: [...chapter1LetterLines],
          actions: ['Hear the letter', 'Let’s go!'],
        },
      },
      {
        name: 'robe picker',
        draw: (context) => renderer.drawRobePicker(context, {
          overlay: { surface: 'robe-picker', selectedTrim: 'purple' },
        }, 0, true),
        expected: [
          'Choose a colour',
          ...ROBE_TRIMS.map(({ label }) => label),
          'That one!',
        ],
        roles: {
          actions: ['That one!'],
        },
      },
      {
        name: 'choices',
        draw: (context) => renderer.drawChoices(context, [
          { icon: 'owl', caption: 'Owl' },
          { icon: 'cat', caption: 'Cat' },
          { icon: 'toad', caption: 'Toad' },
        ]),
        expected: ['Owl', 'Cat', 'Toad'],
      },
      {
        name: 'satchel map',
        draw: (context) => renderer.drawSatchel(context, {
          overlay: { surface: 'satchel', tab: 'map' },
          roomId: 'ch1.diagonStreet',
          unlockedRooms: ['ch1.ollivanders', 'ch1.malkins'],
          objective: { mapStar: { room: 'ch1.diagonStreet', hotspot: 'street.malkinsDoor' } },
        }, [], { reducedMotion: true }),
        expected: ['Violet’s Satchel', 'Map', 'Cards'],
        roles: { properNames: ['Violet’s Satchel'] },
      },
      {
        name: 'satchel cards',
        draw: (context) => renderer.drawSatchel(context, {
          overlay: { surface: 'satchel', tab: 'cards' },
          cards: ['morgana'],
        }, [
          { id: 'morgana', name: 'Morgana', portraitAsset: null },
          { id: 'dumbledore', name: 'Dumbledore', portraitAsset: null },
        ]),
        expected: ['Violet’s Satchel', 'Morgana', 'Map', 'Cards'],
        roles: { properNames: ['Violet’s Satchel', 'Morgana'] },
      },
      {
        name: 'selection',
        draw: (context) => renderer.drawSelection(context, {
          title: 'Choose a pet',
          subtitle: 'Tap the one Violet likes best.',
          options: [
            { icon: 'owl', label: 'Owl' },
            { icon: 'cat', label: 'Cat' },
          ],
        }),
        expected: ['Choose a pet', 'Owl', 'Cat'],
      },
      {
        name: 'objective',
        draw: (context) => renderer.drawObjective(context, {
          caption: 'Choose a pet',
          text: 'Visit the Magical Menagerie with Hagrid.',
        }, 0, { reducedMotion: true }),
        expected: ['Choose a pet'],
      },
      {
        name: 'chapter card',
        draw: (context) => renderer.drawChapterCard(context, {
          eyebrow: 'Chapter One Complete',
          title: 'Platform Nine and Three-Quarters',
          subtitle: 'Next time: the Hogwarts Express!',
        }, 0, { reducedMotion: true }),
        expected: ['Platform Nine and Three-Quarters', 'Continue'],
        roles: {
          properNames: ['Platform Nine and Three-Quarters'],
          actions: ['Continue'],
        },
      },
      {
        name: 'yearbook',
        draw: (context) => renderer.drawYearbook(context, [
          { id: 'first', caption: 'First wand', dataUrl: null },
          { id: 'second', caption: 'New friend', dataUrl: null },
        ], 0),
        expected: ['Violet’s Yearbook', 'First wand', '‹', '›', 'Next'],
        roles: {
          properNames: ['Violet’s Yearbook'],
          actions: ['Next'],
          symbols: ['‹', '›'],
        },
      },
      {
        name: 'empty yearbook',
        draw: (context) => renderer.drawYearbook(context, []),
        expected: ['Violet’s Yearbook'],
        roles: { properNames: ['Violet’s Yearbook'] },
      },
    ];

    for (const surface of surfaces) {
      const texts = visibleTexts(surface.draw);
      expect(texts, surface.name).toEqual(surface.expected);
      for (const text of texts) {
        const role = roleForVisibleText(text, surface.roles);
        expect(isAllowedChildFacingUiText(text, role), `${surface.name}: ${text}`).toBe(true);
      }
    }
  });

  it('drops overlong dynamic helper copy at the child-facing renderer boundary', () => {
    const renderer = new UIRenderer({ characterRenderer: {} });
    const choiceTexts = visibleTexts((context) => renderer.drawChoices(context, [{
      icon: 'owl',
      caption: 'Tap this picture to choose the owl',
    }]));
    const objectiveTexts = visibleTexts((context) => renderer.drawObjective(context, {
      caption: 'Follow the glowing star over there',
      text: 'This helper sentence is never child-facing Canvas copy.',
    }, 0, { reducedMotion: true }));

    expect(choiceTexts).toEqual([]);
    expect(objectiveTexts).toEqual([]);
  });

  it('draws yearbook page dots as deterministic organic curves, never perfect geometry', () => {
    const context = recordingContext();

    drawYearbookPageDots(context, 3, 1);

    expect(context.calls.filter(([method]) => method === 'beginPath')).toHaveLength(3);
    expect(context.calls.filter(([method]) => method === 'moveTo')).toHaveLength(3);
    expect(context.calls.filter(([method]) => method === 'bezierCurveTo')).toHaveLength(12);
    expect(context.calls.filter(([method]) => method === 'closePath')).toHaveLength(3);
    expect(context.calls.some(([method]) => method === 'arc' || method === 'ellipse')).toBe(false);
  });

  it('keeps the removed story overlays out of the set-piece renderer', () => {
    expect(setPieceSource).not.toContain('THE WAND CHOOSES VIOLET');
    expect(setPieceSource).not.toContain('A PREVIEW OF CHAPTER TWO');
  });

  it('uses only Return as the replay ribbon default', () => {
    const context = recordingContext();

    drawReplayRibbon(context, { x: 20, y: 30, width: 320, height: 80 });

    const labels = context.calls
      .filter(([method]) => method === 'fillText')
      .map(([, text]) => text);
    expect(labels).toEqual(['↩', 'Return']);
    expect(uiPrimitiveSource).not.toContain('Return to saved game');
  });

  it('keeps the update actions and accessible status without visible helper prose', () => {
    expect(pageSource).not.toContain('version-reload-copy');
    expect(pageSource).not.toContain('New magic is ready');
    expect(pageSource).not.toContain('Reload now, or keep playing this version.');

    const updateAside = pageSource.match(/<aside\b[^>]*\bid="version-reload"[^>]*>/)?.[0] ?? '';
    expect(updateAside).toContain('aria-label="A game update is ready"');
    expect(updateAside).toMatch(/\bhidden\b/);
    expect(pageSource).toMatch(/<button\b[^>]*\bid="version-reload-now"[^>]*>Reload<\/button>/);
    expect(pageSource).toMatch(/<button\b[^>]*\bid="version-reload-later"[^>]*>Later<\/button>/);

    const gameStatus = pageSource.match(/<p\b[^>]*\bid="game-status"[^>]*>/)?.[0] ?? '';
    expect(gameStatus).toContain('class="visually-hidden"');
    expect(gameStatus).toContain('aria-live="polite"');
  });
});
