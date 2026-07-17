import { mkdir, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { masterAudio } from './audio_mastering.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const API_KEY = process.env.ELEVENLABS_API_KEY;
const force = process.argv.includes('--force');
const chapterFilter = parseChapterFilter(argumentValue('--chapter'));
const MUSIC_TARGET_LUFS = -22;
if (!API_KEY) throw new Error('ELEVENLABS_API_KEY is not set.');

const cues = [
  ['music/ch1/violetTheme', 60000, 'Original instrumental children’s storybook fantasy theme. Intimate six-note celesta motif, warm harp, soft strings, gentle woodwinds and distant wordless choir. Wonder and candlelight, cozy rather than grand, seamless looping-friendly ending. Entirely original composition; do not quote, imitate, or reference any existing film, game, franchise, or composer melody. No vocals, no lyrics.'],
  ['music/ch1/diagonAlley', 60000, 'Original instrumental whimsical magical market music for a child exploring a bustling wizard shopping street. Pizzicato strings, bassoon, celesta, hand percussion, harp flourishes and warm woodwinds; playful walking tempo, rich but never frantic, seamless looping-friendly ending. Entirely original composition; do not quote, imitate, or reference any existing film, game, franchise, or composer melody. No vocals, no lyrics.'],
  ['music/ch1/chapterTriumph', 25000, 'Original instrumental chapter-complete celebration for a six-year-old hero receiving a train ticket. Celesta motif, warm strings, brass glow, harp and sparkling bells building to a joyful storybook cadence. Entirely original composition; do not quote, imitate, or reference any existing film, game, franchise, or composer melody. No vocals, no lyrics.'],
  ['music/ch2/platform', 60000, 'Original instrumental children’s storybook journey music for a hidden railway platform and a bright red steam train. Rolling brushed percussion, pizzicato strings, warm clarinet, bassoon, harp, and small celesta glints; eager forward motion, welcoming rather than frantic, with a looping-friendly soft landing. Entirely original composition: do not quote, imitate, evoke, or reference any existing film, game, fantasy franchise, composer, score, or melody. No vocals, no lyrics.'],
  ['music/ch2/lake-wonder', 30000, 'Original instrumental wonder swell for a young child seeing a vast candlelit castle across a dark lake for the first time. Begin with quiet harp and low warm strings, then bloom into one breathtaking major chord with soaring strings, French horn glow, celesta stars, and distant wordless choir; awe without bombast, ending gently. Entirely original composition: do not quote, imitate, evoke, or reference any existing film, game, fantasy franchise, composer, score, or melody. No vocals, no lyrics.'],
  ['music/ch2/sorting', 60000, 'Original instrumental children’s storybook ceremony music for a kind ancient talking hat deciding where a brave new student belongs. Hushed bassoon, plucked strings, muted hand drum, harp harmonics, and curious celesta questions gradually resolve into a warm crimson-and-gold brass glow; suspenseful but never frightening, looping-friendly. Entirely original composition: do not quote, imitate, evoke, or reference any existing film, game, fantasy franchise, composer, score, or melody. No vocals, no lyrics.'],
  ['music/ch2/common-room', 60000, 'Original instrumental cozy evening music for a round tower common room beside a crackling hearth after a child’s first big school adventure. Soft harp, warm viola and cello, gentle woodwinds, quiet celesta, and a small contented six-note figure; safe, sleepy, and welcoming, seamless looping-friendly ending. Entirely original composition: do not quote, imitate, evoke, or reference any existing film, game, fantasy franchise, composer, score, or melody. No vocals, no lyrics.'],
].filter(([key]) => !chapterFilter || key.startsWith(`music/ch${chapterFilter}/`));

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

function argumentValue(name) {
  const directIndex = process.argv.indexOf(name);
  if (directIndex >= 0) return process.argv[directIndex + 1] ?? null;
  const prefix = `${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function parseChapterFilter(value) {
  if (value == null) return null;
  const match = String(value).match(/^(?:ch)?([12])$/u);
  if (!match) throw new Error('--chapter must be 1, ch1, 2, or ch2.');
  return Number(match[1]);
}
