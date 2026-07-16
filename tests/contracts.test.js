import { describe, expect, it } from 'vitest';
import {
  CHAPTER_CONTRACT_VERSION,
  ContractValidationError,
  LEGACY_CHAPTER_CONTRACT_VERSION,
  MAP_CONTRACT_VERSION,
  PARTICLE_LIMITS,
  validateChapter,
  validateChapterV1,
  validateChapterV2,
  validateMap,
  validateWorldEvent,
} from '../src/game/contracts.js';

const condition = () => ({ allFlags: [], anyFlags: [], noFlags: [] });

function mapFixture() {
  return {
    contractVersion: 1,
    id: 'map.ch1.test',
    asset: 'maps/ch1/test',
    locations: [
      {
        id: 'map.ch1.street',
        icon: 'street',
        caption: 'Explore',
        alwaysUnlocked: true,
        to: { room: 'ch1.street', spawn: 'west' },
        objectiveTarget: { room: 'ch1.street', hotspot: 'street.guide' },
        vignette: { x: 100, y: 200, width: 180, height: 140 },
        onSelect: [{ type: 'travel.request', room: 'ch1.street', spawn: 'west' }],
      },
      {
        id: 'map.ch1.shop',
        icon: 'shop',
        caption: 'Shop',
        alwaysUnlocked: false,
        to: { room: 'ch1.shop', spawn: 'entry' },
        objectiveTarget: { room: 'ch1.street', hotspot: 'street.shopDoor' },
        vignette: { x: 400, y: 180, width: 180, height: 140 },
        onSelect: [
          { type: 'flag.set', flag: 'ch1.mapUsed', value: true },
          { type: 'travel.request', room: 'ch1.shop', spawn: 'entry' },
        ],
      },
    ],
    routes: [{
      id: 'route.ch1.streetToShop',
      from: 'map.ch1.street',
      to: 'map.ch1.shop',
      points: [{ x: 190, y: 270 }, { x: 400, y: 250 }],
    }],
  };
}

