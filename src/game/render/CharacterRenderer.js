import { PALETTE } from '../config.js';
import { drawVectorOwl } from './OwlRenderer.js';

const OUTLINE = '#49372e';
const DEEP_OUTLINE = '#342720';
const RIM_LIGHT = 'rgba(255, 224, 158, 0.34)';
const SHADOW_WASH = 'rgba(37, 26, 35, 0.26)';
const WARM_BOUNCE = 'rgba(229, 170, 93, 0.18)';

export const VIOLET_STYLE = Object.freeze({
  hairBase: '#806f62',
  hairMid: '#695a50',
  hairShadow: '#514640',
  hairLight: 'rgba(231, 218, 198, 0.32)',
  hairRim: 'rgba(220, 205, 184, 0.42)',
  glasses: '#203d34',
  glassesLight: '#557266',
  lenses: 'rgba(190, 218, 202, 0.08)',
});

export const CHARACTER_REVIEW_SCENES = Object.freeze([
  'character-cast-review',
  'character-pets-review',
  'character-portraits-review',
  'owl-motion-review',
]);

const CHARACTER_COLORS = Object.freeze({
  guide: {
    robe: '#5d4938', robeShadow: '#3f322b', accent: '#a9865a', hair: '#34261f', hairLight: '#654536', skin: '#bd7d5e', cheek: '#b76858',
  },
  wandmaker: {
    robe: '#34364d', robeShadow: '#242638', accent: '#c6b681', hair: '#ddd4bc', hairLight: '#f3ead3', skin: '#d3a17d', cheek: '#c27d73',
  },
  tailor: {
    robe: '#81486f', robeShadow: '#58324e', accent: '#efbd78', hair: '#3c2923', hairLight: '#6a4536', skin: '#b97657', cheek: '#a95859',
  },
  keeper: {
    robe: '#496653', robeShadow: '#32483d', accent: '#d5bd68', hair: '#9a6038', hairLight: '#c38250', skin: '#cc916c', cheek: '#b76561',
  },
});

export class CharacterRenderer {
  draw(context, character, time = 0) {
    if (character.kind === 'violet') this.drawViolet(context, character, time);
    else this.drawNpc(context, character, time);
  }

  drawViolet(context, character, time) {
    const scale = character.scale ?? 1;
    const direction = character.facing === 'left' ? -1 : 1;
    const walking = Boolean(character.walking);
    const stride = walking ? Math.sin(time * 10.5) : 0;
    const bob = walking ? -Math.abs(stride) * 3.4 : Math.sin(time * 2.1) * 1.6;
    const idleSway = walking ? 0 : Math.sin(time * 1.35) * 0.018;
    const trim = character.robeTrim ?? PALETTE.violet;
    const blinking = isBlinking(time, 0.1);

    context.save();
    context.translate(character.x, character.y + bob);
    context.scale(direction * scale, scale);
    context.rotate(idleSway);
    prepare(context, 2.25);

    drawGroundingShadow(context, 'violet');
    drawVioletLeg(context, -15, stride * 8, true);
    drawVioletLeg(context, 15, -stride * 8, false);
    drawVioletBackHair(context);
    drawVioletBackArm(context, stride, trim);
    drawVioletRobe(context, trim, time);
    drawVioletFrontArm(context, stride, trim, Boolean(character.wand), time);
    drawVioletHead(context, blinking, time, character.pose);
    drawVioletCollar(context, trim);
    drawUpperLeftRim(context, [
      [-43, -163], [-34, -183], [-10, -194], [12, -191], [34, -176], [43, -151],
    ], 1.35);

    context.restore();
  }

  drawNpc(context, character, time) {
    const kind = character.kind in CHARACTER_COLORS ? character.kind : 'guide';
    const palette = CHARACTER_COLORS[kind];
    const scale = (character.scale ?? 1) * (kind === 'guide' ? 1.55 : 1.04);
    const direction = character.facing === 'left' ? -1 : 1;
    const phase = character.phase ?? kind.length * 0.37;
    const bob = Math.sin(time * 1.65 + phase) * 1.5;
    const sway = Math.sin(time * 1.15 + phase) * 0.012;
    const blinking = isBlinking(time, phase);

    context.save();
    context.translate(character.x, character.y + bob);
    context.scale(direction * scale, scale);
    context.rotate(sway);
    prepare(context, 2.1);

    drawGroundingShadow(context, kind);
    drawNpcLegs(context, kind, palette, character.pose, time + phase);
    drawNpcBackDetails(context, kind, palette);
    drawNpcBody(context, kind, palette);
    drawNpcArms(context, kind, palette, time + phase);
    drawNpcHead(context, kind, palette, blinking, time + phase, character.pose);
    drawNpcAccessory(context, kind, palette);
    drawUpperLeftRim(context, kind === 'guide'
      ? [[-55, -129], [-54, -161], [-37, -185], [-10, -197], [17, -192], [42, -174]]
      : [[-39, -132], [-34, -164], [-13, -182], [14, -180], [35, -160]], 1.25);

    context.restore();
  }

  drawPet(context, pet, time = 0) {
    if (!pet?.type) return;
    if (pet.type === 'owl') {
      drawVectorOwl(context, {
        ...pet,
        variant: pet.variant ?? 'pet',
        pose: pet.pose ?? 'idle',
      }, time);
      return;
    }
    const motion = sampleCompanionMotion({
      type: pet.type,
      pose: pet.pose ?? 'idle',
      time,
      reducedMotion: Boolean(pet.reducedMotion),
    });
    const scale = pet.scale ?? 1;
    const direction = pet.facing === 'left' ? -1 : 1;
    context.save();
    context.translate(pet.x, pet.y + motion.bob - motion.hop);
    context.rotate(motion.tilt);
    context.scale(direction * scale, scale * motion.breathScale);
    prepare(context, 2.8);

    drawCompanionShadow(context, pet.type, motion);

    if (pet.type === 'cat') drawCat(context, time, motion, pet);
    else drawToad(context, time, motion, pet);

    context.restore();
  }

  drawPortrait(context, portrait = {}, time = 0) {
    const speaker = resolvePortraitSpeaker(portrait.speaker);
    const x = portrait.x ?? 0;
    const y = portrait.y ?? 0;
    const scale = portrait.scale ?? 1;
    const requestedPose = portrait.pose ?? 'speaking';
    const pose = requestedPose === 'talk' ? 'speaking' : requestedPose;
    const facing = portrait.facing ?? 'right';

    context.save();
    context.translate(x, y);
    context.scale(scale, scale);
    drawPortraitBackdrop(context, speaker, time);
    context.save();
    context.beginPath();
    context.arc(0, 0, 55, 0, Math.PI * 2);
    context.clip();

    if (speaker === 'narrator') drawNarratorPortrait(context, time);
    else if (['owl', 'cat', 'toad'].includes(speaker)) {
      const petY = speaker === 'owl' ? 62 : speaker === 'cat' ? 78 : 48;
      this.drawPet(context, {
        type: speaker,
        variant: speaker === 'owl' ? 'pet' : undefined,
        pose: speaker === 'owl' ? 'idle' : pose,
        x: 0,
        y: petY,
        scale: speaker === 'owl' ? 0.86 : speaker === 'cat' ? 0.96 : 1.05,
        facing,
        lookX: facing === 'left' ? -0.35 : 0.35,
      }, time);
    } else if (speaker === 'violet') {
      this.draw(context, {
        kind: 'violet', x: 0, y: 118, scale: 0.82, facing,
        robeTrim: portrait.robeTrim ?? PALETTE.violet, wand: Boolean(portrait.wand), pose,
      }, time);
    } else {
      const guide = speaker === 'guide';
      this.draw(context, {
        kind: speaker, x: 0, y: guide ? 166 : 116, scale: guide ? 0.76 : 0.84,
        facing, pose,
      }, time);
    }
    context.restore();
    drawPortraitFrame(context, speaker, time);
    context.restore();
  }

  drawReviewScene(context, scene, time = 0, { reducedMotion = false } = {}) {
    if (!CHARACTER_REVIEW_SCENES.includes(scene)) return false;
    drawReviewBackground(context, scene);
    if (scene === 'character-cast-review') this.drawCastReview(context, time);
    else if (scene === 'character-pets-review') this.drawPetsReview(context, time, reducedMotion);
    else if (scene === 'character-portraits-review') this.drawPortraitReview(context, time);
    else this.drawOwlMotionReview(context, time, reducedMotion);
    return true;
  }

  drawCastReview(context, time) {
    const cast = [
      { label: 'Violet', kind: 'violet', x: 126, y: 595, scale: 1, wand: true, robeTrim: '#7952b7', pose: 'speaking' },
      { label: 'Hagrid', kind: 'guide', x: 365, y: 595, scale: 0.98, pose: 'speaking' },
      { label: 'Wandmaker', kind: 'wandmaker', x: 625, y: 595, scale: 1.05, pose: 'curious' },
      { label: 'Tailor', kind: 'tailor', x: 855, y: 595, scale: 1.05, pose: 'speaking' },
      { label: 'Keeper', kind: 'keeper', x: 1085, y: 595, scale: 1.05, pose: 'proud' },
    ];
    for (const character of cast) {
      drawReviewPlinth(context, character.x, 625, character.label);
      this.draw(context, character, time + character.x * 0.001);
    }
  }

  drawPetsReview(context, time, reducedMotion) {
    drawReviewPlinth(context, 225, 610, 'Cat companion');
    drawReviewPlinth(context, 640, 610, 'Owl companion');
    drawReviewPlinth(context, 1055, 610, 'Toad companion');
    this.drawPet(context, { type: 'cat', x: 225, y: 550, scale: 1.9, pose: 'pet-follow', reducedMotion }, time);
    this.drawPet(context, {
      type: 'owl', variant: 'pet', x: 640, y: 554, scale: 1.62, pose: 'pet-follow',
      reducedMotion, lookX: Math.sin(time * 0.7) * 0.8, lookY: -0.15,
    }, time + 0.35);
    this.drawPet(context, { type: 'toad', x: 1055, y: 570, scale: 2.05, pose: 'pet-follow', reducedMotion }, time + 0.7);
  }

  drawPortraitReview(context, time) {
    const portraits = [
      ['Violet', 'violet'], ['Hagrid', 'guide'], ['Wandmaker', 'wandmaker'], ['Tailor', 'tailor'],
      ['Keeper', 'keeper'], ['Narrator', 'narrator'], ['Cat', 'cat'], ['Owl', 'owl'], ['Toad', 'toad'],
    ];
    portraits.forEach(([label, speaker], index) => {
      const column = index % 5;
      const row = Math.floor(index / 5);
      const x = 140 + column * 250;
      const y = 265 + row * 260;
      this.drawPortrait(context, { speaker, pose: 'speaking', x, y, scale: 1.38 }, time + index * 0.29);
      drawReviewLabel(context, x, y + 100, label);
    });
  }

  drawOwlMotionReview(context, time, reducedMotion) {
    const poses = ['perch', 'idle', 'takeoff', 'flight', 'settle', 'pet-follow'];
    poses.forEach((pose, index) => {
      const x = 118 + index * 209;
      const flight = pose === 'flight';
      drawReviewPlinth(context, x, 605, pose.replace('-', ' '));
      this.drawPet(context, {
        type: 'owl', variant: index === 0 ? 'post' : 'pet', pose,
        x, y: flight ? 505 : 550, scale: 1.03,
        reducedMotion, lookX: (index - 2.5) / 3.2, lookY: index % 2 ? -0.25 : 0.18,
        phase: index * 0.31,
      }, time);
    });
  }
}

