import { PALETTE } from '../config.js';
import { drawVectorOwl } from './OwlRenderer.js';

const OUTLINE = '#3a2d22';
const RIM_LIGHT = 'rgba(255, 231, 168, 0.72)';
const SHADOW_WASH = 'rgba(37, 26, 35, 0.22)';

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
    prepare(context, 3.2);

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
    ], 3.1);

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
    prepare(context, 3.1);

    drawNpcLegs(context, kind, palette, character.pose, time + phase);
    drawNpcBackDetails(context, kind, palette);
    drawNpcBody(context, kind, palette);
    drawNpcArms(context, kind, palette, time + phase);
    drawNpcHead(context, kind, palette, blinking, time + phase, character.pose);
    drawNpcAccessory(context, kind, palette);
    drawUpperLeftRim(context, kind === 'guide'
      ? [[-55, -129], [-54, -161], [-37, -185], [-10, -197], [17, -192], [42, -174]]
      : [[-39, -132], [-34, -164], [-13, -182], [14, -180], [35, -160]], 2.8);

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
  context.fillStyle = '#826044';
  context.beginPath();
  context.moveTo(-34, -168);
  context.bezierCurveTo(-50, -151, -45, -111, -39, -79);
  context.quadraticCurveTo(-29, -63, -17, -77);
  context.quadraticCurveTo(-5, -59, 7, -77);
  context.quadraticCurveTo(23, -61, 35, -82);
  context.bezierCurveTo(47, -119, 45, -151, 31, -170);
  context.closePath();
  fillStroke(context);
  context.fillStyle = 'rgba(246, 211, 143, 0.2)';
  context.beginPath();
  context.moveTo(-29, -162);
  context.bezierCurveTo(-40, -133, -35, -103, -30, -84);
  context.quadraticCurveTo(-23, -78, -19, -87);
  context.bezierCurveTo(-24, -112, -19, -145, -8, -170);
  context.closePath();
  context.fill();
}

function drawVioletBackArm(context, stride, trim) {
  const swing = stride * 7;
  context.strokeStyle = OUTLINE;
  context.lineWidth = 18;
  context.beginPath();
  context.moveTo(-34, -91);
  context.quadraticCurveTo(-49, -61 + swing * 0.2, -45 - swing * 0.25, -34 + swing);
  context.stroke();
  context.strokeStyle = '#292532';
  context.lineWidth = 12;
  context.stroke();
  context.strokeStyle = trim;
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(-49 - swing * 0.25, -40 + swing);
  context.lineTo(-42 - swing * 0.25, -35 + swing);
  context.stroke();
  drawHand(context, -43 - swing * 0.25, -27 + swing, '#d9a17b', 8);
}

function drawVioletRobe(context, trim, time = 0) {
  context.fillStyle = '#2b2733';
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
  context.lineWidth = 2.2;
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
  context.strokeStyle = OUTLINE;
  context.lineWidth = 19;
  context.beginPath();
  context.moveTo(34, -91);
  context.quadraticCurveTo(48, -62 + swing * 0.15, 43 + swing * 0.25, -34 + swing);
  context.stroke();
  context.strokeStyle = '#302b38';
  context.lineWidth = 12.5;
  context.stroke();
  context.strokeStyle = trim;
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(39 + swing * 0.25, -43 + swing);
  context.lineTo(47 + swing * 0.25, -40 + swing);
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
  context.strokeStyle = '#6d4736';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(0, -142);
  context.quadraticCurveTo(-2, -132, 3, -133);
  context.stroke();
  drawExpressiveMouth(context, 0, -119, 12, '#9b565d', pose, time);

  context.fillStyle = '#d8a04b';
  context.strokeStyle = OUTLINE;
  context.lineWidth = 1.8;
  drawFourPointStar(context, 27, -174, 5.2);
  context.stroke();

  context.fillStyle = '#8b6b4a';
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

  context.strokeStyle = '#8b6b4a';
  context.lineWidth = 8;
  context.beginPath();
  context.moveTo(-30, -160);
  context.quadraticCurveTo(-43, -137, -32, -112);
  context.moveTo(31, -158);
  context.quadraticCurveTo(42, -136, 31, -111);
  context.stroke();
  context.strokeStyle = 'rgba(244,213,141,0.42)';
  context.lineWidth = 2.2;
  context.beginPath();
  context.moveTo(-28, -179);
  context.quadraticCurveTo(-13, -188, 2, -186);
  context.stroke();

  drawFlyaway(context, -22, -188, -42, -202 + Math.sin(time * 3.1) * 3);
  drawFlyaway(context, -7, -193, -5, -211 + Math.sin(time * 3.5) * 4);
  drawFlyaway(context, 8, -191, 18, -207 + Math.sin(time * 2.8) * 3);
  drawFlyaway(context, 25, -183, 44, -194 + Math.sin(time * 3.3) * 3);
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
    context.fillStyle = palette.hair;
    context.beginPath();
    context.arc(23, -166, 17, 0, Math.PI * 2);
    fillStroke(context);
  }
  if (kind === 'keeper') {
    context.fillStyle = palette.hair;
    context.beginPath();
    context.ellipse(27, -137, 16, 30, -0.2, 0, Math.PI * 2);
    fillStroke(context);
  }
}

