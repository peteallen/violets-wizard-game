import { ACTION_TYPES, validateAction } from '../contracts.js';
import {
  ActionRegistry,
  defineAction,
  resolveInjectedActionHandler,
} from './ActionRegistry.js';

const REFERENCE_HOOKS = Object.freeze({
  'dialogue.start': (action) => [{ kind: 'dialogue', id: action.script, path: 'script' }],
  'setPiece.play': (action) => [{ kind: 'setPiece', id: action.id, path: 'id' }],
  'travel.request': (action) => [{ kind: 'room', id: action.room, path: 'room' }],
  'audio.command': (action) => (action.key
    ? [{ kind: 'asset', id: action.key, path: 'key' }]
    : []),
});

function definitionFor(type) {
  return defineAction({
    type,
    validate(action, path) {
      validateAction(action, path);
    },
    references: REFERENCE_HOOKS[type],
    execute(action, context) {
      return resolveInjectedActionHandler(context, type)(action, context);
    },
  });
}

export const CORE_ACTION_TYPES = ACTION_TYPES;

export const CORE_ACTION_DEFINITIONS = Object.freeze(ACTION_TYPES.map(definitionFor));

export function createCoreActionRegistry() {
  return new ActionRegistry(CORE_ACTION_DEFINITIONS).seal();
}
