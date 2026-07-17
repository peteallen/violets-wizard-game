import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const codexHome = process.env.CODEX_HOME ?? path.join(process.env.HOME, '.codex');
const removeChroma = path.join(
  codexHome,
  'skills/.system/imagegen/scripts/remove_chroma_key.py',
);
const temporaryDirectory = path.join(root, 'tmp/imagegen/ch3-field-kit-v1');

const keyedAssets = [
  {
    id: 'card-shell',
    input: 'art/ui/ch3/source/card-shell-chroma.png',
    output: 'public/assets/art/ui/ch3/card-shell.webp',
    width: 720,
    height: 1000,
  },
  {
    id: 'card-shell-selected',
    input: 'art/ui/ch3/source/card-shell-selected-chroma.png',
    output: 'public/assets/art/ui/ch3/card-shell-selected.webp',
    width: 720,
    height: 1000,
  },
  {
    id: 'incantation-ribbon',
    input: 'art/ui/ch3/source/incantation-ribbon-chroma.png',
    output: 'public/assets/art/ui/ch3/incantation-ribbon.webp',
    width: 1200,
    height: 400,
  },
  {
    id: 'rune-tile',
    input: 'art/ui/ch3/source/rune-tile-chroma.png',
    output: 'public/assets/art/ui/ch3/rune-tile.webp',
    width: 640,
    height: 640,
  },
  {
    id: 'chant-tile',
    input: 'art/ui/ch3/source/chant-tile-chroma.png',
    output: 'public/assets/art/ui/ch3/chant-tile.webp',
    width: 768,
    height: 512,
  },
];

const spread = {
  id: 'spellbook-spread',
  input: 'art/ui/ch3/source/spellbook-spread.png',
  output: 'public/assets/art/ui/ch3/spellbook-spread.webp',
  cropWidth: 1643,
  cropHeight: 924,
  width: 2560,
  height: 1440,
};

const validateOutputs = String.raw`
import json
import os
import sys
from PIL import Image

specs = json.loads(sys.argv[1])
results = {}

for spec in specs:
    with Image.open(spec['path']) as image:
        expected = (spec['width'], spec['height'])
        if image.size != expected:
            raise SystemExit(
                f"{spec['id']} dimensions are {image.size}, expected {expected}"
            )

        rgba = image.convert('RGBA')
        alpha = rgba.getchannel('A')
        histogram = alpha.histogram()
        transparent = histogram[0]
        partial = sum(histogram[1:255])
        opaque = histogram[255]
        alpha_extrema = alpha.getextrema()
        byte_size = os.path.getsize(spec['path'])
        if byte_size <= 1024:
            raise SystemExit(f"{spec['id']} is implausibly small: {byte_size} bytes")

        result = {
            'dimensions': list(image.size),
            'bytes': byte_size,
            'alpha_extrema': list(alpha_extrema),
        }

        if spec['alpha']:
            if not transparent or not partial or not opaque:
                raise SystemExit(
                    f"{spec['id']} must contain transparent, partial, and opaque pixels; "
                    f"counts are {transparent}, {partial}, {opaque}"
                )

            corner_size = 16
            corner_boxes = {
                'top_left': (0, 0, corner_size, corner_size),
                'top_right': (
                    rgba.width - corner_size,
                    0,
                    rgba.width,
                    corner_size,
                ),
                'bottom_left': (
                    0,
                    rgba.height - corner_size,
                    corner_size,
                    rgba.height,
                ),
                'bottom_right': (
                    rgba.width - corner_size,
                    rgba.height - corner_size,
                    rgba.width,
                    rgba.height,
                ),
            }
            corner_extrema = {
                name: alpha.crop(box).getextrema()
                for name, box in corner_boxes.items()
            }
            if any(extrema != (0, 0) for extrema in corner_extrema.values()):
                raise SystemExit(
                    f"{spec['id']} corners are not transparent: {corner_extrema}"
                )

            nonzero_alpha_bounds = alpha.getbbox()
            if nonzero_alpha_bounds is None:
                raise SystemExit(f"{spec['id']} has no nonzero alpha bounds")
            left, top, right, bottom = nonzero_alpha_bounds
            if right <= left or bottom <= top:
                raise SystemExit(
                    f"{spec['id']} has invalid alpha bounds {nonzero_alpha_bounds}"
                )

            visible_chroma_pixels = 0
            maximum_visible_green_excess = 0
            for red, green, blue, pixel_alpha in rgba.get_flattened_data():
                if 12 < pixel_alpha < 255:
                    green_excess = green - max(red, blue)
                    maximum_visible_green_excess = max(
                        maximum_visible_green_excess,
                        green_excess,
                    )
                    if green >= 180 and green_excess > 80:
                        visible_chroma_pixels += 1
            if visible_chroma_pixels:
                raise SystemExit(
                    f"{spec['id']} retains {visible_chroma_pixels} visible chroma "
                    f"pixels; maximum green excess is {maximum_visible_green_excess}"
                )

            result.update({
                'transparent_pixels': transparent,
                'partially_transparent_pixels': partial,
                'opaque_pixels': opaque,
                'nonzero_alpha_bounds': list(nonzero_alpha_bounds),
                'corner_patch_size': [corner_size, corner_size],
                'corner_alpha_extrema': {
                    name: list(extrema)
                    for name, extrema in corner_extrema.items()
                },
                'visible_fringe_alpha_floor': 12,
                'chroma_green_floor': 180,
                'chroma_green_excess_threshold': 80,
                'visible_chroma_pixels_above_threshold': visible_chroma_pixels,
                'maximum_visible_fringe_green_excess': maximum_visible_green_excess,
            })
        elif alpha_extrema != (255, 255):
            raise SystemExit(
                f"{spec['id']} must be opaque; alpha extrema are {alpha_extrema}"
            )

        results[spec['id']] = result

print(json.dumps(results, indent=2, sort_keys=True))
`;

