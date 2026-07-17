import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cards } from '../src/game/content/cards.js';
import { chapter1, chapter1ResumeRecaps } from '../src/game/content/chapters/ch1.js';
import { chapter2 } from '../src/game/content/chapters/ch2.js';
import { masterAudio } from './audio_mastering.mjs';
import { chapter3VoiceManifest } from './chapter3_voice_manifest.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const API_KEY = process.env.ELEVENLABS_API_KEY;
const force = process.argv.includes('--force');
const qaEnabled = process.argv.includes('--qa');
const roleFilter = argumentValue('--role');
const chapterFilter = parseChapterFilter(argumentValue('--chapter'));
const keyFilter = argumentValue('--key');
const VOICE_TARGET_LUFS = -16;
const QA_DIRECTORY = resolve(ROOT, 'audio/qa');
const QA_MANIFEST_FILE = resolve(QA_DIRECTORY, 'manifest.json');
if (!API_KEY) throw new Error('ELEVENLABS_API_KEY is not set.');

const VOICE_PROFILES = Object.freeze({
  narrator: profile('BNgbHR0DNeZixGQVzloa', { stability: 0.62, similarityBoost: 0.78, style: 0.2 }),
  guide: profile('YIn3yKpQSeXNJMF5CIuj', { stability: 0.48, similarityBoost: 0.78, style: 0.42 }),
  wandmaker: profile('j9jfwdrw7BRfcR43Qohk'),
  tailor: profile('pFZP5JQG7iQjIQuC4Bku'),
  keeper: profile('Xb7hH8MSUJpSbSDYk0k2'),
  conductor: profile('JBFqnCBsd6RMkjVDRZzb', { stability: 0.56, similarityBoost: 0.76, style: 0.32 }),
  harry: profile('Sun6GPdivU7N4kTmYtDw', {
    stability: 0.48,
    similarityBoost: 0.76,
    style: 0.38,
    preFilters: pitchFilters(1.04),
  }),
  ron: profile('loY1uopAz31XyhAEhNSa', {
    stability: 0.44,
    similarityBoost: 0.76,
    style: 0.42,
  }),
  hermione: profile('nDJIICjR9zfJExIFeSCN', {
    stability: 0.56,
    similarityBoost: 0.78,
    style: 0.26,
  }),
  'trolley-witch': profile('Xb7hH8MSUJpSbSDYk0k2', { stability: 0.6, similarityBoost: 0.78, style: 0.3 }),
  'deputy-head': profile('YIn3yKpQSeXNJMF5CIuj', { stability: 0.63, similarityBoost: 0.8, style: 0.24 }),
  'sorting-hat': profile('NFG5qt843uXKj4pFvR7C', {
    stability: 0.38,
    similarityBoost: 0.8,
    style: 0.68,
    preFilters: pitchFilters(0.94),
  }),
  headmaster: profile('j9jfwdrw7BRfcR43Qohk', { stability: 0.66, similarityBoost: 0.78, style: 0.24 }),
  home: profile('pFZP5JQG7iQjIQuC4Bku', { stability: 0.66, similarityBoost: 0.78, style: 0.24 }),
  flitwick: profile('JBFqnCBsd6RMkjVDRZzb', {
    stability: 0.48,
    similarityBoost: 0.76,
    style: 0.5,
    preFilters: pitchFilters(1.14),
  }),
  learning: profile('JBFqnCBsd6RMkjVDRZzb', {
    stability: 0.66,
    similarityBoost: 0.78,
    style: 0.28,
    preFilters: pitchFilters(1.14),
  }),
  neville: profile('Sun6GPdivU7N4kTmYtDw', {
    stability: 0.64,
    similarityBoost: 0.74,
    style: 0.16,
    preFilters: [...pitchFilters(1.08), 'atempo=0.96'],
  }),
  ghost: profile('onwK4e9ZLuTAKqWW03F9', {
    stability: 0.6,
    similarityBoost: 0.76,
    style: 0.3,
    preFilters: [...pitchFilters(1.03), 'aecho=0.8:0.3:45:0.06'],
  }),
});

