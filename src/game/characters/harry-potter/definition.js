import { defineStaticFullFrameCharacter } from '../staticFullFrameDefinition.js';

const definitions = defineStaticFullFrameCharacter({
  id: 'character.harry-potter',
  slug: 'harry-potter',
  displayName: 'Harry Potter',
  voiceRole: 'friendly-classmate',
  extraPoses: ['seated'],
  worldHeight: 200,
});

export const harryPotterCharacterDefinition = definitions.characterDefinition;
export const harryPotterFullFrameCharacterDefinition = definitions.fullFrameDefinition;