export function sampleCompanionMotion({ type = 'cat', pose = 'idle', time = 0, reducedMotion = false } = {}) {
  const phase = type === 'toad' ? 1.7 : 0.4;
  const energy = reducedMotion ? 0.32 : 1;
  const stepWave = Math.sin(time * (type === 'toad' ? 4.2 : 6.1) + phase);
  const following = pose === 'follow' || pose === 'pet-follow';
  const pawing = pose === 'paw';
  const hopWave = following ? Math.max(0, stepWave) ** 2 : 0;
  const breath = Math.sin(time * (type === 'toad' ? 1.45 : 2.05) + phase);
  return Object.freeze({
    bob: breath * (type === 'toad' ? 1.1 : 1.65) * energy,
    hop: hopWave * (type === 'toad' ? 7 : 5.5) * energy,
    tilt: following ? stepWave * (type === 'toad' ? 0.025 : 0.045) * energy : breath * 0.008 * energy,
    step: following ? stepWave : 0,
    breathScale: 1 + breath * (type === 'toad' ? 0.022 : 0.012) * energy,
    tailSway: Math.sin(time * 2.7 + phase) * (following ? 0.34 : 0.2) * energy,
    throatPulse: type === 'toad' ? Math.max(0, Math.sin(time * 1.33 + 0.8)) * energy : 0,
    pawLift: pawing ? (0.58 + Math.sin(time * 4.2) * 0.18) * energy : 0,
  });
}

function resolvePortraitSpeaker(value) {
  const speaker = String(value ?? 'narrator').trim().toLowerCase();
  if (speaker.includes('violet')) return 'violet';
  if (speaker.includes('hagrid') || speaker.includes('guide')) return 'guide';
  if (speaker.includes('ollivander') || speaker.includes('wandmaker') || speaker.includes('wand maker')) return 'wandmaker';
  if (speaker.includes('malkin') || speaker.includes('tailor')) return 'tailor';
  if (speaker.includes('keeper') || speaker.includes('menagerie')) return 'keeper';
  if (speaker.includes('owl')) return 'owl';
  if (speaker.includes('cat')) return 'cat';
  if (speaker.includes('toad') || speaker.includes('frog')) return 'toad';
  return 'narrator';
}