function chapterFixture() {
  return {
    contractVersion: 1,
    id: 'ch1',
    number: 1,
    title: 'The Letter & Diagon Alley',
    season: 'lateSummer',
    start: { scene: 'ch1.letterScene', room: 'ch1.bedroom', spawn: 'start' },
    scenes: {
      'ch1.letterScene': {
        id: 'ch1.letterScene',
        room: 'ch1.bedroom',
        spawn: 'start',
        when: condition(),
        onEnter: [{ type: 'setPiece.play', id: 'ch1.letter' }],
        doneWhen: { allFlags: ['ch1.nameTapped'] },
        next: null,
        resumeAt: { room: 'ch1.bedroom', spawn: 'start' },
      },
    },
    rooms: {
      'ch1.bedroom': {
        id: 'ch1.bedroom',
        size: { width: 1280, height: 720 },
        background: {
          layers: ['rooms/ch1/bedroom'],
          fit: 'cover',
          focalPoint: { x: 0.5, y: 0.5 },
          keyLight: 'right',
          variants: {},
        },
        walkBand: { top: 560, bottom: 640 },
        spawns: { start: { x: 200, y: 610, facing: 'right' } },
        exits: [],
        occupants: [{
          npc: 'npc.guide', x: 900, y: 610, facing: 'left', pose: 'idle', when: condition(),
        }],
        hotspots: [{
          id: 'ch1.bedroom.letter',
          kind: 'inspect',
          hitArea: { shape: 'circle', x: 640, y: 360, radius: 90 },
          approach: null,
          when: condition(),
          presentation: { icon: 'inspect', glow: 'interactionGold' },
          requiredSpell: null,
          repeat: 'until-condition',
          onInteract: [{ type: 'learning.start', id: 'ch1.nameTap' }],
        }],
        ambientSetPieces: [],
      },
    },
    npcs: {
      'npc.guide': {
        id: 'npc.guide',
        characterId: 'character.hagrid',
        displayName: 'The Guide',
        puppet: 'puppets/guide',
        portrait: 'portraits/guide',
        voiceRole: 'guide',
        scale: 2,
        hitRadius: 88,
        defaultPose: 'idle',
        controller: { kind: 'static' },
        defaultTalk: 'ch1.guide.hello',
      },
    },
    dialogues: {
      'ch1.guide.hello': {
        id: 'ch1.guide.hello',
        start: 'hello',
        resumePolicy: 'restart-current-node',
        replayable: true,
        nodes: {
          hello: {
            type: 'line',
            speaker: 'npc.guide',
            voice: 'ch1.guide.greeting',
            text: 'Hello, Violet.',
            caption: 'Hello Violet',
            phoneticText: null,
            next: 'finish',
          },
          finish: { type: 'end', actions: [] },
        },
      },
    },
    quests: {
      'ch1.shopping': {
        id: 'ch1.shopping',
        kind: 'main',
        offerScript: 'ch1.guide.hello',
        startWhen: condition(),
        startStep: 'visitShop',
        steps: {
          visitShop: {
            id: 'visitShop',
            objective: {
              speaker: 'npc.guide',
              voice: 'ch1.quest.visitShop',
              text: 'Let us find your wand.',
              caption: 'Find a wand',
              mapStar: { room: 'ch1.bedroom', hotspot: 'ch1.bedroom.letter' },
            },
            doneWhen: { allFlags: ['ch1.wandChosen'] },
            hints: {
              lookTarget: 'ch1.bedroom.letter',
              repeatVoice: 'ch1.quest.visitShop',
              trailTarget: 'ch1.bedroom.letter',
              assistActions: [{ type: 'flag.set', flag: 'ch1.wandChosen', value: true }],
            },
            onEnter: [],
            onComplete: [],
            next: null,
          },
        },
        onComplete: [{
          type: 'reward.grant', receipt: 'ch1.shopping.reward', points: 0, cards: [], treasures: ['trainTicket'],
        }],
      },
    },
    learningBeats: {
      'ch1.nameTap': {
        id: 'ch1.nameTap',
        kind: 'wordTap',
        scene: 'ch1.letterScene',
        skill: 'letters',
        completionFlag: 'ch1.nameTapped',
        replayable: false,
        assistanceProfile: 'standardLearning',
        content: {
          targets: [{ id: 'violet', label: 'VIOLET', voice: 'ch1.learning.violet' }],
          correct: 'violet',
        },
        modes: {
          off: { interaction: 'singleTap' },
          gentle: {},
          stretchy: {},
        },
        onComplete: [{ type: 'flag.set', flag: 'ch1.nameTapped', value: true }],
      },
    },
    setPieces: {
      'ch1.letter': {
        id: 'ch1.letter',
        tier: 'T2',
        duration: 1,
        clock: 'world',
        blocksInput: true,
        particleBudget: 'standard',
        assets: [],
        fallback: null,
        reducedMotion: null,
        params: {},
        timeline: {
          tracks: [
            { type: 'tween', target: 'letter.alpha', start: 0, end: 1, from: 0, to: 1, easing: 'linear' },
            { type: 'cue', at: 0.2, event: 'audio.command', payload: { command: 'sfx', key: 'sfx.paper' } },
          ],
        },
        verification: { keyframes: [0, 0.5, 1], checklist: ['name-legible'] },
        onComplete: [],
      },
    },
    encounters: {},
    minigames: {},
    chapterCard: { art: 'chapterCards/ch1', voice: 'ch1.chapterCard', title: 'The Train' },
    yearbookMoments: ['ch1.wandChosen'],
  };
}

function chapterV2Fixture() {
  const chapter = chapterFixture();
  const sceneId = chapter.start.scene;
  const mapId = 'map.ch1.bedroom';
  return {
    ...chapter,
    contractVersion: CHAPTER_CONTRACT_VERSION,
    sceneOrder: [sceneId],
    scenes: {
      [sceneId]: {
        id: sceneId,
        order: 10,
        room: chapter.start.room,
        spawn: chapter.start.spawn,
        when: condition(),
        onEnter: [],
        quest: 'ch1.shopping',
        roomVariant: 'base',
        mapId,
        resumeAt: { room: chapter.start.room, spawn: chapter.start.spawn },
        layer: { occupants: [], hotspots: [], exits: [], ambientSetPieces: [] },
      },
    },
    maps: {
      [mapId]: {
        id: mapId,
        asset: 'maps/ch1/bedroom',
        locations: [{
          id: 'map.ch1.bedroom.start',
          to: { room: chapter.start.room, spawn: chapter.start.spawn },
          onSelect: [{ type: 'travel.request', room: chapter.start.room, spawn: chapter.start.spawn }],
        }],
        routes: [],
      },
    },
    recaps: [{
      id: 'ch1.recap.letter',
      step: 'openLetter',
      voice: 'voice/ch1/recap/letter',
      text: 'An owl brought Violet a letter.',
      caption: 'A letter!',
    }],
    assets: {
      'maps/ch1/bedroom': {
        key: 'maps/ch1/bedroom',
        path: 'assets/art/maps/ch1-bedroom.webp',
        kind: 'image',
      },
    },
    characterDependencies: ['character.hagrid'],
  };
}

function addSecondV2Scene(chapter, order = 20) {
  const first = chapter.scenes[chapter.sceneOrder[0]];
  const id = 'ch1.secondScene';
  chapter.scenes[id] = { ...first, id, order };
  chapter.sceneOrder.push(id);
  return id;
}

