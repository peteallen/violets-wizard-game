import { mkdir, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cards } from '../src/game/content/cards.js';
import { chapter1, chapter1ResumeRecaps } from '../src/game/content/chapters/ch1.js';
import { chapter2 } from '../src/game/content/chapters/ch2.js';
import { masterAudio } from './audio_mastering.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const API_KEY = process.env.ELEVENLABS_API_KEY;
const force = process.argv.includes('--force');
const roleFilter = argumentValue('--role');
const VOICE_TARGET_LUFS = -16;
if (!API_KEY) throw new Error('ELEVENLABS_API_KEY is not set.');

const VOICES = Object.freeze({
  narrator: 'BNgbHR0DNeZixGQVzloa',
  guide: 'YIn3yKpQSeXNJMF5CIuj',
  wandmaker: 'j9jfwdrw7BRfcR43Qohk',
  tailor: 'pFZP5JQG7iQjIQuC4Bku',
  keeper: 'Xb7hH8MSUJpSbSDYk0k2',
  violet: 'pFZP5JQG7iQjIQuC4Bku',
});

if (roleFilter && !Object.hasOwn(VOICES, roleFilter)) {
  throw new Error(`Unknown voice role ${roleFilter}. Choose one of: ${Object.keys(VOICES).join(', ')}.`);
}

const lines = collectLines().filter((line) => !roleFilter || line.role === roleFilter);
for (const line of lines) await generate(line);
console.log(`Voice generation complete: ${lines.length} lines.`);

function collectLines() {
  const collected = [];
  for (const chapter of [chapter1, chapter2]) {
    for (const dialogue of Object.values(chapter.dialogues)) {
      for (const node of Object.values(dialogue.nodes)) {
        if (node.type === 'line') collected.push({ key: node.voice, text: node.text, role: roleFor(node.speaker) });
      }
    }
  }
  for (const quest of Object.values(chapter1.quests)) {
    for (const step of Object.values(quest.steps)) {
      collected.push({ key: step.objective.voice, text: step.objective.text, role: roleFor(step.objective.speaker) });
    }
  }
  for (const recap of chapter1ResumeRecaps) collected.push({ key: recap.voice, text: recap.text, role: 'narrator' });
  for (const card of cards) collected.push({ key: card.voice, text: card.text, role: 'narrator' });
  return [...new Map(collected.map((line) => [line.key, line])).values()];
}

function roleFor(speaker) {
  return ({
    'npc.narrator': 'narrator',
    'npc.guide': 'guide',
    'npc.wandmaker': 'wandmaker',
    'npc.tailor': 'tailor',
    'npc.menagerieKeeper': 'keeper',
    'npc.violet': 'violet',
  })[speaker] ?? 'narrator';
}

async function generate(line) {
  const output = resolve(ROOT, 'public/assets/audio', `${line.key}.mp3`);
  if (!force && await exists(output)) {
    console.log(`skip ${line.key}`);
    return;
  }
  await mkdir(dirname(output), { recursive: true });
  const settings = voiceSettings(line.role);
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICES[line.role]}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'content-type': 'application/json',
      accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: line.text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: settings,
    }),
  });
  if (!response.ok) throw new Error(`${line.key}: ElevenLabs returned ${response.status} ${await response.text()}`);
  const rawOutput = `${output}.raw-${process.pid}.mp3`;
  try {
    await writeFile(rawOutput, Buffer.from(await response.arrayBuffer()));
    await normalizeVoice(rawOutput, output);
  } finally {
    await unlink(rawOutput).catch(() => {});
  }
  console.log(`wrote ${line.key} (${VOICE_TARGET_LUFS} LUFS)`);
}

function voiceSettings(role) {
  if (role === 'guide') {
    return {
      stability: 0.48,
      similarity_boost: 0.78,
      style: 0.42,
      use_speaker_boost: true,
    };
  }
  return {
    stability: role === 'violet' ? 0.45 : 0.58,
    similarity_boost: 0.76,
    style: 0.22,
    use_speaker_boost: true,
  };
}

async function normalizeVoice(input, output) {
  await masterAudio(input, output, {
    targetLufs: VOICE_TARGET_LUFS,
    truePeakDbtp: -1,
    loudnessRange: 7,
    preFilters: [
      'highpass=f=65',
      'acompressor=threshold=-20dB:ratio=2.5:attack=15:release=140:makeup=3dB',
    ],
    channels: 1,
    bitrate: '128k',
  });
}

function argumentValue(name) {
  const directIndex = process.argv.indexOf(name);
  if (directIndex >= 0) return process.argv[directIndex + 1] ?? null;
  const prefix = `${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length) ?? null;
}

async function exists(path) {
  try {
    return (await stat(path)).size > 1024;
  } catch {
    return false;
  }
}
