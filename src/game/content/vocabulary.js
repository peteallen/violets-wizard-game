const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu;

export const coreVocabulary = Object.freeze([
  'a',
  'again',
  'board',
  'bricks',
  'broom',
  'cat',
  'cards',
  'choose',
  'color',
  'come',
  'explore',
  'fast',
  'find',
  'flying',
  'follow',
  'for',
  'friend',
  'later',
  'letter',
  'look',
  'lovely',
  'map',
  'me',
  'my',
  'name',
  'new',
  'next',
  'one',
  'oops',
  'open',
  'owl',
  'own',
  'pet',
  'pick',
  'play',
  'robes',
  'so',
  'spells',
  'tap',
  'toad',
  'the',
  "train's",
  'ticket',
  'this',
  'to',
  'train',
  'try',
  'wand',
  'way',
  'witch',
  'with',
  'wow',
  'yes',
  'your',
]);

export const properNouns = Object.freeze([
  'biscuit',
  'dumbledore',
  'gold',
  'hagrid',
  'hogwarts',
  'morgana',
  'pip',
  'purple',
  'star',
  'teal',
  'violet',
]);

const allowedWords = new Set([...coreVocabulary, ...properNouns]);

export function captionWords(caption) {
  if (typeof caption !== 'string') return [];
  return (caption.match(WORD_PATTERN) ?? []).map((word) => word.replaceAll('’', "'").toLocaleLowerCase('en-US'));
}

export function isSupportedCaption(caption, maximumWords = 3) {
  const words = captionWords(caption);
  return words.length > 0 && words.length <= maximumWords && words.every((word) => allowedWords.has(word));
}
