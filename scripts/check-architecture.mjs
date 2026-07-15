import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const ARCHITECTURE_RULES = Object.freeze({
  RUNTIME_SOURCE_ASSET_IMPORT: 'runtime-source-asset-import',
  GENERIC_CHAPTER_IMPORT: 'generic-concrete-chapter-import',
  GENERIC_CHARACTER_IMPORT: 'generic-concrete-character-import',
  HEADLESS_BROWSER_API: 'headless-browser-api',
  HEADLESS_NONDETERMINISM: 'headless-nondeterminism',
  GENERIC_CONCRETE_ROUTING: 'generic-concrete-routing',
  UNUSED_ALLOWLIST_ENTRY: 'unused-architecture-allowlist',
});

const LEGACY_CHARACTER_IMPLEMENTATIONS = Object.freeze([
  'src/game/render/HagridFullFrameCharacterRig.js',
  'src/game/render/MadamMalkinFullFrameCharacterRig.js',
  'src/game/render/OwlRenderer.js',
  'src/game/render/VioletAlignedSpriteRig.js',
  'src/game/render/VioletFullFrameCharacterRig.js',
  'src/game/render/VioletRobeRecolor.js',
  'src/game/render/WandmakerFullFrameCharacterRig.js',
]);

const BROWSER_APIS = Object.freeze([
  api('document', /\bdocument\b/g, 'Pass browser state through an adapter instead of reading document in headless code.'),
  api('window', /\bwindow\b/g, 'Pass browser state through an adapter instead of reading window in headless code.'),
  api('localStorage', /\blocalStorage\b/g, 'Inject a storage adapter instead of reading localStorage in headless code.'),
  api('sessionStorage', /\bsessionStorage\b/g, 'Inject a storage adapter instead of reading sessionStorage in headless code.'),
  api('navigator', /\bnavigator\b/g, 'Pass platform capabilities into headless code instead of reading navigator.'),
  api('Image', /\bImage\b/g, 'Load images in the browser-facing rendering layer, not headless code.'),
  api('Audio', /\bAudio\b/g, 'Play audio in a browser-facing adapter, not headless code.'),
  api('HTMLCanvasElement', /\bHTMLCanvasElement\b/g, 'Keep Canvas types in the rendering layer, not headless code.'),
  api('OffscreenCanvas', /\bOffscreenCanvas\b/g, 'Keep Canvas types in the rendering layer, not headless code.'),
]);

const NONDETERMINISTIC_APIS = Object.freeze([
  api('Math.random', /\bMath\s*\.\s*random\b/g, 'Use the seeded random source passed into the simulation.'),
  api('Date.now', /\bDate\s*\.\s*now\b/g, 'Pass simulation time or an explicit clock into headless code.'),
  api('new Date', /\bnew\s+Date\b/g, 'Pass simulation time or an explicit clock into headless code.'),
  api('performance.now', /\bperformance\s*\.\s*now\b/g, 'Pass simulation time into headless code.'),
  api('crypto.getRandomValues', /\bcrypto\s*\.\s*getRandomValues\b/g, 'Use the seeded random source passed into the simulation.'),
  api('crypto.randomUUID', /\bcrypto\s*\.\s*randomUUID\b/g, 'Derive deterministic identifiers from simulation state.'),
  api('setTimeout', /\bsetTimeout\b/g, 'Schedule work through an injected scheduler outside the simulation.'),
  api('setInterval', /\bsetInterval\b/g, 'Schedule work through an injected scheduler outside the simulation.'),
  api('requestAnimationFrame', /\brequestAnimationFrame\b/g, 'Drive headless code with simulation updates from the browser layer.'),
  api('cancelAnimationFrame', /\bcancelAnimationFrame\b/g, 'Drive headless code with simulation updates from the browser layer.'),
]);

const DEFAULT_SCOPES = Object.freeze({
  runtime: Object.freeze(['src/**/*.js', 'src/**/*.mjs']),
  genericEngine: Object.freeze([
    'src/game/Game.js',
    'src/game/core/**/*.js',
    'src/game/render/**/*.js',
    'src/game/systems/**/*.js',
    'src/game/world/**/*.js',
  ]),
  headless: Object.freeze([
    'src/game/contracts.js',
    'src/game/content/**/*.js',
    'src/game/systems/**/*.js',
    'src/game/world/**/*.js',
  ]),
  genericDispatch: Object.freeze([
    'src/game/Game.js',
    'src/game/core/**/*.js',
    'src/game/render/**/*.js',
    'src/game/systems/**/*.js',
    'src/game/world/**/*.js',
  ]),
});

