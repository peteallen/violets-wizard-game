import { describe, expect, it } from 'vitest';
import { validateChapter, validateMap } from '../src/game/contracts.js';
import { Dialogue } from '../src/game/systems/Dialogue.js';
import { createSaveV1 } from '../src/game/systems/Save.js';
import { World } from '../src/game/world/World.js';
import { cards, cardsById } from '../src/game/content/cards.js';
import {
  chapter1,
  chapter1AssetKeys,
  chapter1Flags,
  chapter1Map,
  chapter1ResumeRecaps,
} from '../src/game/content/chapters/ch1.js';
import {
  chapter1LetterLines,
  chapter1LetterNarration,
} from '../src/game/content/chapters/ch1-letter.js';
import { chapter2, chapter2AssetKeys } from '../src/game/content/chapters/ch2.js';
import {
  chapterAvailability,
  contentRegistry,
  getMap,
  getChapter,
  isChapterPlayable,
  maps,
} from '../src/game/content/index.js';
import { isSupportedCaption } from '../src/game/content/vocabulary.js';

function dialogueCaptions(chapter) {
  return Object.values(chapter.dialogues).flatMap((dialogue) => Object.values(dialogue.nodes).flatMap((node) => {
    if (node.type === 'line') return [node.caption];
    if (node.type === 'choice') return node.choices.map((choice) => choice.caption);
    return [];
  }));
}

function referencedAssets(chapter) {
  const keys = [];
  for (const room of Object.values(chapter.rooms)) {
    keys.push(...room.background.layers);
    for (const variant of Object.values(room.background.variants)) keys.push(...variant);
  }
  for (const dialogue of Object.values(chapter.dialogues)) {
    for (const node of Object.values(dialogue.nodes)) if (node.type === 'line') keys.push(node.voice);
  }
  for (const quest of Object.values(chapter.quests)) {
    for (const step of Object.values(quest.steps)) keys.push(step.objective.voice);
  }
  for (const setPiece of Object.values(chapter.setPieces)) keys.push(...setPiece.assets);
  keys.push(chapter.chapterCard.art, chapter.chapterCard.voice);
  return [...new Set(keys)];
}

