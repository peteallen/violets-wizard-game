import { describe, expect, it, vi } from 'vitest';

import { validateLearningBeatV2, validateWorldEventPayload } from '../src/game/contracts.js';
import { buildMapState } from '../src/game/core/MapState.js';
import { chapter1ContentPackage } from '../src/game/chapters/ch1/content.js';
import { createSave } from '../src/game/systems/Save.js';
import { Learning } from '../src/game/systems/Learning.js';
import { Spellbook } from '../src/game/systems/Spellbook.js';
import { SPELLS } from '../src/game/content/spells.js';
import { World } from '../src/game/world/World.js';

const NOW = '2026-07-17T18:00:00.000Z';

function save() {
  return createSave({ now: NOW, worldSeed: 42 });
}

function lumosBeat(overrides = {}) {
  return {
    id: 'ch3.learning.lumos',
    kind: 'assembly',
    scene: 'ch3.scene.lumosClass',
    skill: 'phonics',
    completionFlag: 'ch3.lumosLearned',
    replayable: false,
    assistanceProfile: 'learning.compact-3-6-9',
    feedback: {
      wrongVoice: 'voice/ch3/flitwick/letters-into-magic',
      wrongCaption: 'Lumos',
    },
    content: {
      spell: 'lumos',
      presentation: 'learning.ch3.lumos-runes',
      units: [
        { id: 'l', glyph: 'L', voice: 'voice/ch3/l' },
        { id: 'u', glyph: 'U', voice: 'voice/ch3/u' },
        { id: 'm', glyph: 'M', voice: 'voice/ch3/m' },
        { id: 'o', glyph: 'O', voice: 'voice/ch3/o' },
        { id: 's', glyph: 'S', voice: 'voice/ch3/s' },
      ],
      order: ['l', 'u', 'm', 'o', 's'],
      distractors: [
        { id: 'e', glyph: 'E', voice: 'voice/ch3/e' },
        { id: 'a', glyph: 'A', voice: 'voice/ch3/a' },
      ],
    },
    modes: {
      off: { interaction: 'singleTap' },
      gentle: { interaction: 'guided-match', tileFace: 'shown', distractorCount: 1 },
      stretchy: { interaction: 'adaptive-match', tileFace: 'adaptive', distractorCount: 2 },
    },
    onComplete: [
      { type: 'flag.set', flag: 'ch3.lumosLearned', value: true },
      { type: 'spell.learn', spell: 'lumos' },
    ],
    ...overrides,
  };
}

function leviosaBeat() {
  return {
    ...lumosBeat(),
    id: 'ch3.learning.leviosa',
    kind: 'sequence',
    skill: 'sequence',
    completionFlag: 'ch3.leviosaLearned',
    content: {
      spell: 'leviosa',
      presentation: 'learning.ch3.leviosa-chant',
      units: [
        { id: 'win', glyph: 'WIN', voice: 'voice/ch3/win' },
        { id: 'gar', glyph: 'GAR', voice: 'voice/ch3/gar' },
        { id: 'sa', glyph: 'SA', voice: 'voice/ch3/sa' },
      ],
      order: ['win', 'gar', 'sa'],
      distractors: [],
    },
    onComplete: [
      { type: 'flag.set', flag: 'ch3.leviosaLearned', value: true },
      { type: 'spell.learn', spell: 'leviosa' },
    ],
  };
}

function learningHarness({ beat = lumosBeat(), mode = 'gentle' } = {}) {
  const state = save();
  state.settings.learning = mode;
  const events = [];
  const onComplete = vi.fn(() => true);
  const learning = new Learning({
    beats: { [beat.id]: beat },
    save: state,
    emit: (type, payload) => events.push({ type, payload }),
    onComplete,
  });
  learning.start(beat.id);
  return { learning, events, onComplete, state };
}

