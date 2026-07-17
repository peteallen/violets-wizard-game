import { chapter3DialogueDefinitions } from './dialogues.js';
import { chapter3LearningBeatDefinitions } from './learning.js';
import { chapter3QuestDefinitions } from './quests.js';
import { chapter3RecapDefinitions } from './recaps.js';

function asset(key, kind, path = `assets/audio/${key}.mp3`) {
  return { key, path, kind };
}

const imageAssets = [
  ['rooms/ch3/common-room-autumn', 'assets/art/rooms/ch3-common-room-autumn.webp'],
  ['rooms/ch3/charms-classroom', 'assets/art/rooms/ch3-charms-classroom.webp'],
  ['rooms/ch3/corridor-one', 'assets/art/rooms/ch3-corridor-one.webp'],
  ['rooms/ch3/corridor-two', 'assets/art/rooms/ch3-corridor-two.webp'],
  ['rooms/ch3/corridor-three', 'assets/art/rooms/ch3-corridor-three.webp'],
  ['maps/ch3/castle', 'assets/art/maps/ch3-castle.webp'],
  ['maps/ch3/destination-common-room', 'assets/art/maps/ch3-destination-common-room.webp'],
  ['maps/ch3/destination-charms-classroom', 'assets/art/maps/ch3-destination-charms-classroom.webp'],
  ['maps/ch3/destination-corridor-one', 'assets/art/maps/ch3-destination-corridor-one.webp'],
  ['maps/ch3/destination-corridor-two', 'assets/art/maps/ch3-destination-corridor-two.webp'],
  ['maps/ch3/destination-corridor-three', 'assets/art/maps/ch3-destination-corridor-three.webp'],
  ['chapterCards/ch3/first-spells', 'assets/art/chapter-cards/ch3-first-spells.webp'],
  ['cards/circe/portrait', 'assets/art/cards/circe.webp'],
  ['cards/bertie-bott/portrait', 'assets/art/cards/bertie-bott.webp'],
  ['ui/spells/spellbook-spread', 'assets/art/ui/ch3/spellbook-spread.webp'],
  ['ui/spells/card-shell', 'assets/art/ui/ch3/card-shell.webp'],
  ['ui/spells/card-shell-selected', 'assets/art/ui/ch3/card-shell-selected.webp'],
  ['ui/spells/incantation-ribbon', 'assets/art/ui/ch3/incantation-ribbon.webp'],
  ['ui/spells/rune-tile', 'assets/art/ui/ch3/rune-tile.webp'],
  ['ui/spells/chant-tile', 'assets/art/ui/ch3/chant-tile.webp'],
  ['props/ch3/spellbook-parcel', 'assets/art/props/ch3/spellbook-parcel.webp'],
  ['props/ch3/lantern', 'assets/art/props/ch3/lantern.webp'],
  ['props/ch3/feather', 'assets/art/props/ch3/feather.webp'],
  ['props/ch3/wet-footprints', 'assets/art/props/ch3/wet-footprints.webp'],
  ['props/ch3/ribbon-clue', 'assets/art/props/ch3/ribbon-clue.webp'],
  ['props/ch3/reflected-eyes', 'assets/art/props/ch3/reflected-eyes.webp'],
  ['props/ch3/torn-book', 'assets/art/props/ch3/torn-book.webp'],
  ['props/ch3/toad-token', 'assets/art/props/ch3/toad-token.webp'],
  ['props/ch3/sleeping-star', 'assets/art/props/ch3/sleeping-star.webp'],
];

const sfxKeys = [
  'sfx/ch3/rune-note-l',
  'sfx/ch3/rune-note-u',
  'sfx/ch3/rune-note-m',
  'sfx/ch3/rune-note-o',
  'sfx/ch3/rune-note-s',
  'sfx/ch3/comic-fizzle-1',
  'sfx/ch3/comic-fizzle-2',
  'sfx/ch3/comic-fizzle-3',
  'sfx/ch3/lumos-bloom',
  'sfx/ch3/leviosa-harp',
  'sfx/ch3/trevor-croak-distant',
  'sfx/ch3/trevor-croak-near',
  'sfx/ch3/trevor-croak-found',
  'sfx/ch3/classroom-ambience',
];

const musicKeys = [
  'music/ch3/classroom-brightness',
  'music/ch3/night-corridors',
];

const dialogueVoiceKeys = chapter3DialogueDefinitions.flatMap(({ nodes }) => (
  Object.values(nodes)
    .filter((node) => node.type === 'line')
    .map(({ voice }) => voice)
));

const objectiveVoiceKeys = chapter3QuestDefinitions.flatMap(({ steps }) => (
  Object.values(steps).map(({ objective }) => objective.voice)
));

const recapVoiceKeys = chapter3RecapDefinitions.map(({ voice }) => voice);

const learningVoiceKeys = chapter3LearningBeatDefinitions.flatMap(({ content }) => (
  [...content.units, ...content.distractors].map(({ voice }) => voice)
));

const cardVoiceKeys = [
  'voice/ch3/card/circe',
  'voice/ch3/card/bertie-bott',
];

const voiceKeys = [...new Set([
  ...dialogueVoiceKeys,
  ...objectiveVoiceKeys,
  ...recapVoiceKeys,
  ...learningVoiceKeys,
  ...cardVoiceKeys,
])];

export const chapter3AssetDefinitions = Object.freeze([
  ...imageAssets.map(([key, path]) => asset(key, 'image', path)),
  ...sfxKeys.map((key) => asset(key, 'sfx')),
  ...musicKeys.map((key) => asset(key, 'music')),
  ...voiceKeys.map((key) => asset(key, 'voice')),
]);

export const chapter3AssetKeys = Object.freeze(
  chapter3AssetDefinitions.map(({ key }) => key),
);
