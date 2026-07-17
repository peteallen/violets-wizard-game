import { WORLD } from '../config.js';
import { spellDefinition } from '../content/spells.js';
import { drawLearningFeather } from './LearningRenderer.js';
import { drawStorybookSpread, traceRoundedRect } from './uiPrimitives.js';

const BOOK = Object.freeze({ x: 166, y: 76, width: 948, height: 580 });

export function drawSpellbookReveal(context, request) {
  const progress = presentationProgress(request);
  const eased = 1 - (1 - progress) ** 3;
  const parcel = request.imageFor?.('props/ch3/spellbook-parcel');
  if (readyImage(parcel) && progress < 0.42) {
    context.save();
    context.globalAlpha = 1 - progress / 0.42;
    context.drawImage(parcel, 455, 202, 370, 330);
    context.restore();
  }
  context.save();
  context.globalAlpha = Math.max(0.08, Math.min(1, progress / 0.34));
  context.translate(WORLD.width / 2, WORLD.height / 2);
  context.scale(0.76 + eased * 0.24, 0.76 + eased * 0.24);
  context.translate(-WORLD.width / 2, -WORLD.height / 2);
  drawStorybookSpread(context, BOOK, { title: '' });
  context.fillStyle = '#382a24';
  context.textAlign = 'center';
  context.font = '700 44px "Andika", "Trebuchet MS", sans-serif';
  context.fillText('Violet’s Spellbook', WORLD.width / 2, 154);
  drawEmptySpellFrames(context, eased);
  context.restore();
}

export function drawLumosBloom(context, request) {
  const progress = presentationProgress(request);
  const x = presentationNumber(request, 'x', 550);
  const y = presentationNumber(request, 'y', 430);
  const radius = 70 + Math.sin(Math.min(1, progress) * Math.PI / 2) * 430;
  const alpha = Math.sin(Math.min(1, progress) * Math.PI) * 0.38 + 0.12;
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(255,251,224,${Math.min(0.94, alpha + 0.5)})`);
  gradient.addColorStop(0.35, `rgba(255,224,145,${alpha})`);
  gradient.addColorStop(1, 'rgba(255,215,106,0)');
  context.save();
  context.globalCompositeOperation = 'screen';
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  drawMagicRays(context, x, y, radius * 0.72, progress);
  context.restore();
  const lantern = request.imageFor?.('props/ch3/lantern');
  if (readyImage(lantern)) context.drawImage(lantern, x - 59, y - 77, 118, 154);
}

export function drawLeviosaFeather(context, request) {
  const progress = presentationProgress(request);
  const feather = request.imageFor?.('props/ch3/feather');
  if (readyImage(feather)) drawFeatherImage(context, feather, progress, request);
  else {
    drawLearningFeather(context, progress, request.active?.time ?? 0, {
      reducedMotion: request.reducedMotion,
      x: 640,
      y: 480,
    });
  }
  if (progress > 0.68) drawGoldRibbons(context, progress, request.active?.time ?? 0, request.reducedMotion);
}

export function drawCorridorOneReveal(context, request) {
  const progress = presentationProgress(request);
  const x = presentationNumber(request, 'x', 1025);
  const y = presentationNumber(request, 'y', 385);
  const radius = 50 + progress * 230;
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(255,245,208,${0.52 + progress * 0.28})`);
  gradient.addColorStop(0.56, `rgba(255,210,104,${0.12 + progress * 0.12})`);
  gradient.addColorStop(1, 'rgba(255,210,104,0)');
  context.save();
  context.globalCompositeOperation = 'screen';
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
  const footprints = request.imageFor?.('props/ch3/wet-footprints');
  if (readyImage(footprints)) {
    context.save();
    context.globalAlpha = progress;
    context.drawImage(footprints, x - 210, y + 84, 220, 108);
    context.restore();
  }
}

export function drawTrevorReveal(context, request) {
  const progress = presentationProgress(request);
  const x = presentationNumber(request, 'x', 1010);
  const y = presentationNumber(request, 'y', 385);
  const eyes = request.imageFor?.('props/ch3/reflected-eyes');
  if (readyImage(eyes) && progress < 0.72) {
    context.save();
    context.globalAlpha = 1 - progress / 0.72;
    context.drawImage(eyes, x - 48, y - 86, 96, 58);
    context.restore();
  }
  context.save();
  context.strokeStyle = `rgba(255,215,106,${0.24 + progress * 0.56})`;
  context.lineWidth = 4;
  for (let ring = 0; ring < 3; ring += 1) {
    context.beginPath();
    context.ellipse(
      x,
      y,
      38 + progress * (34 + ring * 18),
      16 + progress * (9 + ring * 6),
      0,
      0,
      Math.PI * 2,
    );
    context.stroke();
  }
  context.restore();
}

export function drawTrevorFound(context, request) {
  drawRewardBurst(context, request, '#9fc56b');
}