const DEFAULT_EXCLUSIONS = Object.freeze({
  all: Object.freeze(['node_modules/**', 'dist/**', '.git/**']),
  genericEngine: LEGACY_CHARACTER_IMPLEMENTATIONS,
  genericDispatch: Object.freeze([
    ...LEGACY_CHARACTER_IMPLEMENTATIONS,
    'src/game/render/chapters/**',
    'src/game/render/scenes/**',
  ]),
});

const DEFAULT_TARGETS = Object.freeze({
  concreteChapters: Object.freeze([
    'src/game/content/chapters/**',
    'src/game/chapters/*/**',
  ]),
  concreteCharacters: Object.freeze([
    ...LEGACY_CHARACTER_IMPLEMENTATIONS,
    'src/game/characters/*/**',
    'src/game/render/characters/*/**',
  ]),
});

const CURRENT_ALLOWLIST = Object.freeze([
  ...allowMany(ARCHITECTURE_RULES.GENERIC_CHAPTER_IMPORT, 'src/game/core/assetManifest.js', [
    '../content/chapters/ch1.js',
    '../content/chapters/ch2.js',
  ]),
  ...allowMany(ARCHITECTURE_RULES.GENERIC_CONCRETE_ROUTING, 'src/game/core/assetManifest.js', [
    'ch2',
    'ch1',
    'ch1',
  ]),
  ...allowMany(ARCHITECTURE_RULES.GENERIC_CONCRETE_ROUTING, 'src/game/core/VersionWatcher.js', [
    'ch1.chapterCardRoom',
    'ch2',
  ]),
  ...allowMany(ARCHITECTURE_RULES.GENERIC_CHAPTER_IMPORT, 'src/game/Game.js', [
    './content/chapters/ch1.js',
  ]),
  ...allowMany(ARCHITECTURE_RULES.GENERIC_CONCRETE_ROUTING, 'src/game/Game.js', [
    'ch1.letter.read',
    'ch2',
    'ch2.previewRoom',
    'ch1.courtyard',
    'ch1.letterRead',
    'ch1',
    'ch1',
    'ch1.courtyard',
    'ch2',
    'ch2',
    'ch1.diagonStreet',
    'ch1',
    'ch1',
    'ch1',
    'ch1.chapterCardRoom',
    'ch1',
    'ch1',
    'ch1.bedroom',
    'ch1.letter',
    'ch1.letterScene',
    'ch1',
    'ch1',
    'ch1.letterRead',
    'ch1.wallOpened',
    'ch1.wandChosen',
    'ch1.trimChosen',
    'ch1.petNamed',
    'ch1.ticketReceived',
    'ch1.complete',
  ]),
  ...allowMany(ARCHITECTURE_RULES.GENERIC_CHARACTER_IMPORT, 'src/game/render/CharacterRenderer.js', [
    './OwlRenderer.js',
    './VioletAlignedSpriteRig.js',
    './VioletFullFrameCharacterRig.js',
    './HagridFullFrameCharacterRig.js',
    './WandmakerFullFrameCharacterRig.js',
    './MadamMalkinFullFrameCharacterRig.js',
  ]),
  ...allowMany(ARCHITECTURE_RULES.GENERIC_CONCRETE_ROUTING, 'src/game/render/FullFrameCharacterRig.js', [
    'ch1',
  ]),
  ...allowMany(ARCHITECTURE_RULES.GENERIC_CONCRETE_ROUTING, 'src/game/render/RoomRenderer.js', [
    'ch1.bedroom',
    'ch1.leaky',
    'ch1.courtyard',
    'ch1.diagonStreet',
    'ch1.ollivanders',
    'ch1.malkins',
    'ch1.menagerie',
    'ch1.bedroom',
    'ch1.bedroom',
    'ch1.bedroom',
    'ch1.leaky',
    'ch1.courtyard',
    'ch1.diagonStreet',
    'ch1.ollivanders',
    'ch1.malkins',
    'ch1.menagerie',
    'ch1.bedroom',
  ]),
  ...allowMany(ARCHITECTURE_RULES.GENERIC_CHAPTER_IMPORT, 'src/game/render/SetPieceRenderer.js', [
    '../content/chapters/ch1-letter.js',
  ]),
  ...allowMany(ARCHITECTURE_RULES.GENERIC_CHAPTER_IMPORT, 'src/game/render/UIRenderer.js', [
    '../content/chapters/ch1.js',
  ]),
  ...allowMany(ARCHITECTURE_RULES.GENERIC_CONCRETE_ROUTING, 'src/game/render/UIRenderer.js', [
    'npc.violet',
    'npc.guide',
    'npc.guide',
    'npc.wandmaker',
    'npc.wandmaker',
    'npc.narrator',
    'ch1.diagonStreet',
    'ch1.ollivanders',
    'ch1.malkins',
    'ch1.menagerie',
    'ch1.diagonStreet',
    'ch1.ollivanders',
    'ch1.malkins',
    'ch1.menagerie',
    'ch1.diagonStreet',
  ]),
  ...allowMany(ARCHITECTURE_RULES.GENERIC_CONCRETE_ROUTING, 'src/game/render/WorldPropRenderer.js', [
    'ch1.letter.read',
  ]),
  ...allowMany(ARCHITECTURE_RULES.GENERIC_CONCRETE_ROUTING, 'src/game/systems/Save.js', [
    'ch1',
    'ch1.letterScene',
    'ch1.bedroom',
  ]),
  ...allowMany(ARCHITECTURE_RULES.HEADLESS_NONDETERMINISM, 'src/game/systems/Save.js', [
    'setTimeout',
  ]),
  ...allowMany(ARCHITECTURE_RULES.GENERIC_CONCRETE_ROUTING, 'src/game/world/GuideWalkCue.js', [
    'ch1.guideLeavesBedroom',
    'ch1',
    'ch1.bedroom',
    'npc.guide',
    'ch1.guideMet',
    'ch1.leakyReached',
    'ch1.guideLeavesLeaky',
    'ch1',
    'ch1.leaky',
    'npc.guide',
    'ch1.leakyReached',
    'ch1.courtyardReached',
  ]),
  ...allowMany(ARCHITECTURE_RULES.GENERIC_CONCRETE_ROUTING, 'src/game/world/World.js', [
    'ch1',
    'ch1.keeper.petAndName',
    'npc.violet',
    'npc.pet.',
    'ch1.petNamed',
    'ch2',
    'ch1.trimChosen',
    'ch1.tailor.done',
    'ch1.guide.arrival',
    'ch1.guide.leaky',
    'ch1.petNamed',
    'ch1.satchelReceived',
    'ch1.mapUsed',
    'ch1.satchelReceived',
    'ch1.ollivanders',
    'ch1.wandChosen',
    'ch1.malkins',
    'ch1.trimChosen',
    'ch1.menagerie',
  ]),
]);

