import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const codexHome = process.env.CODEX_HOME ?? path.join(process.env.HOME, '.codex');
const removeChroma = path.join(
  codexHome,
  'skills/.system/imagegen/scripts/remove_chroma_key.py',
);
const temporaryDirectory = path.join(root, 'tmp/imagegen/dom-browser-v1');

const dialog = {
  input: 'art/ui/dom/source/dialog-folio-v2-chroma.png',
  output: 'public/assets/art/ui/dom/dialog-folio-v2.webp',
  width: 1024,
  height: 1024,
};

const owl = {
  input: 'art/ui/browser/source/owl-clasp-icon-v2.png',
  webp: 'public/assets/art/ui/browser/owl-clasp-icon-v2.webp',
  png180: 'public/assets/art/ui/browser/owl-clasp-icon-v2-180.png',
  png64: 'public/assets/art/ui/browser/owl-clasp-icon-v2-64.png',
};

const resizeLanczos = String.raw`
import sys
from PIL import Image

source, output, width, height, mode, *crop_dimensions = sys.argv[1:]
with Image.open(source) as image:
    if crop_dimensions:
        crop_width, crop_height = map(int, crop_dimensions)
        if crop_width > image.width or crop_height > image.height:
            raise SystemExit(
                f'Crop {crop_width}x{crop_height} exceeds source dimensions {image.size}'
            )
        left = (image.width - crop_width) // 2
        top = (image.height - crop_height) // 2
        image = image.crop((left, top, left + crop_width, top + crop_height))
    if mode == 'opaque':
        if (
            'A' in image.getbands()
            and image.getchannel('A').getextrema() != (255, 255)
        ):
            raise SystemExit(
                'Expected an opaque source, got alpha extrema '
                f'{image.getchannel("A").getextrema()}'
            )
        image = image.convert('RGB')
    else:
        image = image.convert('RGBa')
    image = image.resize((int(width), int(height)), Image.Resampling.LANCZOS)
    if mode != 'opaque':
        image = image.convert('RGBA')
    image.save(output, format='PNG', compress_level=9, optimize=False)
`;

const validateOutputs = String.raw`
import json
import sys
from PIL import Image

dialog_path, owl_webp_path, owl_180_path, owl_64_path = sys.argv[1:]

with Image.open(dialog_path) as image:
    if image.size != (1024, 1024):
        raise SystemExit(f'Dialog dimensions are {image.size}, expected (1024, 1024)')
    rgba = image.convert('RGBA')
    alpha = rgba.getchannel('A')
    alpha_histogram = alpha.histogram()
    transparent = alpha_histogram[0]
    partial = sum(alpha_histogram[1:255])
    opaque = alpha_histogram[255]
    if not transparent or not partial or not opaque:
        raise SystemExit(
            'Dialog matte must contain transparent, partially transparent, and opaque pixels'
        )

    corner_size = 16
    corner_boxes = {
        'top_left': (0, 0, corner_size, corner_size),
        'top_right': (rgba.width - corner_size, 0, rgba.width, corner_size),
        'bottom_left': (0, rgba.height - corner_size, corner_size, rgba.height),
        'bottom_right': (
            rgba.width - corner_size,
            rgba.height - corner_size,
            rgba.width,
            rgba.height,
        ),
    }
    corner_alpha_extrema = {
        name: alpha.crop(box).getextrema() for name, box in corner_boxes.items()
    }
    if any(extrema != (0, 0) for extrema in corner_alpha_extrema.values()):
        raise SystemExit(f'Dialog corners are not transparent: {corner_alpha_extrema}')

    fringe_alpha_floor = 12
    fringe_green_excess = []
    visible_fringe_green_excess = []
    maximum_alpha_weighted_green_excess_above_threshold = 0.0
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            red, green, blue, pixel_alpha = pixels[x, y]
            if 0 < pixel_alpha < 255:
                green_excess = green - max(red, blue)
                fringe_green_excess.append(green_excess)
                maximum_alpha_weighted_green_excess_above_threshold = max(
                    maximum_alpha_weighted_green_excess_above_threshold,
                    max(0, green_excess - 12) * pixel_alpha / 255,
                )
                if pixel_alpha > fringe_alpha_floor:
                    visible_fringe_green_excess.append(green_excess)
    max_green_excess = max(fringe_green_excess, default=0)
    max_visible_green_excess = max(visible_fringe_green_excess, default=0)
    green_fringe_pixels = sum(
        value > 12 for value in visible_fringe_green_excess
    )
    if green_fringe_pixels:
        raise SystemExit(
            f'Dialog fringe retains visible green spill: {green_fringe_pixels} pixels '
            f'exceed 12 above alpha {fringe_alpha_floor}; maximum visible green excess '
            f'is {max_visible_green_excess}'
        )
    if maximum_alpha_weighted_green_excess_above_threshold > 1:
        raise SystemExit(
            'Dialog fringe retains alpha-weighted green spill above threshold: '
            f'maximum is {maximum_alpha_weighted_green_excess_above_threshold}'
        )

owl_results = {}
for label, path, expected_size in (
    ('webp_512', owl_webp_path, (512, 512)),
    ('png_180', owl_180_path, (180, 180)),
    ('png_64', owl_64_path, (64, 64)),
):
    with Image.open(path) as image:
        if image.size != expected_size:
            raise SystemExit(f'{label} dimensions are {image.size}, expected {expected_size}')
        rgba = image.convert('RGBA')
        alpha_extrema = rgba.getchannel('A').getextrema()
        if alpha_extrema != (255, 255):
            raise SystemExit(f'{label} is not opaque: alpha extrema {alpha_extrema}')
        owl_results[label] = {
            'dimensions': list(image.size),
            'alpha_extrema': list(alpha_extrema),
        }

print(json.dumps({
    'dialog': {
        'dimensions': [1024, 1024],
        'alpha_extrema': list(alpha.getextrema()),
        'transparent_pixels': transparent,
        'partially_transparent_pixels': partial,
        'opaque_pixels': opaque,
        'corner_patch_size': [corner_size, corner_size],
        'corner_alpha_extrema': {
            name: list(extrema) for name, extrema in corner_alpha_extrema.items()
        },
        'fringe_alpha_floor': fringe_alpha_floor,
        'fringe_green_excess_threshold': 12,
        'visible_fringe_pixels_above_threshold': green_fringe_pixels,
        'maximum_fringe_green_excess': max_green_excess,
        'maximum_visible_fringe_green_excess': max_visible_green_excess,
        'maximum_alpha_weighted_green_excess_above_threshold': round(
            maximum_alpha_weighted_green_excess_above_threshold, 3
        ),
    },
    'owl': owl_results,
}, indent=2))
`;

