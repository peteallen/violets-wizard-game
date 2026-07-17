import { defineScene } from '../../../content/chapterAuthoring.js';
import {
  actionHotspot,
  circle,
  dialogueStart,
  flagSet,
  occupant,
  rect,
  rewardGrant,
  setPiecePlay,
  storyLayer,
  uiOpen,
  when,
} from './authoring.js';

const quest = 'ch3.quest.firstSpells';
const mapId = 'ch3.map.castle';
const lumosLight = Object.freeze({ kind: 'light', radius: 230, intensity: 1 });

export const spellbookParcelScene = defineScene({
  id: 'ch3.scene.spellbookParcel',
  order: 10,
  room: 'ch3.commonRoom',
  spawn: 'parcel',
  when: when({ allFlags: ['ch2.complete'], noFlags: ['ch3.spellbookOpened'] }),
  onEnter: [],
  quest,
  mapId,
  resumeAt: { room: 'ch3.commonRoom', spawn: 'parcel' },
  layer: storyLayer({
    occupants: [occupant('ch3.npc.postOwl', 760, 520, 'left', 'perch')],
    hotspots: [
      actionHotspot({
        id: 'ch3.commonRoom.postOwl',
        hitArea: circle(760, 420, 112),
        approach: { x: 630, y: 620, facing: 'right' },
        icon: 'props/ch3/spellbook-parcel',
        onInteract: [dialogueStart('ch3.dialogue.homeLetter')],
      }),
    ],
  }),
});

export const lumosClassScene = defineScene({
  id: 'ch3.scene.lumosClass',
  order: 20,
  room: 'ch3.charmsClassroom',
  spawn: 'map',
  when: when({ allFlags: ['ch3.spellbookOpened'], noFlags: ['ch3.lumosProved'] }),
  onEnter: [],
  quest,
  mapId,
  resumeAt: { room: 'ch3.charmsClassroom', spawn: 'map' },
  layer: storyLayer({
    occupants: [occupant('ch3.npc.flitwick', 920, 610, 'left')],
    hotspots: [
      actionHotspot({
        id: 'ch3.charms.flitwickLumos',
        hitArea: circle(920, 480, 112),
        approach: { x: 790, y: 620, facing: 'right' },
        when: when({ noFlags: ['ch3.lumosLearned'] }),
        icon: 'talk',
        onInteract: [dialogueStart('ch3.dialogue.lumosLesson')],
      }),
      actionHotspot({
        id: 'ch3.charms.lantern',
        hitArea: circle(550, 430, 105),
        approach: { x: 500, y: 620, facing: 'right' },
        when: when({
          allFlags: ['ch3.lumosLearned'],
          noFlags: ['ch3.lumosProved'],
          knownSpells: ['lumos'],
        }),
        icon: 'props/ch3/lantern',
        kind: 'spellTarget',
        glow: 'interactionGold',
        requiredSpell: 'lumos',
        spellEffect: { kind: 'light', radius: 270, intensity: 1 },
        onInteract: [setPiecePlay('ch3.setPiece.lumosBloom')],
      }),
    ],
  }),
});

export const leviosaClassScene = defineScene({
  id: 'ch3.scene.leviosaClass',
  order: 30,
  room: 'ch3.charmsClassroom',
  spawn: 'lesson',
  when: when({ allFlags: ['ch3.lumosProved'], noFlags: ['ch3.leviosaLearned'] }),
  onEnter: [],
  quest,
  mapId,
  resumeAt: { room: 'ch3.charmsClassroom', spawn: 'lesson' },
  layer: storyLayer({
    occupants: [occupant('ch3.npc.flitwick', 920, 610, 'left')],
    hotspots: [
      actionHotspot({
        id: 'ch3.charms.flitwickLeviosa',
        hitArea: circle(920, 480, 112),
        approach: { x: 790, y: 620, facing: 'right' },
        icon: 'props/ch3/feather',
        onInteract: [dialogueStart('ch3.dialogue.leviosaLesson')],
      }),
    ],
  }),
});

export const trevorMissingScene = defineScene({
  id: 'ch3.scene.trevorMissing',
  order: 40,
  room: 'ch3.charmsClassroom',
  spawn: 'lesson',
  when: when({ allFlags: ['ch3.leviosaLearned'], noFlags: ['ch3.toadQuestAccepted'] }),
  onEnter: [],
  quest,
  mapId,
  resumeAt: { room: 'ch3.charmsClassroom', spawn: 'lesson' },
  layer: storyLayer({
    occupants: [
      occupant('ch3.npc.flitwick', 980, 610, 'left'),
      occupant('ch3.npc.neville', 700, 610, 'left', 'tearful-but-not-panicked'),
    ],
    hotspots: [
      actionHotspot({
        id: 'ch3.charms.neville',
        hitArea: circle(700, 480, 112),
        approach: { x: 570, y: 620, facing: 'right' },
        icon: 'talk',
        onInteract: [dialogueStart('ch3.dialogue.trevorMissing')],
      }),
    ],
  }),
});