describe('content contracts', () => {
  it('accepts a fully linked Chapter 1 data module', () => {
    const chapter = chapterFixture();
    expect(validateChapter(chapter)).toBe(chapter);
    expect(PARTICLE_LIMITS).toEqual({
      standardCap: 300,
      celebrationCap: 400,
      reducedMotionCap: 120,
      hardCap: 400,
    });
  });

  it('accepts a travel action that deliberately suppresses a redundant room transition', () => {
    const chapter = chapterFixture();
    chapter.setPieces['ch1.letter'].onComplete = [
      { type: 'travel.request', room: 'ch1.bedroom', spawn: 'start', transition: 'none' },
    ];

    expect(validateChapter(chapter)).toBe(chapter);
  });

  it.each([
    ['unknown keys', (chapter) => { chapter.unreviewed = true; }],
    ['NPCs without canonical character identities', (chapter) => { delete chapter.npcs['npc.guide'].characterId; }],
    ['role aliases used as character identities', (chapter) => { chapter.npcs['npc.guide'].characterId = 'npc.guide'; }],
    ['unknown room-light directions', (chapter) => { chapter.rooms['ch1.bedroom'].background.keyLight = 'top'; }],
    ['undersized touch targets', (chapter) => { chapter.rooms['ch1.bedroom'].hotspots[0].hitArea.radius = 40; }],
    ['unresolved dialogue edges', (chapter) => { chapter.dialogues['ch1.guide.hello'].nodes.hello.next = 'missing'; }],
    ['learning beats without a completion flag action', (chapter) => { chapter.learningBeats['ch1.nameTap'].onComplete = []; }],
    ['set-piece tracks beyond duration', (chapter) => { chapter.setPieces['ch1.letter'].timeline.tracks[0].end = 2; }],
    ['unknown travel transitions', (chapter) => {
      chapter.setPieces['ch1.letter'].onComplete = [
        { type: 'travel.request', room: 'ch1.bedroom', spawn: 'start', transition: 'explode' },
      ];
    }],
  ])('rejects %s', (_label, mutate) => {
    const chapter = chapterFixture();
    mutate(chapter);
    expect(() => validateChapter(chapter)).toThrow(ContractValidationError);
  });

  it('rejects cyclic quest graphs', () => {
    const chapter = chapterFixture();
    chapter.quests['ch1.shopping'].steps.visitShop.next = 'visitShop';
    expect(() => validateChapter(chapter)).toThrow(/creates a cycle/);
  });
});

