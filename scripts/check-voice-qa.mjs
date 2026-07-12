import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { cards } from '../src/game/content/cards.js';
import { chapter1, chapter1ResumeRecaps } from '../src/game/content/chapters/ch1.js';
import { chapter2 } from '../src/game/content/chapters/ch2.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_QA_DIRECTORY = resolve(ROOT, 'audio/qa');
const DEFAULT_MANIFEST_FILE = resolve(DEFAULT_QA_DIRECTORY, 'manifest.json');
const DEFAULT_AUDIO_DIRECTORY = resolve(ROOT, 'public/assets/audio');
const ROLE_ORDER = Object.freeze(['narrator', 'guide', 'wandmaker', 'tailor', 'keeper', 'violet']);

export function collectExpectedVoiceLines() {
  const lines = [];
  for (const chapter of [chapter1, chapter2]) {
    for (const dialogue of Object.values(chapter.dialogues)) {
      for (const node of Object.values(dialogue.nodes)) {
        if (node.type === 'line') addLine(lines, node.voice, node.text, roleForSpeaker(node.speaker));
      }
    }
  }
  for (const quest of Object.values(chapter1.quests)) {
    for (const step of Object.values(quest.steps)) {
      addLine(lines, step.objective.voice, step.objective.text, roleForSpeaker(step.objective.speaker));
    }
  }
  for (const recap of chapter1ResumeRecaps) addLine(lines, recap.voice, recap.text, 'narrator');
  for (const card of cards) addLine(lines, card.voice, card.text, 'narrator');

  const unique = new Map();
  for (const line of lines) {
    const previous = unique.get(line.key);
    if (previous && (previous.text !== line.text || previous.role !== line.role)) {
      throw new Error(`${line.key} is assigned conflicting spoken text or roles.`);
    }
    unique.set(line.key, line);
  }
  return [...unique.values()].sort((left, right) => left.key.localeCompare(right.key));
}