export function drawTrevorReunion(context, request) {
  drawRewardBurst(context, request, '#f0c96d');
  const token = request.imageFor?.('props/ch3/toad-token');
  if (readyImage(token)) {
    const progress = presentationProgress(request);
    context.save();
    context.globalAlpha = progress;
    context.drawImage(token, 586, 188, 108, 108);
    context.restore();
  }
}

export function drawChapterClose(context, request) {
  const progress = presentationProgress(request);
  const previewProgress = smoothstep(clamp01((progress - 0.68) / 0.32));
  const artKey = presentationParam(request, 'art') ?? 'chapterCards/ch3/first-spells';
  const previewKey = presentationParam(request, 'preview')
    ?? 'chapterCards/ch4/flying-lesson';
  const image = request.imageFor?.(artKey);
  // Begin decoding the cross-chapter preview from the first frame. Normal play
  // has two seconds before the crossfade, while the harness also preloads this
  // key explicitly before it jumps to a deterministic review frame.
  const preview = request.imageFor?.(previewKey);
  if (image?.complete && image.naturalWidth > 0) {
    context.drawImage(image, 0, 0, WORLD.width, WORLD.height);
    context.fillStyle = 'rgba(20,17,38,0.18)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
  } else drawStorybookSpread(context, { x: 104, y: 54, width: 1072, height: 612 }, { title: '' });
  if (previewProgress < 1) {
    context.save();
    context.globalAlpha = 1 - previewProgress;
    drawChapterTitlePlaque(
      context,
      presentationParam(request, 'title') ?? 'Violet’s First Spells',
    );
    const authoredSpells = presentationParam(request, 'spells');
    const spells = (Array.isArray(authoredSpells) ? authoredSpells : ['lumos', 'leviosa'])
      .map((id) => spellDefinition(id))
      .filter(Boolean);
    const positions = [490, 790];
    for (const [index, spell] of spells.slice(0, positions.length).entries()) {
      drawSpellMedallion(
        context,
        positions[index],
        360,
        spell.effect.kind === 'light' ? 'light' : 'feather',
        spell.color,
        spell.shortIncantation,
      );
    }
    context.restore();
  }
  if (previewProgress > 0) {
    drawChapterFourPreview(context, request, previewProgress, preview);
  }
}

function drawChapterFourPreview(context, request, progress, preview) {
  context.save();
  context.globalAlpha = progress;
  if (readyImage(preview)) context.drawImage(preview, 0, 0, WORLD.width, WORLD.height);
  else drawFlyingPreviewFallback(context);
  context.fillStyle = 'rgba(20,17,38,0.22)';
  context.fillRect(0, 0, WORLD.width, WORLD.height);
  drawPreviewTitlePlaque(
    context,
    presentationParam(request, 'previewEyebrow') ?? 'Coming soon',
    presentationParam(request, 'previewTitle') ?? 'Flying Lesson',
  );
  context.restore();
}

function drawChapterTitlePlaque(context, title) {
  context.save();
  context.fillStyle = 'rgba(244,226,184,0.94)';
  traceRoundedRect(context, 294, 82, 692, 112, 38);
  context.fill();
  context.strokeStyle = '#765136';
  context.lineWidth = 4;
  context.stroke();
  context.fillStyle = '#382a24';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '700 48px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(title, WORLD.width / 2, 138);
  context.restore();
}

function drawPreviewTitlePlaque(context, eyebrow, title) {
  context.save();
  context.fillStyle = 'rgba(244,226,184,0.94)';
  traceRoundedRect(context, 342, 52, 596, 132, 38);
  context.fill();
  context.strokeStyle = '#765136';
  context.lineWidth = 4;
  context.stroke();
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#765136';
  context.font = '700 22px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(String(eyebrow).toUpperCase(), WORLD.width / 2, 88);
  context.fillStyle = '#382a24';
  context.font = '700 40px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(title, WORLD.width / 2, 138);
  context.restore();
}

function drawFlyingPreviewFallback(context) {
  context.fillStyle = '#8eb5bf';
  context.fillRect(0, 0, WORLD.width, WORLD.height);
  context.fillStyle = '#7f9360';
  context.beginPath();
  context.moveTo(0, 470);
  context.bezierCurveTo(340, 410, 760, 520, WORLD.width, 438);
  context.lineTo(WORLD.width, WORLD.height);
  context.lineTo(0, WORLD.height);
  context.closePath();
  context.fill();
  context.save();
  context.translate(650, 350);
  context.rotate(-0.24);
  context.strokeStyle = '#6a452b';
  context.lineWidth = 12;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(-125, 0);
  context.lineTo(125, 0);
  context.stroke();
  context.strokeStyle = '#c48e45';
  context.lineWidth = 5;
  for (let index = 0; index < 8; index += 1) {
    context.beginPath();
    context.moveTo(-116, -2);
    context.lineTo(-162 - index * 3, -34 + index * 10);
    context.stroke();
  }
  context.restore();
  context.strokeStyle = 'rgba(255,232,148,0.86)';
  context.lineWidth = 8;
  for (const [x, y, radius] of [[360, 270, 54], [820, 235, 44], [1020, 330, 62]]) {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.stroke();
  }
}

