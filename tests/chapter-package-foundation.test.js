import { describe, expect, it } from 'vitest';
import {
  ChapterAuthoringError,
  defineRoom,
  defineScene,
} from '../src/game/content/chapterAuthoring.js';
import {
  defineChapterDescriptor,
  validateChapterLoader,
} from '../src/game/content/chapterDescriptor.js';
import {
  ChapterCompositionError,
  defineChapter,
} from '../src/game/content/chapterComposer.js';
import { linkChapterPackage } from '../src/game/content/chapterLinker.js';

const actionTypes = new Set([
  'dialogue.start',
  'flag.set',
  'reward.grant',
  'setPiece.play',
  'travel.request',
]);

function chapterTwelveDefinition() {
  const greatHall = defineRoom({
    id: 'ch12.greatHall',
    size: { width: 1280, height: 720 },
    background: {
      layers: ['rooms/ch12/great-hall'],
      fit: 'cover',
      focalPoint: { x: 0.5, y: 0.5 },
      variants: {},
    },
    walkBand: { top: 560, bottom: 640 },
    spawns: {
      start: { x: 160, y: 610, facing: 'right' },
      doorway: { x: 1120, y: 610, facing: 'left' },
    },
    exits: [{
      id: 'ch12.greatHall.sideDoor',
      to: { room: 'ch12.greatHall', spawn: 'doorway' },
    }],
    occupants: [
      { npc: 'ch12.npc.violet', x: 160, y: 610 },
      { npc: 'ch12.npc.professor', x: 880, y: 610 },
    ],
    hotspots: [{
      id: 'ch12.greatHall.professor',
      onInteract: [{ type: 'dialogue.start', script: 'ch12.dialogue.welcome' }],
    }],
    ambientSetPieces: ['ch12.setPiece.candleDrift'],
  });
  const feast = defineScene({
    id: 'ch12.scene.feast',
    order: 20,
    room: 'ch12.greatHall',
    spawn: 'doorway',
    when: { allFlags: ['ch12.arrived'] },
    onEnter: [],
    mapId: 'ch12.map.castle',
    resumeAt: { room: 'ch12.greatHall', spawn: 'doorway' },
  });
  const arrival = defineScene({
    id: 'ch12.scene.arrival',
    order: 10,
    room: 'ch12.greatHall',
    spawn: 'start',
    when: { noFlags: ['ch12.arrived'] },
    onEnter: [{ type: 'flag.set', flag: 'ch12.arrived', value: true }],
    mapId: 'ch12.map.castle',
    resumeAt: { room: 'ch12.greatHall', spawn: 'start' },
    layer: {
      occupants: [{ npc: 'ch12.npc.professor', x: 880, y: 610 }],
      hotspots: [],
      exits: [],
      ambientSetPieces: [],
    },
  });

  return {
    contractVersion: 2,
    id: 'ch12',
    number: 12,
    title: 'The Returning Stars',
    season: 'late-summer',
    start: { scene: 'ch12.scene.arrival', room: 'ch12.greatHall', spawn: 'start' },
    chapterCard: {
      art: 'chapterCards/ch12/stars',
      voice: 'voice/ch12/narrator/chapterEnd',
      title: 'The Returning Stars',
    },
    yearbookMoments: ['ch12.yearbook.arrival'],
    fragments: [
      {
        rooms: [greatHall],
        // Deliberately authored out of order: composition must use explicit order.
        scenes: [feast, arrival],
        npcs: [
          {
            id: 'ch12.npc.violet',
            character: 'character.violet',
            defaultTalk: null,
          },
          {
            id: 'ch12.npc.professor',
            character: 'character.professor',
            defaultTalk: 'ch12.dialogue.welcome',
          },
        ],
        dialogues: [{
          id: 'ch12.dialogue.welcome',
          start: 'welcome',
          nodes: {
            welcome: {
              type: 'line',
              speaker: 'ch12.npc.professor',
              voice: 'voice/ch12/professor/welcome',
              text: 'Welcome back, Violet.',
              caption: 'Welcome back!',
              next: 'finish',
            },
            finish: {
              type: 'end',
              actions: [{ type: 'setPiece.play', id: 'ch12.setPiece.starWelcome' }],
            },
          },
        }],
        quests: [{
          id: 'ch12.quest.arrival',
          startStep: 'meetProfessor',
          steps: {
            meetProfessor: {
              id: 'meetProfessor',
              objective: {
                speaker: 'ch12.npc.professor',
                voice: 'voice/ch12/objective/meetProfessor',
                mapStar: { room: 'ch12.greatHall', hotspot: 'ch12.greatHall.professor' },
              },
              onEnter: [],
              onComplete: [{
                type: 'reward.grant',
                receipt: 'ch12.reward.arrival',
                points: 10,
                cards: [],
                treasures: [],
              }],
            },
          },
          onComplete: [],
        }],
        setPieces: [
          {
            id: 'ch12.setPiece.candleDrift',
            assets: [],
            fallback: null,
            reducedMotion: null,
            renderer: 'setPiece.candleDrift',
            onComplete: [],
          },
          {
            id: 'ch12.setPiece.starWelcome',
            assets: ['sfx/ch12/star-welcome'],
            fallback: 'ch12.setPiece.starWelcomeFallback',
            reducedMotion: 'ch12.setPiece.starWelcomeReduced',
            renderer: 'setPiece.starWelcome',
            onComplete: [],
          },
          {
            id: 'ch12.setPiece.starWelcomeFallback',
            assets: [],
            fallback: null,
            reducedMotion: null,
            renderer: 'setPiece.starWelcome',
            onComplete: [],
          },
          {
            id: 'ch12.setPiece.starWelcomeReduced',
            assets: [],
            fallback: null,
            reducedMotion: null,
            renderer: 'setPiece.starWelcome',
            onComplete: [],
          },
        ],
        maps: [{
          id: 'ch12.map.castle',
          asset: 'maps/ch12/castle',
          locations: [{
            id: 'ch12.map.greatHall',
            to: { room: 'ch12.greatHall', spawn: 'start' },
            objectiveTarget: { room: 'ch12.greatHall', hotspot: 'ch12.greatHall.professor' },
            onSelect: [{ type: 'travel.request', room: 'ch12.greatHall', spawn: 'start' }],
          }],
          routes: [],
        }],
        recaps: [{
          id: 'ch12.recap.arrival',
          voice: 'voice/ch12/recap/arrival',
          text: 'The stars have returned to the Great Hall.',
          caption: 'Stars returned!',
        }],
        assets: [
          { key: 'rooms/ch12/great-hall', path: 'assets/art/rooms/ch12-great-hall.webp', kind: 'image' },
          { key: 'maps/ch12/castle', path: 'assets/art/maps/ch12-castle.webp', kind: 'image' },
          { key: 'chapterCards/ch12/stars', path: 'assets/art/chapter-cards/ch12-stars.webp', kind: 'image' },
          { key: 'voice/ch12/narrator/chapterEnd', path: 'assets/audio/voice/ch12/narrator/chapterEnd.mp3', kind: 'voice' },
          { key: 'voice/ch12/professor/welcome', path: 'assets/audio/voice/ch12/professor/welcome.mp3', kind: 'voice' },
          { key: 'voice/ch12/objective/meetProfessor', path: 'assets/audio/voice/ch12/objective/meetProfessor.mp3', kind: 'voice' },
          { key: 'voice/ch12/recap/arrival', path: 'assets/audio/voice/ch12/recap/arrival.mp3', kind: 'voice' },
          { key: 'sfx/ch12/star-welcome', path: 'assets/audio/sfx/ch12/star-welcome.mp3', kind: 'sfx' },
        ],
        characterDependencies: ['character.violet', 'character.professor'],
      },
    ],
  };
}

