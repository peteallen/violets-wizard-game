import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { drawReplayRibbon } from '../src/game/render/uiPrimitives.js';

const setPieceSource = readFileSync(
  new URL('../src/game/render/SetPieceRenderer.js', import.meta.url),
  'utf8',
);
const uiPrimitiveSource = readFileSync(
  new URL('../src/game/render/uiPrimitives.js', import.meta.url),
  'utf8',
);
const pageSource = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function recordingContext() {
  const calls = [];
  const methods = new Set([
    'beginPath', 'closePath', 'fill', 'fillText', 'lineTo', 'moveTo', 'restore', 'save', 'stroke',
  ]);
  const target = { calls };
  return new Proxy(target, {
    get(object, property) {
      if (methods.has(property)) {
        return (...args) => calls.push([property, ...args]);
      }
      return object[property];
    },
    set(object, property, value) {
      object[property] = value;
      return true;
    },
  });
}

describe('player-visible copy', () => {
  it('keeps the removed story overlays out of the set-piece renderer', () => {
    expect(setPieceSource).not.toContain('THE WAND CHOOSES VIOLET');
    expect(setPieceSource).not.toContain('A PREVIEW OF CHAPTER TWO');
  });

  it('uses only Return as the replay ribbon default', () => {
    const context = recordingContext();

    drawReplayRibbon(context, { x: 20, y: 30, width: 320, height: 80 });

    const labels = context.calls
      .filter(([method]) => method === 'fillText')
      .map(([, text]) => text);
    expect(labels).toEqual(['↩', 'Return']);
    expect(uiPrimitiveSource).not.toContain('Return to saved game');
  });

  it('keeps the update actions and accessible status without visible helper prose', () => {
    expect(pageSource).not.toContain('version-reload-copy');
    expect(pageSource).not.toContain('New magic is ready');
    expect(pageSource).not.toContain('Reload now, or keep playing this version.');

    const updateAside = pageSource.match(/<aside\b[^>]*\bid="version-reload"[^>]*>/)?.[0] ?? '';
    expect(updateAside).toContain('aria-label="A game update is ready"');
    expect(updateAside).toMatch(/\bhidden\b/);
    expect(pageSource).toMatch(/<button\b[^>]*\bid="version-reload-now"[^>]*>Reload<\/button>/);
    expect(pageSource).toMatch(/<button\b[^>]*\bid="version-reload-later"[^>]*>Later<\/button>/);

    const gameStatus = pageSource.match(/<p\b[^>]*\bid="game-status"[^>]*>/)?.[0] ?? '';
    expect(gameStatus).toContain('class="visually-hidden"');
    expect(gameStatus).toContain('aria-live="polite"');
  });
});
