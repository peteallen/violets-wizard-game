import { defineScene } from '../../../../content/chapterAuthoring.js';
import { setPiecePlay, when } from '../authoring.js';

export const chapterCardScene = defineScene({
  id: 'ch1.chapterCard',
  room: 'ch1.chapterCardRoom',
  spawn: 'start',
  order: 10,
  quest: null,
  when: when({ allFlags: ['ch1.ticketReceived'], noFlags: ['ch1.chapterCardSeen'] }),
  onEnter: [setPiecePlay('sp.chapterCard')],
});
