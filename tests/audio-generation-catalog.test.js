import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  parseChapterFilter as parseMusicChapterFilter,
  selectMusicCues,
} from '../scripts/generate_music.mjs';
import {
  parseChapterFilter as parseSfxChapterFilter,
  selectSoundEffects,
} from '../scripts/generate_sfx.mjs';
import { chapter3VoiceManifest, chapterVoiceLines } from '../scripts/chapter3_voice_manifest.mjs';
import { chapter3AssetDefinitions } from '../src/game/chapters/ch3/content-v2/assets.js';
import { chapter3DialogueDefinitions } from '../src/game/chapters/ch3/content-v2/dialogues.js';
import { chapter3LearningBeatDefinitions } from '../src/game/chapters/ch3/content-v2/learning.js';
import { chapter3QuestDefinitions } from '../src/game/chapters/ch3/content-v2/quests.js';
import { chapter3RecapDefinitions } from '../src/game/chapters/ch3/content-v2/recaps.js';
import { chapter4 } from '../src/game/chapters/ch4/content.js';

const CHAPTER_THREE_SFX = [
  'sfx/ch3/classroom-ambience',
  'sfx/ch3/comic-fizzle-1',
  'sfx/ch3/comic-fizzle-2',
  'sfx/ch3/comic-fizzle-3',
  'sfx/ch3/leviosa-harp',
  'sfx/ch3/lumos-bloom',
  'sfx/ch3/rune-note-l',
  'sfx/ch3/rune-note-m',
  'sfx/ch3/rune-note-o',
  'sfx/ch3/rune-note-s',
  'sfx/ch3/rune-note-u',
  'sfx/ch3/trevor-croak-distant',
  'sfx/ch3/trevor-croak-found',
  'sfx/ch3/trevor-croak-near',
];
const pronunciationQa = JSON.parse(readFileSync(
  new URL('../audio/qa/ch3/learning/pronunciation-manifest.json', import.meta.url),
  'utf8',
));

describe('audio generation catalog', () => {
  it('selects the complete Chapter Three sound palette without leaking Chapter Four', () => {
    const keys = selectSoundEffects({ chapter: 3 })
      .map(([key]) => key)
      .sort();

    expect(keys).toEqual(CHAPTER_THREE_SFX);
    expect(selectSoundEffects({ chapter: 4 }).map(([key]) => key))
      .toEqual(['sfx/ch4/flying-preview']);
  });

  it('selects exactly the two original Chapter Three music beds', () => {
    const cues = selectMusicCues({ chapter: 3 });

    expect(cues.map(([key]) => key)).toEqual([
      'music/ch3/classroom-brightness',
      'music/ch3/night-corridors',
    ]);
    for (const [, lengthMs, prompt] of cues) {
      expect(lengthMs).toBe(60_000);
      expect(prompt).toContain('Entirely original composition');
      expect(prompt).toContain('No vocals, no lyrics.');
    }
  });

  it('supports targeted rebuilds and Chapter Three or Four filters', () => {
    expect(parseSfxChapterFilter('ch3')).toBe(3);
    expect(parseSfxChapterFilter('4')).toBe(4);
    expect(parseMusicChapterFilter('3')).toBe(3);
    expect(selectSoundEffects({ key: 'sfx/ch3/lumos-bloom' })).toHaveLength(1);
    expect(selectMusicCues({ key: 'music/ch3/night-corridors' })).toHaveLength(1);
    expect(() => parseMusicChapterFilter('5')).toThrow(/1 through 4/u);
  });

  it('freezes the complete Chapter Three voice and learning packs plus one Chapter Four preview', () => {
    expect(chapter3VoiceManifest).toHaveLength(48);
    expect(chapterVoiceLines(3)).toHaveLength(47);
    expect(chapterVoiceLines(4).map(({ key }) => key))
      .toEqual(['voice/ch4/narrator/preview']);
    expect(new Set(chapter3VoiceManifest.map(({ key }) => key))).toHaveProperty('size', 48);

    const lumos = chapter3VoiceManifest
      .filter(({ key }) => key.startsWith('voice/ch3/learning/lumos/'));
    const leviosa = chapter3VoiceManifest
      .filter(({ key }) => key.startsWith('voice/ch3/learning/leviosa/'));
    expect(lumos.map(({ text }) => text).sort()).toEqual(['A', 'E', 'L', 'M', 'O', 'S', 'U']);
    expect(leviosa.map(({ text }) => text)).toEqual(['WIN', 'GAR', 'DIUM', 'LEVI', 'O', 'SA']);
    expect([...lumos, ...leviosa].every(({ generationText }) => generationText.length > 0)).toBe(true);
  });

  it('keeps the frozen audio catalog aligned with Chapter Three authored content and assets', () => {
    const byKey = new Map(chapterVoiceLines(3).map((entry) => [entry.key, entry]));
    const authored = [];
    for (const dialogue of chapter3DialogueDefinitions) {
      for (const node of Object.values(dialogue.nodes)) {
        if (node.type === 'line') authored.push({ key: node.voice, text: node.text });
      }
    }
    for (const quest of chapter3QuestDefinitions) {
      for (const step of Object.values(quest.steps)) {
        authored.push({ key: step.objective.voice, text: step.objective.text });
      }
    }
    authored.push(...chapter3RecapDefinitions.map(({ voice: key, text }) => ({ key, text })));
    for (const beat of chapter3LearningBeatDefinitions) {
      for (const unit of [...beat.content.units, ...beat.content.distractors]) {
        authored.push({ key: unit.voice, text: unit.glyph });
      }
    }

    for (const { key, text } of authored) {
      expect(byKey.get(key), key).toMatchObject({ text });
    }

    const assetsByKind = Object.groupBy(chapter3AssetDefinitions, ({ kind }) => kind);
    expect(assetsByKind.voice.map(({ key }) => key).sort())
      .toEqual(chapterVoiceLines(3).map(({ key }) => key).sort());
    expect(assetsByKind.sfx.map(({ key }) => key).sort()).toEqual(CHAPTER_THREE_SFX);
    expect(assetsByKind.music.map(({ key }) => key))
      .toEqual(selectMusicCues({ chapter: 3 }).map(([key]) => key));
  });

  it('binds learning-pack provider spellings and narrow aliases into QA metadata', () => {
    const learning = chapterVoiceLines(3)
      .filter(({ role }) => role === 'learning')
      .map(({ key, text: authoredText, generationText, transcriptionAliases }) => [key, {
        authoredText,
        generationText,
        transcriptionAliases,
      }]);

    expect(pronunciationQa).toEqual({
      version: 1,
      clips: Object.fromEntries(learning),
    });
  });

  it('keeps the minimal Chapter Four preview audio owned by its placeholder package', () => {
    const audioKeys = Object.values(chapter4.assets)
      .filter(({ kind }) => ['voice', 'sfx', 'music'].includes(kind))
      .map(({ key }) => key)
      .sort();

    expect(audioKeys).toEqual([
      'sfx/ch4/flying-preview',
      'voice/ch4/narrator/preview',
    ]);
  });
});