describe('Chapter Three v2 learning contract', () => {
  it('accepts exact live distractor records and rejects loose or replayable spell ceremonies', () => {
    expect(validateLearningBeatV2(lumosBeat())).toEqual(lumosBeat());

    expect(() => validateLearningBeatV2({
      ...lumosBeat(),
      extra: true,
    })).toThrow(/extra.*not part of contract v2/);

    const loose = structuredClone(lumosBeat());
    loose.content.distractors = ['e'];
    expect(() => validateLearningBeatV2(loose)).toThrow(/distractors\[0\].*plain object/);

    expect(() => validateLearningBeatV2(lumosBeat({ replayable: true })))
      .toThrow(/first-learn spell ceremony/);
  });

  it('validates the new learning and spellbook event payloads exactly', () => {
    expect(validateWorldEventPayload('learning.attempted', {
      beat: 'ch3.learning.lumos', unit: 'e', outcome: 'wrong', step: 0,
      voice: 'voice/ch3/flitwick/letters-into-magic', caption: 'Lumos',
    })).toBeTruthy();
    expect(() => validateWorldEventPayload('learning.attempted', {
      beat: 'ch3.learning.lumos', unit: 'l', outcome: 'correct', step: 0,
      voice: 'voice/ch3/flitwick/letters-into-magic', caption: 'Lumos',
    })).toThrow(/only valid for a wrong attempt/);
    expect(validateWorldEventPayload('learning.hintChanged', {
      beat: 'ch3.learning.lumos', stage: 'focus',
    })).toBeTruthy();
    expect(validateWorldEventPayload('spellbook.stateChanged', {
      state: 'targeting', selectedSpellId: 'lumos',
    })).toBeTruthy();
    expect(() => validateWorldEventPayload('spellbook.stateChanged', {
      state: 'targeting', selectedSpellId: 'not-a-spell',
    })).toThrow(/registered spell/);
    expect(validateWorldEventPayload('audio.command', {
      command: 'sfx', key: 'sfx/ch3/croak', pan: -0.75,
    })).toBeTruthy();
    expect(() => validateWorldEventPayload('audio.command', {
      command: 'voice', key: 'voice/ch3/line', pan: 0.5,
    })).toThrow(/pan.*not part/);
  });
});

describe('deterministic local learning assistance', () => {
  it('teaches the first tile, escalates at exactly 3/6/9 seconds, and preserves progress', () => {
    const { learning, events } = learningHarness();
    expect(learning.snapshot().tiles.map(({ id }) => id)).toEqual(['l']);
    learning.chooseUnit('l');
    expect(learning.snapshot().completedUnitIds).toEqual(['l']);

    learning.update(2.999);
    expect(learning.snapshot().hintStage).toBe('ready');
    learning.update(0.001);
    expect(learning.snapshot().hintStage).toBe('nudge');
    learning.update(3);
    expect(learning.snapshot().hintStage).toBe('focus');
    learning.update(3);
    expect(learning.snapshot().hintStage).toBe('complete');

    const wrongTile = learning.snapshot().tiles.find(({ expected }) => !expected);
    const result = learning.chooseUnit(wrongTile.id);
    expect(result).toMatchObject({ accepted: true, correct: true, expectedUnitId: 'u' });
    expect(learning.snapshot().completedUnitIds).toEqual(['l', 'u']);
    expect(events.filter(({ type }) => type === 'learning.hintChanged').map(({ payload }) => payload.stage))
      .toEqual(['nudge', 'focus', 'complete', 'ready']);
  });

  it('escalates immediately after one, two, and three wrong attempts', () => {
    const { learning, events } = learningHarness();
    learning.chooseUnit('l');
    const wrong = () => learning.snapshot().tiles.find(({ expected }) => !expected).id;
    learning.chooseUnit(wrong());
    expect(learning.snapshot().hintStage).toBe('nudge');
    learning.chooseUnit(wrong());
    expect(learning.snapshot().hintStage).toBe('focus');
    learning.chooseUnit(wrong());
    expect(learning.snapshot().hintStage).toBe('complete');
    expect(learning.snapshot().completedUnitIds).toEqual(['l']);
    expect(events.filter(({ type, payload }) => (
      type === 'learning.attempted' && payload.outcome === 'wrong'
    )).at(-1)).toMatchObject({
      payload: {
        outcome: 'wrong',
        voice: 'voice/ch3/flitwick/letters-into-magic',
        caption: 'Lumos',
      },
    });
  });

  it('keeps Off ordered, bounds Gentle and Stretchy choices, and never changes rewards', () => {
    const off = learningHarness({ mode: 'off' });
    while (off.learning.snapshot()?.status === 'active') {
      const [tile] = off.learning.snapshot().tiles;
      expect(off.learning.snapshot().tiles).toHaveLength(1);
      off.learning.chooseUnit(tile.id);
    }
    expect(off.onComplete).toHaveBeenCalledOnce();

    const gentle = learningHarness({ mode: 'gentle' });
    gentle.learning.chooseUnit('l');
    expect(gentle.learning.snapshot().tiles).toHaveLength(2);

    const stretchy = learningHarness({ mode: 'stretchy' });
    stretchy.learning.chooseUnit('l');
    expect(stretchy.learning.snapshot().tiles).toHaveLength(3);
    stretchy.learning.chooseUnit('u');
    expect(stretchy.learning.snapshot().slots.find(({ expected }) => expected).hidden).toBe(true);
  });

  it('turns ordered chant progress into deterministic feather lift', () => {
    const { learning } = learningHarness({ beat: leviosaBeat() });
    expect(learning.snapshot().featherLift).toBe(0);
    learning.chooseUnit('win');
    expect(learning.snapshot().featherLift).toBeCloseTo(1 / 3);
    learning.chooseUnit('gar');
    expect(learning.snapshot().featherLift).toBeCloseTo(2 / 3);
    learning.chooseUnit('sa');
    expect(learning.snapshot().featherLift).toBe(1);
  });
});

