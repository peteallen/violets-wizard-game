export {
  madamMalkinCharacterDefinition,
  madamMalkinCharacterReview,
  madamMalkinFullFrameCharacterDefinition,
} from './definition.js';

export async function loadMadamMalkinCharacterRuntime() {
  const { madamMalkinCharacterRuntime } = await import('./runtime.js');
  return madamMalkinCharacterRuntime;
}
