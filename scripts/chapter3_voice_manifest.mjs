function voiceLine({
  chapter,
  key,
  role,
  text,
  generationText = text,
  transcriptionAliases = [],
}) {
  return Object.freeze({
    chapter,
    key,
    role,
    text,
    generationText,
    transcriptionAliases: Object.freeze(transcriptionAliases),
    acceptableTexts: Object.freeze([...new Set([text, generationText, ...transcriptionAliases])]),
  });
}

const line = (key, role, text, generationText, transcriptionAliases) => voiceLine({
  chapter: key.startsWith('voice/ch4/') ? 4 : 3,
  key,
  role,
  text,
  generationText,
  transcriptionAliases,
});

export const chapter3VoiceManifest = Object.freeze([
  line(
    'voice/ch3/home/letter',
    'home',
    'Dear Violet, we are so proud of your first days at Hogwarts. Open the parcel and show us what you learn. Love, Mum and Dad.',
  ),
  line(
    'voice/ch3/flitwick/every-witch-needs-light',
    'flitwick',
    'Every witch needs a light, Violet. This little lantern has forgotten how to shine.',
  ),
  line(
    'voice/ch3/flitwick/letters-into-magic',
    'flitwick',
    'Letters into magic. Listen: Lumos.',
  ),
  line('voice/ch3/flitwick/splendid-light', 'flitwick', 'Splendid! You woke the light.'),
  line(
    'voice/ch3/flitwick/long-spells-little-pieces',
    'flitwick',
    'Long spells come in little pieces. Listen closely as they lift the feather.',
  ),
  line('voice/ch3/flitwick/swish-and-flick', 'flitwick', 'Swish and flick!'),
  line(
    'voice/ch3/flitwick/up-she-goes',
    'flitwick',
    'Up she goes! That feather could not be happier.',
  ),
  line(
    'voice/ch3/flitwick/use-lumos',
    'flitwick',
    'A little light may help you see where Trevor has been.',
  ),
  line(
    'voice/ch3/neville/trevor-missing',
    'neville',
    'Violet, have you seen Trevor? He slipped away into the night corridors.',
  ),
  line(
    'voice/ch3/neville/please-help',
    'neville',
    'Please help me find Trevor. He likes hiding in dark places.',
  ),
  line(
    'voice/ch3/neville/trevor-safe',
    'neville',
    'Trevor! You found him. Thank you, Violet. I was so worried.',
  ),
  line(
    'voice/ch3/narrator/armor-reaction',
    'narrator',
    'The armor squeaks indignantly. No toad in there.',
  ),
  line(
    'voice/ch3/narrator/curtain-reaction',
    'narrator',
    'The curtain sneezes out one enormous puff of dust.',
  ),
  line(
    'voice/ch3/narrator/trevor-found',
    'narrator',
    'Violet scoops Trevor up as he gives one indignant croak.',
  ),
  line(
    'voice/ch3/ghost/book-request',
    'ghost',
    'Oh! A helpful young witch. My favorite book has torn pages. Please remember it when you learn a mending spell.',
  ),
  line(
    'voice/ch3/ghost/card-reward',
    'ghost',
    'Keep this Bertie Bott card for listening. A promise can still begin with a present.',
  ),
  line(
    'voice/ch3/narrator/chapter-close',
    'narrator',
    'Lumos and Leviosa now rest together in Violet’s spellbook. Her first spells are ready whenever she needs them.',
  ),
  line(
    'voice/ch3/narrator/flying-preview',
    'narrator',
    'Next time, flying lessons begin, with bright star rings waiting above the lawn.',
  ),

  line('voice/ch3/learning/lumos/l', 'learning', 'L', 'Luh'),
  line('voice/ch3/learning/lumos/u', 'learning', 'U', 'uh'),
  line('voice/ch3/learning/lumos/m', 'learning', 'M', 'mmm', ['Mm-hmm.']),
  line('voice/ch3/learning/lumos/o', 'learning', 'O', 'oh'),
  line('voice/ch3/learning/lumos/s', 'learning', 'S', 'sss'),
  line('voice/ch3/learning/lumos/e', 'learning', 'E', 'Ehh', ['Eh']),
  line('voice/ch3/learning/lumos/a', 'learning', 'A', 'ah'),
  line('voice/ch3/learning/leviosa/win', 'learning', 'WIN', 'Win'),
  line('voice/ch3/learning/leviosa/gar', 'learning', 'GAR', 'Gahr', ['Ga']),
  line('voice/ch3/learning/leviosa/dium', 'learning', 'DIUM', 'Dee-umm', ['D, um']),
  line('voice/ch3/learning/leviosa/levi', 'learning', 'LEVI', 'Leh-vee', ['Levy']),
  line('voice/ch3/learning/leviosa/o', 'learning', 'O', 'Oh'),
  line('voice/ch3/learning/leviosa/sa', 'learning', 'SA', 'Saa', ['So']),

  line(
    'voice/ch3/objective/open-spellbook',
    'narrator',
    'Tap the post owl and open the parcel from home.',
  ),
  line(
    'voice/ch3/objective/learn-lumos',
    'narrator',
    'Visit Charms class and learn Lumos from Professor Flitwick.',
  ),
  line(
    'voice/ch3/objective/learn-leviosa',
    'narrator',
    'Return to Professor Flitwick and lift the feather with Leviosa.',
  ),
  line('voice/ch3/objective/help-neville', 'narrator', 'Talk to Neville after class.'),
  line(
    'voice/ch3/objective/follow-trail',
    'narrator',
    'Use Lumos in the first night corridor and follow the wet footprints.',
  ),
  line(
    'voice/ch3/objective/find-clue',
    'narrator',
    'Use Lumos in the second corridor to find Trevor’s trail.',
  ),
  line(
    'voice/ch3/objective/find-trevor',
    'narrator',
    'Use Lumos in the third corridor and find Trevor.',
  ),
  line(
    'voice/ch3/objective/return-trevor',
    'narrator',
    'Take Trevor back to Neville in the first corridor.',
  ),
  line(
    'voice/ch3/objective/turn-page',
    'narrator',
    'Return to the common room and open Violet’s spellbook.',
  ),
  line(
    'voice/ch3/objective/fix-book',
    'ghost',
    'Remember the friendly ghost’s torn book when you learn Reparo.',
    undefined,
    ['Remember the friendly ghost torn book when you learn Reparo.'],
  ),

  line(
    'voice/ch3/recap/spellbook',
    'narrator',
    'Violet opened her first spellbook and headed to Charms class.',
  ),
  line(
    'voice/ch3/recap/first-spells',
    'narrator',
    'Professor Flitwick taught Violet Lumos and Leviosa.',
  ),
  line(
    'voice/ch3/recap/trevor-trail',
    'narrator',
    'Violet followed Trevor’s trail through the moonlit corridors.',
  ),
  line(
    'voice/ch3/recap/trevor-safe',
    'narrator',
    'Violet found Trevor and brought him safely back to Neville.',
  ),

  line(
    'voice/ch3/card/circe',
    'narrator',
    'Circe was a powerful witch whose magic could transform anything she touched.',
  ),
  line(
    'voice/ch3/card/bertie-bott',
    'narrator',
    'Bertie Bott invented beans with every flavor, including a few surprising ones.',
  ),
  line(
    'voice/ch4/narrator/preview',
    'narrator',
    'Flying lessons are coming soon. Violet will glide through bright star rings above the lawn.',
  ),
]);

export function chapterVoiceLines(chapter) {
  return chapter3VoiceManifest.filter((entry) => entry.chapter === chapter);
}
