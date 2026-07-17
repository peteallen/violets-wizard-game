import { ACTION_TYPES, validateAction } from '../contracts.js';
import {
  ActionRegistry,
  defineAction,
  resolveInjectedActionHandler,
} from './ActionRegistry.js';

const REFERENCE_HOOKS = Object.freeze({
  'flag.set': (action) => [{ kind: 'durableWrite', id: action.flag, path: 'flag' }],
  'choice.record': (action) => [{ kind: 'durableWrite', id: action.id, path: 'id' }],
  'dialogue.start': (action) => [{ kind: 'dialogue', id: action.script, path: 'script' }],
  'setPiece.play': (action) => [{ kind: 'setPiece', id: action.id, path: 'id' }],
  'travel.request': (action) => [{ kind: 'room', id: action.room, path: 'room' }],
  'collection.add': (action) => (action.collection === 'cards'
    ? [{ kind: 'card', id: action.id, path: 'id' }]
    : []),
  'reward.grant': (action) => [
    { kind: 'durableWrite', id: action.receipt, path: 'receipt' },
    ...action.cards.map((cardId, index) => ({
      kind: 'card',
      id: cardId,
      path: `cards[${index}]`,
    })),
  ],
  'yearbook.capture': (action) => [{
    kind: 'yearbookMoment',
    id: action.moment,
    path: 'moment',
  }],
  'chapter.complete': (action) => [
    { kind: 'chapterOwner', id: action.chapter, path: 'chapter' },
    { kind: 'chapterDestination', id: action.nextChapter, path: 'nextChapter' },
  ],
  'audio.command': (action) => (action.key
    ? [{ kind: 'asset', id: action.key, path: 'key' }]
    : []),
});

function definitionFor(type) {
  return defineAction({
    type,
    terminal: type === 'chapter.complete',
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
