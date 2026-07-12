import { describe, expect, it } from 'vitest';
import { parseLoudnormMeasurements } from '../scripts/audio_mastering.mjs';
import { classifyAudioPath, validateAudioMeasurement } from '../scripts/check-audio-loudness.mjs';

describe('audio mastering checks', () => {
  it('parses the final ffmpeg loudnorm measurement object', () => {
    const result = parseLoudnormMeasurements(`noise\n{
      "input_i": "-16.02",
      "input_tp": "-1.42",
      "input_lra": "1.00",
      "input_thresh": "-26.10",
      "target_offset": "0.02"
    }\n`);
    expect(result.input_i).toBe('-16.02');
    expect(result.input_tp).toBe('-1.42');
  });

  it('uses the strict dialogue rule for Hagrid and category rules for other assets', () => {
    expect(classifyAudioPath('/audio/voice/ch1/guide/arrival.mp3')).toBe('guide');
    expect(classifyAudioPath('/audio/voice/ch1/narrator/letter.mp3')).toBe('voice');
    expect(classifyAudioPath('/audio/music/ch1/theme.mp3')).toBe('music');
    expect(classifyAudioPath('/audio/sfx/ch1/tap.mp3')).toBe('sfx');

    expect(validateAudioMeasurement('audio/voice/ch1/guide/arrival.mp3', { input_i: '-16.1', input_tp: '-1.2' })).toEqual([]);
    expect(validateAudioMeasurement('audio/music/ch1/theme.mp3', { input_i: '-13.0', input_tp: '-1.2' })).toEqual([
      expect.stringContaining('must remain between -22.75 and -21.25 LUFS'),
    ]);
    expect(validateAudioMeasurement('audio/sfx/ch1/tap.mp3', { input_i: '-18.0', input_tp: '0.1' })).toEqual([
      expect.stringContaining('at or below -0.95 dBTP'),
    ]);
  });
});