describe('spellbook controller', () => {
  it('moves through fan, targeting, casting, and closed without duplicate casts', () => {
    const state = save();
    state.spellbook.known.push('lumos');
    state.spellbook.stats.lumos = { casts: 0, masteryTier: 0 };
    const events = [];
    const onCast = vi.fn(() => ({ ok: true, masteryTier: 1 }));
    const spellbook = new Spellbook({
      spells: SPELLS,
      save: state,
      emit: (type, payload) => events.push({ type, payload }),
      onCast,
      now: () => 12,
    });
    const target = { id: 'ch3.alcove', kind: 'spellTarget', requiredSpell: 'lumos' };

    expect(spellbook.open()).toBe(true);
    expect(spellbook.select('lumos')).toBe(true);
    expect(spellbook.snapshot([target])).toMatchObject({
      state: 'targeting', selectedSpellId: 'lumos', validTargetIds: ['ch3.alcove'],
    });
    expect(spellbook.castAt({ ...target, requiredSpell: 'leviosa' })).toBe(false);
    expect(spellbook.castAt(target)).toMatchObject({ ok: true, masteryTier: 1 });
    expect(spellbook.castAt(target)).toBe(false);
    expect(onCast).toHaveBeenCalledOnce();
    expect(spellbook.snapshot()).toMatchObject({
      state: 'casting', cast: { spellId: 'lumos', targetId: 'ch3.alcove', startedAt: 12 },
    });
    spellbook.update(0.749);
    expect(spellbook.snapshot().state).toBe('casting');
    spellbook.update(0.001);
    expect(spellbook.snapshot().state).toBe('closed');
    expect(events.at(-1)).toMatchObject({
      type: 'spellbook.stateChanged', payload: { state: 'closed', selectedSpellId: null },
    });
  });
});

function chapterOneClone() {
  return structuredClone(chapter1ContentPackage.chapter);
}

function worldFor(chapter, state) {
  return new World({ chapters: { ch1: chapter }, save: state, seed: 42 });
}

