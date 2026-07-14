import { describe, expect, it } from 'vitest';
import { chapter1 } from '../src/game/content/chapters/ch1.js';
import {
  CURRENT_CHARACTER_ANIMATION_REQUIREMENTS,
  characterAnimationRequirement,
} from '../src/game/content/characterAnimationRequirements.js';

describe('current character animation requirements', () => {
  it('covers every visible Chapter One puppet and the narrator portrait', () => {
    const puppets = Object.values(chapter1.npcs)
      .map((npc) => npc.puppet)
      .filter((puppet) => puppet !== 'puppet.none');
    for (const puppet of puppets) expect(characterAnimationRequirement(puppet)).not.toBeNull();
    expect(characterAnimationRequirement('portrait.narrator')).not.toBeNull();
    expect(Object.keys(CURRENT_CHARACTER_ANIMATION_REQUIREMENTS)).toHaveLength(10);
  });

  it('requires both room-light directions and reduced-motion behavior for every identity', () => {
    for (const requirement of Object.values(CURRENT_CHARACTER_ANIMATION_REQUIREMENTS)) {
      expect(requirement.lightSides).toEqual(['left', 'right']);
      expect(requirement.supportsReducedMotion).toBe(true);
      expect(requirement.appearances.length).toBeGreaterThan(0);
      expect(requirement.clips).toContain('idle');
      expect(requirement.expressions).toContain('neutral');
      expect(requirement.surfaces.length).toBeGreaterThan(0);
      expect(requirement.sockets.length).toBeGreaterThan(0);
    }
  });

  it('keeps every current human capable of speaking, walking, blinking, and large emotes', () => {
    const humans = Object.values(CURRENT_CHARACTER_ANIMATION_REQUIREMENTS)
      .filter(({ kind }) => kind === 'human');
    for (const human of humans) {
      for (const clip of ['idle', 'walking', 'speaking', 'jump-for-joy', 'giggle', 'tumble', 'recovery']) {
        expect(human.clips).toContain(clip);
      }
      for (const expression of ['neutral', 'blink', 'talk-a', 'talk-b']) {
        expect(human.expressions).toContain(expression);
      }
      for (const socket of ['neck', 'handLeft', 'handRight', 'footLeft', 'footRight']) {
        expect(human.sockets).toContain(socket);
      }
    }
  });

  it('records every current story-specific action before asset generation begins', () => {
    expect(characterAnimationRequirement('puppet.violet').actions).toEqual(expect.arrayContaining([
      'wrong-wand-one', 'wrong-wand-two', 'chosen-wand', 'receive-wand', 'admire-robes', 'broom-wonder',
    ]));
    expect(characterAnimationRequirement('puppet.guide').clips).toEqual(expect.arrayContaining([
      'beckon', 'map-handoff', 'ticket-handoff', 'brick-tap',
    ]));
    expect(characterAnimationRequirement('puppet.owlPost').clips).toEqual(expect.arrayContaining([
      'perch', 'takeoff', 'delivery', 'flight', 'release', 'settle',
    ]));
    expect(characterAnimationRequirement('puppet.pet.cat').clips).toContain('paw');
    expect(characterAnimationRequirement('puppet.pet.toad').clips).toContain('curious');
  });
});
