import { defineScene } from '../../../../content/chapterAuthoring.js';
import { dialogueStart, flagSet, when } from '../authoring.js';

export const wandShoppingScene = defineScene({
  id: 'ch1.wandShopping',
  room: 'ch1.ollivanders',
  spawn: 'entry',
  order: 6,
  quest: 'ch1.chooseWand',
  when: when({ allFlags: ['ch1.satchelReceived'], noFlags: ['ch1.wandChosen'] }),
  // Keep the legacy receipt save-compatible: reaching Ollivanders by its
  // street door satisfies the same route step as taking the map.
  onEnter: [flagSet('ch1.mapUsed'), dialogueStart('ch1.wandmaker.welcome')],
});
