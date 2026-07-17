const SPELL_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: 'lumos',
    label: 'Lumos',
    incantation: 'Lumos',
    shortIncantation: 'Lumos',
    icon: 'spell.lumos.light',
    color: '#fff2b0',
    effect: Object.freeze({ kind: 'light', color: '#fff2b0' }),
    audio: Object.freeze({
      cast: 'sfx/ch3/lumos-bloom',
      success: 'sfx/ch3/lumos-bloom',
      fizzle: 'sfx/ch3/comic-fizzle-1',
    }),
    masteryThresholds: Object.freeze([1, 6, 15]),
  }),
  Object.freeze({
    id: 'leviosa',
    label: 'Leviosa',
    incantation: 'Wingardium Leviosa',
    shortIncantation: 'Leviosa',
    icon: 'spell.leviosa.feather',
    color: '#e7c8ff',
    effect: Object.freeze({ kind: 'lift', color: '#e7c8ff' }),
    audio: Object.freeze({
      cast: 'sfx/ch3/leviosa-harp',
      success: 'sfx/ch3/leviosa-harp',
      fizzle: 'sfx/ch3/comic-fizzle-1',
    }),
    masteryThresholds: Object.freeze([1, 6, 15]),
  }),
]);

const SPELLS_BY_ID = new Map(SPELL_DEFINITIONS.map((spell) => [spell.id, spell]));

export const SPELL_IDS = Object.freeze(SPELL_DEFINITIONS.map((spell) => spell.id));

export const SPELLS = Object.freeze(Object.fromEntries(
  SPELL_DEFINITIONS.map((spell) => [spell.id, spell]),
));

export function isSpellId(id) {
  return typeof id === 'string' && SPELLS_BY_ID.has(id);
}

export function spellDefinition(id) {
  return SPELLS_BY_ID.get(id) ?? null;
}

export function requireSpellDefinition(id) {
  const definition = spellDefinition(id);
  if (!definition) throw new Error(`Unknown spell ${String(id)}.`);
  return definition;
}

export function spellDefinitions() {
  return SPELL_DEFINITIONS;
}

export function masteryTierForCasts(spellId, casts) {
  const definition = requireSpellDefinition(spellId);
  if (!Number.isSafeInteger(casts) || casts < 0) {
    throw new TypeError('Spell cast count must be a non-negative safe integer.');
  }
  return definition.masteryThresholds.reduce(
    (tier, threshold) => tier + (casts >= threshold ? 1 : 0),
    0,
  );
}
