import { mkdir, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeAudio, masterAudio } from './audio_mastering.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const API_KEY = process.env.ELEVENLABS_API_KEY;
const force = process.argv.includes('--force');
const SFX_TARGET_LUFS = -18;
if (!API_KEY) throw new Error('ELEVENLABS_API_KEY is not set.');

const effects = [
  ['sfx/ch1/owlTap', 'Two gentle owl beak taps on a glass window, whimsical storybook sound, clean and close, no music', 1.2],
  ['sfx/ch1/owlFlap', 'Soft owl wings fluttering away, light feathers, magical friendly storybook sound, no hoot, no music', 1.8],
  ['sfx/ch1/paperSlide', 'A parchment envelope slides and unfolds with crisp soft paper rustles, magical storybook foley, no music', 1.7],
  ['sfx/ch1/sealCrack', 'Tiny wax seal cracks open followed by a short golden sparkle chime, delightful and gentle, no music', 1.2],
  ['sfx/ch1/wallRumble', 'Old brick wall gives a deep gentle magical rumble, safe for children, stone movement without destruction, no music', 2.5],
  ['sfx/ch1/brickClack', 'Several old bricks click and clack into motion in a rhythmic magical cascade, clean foley, no music', 1.8],
  ['sfx/ch1/wandPaperWhirl', 'Comic gust of loose papers whirling around a magic shop, playful fizzle at the end, no voices, no music', 2.2],
  ['sfx/ch1/vaseShatter', 'Small ceramic vase breaks in a gentle cartoon comedy style, light shards and comic plink, not harsh, no music', 1.5],
  ['sfx/ch1/wandChosen', 'Warm golden magic blooms from a wand with harp glissando, soft choir shimmer and one triumphant bell, no melody', 3],
  ['sfx/ch1/coin', 'Small brass coin reward cascade with a bright magical chime, playful and brief, no music', 1],
  ['sfx/ch1/ticket', 'Thick paper train ticket presented with a brass click and small magical flourish, no music', 1.2],
  ['sfx/ch1/chapterTurn', 'Large illustrated storybook page turns followed by a warm triumphant chime, no voices', 2],
  ['sfx/ch1/petCat', 'One friendly small cat meow, warm and curious, clean isolated sound', 1],
  ['sfx/ch1/petOwl', 'One friendly small owl hoot, gentle and curious, clean isolated sound', 1.2],
  ['sfx/ch1/petToad', 'One funny friendly toad croak, soft and child-safe, clean isolated sound', 1],
  ['sfx/ch2/trainWhistle', 'Distant cheerful vintage steam train whistle at a magical station, warm and inviting, no music', 2.5],
];

for (const effect of effects) await generate(effect);
console.log(`Sound-effect generation complete: ${effects.length} files.`);

async function generate([key, text, duration]) {
  const output = resolve(ROOT, 'public/assets/audio', `${key}.mp3`);
  if (!force && await exists(output)) {
    console.log(`skip ${key}`);
    return;
  }
  await mkdir(dirname(output), { recursive: true });
  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'content-type': 'application/json',
      accept: 'audio/mpeg',
    },
    body: JSON.stringify({ text, duration_seconds: duration, prompt_influence: 0.45 }),
  });
  if (!response.ok) throw new Error(`${key}: ElevenLabs returned ${response.status} ${await response.text()}`);
  const rawOutput = `${output}.raw-${process.pid}.mp3`;
  try {
    await writeFile(rawOutput, Buffer.from(await response.arrayBuffer()));
    const rawMeasurements = await analyzeAudio(rawOutput, { targetLufs: SFX_TARGET_LUFS, truePeakDbtp: -2.5 });
    const crestFactor = Number(rawMeasurements.input_tp) - Number(rawMeasurements.input_i);
    const preFilters = Number(rawMeasurements.input_i) < -20 || crestFactor > 14
      ? ['acompressor=threshold=-40dB:ratio=10:attack=1:release=220:makeup=0dB']
      : [];
    await masterAudio(rawOutput, output, {
      targetLufs: SFX_TARGET_LUFS,
      truePeakDbtp: -2.5,
      loudnessRange: 7,
      preFilters,
      bitrate: '128k',
    });
  } finally {
    await unlink(rawOutput).catch(() => {});
  }
  console.log(`wrote ${key} (${SFX_TARGET_LUFS} LUFS)`);
}

async function exists(path) {
  try {
    return (await stat(path)).size > 1024;
  } catch {
    return false;
  }
}
