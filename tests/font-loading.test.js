import { describe, expect, it, vi } from 'vitest';
import { GAME_FONT_FACES, loadGameFonts } from '../src/game/core/loadFonts.js';

describe('game font preload', () => {
  it('loads and warms every canvas weight before the first rendered frame', async () => {
    expect(GAME_FONT_FACES).toContain('700 72px "Almendra"');
    const load = vi.fn(async () => ['loaded']);
    const fillText = vi.fn();
    const context = { font: '', fillText };
    const canvas = { width: 0, height: 0, getContext: () => context };
    const documentRef = {
      fonts: { load },
      createElement: vi.fn(() => canvas),
    };

    await expect(loadGameFonts(documentRef)).resolves.toBe(true);
    expect(load.mock.calls.map(([face, sample]) => ({ face, sample }))).toEqual(
      GAME_FONT_FACES.map((face) => ({ face, sample: 'Violet Hogwarts' })),
    );
    expect(fillText).toHaveBeenCalledTimes(GAME_FONT_FACES.length);
    expect(canvas).toMatchObject({ width: 1, height: 1 });
  });

  it('degrades safely outside a browser document', async () => {
    await expect(loadGameFonts(null)).resolves.toBe(false);
  });
});
