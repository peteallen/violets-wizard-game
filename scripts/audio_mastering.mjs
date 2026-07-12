import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

export async function masterAudio(input, output, {
  targetLufs,
  truePeakDbtp = -1,
  loudnessRange = 7,
  preFilters = [],
  sampleRate = 44100,
  channels = null,
  bitrate = '128k',
} = {}) {
  if (!Number.isFinite(targetLufs)) throw new TypeError('targetLufs must be a finite number.');
  const options = {
    truePeakDbtp, loudnessRange, preFilters, sampleRate, channels, bitrate,
  };
  await renderMaster(input, output, { ...options, targetLufs });
  const measured = await analyzeAudio(output, { targetLufs, truePeakDbtp, loudnessRange });
  const correction = targetLufs - Number(measured.input_i);
  if (Math.abs(correction) > 0.35 && Math.abs(correction) <= 12) {
    await renderMaster(input, output, { ...options, targetLufs: targetLufs + correction });
  }
  return analyzeAudio(output, { targetLufs, truePeakDbtp, loudnessRange });
}

export async function analyzeAudio(input, {
  targetLufs = -16,
  truePeakDbtp = -1,
  loudnessRange = 7,
} = {}) {
  const target = loudnormTarget({ targetLufs, truePeakDbtp, loudnessRange });
  const analysis = await run('ffmpeg', [
    '-hide_banner', '-nostats', '-i', input,
    '-af', `${target}:print_format=json`,
    '-f', 'null', '-',
  ], { maxBuffer: 4 * 1024 * 1024 });
  return parseLoudnormMeasurements(analysis.stderr);
}

async function renderMaster(input, output, {
  targetLufs,
  truePeakDbtp,
  loudnessRange,
  preFilters,
  sampleRate,
  channels,
  bitrate,
}) {
  const target = loudnormTarget({ targetLufs, truePeakDbtp, loudnessRange });
  const analysisFilter = [...preFilters, `${target}:print_format=json`].join(',');
  const analysis = await run('ffmpeg', [
    '-hide_banner', '-nostats', '-i', input,
    '-af', analysisFilter,
    '-f', 'null', '-',
  ], { maxBuffer: 4 * 1024 * 1024 });
  const measured = parseLoudnormMeasurements(analysis.stderr);
  const measuredFilter = [
    target,
    `measured_I=${measured.input_i}`,
    `measured_TP=${measured.input_tp}`,
    `measured_LRA=${measured.input_lra}`,
    `measured_thresh=${measured.input_thresh}`,
    `offset=${measured.target_offset}`,
    'linear=true',
    'print_format=summary',
  ].join(':');
  const outputArgs = [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-i', input,
    '-af', [...preFilters, measuredFilter].join(','),
    '-ar', String(sampleRate),
  ];
  if (channels) outputArgs.push('-ac', String(channels));
  outputArgs.push('-codec:a', 'libmp3lame', '-b:a', bitrate, output);
  await run('ffmpeg', outputArgs, { maxBuffer: 4 * 1024 * 1024 });
}

export function parseLoudnormMeasurements(output) {
  const matches = String(output).match(/\{[\s\S]*?\}/gu);
  if (!matches?.length) throw new Error('ffmpeg loudnorm did not return measurement JSON.');
  const value = JSON.parse(matches.at(-1));
  for (const key of ['input_i', 'input_tp', 'input_lra', 'input_thresh', 'target_offset']) {
    if (!Number.isFinite(Number(value[key]))) throw new Error(`ffmpeg loudnorm returned invalid ${key}.`);
  }
  return value;
}

function loudnormTarget({ targetLufs, truePeakDbtp, loudnessRange }) {
  return `loudnorm=I=${targetLufs}:TP=${truePeakDbtp}:LRA=${loudnessRange}`;
}
