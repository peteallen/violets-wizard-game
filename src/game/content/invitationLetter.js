export const invitationLetterLines = Object.freeze([
  'Dear Violet,',
  'You are invited to Hogwarts School',
  'of Witchcraft and Wizardry.',
  'Your place is waiting.',
  'Bring your brightest curiosity.',
]);

export const invitationLetterNarration = Object.freeze([
  invitationLetterLines.slice(0, 3).join(' '),
  invitationLetterLines.slice(3).join(' '),
]);
