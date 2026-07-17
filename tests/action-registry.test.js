import { describe, expect, it, vi } from 'vitest';
import {
  ActionRegistry,
  ActionRegistryError,
  CORE_ACTION_TYPES,
  DuplicateActionTypeError,
  MissingActionHandlerError,
  UnknownActionTypeError,
  createCoreActionRegistry,
  defineAction,
} from '../src/game/actions/index.js';

function testDefinition(type = 'test.record') {
  return {
    type,
    validate(action, path) {
      const keys = Object.keys(action);
      if (keys.length !== 2 || !keys.includes('type') || !keys.includes('value')) {
        throw new TypeError(`${path} must contain exactly type and value.`);
      }
      if (typeof action.value !== 'string') throw new TypeError(`${path}.value must be a string.`);
    },
    references: (action) => [{ kind: 'asset', id: action.value, path: 'value' }],
    execute: (action, context) => context.record(action.value),
  };
}

const CURRENT_ACTIONS = Object.freeze({
  'flag.set': { type: 'flag.set', flag: 'ch1.arrived', value: true },
  'choice.record': { type: 'choice.record', id: 'ch1.path', value: 'kind' },
  'character.set': { type: 'character.set', field: 'house', value: 'gryffindor' },
  'dialogue.start': { type: 'dialogue.start', script: 'ch1.welcome' },
  'setPiece.play': { type: 'setPiece.play', id: 'ch1.setPiece.arrival' },
  'travel.request': { type: 'travel.request', room: 'ch1.greatHall', spawn: 'start' },
  'learning.start': { type: 'learning.start', id: 'ch1.nameTap' },
  'spell.learn': { type: 'spell.learn', spell: 'lumos' },
  'collection.add': { type: 'collection.add', collection: 'cards', id: 'dumbledore' },
  'reward.grant': {
    type: 'reward.grant',
    receipt: 'ch1.arrival.reward',
    points: 5,
    cards: ['dumbledore'],
    treasures: ['trainTicket'],
  },
  'ui.open': { type: 'ui.open', surface: 'satchel', tab: 'map' },
  'yearbook.capture': { type: 'yearbook.capture', moment: 'ch1.arrival' },
  'chapter.complete': { type: 'chapter.complete', chapter: 'ch1', nextChapter: 'ch2' },
  'audio.command': { type: 'audio.command', command: 'sfx', key: 'sfx/ch1/arrival' },
});

describe('ActionRegistry registration boundary', () => {
  it('copies and freezes definitions, rejects duplicates, and seals registration', () => {
    const source = testDefinition();
    const registry = new ActionRegistry();
    registry.register(source);
    source.type = 'test.changed';
    source.validate = vi.fn();

    expect(registry.ids()).toEqual(['test.record']);
    expect(Object.isFrozen(registry.get('test.record'))).toBe(true);
    expect(() => registry.register(testDefinition())).toThrow(DuplicateActionTypeError);

    registry.seal();
    expect(registry.sealed).toBe(true);
    expect(() => registry.register(testDefinition('test.second'))).toThrow(ActionRegistryError);
  });

  it('uses exact identities and gives explicit unknown-type errors', () => {
    const registry = new ActionRegistry([testDefinition()]);

    expect(registry.has('test.record')).toBe(true);
    expect(registry.has('record')).toBe(false);
    expect(registry.get('record')).toBeUndefined();
    expect(() => registry.require('record')).toThrow(UnknownActionTypeError);
    expect(() => registry.validate({ type: 'test.missing', value: 'one' })).toThrow(
      UnknownActionTypeError,
    );
  });

  it('requires exact definition hooks and rejects unsupported definition fields', () => {
    expect(() => defineAction({ type: 'test.action', execute: vi.fn() })).toThrow(/validation hook/);
    expect(() => defineAction({ type: 'test.action', validate: vi.fn() })).toThrow(/execution hook/);
    expect(() => defineAction({ ...testDefinition(), alias: 'record' })).toThrow(/not supported/);
    expect(() => defineAction({ ...testDefinition(), type: 'record' })).toThrow(/namespaced/);
    expect(() => defineAction({ ...testDefinition(), terminal: 'yes' })).toThrow(/terminal.*boolean/);
  });
});

