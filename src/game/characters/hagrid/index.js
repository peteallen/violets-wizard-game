export {
  hagridCharacterDefinition,
  hagridCharacterReview,
  hagridFullFrameCharacterDefinition,
} from './definition.js';

export async function loadHagridCharacterRuntime() {
  const { hagridCharacterRuntime } = await import('./runtime.js');
  return hagridCharacterRuntime;
}
