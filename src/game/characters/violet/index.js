export {
  violetCharacterDefinition,
  violetCharacterReview,
  violetFullFrameCharacterDefinition,
} from './definition.js';

export async function loadVioletCharacterRuntime() {
  const { violetCharacterRuntime } = await import('./runtime.js');
  return violetCharacterRuntime;
}
