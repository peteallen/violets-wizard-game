import { chapter1DialogueDefinitions } from './dialogues.js';
import { chapter1QuestDefinition } from './quests.js';

const IMAGE_PATHS = Object.freeze({
  'rooms/ch1/bedroom/base': 'assets/art/rooms/ch1-bedroom.webp',
  'rooms/ch1/bedroom/sky': 'assets/art/rooms/ch1-bedroom.webp',
  'rooms/ch1/leaky/base': 'assets/art/rooms/ch1-leaky.webp',
  'rooms/ch1/courtyard/base': 'assets/art/rooms/ch1-courtyard.webp',
  'rooms/ch1/diagon/day': 'assets/art/rooms/ch1-diagon-day.webp',
  'rooms/ch1/diagon/dusk': 'assets/art/rooms/ch1-diagon-dusk.webp',
  'rooms/ch1/ollivanders/base': 'assets/art/rooms/ch1-ollivanders.webp',
  'rooms/ch1/malkins/base': 'assets/art/rooms/ch1-malkins.webp',
  'rooms/ch1/menagerie/base': 'assets/art/rooms/ch1-menagerie.webp',
  'maps/ch1/diagon': 'assets/art/rooms/ch1-diagon-day.webp',
  'chapterCards/ch1/platform': 'assets/art/chapter-cards/ch1-platform.webp',
  'cards/morgana/portrait': 'assets/art/cards/morgana.webp',
  'cards/dumbledore/portrait': 'assets/art/cards/dumbledore.webp',
  'ui/satchel/destination-diagon-alley': 'assets/art/ui/satchel/destination-diagon-alley.webp',
  'ui/satchel/destination-ollivanders': 'assets/art/ui/satchel/destination-ollivanders.webp',
  'ui/satchel/destination-malkins': 'assets/art/ui/satchel/destination-malkins.webp',
  'ui/satchel/destination-menagerie': 'assets/art/ui/satchel/destination-menagerie.webp',
});

const AMBIENCE_PATHS = Object.freeze({
  'ambience/ch1/bedroom': 'assets/audio/music/ch1/violetTheme.mp3',
  'ambience/ch1/leaky': 'assets/audio/music/ch1/violetTheme.mp3',
  'ambience/ch1/diagon': 'assets/audio/music/ch1/diagonAlley.mp3',
  'ambience/ch1/shop': 'assets/audio/music/ch1/violetTheme.mp3',
});

const chapter1DeclaredAssetKeys = [
    'rooms/ch1/bedroom/base',
    'rooms/ch1/bedroom/sky',
    'rooms/ch1/leaky/base',
    'rooms/ch1/courtyard/base',
    'rooms/ch1/diagon/day',
    'rooms/ch1/diagon/dusk',
    'rooms/ch1/ollivanders/base',
    'rooms/ch1/malkins/base',
    'rooms/ch1/menagerie/base',
    'maps/ch1/diagon',
    'chapterCards/ch1/platform',
    'cards/morgana/portrait',
    'cards/dumbledore/portrait',
    'ui/satchel/destination-diagon-alley',
    'ui/satchel/destination-ollivanders',
    'ui/satchel/destination-malkins',
    'ui/satchel/destination-menagerie',
    'music/ch1/violetTheme',
    'music/ch1/diagonAlley',
    'music/ch1/chapterTriumph',
    'ambience/ch1/bedroom',
    'ambience/ch1/leaky',
    'ambience/ch1/diagon',
    'ambience/ch1/shop',
    'sfx/ch1/owlTap',
    'sfx/ch1/owlFlap',
    'sfx/ch1/paperSlide',
    'sfx/ch1/sealCrack',
    'sfx/ch1/wallRumble',
    'sfx/ch1/brickClack',
    'sfx/ch1/wandPaperWhirl',
    'sfx/ch1/vaseShatter',
    'sfx/ch1/wandChosen',
    'sfx/ch1/coin',
    'sfx/ch1/ticket',
    'sfx/ch1/chapterTurn',
    'sfx/ch1/petCat',
    'sfx/ch1/petOwl',
    'sfx/ch1/petToad',
    'voice/ch1/card/morgana',
    'voice/ch1/card/dumbledore',
    ...chapter1DialogueDefinitions.flatMap((dialogue) =>
      Object.values(dialogue.nodes)
        .filter((node) => node.type === 'line')
        .map((node) => node.voice),
    ),
    ...Object.values(chapter1QuestDefinition.steps).map((step) => step.objective.voice),
    'voice/ch1/recap/openLetter',
    'voice/ch1/recap/followGuide',
    // recap/useMap is shared by the live useMap objective above.
    'voice/ch1/recap/chooseRobes',
    'voice/ch1/recap/choosePet',
    'voice/ch1/recap/returnToGuide',
];

function definition(key) {
  if (IMAGE_PATHS[key]) return Object.freeze({ key, path: IMAGE_PATHS[key], kind: 'image' });
  if (AMBIENCE_PATHS[key]) return Object.freeze({ key, path: AMBIENCE_PATHS[key], kind: 'music', volume: 0.38 });
  if (key.startsWith('voice/')) return Object.freeze({ key, path: `assets/audio/${key}.mp3`, kind: 'voice' });
  if (key.startsWith('sfx/')) return Object.freeze({ key, path: `assets/audio/${key}.mp3`, kind: 'sfx' });
  if (key.startsWith('music/')) return Object.freeze({ key, path: `assets/audio/${key}.mp3`, kind: 'music' });
  throw new Error(`No Chapter One asset definition exists for ${key}.`);
}

export const chapter1AssetDefinitions = Object.freeze(
  [...new Set(chapter1DeclaredAssetKeys)].map(definition),
);

export const chapter1AssetKeys = Object.freeze(
  chapter1AssetDefinitions.map(({ key }) => key),
);
