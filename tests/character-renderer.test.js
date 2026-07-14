import { describe, expect, it } from 'vitest';
import {
  CAT_STYLE,
  CHARACTER_REVIEW_SCENES,
  CharacterRenderer,
  HAGRID_STYLE,
  KEEPER_STYLE,
  TAILOR_STYLE,
  TOAD_STYLE,
  VIOLET_STYLE,
  WANDMAKER_STYLE,
  drawVioletGlasses,
  sampleCompanionMotion,
  sampleKeeperMotion,
  sampleTailorMotion,
  sampleVioletMotion,
  tracePortraitCameoSilhouette,
} from '../src/game/render/CharacterRenderer.js';

function recordingContext() {
  const calls = [];
  const styles = [];
  let depth = 0;
  const gradient = { addColorStop: (...args) => calls.push(['addColorStop', ...args]) };
  const methods = new Set([
    'arc', 'arcTo', 'beginPath', 'bezierCurveTo', 'clip', 'closePath', 'ellipse', 'fill', 'fillRect',
    'fillText', 'lineTo', 'moveTo', 'quadraticCurveTo', 'rect', 'restore', 'rotate', 'roundRect',
    'save', 'scale', 'setLineDash', 'stroke', 'strokeRect', 'translate',
  ]);
  const target = { globalAlpha: 1, calls, styles, get depth() { return depth; } };
  return new Proxy(target, {
    get(object, property) {
      if (property === 'createLinearGradient' || property === 'createRadialGradient') {
        return (...args) => { calls.push([property, ...args]); return gradient; };
      }
      if (methods.has(property)) {
        return (...args) => {
          calls.push([property, ...args]);
          if (property === 'save') depth += 1;
          if (property === 'restore') depth -= 1;
        };
      }
      return object[property];
    },
    set(object, property, value) {
      if (property === 'fillStyle' || property === 'strokeStyle') styles.push([property, value]);
      object[property] = value;
      return true;
    },
  });
}

