import { validateTimeline } from '../contracts.js';
import { clamp, easeInOutCubic, easeOutBack, easeOutCubic, lerp } from '../core/math.js';

const EASING = Object.freeze({
  linear: (value) => value,
  easeInOutCubic,
  easeOutCubic,
  easeOutBack,
});

export class TimelineError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimelineError';
  }
}

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function resolvePath(root, path) {
  let current = root;
  for (const segment of path.split('.')) {
    if (current === null || current === undefined || !Object.hasOwn(current, segment)) {
      throw new TimelineError(`Timeline context does not contain "${path}".`);
    }
    current = current[segment];
  }
  return current;
}

function resolvePoint(value, context, label) {
  const point = typeof value === 'string' ? resolvePath(context, value) : value;
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new TimelineError(`${label} must resolve to a finite {x, y} point.`);
  }
  return point;
}

function normalizeItem(value, context, index) {
  if (typeof value === 'string') {
    const contextual = context.items?.[value];
    return {
      id: value,
      x: contextual?.x,
      y: contextual?.y,
      sourceIndex: index,
    };
  }
  return { ...value, sourceIndex: index };
}

function resolveItems(track, context) {
  const rawItems = typeof track.items === 'string' ? resolvePath(context, track.items) : track.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new TimelineError(`Stagger items for track at ${track.start} must resolve to a non-empty array.`);
  }
  const items = rawItems.map((item, index) => normalizeItem(item, context, index));

  if (track.order.by === 'reverse') return items.reverse();
  if (track.order.by !== 'distance') return items;

  const origin = resolvePoint(track.order.origin, context, 'Stagger origin');
  for (const item of items) {
    if (!Number.isFinite(item.x) || !Number.isFinite(item.y)) {
      throw new TimelineError(`Distance-ordered item "${item.id}" is missing finite x/y coordinates.`);
    }
  }
  return items.sort((left, right) => {
    const leftDistance = Math.hypot(left.x - origin.x, left.y - origin.y);
    const rightDistance = Math.hypot(right.x - origin.x, right.y - origin.y);
    return leftDistance - rightDistance || left.sourceIndex - right.sourceIndex;
  });
}

function compile(definition, context) {
  const channelTracks = [];
  const cues = [];
  let ordinal = 0;

  for (const track of definition.tracks) {
    if (track.type === 'set' || track.type === 'tween') {
      channelTracks.push({ ...cloneJson(track), ordinal: ordinal += 1 });
      continue;
    }
    if (track.type === 'cue') {
      cues.push({
        at: track.at,
        type: track.event,
        payload: cloneJson(track.payload),
        ordinal: ordinal += 1,
      });
      continue;
    }

    const items = resolveItems(track, context);
    items.forEach((item, index) => {
      const start = track.start + track.interval * index;
      channelTracks.push({
        type: 'tween',
        target: track.child.target.replaceAll('$item', item.id),
        start,
        end: start + track.child.duration,
        from: track.child.from,
        to: track.child.to,
        easing: track.child.easing,
        ordinal: ordinal += 1,
      });
    });
  }

  const timeOf = (track) => track.type === 'set' ? track.at : track.start;
  channelTracks.sort((left, right) => timeOf(left) - timeOf(right) || left.ordinal - right.ordinal);
  cues.sort((left, right) => left.at - right.at || left.ordinal - right.ordinal);
  return { channelTracks, cues };
}

export class Timeline {
  constructor(definition, context = {}) {
    validateTimeline(definition);
    const compiled = compile(definition, context);
    this.definition = cloneJson(definition);
    this.channelTracks = compiled.channelTracks;
    this.cues = compiled.cues;
    this.duration = Math.max(0, ...this.channelTracks.map((track) => (
      track.type === 'set' ? track.at : track.end
    )), ...this.cues.map((cue) => cue.at));
  }

  sample(time) {
    if (!Number.isFinite(time) || time < 0) throw new TimelineError('sample(time) requires a non-negative finite time.');
    const channels = {};

    for (const track of this.channelTracks) {
      if (track.type === 'set') {
        if (time >= track.at) channels[track.target] = cloneJson(track.value);
        continue;
      }
      if (time < track.start) continue;
      const progress = clamp((time - track.start) / (track.end - track.start), 0, 1);
      channels[track.target] = lerp(track.from, track.to, EASING[track.easing](progress));
    }

    return channels;
  }

  advance(from, to) {
    const validFrom = Number.isFinite(from) || from === -Infinity;
    if (!validFrom || !Number.isFinite(to) || to < 0 || from > to) {
      throw new TimelineError('advance(from, to) requires an ordered range ending at a non-negative finite time.');
    }
    return this.cues
      .filter((cue) => cue.at > from && cue.at <= to)
      .map(({ at, type, payload }) => ({ at, type, payload: cloneJson(payload) }));
  }
}

export function compileTimeline(definition, context = {}) {
  return new Timeline(definition, context);
}