describe('chapter content contracts', () => {
  it('validates the playable Chapter 1 and intentional Chapter 2 placeholder', () => {
    expect(validateChapter(chapter1)).toBe(chapter1);
    expect(validateChapter(chapter2)).toBe(chapter2);
    expect(validateMap(chapter1Map)).toBe(chapter1Map);
    expect(contentRegistry).toEqual({ ch1: chapter1, ch2: chapter2 });
    expect(maps).toEqual({ [chapter1Map.id]: chapter1Map });
    expect(getMap(chapter1Map.id)).toBe(chapter1Map);
    expect(getMap('map.ch8.missing')).toBeNull();
    expect(getChapter(1)).toBe(chapter1);
    expect(getChapter('ch2')).toBe(chapter2);
    expect(chapterAvailability).toEqual({ ch1: 'playable', ch2: 'placeholder' });
    expect(isChapterPlayable('ch1')).toBe(true);
    expect(isChapterPlayable(2)).toBe(false);
  });

  it('keeps captions short, familiar, and complete across dialogue, objectives, cards, and recaps', () => {
    const objectiveCaptions = Object.values(chapter1.quests).flatMap((quest) => Object.values(quest.steps).map((step) => step.objective.caption));
    const allCaptions = [
      ...dialogueCaptions(chapter1),
      ...dialogueCaptions(chapter2),
      ...objectiveCaptions,
      ...cards.map((card) => card.caption),
      ...chapter1ResumeRecaps.map((recap) => recap.caption),
      ...chapter1Map.locations.map((location) => location.caption),
    ];
    expect(allCaptions.every((caption) => isSupportedCaption(caption))).toBe(true);
  });

  it('registers every asset referenced by the two chapter data sets', () => {
    expect(new Set(chapter1AssetKeys).size).toBe(chapter1AssetKeys.length);
    expect(new Set(chapter2AssetKeys).size).toBe(chapter2AssetKeys.length);
    for (const key of referencedAssets(chapter1)) expect(chapter1AssetKeys).toContain(key);
    for (const key of referencedAssets(chapter2)) expect(chapter2AssetKeys).toContain(key);
    for (const card of cards) {
      expect(chapter1AssetKeys).toContain(card.portraitAsset);
      expect(chapter1AssetKeys).toContain(card.voice);
      expect(cardsById[card.id]).toBe(card);
    }
  });

  it('defines the intended resumable Chapter 1 progression in order', () => {
    const quest = chapter1.quests['ch1.shoppingTrip'];
    expect(quest.startStep).toBe('openLetter');
    expect(Object.keys(quest.steps)).toEqual([
      'openLetter',
      'followGuide',
      'useMap',
      'chooseWand',
      'chooseRobes',
      'choosePet',
      'returnToGuide',
    ]);
    expect(chapter1Flags).toContain('ch1.complete');
    expect(chapter1.rooms['ch1.ollivanders'].hotspots.find((hotspot) => hotspot.id === 'ollivanders.cardMorgana')).toBeTruthy();
    expect(chapter1.rooms['ch1.menagerie'].hotspots.find((hotspot) => hotspot.id === 'menagerie.cardDumbledore')).toBeTruthy();
  });

  it('makes map travel, objective markers, vignettes, and routes authoritative content', () => {
    const locationIds = new Set(chapter1Map.locations.map((location) => location.id));
    const objectiveTargets = new Set(chapter1Map.locations.map((location) => (
      `${location.objectiveTarget.room}:${location.objectiveTarget.hotspot}`
    )));
    const chapterObjectiveTargets = Object.values(chapter1.quests)
      .flatMap((quest) => Object.values(quest.steps))
      .map((step) => step.objective.mapStar)
      .filter(Boolean)
      .map((target) => `${target.room}:${target.hotspot}`);

    for (const location of chapter1Map.locations) {
      const travelActions = location.onSelect.filter((action) => action.type === 'travel.request');
      expect(travelActions).toEqual([{ type: 'travel.request', ...location.to }]);
      expect(location.onSelect.at(-1)).toEqual(travelActions[0]);
      expect(location.vignette.width).toBeGreaterThanOrEqual(88);
      expect(location.vignette.height).toBeGreaterThanOrEqual(88);
    }
    for (const target of chapterObjectiveTargets) expect(objectiveTargets).toContain(target);
    for (const route of chapter1Map.routes) {
      expect(locationIds).toContain(route.from);
      expect(locationIds).toContain(route.to);
      expect(route.points.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('draws exactly the same original letter wording that the narrator reads', () => {
    const letter = chapter1.dialogues['ch1.letter.read'];
    const narratedText = [
      letter.nodes.invitation.text,
      letter.nodes.waiting.text,
    ];

    expect(narratedText).toEqual(chapter1LetterNarration);
    expect(chapter1LetterLines.join(' ')).toBe(narratedText.join(' '));
    expect(chapter1LetterLines.join(' ')).not.toContain('We await your owl.');
  });

  it('keeps the chosen-wand reveal on the Wandmaker’s whispery Curious beat', () => {
    expect(chapter1.dialogues['ch1.wandmaker.chosen'].nodes.chosen).toMatchObject({
      speaker: 'npc.wandmaker',
      voice: 'voice/ch1/wandmaker/chosen',
      text: 'Curious…',
      caption: 'Your wand!',
    });
  });

  it('lets pet selection be reconsidered before recording a permanent name', () => {
    const actions = [];
    const dialogue = new Dialogue({
      scripts: chapter1.dialogues,
      save: { progress: { questFlags: {} }, character: { pet: {}, appearance: {} }, spellbook: { known: [] } },
      runActions: (nextActions) => actions.push(...nextActions),
    });
    expect(dialogue.open('ch1.keeper.petAndName').caption).toBe('Choose a pet!');
    expect(dialogue.advance().type).toBe('choice');
    expect(dialogue.advance('petCat').caption).toBe('This one?');
    expect(dialogue.advance().type).toBe('choice');
    expect(dialogue.advance('petLookAgain').type).toBe('choice');
    expect(dialogue.advance('petOwl').caption).toBe('This one?');
    dialogue.advance();
    expect(dialogue.advance('petConfirm').caption).toBe('Pick a name!');
    expect(dialogue.advance().type).toBe('choice');
    expect(dialogue.advance('nameBiscuit').caption).toBe('New friend!');
    expect(actions).toContainEqual({ type: 'character.set', field: 'pet.type', value: 'owl' });
    expect(actions).toContainEqual({ type: 'character.set', field: 'pet.name', value: 'Biscuit' });
    expect(chapter1.dialogues['ch1.keeper.petAndName'].nodes.name.choices).toContainEqual(expect.objectContaining({
      id: 'nameCustom',
      caption: 'My own',
      actions: [{ type: 'choice.record', id: 'ch1.petNameMode', value: 'custom' }],
    }));
  });

  it('gives the placeholder only safe Explore and replay-mode choices', () => {
    const choice = chapter2.dialogues['ch2.preview'].nodes.choice;
    expect(choice.choices.map((entry) => entry.id)).toEqual(['explore', 'playAgain']);
    expect(choice.choices[0].actions).toContainEqual({ type: 'travel.request', room: 'ch1.diagonStreet', spawn: 'west' });
    expect(choice.choices[1].actions).toContainEqual({ type: 'ui.open', surface: 'chapter-replay', tab: 'ch1' });
  });

  it('walks the required path from the owl through the Chapter 2 preview without losing choices', () => {
    const save = createSaveV1({ now: '2026-07-12T18:00:00.000Z', appVersion: 'content-test', worldSeed: 42 });
    const world = new World({ chapters: contentRegistry, save, seed: 42 });
    const settle = (seconds = 10) => {
      for (let elapsed = 0; elapsed < seconds; elapsed += 1 / 60) world.update(1 / 60);
    };
    const interact = (id) => {
      world.interactSemantic(id);
      settle();
    };
    const finishLines = () => {
      while (world.dialogue.active) {
        expect(world.dialogue.node.type).not.toBe('choice');
        world.advanceDialogue();
      }
    };

    interact('bedroom.owl');
    interact('bedroom.letter');
    expect(world.overlay).toEqual({ surface: 'letter-reading', tab: null });
    world.closeOverlay();
    world.runAction({ type: 'dialogue.start', script: 'ch1.letter.read' });
    finishLines();
    interact('bedroom.guide');
    finishLines();
    interact('bedroom.exit');
    finishLines();
    interact('leaky.courtyardDoor');
    finishLines();
    interact('courtyard.brickWall');

    expect(world.roomId).toBe('ch1.diagonStreet');
    expect(world.dialogue.scriptId).toBe('ch1.guide.map');
    finishLines();
    expect(world.flags['ch1.satchelReceived']).toBe(true);
    expect(world.overlay).toEqual({ surface: 'satchel', tab: 'map' });
    world.closeOverlay();
    world.runActions(chapter1Map.locations.find((location) => location.id === 'map.ch1.ollivanders').onSelect);
    finishLines();
    for (const wand of ['ollivanders.wand1', 'ollivanders.wand2', 'ollivanders.wand3']) {
      interact(wand);
      finishLines();
    }

    interact('ollivanders.exit');
    interact('street.malkinsDoor');
    interact('malkins.stool');
    world.advanceDialogue();
    world.advanceDialogue('trimPurple');
    finishLines();
    interact('malkins.exit');
    interact('street.menagerieDoor');
    interact('menagerie.keeper');
    world.advanceDialogue();
    world.advanceDialogue('petCat');
    world.advanceDialogue();
    world.advanceDialogue('petConfirm');
    world.advanceDialogue();
    world.advanceDialogue('nameBiscuit');
    finishLines();

    interact('menagerie.exit');
    interact('street.guideTicket');
    finishLines();
    settle();
    finishLines();
    settle(1);

    expect(world.chapter.id).toBe('ch2');
    expect(world.roomId).toBe('ch2.previewRoom');
    expect(world.currentSceneId).toBe('ch2.placeholder');
    expect(save.progress.questFlags['ch1.complete']).toBe(true);
    expect(save.character).toMatchObject({
      wandId: 'violet-first-wand',
      appearance: { robeTrim: 'purple' },
      pet: { type: 'cat', name: 'Biscuit' },
    });
  });
});
