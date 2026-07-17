import { defineStaticFullFrameCharacter } from '../staticFullFrameDefinition.js';

const definitions = defineStaticFullFrameCharacter({
  id: 'character.headmaster',
  slug: 'headmaster',
  displayName: 'Headmaster',
  voiceRole: 'gentle-headmaster',
  extraPoses: ['seated'],
  worldHeight: 245,
});

export const headmasterCharacterDefinition = definitions.characterDefinition;
export const headmasterFullFrameCharacterDefinition = definitions.fullFrameDefinition;
