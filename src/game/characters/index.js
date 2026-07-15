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