export const DEFAULT_ARCHITECTURE_CONFIG = Object.freeze({
  extensions: Object.freeze(['.js', '.mjs', '.cjs', '.ts', '.tsx']),
  scopes: DEFAULT_SCOPES,
  exclusions: DEFAULT_EXCLUSIONS,
  targets: DEFAULT_TARGETS,
  browserApis: BROWSER_APIS,
  nondeterministicApis: NONDETERMINISTIC_APIS,
  allowlist: CURRENT_ALLOWLIST,
});

export async function scanArchitecture({ rootDirectory = ROOT, config = {} } = {}) {
  const root = resolve(rootDirectory);
  const settings = mergeConfig(config);
  const matchers = compileConfigMatchers(settings);
  const files = await walk(root, new Set(settings.extensions));
  const diagnostics = [];

  for (const absoluteFile of files) {
    const file = toPosix(relative(root, absoluteFile));
    if (matchesAny(file, matchers.exclusions.all)) continue;
    const active = {
      runtime: matchesAny(file, matchers.scopes.runtime),
      genericEngine: matchesAny(file, matchers.scopes.genericEngine)
        && !matchesAny(file, matchers.exclusions.genericEngine),
      headless: matchesAny(file, matchers.scopes.headless),
      genericDispatch: matchesAny(file, matchers.scopes.genericDispatch)
        && !matchesAny(file, matchers.exclusions.genericDispatch),
    };
    if (!Object.values(active).some(Boolean)) continue;

    const source = await readFile(absoluteFile, 'utf8');
    const lexical = lexSource(source);
    const locate = createLocator(source);

    if (active.runtime || active.genericEngine) {
      for (const imported of collectImports(lexical.tokens)) {
        const target = resolveImportTarget(root, file, imported.value);
        if (!target) continue;
        if (active.runtime && isSourceAssetTarget(target)) {
          diagnostics.push(diagnostic({
            rule: ARCHITECTURE_RULES.RUNTIME_SOURCE_ASSET_IMPORT,
            file,
            index: imported.start,
            locate,
            match: imported.value,
            message: `Runtime code imports source-only ${topLevelFolder(target)} material through ${JSON.stringify(imported.value)}. Ship generated assets from public/assets and resolve them through a production asset catalog.`,
          }));
        }
        if (active.genericEngine && matchesAny(target, matchers.targets.concreteChapters)) {
          diagnostics.push(diagnostic({
            rule: ARCHITECTURE_RULES.GENERIC_CHAPTER_IMPORT,
            file,
            index: imported.start,
            locate,
            match: imported.value,
            message: `Generic engine code imports concrete chapter implementation ${JSON.stringify(imported.value)}. Depend on a chapter catalog or injected chapter contract instead.`,
          }));
        }
        if (active.genericEngine && matchesAny(target, matchers.targets.concreteCharacters)) {
          diagnostics.push(diagnostic({
            rule: ARCHITECTURE_RULES.GENERIC_CHARACTER_IMPORT,
            file,
            index: imported.start,
            locate,
            match: imported.value,
            message: `Generic engine code imports concrete character implementation ${JSON.stringify(imported.value)}. Depend on the character catalog or a character package contract instead.`,
          }));
        }
      }
    }

    if (active.headless) {
      diagnostics.push(...findApiDiagnostics({
        descriptors: settings.browserApis,
        code: lexical.code,
        file,
        locate,
        rule: ARCHITECTURE_RULES.HEADLESS_BROWSER_API,
      }));
      diagnostics.push(...findApiDiagnostics({
        descriptors: settings.nondeterministicApis,
        code: lexical.code,
        file,
        locate,
        rule: ARCHITECTURE_RULES.HEADLESS_NONDETERMINISM,
      }));
    }

    if (active.genericDispatch) {
      for (const token of lexical.tokens) {
        if (token.kind !== 'string' || !isConcreteRoutingLiteral(token.value)) continue;
        diagnostics.push(diagnostic({
          rule: ARCHITECTURE_RULES.GENERIC_CONCRETE_ROUTING,
          file,
          index: token.start,
          locate,
          match: token.value,
          message: `Generic dispatch code routes on concrete identifier ${JSON.stringify(token.value)}. Move this decision into its character, chapter, or scene package and dispatch through registered metadata.`,
        }));
      }
    }
  }

  diagnostics.sort(compareDiagnostics);
  return applyAllowlist(diagnostics, settings.allowlist);
}

