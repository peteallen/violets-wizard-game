const PROFILE_PATHS = Object.freeze({
  house: 'character.house',
  'pet.type': 'character.pet.type',
  'pet.name': 'character.pet.name',
  'appearance.robeTrim': 'character.appearance.robeTrim',
  wandId: 'character.wandId',
  // Retained for compatible Chapter One content authored before the v2
  // profile selector contract made character-relative paths canonical.
  'character.house': 'character.house',
  'character.pet.type': 'character.pet.type',
  'character.pet.name': 'character.pet.name',
  'character.appearance.robeTrim': 'character.appearance.robeTrim',
  'settings.learning': 'settings.learning',
});

export function conditionMatches(condition, save) {
  if (!condition) return true;
  const flags = save?.progress?.questFlags ?? {};
  if ((condition.allFlags ?? []).some((flag) => !flags[flag])) return false;
  if ((condition.anyFlags ?? []).length && !(condition.anyFlags ?? []).some((flag) => Boolean(flags[flag]))) return false;
  if ((condition.noFlags ?? []).some((flag) => Boolean(flags[flag]))) return false;
  if ((condition.knownSpells ?? []).some((spell) => !(save?.spellbook?.known ?? []).includes(spell))) return false;
  for (const [path, expected] of Object.entries(condition.profileEquals ?? {})) {
    const savePath = PROFILE_PATHS[path];
    if (!savePath || readPath(save, savePath) !== expected) return false;
  }
  return true;
}

export function readPath(object, path) {
  return path.split('.').reduce((value, key) => value?.[key], object);
}

export function writePath(object, path, value) {
  const parts = path.split('.');
  let cursor = object;
  for (const part of parts.slice(0, -1)) {
    if (!cursor[part] || typeof cursor[part] !== 'object') cursor[part] = {};
    cursor = cursor[part];
  }
  cursor[parts.at(-1)] = value;
}
