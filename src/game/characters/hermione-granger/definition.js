import { defineStaticFullFrameCharacter } from '../staticFullFrameDefinition.js';

const definitions = defineStaticFullFrameCharacter({
  id: 'character.hermione-granger',
  slug: 'hermione-granger',
  displayName: 'Hermione Granger',
  voiceRole: 'friendly-classmate',
  extraPoses: ['seated'],
  worldHeight: 198,
});

export const hermioneGrangerCharacterDefinition = definitions.characterDefinition;
export const hermioneGrangerFullFrameCharacterDefinition = definitions.fullFrameDefinition;
