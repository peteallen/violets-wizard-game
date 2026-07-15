import { describe, expect, it, vi } from 'vitest';
import {
  CharacterRegistry,
  UnknownCharacterError,
  defineCharacter,
} from '../src/game/characters/index.js';
import { RegisteredCharacterRenderer } from '../src/game/render/RegisteredCharacterRenderer.js';

function definition(id = 'character.test') {
  return defineCharacter({
    id,
    metadata: { displayName: 'Test', kind: 'human', voiceRole: 'silent' },
    surfaces: ['world', 'portrait'],
    defaults: { appearance: 'casual', pose: 'idle' },
    capabilities: {
      appearances: ['casual', 'robes'],
      poses: ['idle', 'walking', 'speaking'],
      actions: ['celebrate'],
      supportsReducedMotion: true,
    },
    bounds: {
      world: { x: 0, y: 0, width: 80, height: 140 },
      portrait: { x: 10, y: 0, width: 60, height: 60 },
    },
    assets: {},
  });
}

async function renderer() {
  const world = vi.fn(() => 'world');
  const portrait = vi.fn(() => 'portrait');
  const registry = new CharacterRegistry();
  registry.register(definition(), async () => ({ renderers: { world, portrait } })).seal();
  await registry.loadRuntime('character.test');
  return {
    registry,
    renderer: new RegisteredCharacterRenderer({ registry }),
    world,
    portrait,
  };
}

describe('registered character renderer', () => {
  it('dispatches one exact identity and surface while normalizing actor state', async () => {
    const harness = await renderer();
    const context = {};
    const animation = { action: 'celebrate', localTime: 0.4, progress: 0.25 };

    expect(harness.renderer.draw(context, {
      characterId: 'character.test',
      surface: 'world',
      outfit: 'robes',
      walking: true,
      actorAnimation: animation,
      x: 120,
    }, 3)).toBe('world');
    expect(harness.world).toHaveBeenCalledWith(expect.objectContaining({
      characterId: 'character.test',
      surface: 'world',
      context,
      time: 3,
      appearance: 'robes',
      pose: 'walking',
      action: 'celebrate',
      actionTime: 0.4,
      actionProgress: 0.25,
      x: 120,
    }), expect.objectContaining({ id: 'character.test' }));
    expect(harness.portrait).not.toHaveBeenCalled();
  });

  it('uses the same call for portraits and never guesses an identity', async () => {
    const harness = await renderer();
    expect(harness.renderer.drawPortrait({}, {
      portraitCharacterId: 'character.test',
      appearance: 'casual',
      pose: 'speaking',
    }, 2)).toBe('portrait');
    expect(harness.portrait).toHaveBeenCalledOnce();

    expect(() => harness.renderer.draw({}, { characterId: 'character.missing' }))
      .toThrow(UnknownCharacterError);
    expect(() => harness.renderer.draw({}, { kind: 'guide' }))
      .toThrow(/exact characterId/);
  });

  it('requires runtimes to be explicitly loaded before synchronous drawing', () => {
    const registry = new CharacterRegistry();
    registry.register(definition(), async () => ({
      renderers: { world: vi.fn(), portrait: vi.fn() },
    })).seal();
    const characterRenderer = new RegisteredCharacterRenderer({ registry });

    expect(() => characterRenderer.draw({}, { characterId: 'character.test' }))
      .toThrow(/is not loaded/);
  });
});
