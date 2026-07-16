import { defineChapter } from '../../../content/chapterComposer.js';
import { chapter2AssetDefinitions, chapter2AssetKeys } from './assets.js';
import { chapter2CharacterIds, chapter2NpcDefinitions } from './cast.js';
import { chapter2DialogueDefinitions } from './dialogues.js';
import { chapter2QuestDefinition } from './quests.js';
import { chapter2RecapDefinitions } from './recaps.js';
import { chapter2RoomDefinitions } from './rooms.js';
import { chapter2SceneDefinitions } from './scenes.js';
import { chapter2SetPieceDefinitions } from './setPieces.js';

export const chapter2V2 = defineChapter({
  contractVersion: 2,
  id: 'ch2',
  number: 2,
  title: 'Platform 9¾ & The Sorting',
  season: 'early-autumn',
  start: {
    scene: 'ch2.scene.kingsCross',
    room: 'ch2.kingsCross',
    spawn: 'start',
  },
  chapterCard: {
    art: 'chapterCards/ch2/gryffindor-home-greybox',
    voice: 'voice/ch2/narrator/chapterEnd',
    title: 'Welcome to Gryffindor',
  },
  yearbookMoments: ['ch2.yearbook.sorting'],
  fragments: [
    { rooms: chapter2RoomDefinitions },
    { scenes: chapter2SceneDefinitions },
    { npcs: chapter2NpcDefinitions },
    { dialogues: chapter2DialogueDefinitions },
    { quests: [chapter2QuestDefinition] },
    { setPieces: chapter2SetPieceDefinitions },
    { recaps: chapter2RecapDefinitions },
    { assets: chapter2AssetDefinitions },
    { characterDependencies: chapter2CharacterIds },
  ],
});

export const chapter2V2Flags = Object.freeze([
  'ch2.barrierCrossed',
  'ch2.boardedTrain',
  'ch2.friendsMet',
  'ch2.sweetChosen',
  'ch2.sweetReactionSeen',
  'ch2.trainComplete',
  'ch2.lakeSeen',
  'ch2.greatHallEntered',
  'ch2.sortedGryffindor',
  'ch2.feastAwarded',
  'ch2.feastComplete',
  'ch2.commonRoomArrived',
  'ch2.chapterCardSeen',
  'ch2.complete',
]);

export const chapter2V2Status = 'greybox';
export const chapter2NextChapterId = 'ch3';

export const chapter2ContentPackageV2 = Object.freeze({
  id: chapter2V2.id,
  chapter: chapter2V2,
  maps: chapter2V2.maps,
  resumeRecaps: chapter2V2.recaps,
  assetKeys: chapter2AssetKeys,
  codeResourceKeys: Object.freeze([]),
  characterDependencies: chapter2V2.characterDependencies,
  flags: chapter2V2Flags,
  status: chapter2V2Status,
});

export { chapter2V2 as chapter2 };
export default chapter2ContentPackageV2;
