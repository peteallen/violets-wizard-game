import { buildCharacterCatalog } from './CharacterCatalog.js';
import { catCharacterModule } from './cat/index.js';
import { hagridCharacterModule } from './hagrid/index.js';
import { madamMalkinCharacterModule } from './madam-malkin/index.js';
import { menagerieKeeperCharacterModule } from './menagerie-keeper/index.js';
import { narratorCharacterModule } from './narrator/index.js';
import { petOwlCharacterModule } from './pet-owl/index.js';
import { postOwlCharacterModule } from './post-owl/index.js';
import { toadCharacterModule } from './toad/index.js';
import { violetCharacterModule } from './violet/index.js';
import { wandmakerCharacterModule } from './wandmaker/index.js';

export const titleCharacterDependencies = Object.freeze([
  'character.violet',
  'character.post-owl',
]);

/**
 * The production composition root is the only place that enumerates concrete
 * character packages. Importing it constructs immutable metadata and retains
 * lazy loader functions; no runtime renderer or image is loaded here.
 */
export const productionCharacterModules = Object.freeze([
  violetCharacterModule,
  narratorCharacterModule,
  hagridCharacterModule,
  wandmakerCharacterModule,
  madamMalkinCharacterModule,
  menagerieKeeperCharacterModule,
  postOwlCharacterModule,
  catCharacterModule,
  petOwlCharacterModule,
  toadCharacterModule,
]);

export const productionCharacterCatalog = buildCharacterCatalog(
  productionCharacterModules,
);