export function formatArchitectureDiagnostics(diagnostics) {
  return diagnostics
    .map(({ file, line, column, rule, message }) => `${file}:${line}:${column} [${rule}] ${message}`)
    .join('\n');
}

export async function runArchitectureCheck(options = {}) {
  const diagnostics = await scanArchitecture(options);
  return Object.freeze({
    ok: diagnostics.length === 0,
    diagnostics,
    output: formatArchitectureDiagnostics(diagnostics),
  });
}

function api(match, pattern, message) {
  return Object.freeze({ match, pattern, message });
}

function allowMany(rule, file, matches) {
  return matches.map((match) => Object.freeze({ rule, file, match }));
}

function mergeConfig(config) {
  return {
    ...DEFAULT_ARCHITECTURE_CONFIG,
    ...config,
    scopes: { ...DEFAULT_ARCHITECTURE_CONFIG.scopes, ...(config.scopes ?? {}) },
    exclusions: { ...DEFAULT_ARCHITECTURE_CONFIG.exclusions, ...(config.exclusions ?? {}) },
    targets: { ...DEFAULT_ARCHITECTURE_CONFIG.targets, ...(config.targets ?? {}) },
    allowlist: config.allowlist ?? DEFAULT_ARCHITECTURE_CONFIG.allowlist,
  };
}

function compileConfigMatchers(config) {
  return {
    scopes: mapPatternGroups(config.scopes),
    exclusions: mapPatternGroups(config.exclusions),
    targets: mapPatternGroups(config.targets),
  };
}