describe('illustrated character renderer', () => {
  it('draws every registered review surface deterministically without leaking canvas state', () => {
    const renderer = new CharacterRenderer();
    for (const scene of CHARACTER_REVIEW_SCENES) {
      const first = recordingContext();
      const second = recordingContext();
      expect(renderer.drawReviewScene(first, scene, 1.375)).toBe(true);
      expect(renderer.drawReviewScene(second, scene, 1.375)).toBe(true);
      expect(first.calls).toEqual(second.calls);
      expect(first.calls.length).toBeGreaterThan(100);
      expect(first.calls
        .filter(([name]) => ['moveTo', 'lineTo', 'quadraticCurveTo', 'bezierCurveTo'].includes(name))
        .every(([, ...values]) => values.every(Number.isFinite))).toBe(true);
      expect(first.depth).toBe(0);
    }
    expect(renderer.drawReviewScene(recordingContext(), 'unrelated-scene', 0)).toBe(false);
  });

  it('provides one balanced portrait API for the whole dialogue cast and narrator', () => {
    const renderer = new CharacterRenderer();
    const speakers = ['Violet', 'Hagrid', 'Ollivander', 'Madam Malkin', 'Menagerie keeper', 'Narrator', 'cat', 'owl', 'toad'];
    for (const speaker of speakers) {
      const context = recordingContext();
      renderer.drawPortrait(context, { speaker, pose: 'speaking', x: 80, y: 90, scale: 1.2 }, 2.25);
      expect(context.calls.length).toBeGreaterThan(35);
      expect(context.depth).toBe(0);
      expect(context.calls.some(([name]) => name === 'clip')).toBe(true);
    }

    const authoredTalk = recordingContext();
    const canonicalSpeaking = recordingContext();
    renderer.drawPortrait(authoredTalk, { speaker: 'Hagrid', pose: 'talk', x: 80, y: 90 }, 0.37);
    renderer.drawPortrait(canonicalSpeaking, { speaker: 'Hagrid', pose: 'speaking', x: 80, y: 90 }, 0.37);
    expect(authoredTalk.calls).toEqual(canonicalSpeaking.calls);
  });

  it('frames dialogue portraits with one finite organic brass-and-parchment cameo', () => {
    const silhouette = recordingContext();
    tracePortraitCameoSilhouette(silhouette, 55);
    const silhouetteMethods = silhouette.calls.map(([name]) => name);
    expect(silhouetteMethods).toEqual([
      'beginPath', 'moveTo',
      'bezierCurveTo', 'bezierCurveTo', 'bezierCurveTo',
      'bezierCurveTo', 'bezierCurveTo', 'bezierCurveTo',
      'closePath',
    ]);
    expect(silhouette.calls.every(([, ...values]) => values.every(
      (value) => typeof value !== 'number' || Number.isFinite(value),
    ))).toBe(true);
    expect(silhouetteMethods.some((name) => [
      'arc', 'ellipse', 'arcTo', 'roundRect', 'rect',
    ].includes(name))).toBe(false);

    const renderer = new CharacterRenderer();
    const portrait = recordingContext();
    renderer.drawPortrait(portrait, {
      speaker: 'Narrator', x: 80, y: 90, scale: 1.2, reducedMotion: true,
    }, 2.25);

    const forbiddenPrimitives = new Set(['arc', 'ellipse', 'arcTo', 'roundRect', 'rect']);
    expect(portrait.calls.some(([name]) => forbiddenPrimitives.has(name))).toBe(false);
    expect(portrait.calls.every(([, ...values]) => values.every(
      (value) => typeof value !== 'number' || Number.isFinite(value),
    ))).toBe(true);
    expect(portrait.calls.filter(([name]) => name === 'clip').length).toBeGreaterThanOrEqual(2);
    for (const [index, [name]] of portrait.calls.entries()) {
      if (name !== 'clip') continue;
      const pathStart = portrait.calls.findLastIndex(
        ([method], candidate) => candidate < index && method === 'beginPath',
      );
      const clipPathMethods = portrait.calls.slice(pathStart, index).map(([method]) => method);
      expect(clipPathMethods).toEqual(silhouetteMethods);
    }
    expect(portrait.calls.some(([name]) => [
      'createLinearGradient', 'createRadialGradient',
    ].includes(name))).toBe(false);
    for (const color of ['#edca79', '#bd8439', '#805127', '#5a3924', '#f2dda5', '#d8b879', '#aa7f4c']) {
      expect(portrait.styles.some(([, value]) => value === color)).toBe(true);
    }
    expect(portrait.styles.some(([, value]) => value === 'rgba(255, 226, 156, 0.4)')).toBe(true);
    expect(portrait.depth).toBe(0);
    expect(portrait.calls.filter(([name]) => name === 'save')).toHaveLength(
      portrait.calls.filter(([name]) => name === 'restore').length,
    );
  });

  it('gives Hagrid deterministic walking and beckoning poses without leaking canvas state', () => {
    const renderer = new CharacterRenderer();
    for (const pose of ['walking', 'beckon']) {
      const first = recordingContext();
      const replayed = recordingContext();
      const character = {
        kind: 'guide', x: 180, y: 610, facing: 'right', pose, reducedMotion: false,
      };
      renderer.draw(first, character, 1.25);
      renderer.draw(replayed, character, 1.25);
      expect(first.calls).toEqual(replayed.calls);
      expect(first.calls.every(([, ...values]) => values.every(
        (value) => typeof value !== 'number' || Number.isFinite(value),
      ))).toBe(true);
      expect(first.depth).toBe(0);
    }

    const beckon = recordingContext();
    renderer.draw(beckon, {
      kind: 'guide', x: 180, y: 610, facing: 'right', pose: 'beckon', reducedMotion: true,
    }, 1.25);
    expect(beckon.calls.filter(([name]) => name === 'quadraticCurveTo').length).toBeGreaterThan(15);
  });

  it('renders Hagrid as a layered half-giant puppet shared by world and portrait', () => {
    const renderer = new CharacterRenderer();
    const world = recordingContext();
    const replayed = recordingContext();
    const character = { kind: 'guide', x: 180, y: 610, facing: 'right', pose: 'idle' };
    renderer.draw(world, character, 1.375);
    renderer.draw(replayed, character, 1.375);

    expect(world.calls).toEqual(replayed.calls);
    expect(world.depth).toBe(0);
    expect(HAGRID_STYLE.worldScale).toBeGreaterThanOrEqual(1.7);
    expect(world.calls).toContainEqual(['scale', HAGRID_STYLE.worldScale, HAGRID_STYLE.worldScale]);
    expect(world.calls.filter(([name]) => name === 'bezierCurveTo').length).toBeGreaterThan(80);
    expect(world.calls.some(([name]) => name === 'ellipse' || name === 'arc')).toBe(false);
    expect(world.calls
      .filter(([name]) => ['moveTo', 'lineTo', 'quadraticCurveTo', 'bezierCurveTo'].includes(name))
      .every(([, ...values]) => values.every(Number.isFinite))).toBe(true);
    for (const style of [
      HAGRID_STYLE.coatBase,
      HAGRID_STYLE.coatShadow,
      HAGRID_STYLE.hairBase,
      HAGRID_STYLE.hairMid,
      HAGRID_STYLE.hairLight,
      HAGRID_STYLE.rim,
    ]) expect(world.styles.some(([, value]) => value === style)).toBe(true);

    const portrait = recordingContext();
    renderer.drawPortrait(portrait, { speaker: 'Hagrid', pose: 'speaking', x: 80, y: 90 }, 1.375);
    for (const style of [HAGRID_STYLE.hairBase, HAGRID_STYLE.hairMid, HAGRID_STYLE.rim]) {
      expect(portrait.styles.some(([, value]) => value === style)).toBe(true);
    }
    expect(portrait.depth).toBe(0);
  });

  it('renders the Wandmaker as one organic elderly puppet shared by world and portrait', () => {
    expect(WANDMAKER_STYLE).toMatchObject({
      robeBase: '#292c43',
      robeShadow: '#1d2031',
      brass: '#b89a5d',
      wood: '#765136',
      hairBase: '#c9c6bd',
      hairShadow: '#8f9296',
      skin: '#d0a07d',
      iris: '#738697',
    });

    const renderer = new CharacterRenderer();
    const world = recordingContext();
    const replayed = recordingContext();
    const character = {
      kind: 'wandmaker', x: 180, y: 610, facing: 'right', pose: 'curious',
    };
    renderer.draw(world, character, 1.375);
    renderer.draw(replayed, character, 1.375);

    expect(world.calls).toEqual(replayed.calls);
    expect(world.depth).toBe(0);
    expect(world.calls).toContainEqual(['scale', 1.04, 1.04]);
    expect(world.calls.filter(([name]) => name === 'bezierCurveTo').length).toBeGreaterThan(70);
    expect(world.calls.some(([name]) => [
      'arc', 'ellipse', 'fillRect', 'rect', 'roundRect', 'strokeRect',
    ].includes(name))).toBe(false);
    expect(world.calls.every(([, ...values]) => values.every(
      (value) => typeof value !== 'number' || Number.isFinite(value),
    ))).toBe(true);

    for (const style of [
      WANDMAKER_STYLE.robeBase,
      WANDMAKER_STYLE.robeMid,
      WANDMAKER_STYLE.robeShadow,
      WANDMAKER_STYLE.robeLight,
      WANDMAKER_STYLE.brass,
      WANDMAKER_STYLE.wood,
      WANDMAKER_STYLE.hairBase,
      WANDMAKER_STYLE.hairShadow,
      WANDMAKER_STYLE.hairLight,
      WANDMAKER_STYLE.skin,
      WANDMAKER_STYLE.iris,
      WANDMAKER_STYLE.rim,
    ]) expect(world.styles.some(([, value]) => value === style)).toBe(true);

    const speaking = recordingContext();
    renderer.draw(speaking, { ...character, pose: 'speaking' }, 1.375);
    expect(speaking.calls).not.toEqual(world.calls);
    expect(speaking.calls.some(([name]) => name === 'arc' || name === 'ellipse')).toBe(false);

    const portrait = recordingContext();
    renderer.drawPortrait(portrait, {
      speaker: 'Ollivander', pose: 'speaking', x: 80, y: 90,
    }, 1.375);
    for (const style of [
      WANDMAKER_STYLE.robeBase,
      WANDMAKER_STYLE.hairBase,
      WANDMAKER_STYLE.hairShadow,
      WANDMAKER_STYLE.skin,
      WANDMAKER_STYLE.iris,
      WANDMAKER_STYLE.wood,
    ]) expect(portrait.styles.some(([, value]) => value === style)).toBe(true);
    expect(portrait.depth).toBe(0);
  });

  it('renders Madam Malkin as one brisk organic seamstress shared by world and portrait', () => {
    expect(TAILOR_STYLE).toMatchObject({
      dressBase: '#75445f',
      dressShadow: '#4c2d43',
      apronBase: '#b7838d',
      tape: '#d9c27f',
      cushion: '#a64765',
      hairBase: '#c8c4c1',
      hairShadow: '#77747a',
      skin: '#c98e70',
      iris: '#5b4638',
    });

    const renderer = new CharacterRenderer();
    const world = recordingContext();
    const replayed = recordingContext();
    const idle = recordingContext();
    const character = {
      kind: 'tailor', x: 180, y: 610, facing: 'right', pose: 'speaking',
    };
    renderer.draw(world, character, 1.375);
    renderer.draw(replayed, character, 1.375);
    renderer.draw(idle, { ...character, pose: 'idle' }, 1.375);

    expect(world.calls).toEqual(replayed.calls);
    expect(world.calls).not.toEqual(idle.calls);
    expect(world.depth).toBe(0);
    expect(world.calls).toContainEqual(['scale', 1.04, 1.04]);
    expect(world.calls.filter(([name]) => name === 'bezierCurveTo').length).toBeGreaterThan(130);
    expect(world.calls.some(([name]) => [
      'arc', 'ellipse', 'fillRect', 'rect', 'roundRect', 'strokeRect',
    ].includes(name))).toBe(false);
    expect(world.calls.every(([, ...values]) => values.every(
      (value) => typeof value !== 'number' || Number.isFinite(value),
    ))).toBe(true);

    for (const style of [
      TAILOR_STYLE.dressBase,
      TAILOR_STYLE.dressMid,
      TAILOR_STYLE.dressShadow,
      TAILOR_STYLE.dressLight,
      TAILOR_STYLE.apronBase,
      TAILOR_STYLE.apronMid,
      TAILOR_STYLE.apronShadow,
      TAILOR_STYLE.tape,
      TAILOR_STYLE.tapeLight,
      TAILOR_STYLE.cushion,
      TAILOR_STYLE.hairBase,
      TAILOR_STYLE.hairMid,
      TAILOR_STYLE.hairShadow,
      TAILOR_STYLE.hairLight,
      TAILOR_STYLE.skin,
      TAILOR_STYLE.iris,
      TAILOR_STYLE.rim,
    ]) expect(world.styles.some(([, value]) => value === style)).toBe(true);
    expect(world.styles.filter(([, style]) => style === TAILOR_STYLE.iris)).toHaveLength(2);

    const portrait = recordingContext();
    renderer.drawPortrait(portrait, {
      speaker: 'Madam Malkin', pose: 'speaking', x: 80, y: 90,
    }, 1.375);
    for (const style of [
      TAILOR_STYLE.dressBase,
      TAILOR_STYLE.apronBase,
      TAILOR_STYLE.tape,
      TAILOR_STYLE.cushion,
      TAILOR_STYLE.hairBase,
      TAILOR_STYLE.hairShadow,
      TAILOR_STYLE.iris,
      TAILOR_STYLE.rim,
    ]) expect(portrait.styles.some(([, value]) => value === style)).toBe(true);
    expect(portrait.styles.filter(([, style]) => style === TAILOR_STYLE.iris)).toHaveLength(2);
    expect(portrait.depth).toBe(0);

    const blink = recordingContext();
    renderer.draw(blink, { ...character, pose: 'idle' }, 3.2);
    expect(blink.styles.filter(([, style]) => style === TAILOR_STYLE.iris)).toHaveLength(0);
    expect(blink.calls.some(([name]) => name === 'arc' || name === 'ellipse')).toBe(false);

    const facingLeft = recordingContext();
    renderer.draw(facingLeft, { ...character, facing: 'left' }, 1.375);
    expect(facingLeft.calls).toContainEqual(['scale', -1.04, 1.04]);
    expect(facingLeft.calls.filter((call) => (
      call[0] === 'scale' && call[1] === -1 && call[2] === 1
    )).length).toBeGreaterThanOrEqual(1);

    const speakingMotion = sampleTailorMotion({ time: 1.125, pose: 'speaking' });
    const repeatedMotion = sampleTailorMotion({ time: 1.125, pose: 'speaking' });
    const idleMotion = sampleTailorMotion({ time: 1.125, pose: 'idle' });
    const reducedMotion = sampleTailorMotion({
      time: 1.125, pose: 'speaking', reducedMotion: true,
    });
    const sanitizedMotion = sampleTailorMotion({ time: Number.NaN, pose: 'speaking' });
    expect(repeatedMotion).toEqual(speakingMotion);
    expect(Object.values(speakingMotion).every(Number.isFinite)).toBe(true);
    expect(Object.values(sanitizedMotion).every(Number.isFinite)).toBe(true);
    expect(speakingMotion.handLift).toBeGreaterThan(idleMotion.handLift);
    expect(Math.abs(reducedMotion.handLift)).toBeLessThan(Math.abs(speakingMotion.handLift));
    expect(Math.abs(reducedMotion.tapeSway)).toBeLessThan(Math.abs(speakingMotion.tapeSway));
  });

  it('renders the Menagerie keeper as one organic animal carer shared by world and portrait', () => {
    expect(KEEPER_STYLE).toMatchObject({
      coatBase: '#496653',
      coatShadow: '#30483b',
      apronBase: '#8c6344',
      pouchBase: '#765139',
      gauntletBase: '#79583f',
      brushWood: '#6d4933',
      bristle: '#d4bc91',
      hairBase: '#a9633a',
      hairShadow: '#6e402f',
      skin: '#ca906d',
      iris: '#5b5638',
    });

    const renderer = new CharacterRenderer();
    const world = recordingContext();
    const replayed = recordingContext();
    const idle = recordingContext();
    const character = {
      kind: 'keeper', x: 180, y: 610, facing: 'right', pose: 'speaking',
    };
    renderer.draw(world, character, 1.375);
    renderer.draw(replayed, character, 1.375);
    renderer.draw(idle, { ...character, pose: 'idle' }, 1.375);

    expect(world.calls).toEqual(replayed.calls);
    expect(world.calls).not.toEqual(idle.calls);
    expect(world.depth).toBe(0);
    expect(world.calls).toContainEqual(['scale', 1.04, 1.04]);
    expect(world.calls.filter(([name]) => name === 'bezierCurveTo').length).toBeGreaterThan(145);
    expect(world.calls.some(([name]) => [
      'arc', 'ellipse', 'fillRect', 'rect', 'roundRect', 'strokeRect',
    ].includes(name))).toBe(false);
    expect(world.calls.every(([, ...values]) => values.every(
      (value) => typeof value !== 'number' || Number.isFinite(value),
    ))).toBe(true);

    for (const style of [
      KEEPER_STYLE.coatBase,
      KEEPER_STYLE.coatMid,
      KEEPER_STYLE.coatShadow,
      KEEPER_STYLE.coatLight,
      KEEPER_STYLE.apronBase,
      KEEPER_STYLE.apronMid,
      KEEPER_STYLE.apronShadow,
      KEEPER_STYLE.pouchBase,
      KEEPER_STYLE.pouchShadow,
      KEEPER_STYLE.gauntletBase,
      KEEPER_STYLE.gauntletShadow,
      KEEPER_STYLE.brushWood,
      KEEPER_STYLE.bristle,
      KEEPER_STYLE.featherBase,
      KEEPER_STYLE.hairBase,
      KEEPER_STYLE.hairMid,
      KEEPER_STYLE.hairShadow,
      KEEPER_STYLE.hairLight,
      KEEPER_STYLE.skin,
      KEEPER_STYLE.iris,
      KEEPER_STYLE.rim,
    ]) expect(world.styles.some(([, value]) => value === style)).toBe(true);
    expect(world.styles.filter(([, style]) => style === KEEPER_STYLE.iris)).toHaveLength(2);

    const portrait = recordingContext();
    renderer.drawPortrait(portrait, {
      speaker: 'Menagerie keeper', pose: 'speaking', x: 80, y: 90,
    }, 1.375);
    for (const style of [
      KEEPER_STYLE.coatBase,
      KEEPER_STYLE.apronBase,
      KEEPER_STYLE.pouchBase,
      KEEPER_STYLE.gauntletBase,
      KEEPER_STYLE.brushWood,
      KEEPER_STYLE.bristle,
      KEEPER_STYLE.hairBase,
      KEEPER_STYLE.hairShadow,
      KEEPER_STYLE.iris,
      KEEPER_STYLE.rim,
    ]) expect(portrait.styles.some(([, value]) => value === style)).toBe(true);
    expect(portrait.styles.filter(([, style]) => style === KEEPER_STYLE.iris)).toHaveLength(2);
    expect(portrait.depth).toBe(0);

    const blink = recordingContext();
    renderer.draw(blink, { ...character, pose: 'idle' }, 3.2);
    expect(blink.styles.filter(([, style]) => style === KEEPER_STYLE.iris)).toHaveLength(0);
    expect(blink.calls.some(([name]) => name === 'arc' || name === 'ellipse')).toBe(false);

    const facingLeft = recordingContext();
    renderer.draw(facingLeft, { ...character, facing: 'left' }, 1.375);
    expect(facingLeft.calls).toContainEqual(['scale', -1.04, 1.04]);
    expect(facingLeft.calls.filter((call) => (
      call[0] === 'scale' && call[1] === -1 && call[2] === 1
    )).length).toBeGreaterThanOrEqual(1);

    const speakingMotion = sampleKeeperMotion({ time: 1.125, pose: 'speaking' });
    const repeatedMotion = sampleKeeperMotion({ time: 1.125, pose: 'speaking' });
    const idleMotion = sampleKeeperMotion({ time: 1.125, pose: 'idle' });
    const reducedMotion = sampleKeeperMotion({
      time: 1.125, pose: 'speaking', reducedMotion: true,
    });
    const sanitizedMotion = sampleKeeperMotion({ time: Number.NaN, pose: 'speaking' });
    expect(repeatedMotion).toEqual(speakingMotion);
    expect(Object.values(speakingMotion).every(Number.isFinite)).toBe(true);
    expect(Object.values(sanitizedMotion).every(Number.isFinite)).toBe(true);
    expect(speakingMotion.gloveLift).toBeGreaterThan(idleMotion.gloveLift);
    expect(Math.abs(reducedMotion.gloveLift)).toBeLessThan(Math.abs(speakingMotion.gloveLift));
    expect(Math.abs(reducedMotion.brushTilt)).toBeLessThan(Math.abs(speakingMotion.brushTilt));
    expect(Math.abs(reducedMotion.pouchSway)).toBeLessThan(Math.abs(speakingMotion.pouchSway));
  });

  it('builds Violet from her full storybook palette and hand-drawn dark-green glasses', () => {
    expect(VIOLET_STYLE).toMatchObject({
      hairBase: '#806f62',
      hairShadow: '#514640',
      skinBase: '#d9a17b',
      cheek: 'rgba(189, 82, 91, 0.24)',
      iris: '#5a3d28',
      glasses: '#203d34',
      robeBase: '#26222e',
      lining: '#7a4fc9',
      shoeBase: '#6848a8',
      casualJerseyBase: '#70539f',
      casualJerseyTrim: '#d8c9e4',
      casualLeggingBase: '#373342',
    });
    const first = recordingContext();
    const repeated = recordingContext();
    drawVioletGlasses(first);
    drawVioletGlasses(repeated);
    expect(first.calls).toEqual(repeated.calls);
    expect(first.calls.filter(([name]) => name === 'bezierCurveTo').length).toBeGreaterThanOrEqual(17);
    expect(first.calls.some(([name]) => [
      'arc', 'ellipse', 'fillRect', 'lineTo', 'rect', 'roundRect', 'strokeRect',
    ].includes(name))).toBe(false);
    expect(first.calls.some(([name]) => name === 'fill')).toBe(true);
    expect(first.calls.filter(([name]) => name === 'stroke').length).toBeGreaterThanOrEqual(4);
    expect(first.depth).toBe(0);
  });

  it('gives Violet an organic casual soccer outfit without changing her identity or robe default', () => {
    const renderer = new CharacterRenderer();
    const casual = recordingContext();
    const replayedCasual = recordingContext();
    const casualPortrait = recordingContext();
    const defaultRobes = recordingContext();
    const explicitRobes = recordingContext();
    const casualCharacter = {
      kind: 'violet', x: 0, y: 0, facing: 'right', outfit: 'casual', pose: 'walking', walking: true,
    };

    renderer.draw(casual, casualCharacter, 1.125);
    renderer.draw(replayedCasual, casualCharacter, 1.125);
    renderer.drawPortrait(casualPortrait, {
      speaker: 'Violet', pose: 'speaking', outfit: 'casual', x: 0, y: 0,
    }, 1.125);
    renderer.draw(defaultRobes, { kind: 'violet', x: 0, y: 0, facing: 'right' }, 1.125);
    renderer.draw(explicitRobes, {
      kind: 'violet', x: 0, y: 0, facing: 'right', outfit: 'robes',
    }, 1.125);

    expect(casual.calls).toEqual(replayedCasual.calls);
    expect(defaultRobes.calls).toEqual(explicitRobes.calls);
    expect(casual.calls).not.toEqual(defaultRobes.calls);
    expect(casual.calls.filter(([name]) => name === 'bezierCurveTo').length).toBeGreaterThan(145);
    expect(casual.calls.some(([name]) => [
      'arc', 'ellipse', 'fillRect', 'rect', 'roundRect', 'strokeRect',
    ].includes(name))).toBe(false);
    expect(casual.calls.every(([, ...values]) => values.every(
      (value) => typeof value !== 'number' || Number.isFinite(value),
    ))).toBe(true);
    expect(casual.depth).toBe(0);
    expect(casualPortrait.depth).toBe(0);

    for (const surface of [casual, casualPortrait]) {
      for (const [property, style] of [
        ['fillStyle', VIOLET_STYLE.casualJerseyBase],
        ['fillStyle', VIOLET_STYLE.casualJerseyMid],
        ['fillStyle', VIOLET_STYLE.casualJerseyShadow],
        ['fillStyle', VIOLET_STYLE.casualLeggingBase],
        ['fillStyle', VIOLET_STYLE.hairBase],
        ['fillStyle', VIOLET_STYLE.iris],
        ['strokeStyle', VIOLET_STYLE.glasses],
        ['fillStyle', VIOLET_STYLE.shoeBase],
      ]) expect(surface.styles).toContainEqual([property, style]);
      expect(surface.styles).not.toContainEqual(['fillStyle', VIOLET_STYLE.robeBase]);
      expect(surface.styles).not.toContainEqual(['fillStyle', VIOLET_STYLE.lining]);
      expect(surface.styles.filter(([, style]) => style === VIOLET_STYLE.iris)).toHaveLength(2);
    }
    expect(casual.styles.filter(([, style]) => style === VIOLET_STYLE.hairBase))
      .toHaveLength(defaultRobes.styles.filter(([, style]) => style === VIOLET_STYLE.hairBase).length);
  });

  it('shares Violet’s expressive organic construction between gameplay and dialogue', () => {
    const renderer = new CharacterRenderer();
    const worldPuppet = recordingContext();
    const replayedWorld = recordingContext();
    const dialoguePortrait = recordingContext();
    const character = {
      kind: 'violet', x: 0, y: 0, facing: 'right', pose: 'speaking', walking: true, wand: true,
    };
    renderer.draw(worldPuppet, character, 0.75);
    renderer.draw(replayedWorld, character, 0.75);
    renderer.drawPortrait(dialoguePortrait, { speaker: 'Violet', pose: 'speaking', x: 0, y: 0 }, 0.75);

    expect(worldPuppet.calls).toEqual(replayedWorld.calls);
    expect(worldPuppet.calls.filter(([name]) => name === 'bezierCurveTo').length).toBeGreaterThan(125);
    expect(worldPuppet.calls.some(([name]) => [
      'arc', 'ellipse', 'fillRect', 'rect', 'roundRect', 'strokeRect',
    ].includes(name))).toBe(false);
    expect(worldPuppet.calls.every(([, ...values]) => values.every(
      (value) => typeof value !== 'number' || Number.isFinite(value),
    ))).toBe(true);
    expect(worldPuppet.depth).toBe(0);
    expect(dialoguePortrait.depth).toBe(0);

    for (const surface of [worldPuppet, dialoguePortrait]) {
      for (const [property, style] of [
        ['fillStyle', VIOLET_STYLE.hairBase],
        ['fillStyle', VIOLET_STYLE.hairShadow],
        ['fillStyle', VIOLET_STYLE.skinBase],
        ['fillStyle', VIOLET_STYLE.cheek],
        ['fillStyle', VIOLET_STYLE.iris],
        ['fillStyle', VIOLET_STYLE.pupil],
        ['strokeStyle', VIOLET_STYLE.glasses],
        ['fillStyle', VIOLET_STYLE.robeBase],
        ['fillStyle', VIOLET_STYLE.shoeBase],
      ]) expect(surface.styles).toContainEqual([property, style]);
      expect(surface.styles.filter(([, style]) => style === VIOLET_STYLE.iris)).toHaveLength(2);
      expect(surface.styles.filter(([, style]) => style === VIOLET_STYLE.pupil)).toHaveLength(2);
    }

    const facingLeft = recordingContext();
    renderer.draw(facingLeft, { kind: 'violet', x: 0, y: 0, facing: 'left' }, 0.75);
    expect(facingLeft.calls.filter((call) => (
      call[0] === 'scale' && call[1] === -1 && call[2] === 1
    )).length).toBeGreaterThanOrEqual(2);
  });

  it('carries Violet’s chosen robe color through the broad lining and every garment edge', () => {
    const renderer = new CharacterRenderer();
    const customTrim = recordingContext();
    const chosenColor = '#2b7770';

    renderer.draw(customTrim, {
      kind: 'violet', x: 0, y: 0, facing: 'right', outfit: 'robes', robeTrim: chosenColor,
    }, 0.75);

    expect(customTrim.styles.filter(([property, style]) => (
      property === 'fillStyle' && style === chosenColor
    )).length).toBeGreaterThanOrEqual(2);
    expect(customTrim.styles.filter(([property, style]) => (
      property === 'strokeStyle' && style === chosenColor
    )).length).toBeGreaterThanOrEqual(4);
    expect(customTrim.styles).not.toContainEqual(['fillStyle', VIOLET_STYLE.lining]);
    expect(customTrim.styles).not.toContainEqual(['strokeStyle', VIOLET_STYLE.lining]);
    expect(customTrim.styles).toContainEqual(['fillStyle', VIOLET_STYLE.robeBase]);
    expect(customTrim.depth).toBe(0);
  });

  it('uses shaped lids for Violet’s blink and deterministic whole-puppet motion', () => {
    const idle = sampleVioletMotion({ time: 0.25, pose: 'idle' });
    const speaking = sampleVioletMotion({ time: 0.25, pose: 'speaking' });
    const walking = sampleVioletMotion({ time: 0.25, pose: 'walking', walking: true });
    const replayed = sampleVioletMotion({ time: 0.25, pose: 'walking', walking: true });
    const reduced = sampleVioletMotion({
      time: 0.25, pose: 'walking', walking: true, reducedMotion: true,
    });
    const sanitized = sampleVioletMotion({ time: Number.NaN, pose: 'speaking' });

    expect(replayed).toEqual(walking);
    expect(Object.values(walking).every(Number.isFinite)).toBe(true);
    expect(Object.values(sanitized).every(Number.isFinite)).toBe(true);
    expect(speaking.talkWave).not.toBe(0);
    expect(idle.talkWave).toBe(0);
    expect(Math.abs(reduced.stride)).toBeLessThan(Math.abs(walking.stride));
    expect(Math.abs(reduced.armSwing)).toBeLessThan(Math.abs(walking.armSwing));
    expect(Math.abs(walking.armSwing)).toBeGreaterThan(Math.abs(idle.armSwing));

    const renderer = new CharacterRenderer();
    const openEyes = recordingContext();
    const blink = recordingContext();
    renderer.draw(openEyes, { kind: 'violet', x: 0, y: 0, facing: 'right' }, 1);
    renderer.draw(blink, { kind: 'violet', x: 0, y: 0, facing: 'right' }, 6.1);
    expect(blink.calls).not.toEqual(openEyes.calls);
    expect(blink.calls.filter(([name]) => name === 'bezierCurveTo').length).toBeGreaterThan(100);
    expect(blink.calls.some(([name]) => name === 'arc' || name === 'ellipse')).toBe(false);
    expect(blink.styles.filter(([, style]) => style === VIOLET_STYLE.iris)).toHaveLength(0);
    expect(blink.depth).toBe(0);
  });

  it('keeps cat and toad follow motion deterministic, bounded, and calmer in reduced motion', () => {
    for (const type of ['cat', 'toad']) {
      const input = { type, pose: 'pet-follow', time: 0.25 };
      const full = sampleCompanionMotion(input);
      const repeated = sampleCompanionMotion(input);
      const reduced = sampleCompanionMotion({ ...input, reducedMotion: true });
      const sanitized = sampleCompanionMotion({ ...input, time: Number.NaN });
      expect(repeated).toEqual(full);
      expect(Object.values(full).every(Number.isFinite)).toBe(true);
      expect(Object.values(sanitized).every(Number.isFinite)).toBe(true);
      expect(Math.abs(full.tilt)).toBeLessThan(0.08);
      expect(full.hop).toBeGreaterThanOrEqual(0);
      expect(Math.abs(reduced.tilt)).toBeLessThan(Math.abs(full.tilt));
      expect(reduced.hop).toBeLessThan(full.hop);
      expect(reduced.foreLift).toBeLessThan(full.foreLift);
      expect(Math.abs(reduced.headNod)).toBeLessThan(Math.abs(full.headNod));
      expect(Math.abs(reduced.headTilt)).toBeLessThan(Math.abs(full.headTilt));
      expect(Math.abs(1 - reduced.bodySquash)).toBeLessThan(Math.abs(1 - full.bodySquash));
    }

    const idleCat = sampleCompanionMotion({ type: 'cat', pose: 'idle', time: 0.25 });
    const pawingCat = sampleCompanionMotion({ type: 'cat', pose: 'paw', time: 0.25 });
    const reducedPawingCat = sampleCompanionMotion({
      type: 'cat', pose: 'paw', time: 0.25, reducedMotion: true,
    });
    expect(idleCat.pawLift).toBe(0);
    expect(pawingCat.pawLift).toBeGreaterThan(0.4);
    expect(reducedPawingCat.pawLift).toBeLessThan(pawingCat.pawLift);
  });

  it('renders cat and toad as layered organic puppets shared by world and portrait', () => {
    const renderer = new CharacterRenderer();
    const companions = [
      {
        type: 'cat',
        style: CAT_STYLE,
        palette: [
          CAT_STYLE.furBase,
          CAT_STYLE.furMid,
          CAT_STYLE.furShadow,
          CAT_STYLE.furLight,
          CAT_STYLE.chest,
          CAT_STYLE.muzzle,
          CAT_STYLE.collar,
          CAT_STYLE.brass,
          CAT_STYLE.rim,
        ],
        minimumCurves: 145,
      },
      {
        type: 'toad',
        style: TOAD_STYLE,
        palette: [
          TOAD_STYLE.skinBase,
          TOAD_STYLE.skinMid,
          TOAD_STYLE.skinShadow,
          TOAD_STYLE.skinLight,
          TOAD_STYLE.belly,
          TOAD_STYLE.bellyLight,
          TOAD_STYLE.rim,
        ],
        minimumCurves: 120,
      },
    ];

    for (const {
      type, style, palette, minimumCurves,
    } of companions) {
      const world = recordingContext();
      const replayed = recordingContext();
      const pet = {
        type, x: 140, y: 180, scale: 1.2, pose: 'pet-follow', facing: 'right',
      };
      renderer.drawPet(world, pet, 1.375);
      renderer.drawPet(replayed, pet, 1.375);

      expect(world.calls).toEqual(replayed.calls);
      expect(world.depth).toBe(0);
      expect(world.calls.filter(([, ...values]) => values.some(
        (value) => typeof value === 'number' && !Number.isFinite(value),
      ))).toHaveLength(0);
      expect(world.calls.filter(([name]) => name === 'bezierCurveTo').length)
        .toBeGreaterThanOrEqual(minimumCurves);
      expect(world.calls.some(([name]) => [
        'arc', 'ellipse', 'fillRect', 'rect', 'roundRect', 'strokeRect',
      ].includes(name))).toBe(false);
      for (const color of palette) {
        expect(world.styles.some(([, value]) => value === color)).toBe(true);
      }
      for (const eyeColor of [style.eyeWhite, style.iris, style.pupil, style.catchlight]) {
        expect(world.styles.filter(([, value]) => value === eyeColor)).toHaveLength(2);
      }

      const portrait = recordingContext();
      renderer.drawPortrait(portrait, {
        speaker: type, pose: 'speaking', x: 80, y: 90, facing: 'right',
      }, 1.375);
      for (const color of palette) {
        expect(portrait.styles.some(([, value]) => value === color)).toBe(true);
      }
      expect(portrait.depth).toBe(0);

      const sanitized = recordingContext();
      renderer.drawPet(sanitized, { ...pet, reducedMotion: true }, Number.NaN);
      expect(sanitized.calls.filter(([, ...values]) => values.some(
        (value) => typeof value === 'number' && !Number.isFinite(value),
      ))).toHaveLength(0);
      expect(sanitized.depth).toBe(0);
    }
  });
});