export const corridorOneScene = defineScene({
  id: 'ch3.scene.corridorOne',
  order: 50,
  room: 'ch3.corridorOne',
  spawn: 'map',
  when: when({ allFlags: ['ch3.toadQuestAccepted'], noFlags: ['ch3.trailFound'] }),
  onEnter: [],
  quest,
  mapId,
  resumeAt: { room: 'ch3.corridorOne', spawn: 'map' },
  layer: storyLayer({
    hotspots: [
      actionHotspot({
        id: 'ch3.corridorOne.alcove',
        hitArea: rect(920, 220, 210, 330),
        approach: { x: 820, y: 620, facing: 'right' },
        icon: 'lumos',
        kind: 'spellTarget',
        glow: 'soft',
        requiredSpell: 'lumos',
        spellEffect: lumosLight,
        onInteract: [setPiecePlay('ch3.setPiece.corridorOneReveal')],
      }),
    ],
  }),
});

export const corridorTwoScene = defineScene({
  id: 'ch3.scene.corridorTwo',
  order: 60,
  room: 'ch3.corridorTwo',
  spawn: 'map',
  when: when({ allFlags: ['ch3.trailFound'], noFlags: ['ch3.toadFound'] }),
  onEnter: [],
  quest,
  mapId,
  resumeAt: { room: 'ch3.corridorTwo', spawn: 'map' },
  layer: storyLayer({
    hotspots: [
      actionHotspot({
        id: 'ch3.corridorTwo.cardAlcove',
        hitArea: rect(260, 220, 210, 330),
        approach: { x: 500, y: 620, facing: 'left' },
        when: when({ noFlags: ['ch3.corridorCardFound'] }),
        icon: 'frog-card',
        kind: 'spellTarget',
        glow: 'hidden',
        requiredSpell: 'lumos',
        spellEffect: lumosLight,
        onInteract: [
          rewardGrant('ch3.reward.card.circe', { cards: ['circe'] }),
          flagSet('ch3.corridorCardFound'),
          flagSet('ch3.corridorClueFound'),
        ],
      }),
      actionHotspot({
        id: 'ch3.corridorTwo.ribbonAlcove',
        hitArea: rect(790, 220, 210, 330),
        approach: { x: 700, y: 620, facing: 'right' },
        when: when({ noFlags: ['ch3.corridorRibbonFound'] }),
        icon: 'props/ch3/ribbon-clue',
        kind: 'spellTarget',
        glow: 'soft',
        requiredSpell: 'lumos',
        spellEffect: lumosLight,
        onInteract: [
          flagSet('ch3.corridorRibbonFound'),
          flagSet('ch3.corridorClueFound'),
        ],
      }),
      actionHotspot({
        id: 'ch3.corridorTwo.toCorridorThree',
        hitArea: rect(1110, 260, 130, 330),
        approach: { x: 1080, y: 620, facing: 'right' },
        when: when({ allFlags: ['ch3.corridorClueFound'] }),
        icon: 'castle-map',
        glow: 'interactionGold',
        onInteract: [uiOpen('satchel', 'map')],
      }),
    ],
  }),
});

export const corridorThreeScene = defineScene({
  id: 'ch3.scene.corridorThree',
  order: 70,
  room: 'ch3.corridorThree',
  spawn: 'map',
  when: when({ allFlags: ['ch3.corridorClueFound'], noFlags: ['ch3.toadFound'] }),
  onEnter: [],
  quest,
  mapId,
  resumeAt: { room: 'ch3.corridorThree', spawn: 'map' },
  layer: storyLayer({
    occupants: [
      occupant(
        'ch3.npc.trevor',
        1030,
        610,
        'left',
        'revealed',
        when({ allFlags: ['ch3.toadRevealed'], noFlags: ['ch3.toadFound'] }),
      ),
    ],
    hotspots: [
      actionHotspot({
        id: 'ch3.corridorThree.armor',
        hitArea: rect(210, 190, 190, 390),
        approach: { x: 430, y: 620, facing: 'left' },
        when: when({ noFlags: ['ch3.toadRevealed'] }),
        icon: 'armor',
        kind: 'spellTarget',
        glow: 'soft',
        requiredSpell: 'lumos',
        onInteract: [dialogueStart('ch3.dialogue.armorReaction')],
      }),
      actionHotspot({
        id: 'ch3.corridorThree.curtain',
        hitArea: rect(565, 190, 190, 390),
        approach: { x: 500, y: 620, facing: 'right' },
        when: when({ noFlags: ['ch3.toadRevealed'] }),
        icon: 'curtain',
        kind: 'spellTarget',
        glow: 'soft',
        requiredSpell: 'lumos',
        onInteract: [dialogueStart('ch3.dialogue.curtainReaction')],
      }),
      actionHotspot({
        id: 'ch3.corridorThree.alcove',
        hitArea: rect(905, 190, 210, 390),
        approach: { x: 820, y: 620, facing: 'right' },
        when: when({ noFlags: ['ch3.toadRevealed'] }),
        icon: 'props/ch3/reflected-eyes',
        kind: 'spellTarget',
        glow: 'soft',
        requiredSpell: 'lumos',
        onInteract: [setPiecePlay('ch3.setPiece.trevorReveal')],
      }),
      actionHotspot({
        id: 'ch3.corridorThree.trevor',
        hitArea: circle(1030, 515, 96),
        approach: { x: 900, y: 620, facing: 'right' },
        when: when({
          allFlags: ['ch3.toadRevealed'],
          noFlags: ['ch3.toadFound'],
        }),
        icon: 'toad',
        kind: 'action',
        glow: 'interactionGold',
        onInteract: [dialogueStart('ch3.dialogue.trevorFound')],
      }),
    ],
  }),
});