if (roleFilter && !Object.hasOwn(VOICE_PROFILES, roleFilter)) {
  throw new Error(`Unknown voice role ${roleFilter}. Choose one of: ${Object.keys(VOICE_PROFILES).join(', ')}.`);
}

const lines = collectLines().filter((line) => (
  (!roleFilter || line.role === roleFilter)
  && (!chapterFilter || line.chapter === chapterFilter)
  && (!keyFilter || line.key === keyFilter)
));
if (keyFilter && lines.length === 0) throw new Error(`Unknown voice key ${keyFilter}.`);
const outputs = [];
for (const line of lines) outputs.push(await generate(line));
if (qaEnabled) await transcribeAndRecord(outputs);
console.log(`Voice generation complete: ${lines.length} lines${qaEnabled ? ' with transcription QA records' : ''}.`);

function collectLines() {
  const collected = [];
  const chapters = [
    { number: 1, content: chapter1, recaps: chapter1ResumeRecaps },
    { number: 2, content: chapter2, recaps: chapter2.recaps ?? [] },
  ];
  for (const { number, content, recaps } of chapters) {
    for (const dialogue of Object.values(content.dialogues)) {
      for (const node of Object.values(dialogue.nodes)) {
        if (node.type === 'line') collected.push({
          chapter: number,
          key: node.voice,
          text: node.text,
          role: roleFor(node.speaker),
        });
      }
    }
    for (const quest of Object.values(content.quests)) {
      for (const step of Object.values(quest.steps)) {
        collected.push({
          chapter: number,
          key: step.objective.voice,
          text: step.objective.text,
          role: roleFor(step.objective.speaker),
        });
      }
    }
    for (const recap of recaps) collected.push({
      chapter: number,
      key: recap.voice,
      text: recap.text,
      role: 'narrator',
    });
  }
  for (const card of cards) collected.push({
    chapter: card.chapter,
    key: card.voice,
    text: card.text,
    role: 'narrator',
  });
  collected.push(...chapter3VoiceManifest);
  const unique = new Map();
  for (const line of collected) {
    const previous = unique.get(line.key);
    if (previous && (previous.text !== line.text || previous.role !== line.role)) {
      throw new Error(`${line.key} is assigned conflicting spoken text or roles.`);
    }
    unique.set(line.key, line);
  }
  return [...unique.values()];
}

function roleFor(speaker) {
  return ({
    'npc.narrator': 'narrator',
    'npc.guide': 'guide',
    'npc.wandmaker': 'wandmaker',
    'npc.tailor': 'tailor',
    'npc.menagerieKeeper': 'keeper',
    'ch2.npc.narrator': 'narrator',
    'ch2.npc.conductor': 'conductor',
    'ch2.npc.harry': 'harry',
    'ch2.npc.ron': 'ron',
    'ch2.npc.hermione': 'hermione',
    'ch2.npc.trolleyWitch': 'trolley-witch',
    'ch2.npc.deputyHead': 'deputy-head',
    'ch2.npc.sortingHat': 'sorting-hat',
    'ch2.npc.headmaster': 'headmaster',
  })[speaker] ?? 'narrator';
}

async function generate(line) {
  const output = resolve(ROOT, 'public/assets/audio', `${line.key}.mp3`);
  if (!force && await exists(output)) {
    console.log(`skip ${line.key}`);
    return { line, output };
  }
  await mkdir(dirname(output), { recursive: true });
  const profile = VOICE_PROFILES[line.role];
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${profile.voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'content-type': 'application/json',
      accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: line.generationText ?? line.text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: voiceSettings(profile),
    }),
  });
  if (!response.ok) throw new Error(`${line.key}: ElevenLabs returned ${response.status} ${await response.text()}`);
  const rawOutput = `${output}.raw-${process.pid}.mp3`;
  try {
    await writeFile(rawOutput, Buffer.from(await response.arrayBuffer()));
    await normalizeVoice(rawOutput, output, line.role);
  } finally {
    await unlink(rawOutput).catch(() => {});
  }
  console.log(`wrote ${line.key} (${VOICE_TARGET_LUFS} LUFS)`);
  return { line, output };
}