export function normalizeSpokenText(value) {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/\bcolour\b/gu, 'color')
    .replace(/&/gu, ' and ')
    .replace(/[\u2018\u2019'`]/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/gu, ' ');
}

export function auditVoiceQa(expectedLines, records, loadIssues = []) {
  const expectedByKey = new Map(expectedLines.map((line) => [line.key, line]));
  const recordsByKey = new Map();
  const issues = [...loadIssues];
  for (const record of records) {
    if (recordsByKey.has(record.key)) {
      issues.push({ type: 'duplicate-key', message: `${record.key} is mapped to more than one transcript.` });
      continue;
    }
    recordsByKey.set(record.key, record);
  }

  const roleNames = [...new Set([...ROLE_ORDER, ...expectedLines.map((line) => line.role)])];
  const roles = Object.fromEntries(roleNames.map((role) => [role, {
    expected: 0,
    present: 0,
    matched: 0,
    missing: 0,
    mismatched: 0,
  }]));
  const missing = [];
  const mismatched = [];

  for (const line of expectedLines) {
    const stats = roles[line.role] ?? (roles[line.role] = {
      expected: 0, present: 0, matched: 0, missing: 0, mismatched: 0,
    });
    stats.expected += 1;
    const record = recordsByKey.get(line.key);
    if (!record) {
      stats.missing += 1;
      missing.push(line);
      continue;
    }
    stats.present += 1;
    const expected = normalizeSpokenText(line.text);
    const actual = normalizeSpokenText(record.text);
    if (expected === actual) stats.matched += 1;
    else {
      stats.mismatched += 1;
      mismatched.push({ ...line, actualText: record.text, file: record.file });
    }
  }

  const unexpected = [...recordsByKey.values()]
    .filter((record) => !expectedByKey.has(record.key))
    .sort((left, right) => left.key.localeCompare(right.key));
  const totals = Object.values(roles).reduce((sum, stats) => ({
    expected: sum.expected + stats.expected,
    present: sum.present + stats.present,
    matched: sum.matched + stats.matched,
    missing: sum.missing + stats.missing,
    mismatched: sum.mismatched + stats.mismatched,
  }), { expected: 0, present: 0, matched: 0, missing: 0, mismatched: 0 });

  return {
    passed: missing.length === 0 && mismatched.length === 0 && unexpected.length === 0 && issues.length === 0,
    roles,
    totals,
    missing,
    mismatched,
    unexpected,
    issues,
  };
}

export async function loadTranscriptionRecords({
  qaDirectory = DEFAULT_QA_DIRECTORY,
  manifestFile = DEFAULT_MANIFEST_FILE,
  audioDirectory = DEFAULT_AUDIO_DIRECTORY,
} = {}) {
  const issues = [];
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  } catch (error) {
    return {
      records: [],
      issues: [{ type: 'manifest', message: `Cannot read ${displayPath(manifestFile)}: ${error.message}` }],
    };
  }
  if (manifest?.version !== 2 || !isPlainObject(manifest.transcripts)) {
    return {
      records: [],
      issues: [{ type: 'manifest', message: `${displayPath(manifestFile)} must contain version 2 and a transcripts object.` }],
    };
  }

  const documents = new Map();
  for (const file of await listJsonFiles(qaDirectory)) {
    if (resolve(file) === resolve(manifestFile)) continue;
    const name = relativePath(qaDirectory, file);
    try {
      const value = JSON.parse(await readFile(file, 'utf8'));
      if (typeof value?.text === 'string') documents.set(name, { file, text: value.text });
    } catch (error) {
      issues.push({ type: 'invalid-json', message: `${displayPath(file)} is not valid JSON: ${error.message}` });
    }
  }

  const records = [];
  const mappedFiles = new Set();
  const mappedAudio = new Set();
  for (const [key, binding] of Object.entries(manifest.transcripts)) {
    if (typeof key !== 'string' || !key.startsWith('voice/') || !validAudioBinding(binding)) {
      issues.push({ type: 'manifest-entry', message: `Invalid transcript mapping ${JSON.stringify(key)}.` });
      continue;
    }
    if (!safeRelativePath(qaDirectory, binding.transcript)) {
      issues.push({ type: 'manifest-entry', message: `${key} uses an unsafe transcript path ${JSON.stringify(binding.transcript)}.` });
      continue;
    }
    if (!safeRelativePath(audioDirectory, binding.audio)) {
      issues.push({ type: 'manifest-entry', message: `${key} uses an unsafe audio path ${JSON.stringify(binding.audio)}.` });
      continue;
    }
    const expectedAudio = `${key}.mp3`;
    if (binding.audio !== expectedAudio) {
      issues.push({ type: 'manifest-entry', message: `${key} must bind to ${expectedAudio}, not ${binding.audio}.` });
      continue;
    }
    const normalizedFile = relativePath(qaDirectory, resolve(qaDirectory, binding.transcript));
    if (mappedFiles.has(normalizedFile)) {
      issues.push({ type: 'duplicate-file', message: `${normalizedFile} is mapped to more than one voice key.` });
      continue;
    }
    mappedFiles.add(normalizedFile);
    const normalizedAudio = relativePath(audioDirectory, resolve(audioDirectory, binding.audio));
    if (mappedAudio.has(normalizedAudio)) {
      issues.push({ type: 'duplicate-audio', message: `${normalizedAudio} is mapped to more than one voice key.` });
      continue;
    }
    mappedAudio.add(normalizedAudio);

    const document = documents.get(normalizedFile);
    if (!document) {
      issues.push({ type: 'missing-file', message: `${key} references missing transcript ${normalizedFile}.` });
    } else {
      records.push({ key, text: document.text, file: normalizedFile, audio: normalizedAudio });
    }

    try {
      const audio = await readFile(resolve(audioDirectory, binding.audio));
      const actualSha256 = createHash('sha256').update(audio).digest('hex');
      if (audio.byteLength !== binding.bytes || actualSha256 !== binding.sha256) {
        issues.push({
          type: 'stale-audio',
          key,
          message: `${key} audio changed since transcription: expected ${binding.bytes} bytes and sha256 ${binding.sha256}, found ${audio.byteLength} bytes and sha256 ${actualSha256}.`,
        });
      }
    } catch (error) {
      issues.push({ type: 'missing-audio', key, message: `${key} references unreadable audio ${normalizedAudio}: ${error.message}` });
    }
  }

  for (const [file] of documents) {
    if (!mappedFiles.has(file)) {
      issues.push({ type: 'unmapped-transcript', message: `${file} contains a transcript but is not mapped in the manifest.` });
    }
  }
  return { records, issues };
}

