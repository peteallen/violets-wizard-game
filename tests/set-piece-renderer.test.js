import { describe, expect, it, vi } from 'vitest';
import { SetPieceRenderer, deliveryLetteringAlpha } from '../src/game/render/SetPieceRenderer.js';

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

    expect(renderer.drawTicket).toHaveBeenCalledWith({}, active);
  });

  it('holds the delivered VIOLET lettering opacity still in reduced motion', () => {
    expect(deliveryLetteringAlpha(0.1, { reducedMotion: true })).toBe(0.9);
    expect(deliveryLetteringAlpha(0.37, { reducedMotion: true })).toBe(0.9);
    expect(deliveryLetteringAlpha(0.1)).not.toBe(deliveryLetteringAlpha(0.37));
  });
});
