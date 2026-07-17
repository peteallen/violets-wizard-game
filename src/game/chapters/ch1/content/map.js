import { flagSet, mapLocation } from './authoring.js';

export const chapter1Map = {
  contractVersion: 1,
  id: 'map.ch1.diagon',
  asset: 'maps/ch1/diagon',
  locations: [
    mapLocation({
      id: 'map.ch1.diagonStreet',
      icon: 'street',
      caption: 'Diagon Alley',
      alwaysUnlocked: true,
      to: { room: 'ch1.diagonStreet', spawn: 'west' },
      objectiveTarget: { room: 'ch1.diagonStreet', hotspot: 'street.guideTicket' },
      vignette: { x: 112, y: 310, width: 204, height: 242 },
    }),
    mapLocation({
      id: 'map.ch1.ollivanders',
      icon: 'wand-shop',
      caption: 'Ollivanders',
      to: { room: 'ch1.ollivanders', spawn: 'entry' },
      objectiveTarget: { room: 'ch1.diagonStreet', hotspot: 'street.ollivandersDoor' },
      vignette: { x: 392, y: 282, width: 204, height: 242 },
      beforeTravel: [flagSet('ch1.mapUsed')],
    }),
    mapLocation({
      id: 'map.ch1.malkins',
      icon: 'robes-shop',
      caption: 'Madam Malkin’s',
      to: { room: 'ch1.malkins', spawn: 'entry' },
      objectiveTarget: { room: 'ch1.diagonStreet', hotspot: 'street.malkinsDoor' },
      vignette: { x: 672, y: 266, width: 204, height: 242 },
    }),
    mapLocation({
      id: 'map.ch1.menagerie',
      icon: 'pet-shop',
      caption: 'Menagerie',
      to: { room: 'ch1.menagerie', spawn: 'entry' },
      objectiveTarget: { room: 'ch1.diagonStreet', hotspot: 'street.menagerieDoor' },
      vignette: { x: 952, y: 294, width: 204, height: 242 },
    }),
  ],
  routes: [
    {
      id: 'route.ch1.streetToOllivanders',
      from: 'map.ch1.diagonStreet',
      to: 'map.ch1.ollivanders',
      points: [{ x: 316, y: 410 }, { x: 354, y: 375 }, { x: 392, y: 382 }],
    },
    {
      id: 'route.ch1.ollivandersToMalkins',
      from: 'map.ch1.ollivanders',
      to: 'map.ch1.malkins',
      points: [{ x: 596, y: 382 }, { x: 634, y: 338 }, { x: 672, y: 366 }],
    },
    {
      id: 'route.ch1.malkinsToMenagerie',
      from: 'map.ch1.malkins',
      to: 'map.ch1.menagerie',
      points: [{ x: 876, y: 366 }, { x: 914, y: 398 }, { x: 952, y: 394 }],
    },
  ],
};
