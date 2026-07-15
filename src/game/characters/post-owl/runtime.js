import { createVectorOwlRuntime } from '../owl/runtimeSupport.js';
import { postOwlDrawingProfile } from './profile.js';

export { postOwlDrawingProfile } from './profile.js';

export const postOwlCharacterRuntime = createVectorOwlRuntime(
  postOwlDrawingProfile,
  ['world'],
);
