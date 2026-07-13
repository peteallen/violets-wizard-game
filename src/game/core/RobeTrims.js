export const ROBE_TRIMS = Object.freeze([
  robeTrim('purple', 'Purple', '#7a4fc9'),
  robeTrim('rose', 'Rose', '#b95873'),
  robeTrim('teal', 'Teal', '#3f8c88'),
  robeTrim('gold', 'Gold', '#d4a944'),
  robeTrim('ruby', 'Ruby', '#a83a48'),
  robeTrim('coral', 'Coral', '#d87055'),
  robeTrim('amber', 'Amber', '#c98432'),
  robeTrim('emerald', 'Emerald', '#397052'),
  robeTrim('sky', 'Sky', '#4e83b7'),
  robeTrim('midnight', 'Midnight', '#3f4b78'),
  robeTrim('lavender', 'Lavender', '#a779c8'),
  robeTrim('silver', 'Silver', '#87939d'),
]);

const ROBE_TRIMS_BY_ID = new Map(ROBE_TRIMS.map((trim) => [trim.id, trim]));
const DEFAULT_ROBE_TRIM = 'purple';
const HEX_COLOR = /^#[0-9a-f]{6}$/iu;

export function robeTrimOption(value) {
  if (typeof value !== 'string') return null;
  return ROBE_TRIMS_BY_ID.get(value.trim().toLowerCase()) ?? null;
}

export function normalizeRobeTrim(value) {
  return robeTrimOption(value)?.id ?? DEFAULT_ROBE_TRIM;
}

export function robeTrimColor(value) {
  const option = robeTrimOption(value);
  if (option) return option.color;
  if (typeof value === 'string' && HEX_COLOR.test(value.trim())) return value.trim();
  return ROBE_TRIMS_BY_ID.get(DEFAULT_ROBE_TRIM).color;
}

function robeTrim(id, label, color) {
  return Object.freeze({ id, label, color });
}
