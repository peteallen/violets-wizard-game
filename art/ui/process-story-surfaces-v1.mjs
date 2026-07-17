import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const codexHome = process.env.CODEX_HOME ?? path.join(process.env.HOME, '.codex');
const removeChroma = path.join(
  codexHome,
  'skills/.system/imagegen/scripts/remove_chroma_key.py',
);
const temporaryDirectory = path.join(root, 'tmp/imagegen/story-surfaces-v1');
const uniformResizeAndCrop = `
import sys
from PIL import Image

(
    source,
    output,
    resize_width,
    resize_height,
    crop_x,
    crop_y,
    crop_width,
    crop_height,
    output_width,
    output_height,
    offset_x,
    offset_y,
) = sys.argv[1:]
image = Image.open(source).convert('RGBa')
image = image.resize((int(resize_width), int(resize_height)), Image.Resampling.LANCZOS)
left = int(crop_x)
top = int(crop_y)
image = image.crop((left, top, left + int(crop_width), top + int(crop_height)))
canvas = Image.new('RGBa', (int(output_width), int(output_height)), (0, 0, 0, 0))
canvas.paste(image, (int(offset_x), int(offset_y)))
canvas.convert('RGBA').save(output)
`;

const assets = [
  {
    id: 'choice-tag-v2',
    input: 'art/ui/story-surfaces/source/choice-tag-v2-chroma.png',
    output: 'public/assets/art/ui/story-surfaces/choice-tag-v2.webp',
    width: 640,
    height: 586,
    edgeContract: 1,
    uniformResize: {
      width: 636,
      height: 636,
      cropX: 0,
      cropY: 43,
      cropWidth: 636,
      cropHeight: 586,
      offsetX: 2,
      offsetY: 0,
    },
  },
  {
    id: 'action-note-v2',
    input: 'art/ui/story-surfaces/source/action-note-v2-chroma.png',
    output: 'public/assets/art/ui/story-surfaces/action-note-v2.webp',
    width: 1200,
    height: 400,
  },
  {
    id: 'robe-folio-v2',
    input: 'art/ui/story-surfaces/source/robe-folio-v2-chroma.png',
    output: 'public/assets/art/ui/story-surfaces/robe-folio-v2.webp',
    width: 2560,
    height: 1440,
  },
  {
    id: 'chapter-one-plaque-v2',
    input: 'art/ui/story-surfaces/source/chapter-one-plaque-v2-chroma.png',
    output: 'public/assets/art/ui/story-surfaces/chapter-one-plaque-v2.webp',
    width: 1600,
    height: 680,
  },
];

mkdirSync(temporaryDirectory, { recursive: true });

for (const asset of assets) {
  const input = path.join(root, asset.input);
  const keyedPng = path.join(temporaryDirectory, `${asset.id}-alpha.png`);
  const output = path.join(root, asset.output);
  mkdirSync(path.dirname(output), { recursive: true });
  execFileSync('python3', [
    removeChroma,
    '--input', input,
    '--out', keyedPng,
    '--auto-key', 'border',
    '--soft-matte',
    '--transparent-threshold', '12',
    '--opaque-threshold', '220',
    '--despill',
    ...(asset.edgeContract ? ['--edge-contract', String(asset.edgeContract)] : []),
    '--force',
  ], { stdio: 'inherit' });
  let encodingInput = keyedPng;
  if (asset.uniformResize) {
    encodingInput = path.join(temporaryDirectory, `${asset.id}-shipping.png`);
    execFileSync('python3', [
      '-c', uniformResizeAndCrop,
      keyedPng,
      encodingInput,
      String(asset.uniformResize.width),
      String(asset.uniformResize.height),
      String(asset.uniformResize.cropX),
      String(asset.uniformResize.cropY),
      String(asset.uniformResize.cropWidth),
      String(asset.uniformResize.cropHeight),
      String(asset.width),
      String(asset.height),
      String(asset.uniformResize.offsetX),
      String(asset.uniformResize.offsetY),
    ], { stdio: 'inherit' });
  }
  const resizeArguments = asset.uniformResize
    ? []
    : ['-resize', String(asset.width), String(asset.height)];
  execFileSync('cwebp', [
    '-quiet',
    '-q', '90',
    '-alpha_q', '100',
    ...resizeArguments,
    encodingInput,
    '-o', output,
  ], { stdio: 'inherit' });
}
