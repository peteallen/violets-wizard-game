import {
  chapter3ContentPackageV2,
  chapter3NextChapterId,
  chapter3ResumeRedirects,
  chapter3V2,
  chapter3V2Flags,
  chapter3V2Status,
} from '../../chapters/ch3/content-v2/index.js';
import { chapter3AssetKeys } from '../../chapters/ch3/content-v2/assets.js';
import { chapter3CharacterIds } from '../../chapters/ch3/content-v2/cast.js';

export const chapter3 = chapter3V2;
export const chapter3Status = chapter3V2Status;
export const chapter3Flags = chapter3V2Flags;
export const chapter3CodeResourceKeys = chapter3ContentPackageV2.codeResourceKeys;

export {
  chapter3AssetKeys,
  chapter3CharacterIds,
  chapter3ContentPackageV2,
  chapter3NextChapterId,
  chapter3ResumeRedirects,
};

export default chapter3;
