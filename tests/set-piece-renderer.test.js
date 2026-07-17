import { describe, expect, it, vi } from 'vitest';
import { chapter1LetterLines } from '../src/game/content/chapters/ch1-letter.js';
import {
  BRICK_GRID,
  SetPieceRenderer,
  brickFaceSourceRect,
  brickTileFaceBounds,
  brickTileState,
  brickTileStates,
  brickTileSourceRect,
  chapterTwoRoomVariantCoverAlpha,
  chapterTwoSetPieceState,
  deliveryLetteringAlpha,
  drawReadableInvitation,
  letterOpeningBounds,
  letterOpenState,
  ticketPresentationState,
  vaseShardPose,
  wandChosenState,
} from '../src/game/render/SetPieceRenderer.js';

function recordingTicketContext() {
  const calls = [];
  const assignments = [];
  const texts = [];
  let depth = 0;
  const methods = new Set([
    'arc', 'arcTo', 'beginPath', 'bezierCurveTo', 'clip', 'closePath', 'ellipse', 'fill',
    'fillRect', 'fillText', 'lineTo', 'moveTo', 'quadraticCurveTo', 'rect', 'restore',
    'rotate', 'roundRect', 'save', 'scale', 'setLineDash', 'stroke', 'strokeRect', 'strokeText',
    'translate',
  ]);
  const target = {
    assignments,
    calls,
    texts,
    globalAlpha: 1,
    get depth() { return depth; },
  };
  return new Proxy(target, {
    get(object, property) {
      if (methods.has(property)) {
        return (...args) => {
          calls.push([property, ...args]);
          if (property === 'fillText') texts.push(String(args[0]));
          if (property === 'save') depth += 1;
          if (property === 'restore') depth -= 1;
        };
      }
      return object[property];
    },
    set(object, property, value) {
      assignments.push([property, value]);
      object[property] = value;
      return true;
    },
  });
}

function expectOrganicSetPiece(context, label, { fullScreenFills = 0 } = {}) {
  const forbiddenGeometry = new Set([
    'arc', 'arcTo', 'ellipse', 'lineTo', 'rect', 'roundRect', 'setLineDash', 'strokeRect',
  ]);
  expect(context.calls.some(([method]) => forbiddenGeometry.has(method)), label).toBe(false);
  expect(context.calls.filter(([method]) => method === 'fillRect'), label)
    .toEqual(Array.from(
      { length: fullScreenFills },
      () => ['fillRect', 0, 0, 1280, 720],
    ));
  expect(context.calls.flatMap(([, ...args]) => args)
    .filter((value) => typeof value === 'number')
    .every(Number.isFinite), label).toBe(true);
  expect(context.assignments.filter(([, value]) => typeof value === 'number')
    .every(([, value]) => Number.isFinite(value)), label).toBe(true);
  expect(context.depth, label).toBe(0);
}

function setPieceRenderer(options = {}) {
  return new SetPieceRenderer({
    characterRenderer: { draw: vi.fn() },
    ...options,
  });
}

