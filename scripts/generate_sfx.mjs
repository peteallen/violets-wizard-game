import { mkdir, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { analyzeAudio, masterAudio } from './audio_mastering.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SFX_TARGET_LUFS = -18;

export const soundEffects = Object.freeze([
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
  ['sfx/ch2/barrier-whoosh', 'A child-sized rush through a magical railway barrier: one quick airy whoosh, soft cloth flutter, and a tiny warm sparkle at the exit. Friendly storybook foley, clean and close, no impact, no voices, no music', 1.6],
  ['sfx/ch2/sweet-reaction', 'A whimsical magical sweet pops open with a fizzy sparkle, one playful comic boing, and a delighted bright chime. Child-safe, clean isolated effect, no voices, no music', 1.7],
  ['sfx/ch2/gryffindor-cheer', 'A warm small group of schoolchildren cheering and applauding in a huge candlelit hall, joyful and welcoming, no intelligible words, no chanting, no music', 2.8],
  ['sfx/ch2/chapter-turn', 'A thick illustrated storybook page turns, settles with a soft parchment thump, then a brief warm golden bell shimmer. Cozy and triumphant, no voices, no music', 2.2],
  ['sfx/ch3/rune-note-l', 'One clean magical celesta note, C5, warm round storybook tone, very short and immediate, isolated note with no melody, no voices, no ambience', 0.5],
  ['sfx/ch3/rune-note-u', 'One clean magical celesta note, D5, warm round storybook tone, very short and immediate, isolated note with no melody, no voices, no ambience', 0.5],
  ['sfx/ch3/rune-note-m', 'One clean magical celesta note, E5, warm round storybook tone, very short and immediate, isolated note with no melody, no voices, no ambience', 0.5],
  ['sfx/ch3/rune-note-o', 'One clean magical celesta note, G5, warm round storybook tone, very short and immediate, isolated note with no melody, no voices, no ambience', 0.5],
  ['sfx/ch3/rune-note-s', 'One clean magical celesta note, A5, warm round storybook tone with a tiny resolving sparkle, very short and immediate, isolated note with no melody, no voices, no ambience', 0.65],
  ['sfx/ch3/comic-fizzle-1', 'A tiny friendly magic spell fizzle: soft puff, one hiccuping bubble, and a miniature wooden pop. Funny and gentle for a six-year-old, very short, no buzzer, no failure sting, no voices, no music', 0.8],
  ['sfx/ch3/comic-fizzle-2', 'A tiny friendly magic spell fizzle: brief squeaky cork wobble, soft glittery sputter, and a harmless poof. Funny and gentle for a six-year-old, very short, no buzzer, no failure sting, no voices, no music', 0.8],
  ['sfx/ch3/comic-fizzle-3', 'A tiny friendly magic spell fizzle: one rubbery chirrup, a soft puff of air, and two descending fairy plinks. Funny and gentle for a six-year-old, very short, no buzzer, no failure sting, no voices, no music', 0.9],
  ['sfx/ch3/lumos-bloom', 'Warm white wand light blooming open: a soft breath of wordless choir, delicate glass shimmer, and one rounded golden bell. Magical, cozy, radiant, never sharp or explosive, no melody, no intelligible voice, no music bed', 2.8],
  ['sfx/ch3/leviosa-harp', 'A graceful upward harp glissando lifting a feather, followed by a light golden ribbon shimmer and one delighted celesta twinkle. Airy, playful, child-safe, no impact, no voices, no music bed', 2.6],
  ['sfx/ch3/trevor-croak-distant', 'One distant small toad croak echoing softly in a cozy stone school corridor at night. Curious and friendly, not eerie, isolated creature sound, no voices, no music', 1.2],
  ['sfx/ch3/trevor-croak-near', 'Two nearby small toad croaks from a hidden alcove, slightly wet and comically impatient. Friendly storybook creature sound, clean and gentle, no voices, no music', 1.4],
  ['sfx/ch3/trevor-croak-found', 'One indignant but adorable little toad croak at close range, followed by a tiny contented throat burble. Comic and friendly, clean isolated creature sound, no voices, no music', 1.2],
  ['sfx/ch3/classroom-ambience', 'A quiet seamless classroom ambience in a cozy old stone magic school: soft page turns, feather-light quill scratches, subtle wooden chair movement, and distant warm room murmur with no intelligible words. Calm, bright, child-safe, no melody, no spell effects', 8],
  ['sfx/ch4/flying-preview', 'A short exciting storybook flying preview: a gentle broom rush sweeps upward through open air, passes one sparkling star ring with a bright chime, then lands on a warm anticipatory shimmer. Soaring and playful, never fast or dangerous, no voices, no music bed', 3.5],
]);

export function selectSoundEffects({ chapter = null, key = null } = {}) {
  return soundEffects.filter(([assetKey]) => (
    (!chapter || assetKey.startsWith(`sfx/ch${chapter}/`))
    && (!key || assetKey === key)
  ));
}

async function generate([key, text, duration], { apiKey, force }) {
  const output = resolve(ROOT, 'public/assets/audio', `${key}.mp3`);
  if (!force && await exists(output)) {
    console.log(`skip ${key}`);
    return;
  }
  await mkdir(dirname(output), { recursive: true });
  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
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

function argumentValue(name, args = process.argv) {
  const directIndex = args.indexOf(name);
  if (directIndex >= 0) return args[directIndex + 1] ?? null;
  const prefix = `${name}=`;
  return args.find((argument) => argument.startsWith(prefix))?.slice(prefix.length) ?? null;
}

export function parseChapterFilter(value) {
  if (value == null) return null;
  const match = String(value).match(/^(?:ch)?([1-4])$/u);
  if (!match) throw new Error('--chapter must be a number from 1 through 4, optionally prefixed with ch.');
  return Number(match[1]);
}

async function main(args = process.argv) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is not set.');
  const force = args.includes('--force');
  const chapter = parseChapterFilter(argumentValue('--chapter', args));
  const key = argumentValue('--key', args);
  const effects = selectSoundEffects({ chapter, key });
  if (key && effects.length === 0) throw new Error(`Unknown sound-effect key ${key}.`);
  for (const effect of effects) await generate(effect, { apiKey, force });
  console.log(`Sound-effect generation complete: ${effects.length} files.`);
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isCli) await main();