describe('World learning and casting integration', () => {
  it('persists completed beats and skill exactly once without a save-schema change', () => {
    const chapter = chapterOneClone();
    const beat = {
      ...lumosBeat(),
      id: 'ch1.learning.lumos',
      scene: chapter.start.scene,
      completionFlag: 'ch1.lumosLearned',
      onComplete: [
        { type: 'flag.set', flag: 'ch1.lumosLearned', value: true },
        { type: 'spell.learn', spell: 'lumos' },
      ],
    };
    chapter.learningBeats[beat.id] = beat;
    const state = save();
    const world = worldFor(chapter, state);

    world.runAction({ type: 'learning.start', id: beat.id });
    for (const unitId of beat.content.order) world.chooseLearningUnit(unitId);
    expect(state.schemaVersion).toBe(3);
    expect(state.learning.completedBeats).toEqual([beat.id]);
    expect(state.learning.phonicsSkill).toBe(1);
    expect(state.spellbook.known).toEqual(['lumos']);
    expect(state.progress.questFlags['ch1.lumosLearned']).toBe(true);

    world.update(1);
    expect(world.runAction({ type: 'learning.start', id: beat.id })).toMatchObject({ reason: 'completed' });
    expect(state.learning.phonicsSkill).toBe(1);
  });

  it('preserves requiredSpell and never executes target actions outside one valid cast', () => {
    const chapter = chapterOneClone();
    chapter.rooms[chapter.start.room].lighting = { darkness: 0.8 };
    chapter.rooms[chapter.start.room].hotspots.push({
      id: 'ch1.bedroom.darkAlcove',
      kind: 'spellTarget',
      hitArea: { shape: 'circle', x: 960, y: 380, radius: 100 },
      approach: null,
      when: { noFlags: ['ch1.alcoveLit'] },
      presentation: { icon: 'light', glow: 'interactionGold' },
      requiredSpell: 'lumos',
      spellEffect: { kind: 'light', radius: 260, intensity: 0.9 },
      repeat: 'until-condition',
      onInteract: [{ type: 'flag.set', flag: 'ch1.alcoveLit', value: true }],
    });
    const state = save();
    state.spellbook.known.push('lumos');
    state.spellbook.stats.lumos = { casts: 0, masteryTier: 0 };
    const world = worldFor(chapter, state);
    world.drainEvents();

    const target = world.snapshot().targets.find(({ id }) => id === 'ch1.bedroom.darkAlcove');
    expect(target.requiredSpell).toBe('lumos');
    expect(world.interactSemantic(target.id)).toBe(false);
    expect(state.progress.questFlags['ch1.alcoveLit']).toBeUndefined();

    world.openSpellbook();
    world.selectSpell('lumos');
    expect(world.snapshot().spellbook.validTargetIds).toEqual(['ch1.bedroom.darkAlcove']);
    expect(world.castSpellAt(target.id)).toMatchObject({ ok: true, masteryTier: 1 });
    expect(state.progress.questFlags['ch1.alcoveLit']).toBe(true);
    expect(state.spellbook.stats.lumos).toEqual({ casts: 1, masteryTier: 1 });
    expect(world.castSpellAt(target.id)).toBe(false);
    expect(state.spellbook.stats.lumos.casts).toBe(1);

    expect(world.drainEvents().filter(({ type }) => type === 'spell.cast')).toEqual([
      expect.objectContaining({
        payload: { spell: 'lumos', target: target.id, masteryTier: 1 },
      }),
    ]);
    expect(world.snapshot().roomEffects.lightMask).toMatchObject({
      darkness: 0.8,
      lights: [{ targetId: target.id, radius: 260, intensity: 0.9 }],
      revealedTargetIds: [target.id],
    });
    expect(worldFor(chapter, state).snapshot().roomEffects.lightMask).toMatchObject({
      revealedTargetIds: [target.id],
    });
  });
});