export async function runVoiceQa(options = {}) {
  const expectedLines = options.expectedLines ?? collectExpectedVoiceLines();
  const loaded = await loadTranscriptionRecords(options);
  return auditVoiceQa(expectedLines, loaded.records, loaded.issues);
}

export function formatVoiceQaReport(result) {
  const output = ['Voice transcription QA coverage by role:'];
  for (const [role, stats] of Object.entries(result.roles)) {
    if (stats.expected === 0) continue;
    output.push(
      `  ${role}: ${stats.matched}/${stats.expected} matched; ${stats.present} transcribed; ${stats.missing} missing; ${stats.mismatched} mismatched`,
    );
  }
  output.push(
    `Total: ${result.totals.matched}/${result.totals.expected} matched; ${result.totals.present} transcribed; ${result.totals.missing} missing; ${result.totals.mismatched} mismatched`,
  );

  if (result.missing.length > 0) {
    output.push('', 'Missing transcripts:');
    for (const line of result.missing) output.push(`  ${line.key} (${line.role})`);
  }
  if (result.mismatched.length > 0) {
    output.push('', 'Mismatched transcripts:');
    for (const mismatch of result.mismatched) {
      output.push(`  ${mismatch.key} (${mismatch.file})`);
      output.push(`    expected: ${mismatch.text}`);
      output.push(`    actual:   ${mismatch.actualText}`);
    }
  }
  if (result.unexpected.length > 0) {
    output.push('', 'Unexpected voice keys:');
    for (const record of result.unexpected) output.push(`  ${record.key} (${record.file})`);
  }
  if (result.issues.length > 0) {
    output.push('', 'QA record problems:');
    for (const issue of result.issues) output.push(`  ${issue.message}`);
  }
  output.push('', result.passed ? 'Voice transcription QA passed.' : 'Voice transcription QA failed.');
  return output.join('\n');
}

function addLine(lines, key, text, role) {
  if (typeof key !== 'string' || !key.startsWith('voice/')) throw new TypeError('Voice lines require a voice/ asset key.');
  if (typeof text !== 'string' || text.trim() === '') throw new TypeError(`${key} requires spoken text.`);
  lines.push({ key, text, role });
}

function roleForSpeaker(speaker) {
  return ({
    'npc.narrator': 'narrator',
    'npc.guide': 'guide',
    'npc.wandmaker': 'wandmaker',
    'npc.tailor': 'tailor',
    'npc.menagerieKeeper': 'keeper',
    'npc.violet': 'violet',
  })[speaker] ?? 'narrator';
}

async function listJsonFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listJsonFiles(path));
    else if (entry.isFile() && entry.name.endsWith('.json')) files.push(path);
  }
  return files.sort();
}

function safeRelativePath(root, value) {
  if (isAbsolute(value)) return false;
  const absolute = resolve(root, value);
  const candidate = relative(root, absolute);
  return candidate !== '..' && !candidate.startsWith(`..${sep}`) && !isAbsolute(candidate);
}

function validAudioBinding(value) {
  if (!isPlainObject(value)) return false;
  const keys = Object.keys(value).sort();
  if (keys.join(',') !== 'audio,bytes,sha256,transcript') return false;
  return typeof value.transcript === 'string'
    && typeof value.audio === 'string'
    && Number.isSafeInteger(value.bytes)
    && value.bytes > 0
    && typeof value.sha256 === 'string'
    && /^[a-f0-9]{64}$/u.test(value.sha256);
}

function relativePath(from, to) {
  return relative(from, to).split(sep).join('/');
}

function displayPath(path) {
  const local = relativePath(ROOT, path);
  return local.startsWith('../') ? path : local;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const isCli = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isCli) {
  const result = await runVoiceQa();
  console.log(formatVoiceQaReport(result));
  if (!result.passed) process.exitCode = 1;
}
