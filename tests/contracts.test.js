import { describe, expect, it } from 'vitest';
import {
  ContractValidationError,
  PARTICLE_LIMITS,
  validateChapter,
  validateWorldEvent,
} from '../src/game/contracts.js';

const condition = () => ({ allFlags: [], anyFlags: [], noFlags: [] });

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

  it.each([
    ['unknown keys', (chapter) => { chapter.unreviewed = true; }],
    ['undersized touch targets', (chapter) => { chapter.rooms['ch1.bedroom'].hotspots[0].hitArea.radius = 40; }],
    ['unresolved dialogue edges', (chapter) => { chapter.dialogues['ch1.guide.hello'].nodes.hello.next = 'missing'; }],
    ['learning beats without a completion flag action', (chapter) => { chapter.learningBeats['ch1.nameTap'].onComplete = []; }],
    ['set-piece tracks beyond duration', (chapter) => { chapter.setPieces['ch1.letter'].timeline.tracks[0].end = 2; }],
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
