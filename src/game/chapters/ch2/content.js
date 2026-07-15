import {
  chapter2,
  chapter2AssetKeys,
  chapter2CharacterIds,
  chapter2CodeResourceKeys,
  chapter2Flags,
  chapter2Status,
} from '../../content/chapters/ch2.js';

export const chapter2ContentPackage = Object.freeze({
  id: chapter2.id,
  chapter: chapter2,
  maps: Object.freeze({}),
  resumeRecaps: Object.freeze([]),
  assetKeys: Object.freeze([...chapter2AssetKeys]),
  codeResourceKeys: Object.freeze([...chapter2CodeResourceKeys]),
  characterDependencies: chapter2CharacterIds,
  flags: Object.freeze([...chapter2Flags]),
  status: chapter2Status,
});

export default chapter2ContentPackage;
