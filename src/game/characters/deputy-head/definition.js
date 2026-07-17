import { defineStaticFullFrameCharacter } from '../staticFullFrameDefinition.js';

const definitions = defineStaticFullFrameCharacter({
  id: 'character.deputy-head',
  slug: 'deputy-head',
  displayName: 'Deputy Head',
  voiceRole: 'crisp-professor',
  worldHeight: 240,
});

export const deputyHeadCharacterDefinition = definitions.characterDefinition;
export const deputyHeadFullFrameCharacterDefinition = definitions.fullFrameDefinition;
