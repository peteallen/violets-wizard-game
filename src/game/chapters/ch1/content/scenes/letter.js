import { defineScene } from '../../../../content/chapterAuthoring.js';
import { when } from '../authoring.js';

export const letterScene = defineScene({
  id: 'ch1.letter',
  room: 'ch1.bedroom',
  spawn: 'start',
  order: 0,
  quest: 'ch1.openLetter',
  when: when({ noFlags: ['ch1.letterRead'] }),
  onEnter: [],
});