describe('chapter v2 content contract', () => {
  it('dispatches exact v1 and v2 chapters independently from the v1 map contract', () => {
    const legacy = chapterFixture();
    const chapter = chapterV2Fixture();

    expect(LEGACY_CHAPTER_CONTRACT_VERSION).toBe(1);
    expect(CHAPTER_CONTRACT_VERSION).toBe(2);
    expect(MAP_CONTRACT_VERSION).toBe(1);
    expect(validateChapterV1(legacy)).toBe(legacy);
    expect(validateChapter(legacy)).toBe(legacy);
    expect(validateChapterV2(chapter)).toBe(chapter);
    expect(validateChapter(chapter)).toBe(chapter);
    expect(chapter.maps['map.ch1.bedroom'].routes).toEqual([]);
    expect(() => validateMap(chapter.maps['map.ch1.bedroom'])).toThrow(/contractVersion/);
  });

  it.each([
    ['unknown package keys', (chapter) => { chapter.unreviewed = true; }],
    ['missing package collections', (chapter) => { delete chapter.recaps; }],
    ['v1 scene fields', (chapter) => { chapter.scenes[chapter.start.scene].doneWhen = condition(); }],
    ['missing explicit scene order', (chapter) => { delete chapter.scenes[chapter.start.scene].order; }],
    ['unknown scene-layer keys', (chapter) => { chapter.scenes[chapter.start.scene].layer.props = []; }],
    ['asset records whose key drifts from the registry', (chapter) => {
      chapter.assets['maps/ch1/bedroom'].key = 'maps/ch1/other';
    }],
    ['foreign package ids', (chapter) => {
      chapter.quests['ch2.foreign'] = { id: 'ch2.foreign' };
    }],
    ['ids reused across package collections', (chapter) => {
      const sceneId = chapter.start.scene;
      chapter.rooms[sceneId] = { ...chapter.rooms[chapter.start.room], id: sceneId };
    }],
    ['malformed nested action payloads', (chapter) => {
      chapter.dialogues['ch1.guide.hello'].nodes.finish.actions = [{
        type: 'flag.set', flag: 'ch1.done',
      }];
    }],
    ['foreign yearbook ids', (chapter) => {
      chapter.yearbookMoments = ['ch2.foreign'];
    }],
    ['malformed scene-layer action payloads', (chapter) => {
      chapter.scenes[chapter.start.scene].layer.hotspots = [{
        onInteract: [{ type: 'flag.set', flag: 'ch1.done' }],
      }];
    }],
  ])('rejects %s', (_label, mutate) => {
    const chapter = chapterV2Fixture();
    mutate(chapter);
    expect(() => validateChapter(chapter)).toThrow(ContractValidationError);
  });

  it.each([
    ['a scene omitted from sceneOrder', (chapter) => { addSecondV2Scene(chapter); chapter.sceneOrder.pop(); }],
    ['sceneOrder that differs from map order', (chapter) => { addSecondV2Scene(chapter); chapter.sceneOrder.reverse(); }],
    ['duplicate explicit scene order', (chapter) => { addSecondV2Scene(chapter, 10); }],
    ['descending explicit scene order', (chapter) => { addSecondV2Scene(chapter, 5); }],
  ])('rejects %s', (_label, mutate) => {
    const chapter = chapterV2Fixture();
    mutate(chapter);
    expect(() => validateChapter(chapter)).toThrow(ContractValidationError);
  });

  it.each([
    ['unknown scene room', (chapter) => { chapter.scenes[chapter.start.scene].room = 'ch1.missing'; }],
    ['unknown scene spawn', (chapter) => { chapter.scenes[chapter.start.scene].spawn = 'missing'; }],
    ['unknown scene quest', (chapter) => { chapter.scenes[chapter.start.scene].quest = 'ch1.missing'; }],
    ['unknown scene map', (chapter) => { chapter.scenes[chapter.start.scene].mapId = 'map.ch1.missing'; }],
    ['unknown resume room', (chapter) => { chapter.scenes[chapter.start.scene].resumeAt.room = 'ch1.missing'; }],
    ['unknown resume spawn', (chapter) => { chapter.scenes[chapter.start.scene].resumeAt.spawn = 'missing'; }],
    ['unknown map room', (chapter) => {
      chapter.maps['map.ch1.bedroom'].locations[0].to.room = 'ch1.missing';
      chapter.maps['map.ch1.bedroom'].locations[0].onSelect[0].room = 'ch1.missing';
    }],
    ['unknown map spawn', (chapter) => {
      chapter.maps['map.ch1.bedroom'].locations[0].to.spawn = 'missing';
      chapter.maps['map.ch1.bedroom'].locations[0].onSelect[0].spawn = 'missing';
    }],
  ])('rejects %s', (_label, mutate) => {
    const chapter = chapterV2Fixture();
    mutate(chapter);
    expect(() => validateChapter(chapter)).toThrow(ContractValidationError);
  });

  it('rejects unsupported chapter contract versions without changing the map version', () => {
    const chapter = chapterV2Fixture();
    chapter.contractVersion = 3;
    expect(() => validateChapter(chapter)).toThrow(/must be 1 or 2/);
    expect(validateMap(mapFixture())).toBeTruthy();
  });
});

describe('map content contract', () => {
  it('accepts one authoritative destination and stable layout per location', () => {
    const map = mapFixture();
    expect(validateMap(map)).toBe(map);
  });

  it.each([
    ['unknown fields', (map) => { map.previewPainting = true; }],
    ['travel actions that drift from their destination', (map) => { map.locations[1].onSelect[1].room = 'ch1.street'; }],
    ['travel actions before later side effects', (map) => { map.locations[1].onSelect.reverse(); }],
    ['routes to missing locations', (map) => { map.routes[0].to = 'map.ch1.missing'; }],
    ['duplicate objective targets', (map) => { map.locations[1].objectiveTarget = { ...map.locations[0].objectiveTarget }; }],
  ])('rejects %s', (_label, mutate) => {
    const map = mapFixture();
    mutate(map);
    expect(() => validateMap(map)).toThrow(ContractValidationError);
  });
});

describe('World-to-Game event contract', () => {
  it('accepts registered events with their exact payload', () => {
    const event = {
      seq: 0,
      at: 0,
      type: 'room.entered',
      payload: { room: 'ch1.bedroom', spawn: 'start' },
    };
    expect(validateWorldEvent(event)).toBe(event);
  });

  it('rejects unknown events and misspelled payload fields', () => {
    expect(() => validateWorldEvent({ seq: 0, at: 0, type: 'room.teleported', payload: {} })).toThrow(/registered/);
    expect(() => validateWorldEvent({
      seq: 0,
      at: 0,
      type: 'room.entered',
      payload: { room: 'ch1.bedroom', spwan: 'start' },
    })).toThrow(/spwan/);
  });
});
