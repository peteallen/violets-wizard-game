import { describe, expect, it, vi } from 'vitest';
import { chapter1LetterLines } from '../src/game/content/chapters/ch1-letter.js';
import {
  BRICK_GRID,
  SetPieceRenderer,
  brickTileState,
  brickTileSourceRect,
  deliveryLetteringAlpha,
  drawReadableInvitation,
  letterOpenState,
  ticketPresentationState,
  vaseShardPose,
  wandChosenState,
} from '../src/game/render/SetPieceRenderer.js';

describe('SetPieceRenderer dispatch', () => {
  it('draws the Chapter Two preview ticket regardless of ID casing', () => {
    const renderer = new SetPieceRenderer();
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

  it('holds the delivered VIOLET lettering opacity still in reduced motion', () => {
    expect(deliveryLetteringAlpha(0.1, { reducedMotion: true })).toBe(0.9);
    expect(deliveryLetteringAlpha(0.37, { reducedMotion: true })).toBe(0.9);
    expect(deliveryLetteringAlpha(0.1)).not.toBe(deliveryLetteringAlpha(0.37));
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
    expect(pushed.scale).toBeGreaterThan(readable.scale);
    expect(pushed.scale).toBeLessThanOrEqual(1.03);

    const reduced = letterOpenState(2, { reducedMotion: true });
    expect(reduced.push).toBe(0);
    expect(reduced.scale).toBe(1.03);
    expect(reduced.foldTop).toBe(1);
    expect(reduced.foldBottom).toBe(1);
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

  it('opens an exact ten-by-eight brick grid from the center before the corners', () => {
    expect(BRICK_GRID.columns * BRICK_GRID.rows).toBe(80);
    const center = brickTileState(3, 4, 1);
    const corner = brickTileState(0, 0, 1);
    expect(center.progress).toBeGreaterThan(corner.progress);
    expect(center.offsetX).not.toBe(0);

    const finalStates = [];
    for (let row = 0; row < BRICK_GRID.rows; row += 1) {
      for (let column = 0; column < BRICK_GRID.columns; column += 1) {
        finalStates.push(brickTileState(row, column, 2.2));
      }
    }
    expect(finalStates.every((state) => state.progress === 1 && state.alpha === 0)).toBe(true);
  });

  it('draws moving courtyard pixels directly without allocating eighty sprite canvases', () => {
    const canvasFactory = vi.fn(() => { throw new Error('The wall must not allocate a tile canvas.'); });
    const renderer = new SetPieceRenderer({ canvasFactory });
    const courtyard = { complete: true, naturalWidth: 1672, naturalHeight: 941 };
    const reveal = { complete: true, naturalWidth: 1672, naturalHeight: 941 };
    renderer.imageRecords.set('rooms/ch1/courtyard/base', { ready: true, image: courtyard });
    renderer.imageRecords.set('rooms/ch1/diagon/day', { ready: true, image: reveal });
    const context = Object.fromEntries([
      'save', 'restore', 'beginPath', 'rect', 'clip', 'drawImage', 'translate', 'rotate',
      'scale', 'fill', 'stroke', 'fillRect', 'arc', 'roundRect',
    ].map((name) => [name, vi.fn()]));

    renderer.draw(context, {
      id: 'sp.brickWall',
      requestedId: 'sp.brickWall',
      time: 1.4,
      descriptor: { duration: 3.6 },
    }, {});

    expect(canvasFactory).not.toHaveBeenCalled();
    expect(context.drawImage.mock.calls.some((call) => call[0] === courtyard && call.length === 9)).toBe(true);
    const source = brickTileSourceRect(courtyard, brickTileState(3, 4, 1.4));
    expect(source).toMatchObject({ width: expect.any(Number), height: expect.any(Number) });
    expect(source.x).toBeGreaterThan(0);
    expect(source.y).toBeGreaterThan(0);

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

  it('builds the chosen-wand crescendo without white clipping or reduced-motion camera drift', () => {
    const early = wandChosenState(0.4);
    const peak = wandChosenState(1.65);
    const finish = wandChosenState(2.95);
    expect(peak.crescendo).toBeGreaterThan(early.crescendo);
    expect(peak.washAlpha).toBeLessThanOrEqual(0.58);
    expect(finish.settle).toBeGreaterThan(0.8);
    expect(wandChosenState(1.65, 3, { reducedMotion: true }).cameraScale).toBe(1);
  });

  it('settles the Chapter Two ticket without bobbing in reduced motion', () => {
    expect(ticketPresentationState(0).scale).toBe(0);
    expect(ticketPresentationState(2).scale).toBeGreaterThan(0.99);
    expect(ticketPresentationState(2, 4, { reducedMotion: true }).bob).toBe(0);
  });
});
