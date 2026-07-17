export const cards = Object.freeze([
  Object.freeze({
    id: 'morgana',
    chapter: 1,
    name: 'Morgana',
    portraitAsset: 'cards/morgana/portrait',
    voice: 'voice/ch1/card/morgana',
    text: 'Morgana, a witch of magnificent mysteries.',
    caption: 'Morgana',
  }),
  Object.freeze({
    id: 'dumbledore',
    chapter: 1,
    name: 'Dumbledore',
    portraitAsset: 'cards/dumbledore/portrait',
    voice: 'voice/ch1/card/dumbledore',
    text: 'Dumbledore likes clever plans and lemon sweets.',
    caption: 'Dumbledore',
  }),
  Object.freeze({
    id: 'merlin',
    chapter: 2,
    name: 'Merlin',
    portraitAsset: 'cards/merlin/portrait',
    voice: 'voice/ch2/card/merlin',
    text: 'Merlin was famous for great magic and an even greater beard.',
    caption: 'Merlin',
  }),
  Object.freeze({
    id: 'jocunda-sykes',
    chapter: 2,
    name: 'Jocunda Sykes',
    portraitAsset: 'cards/jocunda-sykes/portrait',
    voice: 'voice/ch2/card/jocunda-sykes',
    text: 'Jocunda Sykes flew across the Atlantic on a broomstick.',
    caption: 'Jocunda Sykes',
  }),
]);

export const cardsById = Object.freeze(Object.fromEntries(cards.map((card) => [card.id, card])));

export function getCard(id) {
  return cardsById[id] ?? null;
}