rmSync(temporaryDirectory, { recursive: true, force: true });
mkdirSync(temporaryDirectory, { recursive: true });

const dialogInput = path.join(root, dialog.input);
const dialogAlpha = path.join(temporaryDirectory, 'dialog-folio-v2-alpha.png');
const dialogShippingPng = path.join(
  temporaryDirectory,
  'dialog-folio-v2-shipping.png',
);
const dialogOutput = path.join(root, dialog.output);
mkdirSync(path.dirname(dialogOutput), { recursive: true });
execFileSync('python3', [
  removeChroma,
  '--input', dialogInput,
  '--out', dialogAlpha,
  '--auto-key', 'border',
  '--soft-matte',
  '--transparent-threshold', '12',
  '--opaque-threshold', '220',
  '--despill',
  '--force',
], { stdio: 'inherit' });
execFileSync('python3', [
  '-c', resizeLanczos,
  dialogAlpha,
  dialogShippingPng,
  String(dialog.width),
  String(dialog.height),
  'alpha',
], { stdio: 'inherit' });
execFileSync('cwebp', [
  '-quiet',
  '-q', '90',
  '-alpha_q', '100',
  dialogShippingPng,
  '-o', dialogOutput,
], { stdio: 'inherit' });

const owlInput = path.join(root, owl.input);
const owlOutput512 = path.join(root, owl.webp);
const owlOutput180 = path.join(root, owl.png180);
const owlOutput64 = path.join(root, owl.png64);
const owlShippingPng512 = path.join(
  temporaryDirectory,
  'owl-clasp-icon-v2-512.png',
);
for (const output of [owlOutput512, owlOutput180, owlOutput64]) {
  mkdirSync(path.dirname(output), { recursive: true });
}
for (const [output, size] of [
  [owlShippingPng512, 512],
  [owlOutput180, 180],
]) {
  execFileSync('python3', [
    '-c', resizeLanczos,
    owlInput,
    output,
    String(size),
    String(size),
    'opaque',
  ], { stdio: 'inherit' });
}
execFileSync('python3', [
  '-c', resizeLanczos,
  owlShippingPng512,
  owlOutput64,
  '64',
  '64',
  'opaque',
  '420',
  '420',
], { stdio: 'inherit' });
execFileSync('cwebp', [
  '-quiet',
  '-q', '90',
  owlShippingPng512,
  '-o', owlOutput512,
], { stdio: 'inherit' });

execFileSync('python3', [
  '-c', validateOutputs,
  dialogOutput,
  owlOutput512,
  owlOutput180,
  owlOutput64,
], { stdio: 'inherit' });