function mapPatternGroups(groups) {
  return Object.fromEntries(Object.entries(groups).map(([name, patterns]) => [
    name,
    (patterns ?? []).map((pattern) => globToRegExp(pattern)),
  ]));
}

async function walk(root, extensions) {
  const files = [];
  await visit(root);
  return files;

  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && ['.git', 'dist', 'node_modules'].includes(entry.name)) continue;
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile() && extensions.has(extname(entry.name))) files.push(path);
    }
  }
}

function lexSource(source) {
  const code = [...source];
  const tokens = [];
  let index = 0;
  while (index < source.length) {
    const character = source[index];
    const next = source[index + 1];
    if (character === '/' && next === '/') {
      const start = index;
      index += 2;
      while (index < source.length && source[index] !== '\n') index += 1;
      mask(code, source, start, index);
      continue;
    }
    if (character === '/' && next === '*') {
      const start = index;
      index += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) index += 1;
      index = Math.min(source.length, index + 2);
      mask(code, source, start, index);
      continue;
    }
    if (character === "'" || character === '"') {
      const start = index;
      const quote = character;
      index += 1;
      let value = '';
      while (index < source.length) {
        if (source[index] === '\\') {
          value += decodeEscape(source[index + 1]);
          index += 2;
          continue;
        }
        if (source[index] === quote) {
          index += 1;
          break;
        }
        value += source[index];
        index += 1;
      }
      tokens.push({ kind: 'string', value, start, end: index });
      mask(code, source, start, index);
      continue;
    }
    if (character === '`') {
      const start = index;
      index += 1;
      while (index < source.length) {
        if (source[index] === '\\') {
          index += 2;
          continue;
        }
        if (source[index] === '`') {
          index += 1;
          break;
        }
        index += 1;
      }
      mask(code, source, start, index);
      continue;
    }
    if (/[A-Za-z_$]/.test(character)) {
      const start = index;
      index += 1;
      while (index < source.length && /[A-Za-z0-9_$]/.test(source[index])) index += 1;
      tokens.push({ kind: 'identifier', value: source.slice(start, index), start, end: index });
      continue;
    }
    if (!/\s/.test(character)) tokens.push({ kind: 'punctuator', value: character, start: index, end: index + 1 });
    index += 1;
  }
  return { code: code.join(''), tokens };
}

function mask(target, source, start, end) {
  for (let index = start; index < end; index += 1) {
    if (source[index] !== '\n' && source[index] !== '\r') target[index] = ' ';
  }
}

function decodeEscape(character) {
  if (character === 'n') return '\n';
  if (character === 'r') return '\r';
  if (character === 't') return '\t';
  return character ?? '';
}

function collectImports(tokens) {
  const imports = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.kind !== 'identifier') continue;
    if (token.value === 'import') {
      const next = tokens[index + 1];
      if (next?.kind === 'string') imports.push(next);
      else if (next?.value === '(' && tokens[index + 2]?.kind === 'string') imports.push(tokens[index + 2]);
      else {
        const source = findFromSpecifier(tokens, index + 1);
        if (source) imports.push(source);
      }
    } else if (token.value === 'export') {
      const next = tokens[index + 1];
      if (next?.value === '*' || next?.value === '{' || next?.value === 'type') {
        const source = findFromSpecifier(tokens, index + 1);
        if (source) imports.push(source);
      }
    }
  }
  return imports;
}

function findFromSpecifier(tokens, start) {
  for (let index = start; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.value === ';') return null;
    if (index > start && token.kind === 'identifier' && ['import', 'export'].includes(token.value)) return null;
    if (token.kind === 'identifier' && token.value === 'from') {
      return tokens[index + 1]?.kind === 'string' ? tokens[index + 1] : null;
    }
  }
  return null;
}

