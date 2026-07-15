import { defineScene } from '../../../../content/chapterAuthoring.js';
import { when } from '../authoring.js';

export const robeShoppingScene = defineScene({
  id: 'ch1.robeShopping',
  room: 'ch1.malkins',
  spawn: 'entry',
  order: 7,
  quest: 'ch1.chooseRobes',
  when: when({ allFlags: ['ch1.wandChosen'], noFlags: ['ch1.trimChosen'] }),
  onEnter: [],
});
