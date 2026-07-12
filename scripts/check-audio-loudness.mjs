import './check-node.mjs';

import { readdir } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { analyzeAudio } from './audio_mastering.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const AUDIO_ROOT = resolve(ROOT, 'public/assets/audio');

const RULES = Object.freeze({
  music: Object.freeze({ target: -22, minimum: -22.75, maximum: -21.25 }),
  sfx: Object.freeze({ target: -18, minimum: -24, maximum: -16.5 }),
  voice: Object.freeze({ target: -16, minimum: -23.25, maximum: -14.5 }),
  guide: Object.freeze({ target: -16, minimum: -16.75, maximum: -15.25 }),
});
const TRUE_PEAK_CEILING_DBTP = -0.95;

export function classifyAudioPath(path) {
  const normalized = String(path).replaceAll('\\', '/');
  if (normalized.includes('/music/')) return 'music';
  if (normalized.includes('/sfx/')) return 'sfx';
  if (normalized.includes('/voice/') && normalized.includes('/guide/')) return 'guide';
  if (normalized.includes('/voice/')) return 'voice';
  return null;
}

export function validateAudioMeasurement(path, measurement) {
  const category = classifyAudioPath(path);
  if (!category) return [];
  const rule = RULES[category];
  const loudness = Number(measurement.input_i);
  const truePeak = Number(measurement.input_tp);
  const issues = [];
  if (!Number.isFinite(loudness) || loudness < rule.minimum || loudness > rule.maximum) {
    issues.push(`${path} is ${measurement.input_i} LUFS; ${category} must remain between ${rule.minimum} and ${rule.maximum} LUFS around its ${rule.target} LUFS target.`);
  }
  if (!Number.isFinite(truePeak) || truePeak > TRUE_PEAK_CEILING_DBTP) {
    issues.push(`${path} reaches ${measurement.input_tp} dBTP; audio must remain at or below ${TRUE_PEAK_CEILING_DBTP} dBTP.`);
  }
  return issues;
}

export async function checkAudioLoudness({ audioRoot = AUDIO_ROOT } = {}) {
  const paths = await listMp3Files(audioRoot);
  const measurements = [];
  const issues = [];
  for (const path of paths) {
    const file = relative(ROOT, path).split('\\').join('/');
    const measurement = await analyzeAudio(path);
    measurements.push({ file, category: classifyAudioPath(path), loudness: Number(measurement.input_i), truePeak: Number(measurement.input_tp) });
    issues.push(...validateAudioMeasurement(file, measurement));
  }
  return { passed: issues.length === 0, measurements, issues };
}

async function listMp3Files(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listMp3Files(path));
    else if (entry.isFile() && entry.name.endsWith('.mp3')) files.push(path);
  }
  return files.sort();
}

function formatReport(result) {
  const lines = [];
  const categories = [...new Set(result.measurements.map((entry) => entry.category))];
  for (const category of categories) {
    const entries = result.measurements.filter((entry) => entry.category === category);
    const loudness = entries.map((entry) => entry.loudness);
    const peaks = entries.map((entry) => entry.truePeak);
    lines.push(`${category}: ${entries.length} files, ${Math.min(...loudness).toFixed(2)}..${Math.max(...loudness).toFixed(2)} LUFS, highest peak ${Math.max(...peaks).toFixed(2)} dBTP`);
  }
  if (result.issues.length) lines.push('', ...result.issues, '', 'Audio loudness check failed.');
  else lines.push('', `Audio loudness check passed for ${result.measurements.length} files.`);
  return lines.join('\n');
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isCli) {
  const result = await checkAudioLoudness();
  console.log(formatReport(result));
  if (!result.passed) process.exitCode = 1;
}