rmSync(temporaryDirectory, { recursive: true, force: true });
mkdirSync(temporaryDirectory, { recursive: true });

for (const asset of keyedAssets) {
  const source = path.join(root, asset.input);
  const alphaPng = path.join(temporaryDirectory, `${asset.id}-alpha.png`);
  const output = path.join(root, asset.output);
  mkdirSync(path.dirname(output), { recursive: true });
  execFileSync('python3', [
    removeChroma,
    '--input', source,
    '--out', alphaPng,
    '--auto-key', 'border',
    '--soft-matte',
    '--transparent-threshold', '12',
    '--opaque-threshold', '220',
    '--despill',
    '--force',
  ], { stdio: 'inherit' });
  execFileSync('cwebp', [
    '-quiet',
    '-q', '90',
    '-alpha_q', '100',
    '-m', '6',
    '-sharp_yuv',
    '-resize', String(asset.width), String(asset.height),
    alphaPng,
    '-o', output,
  ], { stdio: 'inherit' });
}

const spreadSource = path.join(root, spread.input);
const spreadCrop = path.join(temporaryDirectory, 'spellbook-spread-crop.png');
const spreadPng = path.join(temporaryDirectory, 'spellbook-spread-shipping.png');
const spreadOutput = path.join(root, spread.output);
mkdirSync(path.dirname(spreadOutput), { recursive: true });
execFileSync('/usr/bin/sips', [
  '-s', 'format', 'png',
  '-c', String(spread.cropHeight), String(spread.cropWidth),
  spreadSource,
  '--out', spreadCrop,
], { stdio: 'inherit' });
execFileSync('/usr/bin/sips', [
  '-s', 'format', 'png',
  '-z', String(spread.height), String(spread.width),
  spreadCrop,
  '--out', spreadPng,
], { stdio: 'inherit' });
execFileSync('cwebp', [
  '-quiet',
  '-q', '90',
  '-m', '6',
  '-sharp_yuv',
  spreadPng,
  '-o', spreadOutput,
], { stdio: 'inherit' });

const validationSpecs = [
  ...keyedAssets.map((asset) => ({
    id: asset.id,
    path: path.join(root, asset.output),
    width: asset.width,
    height: asset.height,
    alpha: true,
  })),
  {
    id: spread.id,
    path: spreadOutput,
    width: spread.width,
    height: spread.height,
    alpha: false,
  },
];
execFileSync('python3', [
  '-c', validateOutputs,
  JSON.stringify(validationSpecs),
], { stdio: 'inherit' });