describe('SetPieceRenderer dispatch', () => {
  it('draws the Chapter Two preview ticket regardless of ID casing', () => {
    const renderer = setPieceRenderer();
    renderer.drawTicket = vi.fn();
    const active = {
      id: 'SP.CH2.PreviewTicket',
      requestedId: 'SP.CH2.PreviewTicket',
      time: 0,
      descriptor: { duration: 2 },
    };

    renderer.draw({}, active, {});

    expect(renderer.drawTicket).toHaveBeenCalledWith({}, active, { reducedMotion: false });
  });

  it('routes every playable Chapter Two set piece to its dedicated first-pass composition', () => {
    const cases = [
      ['ch2.setPiece.barrierRun', 'drawChapterTwoBarrierRun'],
      ['ch2.setPiece.sweetReaction', 'drawChapterTwoSweetReaction'],
      ['ch2.setPiece.lakeVista', 'drawChapterTwoLakeVista'],
      ['ch2.setPiece.sortingReveal', 'drawChapterTwoSortingReveal'],
      ['ch2.setPiece.commonRoomArrival', 'drawChapterTwoCommonRoomArrival'],
      ['ch2.setPiece.chapterCard', 'drawChapterTwoChapterCard'],
    ];
    const renderer = setPieceRenderer();
    for (const [, method] of cases) renderer[method] = vi.fn();

    for (const [id, method] of cases) {
      const active = {
        id,
        requestedId: id,
        time: 0.5,
        descriptor: { duration: 1, renderer: `setPiece.ch2.${id.split('.').at(-1)}` },
      };
      const worldState = { player: { x: 640, y: 620 }, cameraX: 0 };
      renderer.draw({}, active, worldState, { reducedMotion: true });
      expect(renderer[method]).toHaveBeenCalledWith(
        {},
        active,
        ...(method.includes('Barrier') || method.includes('Sweet') ? [worldState] : []),
        { reducedMotion: true },
      );
    }
  });

  it('holds the delivered VIOLET lettering opacity still in reduced motion', () => {
    expect(deliveryLetteringAlpha(0.1, { reducedMotion: true })).toBe(0.9);
    expect(deliveryLetteringAlpha(0.37, { reducedMotion: true })).toBe(0.9);
    expect(deliveryLetteringAlpha(0.1)).not.toBe(deliveryLetteringAlpha(0.37));
  });

  it('threads the bedroom key light into the delivering owl puppet', () => {
    const context = recordingTicketContext();
    const characterRenderer = {
      draw: vi.fn((_context, request, time) => {
        context.calls.push(['character.draw', request, time]);
      }),
    };
    const renderer = setPieceRenderer({ characterRenderer });
    const active = {
      id: 'sp.letter',
      requestedId: 'sp.letter',
      time: 0.1,
      descriptor: { duration: 2 },
    };

    renderer.draw(context, active, { keyLight: 'right' }, { reducedMotion: true });

    expect(characterRenderer.draw).toHaveBeenCalledWith(
      context,
      {
        x: expect.any(Number),
        y: expect.any(Number),
        rotation: expect.any(Number),
        scale: 1.04,
        opacity: 1,
        pose: 'takeoff',
        characterId: 'character.post-owl',
        surface: 'world',
        appearance: 'post',
        facing: 'left',
        lightSide: 'right',
        reducedMotion: true,
        lookX: -0.25,
        lookY: 0.2,
      },
      0.1,
    );
    const request = characterRenderer.draw.mock.calls[0][1];
    expect(request).not.toHaveProperty('variant');
    expect(request.x).toBeCloseTo(1040.8925782855265);
    expect(request.y).toBeCloseTo(286.4173584285362);
    expect(request.rotation).toBeCloseTo(-0.005971069285772995);
    const names = context.calls.map(([name]) => name);
    expect(names.indexOf('fillRect')).toBeLessThan(names.indexOf('character.draw'));
    expect(names.indexOf('character.draw')).toBeLessThan(names.indexOf('save'));
    const envelopeTranslate = context.calls.find(
      ([name], index) => name === 'translate' && index > names.indexOf('character.draw'),
    );
    expect(envelopeTranslate).toEqual(['translate', 925, 310]);
  });

  it('stages the seal crack before three non-intersecting letter folds and a readable push-in', () => {
    const sealed = letterOpenState(0);
    const cracked = letterOpenState(0.45);
    const topFold = letterOpenState(2);
    const readable = letterOpenState(3);
    const pushed = letterOpenState(4.2);

    expect(sealed.sealCrack).toBe(0);
    expect(cracked.sealCrack).toBeGreaterThan(0.8);
    expect(topFold.foldTop).toBeGreaterThan(topFold.foldBottom);
    expect(readable.foldTop).toBeGreaterThanOrEqual(0.99);
    expect(readable.foldBottom).toBeGreaterThanOrEqual(0.99);
    expect(pushed.paperScale).toBeGreaterThan(readable.paperScale);
    expect(pushed.paperScale).toBeLessThanOrEqual(0.87);

    const reduced = letterOpenState(2, { reducedMotion: true });
    expect(reduced.push).toBe(0);
    expect(reduced.paperScale).toBe(0.87);
    expect(reduced.foldTop).toBe(1);
    expect(reduced.foldBottom).toBe(1);
  });

  it('keeps the sealed envelope above Violet’s protected head region at every authored keyframe', () => {
    const violetHead = { x: 710, y: 388, width: 100, height: 118 };
    for (const time of [0, 0.35, 0.9, 1.55, 2.25, 3.1, 4.6]) {
      const envelope = letterOpeningBounds(letterOpenState(time)).envelope;
      if (!envelope) continue;
      const intersects = envelope.x < violetHead.x + violetHead.width
        && envelope.x + envelope.width > violetHead.x
        && envelope.y < violetHead.y + violetHead.height
        && envelope.y + envelope.height > violetHead.y;
      expect(intersects, `envelope intersects Violet at t=${time}`).toBe(false);
      expect(envelope.y + envelope.height).toBeLessThan(352);
    }
  });

  it('renders only the canonical narrated wording on the open letter', () => {
    const fillText = vi.fn();
    const context = new Proxy({ fillText, globalAlpha: 1 }, {
      get(target, property) {
        if (!Object.hasOwn(target, property)) target[property] = vi.fn();
        return target[property];
      },
    });

    drawReadableInvitation(context);

    expect(fillText.mock.calls.map(([text]) => text)).toEqual(chapter1LetterLines);
  });

  it('draws the readable invitation and owl crest entirely from organic layered curves', () => {
    const first = recordingTicketContext();
    const replayed = recordingTicketContext();

    drawReadableInvitation(first);
    drawReadableInvitation(replayed);

    expect(first.calls).toEqual(replayed.calls);
    expect(first.assignments).toEqual(replayed.assignments);
    expect(first.texts).toEqual(chapter1LetterLines);
    expectOrganicSetPiece(first, 'readable invitation');
    expect(first.calls.filter(([method]) => [
      'bezierCurveTo', 'quadraticCurveTo',
    ].includes(method)).length).toBeGreaterThan(65);
    expect(first.assignments.filter(([property]) => property === 'fillStyle').map(([, value]) => value))
      .toEqual(expect.arrayContaining([
        '#f4e7c6',
        '#7a2940',
        '#f4d58d',
        'rgba(84,34,55,0.22)',
      ]));
  });

  it('opens an exact ten-by-eight mortar grid from the center with one brick face per moving cell', () => {
    const initialStates = brickTileStates(0);
    expect(initialStates).toHaveLength(80);
    const center = brickTileState(3, 4, 1);
    const corner = brickTileState(0, 0, 1);
    expect(center.progress).toBeGreaterThan(corner.progress);
    expect(center.offsetX).not.toBe(0);
    expect(brickTileFaceBounds(center)).toMatchObject({
      width: center.width * 0.84,
      height: center.height * 0.48,
    });

    const finalStates = brickTileStates(2.2);
    expect(finalStates.every((state) => state.progress === 1 && state.alpha === 0)).toBe(true);
  });

  it('draws the street as the stage beneath all eighty wall tiles without allocating sprite canvases', () => {
    const canvasFactory = vi.fn(() => { throw new Error('The wall must not allocate a tile canvas.'); });
    const renderer = setPieceRenderer({ canvasFactory });
    const courtyard = { complete: true, naturalWidth: 1672, naturalHeight: 941 };
    const reveal = { complete: true, naturalWidth: 1672, naturalHeight: 941 };
    renderer.imageRecords.set('rooms/ch1/courtyard/base', { ready: true, image: courtyard });
    renderer.imageRecords.set('rooms/ch1/diagon/day', { ready: true, image: reveal });
    const context = Object.fromEntries([
      'save', 'restore', 'beginPath', 'rect', 'clip', 'closePath', 'drawImage', 'translate', 'rotate',
      'scale', 'fill', 'stroke', 'fillRect', 'arc', 'arcTo', 'moveTo', 'bezierCurveTo', 'roundRect',
    ].map((name) => [name, vi.fn()]));

    renderer.draw(context, {
      id: 'sp.brickWall',
      requestedId: 'sp.brickWall',
      time: 1.4,
      descriptor: { duration: 3.6 },
    }, {});

    expect(canvasFactory).not.toHaveBeenCalled();
    expect(context.drawImage.mock.calls[0][0]).toBe(reveal);
    expect(context.drawImage.mock.calls[0].slice(-4)).toEqual([0, 0, 1280, 720]);
    expect(context.drawImage.mock.calls.filter((call) => call[0] === courtyard && call.length === 9))
      .toHaveLength(brickTileStates(1.4).length);
    const movingState = brickTileState(3, 4, 1.4);
    const source = brickTileSourceRect(courtyard, movingState);
    const faceSource = brickFaceSourceRect(courtyard, movingState);
    expect(source).toMatchObject({ width: expect.any(Number), height: expect.any(Number) });
    expect(source.x).toBeGreaterThan(0);
    expect(source.y).toBeGreaterThan(0);
    expect(faceSource.width).toBeLessThan(source.width);
    expect(faceSource.height).toBeLessThan(source.height);

    const coverContext = Object.fromEntries([
      'save', 'restore', 'beginPath', 'rect', 'clip', 'closePath', 'drawImage', 'translate', 'rotate',
      'scale', 'fill', 'stroke', 'fillRect', 'arc', 'arcTo', 'moveTo', 'bezierCurveTo', 'roundRect',
    ].map((name) => [name, vi.fn()]));
    renderer.drawBrickWallCover(coverContext, {
      id: 'sp.brickWall',
      requestedId: 'sp.brickWall',
      time: 2.3,
    });
    expect(coverContext.bezierCurveTo).toHaveBeenCalled();
    expect(coverContext.drawImage.mock.calls[0][0]).toBe(reveal);
    expect(coverContext.drawImage.mock.calls[0].slice(-4)).toEqual([0, 0, 1280, 720]);

    renderer.draw(context, null, {});
    expect(renderer.imageRecords.size).toBe(0);
  });

  it('keeps all seven authored vase shards in the room and settled before control returns', () => {
    const airborne = Array.from({ length: 7 }, (_, index) => vaseShardPose(index, 1.6));
    expect(airborne.some((pose) => !pose.settled)).toBe(true);
    const settled = Array.from({ length: 7 }, (_, index) => vaseShardPose(index, 2.6));
    expect(settled.every((pose) => pose.settled)).toBe(true);
    for (const pose of settled) {
      expect(pose.x).toBeGreaterThanOrEqual(28);
      expect(pose.x).toBeLessThanOrEqual(1252);
      expect(pose.y).toBeGreaterThanOrEqual(40);
      expect(pose.y).toBeLessThanOrEqual(690);
    }
    expect(vaseShardPose(0, 1.06, { reducedMotion: true }).settled).toBe(true);
  });

  it('renders swirling papers, the intact vase, and every fragment as layered organic forms', () => {
    const renderer = setPieceRenderer();
    const paper = recordingTicketContext();
    const paperReplay = recordingTicketContext();
    const paperActive = { time: 1, descriptor: { duration: 2 } };
    renderer.drawWandChaos(paper, paperActive, { reducedMotion: true });
    renderer.drawWandChaos(paperReplay, paperActive, { reducedMotion: true });

    expect(paper.calls).toEqual(paperReplay.calls);
    expect(paper.assignments).toEqual(paperReplay.assignments);
    expectOrganicSetPiece(paper, 'paper chaos');
    expect(paper.calls.filter(([method]) => method === 'bezierCurveTo').length)
      .toBeGreaterThan(180);
    expect(paper.assignments.filter(([property]) => property === 'fillStyle').map(([, value]) => value))
      .toEqual(expect.arrayContaining([
        '#f0e3c8',
        '#d9c5a2',
        'rgba(45,31,36,0.24)',
        'rgba(255,247,218,0.32)',
      ]));

    const intactVase = recordingTicketContext();
    renderer.drawVaseChaos(intactVase, {
      time: 0.8,
      descriptor: { duration: 2 },
    }, { reducedMotion: true });
    expectOrganicSetPiece(intactVase, 'intact vase');
    expect(intactVase.assignments.filter(([property]) => property === 'fillStyle').map(([, value]) => value))
      .toEqual(expect.arrayContaining([
        '#7e72aa',
        '#a99bc7',
        '#514768',
        'rgba(51,43,82,0.32)',
        'rgba(225,215,247,0.28)',
      ]));

    const fragments = recordingTicketContext();
    renderer.drawVaseChaos(fragments, {
      time: 1.4,
      descriptor: { duration: 2 },
    });
    expectOrganicSetPiece(fragments, 'vase fragments');
    expect(fragments.calls.filter(([method]) => [
      'bezierCurveTo', 'quadraticCurveTo',
    ].includes(method)).length).toBeGreaterThan(120);
  });

  it('builds the chosen-wand crescendo without white clipping or reduced-motion camera drift', () => {
    const early = wandChosenState(0.4);
    const peak = wandChosenState(1.65);
    const finish = wandChosenState(2.95);
    expect(peak.crescendo).toBeGreaterThan(early.crescendo);
    expect(peak.washAlpha).toBeLessThanOrEqual(0.58);
    expect(finish.settle).toBeGreaterThan(0.8);
    expect(wandChosenState(1.65, 3, { reducedMotion: true }).cameraScale).toBe(1);
  });

  it('builds the chosen-wand rays, rings, sparks, shaft, and handle without rigid geometry', () => {
    const renderer = setPieceRenderer();
    const first = recordingTicketContext();
    const replayed = recordingTicketContext();
    const active = { time: 1.65, descriptor: { duration: 3 } };

    renderer.drawWandChosen(first, active, {}, { reducedMotion: true });
    renderer.drawWandChosen(replayed, active, {}, { reducedMotion: true });

    expect(first.calls).toEqual(replayed.calls);
    expect(first.assignments).toEqual(replayed.assignments);
    expectOrganicSetPiece(first, 'chosen wand', { fullScreenFills: 1 });
    expect(first.calls.filter(([method]) => [
      'bezierCurveTo', 'quadraticCurveTo',
    ].includes(method)).length).toBeGreaterThan(430);
    expect(first.assignments.filter(([property]) => property === 'fillStyle').map(([, value]) => value))
      .toEqual(expect.arrayContaining([
        '#3d251e',
        '#8a5635',
        '#5b3427',
        'rgba(166,101,58,0.42)',
        'rgba(255,232,141,0.18)',
        'rgba(255,195,73,0.13)',
      ]));
  });

  it('settles the Chapter Two ticket without bobbing in reduced motion', () => {
    expect(ticketPresentationState(0).scale).toBe(0);
    expect(ticketPresentationState(2).scale).toBeGreaterThan(0.99);
    expect(ticketPresentationState(2, 4, { reducedMotion: true }).bob).toBe(0);
  });

  it('keeps the Chapter Two presentation envelope deterministic and motion-safe', () => {
    expect(chapterTwoSetPieceState(0, 2)).toMatchObject({
      progress: 0,
      enter: 0,
      anticipation: 0,
      rush: 0,
    });
    expect(chapterTwoSetPieceState(1, 2).progress).toBe(0.5);
    expect(chapterTwoSetPieceState(20, 2).progress).toBe(1);
    expect(chapterTwoSetPieceState(0.1, 2, { reducedMotion: true })).toMatchObject({
      enter: 1,
      anticipation: 1,
      rush: 0,
      reducedMotion: true,
    });
  });

  it('fully covers each room-painting swap before calmly revealing the precomposited destination', () => {
    const revealAt = 0.68;
    expect(chapterTwoRoomVariantCoverAlpha(revealAt - 0.16, revealAt)).toBe(0);
    expect(chapterTwoRoomVariantCoverAlpha(revealAt, revealAt)).toBe(1);
    expect(chapterTwoRoomVariantCoverAlpha(revealAt + 0.04, revealAt)).toBe(1);
    expect(chapterTwoRoomVariantCoverAlpha(revealAt + 0.22, revealAt)).toBe(0);

    expect(chapterTwoRoomVariantCoverAlpha(
      revealAt,
      revealAt,
      { reducedMotion: true },
    )).toBe(1);
  });

  it('shows the sweet Violet actually chose instead of a fixed bean reaction', () => {
    const renderer = setPieceRenderer();
    const active = {
      time: 0.8,
      params: { choiceId: 'choice.sweet' },
      descriptor: { duration: 1.6, params: { choiceId: 'choice.sweet' } },
    };
    const drawings = ['every-flavor-beans', 'chocolate-frog', 'cauldron-cake'].map((choice) => {
      const context = recordingTicketContext();
      renderer.drawChapterTwoSweetReaction(context, active, {
        player: { x: 640, y: 620 },
        cameraX: 0,
        storyChoices: { 'choice.sweet': choice },
      }, { reducedMotion: true });
      return JSON.stringify(context.calls);
    });

    expect(new Set(drawings).size).toBe(3);
  });

  it('builds the Sorting reveal from curved cloth instead of flat rectangular banners', () => {
    const renderer = setPieceRenderer();
    const context = recordingTicketContext();
    const active = { time: 1.8, descriptor: { duration: 3.6 } };

    renderer.drawChapterTwoSortingReveal(context, active, { reducedMotion: true });

    expectOrganicSetPiece(context, 'Sorting reveal', { fullScreenFills: 2 });
    expect(context.texts).toContain('GRYFFINDOR!');
    expect(context.calls.filter(([method]) => method === 'bezierCurveTo').length)
      .toBeGreaterThan(50);
  });

  it('mounts the common-room welcome on fabric and keeps the chapter card painting open', () => {
    const renderer = setPieceRenderer();
    const commonRoom = recordingTicketContext();
    const chapterCard = recordingTicketContext();
    const active = { time: 2, descriptor: { duration: 2 } };

    renderer.drawChapterTwoCommonRoomArrival(commonRoom, active, { reducedMotion: true });
    renderer.drawChapterTwoChapterCard(chapterCard, active, { reducedMotion: true });

    expectOrganicSetPiece(commonRoom, 'common-room welcome', { fullScreenFills: 1 });
    expect(commonRoom.texts).toEqual(['WELCOME HOME, VIOLET']);
    expect(commonRoom.calls.filter(([method]) => method === 'bezierCurveTo').length)
      .toBeGreaterThan(25);

    expectOrganicSetPiece(chapterCard, 'Chapter Two card', { fullScreenFills: 1 });
    expect(chapterCard.texts).toEqual([
      'CHAPTER TWO COMPLETE',
      'Welcome to Gryffindor',
      'Next: Violet’s first classes',
    ]);
    expect(chapterCard.calls).toContainEqual(['translate', 640, 138]);
    expect(chapterCard.calls).toContainEqual(['translate', 640, 650]);
    expect(chapterCard.calls).not.toContainEqual(['translate', 640, 340]);
  });

  it('renders the preview ticket as layered railway ephemera without a generic owl or dashed geometry', () => {
    const renderer = setPieceRenderer();
    const first = recordingTicketContext();
    const replayed = recordingTicketContext();
    const active = { time: 2, descriptor: { duration: 4 } };

    renderer.drawTicket(first, active, { reducedMotion: true });
    renderer.drawTicket(replayed, active, { reducedMotion: true });

    expect(first.calls).toEqual(replayed.calls);
    expect(first.assignments).toEqual(replayed.assignments);
    expect(first.texts).toEqual([
      'HOGWARTS EXPRESS',
      'LONDON  →  HOGWARTS',
      'PLATFORM 9 ¾',
      '1 SEPTEMBER · ELEVEN O’CLOCK',
    ]);
    expect(first.calls.filter(([name]) => name === 'fillRect')).toEqual([
      ['fillRect', 0, 0, 1280, 720],
    ]);
    expect(first.calls.some(([name]) => [
      'arc', 'arcTo', 'ellipse', 'lineTo', 'rect', 'roundRect', 'setLineDash', 'strokeRect',
    ].includes(name))).toBe(false);
    expect(first.calls.filter(([name]) => name === 'bezierCurveTo').length)
      .toBeGreaterThan(95);
    expect(first.assignments.filter(([property]) => property === 'fillStyle').map(([, value]) => value))
      .toEqual(expect.arrayContaining([
        '#e7c979',
        'rgba(255,245,190,0.3)',
        'rgba(98,61,43,0.18)',
        '#694737',
        '#8d623f',
        '#4d352b',
        '#d39b54',
      ]));
    expect(first.calls.flatMap(([, ...args]) => args)
      .filter((value) => typeof value === 'number').every(Number.isFinite)).toBe(true);
    expect(first.depth).toBe(0);
  });
});
