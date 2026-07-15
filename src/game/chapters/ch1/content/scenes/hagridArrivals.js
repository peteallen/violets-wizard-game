import { defineScene } from '../../../../content/chapterAuthoring.js';
import { dialogueStart, when } from '../authoring.js';

export const guideArrivalScene = defineScene({
  id: 'ch1.guideArrival',
  room: 'ch1.bedroom',
  spawn: 'letter',
  order: 1,
  quest: 'ch1.followGuide',
  when: when({ allFlags: ['ch1.letterRead'], noFlags: ['ch1.guideMet'] }),
  onEnter: [],
});

export const leakyArrivalScene = defineScene({
  id: 'ch1.leakyArrival',
  room: 'ch1.leaky',
  spawn: 'entry',
  order: 2,
  quest: 'ch1.followGuide',
  when: when({ allFlags: ['ch1.guideMet'], noFlags: ['ch1.leakyReached'] }),
  onEnter: [dialogueStart('ch1.guide.leaky')],
});