function drawNpcBody(context, kind, palette) {
  const broad = kind === 'guide';
  const shoulder = broad ? 47 : 34;
  const hem = broad ? 66 : 52;
  const top = broad ? -111 : -99;
  context.fillStyle = palette.robe;
  context.beginPath();
  context.moveTo(-shoulder, top);
  context.quadraticCurveTo(-hem + 6, -70, -hem, 0);
  context.quadraticCurveTo(0, 12, hem, 0);
  context.quadraticCurveTo(hem - 6, -70, shoulder, top);
  context.closePath();
  fillStroke(context);

  context.strokeStyle = palette.accent;
  context.lineWidth = broad ? 8 : 6;
  context.beginPath();
  context.moveTo(-shoulder + 3, top + 11);
  context.quadraticCurveTo(0, top + 22, shoulder - 3, top + 11);
  context.stroke();

  context.fillStyle = SHADOW_WASH;
  context.beginPath();
  context.moveTo(6, top + 6);
  context.quadraticCurveTo(shoulder + 5, -70, hem - 8, -2);
  context.quadraticCurveTo(30, 6, 6, 5);
  context.closePath();
  context.fill();

  drawNpcGarmentDetails(context, kind, palette, { shoulder, hem, top });
}

function drawNpcGarmentDetails(context, kind, palette, { shoulder, hem, top }) {
  context.save();
  context.strokeStyle = 'rgba(244,226,190,0.34)';
  context.lineWidth = 2.2;
  context.beginPath();
  context.moveTo(-shoulder + 12, top + 20);
  context.bezierCurveTo(-22, -73, -25, -27, -30, 1);
  context.moveTo(shoulder - 12, top + 20);
  context.bezierCurveTo(22, -73, 25, -27, 30, 1);
  context.moveTo(0, top + 22);
  context.quadraticCurveTo(-3, -42, 0, 6);
  context.stroke();

  if (kind === 'guide') {
    context.fillStyle = '#352d2a';
    context.beginPath();
    context.moveTo(-36, -106);
    context.lineTo(-11, -67);
    context.lineTo(0, -96);
    context.lineTo(11, -67);
    context.lineTo(36, -106);
    context.quadraticCurveTo(0, -116, -36, -106);
    context.closePath();
    context.fill();
    context.strokeStyle = palette.accent;
    context.lineWidth = 7;
    context.beginPath();
    context.moveTo(-56, -45);
    context.quadraticCurveTo(0, -38, 56, -45);
    context.stroke();
    context.fillStyle = '#c69b54';
    context.beginPath();
    context.roundRect?.(-8, -51, 16, 14, 3);
    if (typeof context.roundRect === 'function') context.fill();
    else {
      context.fillRect(-8, -51, 16, 14);
    }
    for (const [x, y] of [[-42, -27], [42, -27]]) {
      context.fillStyle = 'rgba(40,31,27,0.28)';
      context.beginPath();
      context.moveTo(x - 15, y - 8);
      context.lineTo(x + 15, y - 8);
      context.lineTo(x + 12, y + 12);
      context.quadraticCurveTo(x, y + 18, x - 12, y + 12);
      context.closePath();
      context.fill();
      context.strokeStyle = palette.accent;
      context.lineWidth = 2;
      context.stroke();
    }
  } else if (kind === 'wandmaker') {
    context.fillStyle = '#222536';
    context.beginPath();
    context.moveTo(-27, -95);
    context.lineTo(-7, -61);
    context.lineTo(0, -82);
    context.lineTo(7, -61);
    context.lineTo(27, -95);
    context.closePath();
    context.fill();
    for (const y of [-55, -34, -13]) {
      context.fillStyle = palette.accent;
      context.beginPath();
      context.arc(0, y, 3.1, 0, Math.PI * 2);
      context.fill();
    }
    context.strokeStyle = palette.accent;
    context.lineWidth = 2.4;
    context.beginPath();
    context.moveTo(-35, -8);
    context.quadraticCurveTo(0, -17, 35, -8);
    context.stroke();
  } else if (kind === 'tailor') {
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
  } else if (kind === 'keeper') {
    context.fillStyle = 'rgba(239,225,199,0.32)';
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
    context.beginPath();
    context.moveTo(-25, -35);
    context.quadraticCurveTo(0, -23, 25, -35);
    context.stroke();
    drawFourPointStar(context, 0, -19, 3.8);
  }
  context.restore();
}

