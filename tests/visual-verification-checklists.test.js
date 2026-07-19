import { describe, expect, it } from 'vitest';
import { contentRegistry } from '../src/game/content/index.js';
import {
  NON_PLAYER_HARNESS_SCENE_EXCLUSIONS,
  STORYBOOK_STANDARD_CHECKS,
  VISUAL_REVIEW_CHECKLISTS,
  storybookChecklist,
  visualReviewChecklist,
} from '../src/game/content/visualVerification.js';
import { ACTION_FIXTURE_IDS } from '../src/harness/actionFixtures.js';
import { STATE_FIXTURE_IDS } from '../src/harness/stateFixtures.js';

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
    expect(STORYBOOK_STANDARD_CHECKS.join(' ')).toMatch(/Light.*warm key-light.*matching the room.*rim/s);
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

  it('registers a canonical checklist for every player-facing harness fixture', () => {
    expect(ACTION_FIXTURE_IDS).toEqual(STATE_FIXTURE_IDS);

    const reviewedScenes = Object.keys(VISUAL_REVIEW_CHECKLISTS);
    const excludedScenes = Object.keys(NON_PLAYER_HARNESS_SCENE_EXCLUSIONS);
    expect(Object.isFrozen(NON_PLAYER_HARNESS_SCENE_EXCLUSIONS)).toBe(true);
    expect(reviewedScenes.filter((scene) => excludedScenes.includes(scene))).toEqual([]);
    expect([...reviewedScenes, ...excludedScenes].sort()).toEqual([...STATE_FIXTURE_IDS].sort());

    for (const [scene, reason] of Object.entries(NON_PLAYER_HARNESS_SCENE_EXCLUSIONS)) {
      expect(STATE_FIXTURE_IDS, scene).toContain(scene);
      expect(reason, scene).toMatch(/^Internal-only: .+\.$/);
      expect(visualReviewChecklist(scene), scene).toBeNull();
    }

    for (const scene of reviewedScenes) {
      const checklist = visualReviewChecklist(scene);
      expectCanonicalStorybookSection(checklist, scene);
    }
    expect(visualReviewChecklist('unregistered-review-scene')).toBeNull();
  });

  it('keeps the bedroom character-fidelity corrections in the live review contract', () => {
    const bedroom = visualReviewChecklist('ui-dialogue-live-review').join(' ');
    expect(bedroom).toMatch(/Hagrid.*coat sleeves.*hands.*boots.*separate shaded hair and beard/s);
    expect(bedroom).toMatch(/Casual Violet.*three-tone soccer jersey.*joined shoulder.*elbow.*wrist/s);
    expect(bedroom).toMatch(/contact shadows.*right-hand window/s);

    const cast = visualReviewChecklist('character-cast-review').join(' ');
    expect(cast).toMatch(/articulated limbs.*hands and shoes.*contact shadow/s);
    expect(cast).toMatch(/Hagrid.*visible arms.*broad boots.*shaped coat.*moustache.*beard/s);
  });

  it('keeps both in-game composition overlays meaningful with full or reduced motion', () => {
    expect(visualReviewChecklist('composition-loading-review').join(' '))
      .toMatch(/game composition remains visibly present.*Full and reduced motion.*identical waiting meaning.*without relying on movement/s);
    expect(visualReviewChecklist('composition-failure-review').join(' '))
      .toMatch(/game composition remains visibly present.*Tap to try again.*Full and reduced motion.*words and layout.*zero technical error text/s);
  });

  it('keeps all six Chapter Two set pieces in the player-facing review contract', () => {
    const chapterTwoScenes = [
      'sp-ch2-barrier-run-review',
      'sp-ch2-sweet-reaction-review',
      'sp-ch2-lake-vista-review',
      'sp-ch2-sorting-reveal-review',
      'sp-ch2-common-room-arrival-review',
      'sp-ch2-chapter-card-review',
    ];
    for (const scene of chapterTwoScenes) {
      expect(visualReviewChecklist(scene), scene).not.toBeNull();
    }

    expect(visualReviewChecklist('sp-ch2-barrier-run-review').join(' '))
      .toMatch(/continuous action.*opaque storybook whoosh.*conductor.*never encloses.*ring or capsule/s);
    expect(visualReviewChecklist('sp-ch2-sweet-reaction-review').join(' '))
      .toMatch(/Every-Flavour Bean.*silent face-and-body reaction/s);
    expect(visualReviewChecklist('sp-ch2-lake-vista-review').join(' '))
      .toMatch(/castle.*lake reflection.*zero blank frame/s);
    expect(visualReviewChecklist('sp-ch2-sorting-reveal-review').join(' '))
      .toMatch(/Gryffindor.*one canonical outcome.*shaped, textured hanging cloth.*zero flat fill strips/s);
    expect(visualReviewChecklist('sp-ch2-common-room-arrival-review').join(' '))
      .toMatch(/specifically Gryffindor.*Harry, Ron, and Hermione.*hung fabric object.*rather than floating/s);
    expect(visualReviewChecklist('sp-ch2-chapter-card-review').join(' '))
      .toMatch(/most of the Gryffindor common-room painting unobscured.*compact hanging chapter title.*first-classes scroll.*no retired preview ticket/s);

    expect(visualReviewChecklist('ch2-placeholder')).toBeNull();
    expect(visualReviewChecklist('sp-ch2-ticket-review')).toBeNull();
  });
});
