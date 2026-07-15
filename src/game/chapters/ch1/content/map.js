import { flagSet, mapLocation } from './authoring.js';

export const chapter1Map = {
  contractVersion: 1,
  id: 'map.ch1.diagon',
  asset: 'maps/ch1/diagon',
  locations: [
    mapLocation({
      id: 'map.ch1.diagonStreet',
      icon: 'street',
      caption: 'Explore',
      alwaysUnlocked: true,
      to: { room: 'ch1.diagonStreet', spawn: 'west' },
      objectiveTarget: { room: 'ch1.diagonStreet', hotspot: 'street.guideTicket' },
      vignette: { x: 114, y: 374, width: 212, height: 184 },
    }),
    mapLocation({
      id: 'map.ch1.ollivanders',
      icon: 'wand-shop',
      caption: 'Wand',
      to: { room: 'ch1.ollivanders', spawn: 'entry' },
      objectiveTarget: { room: 'ch1.diagonStreet', hotspot: 'street.ollivandersDoor' },
      vignette: { x: 324, y: 282, width: 212, height: 184 },
      beforeTravel: [flagSet('ch1.mapUsed')],
    }),
    mapLocation({
      id: 'map.ch1.malkins',
      icon: 'robes-shop',
      caption: 'Robes',
      to: { room: 'ch1.malkins', spawn: 'entry' },
      objectiveTarget: { room: 'ch1.diagonStreet', hotspot: 'street.malkinsDoor' },
      vignette: { x: 588, y: 236, width: 212, height: 184 },
    }),
    mapLocation({
      id: 'map.ch1.menagerie',
      icon: 'pet-shop',
      caption: 'Pet',
      to: { room: 'ch1.menagerie', spawn: 'entry' },
      objectiveTarget: { room: 'ch1.diagonStreet', hotspot: 'street.menagerieDoor' },
      vignette: { x: 894, y: 350, width: 212, height: 184 },
    }),
  ],
  routes: [
    {
      id: 'route.ch1.streetToOllivanders',
      from: 'map.ch1.diagonStreet',
      to: 'map.ch1.ollivanders',
      points: [{ x: 220, y: 466 }, { x: 315, y: 344 }, { x: 430, y: 374 }],
    },
    {
      id: 'route.ch1.ollivandersToMalkins',
      from: 'map.ch1.ollivanders',
      to: 'map.ch1.malkins',
      points: [{ x: 430, y: 374 }, { x: 565, y: 286 }, { x: 694, y: 328 }],
    },
    {
      id: 'route.ch1.malkinsToMenagerie',
      from: 'map.ch1.malkins',
      to: 'map.ch1.menagerie',
      points: [{ x: 694, y: 328 }, { x: 848, y: 402 }, { x: 1000, y: 442 }],
    },
  ],
};