function drawPortraitBackdrop(context, speaker, time) {
  const colors = {
    violet: ['#302642', '#8b63aa'], guide: ['#30271f', '#7f6347'], wandmaker: ['#292b40', '#77799a'],
    tailor: ['#4e2943', '#ae688e'], keeper: ['#2f4939', '#66856d'], narrator: ['#33283f', '#8d6ca0'],
    cat: ['#49352b', '#b18464'], owl: ['#38313f', '#8b7a96'], toad: ['#34412d', '#71875c'],
  };
  const [dark, light] = colors[speaker] ?? colors.narrator;
  context.save();
  context.fillStyle = dark;
  context.beginPath();
  context.arc(0, 0, 58, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = light;
  context.globalAlpha = 0.72;
  context.beginPath();
  context.arc(-7, -8, 45, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#fff3c4';
  context.globalAlpha = 0.16;
  context.beginPath();
  context.ellipse(-19, -25, 24, 15, -0.45, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;
  context.fillStyle = `rgba(255,232,171,${0.09 + Math.sin(time * 1.1) * 0.025})`;
  for (const [x, y, size] of [[-34, -27, 3], [34, -18, 2], [-27, 29, 2.4], [29, 33, 1.8]]) {
    drawFourPointStar(context, x, y, size);
  }
  context.restore();
}

function drawPortraitFrame(context, speaker, time) {
  context.strokeStyle = '#3b2a24';
  context.lineWidth = 9;
  context.beginPath();
  context.arc(0, 0, 59, 0, Math.PI * 2);
  context.stroke();
  context.strokeStyle = '#d5aa56';
  context.lineWidth = 4.5;
  context.beginPath();
  context.arc(0, 0, 57, 0, Math.PI * 2);
  context.stroke();
  context.strokeStyle = 'rgba(255,240,187,0.78)';
  context.lineWidth = 1.8;
  context.beginPath();
  context.arc(0, 0, 53.5, Math.PI * 1.08, Math.PI * 1.74);
  context.stroke();

  context.fillStyle = '#7b3049';
  context.beginPath();
  context.moveTo(-18, 53);
  context.lineTo(-11, 67);
  context.lineTo(0, 60 + Math.sin(time * 1.4) * 0.8);
  context.lineTo(11, 67);
  context.lineTo(18, 53);
  context.closePath();
  fillStroke(context, 2.1);
  context.fillStyle = speaker === 'owl' ? '#e5ba58' : '#f0d28a';
  drawFourPointStar(context, 0, 57, 4.5);
}

function drawNarratorPortrait(context, time) {
  context.save();
  context.translate(0, 5);
  context.rotate(Math.sin(time * 0.7) * 0.012);
  context.fillStyle = '#ead7aa';
  context.strokeStyle = OUTLINE;
  context.lineWidth = 2.4;
  context.beginPath();
  context.moveTo(-43, -28);
  context.quadraticCurveTo(-20, -36, 0, -18);
  context.quadraticCurveTo(20, -36, 43, -28);
  context.lineTo(40, 30);
  context.quadraticCurveTo(18, 20, 0, 37);
  context.quadraticCurveTo(-18, 20, -40, 30);
  context.closePath();
  context.fill();
  context.stroke();
  context.strokeStyle = '#957148';
  context.lineWidth = 1.6;
  for (const side of [-1, 1]) {
    for (let row = 0; row < 4; row += 1) {
      const y = -14 + row * 9;
      context.beginPath();
      context.moveTo(side * 6, y);
      context.quadraticCurveTo(side * 21, y - 3, side * 34, y);
      context.stroke();
    }
  }
  context.strokeStyle = '#5c4765';
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(16, 23);
  context.quadraticCurveTo(35, -2, 30, -36);
  context.stroke();
  context.strokeStyle = '#d8c2e3';
  context.lineWidth = 2;
  context.stroke();
  context.fillStyle = '#e5b74f';
  drawFourPointStar(context, 30, -38, 4.2);
  context.restore();
}

function drawReviewBackground(context, scene) {
  context.fillStyle = '#181526';
  context.fillRect(0, 0, 1280, 720);
  const gradient = context.createLinearGradient(0, 0, 0, 720);
  gradient.addColorStop(0, '#352b49');
  gradient.addColorStop(0.62, '#252039');
  gradient.addColorStop(1, '#17131f');
  context.fillStyle = gradient;
  context.fillRect(22, 22, 1236, 676);
  context.strokeStyle = '#b88c48';
  context.lineWidth = 4;
  context.strokeRect(31, 31, 1218, 658);
  context.strokeStyle = 'rgba(243,216,154,0.42)';
  context.lineWidth = 1.5;
  context.strokeRect(41, 41, 1198, 638);
  context.fillStyle = '#f0dcae';
  context.textAlign = 'center';
  context.font = '700 32px "Andika", "Trebuchet MS", sans-serif';
  const titles = {
    'character-cast-review': 'Illustrated cast · gameplay scale',
    'character-pets-review': 'Companions · follow animation and material detail',
    'character-portraits-review': 'Dialogue cameos · one shared puppet family',
    'owl-motion-review': 'Hero owl · pose and motion library',
  };
  context.fillText(titles[scene], 640, 77);
  context.fillStyle = 'rgba(225,183,89,0.68)';
  for (let index = 0; index < 11; index += 1) drawFourPointStar(context, 80 + index * 112, 111, index % 2 ? 2.2 : 3.2);
}

function drawReviewPlinth(context, x, y, label) {
  context.fillStyle = 'rgba(13,11,21,0.52)';
  context.beginPath();
  context.ellipse(x, y - 6, 82, 18, 0, 0, Math.PI * 2);
  context.fill();
  drawReviewLabel(context, x, y + 35, label);
}

function drawReviewLabel(context, x, y, label) {
  context.fillStyle = '#f0dcae';
  context.textAlign = 'center';
  context.font = '700 22px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(label, x, y);
}

function prepare(context, lineWidth) {
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = OUTLINE;
  context.lineWidth = lineWidth;
}

function drawGroundingShadow(context, kind) {
  const guide = kind === 'guide';
  const violet = kind === 'violet';
  const width = guide ? 72 : violet ? 49 : 54;
  context.save();
  context.fillStyle = 'rgba(27,18,24,0.2)';
  context.beginPath();
  context.ellipse(4, 26, width, guide ? 13 : 9, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = 'rgba(45,27,22,0.18)';
  context.beginPath();
  context.ellipse(-2, 23, width * 0.7, guide ? 7 : 5, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawCompanionShadow(context, type, motion) {
  const toad = type === 'toad';
  const hopLift = Math.min(0.42, motion.hop / (toad ? 18 : 15));
  context.save();
  context.globalAlpha = 1 - hopLift;
  context.fillStyle = 'rgba(25,17,24,0.24)';
  context.beginPath();
  context.ellipse(2, toad ? 4 : 5, toad ? 43 : 31, toad ? 8 : 7, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = 'rgba(92,54,36,0.12)';
  context.beginPath();
  context.ellipse(-3, toad ? 2 : 3, toad ? 30 : 22, toad ? 4.5 : 4, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawVioletLeg(context, x, stride, behind) {
  context.save();
  context.globalAlpha = behind ? 0.9 : 1;
  context.strokeStyle = '#493b55';
  context.lineWidth = 11;
  context.beginPath();
  context.moveTo(x, -8);
  context.quadraticCurveTo(x + stride * 0.25, 10, x + stride, 24);
  context.stroke();

  const footX = x + stride;
  context.fillStyle = '#6f4caf';
  context.strokeStyle = OUTLINE;
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(footX - 7, 18);
  context.quadraticCurveTo(footX + 3, 14, footX + 17, 20);
  context.quadraticCurveTo(footX + 23, 24, footX + 17, 30);
  context.lineTo(footX - 6, 30);
  context.quadraticCurveTo(footX - 11, 25, footX - 7, 18);
  context.closePath();
  context.fill();
  context.stroke();
  context.strokeStyle = '#ae8de0';
  context.lineWidth = 2.4;
  context.beginPath();
  context.moveTo(footX + 2, 21);
  context.quadraticCurveTo(footX + 8, 18, footX + 14, 22);
  context.stroke();
  context.strokeStyle = '#e9d9f7';
  context.lineWidth = 1.7;
  context.beginPath();
  context.moveTo(footX - 2, 26);
  context.lineTo(footX + 18, 26);
  context.stroke();
  context.restore();
}

function drawVioletBackHair(context) {
  context.fillStyle = VIOLET_STYLE.hairBase;
  context.beginPath();
  context.moveTo(-34, -168);
  context.bezierCurveTo(-50, -151, -45, -111, -39, -79);
  context.quadraticCurveTo(-29, -63, -17, -77);
  context.quadraticCurveTo(-5, -59, 7, -77);
  context.quadraticCurveTo(23, -61, 35, -82);
  context.bezierCurveTo(47, -119, 45, -151, 31, -170);
  context.closePath();
  fillStroke(context);
  context.fillStyle = VIOLET_STYLE.hairShadow;
  context.globalAlpha = 0.58;
  context.beginPath();
  context.moveTo(5, -184);
  context.bezierCurveTo(35, -176, 44, -145, 38, -99);
  context.quadraticCurveTo(31, -73, 18, -68);
  context.quadraticCurveTo(15, -95, 13, -135, 5, -184);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;
  context.fillStyle = VIOLET_STYLE.hairLight;
  context.beginPath();
  context.moveTo(-29, -162);
  context.bezierCurveTo(-40, -133, -35, -103, -30, -84);
  context.quadraticCurveTo(-23, -78, -19, -87);
  context.bezierCurveTo(-24, -112, -19, -145, -8, -170);
  context.closePath();
  context.fill();
  context.strokeStyle = VIOLET_STYLE.hairRim;
  context.lineWidth = 1.45;
  for (const [x, bend, end] of [[-28, -6, -91], [-14, 5, -78], [2, -4, -82], [18, 6, -79], [30, 3, -91]]) {
    context.beginPath();
    context.moveTo(x, -168 + Math.abs(x) * 0.2);
    context.bezierCurveTo(x + bend, -143, x - bend * 0.5, -112, x + bend, end);
    context.stroke();
  }
}

function drawVioletBackArm(context, stride, trim) {
  const swing = stride * 7;
  const cuffX = -45 - swing * 0.25;
  const cuffY = -36 + swing;
  context.fillStyle = '#292532';
  context.strokeStyle = OUTLINE;
  context.lineWidth = 1.9;
  context.beginPath();
  context.moveTo(-30, -96);
  context.bezierCurveTo(-45, -91, -52, -62 + swing * 0.2, cuffX - 5, cuffY - 5);
  context.quadraticCurveTo(cuffX, cuffY + 4, cuffX + 9, cuffY + 1);
  context.bezierCurveTo(-40, -58, -32, -79, -30, -96);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = 'rgba(223,195,154,0.1)';
  context.beginPath();
  context.moveTo(-35, -89);
  context.quadraticCurveTo(-46, -64, cuffX - 1, cuffY - 7);
  context.lineTo(cuffX + 3, cuffY - 4);
  context.quadraticCurveTo(-40, -69, -35, -89);
  context.closePath();
  context.fill();
  context.strokeStyle = trim;
  context.lineWidth = 3.2;
  context.beginPath();
  context.moveTo(cuffX - 5, cuffY - 5);
  context.quadraticCurveTo(cuffX, cuffY - 1, cuffX + 8, cuffY + 1);
  context.stroke();
  drawHand(context, -43 - swing * 0.25, -27 + swing, '#d9a17b', 8);
}

function drawVioletRobe(context, trim, time = 0) {
  context.fillStyle = '#25232d';
  context.beginPath();
  context.moveTo(-30, -101);
  context.quadraticCurveTo(-47, -92, -45, -70);
  context.bezierCurveTo(-46, -43, -55, -14, -59, 1);
  context.quadraticCurveTo(-27, 14, 0, 8);
  context.quadraticCurveTo(27, 14, 59, 1);
  context.bezierCurveTo(55, -17, 45, -46, 45, -71);
  context.quadraticCurveTo(46, -93, 29, -101);
  context.closePath();
  fillStroke(context);

  context.fillStyle = SHADOW_WASH;
  context.beginPath();
  context.moveTo(7, -94);
  context.quadraticCurveTo(38, -80, 39, -50);
  context.quadraticCurveTo(40, -18, 51, 1);
  context.quadraticCurveTo(28, 9, 5, 6);
  context.closePath();
  context.fill();

  context.fillStyle = 'rgba(91,77,102,0.24)';
  context.beginPath();
  context.moveTo(-29, -96);
  context.quadraticCurveTo(-45, -80, -41, -49);
  context.quadraticCurveTo(-43, -25, -50, -4);
  context.lineTo(-34, 1);
  context.quadraticCurveTo(-26, -48, -15, -89, -29, -96);
  context.closePath();
  context.fill();

  context.fillStyle = WARM_BOUNCE;
  context.beginPath();
  context.moveTo(-52, -13);
  context.quadraticCurveTo(-26, -3, 1, 5);
  context.lineTo(-2, 8);
  context.quadraticCurveTo(-30, 10, -54, 1);
  context.closePath();
  context.fill();

  context.strokeStyle = trim;
  context.lineWidth = 7;
  context.beginPath();
  context.moveTo(-51, 0);
  context.quadraticCurveTo(0, 15, 51, 0);
  context.stroke();
  context.strokeStyle = 'rgba(255,255,255,0.22)';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-48, -1);
  context.quadraticCurveTo(-20, 5, 0, 5);
  context.stroke();

  context.strokeStyle = 'rgba(236,224,202,0.28)';
  context.lineWidth = 1.35;
  context.beginPath();
  context.moveTo(-21, -88);
  context.bezierCurveTo(-27, -55, -29, -22, -34, -3);
  context.moveTo(18, -88);
  context.bezierCurveTo(24, -54, 27, -22, 32, -3);
  context.moveTo(0, -92);
  context.quadraticCurveTo(-3, -47, 0, 4);
  context.stroke();

  const shimmer = 0.62 + Math.sin(time * 1.8) * 0.12;
  context.fillStyle = `rgba(244,213,141,${shimmer})`;
  for (const [x, y, size] of [[-34, -51, 2.4], [29, -35, 1.8], [-16, -18, 1.6]]) {
    drawFourPointStar(context, x, y, size);
  }
}

function drawVioletFrontArm(context, stride, trim, hasWand, time) {
  const swing = -stride * 7;
  const cuffX = 43 + swing * 0.25;
  const cuffY = -36 + swing;
  context.fillStyle = '#302b38';
  context.strokeStyle = OUTLINE;
  context.lineWidth = 1.9;
  context.beginPath();
  context.moveTo(30, -96);
  context.bezierCurveTo(45, -92, 52, -63 + swing * 0.15, cuffX + 5, cuffY - 5);
  context.quadraticCurveTo(cuffX, cuffY + 4, cuffX - 9, cuffY + 1);
  context.bezierCurveTo(40, -59, 33, -79, 30, -96);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = 'rgba(24,18,29,0.2)';
  context.beginPath();
  context.moveTo(36, -89);
  context.quadraticCurveTo(48, -63, cuffX + 2, cuffY - 6);
  context.lineTo(cuffX - 3, cuffY - 3);
  context.quadraticCurveTo(42, -68, 36, -89);
  context.closePath();
  context.fill();
  context.strokeStyle = trim;
  context.lineWidth = 3.2;
  context.beginPath();
  context.moveTo(cuffX - 8, cuffY + 1);
  context.quadraticCurveTo(cuffX, cuffY - 1, cuffX + 5, cuffY - 5);
  context.stroke();
  const handX = 43 + swing * 0.25;
  const handY = -27 + swing;
  drawHand(context, handX, handY, '#d9a17b', 8.5);

  if (hasWand) {
    context.strokeStyle = OUTLINE;
    context.lineWidth = 7;
    context.beginPath();
    context.moveTo(handX + 1, handY - 2);
    context.lineTo(handX + 39, handY - 55);
    context.stroke();
    context.strokeStyle = '#68442e';
    context.lineWidth = 3.5;
    context.stroke();
    context.fillStyle = PALETTE.interactive;
    context.globalAlpha = 0.78 + Math.sin(time * 4.5) * 0.16;
    context.beginPath();
    context.arc(handX + 40, handY - 57, 4.3, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
  }
}

function drawVioletHead(context, blinking, time, pose = 'idle') {
  drawEar(context, -37, -142, '#d9a17b');
  drawEar(context, 37, -142, '#d9a17b');

  context.fillStyle = '#d9a17b';
  context.beginPath();
  context.ellipse(0, -142, 37, 42, 0, 0, Math.PI * 2);
  fillStroke(context);

  context.fillStyle = 'rgba(119,66,61,0.18)';
  context.beginPath();
  context.moveTo(10, -181);
  context.bezierCurveTo(34, -172, 40, -151, 34, -131);
  context.quadraticCurveTo(25, -108, 8, -103);
  context.quadraticCurveTo(18, -126, 15, -153, 10, -181);
  context.closePath();
  context.fill();
  context.fillStyle = 'rgba(255,224,181,0.24)';
  context.beginPath();
  context.ellipse(-12, -161, 14, 8, -0.42, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = 'rgba(189, 82, 91, 0.22)';
  context.beginPath();
  context.ellipse(-24, -128, 9, 5, -0.12, 0, Math.PI * 2);
  context.ellipse(24, -128, 9, 5, 0.12, 0, Math.PI * 2);
  context.fill();

  const gazeX = Math.sin(time * 0.66 + 0.4) * 1.5;
  const gazeY = Math.sin(time * 0.41 + 1.3) * 0.7;
  drawIllustratedEyes(context, -13, -145, 13, -145, '#6a482d', blinking, 5.2, gazeX, gazeY, {
    browLift: Math.sin(time * 0.53) * 0.7,
  });
  drawVioletGlasses(context);
  context.strokeStyle = '#6d4736';
  context.lineWidth = 1.45;
  context.beginPath();
  context.moveTo(0, -142);
  context.quadraticCurveTo(-2, -132, 3, -133);
  context.stroke();
  context.strokeStyle = 'rgba(113,61,51,0.35)';
  context.lineWidth = 1.1;
  context.beginPath();
  context.moveTo(-3, -129);
  context.quadraticCurveTo(0, -127, 4, -129);
  context.stroke();
  drawExpressiveMouth(context, 0, -119, 12, '#9b565d', pose, time);

  context.fillStyle = '#d8a04b';
  context.strokeStyle = OUTLINE;
  context.lineWidth = 1.8;
  drawFourPointStar(context, 27, -174, 5.2);
  context.stroke();

  context.fillStyle = VIOLET_STYLE.hairBase;
  context.beginPath();
  context.moveTo(-36, -154);
  context.bezierCurveTo(-39, -180, -20, -193, 3, -192);
  context.bezierCurveTo(27, -192, 40, -176, 37, -151);
  context.quadraticCurveTo(29, -169, 16, -169);
  context.quadraticCurveTo(5, -157, -4, -170);
  context.quadraticCurveTo(-17, -156, -28, -167);
  context.quadraticCurveTo(-31, -158, -36, -154);
  context.closePath();
  fillStroke(context);

  context.fillStyle = VIOLET_STYLE.hairShadow;
  context.globalAlpha = 0.72;
  context.beginPath();
  context.moveTo(6, -190);
  context.bezierCurveTo(28, -189, 40, -173, 37, -151);
  context.quadraticCurveTo(30, -166, 17, -168);
  context.quadraticCurveTo(16, -180, 6, -190);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;

  context.strokeStyle = VIOLET_STYLE.hairMid;
  context.lineWidth = 6.5;
  context.beginPath();
  context.moveTo(-30, -160);
  context.quadraticCurveTo(-43, -137, -32, -112);
  context.moveTo(31, -158);
  context.quadraticCurveTo(42, -136, 31, -111);
  context.stroke();
  context.strokeStyle = VIOLET_STYLE.hairRim;
  context.lineWidth = 1.35;
  context.beginPath();
  context.moveTo(-28, -179);
  context.quadraticCurveTo(-13, -188, 2, -186);
  context.moveTo(-31, -151);
  context.quadraticCurveTo(-26, -164, -17, -168);
  context.moveTo(9, -183);
  context.quadraticCurveTo(20, -181, 29, -169);
  context.stroke();

  drawVioletFlyaway(context, -30, -174, -48, -184 + Math.sin(time * 3.1) * 2, -42, -159);
  drawVioletFlyaway(context, -17, -190, -31, -198 + Math.sin(time * 3.5) * 2, -33, -181);
  drawVioletFlyaway(context, 11, -189, 27, -196 + Math.sin(time * 2.8) * 1.8, 32, -176);
}

export function drawVioletGlasses(context) {
  context.save();
  context.fillStyle = VIOLET_STYLE.lenses;
  context.strokeStyle = VIOLET_STYLE.glasses;
  context.lineWidth = 3.5;
  context.lineJoin = 'round';
  context.lineCap = 'round';

  traceVioletLens(context, -32, -155, 31, 20, -0.7);
  context.fill();
  context.stroke();
  traceVioletLens(context, 1, -155, 31, 20, 0.7);
  context.fill();
  context.stroke();

  context.beginPath();
  context.moveTo(-1.5, -147);
  context.quadraticCurveTo(0, -149.5, 1.5, -147);
  context.stroke();
  context.beginPath();
  context.moveTo(-32, -149);
  context.quadraticCurveTo(-36, -150, -38, -146);
  context.moveTo(32, -149);
  context.quadraticCurveTo(36, -150, 38, -146);
  context.stroke();

  context.strokeStyle = VIOLET_STYLE.glassesLight;
  context.lineWidth = 1.25;
  context.beginPath();
  context.moveTo(-28, -152.5);
  context.quadraticCurveTo(-18, -155.5, -7, -152.5);
  context.moveTo(5, -152.5);
  context.quadraticCurveTo(16, -155.5, 28, -152.5);
  context.stroke();
  context.restore();
}

function traceVioletLens(context, x, y, width, height, skew) {
  context.beginPath();
  context.moveTo(x + 4 + skew, y);
  context.quadraticCurveTo(x + 1, y, x, y + 4);
  context.lineTo(x + 1 - skew * 0.3, y + height - 4);
  context.quadraticCurveTo(x + 1, y + height, x + 5, y + height);
  context.lineTo(x + width - 4, y + height - 1);
  context.quadraticCurveTo(x + width, y + height - 1, x + width, y + height - 5);
  context.lineTo(x + width - 1 + skew, y + 4);
  context.quadraticCurveTo(x + width - 1, y + 1, x + width - 5, y + 1);
  context.closePath();
}

function drawVioletCollar(context, trim) {
  context.fillStyle = '#efe3cc';
  context.beginPath();
  context.moveTo(-25, -100);
  context.lineTo(-3, -81);
  context.lineTo(0, -99);
  context.lineTo(3, -81);
  context.lineTo(25, -100);
  context.quadraticCurveTo(0, -111, -25, -100);
  context.closePath();
  fillStroke(context, 2.4);
  context.strokeStyle = trim;
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(-25, -96);
  context.quadraticCurveTo(0, -77, 25, -96);
  context.stroke();
}

function drawNpcLegs(context, kind, palette, pose = 'idle', time = 0) {
  const broad = kind === 'guide';
  const stride = pose === 'walking' ? Math.sin(time * 7.6) * 6 : 0;
  for (const side of [-1, 1]) {
    const x = side * (broad ? 27 : 20);
    context.strokeStyle = OUTLINE;
    context.lineWidth = broad ? 13 : 10;
    context.beginPath();
    context.moveTo(x, -8);
    context.lineTo(x + side * stride, 20);
    context.stroke();
    context.strokeStyle = palette.robeShadow;
    context.lineWidth = broad ? 8 : 6;
    context.stroke();

    const bootX = x + side * stride;
    context.fillStyle = broad ? '#382a23' : darken(palette.robeShadow, 0.11);
    context.beginPath();
    context.moveTo(bootX - 7, 14);
    context.quadraticCurveTo(bootX + side * 6, 12, bootX + side * 17, 19);
    context.quadraticCurveTo(bootX + side * 20, 25, bootX + side * 14, 29);
    context.lineTo(bootX - side * 8, 28);
    context.quadraticCurveTo(bootX - side * 11, 21, bootX - 7, 14);
    context.closePath();
    fillStroke(context, 2.5);
    context.strokeStyle = palette.accent;
    context.lineWidth = 1.7;
    context.beginPath();
    context.moveTo(bootX - side * 4, 21);
    context.lineTo(bootX + side * 12, 21);
    context.stroke();
  }
}

function drawNpcBackDetails(context, kind, palette) {
  if (kind === 'tailor') {
    context.fillStyle = palette.hairShadow ?? darken(palette.hair, 0.12);
    context.beginPath();
    context.ellipse(24, -163, 18, 22, 0.2, 0, Math.PI * 2);
    fillStroke(context, 1.8);
    context.fillStyle = palette.hair;
    context.beginPath();
    context.ellipse(21, -168, 12, 15, 0.25, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = palette.hairLight;
    context.lineWidth = 1.35;
    context.beginPath();
    context.arc(21, -168, 8, -1.9, 1.2);
    context.stroke();
  }
  if (kind === 'keeper') {
    context.fillStyle = darken(palette.hair, 0.12);
    context.beginPath();
    context.moveTo(20, -166);
    context.bezierCurveTo(43, -157, 45, -125, 31, -103);
    context.quadraticCurveTo(24, -92, 18, -108);
    context.bezierCurveTo(27, -130, 24, -151, 20, -166);
    context.closePath();
    fillStroke(context, 1.8);
    context.strokeStyle = palette.hairLight;
    context.lineWidth = 1.55;
    context.beginPath();
    context.moveTo(27, -154);
    context.bezierCurveTo(36, -141, 34, -122, 25, -108);
    context.stroke();
  }
}

function drawNpcBody(context, kind, palette) {
  const broad = kind === 'guide';
  const shoulder = broad ? 56 : kind === 'keeper' ? 39 : kind === 'tailor' ? 38 : 33;
  const hem = broad ? 74 : kind === 'tailor' ? 60 : kind === 'keeper' ? 55 : 48;
  const top = broad ? -114 : -100;
  context.fillStyle = palette.robe;
  context.beginPath();
  if (kind === 'tailor') {
    context.moveTo(-shoulder, top);
    context.bezierCurveTo(-45, -89, -37, -73, -31, -62);
    context.bezierCurveTo(-38, -45, -54, -18, -hem, 0);
    context.quadraticCurveTo(-20, 13, 0, 8);
    context.quadraticCurveTo(20, 13, hem, 0);
    context.bezierCurveTo(54, -18, 38, -45, 31, -62);
    context.bezierCurveTo(37, -73, 45, -89, shoulder, top);
  } else if (kind === 'keeper') {
    context.moveTo(-shoulder, top);
    context.bezierCurveTo(-48, -82, -43, -58, -47, -34);
    context.lineTo(-hem, 0);
    context.quadraticCurveTo(0, 13, hem, 0);
    context.lineTo(47, -34);
    context.bezierCurveTo(43, -58, 48, -82, shoulder, top);
  } else if (kind === 'wandmaker') {
    context.moveTo(-shoulder, top);
    context.bezierCurveTo(-39, -79, -42, -36, -hem, 0);
    context.quadraticCurveTo(-16, 9, 0, 5);
    context.quadraticCurveTo(16, 9, hem, 0);
    context.bezierCurveTo(42, -36, 39, -79, shoulder, top);
  } else {
    context.moveTo(-43, top - 2);
    context.bezierCurveTo(-58, top - 4, -65, -101, -64, -84);
    context.bezierCurveTo(-67, -57, -72, -23, -hem, 0);
    context.quadraticCurveTo(0, 12, hem, 0);
    context.bezierCurveTo(72, -23, 67, -57, 64, -84);
    context.bezierCurveTo(65, -101, 58, top - 4, 43, top - 2);
  }
  context.closePath();
  fillStroke(context, broad ? 2.15 : 1.9);

  context.strokeStyle = palette.accent;
  context.lineWidth = broad ? 8 : 6;
  context.beginPath();
  context.moveTo(-shoulder + 3, top + 11);
  context.quadraticCurveTo(0, top + (kind === 'tailor' ? 28 : 22), shoulder - 3, top + 11);
  context.stroke();

  context.fillStyle = SHADOW_WASH;
  context.beginPath();
  context.moveTo(5, top + 6);
  context.quadraticCurveTo(shoulder + 7, -70, hem - 7, -2);
  context.quadraticCurveTo(28, 7, 5, 5);
  context.closePath();
  context.fill();

  context.fillStyle = 'rgba(23,18,28,0.12)';
  context.beginPath();
  context.moveTo(-3, top + 18);
  context.bezierCurveTo(9, -70, 6, -27, 13, 4);
  context.quadraticCurveTo(2, 8, -7, 5);
  context.quadraticCurveTo(-1, -43, -3, top + 18);
  context.closePath();
  context.fill();

  context.fillStyle = 'rgba(238,198,132,0.1)';
  context.beginPath();
  context.moveTo(-shoulder + 4, top + 12);
  context.quadraticCurveTo(-hem + 4, -66, -hem + 7, -3);
  context.quadraticCurveTo(-45, 4, -27, 5);
  context.bezierCurveTo(-31, -29, -29, -78, -shoulder + 4, top + 12);
  context.closePath();
  context.fill();
  context.fillStyle = WARM_BOUNCE;
  context.beginPath();
  context.moveTo(-hem + 5, -8);
  context.quadraticCurveTo(0, 8, hem - 5, -8);
  context.lineTo(hem, 0);
  context.quadraticCurveTo(0, 15, -hem, 0);
  context.closePath();
  context.fill();

  drawNpcGarmentDetails(context, kind, palette, { shoulder, hem, top });
}

function drawNpcGarmentDetails(context, kind, palette, { shoulder, hem, top }) {
  context.save();
  context.strokeStyle = 'rgba(244,226,190,0.34)';
  context.lineWidth = 1.35;
  context.beginPath();
  context.moveTo(-shoulder + 12, top + 20);
  context.bezierCurveTo(-22, -73, -25, -27, -30, 1);
  context.moveTo(shoulder - 12, top + 20);
  context.bezierCurveTo(22, -73, 25, -27, 30, 1);
  context.moveTo(0, top + 22);
  context.quadraticCurveTo(-3, -42, 0, 6);
  context.stroke();

  if (kind === 'guide') {
    context.fillStyle = '#2e2927';
    context.beginPath();
    context.moveTo(-36, -106);
    context.lineTo(-11, -67);
    context.lineTo(0, -96);
    context.lineTo(11, -67);
    context.lineTo(36, -106);
    context.quadraticCurveTo(0, -116, -36, -106);
    context.closePath();
    context.fill();

    context.fillStyle = '#49372e';
    context.beginPath();
    context.moveTo(-17, -78);
    context.lineTo(0, -96);
    context.lineTo(17, -78);
    context.lineTo(21, -49);
    context.lineTo(-21, -49);
    context.closePath();
    context.fill();
    context.strokeStyle = 'rgba(228,193,137,0.28)';
    context.lineWidth = 1.2;
    context.stroke();

    context.strokeStyle = '#71573c';
    context.lineWidth = 7.5;
    context.beginPath();
    context.moveTo(-65, -45);
    context.quadraticCurveTo(0, -38, 65, -45);
    context.stroke();
    context.strokeStyle = 'rgba(240,202,132,0.34)';
    context.lineWidth = 1.4;
    context.beginPath();
    context.moveTo(-62, -48);
    context.quadraticCurveTo(0, -42, 62, -48);
    context.stroke();
    context.fillStyle = '#b98a43';
    context.beginPath();
    context.roundRect?.(-8, -51, 16, 14, 3);
    if (typeof context.roundRect === 'function') context.fill();
    else {
      context.fillRect(-8, -51, 16, 14);
    }
    for (const [x, y] of [[-42, -27], [42, -27]]) {
      context.fillStyle = x < 0 ? 'rgba(52,38,31,0.32)' : 'rgba(34,27,26,0.42)';
      context.beginPath();
      context.moveTo(x - 15, y - 8);
      context.lineTo(x + 15, y - 8);
      context.lineTo(x + 12, y + 12);
      context.quadraticCurveTo(x, y + 18, x - 12, y + 12);
      context.closePath();
      context.fill();
      context.strokeStyle = palette.accent;
      context.lineWidth = 1.25;
      context.stroke();
    }

    context.strokeStyle = 'rgba(225,192,141,0.24)';
    context.lineWidth = 1.1;
    for (const x of [-48, -32, 32, 48]) {
      context.beginPath();
      context.moveTo(x, -91 + Math.abs(x) * 0.3);
      context.quadraticCurveTo(x + (x < 0 ? -4 : 4), -61, x, -13);
      context.stroke();
    }
  } else if (kind === 'wandmaker') {
    context.fillStyle = '#222536';
    context.beginPath();
    context.moveTo(-27, -95);
    context.lineTo(-9, -59);
    context.lineTo(0, -79);
    context.lineTo(9, -59);
    context.lineTo(27, -95);
    context.lineTo(16, -99);
    context.lineTo(0, -86);
    context.lineTo(-16, -99);
    context.closePath();
    context.fill();
    context.strokeStyle = 'rgba(235,224,188,0.3)';
    context.lineWidth = 1.3;
    context.stroke();
    context.strokeStyle = '#171a29';
    context.lineWidth = 3.6;
    context.beginPath();
    context.moveTo(0, -78);
    context.lineTo(0, -3);
    context.stroke();
    for (const y of [-55, -34, -13]) {
      context.fillStyle = palette.accent;
      context.beginPath();
      context.arc(0, y, 3.1, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = 'rgba(255,249,217,0.72)';
      context.beginPath();
      context.arc(-0.8, y - 0.9, 0.85, 0, Math.PI * 2);
      context.fill();
    }
    context.strokeStyle = palette.accent;
    context.lineWidth = 2.4;
    context.beginPath();
    context.moveTo(-35, -8);
    context.quadraticCurveTo(0, -17, 35, -8);
    context.stroke();
    context.strokeStyle = 'rgba(227,218,188,0.24)';
    context.lineWidth = 1.25;
    context.beginPath();
    context.moveTo(-28, -80);
    context.bezierCurveTo(-32, -56, -34, -26, -38, -4);
    context.moveTo(28, -80);
    context.bezierCurveTo(32, -56, 34, -26, 38, -4);
    context.stroke();
  } else if (kind === 'tailor') {
    context.fillStyle = 'rgba(61,29,52,0.42)';
    context.beginPath();
    context.moveTo(-29, -91);
    context.bezierCurveTo(-18, -72, -18, -62, -27, -51);
    context.quadraticCurveTo(-15, -43, 0, -44);
    context.quadraticCurveTo(15, -43, 27, -51);
    context.bezierCurveTo(18, -62, 18, -72, 29, -91);
    context.quadraticCurveTo(0, -78, -29, -91);
    context.closePath();
    context.fill();
    context.strokeStyle = '#f3d597';
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(-25, -94);
    context.bezierCurveTo(-10, -70, 11, -51, 28, -22);
    context.stroke();
    context.strokeStyle = '#764c3f';
    context.lineWidth = 1.4;
    for (let index = 0; index < 5; index += 1) {
      const x = -16 + index * 8;
      const y = -78 + index * 10;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + 4, y - 3);
      context.stroke();
    }
    context.fillStyle = '#a93f5e';
    context.beginPath();
    context.arc(-31, -64, 9, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#f0d9b1';
    context.lineWidth = 1.5;
    for (let index = 0; index < 4; index += 1) {
      context.beginPath();
      context.moveTo(-34 + index * 2, -68);
      context.lineTo(-38 + index * 6, -78);
      context.stroke();
    }
    context.strokeStyle = 'rgba(249,224,177,0.34)';
    context.lineWidth = 1.25;
    for (const side of [-1, 1]) {
      context.beginPath();
      context.moveTo(side * 20, -41);
      context.bezierCurveTo(side * 28, -27, side * 39, -14, side * 49, -4);
      context.stroke();
    }
  } else if (kind === 'keeper') {
    context.fillStyle = '#a9aa78';
    context.beginPath();
    context.moveTo(-27, -88);
    context.lineTo(27, -88);
    context.lineTo(34, -14);
    context.quadraticCurveTo(0, -2, -34, -14);
    context.closePath();
    context.fill();
    context.strokeStyle = palette.accent;
    context.lineWidth = 2.5;
    context.stroke();
    context.fillStyle = 'rgba(44,62,48,0.2)';
    context.beginPath();
    context.moveTo(4, -87);
    context.lineTo(27, -87);
    context.lineTo(33, -15);
    context.quadraticCurveTo(19, -10, 5, -9);
    context.closePath();
    context.fill();
    context.beginPath();
    context.moveTo(-25, -35);
    context.quadraticCurveTo(0, -23, 25, -35);
    context.stroke();
    context.strokeStyle = 'rgba(255,241,188,0.35)';
    context.lineWidth = 1.25;
    context.beginPath();
    context.moveTo(-20, -79);
    context.quadraticCurveTo(-14, -45, -17, -17);
    context.moveTo(20, -79);
    context.quadraticCurveTo(14, -45, 17, -17);
    context.stroke();
    drawFourPointStar(context, 0, -19, 3.8);
  }
  context.restore();
}

function drawNpcArms(context, kind, palette, time) {
  const broad = kind === 'guide';
  const shoulderX = broad ? 49 : 32;
  const cuffX = broad ? 61 : 43;
  const handY = broad ? -37 : -30;
  const sway = Math.sin(time * 1.4) * (broad ? 1.5 : 2);
  for (const side of [-1, 1]) {
    context.save();
    context.scale(side, 1);
    context.fillStyle = palette.robe;
    context.strokeStyle = OUTLINE;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(shoulderX - (broad ? 13 : 9), broad ? -106 : -94);
    context.bezierCurveTo(shoulderX + 12, broad ? -107 : -94, cuffX + 8, -63, cuffX + sway + 6, handY - 8);
    context.quadraticCurveTo(cuffX + sway, handY + 3, cuffX + sway - 10, handY - 2);
    context.bezierCurveTo(cuffX - 9, -59, shoulderX - 14, -78, shoulderX - (broad ? 13 : 9), broad ? -106 : -94);
    context.closePath();
    context.fill();
    context.stroke();

    context.fillStyle = side > 0 ? 'rgba(34,27,35,0.2)' : 'rgba(238,201,143,0.08)';
    context.beginPath();
    context.moveTo(shoulderX + 2, broad ? -103 : -91);
    context.bezierCurveTo(shoulderX + 16, -78, cuffX + sway + 5, -52, cuffX + sway + 3, handY - 7);
    context.lineTo(cuffX + sway - 3, handY - 3);
    context.bezierCurveTo(cuffX - 4, -61, shoulderX - 3, -82, shoulderX + 2, broad ? -103 : -91);
    context.closePath();
    context.fill();

    context.strokeStyle = palette.accent;
    context.lineWidth = 2.2;
    context.beginPath();
    context.moveTo(cuffX + sway + 5, handY - 8);
    context.quadraticCurveTo(cuffX + sway, handY - 3, cuffX + sway - 8, handY - 3);
    context.stroke();
    context.strokeStyle = 'rgba(244,226,190,0.2)';
    context.lineWidth = 1.1;
    context.beginPath();
    context.moveTo(shoulderX - 2, broad ? -96 : -86);
    context.quadraticCurveTo(cuffX - 7, -66, cuffX + sway - 3, handY - 11);
    context.stroke();
    context.restore();
    drawHand(context, side * (shoulderX + 7 + sway), handY + 7, palette.skin, broad ? 9 : 7.5);
  }
}

function drawNpcHead(context, kind, palette, blinking, time, pose = 'idle') {
  const broad = kind === 'guide';
  const headY = broad ? -151 : -137;
  const rx = broad ? 41 : kind === 'wandmaker' ? 31 : kind === 'keeper' ? 35 : 34;
  const ry = broad ? 43 : kind === 'wandmaker' ? 41 : kind === 'keeper' ? 37 : 39;
  drawEar(context, -rx, headY, palette.skin, broad ? 8 : 6.5);
  drawEar(context, rx, headY, palette.skin, broad ? 8 : 6.5);

  context.fillStyle = palette.skin;
  context.beginPath();
  context.moveTo(0, headY - ry);
  if (kind === 'wandmaker') {
    context.bezierCurveTo(-22, headY - ry - 1, -rx - 2, headY - 18, -rx, headY + 2);
    context.bezierCurveTo(-29, headY + 24, -13, headY + ry - 1, 0, headY + ry + 2);
    context.bezierCurveTo(13, headY + ry - 1, 29, headY + 24, rx, headY + 2);
    context.bezierCurveTo(rx + 2, headY - 18, 22, headY - ry - 1, 0, headY - ry);
  } else if (kind === 'tailor') {
    context.bezierCurveTo(-23, headY - ry - 2, -rx - 2, headY - 16, -rx, headY + 4);
    context.bezierCurveTo(-31, headY + 26, -15, headY + ry, 0, headY + ry + 1);
    context.bezierCurveTo(17, headY + ry, 33, headY + 24, rx, headY + 2);
    context.bezierCurveTo(rx + 2, headY - 17, 23, headY - ry - 2, 0, headY - ry);
  } else if (kind === 'keeper') {
    context.bezierCurveTo(-25, headY - ry - 1, -rx - 2, headY - 14, -rx, headY + 7);
    context.bezierCurveTo(-30, headY + 31, -13, headY + ry, 0, headY + ry);
    context.bezierCurveTo(14, headY + ry, 32, headY + 30, rx, headY + 6);
    context.bezierCurveTo(rx + 2, headY - 15, 25, headY - ry - 1, 0, headY - ry);
  } else {
    context.bezierCurveTo(-29, headY - ry - 1, -rx - 3, headY - 15, -rx, headY + 7);
    context.bezierCurveTo(-35, headY + 29, -18, headY + ry, 0, headY + ry + 1);
    context.bezierCurveTo(18, headY + ry, 35, headY + 29, rx, headY + 7);
    context.bezierCurveTo(rx + 3, headY - 15, 29, headY - ry - 1, 0, headY - ry);
  }
  context.closePath();
  fillStroke(context, broad ? 2.1 : 1.8);

  context.fillStyle = darken(palette.skin, broad ? 0.16 : 0.13);
  context.globalAlpha = broad ? 0.24 : 0.2;
  context.beginPath();
  context.moveTo(rx * 0.22, headY - ry + 3);
  context.bezierCurveTo(rx * 0.9, headY - ry * 0.64, rx * 1.02, headY + 11, rx * 0.58, headY + ry * 0.75);
  context.quadraticCurveTo(rx * 0.22, headY + ry, rx * 0.03, headY + ry * 0.82);
  context.quadraticCurveTo(rx * 0.36, headY + 11, rx * 0.22, headY - ry + 3);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;

  context.fillStyle = 'rgba(255,226,181,0.2)';
  context.beginPath();
  context.ellipse(-rx * 0.3, headY - ry * 0.48, rx * 0.34, ry * 0.18, -0.4, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = palette.cheek;
  context.globalAlpha = 0.22;
  context.beginPath();
  context.ellipse(-rx * 0.62, headY + 13, broad ? 10 : 8, 4.5, -0.1, 0, Math.PI * 2);
  context.ellipse(rx * 0.62, headY + 13, broad ? 10 : 8, 4.5, 0.1, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;

  const eyeY = headY - 4;
  const gazeX = Math.sin(time * 0.62 + kind.length) * (broad ? 1.1 : 1.4);
  const gazeY = Math.sin(time * 0.39 + kind.length * 0.7) * 0.55;
  if (broad) {
    drawRuggedEyes(context, eyeY, blinking, gazeX, gazeY);
  } else {
    drawIllustratedEyes(
      context,
      -12,
      eyeY,
      12,
      eyeY,
      kind === 'wandmaker' ? '#71808d' : '#493228',
      blinking,
      kind === 'wandmaker' ? 3.7 : 3.9,
      gazeX,
      gazeY,
      { browLift: kind === 'wandmaker' ? -1.5 : kind === 'tailor' ? 1.1 : 0 },
    );
  }
  context.strokeStyle = darken(palette.skin, 0.28);
  context.lineWidth = broad ? 1.45 : 1.25;
  context.beginPath();
  context.moveTo(kind === 'wandmaker' ? 1 : broad ? -2 : 0, headY - 3);
  context.quadraticCurveTo(kind === 'wandmaker' ? -4 : broad ? -6 : -2, headY + 9, broad ? 5 : kind === 'keeper' ? 4 : 3, headY + 10);
  context.stroke();
  if (broad) {
    context.fillStyle = darken(palette.skin, 0.04);
    context.beginPath();
    context.ellipse(0, headY + 6, 8.5, 6.4, -0.08, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = 'rgba(76,48,39,0.42)';
    context.lineWidth = 1.2;
    context.stroke();
    context.fillStyle = 'rgba(255,222,174,0.24)';
    context.beginPath();
    context.ellipse(-2.8, headY + 3.8, 2.7, 1.5, -0.35, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = 'rgba(98,54,43,0.32)';
    context.lineWidth = 1.2;
    context.beginPath();
    context.moveTo(-8, headY + 11);
    context.quadraticCurveTo(0, headY + 15, 8, headY + 11);
    context.stroke();
    context.strokeStyle = 'rgba(88,56,43,0.34)';
    context.lineWidth = 1.1;
    context.beginPath();
    context.moveTo(-31, eyeY + 7);
    context.quadraticCurveTo(-24, eyeY + 11, -19, eyeY + 9);
    context.moveTo(19, eyeY + 9);
    context.quadraticCurveTo(25, eyeY + 11, 31, eyeY + 7);
    context.stroke();
  }
  if (kind === 'wandmaker') {
    context.strokeStyle = 'rgba(92,72,67,0.36)';
    context.lineWidth = 1.1;
    context.beginPath();
    context.moveTo(-25, eyeY + 10);
    context.quadraticCurveTo(-17, eyeY + 14, -9, eyeY + 11);
    context.moveTo(9, eyeY + 11);
    context.quadraticCurveTo(17, eyeY + 14, 25, eyeY + 10);
    context.moveTo(-10, headY + 25);
    context.quadraticCurveTo(0, headY + 28, 10, headY + 24);
    context.stroke();
  } else if (kind === 'tailor') {
    context.strokeStyle = darken(palette.hair, 0.08);
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(-21, eyeY - 1);
    context.quadraticCurveTo(-15, eyeY + 3, -8, eyeY + 1);
    context.moveTo(8, eyeY + 1);
    context.quadraticCurveTo(15, eyeY + 3, 21, eyeY - 1);
    context.stroke();
  } else if (kind === 'keeper') {
    context.fillStyle = 'rgba(128,68,47,0.5)';
    context.beginPath();
    for (const [x, y] of [[-20, 8], [-14, 10], [-8, 8], [9, 9], [15, 11], [21, 7]]) {
      context.moveTo(x + 1.2, headY + y);
      context.arc(x, headY + y, 1.2, 0, Math.PI * 2);
    }
    context.fill();
  }
  drawExpressiveMouth(context, 0, headY + 20, broad ? 11 : 9, darken(palette.cheek, 0.13), pose, time);

  drawNpcHair(context, kind, palette, headY, rx, ry, time);
  drawNpcHairPlanes(context, kind, palette, headY, rx, ry);
}

function drawNpcHair(context, kind, palette, headY, rx, ry, time) {
  context.fillStyle = palette.hair;

  if (kind === 'wandmaker') {
    context.beginPath();
    context.moveTo(-rx + 2, headY - 13);
    context.bezierCurveTo(-31, headY - 43, -13, headY - ry - 5, 2, headY - ry + 3);
    context.quadraticCurveTo(18, headY - ry - 8, rx - 2, headY - 12);
    context.quadraticCurveTo(20, headY - 25, 9, headY - 23);
    context.quadraticCurveTo(-5, headY - 33, -17, headY - 19);
    context.quadraticCurveTo(-27, headY - 27, -rx + 2, headY - 13);
    context.closePath();
    fillStroke(context);
    context.strokeStyle = palette.hairLight;
    context.lineWidth = 2.2;
    for (const [x, offset] of [[-23, 2], [-8, -2], [9, 1], [23, 4]]) {
      context.beginPath();
      context.moveTo(x, headY - 34 + offset);
      context.quadraticCurveTo(x - 4, headY - 22, x + 2, headY - 11);
      context.stroke();
    }
    drawFlyaway(context, -19, headY - ry + 3, -30, headY - ry - 10 + Math.sin(time * 2.6) * 2, palette.hair);
    return;
  }

  if (kind === 'tailor') {
    context.beginPath();
    context.arc(0, headY - 9, rx + 1, Math.PI, Math.PI * 2);
    context.quadraticCurveTo(28, headY - 22, 17, headY - 14);
    context.quadraticCurveTo(3, headY - 29, -8, headY - 15);
    context.quadraticCurveTo(-23, headY - 24, -rx, headY - 9);
    context.closePath();
    fillStroke(context);
    context.strokeStyle = palette.hairLight;
    context.lineWidth = 2;
    for (const x of [-23, -11, 4, 18]) {
      context.beginPath();
      context.moveTo(x, headY - 33);
      context.quadraticCurveTo(x + 5, headY - 23, x + 2, headY - 13);
      context.stroke();
    }
    return;
  }

  if (kind === 'keeper') {
    context.beginPath();
    context.moveTo(-rx + 1, headY - 8);
    context.bezierCurveTo(-31, headY - 40, -8, headY - ry - 8, 15, headY - ry + 1);
    context.bezierCurveTo(32, headY - 34, rx + 2, headY - 17, rx - 1, headY - 4);
    context.quadraticCurveTo(21, headY - 22, 7, headY - 15);
    context.quadraticCurveTo(-9, headY - 28, -rx + 1, headY - 8);
    context.closePath();
    fillStroke(context);
    context.strokeStyle = palette.hairLight;
    context.lineWidth = 2.2;
    for (const [x, bend] of [[-24, -3], [-10, 5], [5, -4], [20, 4]]) {
      context.beginPath();
      context.moveTo(x, headY - 35);
      context.quadraticCurveTo(x + bend, headY - 24, x + 1, headY - 11);
      context.stroke();
    }
    return;
  }

  context.beginPath();
  context.moveTo(-rx + 1, headY - 8);
  context.bezierCurveTo(-37, headY - 40, -18, headY - ry - 7, 2, headY - ry - 1);
  context.bezierCurveTo(27, headY - ry - 8, rx + 2, headY - 22, rx - 1, headY - 8);
  context.quadraticCurveTo(25, headY - 27, 12, headY - 20);
  context.quadraticCurveTo(1, headY - 35, -11, headY - 20);
  context.quadraticCurveTo(-24, headY - 30, -rx + 1, headY - 8);
  context.closePath();
  fillStroke(context);
  context.strokeStyle = palette.hairLight;
  context.lineWidth = 2.4;
  for (const [x, bend] of [[-27, 5], [-14, -4], [0, 5], [14, -5], [27, 3]]) {
    context.beginPath();
    context.moveTo(x, headY - 37 + Math.abs(x) * 0.12);
    context.quadraticCurveTo(x + bend, headY - 26, x, headY - 12);
    context.stroke();
  }
}

function drawNpcHairPlanes(context, kind, palette, headY, rx, ry) {
  context.save();
  context.fillStyle = darken(palette.hair, kind === 'wandmaker' ? 0.08 : 0.13);
  context.globalAlpha = kind === 'wandmaker' ? 0.24 : 0.34;
  context.beginPath();
  context.moveTo(2, headY - ry + 1);
  context.bezierCurveTo(rx * 0.74, headY - ry + 1, rx + 1, headY - 20, rx - 1, headY - 8);
  context.quadraticCurveTo(rx * 0.62, headY - 21, rx * 0.18, headY - 18);
  context.quadraticCurveTo(rx * 0.12, headY - 31, 2, headY - ry + 1);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;

  context.strokeStyle = kind === 'wandmaker' ? 'rgba(255,249,222,0.55)' : 'rgba(246,203,139,0.3)';
  context.lineWidth = 1.15;
  context.beginPath();
  context.moveTo(-rx * 0.58, headY - ry * 0.58);
  context.quadraticCurveTo(-rx * 0.3, headY - ry * 0.9, -3, headY - ry * 0.84);
  context.moveTo(rx * 0.03, headY - ry * 0.88);
  context.quadraticCurveTo(rx * 0.38, headY - ry * 0.9, rx * 0.68, headY - ry * 0.52);
  context.stroke();

  if (kind === 'keeper') {
    context.strokeStyle = 'rgba(102,55,37,0.48)';
    context.lineWidth = 1.05;
    context.beginPath();
    for (let index = 0; index < 4; index += 1) {
      const y = headY - 12 + index * 8;
      context.moveTo(25, y);
      context.quadraticCurveTo(34, y + 4, 27, y + 8);
    }
    context.stroke();
  }
  context.restore();
}

function drawNpcAccessory(context, kind, palette) {
  if (kind === 'guide') {
    context.fillStyle = '#30231f';
    context.beginPath();
    context.moveTo(-32, -145);
    context.bezierCurveTo(-37, -128, -31, -110, -21, -102);
    context.quadraticCurveTo(-17, -89, -7, -84);
    context.quadraticCurveTo(-1, -93, 2, -82);
    context.quadraticCurveTo(10, -91, 17, -101);
    context.bezierCurveTo(30, -110, 36, -128, 32, -145);
    context.quadraticCurveTo(18, -131, 8, -136);
    context.quadraticCurveTo(0, -126, -8, -136);
    context.quadraticCurveTo(-18, -130, -32, -145);
    context.closePath();
    fillStroke(context, 1.8);

    context.fillStyle = '#211b1a';
    context.globalAlpha = 0.55;
    context.beginPath();
    context.moveTo(3, -133);
    context.quadraticCurveTo(22, -130, 31, -144);
    context.bezierCurveTo(35, -122, 27, -104, 16, -97);
    context.quadraticCurveTo(10, -87, 2, -82);
    context.closePath();
    context.fill();
    context.globalAlpha = 1;

    context.fillStyle = '#463027';
    context.globalAlpha = 0.72;
    context.beginPath();
    context.moveTo(-28, -139);
    context.bezierCurveTo(-32, -123, -25, -108, -17, -100);
    context.quadraticCurveTo(-15, -91, -8, -86);
    context.quadraticCurveTo(-10, -104, -16, -124, -28, -139);
    context.closePath();
    context.moveTo(-8, -132);
    context.bezierCurveTo(-8, -114, -3, -97, 1, -84);
    context.quadraticCurveTo(5, -99, 4, -119, -8, -132);
    context.closePath();
    context.fill();
    context.globalAlpha = 1;

    context.fillStyle = 'rgba(111,72,52,0.34)';
    context.beginPath();
    context.moveTo(-24, -132);
    context.quadraticCurveTo(-20, -111, -12, -96);
    context.lineTo(-7, -89);
    context.quadraticCurveTo(-12, -112, -14, -130);
    context.closePath();
    context.moveTo(7, -128);
    context.quadraticCurveTo(12, -110, 9, -92);
    context.lineTo(15, -99);
    context.quadraticCurveTo(22, -114, 24, -132);
    context.closePath();
    context.fill();

    context.fillStyle = '#3a2923';
    context.beginPath();
    context.moveTo(-29, -145);
    context.bezierCurveTo(-22, -154, -10, -151, -2, -143);
    context.quadraticCurveTo(-11, -132, -25, -136);
    context.closePath();
    context.moveTo(29, -145);
    context.bezierCurveTo(22, -154, 10, -151, 2, -143);
    context.quadraticCurveTo(11, -132, 25, -136);
    context.closePath();
    context.fill();
    context.strokeStyle = DEEP_OUTLINE;
    context.lineWidth = 1.5;
    context.stroke();

    context.strokeStyle = '#72503b';
    context.lineWidth = 1.25;
    context.beginPath();
    context.moveTo(-25, -135);
    context.bezierCurveTo(-23, -116, -15, -101, -8, -90);
    context.moveTo(-14, -129);
    context.bezierCurveTo(-13, -111, -7, -99, -2, -86);
    context.moveTo(14, -129);
    context.bezierCurveTo(14, -112, 8, -98, 3, -86);
    context.moveTo(25, -135);
    context.bezierCurveTo(24, -116, 17, -103, 10, -91);
    context.stroke();

    context.strokeStyle = 'rgba(231,190,128,0.23)';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(-28, -139);
    context.quadraticCurveTo(-25, -116, -16, -105);
    context.moveTo(-5, -133);
    context.quadraticCurveTo(-2, -109, 1, -90);
    context.stroke();
  } else if (kind === 'tailor') {
    context.strokeStyle = palette.accent;
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(-22, -96);
    context.quadraticCurveTo(0, -68, 22, -96);
    context.stroke();
    context.fillStyle = '#f0e3c8';
    context.beginPath();
    context.arc(0, -77, 4.5, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#d8b76d';
    context.lineWidth = 2.6;
    context.beginPath();
    context.moveTo(33, -59);
    context.lineTo(45, -43);
    context.moveTo(45, -59);
    context.lineTo(33, -43);
    context.stroke();
    context.beginPath();
    context.arc(32, -63, 5.5, 0, Math.PI * 2);
    context.arc(46, -63, 5.5, 0, Math.PI * 2);
    context.stroke();
  } else if (kind === 'keeper') {
    context.fillStyle = 'rgba(240,227,200,0.32)';
    context.beginPath();
    context.moveTo(-22, -88);
    context.lineTo(22, -88);
    context.lineTo(30, -16);
    context.quadraticCurveTo(0, -7, -30, -16);
    context.closePath();
    context.fill();
    context.strokeStyle = palette.accent;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(-19, -62);
    context.quadraticCurveTo(0, -54, 19, -62);
    context.stroke();
    context.fillStyle = '#6d4c35';
    context.beginPath();
    context.roundRect?.(29, -64, 24, 32, 4);
    if (typeof context.roundRect === 'function') context.fill();
    else context.fillRect(29, -64, 24, 32);
    context.fillStyle = '#ead8ad';
    context.fillRect(34, -59, 14, 2);
    context.fillRect(34, -53, 11, 2);
  } else if (kind === 'wandmaker') {
    context.strokeStyle = palette.accent;
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(-19, -139);
    context.quadraticCurveTo(-12, -146, -5, -139);
    context.moveTo(5, -139);
    context.quadraticCurveTo(12, -146, 19, -139);
    context.stroke();
    context.strokeStyle = '#6d4b31';
    context.lineWidth = 3.5;
    context.beginPath();
    context.moveTo(29, -53);
    context.lineTo(53, -91);
    context.stroke();
    context.fillStyle = palette.accent;
    drawFourPointStar(context, 54, -93, 3.5);
  }
}

function drawCat(context, time, motion) {
  context.strokeStyle = OUTLINE;
  context.lineWidth = 8;
  context.beginPath();
  context.moveTo(18, -25);
  context.bezierCurveTo(48, -31, 48 + motion.tailSway * 12, -66, 30 + motion.tailSway * 7, -72);
  context.stroke();
  context.strokeStyle = '#936d51';
  context.lineWidth = 4.8;
  context.stroke();
  context.strokeStyle = 'rgba(83,57,47,0.56)';
  context.lineWidth = 2.1;
  for (let index = 0; index < 3; index += 1) {
    const y = -40 - index * 9;
    context.beginPath();
    context.moveTo(37 + motion.tailSway * 5, y + 4);
    context.quadraticCurveTo(44 + motion.tailSway * 8, y, 43 + motion.tailSway * 8, y - 5);
    context.stroke();
  }

  const step = motion.step * 3;
  for (const side of [-1, 1]) {
    const pawLift = side > 0 ? motion.pawLift * 24 : 0;
    context.fillStyle = side < 0 ? '#9a7255' : '#7e5c48';
    context.beginPath();
    context.moveTo(side * 5, -25);
    context.bezierCurveTo(side * 18, -24, side * (23 + step), -13 - pawLift, side * (20 + step), -2 - pawLift);
    context.quadraticCurveTo(side * (14 + step), 4 - pawLift, side * (7 + step), -2);
    context.quadraticCurveTo(side * 12, -14, side * 5, -25);
    context.closePath();
    fillStroke(context, 1.8);
  }

  context.fillStyle = '#a77c5b';
  context.beginPath();
  context.moveTo(-14, -59);
  context.bezierCurveTo(-29, -50, -30, -25, -22, -8);
  context.quadraticCurveTo(-11, 0, 0, -3);
  context.quadraticCurveTo(12, 0, 23, -9);
  context.bezierCurveTo(30, -28, 27, -51, 13, -59);
  context.quadraticCurveTo(0, -66, -14, -59);
  context.closePath();
  fillStroke(context, 1.9);

  context.fillStyle = 'rgba(71,48,43,0.22)';
  context.beginPath();
  context.moveTo(4, -60);
  context.bezierCurveTo(25, -51, 30, -27, 22, -9);
  context.quadraticCurveTo(13, -1, 4, -3);
  context.quadraticCurveTo(12, -29, 4, -60);
  context.closePath();
  context.fill();

  context.fillStyle = '#c99b72';
  context.beginPath();
  context.moveTo(-13, -55);
  context.quadraticCurveTo(-6, -48, 0, -56);
  context.quadraticCurveTo(7, -48, 14, -54);
  context.bezierCurveTo(18, -38, 13, -20, 0, -10);
  context.bezierCurveTo(-13, -20, -18, -38, -13, -55);
  context.closePath();
  context.fill();
  context.strokeStyle = 'rgba(92,63,47,0.32)';
  context.lineWidth = 1.35;
  for (const x of [-8, 0, 8]) {
    context.beginPath();
    context.moveTo(x, -46);
    context.quadraticCurveTo(x - 3, -31, x, -17);
    context.stroke();
  }

  context.fillStyle = '#936d51';
  context.beginPath();
  context.moveTo(-23, -77);
  context.lineTo(-13, -97);
  context.lineTo(-4, -80);
  context.closePath();
  context.moveTo(23, -77);
  context.lineTo(13, -97);
  context.lineTo(4, -80);
  context.closePath();
  context.fill();
  context.strokeStyle = OUTLINE;
  context.lineWidth = 1.8;
  context.stroke();
  context.fillStyle = '#d7a9a0';
  context.beginPath();
  context.moveTo(-19, -80);
  context.lineTo(-13, -91);
  context.lineTo(-8, -80);
  context.closePath();
  context.moveTo(19, -80);
  context.lineTo(13, -91);
  context.lineTo(8, -80);
  context.closePath();
  context.fill();

  context.fillStyle = '#a77c5b';
  context.beginPath();
  context.moveTo(0, -91);
  context.bezierCurveTo(-18, -94, -28, -83, -28, -67);
  context.bezierCurveTo(-29, -52, -18, -43, 0, -41);
  context.bezierCurveTo(18, -43, 29, -52, 28, -67);
  context.bezierCurveTo(28, -83, 18, -94, 0, -91);
  context.closePath();
  fillStroke(context, 1.9);

  context.fillStyle = 'rgba(77,51,43,0.2)';
  context.beginPath();
  context.moveTo(5, -90);
  context.bezierCurveTo(23, -87, 29, -73, 26, -58);
  context.quadraticCurveTo(18, -43, 5, -42);
  context.quadraticCurveTo(12, -67, 5, -90);
  context.closePath();
  context.fill();

  context.fillStyle = '#d1a37d';
  context.beginPath();
  context.ellipse(-8, -55, 10, 8, -0.12, 0, Math.PI * 2);
  context.ellipse(8, -55, 10, 8, 0.12, 0, Math.PI * 2);
  context.fill();

  const blink = isBlinking(time, 0.8);
  drawIllustratedEyes(context, -9, -67, 9, -67, '#b58f35', blink, 3.9,
    Math.sin(time * 0.74) * 1.1, Math.sin(time * 0.43) * 0.45, { browLift: 0.4 });
  context.fillStyle = '#865a58';
  context.beginPath();
  context.moveTo(-3, -57);
  context.lineTo(3, -57);
  context.lineTo(0, -53);
  context.closePath();
  context.fill();
  context.strokeStyle = '#67453e';
  context.lineWidth = 1.25;
  context.beginPath();
  context.moveTo(0, -53);
  context.quadraticCurveTo(-1, -49, -5, -48);
  context.moveTo(0, -53);
  context.quadraticCurveTo(1, -49, 5, -48);
  context.stroke();
  context.fillStyle = 'rgba(92,61,49,0.45)';
  context.beginPath();
  for (const x of [-12, -8, 8, 12]) {
    context.moveTo(x + 0.7, -54);
    context.arc(x, -54, 0.7, 0, Math.PI * 2);
  }
  context.fill();
  context.strokeStyle = '#5f4438';
  context.lineWidth = 1.25;
  context.beginPath();
  context.moveTo(-4, -52);
  context.lineTo(-19, -48);
  context.moveTo(-4, -49);
  context.lineTo(-20, -43);
  context.moveTo(4, -52);
  context.lineTo(19, -48);
  context.moveTo(4, -49);
  context.lineTo(20, -43);
  context.stroke();

  context.strokeStyle = '#785641';
  context.lineWidth = 2.1;
  context.beginPath();
  context.moveTo(-11, -87);
  context.quadraticCurveTo(-8, -79, -5, -76);
  context.moveTo(0, -91);
  context.quadraticCurveTo(0, -81, 0, -77);
  context.moveTo(11, -87);
  context.quadraticCurveTo(8, -79, 5, -76);
  context.stroke();

  context.fillStyle = '#5f4b68';
  context.strokeStyle = OUTLINE;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-18, -45);
  context.quadraticCurveTo(0, -39, 18, -45);
  context.lineTo(17, -39);
  context.quadraticCurveTo(0, -34, -17, -39);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = '#e1b857';
  context.beginPath();
  context.arc(0, -36, 4.2, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.strokeStyle = 'rgba(255,231,168,0.56)';
  context.lineWidth = 1.45;
  for (const [x1, y1, x2, y2] of [[-19, -78, -10, -84], [5, -86, 15, -79], [-14, -31, -7, -25]]) {
    context.beginPath();
    context.moveTo(x1, y1);
    context.quadraticCurveTo((x1 + x2) / 2, y1 - 3, x2, y2);
    context.stroke();
  }
  drawCatPaws(context, motion);
  drawUpperLeftRim(context, [[-23, -76], [-15, -90], [-3, -92], [8, -87]], 2.2);
}

function drawToad(context, time, motion) {
  context.fillStyle = '#526944';
  context.beginPath();
  context.moveTo(-8, -18);
  context.bezierCurveTo(-24, -18, -32 - motion.step * 2, -12, -43 - motion.step * 2, -2);
  context.quadraticCurveTo(-29, 5, -13, -2);
  context.closePath();
  context.moveTo(8, -18);
  context.bezierCurveTo(24, -18, 32 + motion.step * 2, -12, 43 + motion.step * 2, -2);
  context.quadraticCurveTo(29, 5, 13, -2);
  context.closePath();
  fillStroke(context, 1.8);

  context.strokeStyle = '#46563b';
  context.lineWidth = 2.2;
  for (const side of [-1, 1]) {
    const origin = side * (32 + motion.step * 2);
    for (let toe = -1; toe <= 1; toe += 1) {
      context.beginPath();
      context.moveTo(origin, -4);
      context.quadraticCurveTo(origin + side * 7, 0, origin + side * (13 + toe * 2), 2 + Math.abs(toe));
      context.stroke();
    }
  }
  context.fillStyle = '#7f965f';
  context.beginPath();
  context.moveTo(0, -49);
  context.bezierCurveTo(-24, -52, -36, -39, -35, -21);
  context.bezierCurveTo(-34, -4, -19, 2, 0, 0);
  context.bezierCurveTo(19, 2, 34, -4, 35, -21);
  context.bezierCurveTo(36, -39, 24, -52, 0, -49);
  context.closePath();
  fillStroke(context, 1.9);
  context.fillStyle = 'rgba(48,65,42,0.28)';
  context.beginPath();
  context.moveTo(5, -49);
  context.bezierCurveTo(28, -47, 37, -34, 34, -17);
  context.quadraticCurveTo(27, -2, 7, 0);
  context.quadraticCurveTo(14, -24, 5, -49);
  context.closePath();
  context.fill();

  context.fillStyle = '#869c67';
  context.beginPath();
  context.ellipse(-15, -46, 12, 11, -0.1, 0, Math.PI * 2);
  context.ellipse(15, -46, 12, 11, 0.1, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = OUTLINE;
  context.lineWidth = 1.8;
  context.stroke();
  const blink = isBlinking(time, 2.1);
  drawIllustratedEyes(context, -15, -47, 15, -47, '#c3a442', blink, 4.2,
    Math.sin(time * 0.53) * 0.9, Math.sin(time * 0.31 + 2) * 0.35, { browLift: -0.4 });
  context.fillStyle = `rgba(213,195,115,${0.2 + motion.throatPulse * 0.2})`;
  context.beginPath();
  context.ellipse(0, -17, 19 + motion.throatPulse * 2, 12 + motion.throatPulse * 3, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = 'rgba(232, 214, 129, 0.38)';
  context.beginPath();
  context.arc(-12, -24, 4, 0, Math.PI * 2);
  context.arc(15, -17, 3, 0, Math.PI * 2);
  context.arc(2, -33, 2.5, 0, Math.PI * 2);
  context.arc(-24, -31, 2.8, 0, Math.PI * 2);
  context.arc(25, -28, 2.2, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = 'rgba(55,73,45,0.42)';
  context.beginPath();
  for (const [x, y, r] of [[-20, -17, 2.6], [19, -34, 2.2], [8, -8, 1.8], [-4, -39, 1.5]]) {
    context.moveTo(x + r, y);
    context.arc(x, y, r, 0, Math.PI * 2);
  }
  context.fill();
  context.strokeStyle = '#39442f';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-10, -12);
  context.quadraticCurveTo(0, -6, 10, -12);
  context.stroke();
  context.strokeStyle = 'rgba(51,65,42,0.5)';
  context.lineWidth = 1.2;
  context.beginPath();
  context.moveTo(-29, -17);
  context.quadraticCurveTo(-19, -12, -13, -6);
  context.moveTo(29, -17);
  context.quadraticCurveTo(19, -12, 13, -6);
  context.stroke();
  context.strokeStyle = 'rgba(244,231,165,0.48)';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-25, -30);
  context.quadraticCurveTo(-17, -44, -7, -46);
  context.stroke();
  drawUpperLeftRim(context, [[-31, -28], [-24, -44], [-15, -55], [0, -51]], 2.1);
}

function drawCatPaws(context, motion) {
  context.fillStyle = '#a98061';
  context.beginPath();
  context.ellipse(-14, -2, 12, 6, 0, 0, Math.PI * 2);
  if (motion.pawLift <= 0) context.ellipse(14, -2, 12, 6, 0, 0, Math.PI * 2);
  fillStroke(context, 2.2);

  if (motion.pawLift <= 0) return;
  const pawY = -13 - motion.pawLift * 50;
  context.fillStyle = '#9a7255';
  context.beginPath();
  context.moveTo(7, -22);
  context.bezierCurveTo(11, -31, 15, pawY + 14, 23, pawY + 7);
  context.quadraticCurveTo(31, pawY - 2, 39, pawY + 1);
  context.quadraticCurveTo(45, pawY + 7, 39, pawY + 13);
  context.quadraticCurveTo(33, pawY + 18, 26, pawY + 12);
  context.bezierCurveTo(21, pawY + 19, 19, -22, 15, -10);
  context.quadraticCurveTo(9, -10, 7, -22);
  context.closePath();
  fillStroke(context, 2);

  context.strokeStyle = 'rgba(87,58,47,0.52)';
  context.lineWidth = 1.2;
  context.beginPath();
  context.moveTo(32, pawY + 1);
  context.quadraticCurveTo(34, pawY + 5, 31, pawY + 9);
  context.moveTo(38, pawY + 3);
  context.quadraticCurveTo(40, pawY + 7, 36, pawY + 11);
  context.stroke();
}

function drawSmile(context, x, y, radius, color) {
  context.strokeStyle = color;
  context.lineWidth = 2.3;
  context.beginPath();
  context.arc(x, y - radius * 0.18, radius, 0.15 * Math.PI, 0.85 * Math.PI);
  context.stroke();
}

function drawExpressiveMouth(context, x, y, radius, color, pose, time) {
  if (pose === 'speaking') {
    const open = 2.8 + Math.abs(Math.sin(time * 8.4)) * 3.2;
    context.fillStyle = color;
    context.strokeStyle = OUTLINE;
    context.lineWidth = 1.8;
    context.beginPath();
    context.ellipse(x, y + 1, radius * 0.52, open, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.fillStyle = 'rgba(247,176,168,0.66)';
    context.beginPath();
    context.ellipse(x, y + open * 0.55, radius * 0.31, Math.max(1, open * 0.28), 0, 0, Math.PI * 2);
    context.fill();
    return;
  }
  if (pose === 'curious') {
    context.strokeStyle = color;
    context.lineWidth = 2.3;
    context.beginPath();
    context.moveTo(x - radius * 0.78, y + 1);
    context.quadraticCurveTo(x - radius * 0.32, y + 3, x, y + 2);
    context.quadraticCurveTo(x + radius * 0.46, y - 1, x + radius * 0.78, y + 1);
    context.stroke();
    return;
  }
  drawSmile(context, x, y, radius, color);
}

function drawHand(context, x, y, color, radius) {
  const side = x < 0 ? -1 : 1;
  context.save();
  context.translate(x, y);
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(-side * radius * 0.7, -radius * 0.65);
  context.quadraticCurveTo(0, -radius * 1.05, side * radius * 0.65, -radius * 0.55);
  context.quadraticCurveTo(side * radius * 1.15, -radius * 0.18, side * radius * 0.72, radius * 0.25);
  context.quadraticCurveTo(side * radius * 1.18, radius * 0.46, side * radius * 0.63, radius * 0.78);
  context.quadraticCurveTo(0, radius * 1.05, -side * radius * 0.72, radius * 0.52);
  context.quadraticCurveTo(-side * radius, 0, -side * radius * 0.7, -radius * 0.65);
  context.closePath();
  fillStroke(context, 2.2);
  context.strokeStyle = 'rgba(255,231,168,0.4)';
  context.lineWidth = 1.5;
  context.beginPath();
  context.arc(-1.5, -1.5, Math.max(2, radius - 3), Math.PI, 1.5 * Math.PI);
  context.stroke();
  context.strokeStyle = 'rgba(87,52,42,0.35)';
  context.lineWidth = 1.1;
  context.beginPath();
  context.moveTo(-side * radius * 0.15, radius * 0.2);
  context.quadraticCurveTo(side * radius * 0.2, radius * 0.38, side * radius * 0.55, radius * 0.23);
  context.stroke();
  context.restore();
}

function drawEar(context, x, y, color, radius = 7) {
  context.fillStyle = color;
  context.beginPath();
  context.ellipse(x, y, radius, radius + 2, 0, 0, Math.PI * 2);
  fillStroke(context, 2.2);
  context.strokeStyle = 'rgba(120,67,65,0.34)';
  context.lineWidth = 1.5;
  context.beginPath();
  context.arc(x, y + 1, Math.max(2, radius - 3), -Math.PI / 2, Math.PI / 2);
  context.stroke();
}

function drawRuggedEyes(context, eyeY, blinking, gazeX, gazeY) {
  const eyes = [[-15, -1], [15, 1]];
  if (blinking) {
    context.strokeStyle = DEEP_OUTLINE;
    context.lineWidth = 2.3;
    context.beginPath();
    for (const [x, side] of eyes) {
      context.moveTo(x - 6, eyeY + side * 0.35);
      context.quadraticCurveTo(x, eyeY + 2.4, x + 6, eyeY - side * 0.35);
    }
    context.stroke();
  } else {
    for (const [x, side] of eyes) {
      context.fillStyle = '#f4e9d4';
      context.beginPath();
      context.moveTo(x - 7, eyeY + 0.5);
      context.quadraticCurveTo(x, eyeY - 5.8 - side * 0.4, x + 7, eyeY - 0.2);
      context.quadraticCurveTo(x, eyeY + 4.1 + side * 0.3, x - 7, eyeY + 0.5);
      context.closePath();
      context.fill();
      context.strokeStyle = DEEP_OUTLINE;
      context.lineWidth = 1.55;
      context.stroke();

      context.fillStyle = '#654533';
      context.beginPath();
      context.ellipse(x + gazeX * 0.7, eyeY + gazeY * 0.55, 3.1, 3.7, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#231a18';
      context.beginPath();
      context.arc(x + gazeX * 0.72, eyeY + gazeY * 0.58, 1.7, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = 'rgba(255,255,255,0.82)';
      context.beginPath();
      context.arc(x - 1 + gazeX * 0.65, eyeY - 1.5 + gazeY * 0.5, 0.85, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = 'rgba(70,43,35,0.58)';
      context.lineWidth = 1.15;
      context.beginPath();
      context.moveTo(x - 6, eyeY + 3.2);
      context.quadraticCurveTo(x, eyeY + 5.4, x + 5, eyeY + 3.2);
      context.stroke();
    }
  }

  context.strokeStyle = '#34241f';
  context.lineWidth = 3.5;
  context.beginPath();
  context.moveTo(-27, eyeY - 9);
  context.quadraticCurveTo(-18, eyeY - 13, -7, eyeY - 7);
  context.moveTo(7, eyeY - 7);
  context.quadraticCurveTo(18, eyeY - 13, 27, eyeY - 9);
  context.stroke();
  context.strokeStyle = 'rgba(132,86,58,0.38)';
  context.lineWidth = 1.05;
  context.beginPath();
  context.moveTo(-25, eyeY - 10);
  context.quadraticCurveTo(-17, eyeY - 12, -10, eyeY - 8);
  context.moveTo(10, eyeY - 8);
  context.quadraticCurveTo(17, eyeY - 12, 25, eyeY - 10);
  context.stroke();
}

function drawIllustratedEyes(
  context,
  leftX,
  leftY,
  rightX,
  rightY,
  iris,
  blinking,
  radius = 4.5,
  gazeX = 0,
  gazeY = 0,
  { browLift = 0 } = {},
) {
  const eyes = [[leftX, leftY, -1], [rightX, rightY, 1]];
  if (blinking) {
    context.strokeStyle = OUTLINE;
    context.lineWidth = 2.6;
    context.beginPath();
    for (const [x, y] of eyes) {
      context.moveTo(x - radius - 2, y);
      context.quadraticCurveTo(x, y + 2.6, x + radius + 2, y);
    }
    context.stroke();
  } else {
    for (const [x, y] of eyes) {
      context.fillStyle = '#fffaf0';
      context.beginPath();
      context.ellipse(x, y, radius + 2.2, radius + 3.2, 0, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = OUTLINE;
      context.lineWidth = 1.7;
      context.stroke();
      context.fillStyle = iris;
      context.beginPath();
      context.arc(x + gazeX, y + gazeY, radius, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#211916';
      context.beginPath();
      context.arc(x + gazeX * 1.05, y + gazeY * 1.05, radius * 0.52, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = 'rgba(255,255,255,0.9)';
      context.beginPath();
      context.arc(x + gazeX - radius * 0.3, y + gazeY - radius * 0.38, Math.max(1.1, radius * 0.24), 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = 'rgba(58,45,34,0.48)';
      context.lineWidth = 1.4;
      context.beginPath();
      context.arc(x, y, radius + 2.3, Math.PI, Math.PI * 2);
      context.stroke();
    }
  }

  context.strokeStyle = OUTLINE;
  context.lineWidth = 2.8;
  context.beginPath();
  for (const [x, y, side] of eyes) {
    context.moveTo(x - radius - 3, y - radius - 7 - browLift);
    context.quadraticCurveTo(x + side * 1.5, y - radius - 10 - browLift, x + radius + 3, y - radius - 6 + browLift * 0.2);
  }
  context.stroke();
}

function drawFourPointStar(context, x, y, radius) {
  context.beginPath();
  context.moveTo(x, y - radius);
  context.lineTo(x + radius * 0.33, y - radius * 0.33);
  context.lineTo(x + radius, y);
  context.lineTo(x + radius * 0.33, y + radius * 0.33);
  context.lineTo(x, y + radius);
  context.lineTo(x - radius * 0.33, y + radius * 0.33);
  context.lineTo(x - radius, y);
  context.lineTo(x - radius * 0.33, y - radius * 0.33);
  context.closePath();
  context.fill();
}

function drawVioletFlyaway(context, x1, y1, controlX, controlY, x2, y2) {
  context.strokeStyle = OUTLINE;
  context.lineWidth = 3.4;
  context.beginPath();
  context.moveTo(x1, y1);
  context.quadraticCurveTo(controlX, controlY, x2, y2);
  context.stroke();
  context.strokeStyle = VIOLET_STYLE.hairBase;
  context.lineWidth = 1.6;
  context.stroke();
}

function drawFlyaway(context, x1, y1, x2, y2, color = '#8b6b4a') {
  context.strokeStyle = OUTLINE;
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(x1, y1);
  context.quadraticCurveTo((x1 + x2) / 2, y2 - 5, x2, y2);
  context.stroke();
  context.strokeStyle = color;
  context.lineWidth = 2.6;
  context.stroke();
}

function drawUpperLeftRim(context, points, width) {
  if (!points.length) return;
  context.strokeStyle = RIM_LIGHT;
  context.lineWidth = width;
  context.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();
}

function fillStroke(context, lineWidth = null) {
  context.fill();
  const previous = context.lineWidth;
  if (lineWidth !== null) context.lineWidth = lineWidth;
  context.strokeStyle = OUTLINE;
  context.stroke();
  context.lineWidth = previous;
}

function isBlinking(time, phase) {
  const cycle = (time * 0.72 + phase) % 4.7;
  return cycle > 4.47;
}

function darken(hex, amount) {
  return shiftColor(hex, -Math.abs(amount));
}

function shiftColor(hex, amount) {
  const value = Number.parseInt(hex.slice(1), 16);
  const delta = Math.round(255 * amount);
  const r = Math.max(0, Math.min(255, (value >> 16) + delta));
  const g = Math.max(0, Math.min(255, ((value >> 8) & 0xff) + delta));
  const b = Math.max(0, Math.min(255, (value & 0xff) + delta));
  return `rgb(${r}, ${g}, ${b})`;
}
