import { chapterCardScene } from './chapterCard.js';
import { diagonArrivalScene, diagonMapIntroScene } from './diagonArrival.js';
import { freeRoamScene } from './freeRoam.js';
import { guideArrivalScene, leakyArrivalScene } from './hagridArrivals.js';
import { letterScene } from './letter.js';
import { petShoppingScene } from './petShopping.js';
import { robeShoppingScene } from './robeShopping.js';
import { ticketScene } from './ticket.js';
import { wallOpeningScene } from './wallOpening.js';
import { wandShoppingScene } from './wandShopping.js';

export const chapter1SceneDefinitions = Object.freeze([
  letterScene,
  guideArrivalScene,
  leakyArrivalScene,
  wallOpeningScene,
  diagonMapIntroScene,
  diagonArrivalScene,
  wandShoppingScene,
  robeShoppingScene,
  petShoppingScene,
  ticketScene,
  chapterCardScene,
  freeRoamScene,
]);
