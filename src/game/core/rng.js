const hashString = (value) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export class SeededRandom {
  constructor(seed = 1) {
    this.initialSeed = typeof seed === 'string' ? hashString(seed) : seed >>> 0;
    this.state = this.initialSeed || 1;
  }

  next() {
    this.state += 0x6d2b79f5;
    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  range(min, max) {
    return min + (max - min) * this.next();
  }

  integer(min, maxInclusive) {
    return Math.floor(this.range(min, maxInclusive + 1));
  }

  pick(values) {
    return values[this.integer(0, values.length - 1)];
  }

  fork(name) {
    return new SeededRandom(hashString(`${this.initialSeed}:${name}`));
  }

  reset() {
    this.state = this.initialSeed || 1;
  }
}
