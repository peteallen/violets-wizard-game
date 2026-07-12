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
]);

export const cardsById = Object.freeze(Object.fromEntries(cards.map((card) => [card.id, card])));

export function getCard(id) {
  return cardsById[id] ?? null;
}
