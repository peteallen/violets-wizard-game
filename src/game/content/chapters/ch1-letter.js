export const chapter1LetterLines = Object.freeze([
  'Dear Violet,',
  'You are invited to Hogwarts School',
  'of Witchcraft and Wizardry.',
  'Your place is waiting.',
  'Bring your brightest curiosity.',
]);

export const chapter1LetterNarration = Object.freeze([
  chapter1LetterLines.slice(0, 3).join(' '),
  chapter1LetterLines.slice(3).join(' '),
]);
