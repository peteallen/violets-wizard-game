import { drawChapterThreeTargetProps } from '../../render/ChapterThreePropRenderer.js';
import {
  drawChapterClose,
  drawCorridorOneReveal,
  drawLeviosaFeather,
  drawLumosBloom,
  drawSpellbookReveal,
  drawTrevorFound,
  drawTrevorReunion,
  drawTrevorReveal,
} from '../../render/ChapterThreeSetPieceRenderer.js';
import { chapter3PresentationMetadata } from './presentationMetadata.js';

function setPieceRegistration(id, renderer, draw) {
  return Object.freeze({
    id,
    kind: 'set-piece',
    renderer,
    draw,
    inputLockSeconds: 1,
  });
}

export const chapter3LightMaskRegistration = Object.freeze({
  id: 'ch3.presentation.lightMask',
  kind: 'world-effect',
  layer: 'lighting',
  when: (state) => Boolean(state?.roomEffects?.lightMask),
  draw: (context, request) => request.effectsRenderer?.drawLightMask(
    context,
    request.state.roomEffects.lightMask,
    {
      cameraX: request.cameraX,
      reducedMotion: request.reducedMotion,
      time: request.time,
    },
  ),
});

export const chapter3FeatherRegistration = Object.freeze({
  id: 'ch3.presentation.feather',
  kind: 'world-effect',
  layer: 'front-effects',
  when: (state) => Boolean(state?.roomEffects?.feather) && !state?.learning,
  draw: (context, request) => request.effectsRenderer?.drawFeather(
    context,
    request.state.roomEffects.feather,
    request.time,
    {
      reducedMotion: request.reducedMotion,
      x: 640 - (request.cameraX ?? 0),
      y: 470,
    },
  ),
});

export const chapter3PropRegistration = Object.freeze({
  id: 'ch3.presentation.targetProps',
  kind: 'world-effect',
  layer: 'front-effects',
  when: (state) => !state?.setPiece && state?.targets?.some(
    (target) => String(target?.presentation?.icon ?? '').startsWith('props/ch3/'),
  ),
  draw: drawChapterThreeTargetProps,
});

export const chapter3SetPieceRegistrations = Object.freeze([
  setPieceRegistration(
    'ch3.presentation.spellbookReveal',
    'setPiece.ch3.spellbookReveal',
    drawSpellbookReveal,
  ),
  setPieceRegistration(
    'ch3.presentation.lumosBloom',
    'setPiece.ch3.lumosBloom',
    drawLumosBloom,
  ),
  setPieceRegistration(
    'ch3.presentation.leviosaFeather',
    'setPiece.ch3.leviosaFeather',
    drawLeviosaFeather,
  ),
  setPieceRegistration(
    'ch3.presentation.corridorOneReveal',
    'setPiece.ch3.corridorOneReveal',
    drawCorridorOneReveal,
  ),
  setPieceRegistration(
    'ch3.presentation.trevorReveal',
    'setPiece.ch3.trevorReveal',
    drawTrevorReveal,
  ),
  setPieceRegistration(
    'ch3.presentation.trevorFound',
    'setPiece.ch3.trevorFound',
    drawTrevorFound,
  ),
  setPieceRegistration(
    'ch3.presentation.trevorReunion',
    'setPiece.ch3.trevorReunion',
    drawTrevorReunion,
  ),
  setPieceRegistration(
    'ch3.presentation.chapterClose',
    'setPiece.ch3.chapterClose',
    drawChapterClose,
  ),
]);

export const chapter3PresentationPackage = Object.freeze({
  chapterId: 'ch3',
  ...chapter3PresentationMetadata,
  registrations: Object.freeze([
    chapter3PropRegistration,
    chapter3FeatherRegistration,
    chapter3LightMaskRegistration,
    ...chapter3SetPieceRegistrations,
  ]),
});

export default chapter3PresentationPackage;
