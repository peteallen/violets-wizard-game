import {
  chapter2ContentPackageV2,
  chapter2NextChapterId,
  chapter2ResumeRedirects,
  chapter2V2,
  chapter2V2Flags,
  chapter2V2Status,
} from '../../chapters/ch2/content-v2/index.js';
import { chapter2AssetKeys } from '../../chapters/ch2/content-v2/assets.js';
import { chapter2CharacterIds } from '../../chapters/ch2/content-v2/cast.js';

export const chapter2 = chapter2V2;
export const chapter2Status = chapter2V2Status;
export const chapter2Flags = chapter2V2Flags;
export const chapter2CodeResourceKeys = chapter2ContentPackageV2.codeResourceKeys;

export {
  chapter2AssetKeys,
  chapter2CharacterIds,
  chapter2ContentPackageV2,
  chapter2NextChapterId,
  chapter2ResumeRedirects,
};

export default chapter2;