export const returnTrevorScene = defineScene({
  id: 'ch3.scene.returnTrevor',
  order: 80,
  room: 'ch3.corridorOne',
  spawn: 'return',
  when: when({ allFlags: ['ch3.toadFound'], noFlags: ['ch3.chapterCardSeen'] }),
  onEnter: [],
  quest,
  mapId,
  resumeAt: { room: 'ch3.corridorOne', spawn: 'return' },
  layer: storyLayer({
    occupants: [
      occupant('ch3.npc.neville', 820, 610, 'left', 'relieved'),
      occupant('ch3.npc.trevor', 930, 610, 'left', 'held'),
      occupant(
        'ch3.npc.friendlyGhost',
        320,
        500,
        'right',
        'ambient',
        when({ allFlags: ['ch3.toadReturned'] }),
      ),
    ],
    hotspots: [
      actionHotspot({
        id: 'ch3.corridorOne.neville',
        hitArea: circle(820, 480, 112),
        approach: { x: 690, y: 620, facing: 'right' },
        when: when({ noFlags: ['ch3.toadReturned'] }),
        icon: 'talk',
        onInteract: [dialogueStart('ch3.dialogue.trevorReturned')],
      }),
      actionHotspot({
        id: 'ch3.corridorOne.friendlyGhost',
        hitArea: circle(320, 390, 112),
        approach: { x: 450, y: 620, facing: 'left' },
        when: when({
          allFlags: ['ch3.toadReturned'],
          noFlags: ['ch3.ghostBookAccepted'],
        }),
        icon: 'props/ch3/torn-book',
        kind: 'talk',
        glow: 'soft',
        onInteract: [dialogueStart('ch3.dialogue.ghostBook')],
      }),
      actionHotspot({
        id: 'ch3.corridorOne.toCommonRoom',
        hitArea: rect(1120, 260, 120, 330),
        approach: { x: 1080, y: 620, facing: 'right' },
        when: when({ allFlags: ['ch3.toadReturned'] }),
        icon: 'castle-map',
        glow: 'interactionGold',
        onInteract: [uiOpen('satchel', 'map')],
      }),
    ],
  }),
});

export const chapterCloseScene = defineScene({
  id: 'ch3.scene.chapterClose',
  order: 90,
  room: 'ch3.commonRoom',
  spawn: 'close',
  when: when({ allFlags: ['ch3.toadReturned'], noFlags: ['ch3.complete'] }),
  onEnter: [],
  quest,
  mapId,
  resumeAt: { room: 'ch3.commonRoom', spawn: 'close' },
  layer: storyLayer({
    hotspots: [
      actionHotspot({
        id: 'ch3.commonRoom.spellbook',
        hitArea: rect(500, 310, 280, 210),
        approach: { x: 640, y: 620, facing: 'right' },
        when: when({ noFlags: ['ch3.chapterCardSeen'] }),
        icon: 'spellbook',
        onInteract: [setPiecePlay('ch3.setPiece.chapterClose')],
      }),
    ],
  }),
});

export const chapter3SceneDefinitions = Object.freeze([
  spellbookParcelScene,
  lumosClassScene,
  leviosaClassScene,
  trevorMissingScene,
  corridorOneScene,
  corridorTwoScene,
  corridorThreeScene,
  returnTrevorScene,
  chapterCloseScene,
]);

export const chapter3SceneOrder = Object.freeze(
  chapter3SceneDefinitions.map(({ id }) => id),
);
