import { chapter2DialogueDefinitions } from './dialogues.js';
import { chapter2QuestDefinition } from './quests.js';
import { chapter2RecapDefinitions } from './recaps.js';

function asset(key, kind) {
  const extension = kind === 'image' ? 'webp' : 'mp3';
  return {
    key,
    path: `assets/placeholder/${key}.${extension}`,
    kind,
  };
}

const imageKeys = [
  'rooms/ch2/kings-cross-greybox',
  'rooms/ch2/platform-greybox',
  'rooms/ch2/train-compartment-greybox',
  'rooms/ch2/lake-vista-greybox',
  'rooms/ch2/great-hall-greybox',
  'rooms/ch2/great-hall-gryffindor-greybox',
  'rooms/ch2/gryffindor-common-room-greybox',
  'chapterCards/ch2/gryffindor-home-greybox',
  'cards/merlin/portrait-greybox',
  'cards/jocunda-sykes/portrait-greybox',
  'icons/ch2/every-flavor-beans',
  'icons/ch2/chocolate-frog',
  'icons/ch2/cauldron-cake',
  'icons/ch2/protect-friends',
  'icons/ch2/explore-mysteries',
  'icons/ch2/help-someone',
  'icons/ch2/step-forward',
  'icons/ch2/tell-truth',
  'icons/ch2/stay-close',
];

const sfxKeys = [
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
])];

export const chapter2AssetDefinitions = Object.freeze([
  ...imageKeys.map((key) => asset(key, 'image')),
  ...sfxKeys.map((key) => asset(key, 'sfx')),
  ...musicKeys.map((key) => asset(key, 'music')),
  ...voiceKeys.map((key) => asset(key, 'voice')),
]);

export const chapter2AssetKeys = Object.freeze(chapter2AssetDefinitions.map(({ key }) => key));
