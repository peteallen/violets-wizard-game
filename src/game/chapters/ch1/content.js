import {
  chapter1,
  chapter1AssetKeys,
} from '../../content/chapters/ch1.js';
import { chapter1CharacterIds } from './content/characters.js';
import { chapter1Map } from './content/map.js';
import { chapter1ResumeRecaps } from './content/recaps.js';
import {
  chapter1CodeResourceKeys,
  chapter1Flags,
} from './content/resources.js';

export const chapter1ContentPackage = Object.freeze({
  id: chapter1.id,
  chapter: chapter1,
  maps: Object.freeze({ [chapter1Map.id]: chapter1Map }),
  resumeRecaps: Object.freeze([...chapter1ResumeRecaps]),
  assetKeys: Object.freeze([...chapter1AssetKeys]),
  codeResourceKeys: Object.freeze([...chapter1CodeResourceKeys]),
  characterDependencies: chapter1CharacterIds,
  flags: Object.freeze([...chapter1Flags]),
});

export default chapter1ContentPackage;
