import { chapter2DialogueDefinitions } from './dialogues.js';
import { chapter2QuestDefinition } from './quests.js';
import { chapter2RecapDefinitions } from './recaps.js';

function asset(key, kind, path = `assets/audio/${key}.mp3`) {
  return {
    key,
    path,
    kind,
  };
}

const imageAssets = [
  ['rooms/ch2/kings-cross', 'assets/art/rooms/ch2-kings-cross.webp'],
  ['rooms/ch2/platform', 'assets/art/rooms/ch2-platform.webp'],
  ['rooms/ch2/train-compartment', 'assets/art/rooms/ch2-train-compartment.webp'],
  ['rooms/ch2/lake-vista', 'assets/art/rooms/ch2-lake-vista.webp'],
  ['rooms/ch2/great-hall', 'assets/art/rooms/ch2-great-hall.webp'],
  ['rooms/ch2/gryffindor-common-room', 'assets/art/rooms/ch2-gryffindor-common-room.webp'],
  ['chapterCards/ch2/gryffindor-home', 'assets/art/rooms/ch2-gryffindor-common-room.webp'],
  ['cards/merlin/portrait', 'assets/art/cards/merlin.webp'],
  ['cards/jocunda-sykes/portrait', 'assets/art/cards/jocunda-sykes.webp'],
];

const sfxKeys = [
  'sfx/ch2/trainWhistle',
  'sfx/ch2/barrier-whoosh',
  'sfx/ch2/sweet-reaction',
  'sfx/ch2/gryffindor-cheer',
  'sfx/ch2/chapter-turn',
];

const musicKeys = [
  'music/ch2/platform',
  'music/ch2/lake-wonder',
  'music/ch2/sorting',
  'music/ch2/common-room',
];

const dialogueVoiceKeys = chapter2DialogueDefinitions.flatMap(({ nodes }) => (
  Object.values(nodes)
    .filter((node) => node.type === 'line')
    .map(({ voice }) => voice)
));

const objectiveVoiceKeys = Object.values(chapter2QuestDefinition.steps)
  .map(({ objective }) => objective.voice);

const recapVoiceKeys = chapter2RecapDefinitions.map(({ voice }) => voice);

const voiceKeys = [...new Set([
  ...dialogueVoiceKeys,
  ...objectiveVoiceKeys,
  ...recapVoiceKeys,
  'voice/ch2/card/merlin',
  'voice/ch2/card/jocunda-sykes',
  'voice/ch2/narrator/preview',
])];

export const chapter2AssetDefinitions = Object.freeze([
  ...imageAssets.map(([key, path]) => asset(key, 'image', path)),
  ...sfxKeys.map((key) => asset(key, 'sfx')),
  ...musicKeys.map((key) => asset(key, 'music')),
  ...voiceKeys.map((key) => asset(key, 'voice')),
]);

export const chapter2AssetKeys = Object.freeze(chapter2AssetDefinitions.map(({ key }) => key));
