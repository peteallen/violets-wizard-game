import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chapter1LetterLines } from '../src/game/content/chapters/ch1-letter.js';
import { chapter1Map } from '../src/game/content/chapters/ch1.js';
import { ROBE_TRIMS } from '../src/game/core/RobeTrims.js';
import { ChapterPreviewRenderer } from '../src/game/render/ChapterPreviewRenderer.js';
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

function sourceFiles(directoryUrl) {
  return readdirSync(directoryUrl, { withFileTypes: true }).flatMap((entry) => {
    const entryUrl = new URL(entry.name, directoryUrl);
    if (entry.isDirectory()) return sourceFiles(new URL(`${entry.name}/`, directoryUrl));
    return entry.name.endsWith('.js') ? [entryUrl] : [];
  });
}

const runtimePlayerSource = [
  pageSource,
  ...sourceFiles(new URL('../src/', import.meta.url)).map((file) => readFileSync(file, 'utf8')),
].join('\n');

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
    expect(isAllowedChildFacingUiText('Hear the letter', 'action')).toBe(true);
    expect(isAllowedChildFacingUiText('Start fresh', 'action')).toBe(true);
    expect(isAllowedChildFacingUiText('Tap this glowing picture now', 'action')).toBe(false);
    expect(isAllowedChildFacingUiText('Shimmering destination marker', 'caption')).toBe(false);
    expect(isAllowedChildFacingUiText('Platform Nine and Three-Quarters', 'proper-name')).toBe(true);
    expect(isAllowedChildFacingUiText(chapter1LetterLines[1], 'story-object')).toBe(true);
    expect(isAllowedChildFacingUiText('Settings and keepsakes for Violet’s adventure.', 'parent')).toBe(true);
    expect(isAllowedChildFacingUiText('‹', 'symbol')).toBe(true);
    expect(isAllowedChildFacingUiText('Previous', 'symbol')).toBe(false);
    expect(isAllowedChildFacingUiText('Still hidden', 'state')).toBe(false);
  });

  it('keeps each child-facing Canvas surface to captions, actions, names, and story text', () => {
    const renderer = new UIRenderer({
      characterRenderer: { draw: () => {} },
    });
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
        name: 'returning title',
        draw: (context) => renderer.drawTitle(context, 0, true, true),
        expected: ['Violet', 'at Hogwarts', 'Return to Hogwarts'],
        roles: {
          properNames: ['Violet', 'at Hogwarts'],
          actions: ['Return to Hogwarts'],
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
        name: 'dialogue',
        draw: (context) => renderer.drawDialogue(context, {
          type: 'line',
          speaker: 'npc.guide',
          portraitCharacterId: 'character.hagrid',
          caption: 'This way!',
        }, 0, false, true),
        expected: ['This way!', 'Again'],
        roles: { actions: ['Again'] },
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
          { icon: 'owl', caption: 'Owl', characterId: 'character.pet-owl' },
          { icon: 'cat', caption: 'Cat', characterId: 'character.cat' },
          { icon: 'toad', caption: 'Toad', characterId: 'character.toad' },
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
        }, [], { map: chapter1Map, reducedMotion: true }),
        expected: [
          'Violet’s Satchel',
          'Diagon Alley',
          'Ollivanders',
          'Madam Malkin’s',
          'Menagerie',
          'Here',
          'Next',
          'Choose a place',
          'Map',
          'Cards',
          'Grown-ups',
          'Start fresh',
        ],
        roles: {
          properNames: [
            'Violet’s Satchel',
            'Diagon Alley',
            'Ollivanders',
            'Madam Malkin’s',
            'Menagerie',
          ],
          actions: ['Start fresh'],
        },
      },
      {
        name: 'satchel cards',
        draw: (context) => renderer.drawSatchel(context, {
          overlay: { surface: 'satchel', tab: 'cards' },
          cards: ['morgana'],
        }, [
          { id: 'morgana', name: 'Morgana', portraitAsset: null },
          { id: 'dumbledore', name: 'Dumbledore', portraitAsset: null },
        ], { map: chapter1Map }),
        expected: [
          'Violet’s Satchel',
          'Morgana',
          'Magic cards',
          'Map',
          'Cards',
          'Grown-ups',
          'Start fresh',
        ],
        roles: { properNames: ['Violet’s Satchel', 'Morgana'], actions: ['Start fresh'] },
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
        expected: ['Violet’s Yearbook', 'First wand', 'Back', 'Next'],
        roles: {
          properNames: ['Violet’s Yearbook'],
          actions: ['Back', 'Next'],
        },
      },
      {
        name: 'empty yearbook',
        draw: (context) => renderer.drawYearbook(context, []),
        expected: ['Violet’s Yearbook'],
        roles: { properNames: ['Violet’s Yearbook'] },
      },
      {
        name: 'replay exit',
        draw: (context) => renderer.drawReplayExit(context),
        expected: ['↩', 'Return'],
        roles: { actions: ['Return'], symbols: ['↩'] },
      },
      {
        name: 'development reset',
        draw: (context) => renderer.drawDebugReset(context),
        expected: ['Start fresh'],
        roles: { actions: ['Start fresh'] },
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

  it('drops overlong or unfamiliar dynamic helper copy at every child-facing renderer boundary', () => {
    const renderer = new UIRenderer({
      characterRenderer: { draw: () => {} },
    });
    const choiceTexts = visibleTexts((context) => renderer.drawChoices(context, [{
      icon: 'owl',
      caption: 'Tap this picture to choose the owl',
    }]));
    const objectiveTexts = visibleTexts((context) => renderer.drawObjective(context, {
      caption: 'Follow the glowing star over there',
      text: 'This helper sentence is never child-facing Canvas copy.',
    }, 0, { reducedMotion: true }));
    const dialogueTexts = visibleTexts((context) => renderer.drawDialogue(context, {
      type: 'line',
      speaker: 'npc.guide',
      portraitCharacterId: 'character.hagrid',
      caption: 'Shimmering destination marker',
    }, 0, false, true));
    const previewTexts = visibleTexts((context) => new ChapterPreviewRenderer().draw(context, {
      choices: [
        { id: 'explore', caption: 'Tap anywhere to travel now' },
        { id: 'playAgain', caption: 'Configuration' },
      ],
      showChoices: true,
    }));

    expect(choiceTexts).toEqual([]);
    expect(objectiveTexts).toEqual([]);
    expect(dialogueTexts).toEqual(['Again']);
    expect(previewTexts).toEqual([
      'Chapter Two',
      'Platform Nine and Three-Quarters',
      'Start fresh',
    ]);
  });

  it('keeps unearned inventory props out of the bedroom HUD while retaining the quest compass', () => {
    const renderer = new UIRenderer({ characterRenderer: { draw: () => {} } });
    const baseState = {
      screen: 'playing',
      overlay: null,
      dialogue: null,
      selection: null,
      newObjective: false,
      affordances: null,
    };
    const questOnly = recordingContext();
    const withSatchel = recordingContext();
    const complete = recordingContext();

    expect(renderer.drawHud(questOnly, {
      ...baseState, hasSatchel: false, hasWand: false,
    }, 0, true)).toEqual({ quest: true, satchel: false, wand: false });
    expect(renderer.drawHud(withSatchel, {
      ...baseState, hasSatchel: true, hasWand: false,
    }, 0, true)).toEqual({ quest: true, satchel: true, wand: false });
    expect(renderer.drawHud(complete, {
      ...baseState, hasSatchel: true, hasWand: true,
    }, 0, true)).toEqual({ quest: true, satchel: true, wand: true });
    expect(withSatchel.calls.length).toBeGreaterThan(questOnly.calls.length);
    expect(complete.calls.length).toBeGreaterThan(withSatchel.calls.length);
  });

  it('keeps every retired helper sentence and obsolete letter caption out of runtime source', () => {
    const retiredCopy = [
      'Tap the page to continue',
      'A map that remembers where Violet needs to go',
      'Tap to travel',
      'Violet goes here',
      'Still hidden',
      'Hold for grown-ups',
      'Best with sound on',
      'HOGWARTS!',
      'For Violet',
    ];

    for (const text of retiredCopy) expect(runtimePlayerSource, text).not.toContain(text);
  });

  it('draws yearbook page leaves as deterministic organic curves, never perfect geometry', () => {
    const context = recordingContext();

    drawYearbookPageDots(context, 3, 1);

    expect(context.calls.filter(([method]) => method === 'beginPath')).toHaveLength(9);
    expect(context.calls.filter(([method]) => method === 'moveTo')).toHaveLength(9);
    expect(context.calls.filter(([method]) => method === 'bezierCurveTo')).toHaveLength(12);
    expect(context.calls.filter(([method]) => method === 'quadraticCurveTo')).toHaveLength(3);
    expect(context.calls.filter(([method]) => method === 'closePath')).toHaveLength(6);
    expect(context.calls.some(([method]) => [
      'arc', 'arcTo', 'ellipse', 'rect', 'roundRect',
    ].includes(method))).toBe(false);
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
    expect(isAllowedChildFacingUiText('Reload', 'action')).toBe(true);
    expect(isAllowedChildFacingUiText('Later', 'action')).toBe(true);

    const gameStatus = pageSource.match(/<p\b[^>]*\bid="game-status"[^>]*>/)?.[0] ?? '';
    expect(gameStatus).toContain('class="visually-hidden"');
    expect(gameStatus).toContain('aria-live="polite"');
  });
});
