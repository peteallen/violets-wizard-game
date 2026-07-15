import { defineScene } from '../../../../content/chapterAuthoring.js';
import { dialogueStart, flagSet, when } from '../authoring.js';

export const wallOpeningScene = defineScene({
  id: 'ch1.wallOpening',
  room: 'ch1.courtyard',
  spawn: 'entry',
  order: 3,
  quest: 'ch1.followGuide',
  when: when({ allFlags: ['ch1.leakyReached'], noFlags: ['ch1.wallOpened'] }),
  onEnter: [flagSet('ch1.courtyardReached'), dialogueStart('ch1.guide.wall')],
});
