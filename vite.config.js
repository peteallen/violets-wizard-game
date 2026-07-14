import { defineConfig } from 'vite';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const FULL_GIT_SHA = /^[a-f0-9]{40}$/;

export function currentGitSha({ cwd = process.cwd(), exec = execFileSync, env = process.env } = {}) {
  try {
    const sha = exec('git', ['rev-parse', '--verify', 'HEAD^{commit}'], { cwd, encoding: 'utf8' }).trim().toLowerCase();
    if (FULL_GIT_SHA.test(sha)) return sha;
  } catch {
    // The checked-out commit remains authoritative; CI's SHA is a fallback for archive builds.
  }
  const fallback = String(env.GITHUB_SHA ?? '').trim().toLowerCase();
  if (FULL_GIT_SHA.test(fallback)) return fallback;
  throw new Error('A full Git commit SHA is required to build Violet\'s Wizard Game.');
}

export function createBuildIdentity({ sha = currentGitSha(), builtAt = new Date().toISOString() } = {}) {
  if (!FULL_GIT_SHA.test(sha)) throw new TypeError('Build SHA must be a full lowercase 40-character Git SHA.');
  if (Number.isNaN(Date.parse(builtAt)) || !builtAt.endsWith('Z')) throw new TypeError('Build timestamp must be an ISO UTC instant.');
  return Object.freeze({ sha, builtAt });
}

export function versionFilePlugin(identity) {
  const version = createBuildIdentity(identity);
  return {
    name: 'violet-version-file',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: `${JSON.stringify(version, null, 2)}\n`,
      });
    },
  };
}

export function productionHtmlInputs() {
  return Object.freeze({
    game: fileURLToPath(new URL('./index.html', import.meta.url)),
    harness: fileURLToPath(new URL('./harness.html', import.meta.url)),
  });
}

export default defineConfig(() => {
  const identity = createBuildIdentity();
  return {
    base: './',
    define: {
      'import.meta.env.VITE_BUILD_SHA': JSON.stringify(identity.sha),
    },
    plugins: [versionFilePlugin(identity)],
    server: {
      host: true,
      port: 5173,
      strictPort: true,
    },
    preview: {
      host: true,
      port: 4173,
      strictPort: true,
    },
    build: {
      target: 'es2022',
      rollupOptions: {
        input: productionHtmlInputs(),
      },
    },
  };
});
