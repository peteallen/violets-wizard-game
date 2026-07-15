import { defineScene } from '../../../../content/chapterAuthoring.js';
import { when } from '../authoring.js';

export const petShoppingScene = defineScene({
  id: 'ch1.petShopping',
  room: 'ch1.menagerie',
  spawn: 'entry',
  order: 8,
  quest: 'ch1.choosePet',
  when: when({ allFlags: ['ch1.trimChosen'], noFlags: ['ch1.petNamed'] }),
  onEnter: [],
});