function drawEmptySpellFrames(context, progress) {
  const frames = [
    { x: 250, y: 226, width: 274, height: 316 },
    { x: 756, y: 226, width: 274, height: 316 },
  ];
  context.save();
  context.globalAlpha = 0.35 + progress * 0.65;
  for (const frame of frames) {
    context.fillStyle = 'rgba(108,75,43,0.08)';
    traceRoundedRect(context, frame.x, frame.y, frame.width, frame.height, 38);
    context.fill();
    context.strokeStyle = 'rgba(108,75,43,0.5)';
    context.lineWidth = 5;
    context.setLineDash?.([13, 11]);
    context.stroke();
    context.setLineDash?.([]);
  }
  context.restore();
}

function drawMagicRays(context, x, y, radius, progress) {
  context.strokeStyle = `rgba(255,241,184,${0.24 + progress * 0.46})`;
  context.lineWidth = 5;
  context.lineCap = 'round';
  for (let index = 0; index < 12; index += 1) {
    const angle = index * Math.PI * 2 / 12;
    const inner = radius * (0.34 + (index % 3) * 0.04);
    const outer = radius * (0.72 + (index % 2) * 0.12);
    context.beginPath();
    context.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
    context.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
    context.stroke();
  }
}

function drawGoldRibbons(context, progress, time, reducedMotion) {
  context.save();
  context.strokeStyle = `rgba(255,215,106,${progress * 0.72})`;
  context.lineWidth = 5;
  context.lineCap = 'round';
  for (let index = 0; index < 4; index += 1) {
    const phase = reducedMotion ? index : time * 2 + index * 1.3;
    const side = index % 2 === 0 ? -1 : 1;
    context.beginPath();
    context.moveTo(640 + side * (24 + index * 12), 380);
    context.bezierCurveTo(
      640 + side * (90 + Math.sin(phase) * 24),
      320,
      640 - side * (84 + index * 16),
      250,
      640 + side * (142 + index * 15),
      180,
    );
    context.stroke();
  }
  context.restore();
}

function drawRewardBurst(context, request, color) {
  const progress = presentationProgress(request);
  const x = request.active?.params?.x ?? 640;
  const y = request.active?.params?.y ?? 330;
  context.save();
  context.translate(x, y);
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = 4;
  for (let index = 0; index < 16; index += 1) {
    const angle = index * Math.PI * 2 / 16;
    const radius = 42 + progress * (90 + (index % 4) * 18);
    context.beginPath();
    context.moveTo(Math.cos(angle) * radius * 0.42, Math.sin(angle) * radius * 0.42);
    context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    context.stroke();
    context.beginPath();
    context.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, 3 + (index % 3), 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function drawSpellMedallion(context, x, y, icon, color, label) {
  context.fillStyle = color;
  context.strokeStyle = '#8a6b44';
  context.lineWidth = 6;
  context.beginPath();
  context.arc(x, y, 108, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  if (icon === 'light') {
    context.fillStyle = '#fff8dc';
    context.beginPath();
    context.arc(x, y, 30, 0, Math.PI * 2);
    context.fill();
    drawMagicRays(context, x, y, 92, 1);
  } else drawLearningFeather(context, 1, 0, { reducedMotion: true, x, y: y + 42 });
  if (label) {
    context.save();
    context.translate(x, y + 142);
    context.rotate(x < WORLD.width / 2 ? -0.012 : 0.012);
    context.fillStyle = 'rgba(244,226,184,0.95)';
    traceRoundedRect(context, -106, -30, 212, 60, 22);
    context.fill();
    context.strokeStyle = '#765136';
    context.lineWidth = 3;
    context.stroke();
    context.fillStyle = '#382a24';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '700 34px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(label, 0, 1);
    context.restore();
  }
}

function drawFeatherImage(context, image, progress, request) {
  const time = request.active?.time ?? 0;
  const sway = request.reducedMotion ? 0 : Math.sin(time * 2.2) * (4 + progress * 12);
  context.save();
  context.translate(640 + sway, 480 - progress * 142);
  context.rotate(-0.24 + progress * 0.55);
  context.drawImage(image, -92, -48, 184, 96);
  context.restore();
}

function readyImage(image) {
  return Boolean(image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0);
}

function presentationParam(request, key) {
  return request?.active?.params?.[key]
    ?? request?.active?.descriptor?.params?.[key]
    ?? request?.active?.logicalDescriptor?.params?.[key]
    ?? null;
}

function presentationNumber(request, key, fallback) {
  const value = Number(presentationParam(request, key));
  return Number.isFinite(value) ? value : fallback;
}

function performanceProgress(active) {
  const duration = Math.max(0.001, Number(active?.descriptor?.duration) || 1);
  return Math.max(0, Math.min(1, (Number(active?.time) || 0) / duration));
}

function presentationProgress(request) {
  return request?.reducedMotion ? 1 : performanceProgress(request?.active);
}

function smoothstep(value) {
  const amount = clamp01(value);
  return amount * amount * (3 - 2 * amount);
}

function clamp01(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}
