import { describe, expect, it, vi } from 'vitest';
import {
  catCharacterRuntime,
  catPortraitPresentation,
} from '../src/game/characters/cat/runtime.js';
import {
  hagridCharacterRuntime,
  hagridFullFrameCharacterRig,
  hagridPortraitPresentation,
} from '../src/game/characters/hagrid/runtime.js';
import {
  madamMalkinCharacterRuntime,
  madamMalkinFullFrameCharacterRig,
  madamMalkinPortraitPresentation,
} from '../src/game/characters/madam-malkin/runtime.js';
import {
  menagerieKeeperCharacterRuntime,
  menagerieKeeperPortraitPresentation,
} from '../src/game/characters/menagerie-keeper/runtime.js';
import {
  narratorCharacterRuntime,
  narratorPortraitPresentation,
} from '../src/game/characters/narrator/runtime.js';
import {
  petOwlCharacterRuntime,
  petOwlPortraitPresentation,
} from '../src/game/characters/pet-owl/runtime.js';
import {
  toadCharacterRuntime,
  toadPortraitPresentation,
} from '../src/game/characters/toad/runtime.js';
import {
  violetCharacterRuntime,
  violetFullFrameCharacterRig,
  violetPortraitPresentation,
} from '../src/game/characters/violet/runtime.js';
import {
  wandmakerCharacterRuntime,
  wandmakerFullFrameCharacterRig,
  wandmakerPortraitPresentation,
} from '../src/game/characters/wandmaker/runtime.js';
import { CharacterRenderer } from '../src/game/render/CharacterRenderer.js';

