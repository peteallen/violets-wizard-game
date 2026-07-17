import { defineStaticFullFrameCharacter } from '../staticFullFrameDefinition.js';

const definitions = defineStaticFullFrameCharacter({
  id: 'character.sorting-hat',
  slug: 'sorting-hat',
  displayName: 'Sorting Hat',
  kind: 'magical-object',
  voiceRole: 'ancient-kind-hat',
  extraPoses: ['waiting'],
  // The shared full-frame canvas leaves generous transparent space around
  // this unusually wide prop. Give the painted hat enough world height for
  // its cone and brim to remain readable when it sits behind Violet.
  worldHeight: 300,
});

export const sortingHatCharacterDefinition = definitions.characterDefinition;
export const sortingHatFullFrameCharacterDefinition = definitions.fullFrameDefinition;
