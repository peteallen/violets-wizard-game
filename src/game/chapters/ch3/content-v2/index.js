import { defineChapter } from '../../../content/chapterComposer.js';
import { chapter3AssetDefinitions, chapter3AssetKeys } from './assets.js';
import { chapter3CharacterIds, chapter3NpcDefinitions } from './cast.js';
import { chapter3DialogueDefinitions } from './dialogues.js';
import { chapter3LearningBeatDefinitions } from './learning.js';
import { chapter3MapDefinitions } from './map.js';
import { chapter3QuestDefinitions } from './quests.js';
import { chapter3RecapDefinitions } from './recaps.js';
import { chapter3RoomDefinitions } from './rooms.js';
import { chapter3SceneDefinitions, chapterCloseScene } from './scenes.js';
import { chapter3SetPieceDefinitions } from './setPieces.js';

export const chapter3V2 = defineChapter({
  contractVersion: 2,
  id: 'ch3',
  number: 3,
  title: 'First Classes',
  season: 'autumn',
  start: {
    scene: 'ch3.scene.spellbookParcel',
    room: 'ch3.commonRoom',
    spawn: 'parcel',
  },
  chapterCard: {
    art: 'chapterCards/ch3/first-spells',
    voice: 'voice/ch3/narrator/chapter-close',
    title: 'Violet’s First Spells',
  },
  yearbookMoments: [],
  fragments: [
    { rooms: chapter3RoomDefinitions },
    { scenes: chapter3SceneDefinitions },
    { npcs: chapter3NpcDefinitions },
    { dialogues: chapter3DialogueDefinitions },
    { quests: chapter3QuestDefinitions },
    { learningBeats: chapter3LearningBeatDefinitions },
    { setPieces: chapter3SetPieceDefinitions },
    { maps: chapter3MapDefinitions },
    { recaps: chapter3RecapDefinitions },
    { assets: chapter3AssetDefinitions },
    { characterDependencies: chapter3CharacterIds },
  ],
});

export const chapter3V2Flags = Object.freeze([
  'ch3.spellbookOpened',
  'ch3.lumosLearned',
  'ch3.lumosProved',
  'ch3.leviosaLearned',
  'ch3.toadQuestAccepted',
  'ch3.trailFound',
  'ch3.corridorCardFound',
  'ch3.corridorRibbonFound',
  'ch3.corridorClueFound',
  'ch3.toadRevealed',
  'ch3.toadFound',
  'ch3.toadReturned',
  'ch3.ghostBookAccepted',
  'ch3.chapterCardSeen',
  'ch3.complete',
]);

export const chapter3V2Status = 'placeholder';
export const chapter3NextChapterId = 'ch4';
export const chapter3EndMarker = Object.freeze({
  chapter: chapter3V2.id,
  scene: chapterCloseScene.id,
  room: chapterCloseScene.room,
});
export const chapter3ResumeRedirects = Object.freeze([
  Object.freeze({
    from: Object.freeze({
      chapter: 'ch3',
      scene: 'ch3.scene.preview',
      room: 'ch3.previewRoom',
    }),
    to: Object.freeze({
      chapter: chapter3V2.id,
      scene: chapter3V2.start.scene,
      room: chapter3V2.start.room,
      spawn: chapter3V2.start.spawn,
    }),
  }),
]);

export const chapter3ContentPackageV2 = Object.freeze({
  id: chapter3V2.id,
  chapter: chapter3V2,
  maps: chapter3V2.maps,
  resumeRecaps: chapter3V2.recaps,
  assets: chapter3AssetDefinitions,
  assetKeys: chapter3AssetKeys,
  codeResourceKeys: Object.freeze([]),
  characterDependencies: chapter3V2.characterDependencies,
  flags: chapter3V2Flags,
  status: chapter3V2Status,
});

export { chapter3V2 as chapter3 };
export default chapter3ContentPackageV2;