describe('conditional Chapter Three map state', () => {
  it('prefers authored unlock and completion conditions while keeping current/objective places reachable', () => {
    const map = {
      id: 'ch3.map.castle',
      locations: [
        {
          id: 'ch3.map.commonRoom',
          art: 'maps/ch3/common-room',
          to: { room: 'ch3.commonRoom', spawn: 'map' },
          objectiveTarget: null,
          unlockWhen: { allFlags: ['ch3.spellbookOpened'] },
          completeWhen: { allFlags: ['ch3.lumosLearned'] },
          vignette: { x: 0, y: 0, width: 100, height: 100 },
        },
        {
          id: 'ch3.map.corridor',
          art: 'maps/ch3/corridor',
          to: { room: 'ch3.corridor', spawn: 'entry' },
          objectiveTarget: { room: 'ch3.corridor', hotspot: 'ch3.corridor.alcove' },
          unlockWhen: { allFlags: ['ch3.trailReady'] },
          completeWhen: { allFlags: ['ch3.trailFound'] },
          vignette: { x: 120, y: 0, width: 100, height: 100 },
        },
      ],
      routes: [{
        id: 'ch3.route.one', from: 'ch3.map.commonRoom', to: 'ch3.map.corridor',
        points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
      }],
    };
    const snapshot = {
      roomId: 'ch3.commonRoom',
      objective: { mapStar: { room: 'ch3.corridor', hotspot: 'ch3.corridor.alcove' } },
      unlockedRooms: ['ch3.corridor'],
      conditionState: {
        progress: { questFlags: {} }, character: {}, spellbook: { known: [] }, settings: {},
      },
    };

    const initial = buildMapState(map, snapshot);
    expect(initial.locations[0]).toMatchObject({
      art: 'maps/ch3/common-room', isCurrent: true, unlocked: true, completed: false,
    });
    expect(initial.locations[1]).toMatchObject({ isObjective: true, unlocked: true, completed: false });

    snapshot.conditionState.progress.questFlags = {
      'ch3.spellbookOpened': true,
      'ch3.lumosLearned': true,
      'ch3.trailReady': true,
      'ch3.trailFound': true,
    };
    snapshot.objective = null;
    const completed = buildMapState(map, snapshot);
    expect(completed.locations.map(({ unlocked }) => unlocked)).toEqual([true, true]);
    expect(completed.locations.map(({ completed: done }) => done)).toEqual([true, true]);
    expect(completed.routes[0].unlocked).toBe(true);
  });
});

describe('main-first journal and sleeping side quests', () => {
  it('keeps an unavailable side quest silver and out of the active objective until its spell exists', () => {
    const chapter = chapterOneClone();
    const objective = (caption) => ({
      speaker: 'npc.narrator', voice: 'voice/test', text: caption, caption, mapStar: null,
    });
    const hints = { lookTarget: null, repeatVoice: null, trailTarget: null, assistActions: [] };
    chapter.quests = {
      'ch1.quest.fixBook': {
        id: 'ch1.quest.fixBook', kind: 'side', offerScript: null,
        startWhen: { allFlags: ['ch1.bookAccepted'] }, startStep: 'mend',
        steps: {
          mend: {
            id: 'mend', objective: objective('Fix the book'),
            doneWhen: { allFlags: ['ch1.bookMended'], knownSpells: ['reparo'] },
            hints, onEnter: [], onComplete: [], next: null,
          },
        },
        onComplete: [],
      },
      'ch1.quest.main': {
        id: 'ch1.quest.main', kind: 'main', offerScript: null,
        startWhen: {}, startStep: 'help',
        steps: {
          help: {
            id: 'help', objective: objective('Help Neville'),
            doneWhen: { allFlags: ['ch1.mainDone'] },
            hints, onEnter: [], onComplete: [], next: null,
          },
        },
        onComplete: [],
      },
    };
    const state = save();
    state.progress.questFlags['ch1.bookAccepted'] = true;
    const world = worldFor(chapter, state);

    expect(world.snapshot().objective.caption).toBe('Help Neville');
    expect(world.snapshot().journal).toMatchObject({
      main: { id: 'ch1.quest.main', status: 'active' },
      side: [{ id: 'ch1.quest.fixBook', status: 'sleeping', caption: 'Fix the book' }],
    });

    world.setFlag('ch1.mainDone', true);
    expect(world.snapshot().objective).toBeNull();
    expect(world.snapshot().journal.side[0].status).toBe('sleeping');
    state.spellbook.known.push('reparo');
    state.spellbook.stats.reparo = { casts: 0, masteryTier: 0 };
    expect(world.snapshot().objective.caption).toBe('Fix the book');
    expect(world.snapshot().journal.side[0].status).toBe('active');
  });
});
