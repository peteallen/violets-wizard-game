export {
  CHARACTER_ASSET_KINDS,
  CHARACTER_SURFACES,
  CharacterDefinition,
  CharacterDefinitionValidationError,
  assertCharacterId,
  assertCharacterSurface,
  defineCharacter,
  validateCharacterDefinition,
} from './CharacterDefinition.js';

export {
  CharacterRegistry,
  CharacterRegistryError,
  UnknownCharacterError,
  UnsupportedCharacterCapabilityError,
  UnsupportedCharacterSurfaceError,
  validateCharacterRuntime,
} from './CharacterRegistry.js';

export {
  CharacterModule,
  CharacterModuleValidationError,
  defineCharacterModule,
  validateCharacterModule,
} from './CharacterModule.js';

export {
  CharacterCatalog,
  CharacterCatalogError,
  buildCharacterCatalog,
} from './CharacterCatalog.js';

export {
  loadVioletCharacterRuntime,
  violetCharacterDefinition,
  violetCharacterReview,
  violetFullFrameCharacterDefinition,
} from './violet/index.js';

export {
  hagridCharacterDefinition,
  hagridCharacterReview,
  hagridFullFrameCharacterDefinition,
  loadHagridCharacterRuntime,
} from './hagrid/index.js';

export {
  loadWandmakerCharacterRuntime,
  wandmakerCharacterDefinition,
  wandmakerCharacterReview,
  wandmakerFullFrameCharacterDefinition,
} from './wandmaker/index.js';

export {
  loadMadamMalkinCharacterRuntime,
  madamMalkinCharacterDefinition,
  madamMalkinCharacterReview,
  madamMalkinFullFrameCharacterDefinition,
} from './madam-malkin/index.js';