function linkRegistries(chapter) {
  return {
    actions: actionTypes,
    assets: new Set(Object.keys(chapter.assets)),
    characters: new Set(['character.violet', 'character.professor']),
    setPieceRenderers: new Set(['setPiece.candleDrift', 'setPiece.starWelcome']),
  };
}

describe('chapter package descriptor', () => {
  it('keeps runtime content, presentation, and harness loaders separate and immutable', () => {
    const content = async () => ({ default: 'content' });
    const presentation = async () => ({ default: 'presentation' });
    const harness = async () => ({ default: 'harness' });
    const descriptor = defineChapterDescriptor({
      id: 'ch12',
      number: 12,
      title: 'The Returning Stars',
      availability: 'planned',
      loaders: { content, presentation, harness },
    });

    expect(descriptor.loaders).toEqual({ content, presentation, harness });
    expect(validateChapterLoader(descriptor, 'content')).toBe(content);
    expect(validateChapterLoader(descriptor, 'presentation')).toBe(presentation);
    expect(validateChapterLoader(descriptor, 'harness')).toBe(harness);
    expect(Object.isFrozen(descriptor)).toBe(true);
    expect(Object.isFrozen(descriptor.loaders)).toBe(true);
  });

  it('requires a content loader and validates optional loaders independently', () => {
    expect(() => defineChapterDescriptor({
      id: 'ch12',
      number: 12,
      title: 'The Returning Stars',
      availability: 'planned',
      loaders: { content: null, presentation: null, harness: null },
    })).toThrow(/loaders\.content/);
    expect(() => defineChapterDescriptor({
      id: 'ch12',
      number: 12,
      title: 'The Returning Stars',
      availability: 'planned',
      loaders: { content: async () => ({}), presentation: 'bundled', harness: null },
    })).toThrow(/loaders\.presentation/);
  });
});

