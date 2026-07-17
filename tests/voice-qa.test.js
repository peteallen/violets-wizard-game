import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  auditVoiceQa,
  collectExpectedVoiceLines,
  normalizeSpokenText,
  runVoiceQa,
} from '../scripts/check-voice-qa.mjs';

describe('voice transcription QA', () => {
  it('derives the six Hagrid lines directly from authored game content', () => {
    const guideLines = collectExpectedVoiceLines().filter((line) => line.role === 'guide');

    expect(guideLines.map((line) => line.key)).toEqual([
      'voice/ch1/guide/arrival',
      'voice/ch1/guide/leaky',
      'voice/ch1/guide/map',
      'voice/ch1/guide/platform',
      'voice/ch1/guide/ticket',
      'voice/ch1/guide/wall',
    ]);
    expect(guideLines.every((line) => line.text.length > 0)).toBe(true);
  });

  it('collects no spoken lines or voice assets for Violet', () => {
    const lines = collectExpectedVoiceLines();

    expect(lines.filter((line) => line.role === 'violet')).toEqual([]);
    expect(lines.filter((line) => line.key.includes('/violet/'))).toEqual([]);
  });

  it('ignores harmless punctuation and letter-case differences', () => {
    expect(normalizeSpokenText("Here’s Violet & Hagrid!"))
      .toBe(normalizeSpokenText('HERES VIOLET AND HAGRID'));
    expect(normalizeSpokenText('Which colour?'))
      .toBe(normalizeSpokenText('Which color?'));
    expect(normalizeSpokenText('Chokunda Sykes.'))
      .toBe(normalizeSpokenText('Jocunda Sykes'));
    expect(normalizeSpokenText('Ahem, Violet.'))
      .toBe(normalizeSpokenText('Hmm. Violet.'));
    expect(normalizeSpokenText('Open the spell book.'))
      .toBe(normalizeSpokenText('Open the spellbook.'));
  });

  it('keeps isolated learning-pack transcript aliases scoped to their authored line', () => {
    const expected = [{
      key: 'voice/ch3/learning/leviosa/sa',
      role: 'learning',
      text: 'SA',
      acceptableTexts: ['SA', 'Saa', 'So'],
    }];

    expect(auditVoiceQa(expected, [{
      key: 'voice/ch3/learning/leviosa/sa',
      text: 'So',
      file: 'ch3/learning/leviosa/sa.json',
    }]).passed).toBe(true);
    expect(auditVoiceQa(expected, [{
      key: 'voice/ch3/learning/leviosa/sa',
      text: 'No',
      file: 'ch3/learning/leviosa/sa.json',
    }]).passed).toBe(false);
  });

  it('reports missing, mismatched, and unexpected transcripts separately', () => {
    const expected = [
      { key: 'voice/guide/one', role: 'guide', text: 'Hello, Violet.' },
      { key: 'voice/guide/two', role: 'guide', text: 'This way!' },
      { key: 'voice/narrator/one', role: 'narrator', text: 'A letter arrived.' },
    ];
    const records = [
      { key: 'voice/guide/one', text: 'Hello Violet', file: 'guide/one.json' },
      { key: 'voice/guide/two', text: 'That way', file: 'guide/two.json' },
      { key: 'voice/extra', text: 'Unexpected', file: 'extra.json' },
    ];

    const result = auditVoiceQa(expected, records);

    expect(result.passed).toBe(false);
    expect(result.roles.guide).toMatchObject({ expected: 2, present: 2, matched: 1, mismatched: 1 });
    expect(result.roles.narrator).toMatchObject({ expected: 1, present: 0, missing: 1 });
    expect(result.mismatched[0].key).toBe('voice/guide/two');
    expect(result.missing[0].key).toBe('voice/narrator/one');
    expect(result.unexpected[0].key).toBe('voice/extra');
  });

  it('keeps complete Hagrid coverage while reporting the current transcription coverage', async () => {
    const result = await runVoiceQa();

    expect(result.issues).toEqual([]);
    expect(result.totals).toMatchObject({ expected: 117, present: 117, matched: 117, missing: 0, mismatched: 0 });
    expect(result.roles.guide).toMatchObject({ expected: 6, present: 6, matched: 6, missing: 0 });
    expect(result.roles.learning).toMatchObject({ expected: 13, present: 13, matched: 13, missing: 0 });
    expect(result.passed).toBe(true);
  });

  it('rejects an audio file whose size or SHA-256 no longer matches its transcript binding', async () => {
    const root = await mkdtemp(join(tmpdir(), 'violet-voice-qa-'));
    const qaDirectory = join(root, 'qa');
    const audioDirectory = join(root, 'audio');
    const transcriptFile = join(qaDirectory, 'guide', 'one.json');
    const audioFile = join(audioDirectory, 'voice', 'guide', 'one.mp3');
    const manifestFile = join(qaDirectory, 'manifest.json');
    const originalAudio = Buffer.from('abcd');
    const expectedLines = [{ key: 'voice/guide/one', role: 'guide', text: 'Hello, Violet.' }];

    try {
      await mkdir(join(qaDirectory, 'guide'), { recursive: true });
      await mkdir(join(audioDirectory, 'voice', 'guide'), { recursive: true });
      await writeFile(transcriptFile, JSON.stringify({ text: 'Hello Violet' }));
      await writeFile(audioFile, originalAudio);
      await writeFile(manifestFile, JSON.stringify({
        version: 2,
        transcripts: {
          'voice/guide/one': {
            transcript: 'guide/one.json',
            audio: 'voice/guide/one.mp3',
            bytes: originalAudio.byteLength,
            sha256: sha256(originalAudio),
          },
        },
      }));

      const options = { expectedLines, qaDirectory, audioDirectory, manifestFile };
      expect((await runVoiceQa(options)).passed).toBe(true);

      await writeFile(audioFile, Buffer.from('abcde'));
      const changedSize = await runVoiceQa(options);
      expect(changedSize.passed).toBe(false);
      expect(changedSize.issues).toContainEqual(expect.objectContaining({ type: 'stale-audio', key: 'voice/guide/one' }));
      expect(changedSize.issues[0].message).toContain('found 5 bytes');

      const changedContent = Buffer.from('wxyz');
      await writeFile(audioFile, changedContent);
      const changedHash = await runVoiceQa(options);
      expect(changedHash.passed).toBe(false);
      expect(changedHash.issues).toContainEqual(expect.objectContaining({ type: 'stale-audio', key: 'voice/guide/one' }));
      expect(changedHash.issues[0].message).toContain(`found 4 bytes and sha256 ${sha256(changedContent)}`);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}
