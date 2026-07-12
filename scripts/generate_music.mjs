import { mkdir, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { masterAudio } from './audio_mastering.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const API_KEY = process.env.ELEVENLABS_API_KEY;
const force = process.argv.includes('--force');
const MUSIC_TARGET_LUFS = -22;
if (!API_KEY) throw new Error('ELEVENLABS_API_KEY is not set.');

const cues = [
  ['music/ch1/violetTheme', 60000, 'Original instrumental children’s storybook fantasy theme. Intimate six-note celesta motif, warm harp, soft strings, gentle woodwinds and distant wordless choir. Wonder and candlelight, cozy rather than grand, seamless looping-friendly ending. Entirely original composition; do not quote, imitate, or reference any existing film, game, franchise, or composer melody. No vocals, no lyrics.'],
  ['music/ch1/diagonAlley', 60000, 'Original instrumental whimsical magical market music for a child exploring a bustling wizard shopping street. Pizzicato strings, bassoon, celesta, hand percussion, harp flourishes and warm woodwinds; playful walking tempo, rich but never frantic, seamless looping-friendly ending. Entirely original composition; do not quote, imitate, or reference any existing film, game, franchise, or composer melody. No vocals, no lyrics.'],
  ['music/ch1/chapterTriumph', 25000, 'Original instrumental chapter-complete celebration for a six-year-old hero receiving a train ticket. Celesta motif, warm strings, brass glow, harp and sparkling bells building to a joyful storybook cadence. Entirely original composition; do not quote, imitate, or reference any existing film, game, franchise, or composer melody. No vocals, no lyrics.'],
];

for (const cue of cues) await generate(cue);
console.log(`Music generation complete: ${cues.length} files.`);

async function generate([key, lengthMs, prompt]) {
  const output = resolve(ROOT, 'public/assets/audio', `${key}.mp3`);
  if (!force && await exists(output)) {
    console.log(`skip ${key}`);
    return;
  }
  await mkdir(dirname(output), { recursive: true });
  const response = await fetch('https://api.elevenlabs.io/v1/music', {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'content-type': 'application/json',
      accept: 'audio/mpeg',
    },
    body: JSON.stringify({ prompt, music_length_ms: lengthMs, force_instrumental: true }),
  });
  if (!response.ok) throw new Error(`${key}: ElevenLabs returned ${response.status} ${await response.text()}`);
  const rawOutput = `${output}.raw-${process.pid}.mp3`;
  try {
    await writeFile(rawOutput, Buffer.from(await response.arrayBuffer()));
    await masterAudio(rawOutput, output, {
      targetLufs: MUSIC_TARGET_LUFS,
      truePeakDbtp: -1,
      loudnessRange: 11,
      bitrate: '192k',
    });
  } finally {
    await unlink(rawOutput).catch(() => {});
  }
  console.log(`wrote ${key} (${MUSIC_TARGET_LUFS} LUFS)`);
}

async function exists(path) {
  try {
    return (await stat(path)).size > 1024;
  } catch {
    return false;
  }
}
