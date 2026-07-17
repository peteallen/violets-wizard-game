import { defineStaticFullFrameCharacter } from '../staticFullFrameDefinition.js';

const definitions = defineStaticFullFrameCharacter({
  id: 'character.trolley-witch',
  slug: 'trolley-witch',
  displayName: 'Trolley Witch',
  voiceRole: 'kind-shopkeeper',
  worldHeight: 230,
});

export const trolleyWitchCharacterDefinition = definitions.characterDefinition;
export const trolleyWitchFullFrameCharacterDefinition = definitions.fullFrameDefinition;
