export {
  wandmakerCharacterDefinition,
  wandmakerCharacterReview,
  wandmakerFullFrameCharacterDefinition,
} from './definition.js';

export async function loadWandmakerCharacterRuntime() {
  const { wandmakerCharacterRuntime } = await import('./runtime.js');
  return wandmakerCharacterRuntime;
}