function voiceSettings(voiceProfile) {
  return {
    stability: voiceProfile.stability,
    similarity_boost: voiceProfile.similarityBoost,
    style: voiceProfile.style,
    use_speaker_boost: true,
  };
}

async function normalizeVoice(input, output, role) {
  const roleFilters = VOICE_PROFILES[role].preFilters;
  await masterAudio(input, output, {
    targetLufs: VOICE_TARGET_LUFS,
    truePeakDbtp: -1,
    loudnessRange: 7,
    preFilters: [
      'highpass=f=65',
      ...roleFilters,
      'acompressor=threshold=-20dB:ratio=2.5:attack=15:release=140:makeup=3dB',
    ],
    channels: 1,
    bitrate: '128k',
  });
}

async function transcribeAndRecord(outputs) {
  const manifest = JSON.parse(await readFile(QA_MANIFEST_FILE, 'utf8'));
  if (manifest?.version !== 2 || !manifest.transcripts || Array.isArray(manifest.transcripts)) {
    throw new Error('audio/qa/manifest.json must contain version 2 and a transcripts object.');
  }

  const selectedKeys = new Set(outputs.map(({ line }) => line.key));
  if (chapterFilter && !roleFilter && !keyFilter) {
    const prefix = `voice/ch${chapterFilter}/`;
    for (const [key, binding] of Object.entries(manifest.transcripts)) {
      if (!key.startsWith(prefix) || selectedKeys.has(key)) continue;
      await unlink(resolve(QA_DIRECTORY, binding.transcript)).catch(() => {});
      delete manifest.transcripts[key];
      console.log(`removed stale QA binding ${key}`);
    }
  }

  for (const { line, output } of outputs) {
    const audio = await readFile(output);
    const transcript = await transcribe(audio, basename(output), line.key);
    const transcriptFile = `${line.key.replace(/^voice\//u, '')}.json`;
    const transcriptOutput = resolve(QA_DIRECTORY, transcriptFile);
    await mkdir(dirname(transcriptOutput), { recursive: true });
    await writeFile(transcriptOutput, `${JSON.stringify(transcript, null, 2)}\n`);
    manifest.transcripts[line.key] = {
      transcript: transcriptFile,
      audio: `${line.key}.mp3`,
      bytes: audio.byteLength,
      sha256: createHash('sha256').update(audio).digest('hex'),
    };
    console.log(`transcribed ${line.key}`);
  }

  manifest.transcripts = Object.fromEntries(
    Object.entries(manifest.transcripts).sort(([left], [right]) => left.localeCompare(right)),
  );
  await writeFile(QA_MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function transcribe(audio, filename, key) {
  const form = new FormData();
  form.append('model_id', 'scribe_v2');
  form.append('language_code', 'eng');
  form.append('file', new Blob([audio], { type: 'audio/mpeg' }), filename);
  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY },
    body: form,
  });
  if (!response.ok) throw new Error(`${key}: ElevenLabs transcription returned ${response.status} ${await response.text()}`);
  return response.json();
}

function profile(voiceId, {
  stability = 0.58,
  similarityBoost = 0.76,
  style = 0.22,
  preFilters = [],
} = {}) {
  return Object.freeze({ voiceId, stability, similarityBoost, style, preFilters: Object.freeze(preFilters) });
}

function pitchFilters(factor) {
  const tempo = (1 / factor).toFixed(6);
  return [`asetrate=44100*${factor}`, 'aresample=44100', `atempo=${tempo}`];
}

function argumentValue(name) {
  const directIndex = process.argv.indexOf(name);
  if (directIndex >= 0) return process.argv[directIndex + 1] ?? null;
  const prefix = `${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function parseChapterFilter(value) {
  if (value == null) return null;
  const match = String(value).match(/^(?:ch)?([1-4])$/u);
  if (!match) throw new Error('--chapter must be a number from 1 through 4, optionally prefixed with ch.');
  return Number(match[1]);
}

async function exists(path) {
  try {
    return (await stat(path)).size > 1024;
  } catch {
    return false;
  }
}