describe('pure chapter authoring and composition', () => {
  it('composes a synthetic Chapter 12 with deterministic explicit scene ordering', () => {
    const chapter = defineChapter(chapterTwelveDefinition());

    expect(chapter.id).toBe('ch12');
    expect(chapter.sceneOrder).toEqual(['ch12.scene.arrival', 'ch12.scene.feast']);
    expect(Object.keys(chapter.scenes)).toEqual(chapter.sceneOrder);
    expect(Object.keys(chapter.rooms)).toEqual(['ch12.greatHall']);
    expect(Object.keys(chapter.maps)).toEqual(['ch12.map.castle']);
    expect(chapter.recaps.map((recap) => recap.id)).toEqual(['ch12.recap.arrival']);
    expect(Object.keys(chapter.assets)).toContain('rooms/ch12/great-hall');
    expect(chapter.characterDependencies).toEqual(['character.violet', 'character.professor']);
    expect(Object.isFrozen(chapter)).toBe(true);
    expect(Object.isFrozen(chapter.rooms['ch12.greatHall'].spawns)).toBe(true);
  });

  it('rejects impure room and scene data before it reaches simulation', () => {
    expect(() => defineRoom({ id: 'ch12.impureRoom', draw: () => {} })).toThrow(ChapterAuthoringError);
    expect(() => defineScene({
      id: 'ch12.scene.impure',
      order: 1,
      room: 'ch12.impureRoom',
      spawn: 'start',
      onEnter: [{ type: 'custom', callback: () => {} }],
    })).toThrow(/pure data/);
  });

  it('rejects duplicate ids, foreign namespaces, and ambiguous scene order', () => {
    const duplicateRoom = chapterTwelveDefinition();
    duplicateRoom.fragments.push({ rooms: [defineRoom({
      id: 'ch12.greatHall',
      spawns: { start: { x: 0, y: 0, facing: 'right' } },
    })] });
    expect(() => defineChapter(duplicateRoom)).toThrow(ChapterCompositionError);

    const foreignScene = chapterTwelveDefinition();
    foreignScene.fragments[0].scenes[0] = defineScene({
      id: 'ch11.scene.foreign',
      order: 20,
      room: 'ch12.greatHall',
      spawn: 'start',
    });
    expect(() => defineChapter(foreignScene)).toThrow(/ch12 namespace/);

    const duplicateOrder = chapterTwelveDefinition();
    duplicateOrder.fragments[0].scenes[0] = defineScene({
      ...duplicateOrder.fragments[0].scenes[0],
      order: 10,
    });
    expect(() => defineChapter(duplicateOrder)).toThrow(/explicit scene order 10/);
  });
});

describe('aggregate chapter content linking', () => {
  it('resolves every supported Chapter 12 reference through injected registries', () => {
    const chapter = defineChapter(chapterTwelveDefinition());
    expect(linkChapterPackage(chapter, linkRegistries(chapter))).toEqual({ ok: true, issues: [] });
  });

  it('reports all unresolved reference categories in one deterministic result', () => {
    const chapter = structuredClone(defineChapter(chapterTwelveDefinition()));
    chapter.start.room = 'ch12.missingRoom';
    chapter.scenes['ch12.scene.feast'].spawn = 'missingSpawn';
    chapter.scenes['ch12.scene.feast'].mapId = 'ch12.map.missing';
    chapter.rooms['ch12.greatHall'].occupants.push({ npc: 'ch12.npc.missing', x: 0, y: 0 });
    chapter.rooms['ch12.greatHall'].hotspots[0].onInteract.push(
      { type: 'dialogue.start', script: 'ch12.dialogue.missing' },
      { type: 'setPiece.play', id: 'ch12.setPiece.missing' },
      { type: 'unknown.action' },
    );
    chapter.dialogues['ch12.dialogue.welcome'].nodes.welcome.voice = 'voice/ch12/missing';
    chapter.characterDependencies.push('character.missing');

    const result = linkChapterPackage(chapter, linkRegistries(chapter));
    const codes = new Set(result.issues.map((issue) => issue.code));

    expect(result.ok).toBe(false);
    expect(codes).toEqual(new Set([
      'unresolved-action',
      'unresolved-asset',
      'unresolved-character',
      'unresolved-dialogue',
      'unresolved-map',
      'unresolved-npc',
      'unresolved-room',
      'unresolved-set-piece',
      'unresolved-spawn',
    ]));
    expect(result.issues.length).toBeGreaterThanOrEqual(9);
    expect(result.issues.map((issue) => issue.path)).toEqual(
      [...result.issues].map((issue) => issue.path).sort((left, right) => left.localeCompare(right)),
    );
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.issues)).toBe(true);
  });
});
