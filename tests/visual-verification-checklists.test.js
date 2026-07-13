import { describe, expect, it } from 'vitest';
import { contentRegistry } from '../src/game/content/index.js';
import {
  STORYBOOK_STANDARD_CHECKS,
  VISUAL_REVIEW_CHECKLISTS,
  storybookChecklist,
  visualReviewChecklist,
} from '../src/game/content/visualVerification.js';
import { CHARACTER_REVIEW_SCENES } from '../src/game/render/CharacterRenderer.js';
import { UI_REVIEW_SCENES } from '../src/game/render/UIRenderer.js';

function storybookSection(checklist) {
  return checklist.slice(-STORYBOOK_STANDARD_CHECKS.length);
}

function expectCanonicalStorybookSection(checklist, label) {
  expect(checklist.length, label).toBeGreaterThan(7);
  expect(storybookSection(checklist), label).toEqual(STORYBOOK_STANDARD_CHECKS);
  expect(checklist.filter((check) => check.startsWith('[Storybook Standard')), label)
    .toHaveLength(7);
}

describe('visual verification checklists', () => {
  it('defines one immutable, ordered, countable seven-item Storybook Standard section', () => {
    expect(STORYBOOK_STANDARD_CHECKS).toHaveLength(7);
    expect(new Set(STORYBOOK_STANDARD_CHECKS)).toHaveProperty('size', 7);
    expect(Object.isFrozen(STORYBOOK_STANDARD_CHECKS)).toBe(true);
    STORYBOOK_STANDARD_CHECKS.forEach((check, index) => {
      expect(check).toContain(`Storybook Standard ${index + 1}/7`);
    });
    expect(STORYBOOK_STANDARD_CHECKS.join(' ')).toMatch(/Palette.*pure-black.*pure-white/s);
    expect(STORYBOOK_STANDARD_CHECKS.join(' ')).toMatch(/Line.*two line weights/s);
    expect(STORYBOOK_STANDARD_CHECKS.join(' ')).toMatch(/Form.*two tones.*highlight/s);
    expect(STORYBOOK_STANDARD_CHECKS.join(' ')).toMatch(/Light.*warm upper-left.*rim/s);
    expect(STORYBOOK_STANDARD_CHECKS.join(' ')).toMatch(/Texture.*grain or material marks/s);
    expect(STORYBOOK_STANDARD_CHECKS.join(' ')).toMatch(/Shape.*zero perfect rectangles.*perfect circles.*ruler-straight/s);
    expect(STORYBOOK_STANDARD_CHECKS.join(' ')).toMatch(/Coherence.*thumbnail or squint.*reference/s);
  });

  it('appends the canonical section without changing an illusion-specific check', () => {
    const checklist = storybookChecklist('Exactly one example remains visible.');
    expect(checklist[0]).toBe('Exactly one example remains visible.');
    expect(storybookSection(checklist)).toEqual(STORYBOOK_STANDARD_CHECKS);
    expect(Object.isFrozen(checklist)).toBe(true);
    expect(() => storybookChecklist()).toThrow(/at least one illusion-specific check/);
    expect(() => storybookChecklist('[Storybook Standard 8/7 · Drift] No.'))
      .toThrow(/canonical seven-item section/);
  });

  it('includes the canonical section in every chapter set-piece checklist', () => {
    const setPieces = Object.values(contentRegistry).flatMap((chapter) => (
      Object.values(chapter.setPieces).map((setPiece) => ({ chapter: chapter.id, setPiece }))
    ));

    expect(setPieces.length).toBeGreaterThan(0);
    for (const { chapter, setPiece } of setPieces) {
      expectCanonicalStorybookSection(setPiece.verification.checklist, `${chapter}:${setPiece.id}`);
    }
  });

  it('registers a canonical checklist for every UI and character review scene', () => {
    const registeredScenes = [...UI_REVIEW_SCENES, ...CHARACTER_REVIEW_SCENES].sort();
    expect(Object.keys(VISUAL_REVIEW_CHECKLISTS).sort()).toEqual(registeredScenes);

    for (const scene of registeredScenes) {
      const checklist = visualReviewChecklist(scene);
      expectCanonicalStorybookSection(checklist, scene);
    }
    expect(visualReviewChecklist('unregistered-review-scene')).toBeNull();
  });
});
