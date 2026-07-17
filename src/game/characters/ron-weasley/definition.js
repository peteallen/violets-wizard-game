import { defineStaticFullFrameCharacter } from '../staticFullFrameDefinition.js';

const definitions = defineStaticFullFrameCharacter({
  id: 'character.ron-weasley',
  slug: 'ron-weasley',
  displayName: 'Ron Weasley',
  voiceRole: 'friendly-classmate',
  extraPoses: ['seated'],
  worldHeight: 205,
});

export const ronWeasleyCharacterDefinition = definitions.characterDefinition;
export const ronWeasleyFullFrameCharacterDefinition = definitions.fullFrameDefinition;