function drawNpcArms(context, kind, palette, time) {
  const broad = kind === 'guide';
  const shoulderX = broad ? 45 : 34;
  const handY = broad ? -39 : -31;
  const sway = Math.sin(time * 1.4) * 2;
  for (const side of [-1, 1]) {
    context.strokeStyle = OUTLINE;
    context.lineWidth = broad ? 22 : 17;
    context.beginPath();
    context.moveTo(side * shoulderX, broad ? -104 : -93);
    context.quadraticCurveTo(side * (shoulderX + 12), -64, side * (shoulderX + 6 + sway), handY);
    context.stroke();
    context.strokeStyle = palette.robe;
    context.lineWidth = broad ? 15 : 11;
    context.stroke();
    context.strokeStyle = palette.accent;
    context.lineWidth = 3.5;
    context.beginPath();
    context.moveTo(side * (shoulderX + 11 + sway), handY - 8);
    context.lineTo(side * (shoulderX + 4 + sway), handY - 4);
    context.stroke();
    drawHand(context, side * (shoulderX + 7 + sway), handY + 7, palette.skin, broad ? 9 : 7.5);
  }
}

function drawNpcHead(context, kind, palette, blinking, time, pose = 'idle') {
  const broad = kind === 'guide';
  const headY = broad ? -151 : -137;
  const rx = broad ? 41 : 34;
  const ry = broad ? 43 : 38;
  drawEar(context, -rx, headY, palette.skin, broad ? 8 : 6.5);
  drawEar(context, rx, headY, palette.skin, broad ? 8 : 6.5);

  context.fillStyle = palette.skin;
  context.beginPath();
  context.ellipse(0, headY, rx, ry, 0, 0, Math.PI * 2);
  fillStroke(context);

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
  drawIllustratedEyes(
    context,
    broad ? -15 : -12,
    eyeY,
    broad ? 15 : 12,
    eyeY,
    kind === 'wandmaker' ? '#71808d' : '#493228',
    blinking,
    broad ? 4.8 : 4.4,
    gazeX,
    gazeY,
    { browLift: kind === 'wandmaker' ? -1.5 : kind === 'tailor' ? 1.1 : 0 },
  );
  context.strokeStyle = darken(palette.skin, 0.28);
  context.lineWidth = 1.8;
  context.beginPath();
  context.moveTo(0, headY - 1);
  context.quadraticCurveTo(-2, headY + 9, 3, headY + 9);
  context.stroke();
  drawExpressiveMouth(context, 0, headY + 20, broad ? 11 : 9, darken(palette.cheek, 0.13), pose, time);

  drawNpcHair(context, kind, palette, headY, rx, ry, time);
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

function drawNpcAccessory(context, kind, palette) {
  if (kind === 'guide') {
    context.fillStyle = palette.hair;
    context.beginPath();
    context.moveTo(-30, -143);
    context.quadraticCurveTo(-27, -102, 0, -91);
    context.quadraticCurveTo(27, -102, 30, -143);
    context.quadraticCurveTo(18, -118, 0, -124);
    context.quadraticCurveTo(-18, -118, -30, -143);
    context.closePath();
    fillStroke(context, 2.6);
    context.fillStyle = palette.hair;
    context.beginPath();
    context.moveTo(-28, -144);
    context.quadraticCurveTo(-17, -133, -7, -141);
    context.quadraticCurveTo(0, -132, 8, -141);
    context.quadraticCurveTo(18, -133, 29, -144);
    context.quadraticCurveTo(22, -126, 0, -123);
    context.quadraticCurveTo(-22, -126, -28, -144);
    context.closePath();
    context.fill();
    context.strokeStyle = palette.hairLight;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(-16, -130);
    context.quadraticCurveTo(-12, -105, 0, -99);
    context.moveTo(12, -128);
    context.quadraticCurveTo(9, -108, 0, -99);
    context.moveTo(-25, -134);
    context.bezierCurveTo(-20, -114, -10, -103, -4, -95);
    context.moveTo(25, -134);
    context.bezierCurveTo(19, -113, 10, -103, 4, -95);
    context.stroke();
    context.strokeStyle = palette.hair;
    context.lineWidth = 5.5;
    context.beginPath();
    context.moveTo(-20, -145);
    context.quadraticCurveTo(-10, -138, -4, -142);
    context.moveTo(20, -145);
    context.quadraticCurveTo(10, -138, 4, -142);
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
  context.lineWidth = 9;
  context.beginPath();
  context.moveTo(18, -24);
  context.bezierCurveTo(47, -34, 46 + motion.tailSway * 12, -68, 29 + motion.tailSway * 7, -66);
  context.stroke();
  context.strokeStyle = '#936d51';
  context.lineWidth = 5;
  context.stroke();

  const step = motion.step * 3;
  for (const side of [-1, 1]) {
    context.fillStyle = '#936d51';
    context.beginPath();
    context.ellipse(side * 13 + side * step, -9, 10, 17, side * 0.08, 0, Math.PI * 2);
    fillStroke(context, 2.2);
  }

  context.fillStyle = '#a77c5b';
  context.beginPath();
  context.ellipse(0, -29, 25, 31, 0, 0, Math.PI * 2);
  fillStroke(context);
  context.beginPath();
  context.arc(0, -65, 26, 0, Math.PI * 2);
  fillStroke(context);

  context.fillStyle = '#c99b72';
  context.beginPath();
  context.moveTo(-18, -51);
  context.quadraticCurveTo(-6, -43, 0, -54);
  context.quadraticCurveTo(8, -44, 18, -51);
  context.quadraticCurveTo(15, -28, 0, -18);
  context.quadraticCurveTo(-15, -29, -18, -51);
  context.closePath();
  context.fill();
  context.strokeStyle = 'rgba(92,63,47,0.32)';
  context.lineWidth = 1.8;
  for (const x of [-11, 0, 11]) {
    context.beginPath();
    context.moveTo(x, -45);
    context.quadraticCurveTo(x - 4, -32, x, -21);
    context.stroke();
  }

  context.beginPath();
  context.moveTo(-21, -79);
  context.lineTo(-10, -95);
  context.lineTo(-3, -79);
  context.moveTo(21, -79);
  context.lineTo(10, -95);
  context.lineTo(3, -79);
  context.fill();
  context.stroke();
  context.fillStyle = '#d7a9a0';
  context.beginPath();
  context.moveTo(-16, -81);
  context.lineTo(-10, -90);
  context.lineTo(-7, -80);
  context.moveTo(16, -81);
  context.lineTo(10, -90);
  context.lineTo(7, -80);
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
  context.strokeStyle = '#5f4438';
  context.lineWidth = 1.5;
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
  context.lineWidth = 2;
  for (const [x1, y1, x2, y2] of [[-19, -77, -10, -82], [5, -84, 15, -78], [-15, -29, -7, -24]]) {
    context.beginPath();
    context.moveTo(x1, y1);
    context.quadraticCurveTo((x1 + x2) / 2, y1 - 3, x2, y2);
    context.stroke();
  }
  drawPetPaws(context, '#a98061');
  drawUpperLeftRim(context, [[-23, -76], [-15, -90], [-3, -92], [8, -87]], 2.2);
}

function drawToad(context, time, motion) {
  context.fillStyle = '#63794e';
  context.beginPath();
  context.ellipse(-25 - motion.step * 2, -5, 20, 9, -0.18, 0, Math.PI * 2);
  context.ellipse(25 + motion.step * 2, -5, 20, 9, 0.18, 0, Math.PI * 2);
  fillStroke(context);

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
  context.fillStyle = '#7e935f';
  context.beginPath();
  context.ellipse(0, -22, 34, 25, 0, 0, Math.PI * 2);
  fillStroke(context);
  context.beginPath();
  context.arc(-15, -45, 11, 0, Math.PI * 2);
  context.arc(15, -45, 11, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  const blink = isBlinking(time, 2.1);
  drawIllustratedEyes(context, -15, -47, 15, -47, '#c3a442', blink, 4.2,
    Math.sin(time * 0.53) * 0.9, Math.sin(time * 0.31 + 2) * 0.35, { browLift: -0.4 });
  context.fillStyle = `rgba(206,190,112,${0.18 + motion.throatPulse * 0.18})`;
  context.beginPath();
  context.ellipse(0, -17, 19 + motion.throatPulse * 2, 12 + motion.throatPulse * 3, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = 'rgba(225, 208, 120, 0.34)';
  context.beginPath();
  context.arc(-12, -24, 4, 0, Math.PI * 2);
  context.arc(15, -17, 3, 0, Math.PI * 2);
  context.arc(2, -33, 2.5, 0, Math.PI * 2);
  context.arc(-24, -31, 2.8, 0, Math.PI * 2);
  context.arc(25, -28, 2.2, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = '#39442f';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-10, -12);
  context.quadraticCurveTo(0, -6, 10, -12);
  context.stroke();
  context.strokeStyle = 'rgba(244,231,165,0.48)';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-25, -30);
  context.quadraticCurveTo(-17, -44, -7, -46);
  context.stroke();
  drawUpperLeftRim(context, [[-31, -28], [-24, -44], [-15, -55], [0, -51]], 2.1);
}

function drawPetPaws(context, color) {
  context.fillStyle = color;
  context.beginPath();
  context.ellipse(-14, -2, 12, 6, 0, 0, Math.PI * 2);
  context.ellipse(14, -2, 12, 6, 0, 0, Math.PI * 2);
  fillStroke(context, 2.2);
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