function resolveImportTarget(root, importer, specifier) {
  const cleanSpecifier = specifier.split(/[?#]/, 1)[0];
  let absolute;
  if (cleanSpecifier.startsWith('.')) absolute = resolve(root, dirname(importer), cleanSpecifier);
  else if (cleanSpecifier.startsWith('/')) absolute = resolve(root, cleanSpecifier.slice(1));
  else if (/^(?:art|audio|src)\//.test(cleanSpecifier)) absolute = resolve(root, cleanSpecifier);
  else return null;
  const target = toPosix(relative(root, absolute));
  return target === '..' || target.startsWith('../') ? null : target;
}

function isSourceAssetTarget(target) {
  return target === 'art' || target.startsWith('art/') || target === 'audio' || target.startsWith('audio/');
}

function topLevelFolder(target) {
  return target.split('/')[0];
}

function findApiDiagnostics({ descriptors, code, file, locate, rule }) {
  const diagnostics = [];
  for (const descriptor of descriptors) {
    const pattern = descriptor.pattern instanceof RegExp
      ? new RegExp(descriptor.pattern.source, descriptor.pattern.flags.includes('g') ? descriptor.pattern.flags : `${descriptor.pattern.flags}g`)
      : new RegExp(descriptor.pattern, 'g');
    for (const match of code.matchAll(pattern)) {
      diagnostics.push(diagnostic({
        rule,
        file,
        index: match.index,
        locate,
        match: descriptor.match,
        message: `${descriptor.match} crosses the deterministic, headless boundary. ${descriptor.message}`,
      }));
    }
  }
  return diagnostics;
}

function isConcreteRoutingLiteral(value) {
  return /^ch\d+(?:$|[./:_-])/.test(value) || /^npc\.(?:[^.]+)(?:\.|$)/.test(value);
}

function diagnostic({ rule, file, index, locate, match, message }) {
  const { line, column } = locate(index);
  return { rule, file, line, column, match, message };
}

function createLocator(source) {
  const lineStarts = [0];
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === '\n') lineStarts.push(index + 1);
  }
  return (index) => {
    let low = 0;
    let high = lineStarts.length - 1;
    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      if (lineStarts[middle] <= index) low = middle + 1;
      else high = middle - 1;
    }
    const lineIndex = Math.max(0, high);
    return { line: lineIndex + 1, column: index - lineStarts[lineIndex] + 1 };
  };
}

function applyAllowlist(diagnostics, allowlist) {
  const remaining = [...diagnostics];
  const unused = [];
  for (const entry of allowlist) {
    validateAllowlistEntry(entry);
    const index = remaining.findIndex((candidate) => (
      candidate.rule === entry.rule
      && candidate.file === toPosix(entry.file)
      && candidate.match === entry.match
    ));
    if (index >= 0) remaining.splice(index, 1);
    else unused.push({
      rule: ARCHITECTURE_RULES.UNUSED_ALLOWLIST_ENTRY,
      file: toPosix(entry.file),
      line: 1,
      column: 1,
      match: `${entry.rule}:${entry.match}`,
      message: `Allowlist entry for [${entry.rule}] ${JSON.stringify(entry.match)} is no longer used. Remove it so the architectural baseline keeps ratcheting down.`,
    });
  }
  return [...remaining, ...unused].sort(compareDiagnostics);
}

function validateAllowlistEntry(entry) {
  if (!entry || typeof entry.rule !== 'string' || typeof entry.file !== 'string' || typeof entry.match !== 'string') {
    throw new TypeError('Architecture allowlist entries require string rule, file, and match fields.');
  }
}

function compareDiagnostics(left, right) {
  return left.file.localeCompare(right.file)
    || left.line - right.line
    || left.column - right.column
    || left.rule.localeCompare(right.rule)
    || left.match.localeCompare(right.match);
}

function globToRegExp(pattern) {
  const glob = toPosix(pattern);
  let expression = '^';
  for (let index = 0; index < glob.length; index += 1) {
    const character = glob[index];
    if (character === '*') {
      if (glob[index + 1] === '*') {
        index += 1;
        if (glob[index + 1] === '/') {
          index += 1;
          expression += '(?:.*/)?';
        } else expression += '.*';
      } else expression += '[^/]*';
    } else if (character === '?') expression += '[^/]';
    else expression += character.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
  }
  return new RegExp(`${expression}$`);
}

function matchesAny(path, patterns = []) {
  return patterns.some((pattern) => pattern.test(path));
}

function toPosix(path) {
  return path.split(sep).join('/');
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const result = await runArchitectureCheck();
  if (!result.ok) {
    console.error(`Architecture check failed with ${result.diagnostics.length} problem${result.diagnostics.length === 1 ? '' : 's'}:\n${result.output}`);
    process.exitCode = 1;
  } else console.log('Architecture check passed.');
}