describe('ActionRegistry validation, references, and execution', () => {
  it('runs exact validation before returning immutable linking metadata', () => {
    const registry = new ActionRegistry([testDefinition()]).seal();
    const action = { type: 'test.record', value: 'assets/ch1/star' };

    expect(registry.validate(action, 'chapter.actions[0]')).toBe(action);
    const references = registry.references(action, 'chapter.actions[0]');
    expect(references).toEqual([{ kind: 'asset', id: 'assets/ch1/star', path: 'value' }]);
    expect(Object.isFrozen(references)).toBe(true);
    expect(Object.isFrozen(references[0])).toBe(true);
    expect(() => registry.validate({ ...action, extra: true }, 'chapter.actions[0]')).toThrow(
      /exactly type and value/,
    );
  });

  it('executes only the exact registered hook against the injected context', () => {
    const record = vi.fn((value) => `recorded:${value}`);
    const registry = new ActionRegistry([testDefinition()]).seal();

    expect(registry.execute({ type: 'test.record', value: 'violet' }, { record })).toBe(
      'recorded:violet',
    );
    expect(record).toHaveBeenCalledWith('violet');
    expect(() => registry.execute({ type: 'test.missing', value: 'violet' }, { record })).toThrow(
      UnknownActionTypeError,
    );
  });
});

describe('current game action definitions', () => {
  it('registers every current contract action immutably in contract order', () => {
    const registry = createCoreActionRegistry();

    expect(registry.ids()).toEqual(CORE_ACTION_TYPES);
    expect(registry.ids()).toEqual(Object.keys(CURRENT_ACTIONS));
    expect(registry.sealed).toBe(true);
    expect(Object.isFrozen(CORE_ACTION_TYPES)).toBe(true);
    expect(registry.entries().every(Object.isFrozen)).toBe(true);
    expect(registry.isTerminal('chapter.complete')).toBe(true);
    expect(registry.isTerminal('travel.request')).toBe(false);
  });

  it('validates and executes every current type through exact injected handlers', () => {
    const registry = createCoreActionRegistry();
    const calls = [];
    const handlers = Object.fromEntries(CORE_ACTION_TYPES.map((type) => [
      type,
      (action, context) => {
        calls.push({ type, action, marker: context.marker });
        return type;
      },
    ]));
    const context = { handlers, marker: 'headless' };

    for (const type of CORE_ACTION_TYPES) {
      expect(registry.validate(CURRENT_ACTIONS[type])).toBe(CURRENT_ACTIONS[type]);
      expect(registry.execute(CURRENT_ACTIONS[type], context)).toBe(type);
    }

    expect(calls.map((call) => call.type)).toEqual(CORE_ACTION_TYPES);
    expect(calls.every((call) => call.marker === 'headless')).toBe(true);
  });

  it('exposes chapter-link references without performing execution', () => {
    const registry = createCoreActionRegistry();

    expect(registry.references(CURRENT_ACTIONS['flag.set'])).toEqual([
      { kind: 'durableWrite', id: 'ch1.arrived', path: 'flag' },
    ]);
    expect(registry.references(CURRENT_ACTIONS['choice.record'])).toEqual([
      { kind: 'durableWrite', id: 'ch1.path', path: 'id' },
    ]);
    expect(registry.references(CURRENT_ACTIONS['dialogue.start'])).toEqual([
      { kind: 'dialogue', id: 'ch1.welcome', path: 'script' },
    ]);
    expect(registry.references(CURRENT_ACTIONS['setPiece.play'])).toEqual([
      { kind: 'setPiece', id: 'ch1.setPiece.arrival', path: 'id' },
    ]);
    expect(registry.references(CURRENT_ACTIONS['travel.request'])).toEqual([
      { kind: 'room', id: 'ch1.greatHall', path: 'room' },
    ]);
    expect(registry.references(CURRENT_ACTIONS['collection.add'])).toEqual([
      { kind: 'card', id: 'dumbledore', path: 'id' },
    ]);
    expect(registry.references(CURRENT_ACTIONS['reward.grant'])).toEqual([
      { kind: 'durableWrite', id: 'ch1.arrival.reward', path: 'receipt' },
      { kind: 'card', id: 'dumbledore', path: 'cards[0]' },
    ]);
    expect(registry.references(CURRENT_ACTIONS['yearbook.capture'])).toEqual([
      { kind: 'yearbookMoment', id: 'ch1.arrival', path: 'moment' },
    ]);
    expect(registry.references(CURRENT_ACTIONS['chapter.complete'])).toEqual([
      { kind: 'chapterOwner', id: 'ch1', path: 'chapter' },
      { kind: 'chapterDestination', id: 'ch2', path: 'nextChapter' },
    ]);
    expect(registry.references(CURRENT_ACTIONS['audio.command'])).toEqual([
      { kind: 'asset', id: 'sfx/ch1/arrival', path: 'key' },
    ]);
    expect(registry.references({
      type: 'collection.add',
      collection: 'treasures',
      id: 'trainTicket',
    })).toEqual([]);
  });

  it('fails explicitly when a current action lacks its injected handler', () => {
    const registry = createCoreActionRegistry();

    expect(() => registry.execute(CURRENT_ACTIONS['flag.set'], { handlers: {} })).toThrow(
      MissingActionHandlerError,
    );
    expect(() => registry.execute(CURRENT_ACTIONS['flag.set'], {})).toThrow(
      MissingActionHandlerError,
    );
  });
});