function round(value) {
  if (!Number.isFinite(value)) return value;
  const rounded = Math.round(value * 1e9) / 1e9;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function multiply(left, right) {
  return [
    left[0] * right[0] + left[2] * right[1],
    left[1] * right[0] + left[3] * right[1],
    left[0] * right[2] + left[2] * right[3],
    left[1] * right[2] + left[3] * right[3],
    left[0] * right[4] + left[2] * right[5] + left[4],
    left[1] * right[4] + left[3] * right[5] + left[5],
  ];
}

function point(matrix, x, y) {
  return [
    round(matrix[0] * x + matrix[2] * y + matrix[4]),
    round(matrix[1] * x + matrix[3] * y + matrix[5]),
  ];
}

function visualRecordingContext() {
  const paints = [];
  const clips = [];
  let path = [];
  let state = {
    transform: [1, 0, 0, 1, 0, 0],
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    globalAlpha: 1,
  };
  const stack = [];

  const pathCommand = (name, values) => {
    const transformed = [];
    for (let index = 0; index < values.length; index += 2) {
      transformed.push(...point(state.transform, values[index], values[index + 1]));
    }
    path.push([name, ...transformed]);
  };
  const paint = (operation, style) => paints.push({
    operation,
    path: path.map((command) => [...command]),
    style,
    alpha: round(state.globalAlpha),
    lineWidth: round(state.lineWidth),
    linearTransform: state.transform.slice(0, 4).map(round),
    lineCap: state.lineCap,
    lineJoin: state.lineJoin,
  });

  const methods = {
    save() {
      stack.push({ ...state, transform: [...state.transform] });
    },
    restore() {
      state = stack.pop();
    },
    translate(x, y) {
      state.transform = multiply(state.transform, [1, 0, 0, 1, x, y]);
    },
    scale(x, y) {
      state.transform = multiply(state.transform, [x, 0, 0, y, 0, 0]);
    },
    rotate(angle) {
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      state.transform = multiply(state.transform, [cosine, sine, -sine, cosine, 0, 0]);
    },
    beginPath() { path = []; },
    moveTo(x, y) { pathCommand('moveTo', [x, y]); },
    lineTo(x, y) { pathCommand('lineTo', [x, y]); },
    bezierCurveTo(...values) { pathCommand('bezierCurveTo', values); },
    quadraticCurveTo(...values) { pathCommand('quadraticCurveTo', values); },
    closePath() { path.push(['closePath']); },
    fill() { paint('fill', state.fillStyle); },
    stroke() { paint('stroke', state.strokeStyle); },
    clip() {
      clips.push(path.map((command) => [...command]));
    },
    fillRect(x, y, width, height) {
      const corners = [
        point(state.transform, x, y),
        point(state.transform, x + width, y),
        point(state.transform, x + width, y + height),
        point(state.transform, x, y + height),
      ];
      paints.push({
        operation: 'fillRect',
        path: corners,
        style: state.fillStyle,
        alpha: round(state.globalAlpha),
      });
    },
  };

  const context = new Proxy({}, {
    get(_target, property) {
      if (property === 'paints') return paints;
      if (property === 'clips') return clips;
      if (property === 'depth') return stack.length;
      if (Object.hasOwn(methods, property)) return methods[property];
      return state[property];
    },
    set(_target, property, value) {
      state[property] = value;
      return true;
    },
  });
  return context;
}

function visualSnapshot(context) {
  return {
    paints: context.paints,
    clips: context.clips,
    depth: context.depth,
  };
}

function markerForFullFrameRig(rig) {
  return (context, character) => {
    const placement = rig.manifest.fullFrame.placement.portrait;
    const scale = Number.isFinite(character.scale) ? character.scale : 1;
    const motionMark = character.reducedMotion ? 2 : 5;
    context.save();
    context.translate(
      (Number.isFinite(character.x) ? character.x : 0) + placement.x * scale,
      (Number.isFinite(character.y) ? character.y : 0) + placement.y * scale,
    );
    context.scale(placement.scale * scale, placement.scale * scale);
    context.fillStyle = character.robeTrim ?? '#765432';
    context.beginPath();
    context.moveTo(-24, 18);
    context.bezierCurveTo(-18, -31, 16, -31, 24, 18);
    context.lineTo(motionMark, 26);
    context.closePath();
    context.fill();
    context.restore();
    return Object.freeze({ status: 'drawn' });
  };
}

const PRESENTATIONS = Object.freeze([
  ['Violet', violetPortraitPresentation, '#302642', '#8b63aa', 0, 118, 0.82],
  ['Hagrid', hagridPortraitPresentation, '#30271f', '#7f6347', 0, 166, 0.92],
  ['Wandmaker', wandmakerPortraitPresentation, '#292b40', '#77799a', 0, 116, 0.84],
  ['Madam Malkin', madamMalkinPortraitPresentation, '#4e2943', '#ae688e', 0, 116, 0.84],
  ['Menagerie Keeper', menagerieKeeperPortraitPresentation, '#2f4939', '#66856d', 0, 116, 0.84],
  ['Narrator', narratorPortraitPresentation, '#33283f', '#8d6ca0', 0, 0, 1],
  ['Cat', catPortraitPresentation, '#49352b', '#b18464', 0, 78, 0.96],
  ['Pet Owl', petOwlPortraitPresentation, '#38313f', '#8b7a96', 0, 62, 0.86],
  ['Toad', toadPortraitPresentation, '#34412d', '#71875c', 0, 48, 1.05],
]);

const VECTOR_CASES = Object.freeze([
  ['Menagerie keeper', menagerieKeeperCharacterRuntime, { pose: 'talk' }],
  ['Narrator', narratorCharacterRuntime, { pose: 'speaking' }],
  ['cat', catCharacterRuntime, { pose: 'idle' }],
  ['owl', petOwlCharacterRuntime, { pose: 'idle', lookX: 0.35 }],
  ['toad', toadCharacterRuntime, { pose: 'idle' }],
]);

const FULL_FRAME_CASES = Object.freeze([
  ['Violet', violetCharacterRuntime, violetFullFrameCharacterRig, { outfit: 'robes' }],
  ['Hagrid', hagridCharacterRuntime, hagridFullFrameCharacterRig, {}],
  ['Ollivander', wandmakerCharacterRuntime, wandmakerFullFrameCharacterRig, {}],
  ['Madam Malkin', madamMalkinCharacterRuntime, madamMalkinFullFrameCharacterRig, {}],
]);

describe('canonical character portrait runtimes', () => {
  it('keeps every backdrop and exact legacy figure transform in its identity package', () => {
    for (const [label, presentation, dark, light, x, y, scale] of PRESENTATIONS) {
      expect(presentation, label).toEqual({
        backdrop: { dark, light },
        figure: { x, y, scale },
      });
      expect(Object.isFrozen(presentation), label).toBe(true);
      expect(Object.isFrozen(presentation.backdrop), label).toBe(true);
      expect(Object.isFrozen(presentation.figure), label).toBe(true);
    }
  });

  it('matches the legacy portrait’s recorded paint operations for every vector identity', () => {
    const legacyRenderer = new CharacterRenderer();
    for (const [speaker, runtime, figureState] of VECTOR_CASES) {
      const legacy = visualRecordingContext();
      const packaged = visualRecordingContext();
      const portrait = {
        ...figureState,
        x: 83,
        y: 91,
        scale: 1.17,
        facing: 'right',
        lightSide: 'right',
        reducedMotion: true,
      };
      legacyRenderer.drawPortrait(legacy, { ...portrait, speaker }, 3.875);
      runtime.renderers.portrait({ ...portrait, context: packaged, time: 3.875 });

      expect(visualSnapshot(packaged), speaker).toEqual(visualSnapshot(legacy));
      expect(packaged.depth, speaker).toBe(0);
    }
  });

  it('matches the legacy portrait composition for all four painted identities', () => {
    const legacyRenderer = new CharacterRenderer();
    for (const [speaker, runtime, rig, figureState] of FULL_FRAME_CASES) {
      const draw = vi.spyOn(rig, 'draw').mockImplementation(markerForFullFrameRig(rig));
      try {
        const legacy = visualRecordingContext();
        const packaged = visualRecordingContext();
        const portrait = {
          ...figureState,
          x: 83,
          y: 91,
          scale: 1.17,
          pose: 'talk',
          facing: 'left',
          lightSide: 'right',
          reducedMotion: true,
        };
        legacyRenderer.drawPortrait(legacy, { ...portrait, speaker }, 2.625);
        runtime.renderers.portrait({ ...portrait, context: packaged, time: 2.625 });

        expect(visualSnapshot(packaged), speaker).toEqual(visualSnapshot(legacy));
        expect(packaged.depth, speaker).toBe(0);
      } finally {
        draw.mockRestore();
      }
    }
  });
});
