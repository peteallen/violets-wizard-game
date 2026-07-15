import { createVectorOwlRuntime } from '../owl/runtimeSupport.js';
import { petOwlDrawingProfile } from './profile.js';

export { petOwlDrawingProfile } from './profile.js';

export const petOwlCharacterRuntime = createVectorOwlRuntime(
  petOwlDrawingProfile,
  ['world', 'portrait'],
);
