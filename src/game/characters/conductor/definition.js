import { defineStaticFullFrameCharacter } from '../staticFullFrameDefinition.js';

const definitions = defineStaticFullFrameCharacter({
  id: 'character.conductor',
  slug: 'conductor',
  displayName: 'Conductor',
  voiceRole: 'warm-conductor',
  worldHeight: 235,
});

export const conductorCharacterDefinition = definitions.characterDefinition;
export const conductorFullFrameCharacterDefinition = definitions.fullFrameDefinition;
