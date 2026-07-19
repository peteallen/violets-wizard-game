import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import {
  ARCHITECTURE_RULES,
  formatArchitectureDiagnostics,
  runArchitectureCheck,
  scanArchitecture,
} from '../scripts/check-architecture.mjs';

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporaryRoots = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('architecture boundary check', () => {
  it('finds static, re-exported, and dynamic runtime imports from source-only art and audio', async () => {
    const root = await fixture({
      'src/runtime.js': [
        "import '../art/hero.png';",
        "export { theme } from '../audio/theme.js';",
        "export const lazyHero = import('../art/lazy-hero.png');",
      ].join('\n'),
    });

    const diagnostics = await scanArchitecture({
      rootDirectory: root,
      config: testConfig({ runtime: ['src/**/*.js'] }),
    });

    expect(diagnostics.map(({ rule, match }) => ({ rule, match }))).toEqual([
      {
        rule: ARCHITECTURE_RULES.RUNTIME_SOURCE_ASSET_IMPORT,
        match: '../art/hero.png',
      },
      {
        rule: ARCHITECTURE_RULES.RUNTIME_SOURCE_ASSET_IMPORT,
        match: '../audio/theme.js',
      },
      {
        rule: ARCHITECTURE_RULES.RUNTIME_SOURCE_ASSET_IMPORT,
        match: '../art/lazy-hero.png',
      },
    ]);
  });

  it('keeps generic engine code behind chapter and character catalogs', async () => {
    const root = await fixture({
      'src/game/engine.js': [
        "import './chapters/ch3.js';",
        "import './characters/violet/draw.js';",
      ].join('\n'),
      'src/game/chapters/ch3.js': 'export const chapter = {};',
      'src/game/characters/violet/draw.js': 'export const draw = () => {};',
      'src/game/characters/violet/internal.js': "import './draw.js';",
    });

    const diagnostics = await scanArchitecture({
      rootDirectory: root,
      config: {
        ...testConfig({ genericEngine: ['src/game/engine.js'] }),
        targets: {
          concreteChapters: ['src/game/chapters/**'],
          concreteCharacters: ['src/game/characters/*/**'],
        },
      },
    });

    expect(diagnostics.map(({ rule, file }) => ({ rule, file }))).toEqual([
      {
        rule: ARCHITECTURE_RULES.GENERIC_CHAPTER_IMPORT,
        file: 'src/game/engine.js',
      },
      {
        rule: ARCHITECTURE_RULES.GENERIC_CHARACTER_IMPORT,
        file: 'src/game/engine.js',
      },
    ]);
  });

  it('keeps production roots away from eager content and asset compatibility aggregates', async () => {
    const root = await fixture({
      'src/main.js': "import './game/content/index.js';",
      'src/game/Game.js': "import './core/assetManifest.js';",
      'src/game/content/index.js': 'export const content = {};',
      'src/game/core/assetManifest.js': 'export const assets = {};',
    });

    const diagnostics = await scanArchitecture({
      rootDirectory: root,
      config: {
        ...testConfig({ productionRoots: ['src/main.js', 'src/game/Game.js'] }),
        targets: {
          concreteChapters: [],
          concreteCharacters: [],
          productionAggregates: [
            'src/game/content/index.js',
            'src/game/core/assetManifest.js',
          ],
        },
      },
    });

    expect(diagnostics.map(({ rule, file }) => ({ rule, file }))).toEqual([
      { rule: ARCHITECTURE_RULES.PRODUCTION_AGGREGATE_IMPORT, file: 'src/game/Game.js' },
      { rule: ARCHITECTURE_RULES.PRODUCTION_AGGREGATE_IMPORT, file: 'src/main.js' },
    ]);
  });

  it('rejects browser and nondeterministic APIs in headless code without matching prose', async () => {
    const root = await fixture({
      'src/game/simulation.js': [
        "const documentation = 'document, Math.random, and setTimeout are forbidden here';",
        '// window.setInterval(() => {}, 5);',
        'export const title = document.title;',
        'export const roll = Math.random();',
        'export const stamp = new Date();',
        'export const later = globalThis.setTimeout;',
      ].join('\n'),
    });

    const diagnostics = await scanArchitecture({
      rootDirectory: root,
      config: testConfig({ headless: ['src/game/simulation.js'] }),
    });

    expect(diagnostics.map(({ rule, match }) => ({ rule, match }))).toEqual([
      { rule: ARCHITECTURE_RULES.HEADLESS_BROWSER_API, match: 'document' },
      { rule: ARCHITECTURE_RULES.HEADLESS_NONDETERMINISM, match: 'Math.random' },
      { rule: ARCHITECTURE_RULES.HEADLESS_NONDETERMINISM, match: 'new Date' },
      { rule: ARCHITECTURE_RULES.HEADLESS_NONDETERMINISM, match: 'setTimeout' },
    ]);
  });

  it('rejects browser text-to-speech anywhere in runtime code', async () => {
    const root = await fixture({
      'src/game/audio.js': [
        "const line = new SpeechSynthesisUtterance('Temporary line');",
        'globalThis.speechSynthesis.speak(line);',
      ].join('\n'),
    });

    const diagnostics = await scanArchitecture({
      rootDirectory: root,
      config: testConfig({ runtime: ['src/**/*.js'] }),
    });

    expect(diagnostics.map(({ rule, match }) => ({ rule, match }))).toEqual([
      { rule: ARCHITECTURE_RULES.BROWSER_TTS, match: 'SpeechSynthesisUtterance' },
      { rule: ARCHITECTURE_RULES.BROWSER_TTS, match: 'speechSynthesis' },
    ]);
  });

  it('finds concrete chapter and character identifiers only in configured generic dispatch scopes', async () => {
    const root = await fixture({
      'src/game/engine.js': [
        "const room = 'ch12.library';",
        "const speaker = 'npc.librarian';",
        "const harmless = 'chapter.twelve';",
      ].join('\n'),
      'src/game/scenes/ch12/library.js': "export const room = 'ch12.library';",
    });

    const diagnostics = await scanArchitecture({
      rootDirectory: root,
      config: {
        ...testConfig({ genericDispatch: ['src/game/**/*.js'] }),
        exclusions: {
          all: [],
          genericEngine: [],
          genericDispatch: ['src/game/scenes/**'],
        },
      },
    });

    expect(diagnostics.map(({ file, match }) => ({ file, match }))).toEqual([
      { file: 'src/game/engine.js', match: 'ch12.library' },
      { file: 'src/game/engine.js', match: 'npc.librarian' },
    ]);
    expect(formatArchitectureDiagnostics(diagnostics)).toMatch(
      /^src\/game\/engine\.js:1:14 \[generic-concrete-routing\] /,
    );
  });

  it('consumes allowlist entries one-for-one and reports a stale baseline entry', async () => {
    const root = await fixture({
      'src/game/engine.js': "const first = 'ch4.room';\nconst second = 'ch4.room';",
    });
    const entry = {
      rule: ARCHITECTURE_RULES.GENERIC_CONCRETE_ROUTING,
      file: 'src/game/engine.js',
      match: 'ch4.room',
    };

    const oneEntry = await scanArchitecture({
      rootDirectory: root,
      config: {
        ...testConfig({ genericDispatch: ['src/game/engine.js'] }),
        allowlist: [entry],
      },
    });
    const exactBaseline = await scanArchitecture({
      rootDirectory: root,
      config: {
        ...testConfig({ genericDispatch: ['src/game/engine.js'] }),
        allowlist: [entry, entry],
      },
    });
    const staleBaseline = await scanArchitecture({
      rootDirectory: root,
      config: {
        ...testConfig({ genericDispatch: ['src/game/engine.js'] }),
        allowlist: [entry, entry, entry],
      },
    });

    expect(oneEntry).toHaveLength(1);
    expect(oneEntry[0].rule).toBe(ARCHITECTURE_RULES.GENERIC_CONCRETE_ROUTING);
    expect(exactBaseline).toEqual([]);
    expect(staleBaseline).toHaveLength(1);
    expect(staleBaseline[0]).toMatchObject({
      file: 'src/game/engine.js',
      line: 1,
      column: 1,
      rule: ARCHITECTURE_RULES.UNUSED_ALLOWLIST_ENTRY,
    });
  });

  it('returns an actionable failed result for callers', async () => {
    const root = await fixture({
      'src/game/engine.js': "export const destination = 'ch8.greatHall';",
    });

    const result = await runArchitectureCheck({
      rootDirectory: root,
      config: testConfig({ genericDispatch: ['src/game/engine.js'] }),
    });

    expect(result.ok).toBe(false);
    expect(result.output).toMatch(
      /^src\/game\/engine\.js:1:28 \[generic-concrete-routing\] Generic dispatch code routes on concrete identifier "ch8\.greatHall"\./,
    );
  });

  it('exits nonzero when the command-line check finds an unexpected violation', async () => {
    const root = await fixture({
      'src/runtime.js': "import '../art/source-only.png';",
    });
    const script = await readFile(join(REPOSITORY_ROOT, 'scripts/check-architecture.mjs'), 'utf8');
    await writeFixtureFile(root, 'scripts/check-architecture.mjs', script);

    const result = spawnSync(process.execPath, ['scripts/check-architecture.mjs'], {
      cwd: root,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[runtime-source-asset-import]');
  });

  it('passes the current repository through the explicit initial baseline', async () => {
    const diagnostics = await scanArchitecture({ rootDirectory: REPOSITORY_ROOT });
    expect(diagnostics).toEqual([]);
  });
});

function testConfig(scopes = {}) {
  return {
    extensions: ['.js'],
    scopes: {
      runtime: [],
      genericEngine: [],
      headless: [],
      genericDispatch: [],
      productionRoots: [],
      ...scopes,
    },
    exclusions: {
      all: [],
      genericEngine: [],
      genericDispatch: [],
    },
    targets: {
      concreteChapters: [],
      concreteCharacters: [],
      productionAggregates: [],
    },
    allowlist: [],
  };
}

async function fixture(files) {
  const root = await mkdtemp(join(tmpdir(), 'violets-architecture-'));
  temporaryRoots.push(root);
  await Promise.all(Object.entries(files).map(([path, contents]) => writeFixtureFile(root, path, contents)));
  return root;
}

async function writeFixtureFile(root, path, contents) {
  const destination = join(root, path);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, contents);
}
