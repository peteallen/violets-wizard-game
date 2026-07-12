import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cards } from '../src/game/content/cards.js';
import { chapter1, chapter1ResumeRecaps } from '../src/game/content/chapters/ch1.js';
import { chapter2 } from '../src/game/content/chapters/ch2.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const API_KEY = process.env.ELEVENLABS_API_KEY;
const force = process.argv.includes('--force');
if (!API_KEY) throw new Error('ELEVENLABS_API_KEY is not set.');

const VOICES = Object.freeze({
  narrator: 'BNgbHR0DNeZixGQVzloa',
  guide: 'NFG5qt843uXKj4pFvR7C',
  wandmaker: 'j9jfwdrw7BRfcR43Qohk',
  tailor: 'pFZP5JQG7iQjIQuC4Bku',
  keeper: 'Xb7hH8MSUJpSbSDYk0k2',
  violet: 'pFZP5JQG7iQjIQuC4Bku',
});

const lines = collectLines();
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
      voice_settings: {
        stability: line.role === 'violet' ? 0.45 : 0.58,
        similarity_boost: 0.76,
        style: line.role === 'guide' ? 0.34 : 0.22,
        use_speaker_boost: true,
      },
    }),
  });
  if (!response.ok) throw new Error(`${line.key}: ElevenLabs returned ${response.status} ${await response.text()}`);
  await writeFile(output, Buffer.from(await response.arrayBuffer()));
  console.log(`wrote ${line.key}`);
}

async function exists(path) {
  try {
    return (await stat(path)).size > 1024;
  } catch {
    return false;
  }
}
