import { PALETTE } from '../config.js';
import { drawVectorOwl } from './OwlRenderer.js';
import { STORYBOOK_INK, STORYBOOK_LINE_WEIGHT } from './storybookInk.js';
import { violetSpriteRig } from './VioletSpriteRig.js';
import { hagridSpriteRig } from './HagridSpriteRig.js';

const OUTLINE = STORYBOOK_INK.primary;
const DEEP_OUTLINE = STORYBOOK_INK.deep;
const RIM_LIGHT = 'rgba(255, 224, 158, 0.34)';
const SHADOW_WASH = 'rgba(37, 26, 35, 0.26)';
const WARM_BOUNCE = 'rgba(229, 170, 93, 0.18)';

const PORTRAIT_CAMEO_STYLE = Object.freeze({
  shadow: 'rgba(31, 20, 18, 0.48)',
  brassDeep: '#5a3924',
  brassShadow: '#805127',
  brassBase: '#bd8439',
  brassLight: '#edca79',
  parchmentShadow: '#aa7f4c',
  parchmentBase: '#d8b879',
  parchmentLight: '#f2dda5',
  toolMark: 'rgba(82, 50, 28, 0.48)',
});

export const VIOLET_STYLE = Object.freeze({
  hairBase: '#9b7654',
  hairMid: '#7d5b40',
  hairShadow: '#584033',
  hairLight: 'rgba(239, 203, 154, 0.38)',
  hairRim: 'rgba(245, 215, 170, 0.46)',
  skinBase: '#d9a17b',
  skinShadow: '#b87968',
  skinLight: 'rgba(255, 225, 181, 0.28)',
  cheek: 'rgba(189, 82, 91, 0.24)',
  eyeWhite: '#f5ead8',
  iris: '#5a3d28',
  pupil: '#241a18',
  glasses: '#203d34',
  glassesLight: '#557266',
  lenses: 'rgba(190, 218, 202, 0.08)',
  robeBase: '#26222e',
  robeMid: '#383140',
  robeShadow: '#1d1a24',
  robeLight: 'rgba(225, 205, 180, 0.18)',
  lining: '#7a4fc9',
  liningLight: '#ab8de0',
  shoeBase: '#6848a8',
  shoeShadow: '#493371',
  shoeLight: '#b29ae0',
  casualJerseyBase: '#5369a8',
  casualJerseyMid: '#7489c2',
  casualJerseyShadow: '#344571',
  casualJerseyLight: 'rgba(225, 235, 255, 0.34)',
  casualJerseyTrim: '#f0dfbd',
  casualLeggingBase: '#383742',
  casualLeggingShadow: '#24242c',
  casualLeggingLight: 'rgba(204, 207, 222, 0.24)',
  casualShoeBase: '#536d78',
  casualShoeShadow: '#344851',
  casualShoeLight: '#b9cbd0',
  casualShoeAccent: '#846ab2',
  casualShoeSole: '#e1d6c4',
});

export const HAGRID_STYLE = Object.freeze({
  worldScale: 1.24,
  coatBase: '#65503d',
  coatMid: '#786048',
  coatShadow: '#3d312b',
  coatDeep: '#2c2623',
  coatLight: '#997550',
  coatHighlight: 'rgba(225, 185, 125, 0.24)',
  hairBase: '#382821',
  hairMid: '#53392c',
  hairShadow: '#261d1a',
  hairLight: '#80583d',
  beardBase: '#5b4031',
  beardMid: '#76513c',
  beardShadow: '#382720',
  beardLight: '#a0704b',
  skin: '#bd7d5e',
  skinShadow: '#925847',
  skinLight: 'rgba(255, 218, 166, 0.26)',
  cheek: '#b76858',
  bootBase: '#382b25',
  bootShadow: '#241e1c',
  bootLight: '#74563c',
  rim: 'rgba(244, 198, 126, 0.42)',
});

export const WANDMAKER_STYLE = Object.freeze({
  robeBase: '#292c43',
  robeMid: '#3b405d',
  robeShadow: '#1d2031',
  robeLight: 'rgba(139, 148, 183, 0.32)',
  waistcoat: '#4b4655',
  brass: '#b89a5d',
  brassLight: '#e1ca8b',
  wood: '#765136',
  woodShadow: '#4b3428',
  hairBase: '#c9c6bd',
  hairShadow: '#8f9296',
  hairLight: '#f0ead9',
  skin: '#d0a07d',
  skinShadow: '#a86f5b',
  skinLight: 'rgba(255, 222, 176, 0.3)',
  iris: '#738697',
  rim: 'rgba(255, 225, 164, 0.48)',
});

export const TAILOR_STYLE = Object.freeze({
  dressBase: '#75445f',
  dressMid: '#925b78',
  dressShadow: '#4c2d43',
  dressLight: 'rgba(229, 196, 202, 0.22)',
  apronBase: '#b7838d',
  apronMid: '#c99aa0',
  apronShadow: '#795461',
  apronLight: 'rgba(249, 218, 202, 0.27)',
  tape: '#d9c27f',
  tapeLight: '#f0dfa6',
  tapeMark: '#765c48',
  cushion: '#a64765',
  cushionShadow: '#70314a',
  hairBase: '#c8c4c1',
  hairMid: '#a6a2a4',
  hairShadow: '#77747a',
  hairLight: '#eee5da',
  skin: '#c98e70',
  skinShadow: '#9f6258',
  skinLight: 'rgba(255, 222, 180, 0.3)',
  cheek: 'rgba(177, 76, 82, 0.23)',
  iris: '#5b4638',
  shoe: '#4b3541',
  rim: 'rgba(255, 222, 156, 0.48)',
});

export const KEEPER_STYLE = Object.freeze({
  coatBase: '#496653',
  coatMid: '#607b65',
  coatShadow: '#30483b',
  coatLight: 'rgba(204, 220, 184, 0.2)',
  apronBase: '#8c6344',
  apronMid: '#aa7950',
  apronShadow: '#5d412f',
  apronLight: 'rgba(236, 199, 145, 0.24)',
  pouchBase: '#765139',
  pouchShadow: '#4d3529',
  pouchLight: '#ae7d51',
  gauntletBase: '#79583f',
  gauntletShadow: '#513a2e',
  gauntletLight: '#aa8158',
  brushWood: '#6d4933',
  brushLight: '#b78355',
  bristle: '#d4bc91',
  bristleShadow: '#9b805f',
  featherBase: '#71858a',
  featherLight: '#aac0b8',
  hairBase: '#a9633a',
  hairMid: '#c5804d',
  hairShadow: '#6e402f',
  hairLight: '#e1a36c',
  skin: '#ca906d',
  skinShadow: '#9d6254',
  skinLight: 'rgba(255, 222, 177, 0.28)',
  cheek: 'rgba(180, 77, 76, 0.24)',
  iris: '#5b5638',
  shoe: '#3d342f',
  rim: 'rgba(255, 222, 154, 0.47)',
});

export const CAT_STYLE = Object.freeze({
  furBase: '#9d7254',
  furMid: '#b88963',
  furShadow: '#65483b',
  furDeep: '#49352f',
  furLight: '#d2a67d',
  chest: '#c69a72',
  muzzle: '#dab38c',
  ear: '#c98582',
  eyeWhite: '#f6ead7',
  iris: '#b78f32',
  pupil: '#251b18',
  catchlight: '#fff5cf',
  nose: '#815254',
  collar: '#62516d',
  brass: '#d8b355',
  rim: 'rgba(255, 224, 158, 0.5)',
});

export const TOAD_STYLE = Object.freeze({
  skinBase: '#71865a',
  skinMid: '#899d69',
  skinShadow: '#3f5237',
  skinDeep: '#2f402c',
  skinLight: '#a9b77d',
  belly: '#b2aa6a',
  bellyLight: 'rgba(232, 218, 139, 0.42)',
  eyeWhite: '#eee7c8',
  iris: '#c3a23e',
  pupil: '#252018',
  catchlight: '#fff5c8',
  mouth: '#39452f',
  rim: 'rgba(255, 229, 164, 0.5)',
});

export const CHARACTER_REVIEW_SCENES = Object.freeze([
  'character-cast-review',
  'character-pets-review',
  'character-portraits-review',
  'owl-motion-review',
  'character-sprite-spike-review',
  'hagrid-sprite-review',
]);

export const OWL_RUNTIME_REVIEW_POSES = Object.freeze({
  post: Object.freeze(['perch', 'takeoff', 'delivery', 'flight', 'settle']),
  pet: Object.freeze(['idle', 'perch', 'pet-follow']),
});

const CHARACTER_COLORS = Object.freeze({
  guide: {
    robe: HAGRID_STYLE.coatBase,
    robeShadow: HAGRID_STYLE.coatShadow,
    accent: HAGRID_STYLE.coatLight,
    hair: HAGRID_STYLE.hairBase,
    hairLight: HAGRID_STYLE.hairLight,
    skin: HAGRID_STYLE.skin,
    cheek: HAGRID_STYLE.cheek,
  },
  wandmaker: {
    robe: WANDMAKER_STYLE.robeBase,
    robeShadow: WANDMAKER_STYLE.robeShadow,
    accent: WANDMAKER_STYLE.brass,
    hair: WANDMAKER_STYLE.hairBase,
    hairLight: WANDMAKER_STYLE.hairLight,
    skin: WANDMAKER_STYLE.skin,
    cheek: WANDMAKER_STYLE.skinShadow,
  },
  tailor: {
    robe: TAILOR_STYLE.dressBase,
    robeShadow: TAILOR_STYLE.dressShadow,
    accent: TAILOR_STYLE.tape,
    hair: TAILOR_STYLE.hairBase,
    hairLight: TAILOR_STYLE.hairLight,
    skin: TAILOR_STYLE.skin,
    cheek: TAILOR_STYLE.cheek,
  },
  keeper: {
    robe: KEEPER_STYLE.coatBase,
    robeShadow: KEEPER_STYLE.coatShadow,
    accent: KEEPER_STYLE.apronMid,
    hair: KEEPER_STYLE.hairBase,
    hairLight: KEEPER_STYLE.hairLight,
    skin: KEEPER_STYLE.skin,
    cheek: KEEPER_STYLE.cheek,
  },
});

export class CharacterRenderer {
  draw(context, character, time = 0) {
    if (character.kind === 'violet') this.drawViolet(context, character, time);
    else this.drawNpc(context, character, time);
  }

  // D51: painted sprite rigs render live characters wherever their parts can
  // express the moment; anything they can't yet (portraits, the wand hand,
  // robed Violet) falls back to the code-drawn puppet, as does the first
  // frame or two while part images decode. `medium: 'bezier'` pins a call to
  // the code-drawn puppet for side-by-side review scenes.
  drawPaintedCharacter(context, rig, character, time, kind) {
    rig.ensureLoading();
    if (!rig.ready || rig.failed) return false;
    const scale = character.scale ?? 1;
    const direction = character.facing === 'left' ? -1 : 1;
    const walking = Boolean(character.walking) || character.pose === 'walking';
    const pose = walking
      ? 'walking'
      : kind === 'guide' && character.pose === 'speaking'
        ? 'beckoning'
        : 'idle';
    context.save();
    context.translate(character.x, character.y);
    context.scale(direction * scale, scale);
    prepare(context, kind === 'guide' ? 2.1 : 2.25);
    drawGroundingShadow(context, kind);
    context.restore();
    return rig.draw(context, {
      x: character.x,
      y: character.y,
      scale,
      facing: character.facing ?? 'right',
      pose,
      time,
      phase: character.phase ?? 0,
      shadow: false,
    });
  }

  drawViolet(context, character, time) {
    if (
      character.medium !== 'bezier'
      && character.outfit === 'casual'
      && !character.wand
      && character.detail !== 'portrait'
      && this.drawPaintedCharacter(context, violetSpriteRig, character, time, 'violet')
    ) return;
    const scale = character.scale ?? 1;
    const direction = character.facing === 'left' ? -1 : 1;
    const lightSide = character.lightSide === 'right' ? 'right' : 'left';
    const lightDirection = (lightSide === 'right' ? 1 : -1) * direction;
    const pose = character.pose ?? 'idle';
    const walking = Boolean(character.walking) || pose === 'walking';
    const motion = sampleVioletMotion({
      time,
      walking,
      pose,
      reducedMotion: Boolean(character.reducedMotion),
    });
    const trim = character.robeTrim ?? PALETTE.violet;
    const outfit = character.outfit === 'casual' ? 'casual' : 'robes';
    const blinking = isBlinking(time, 0.1);
    const casualHeadScale = outfit === 'casual' ? 0.6 : 1;
    const casualHeightScale = outfit === 'casual' ? 1.08 : 1;
    const headAnchorY = -101;

    context.save();
    context.translate(character.x, character.y);
    context.scale(direction * scale, scale);
    prepare(context, 2.25);
    drawGroundingShadow(context, 'violet');
    context.restore();

    context.save();
    context.translate(character.x, character.y + motion.bob);
    context.scale(direction * scale, scale * casualHeightScale);
    context.rotate(motion.bodySway);
    prepare(context, 2.25);

    drawVioletLeg(context, -15, motion.stride * 8, true, motion, outfit, lightDirection);
    drawVioletLeg(context, 15, -motion.stride * 8, false, motion, outfit, lightDirection);
    context.save();
    context.translate(0, headAnchorY);
    context.scale(casualHeadScale, casualHeadScale);
    context.translate(0, -headAnchorY);
    drawVioletBackHair(context, motion, lightDirection);
    context.restore();
    if (outfit === 'casual') {
      drawVioletCasualArm(context, motion, -1, true, false, lightDirection);
      drawVioletCasualJersey(context, motion, lightDirection);
      drawVioletCasualArm(
        context,
        motion,
        1,
        false,
        Boolean(character.wand),
        lightDirection,
      );
      drawVioletCasualNeckline(context);
    } else {
      drawVioletBackArm(context, trim, motion);
      drawVioletRobe(context, trim, motion);
      drawVioletFrontArm(context, trim, motion, Boolean(character.wand));
      drawVioletCollar(context, trim);
    }
    context.save();
    context.translate(0, motion.headBob);
    context.rotate(motion.headTilt);
    context.translate(0, headAnchorY);
    context.scale(casualHeadScale, casualHeadScale);
    context.translate(0, -headAnchorY);
    drawVioletHead(
      context,
      blinking,
      time,
      pose,
      motion,
      character.detail ?? 'world',
      lightDirection,
    );
    context.restore();
    drawVioletWarmRim(context, motion, direction, outfit, lightSide);

    context.restore();
  }

  drawNpc(context, character, time) {
    if (
      character.kind === 'guide'
      && character.medium !== 'bezier'
      && character.detail !== 'portrait'
      && this.drawPaintedCharacter(context, hagridSpriteRig, character, time, 'guide')
    ) return;
    const kind = character.kind in CHARACTER_COLORS ? character.kind : 'guide';
    const palette = CHARACTER_COLORS[kind];
    const scale = (character.scale ?? 1) * (kind === 'guide' ? HAGRID_STYLE.worldScale : 1.04);
    const direction = character.facing === 'left' ? -1 : 1;
    const lightSide = character.lightSide === 'right' ? 'right' : 'left';
    const lightDirection = (lightSide === 'right' ? 1 : -1) * direction;
    const phase = character.phase ?? kind.length * 0.37;
    const walking = character.pose === 'walking';
    const walkCycle = Math.sin(time * 7.6 + phase);
    const bob = walking ? -Math.abs(walkCycle) * 2.3 : Math.sin(time * 1.65 + phase) * 1.5;
    const sway = walking ? walkCycle * 0.009 : Math.sin(time * 1.15 + phase) * 0.012;
    const blinking = isBlinking(time, phase);

    context.save();
    context.translate(character.x, character.y);
    context.scale(direction * scale, scale);
    prepare(context, 2.1);
    drawGroundingShadow(context, kind);
    context.restore();

    context.save();
    context.translate(character.x, character.y + bob);
    context.scale(direction * scale, scale);
    context.rotate(sway);
    prepare(context, 2.1);
    drawNpcLegs(context, kind, palette, character.pose, time + phase);
    drawNpcBackDetails(context, kind, palette, { lightDirection });
    drawNpcBody(context, kind, palette, { lightDirection });
    drawNpcArms(context, kind, palette, time + phase, character.pose, {
      reducedMotion: Boolean(character.reducedMotion),
      lightDirection,
    });
    drawNpcHead(context, kind, palette, blinking, time + phase, character.pose, {
      reducedMotion: Boolean(character.reducedMotion),
      lightDirection,
    });
    drawNpcAccessory(context, kind, palette, time + phase, character.pose, {
      reducedMotion: Boolean(character.reducedMotion),
      lightDirection,
    });
    if (kind === 'guide') drawGuideMouth(context, character.pose, time + phase);
    if (kind === 'guide') drawGuideWarmRim(context, direction, lightSide);
    else if (kind === 'wandmaker') drawWandmakerWarmRim(context);
    else if (kind === 'tailor') drawTailorWarmRim(context, direction);
    else if (kind === 'keeper') drawKeeperWarmRim(context, direction);
    else drawUpperLeftRim(context, [[-39, -132], [-34, -164], [-13, -182], [14, -180], [35, -160]], 1.25);

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
    const safeTime = Number.isFinite(time) ? time : 0;
    const motion = sampleCompanionMotion({
      type: pet.type,
      pose: pet.pose ?? 'idle',
      time: safeTime,
      reducedMotion: Boolean(pet.reducedMotion),
    });
    const scale = pet.scale ?? 1;
    const direction = pet.facing === 'left' ? -1 : 1;
    const lightSide = pet.lightSide === 'right' ? 'right' : 'left';
    const lightDirection = (lightSide === 'right' ? 1 : -1) * direction;

    context.save();
    context.translate(pet.x, pet.y);
    context.scale(direction * scale, scale);
    prepare(context, 2.8);
    drawCompanionShadow(context, pet.type, motion);
    context.restore();

    context.save();
    context.translate(pet.x, pet.y + motion.bob - motion.hop);
    context.rotate(motion.tilt);
    context.scale(direction * scale, scale * motion.breathScale * motion.bodySquash);
    prepare(context, 2.8);

    if (pet.type === 'cat') drawCat(context, safeTime, motion, lightDirection);
    else drawToad(context, safeTime, motion, lightDirection);

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
    const reducedMotion = Boolean(portrait.reducedMotion);

    context.save();
    context.translate(x, y);
    context.scale(scale, scale);
    drawPortraitBackdrop(context, speaker, time, reducedMotion);
    context.save();
    tracePortraitCameoSilhouette(context, 55);
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
        lightSide: portrait.lightSide,
        lookX: facing === 'left' ? -0.35 : 0.35,
      }, time);
    } else if (speaker === 'violet') {
      this.draw(context, {
        kind: 'violet', x: 0, y: 118, scale: 0.82, facing,
        robeTrim: portrait.robeTrim ?? PALETTE.violet, wand: Boolean(portrait.wand), pose,
        reducedMotion, detail: 'portrait',
        outfit: portrait.outfit ?? 'robes',
        lightSide: portrait.lightSide,
      }, time);
    } else {
      const guide = speaker === 'guide';
      this.draw(context, {
        kind: speaker, x: 0, y: guide ? 166 : 116, scale: guide ? 0.92 : 0.84,
        facing, pose, lightSide: portrait.lightSide, detail: 'portrait',
      }, time);
    }
    context.restore();
    drawPortraitFrame(context, time, reducedMotion);
    context.restore();
  }

  drawReviewScene(context, scene, time = 0, { reducedMotion = false } = {}) {
    if (!CHARACTER_REVIEW_SCENES.includes(scene)) return false;
    drawReviewBackground(context, scene);
    if (scene === 'character-cast-review') this.drawCastReview(context, time);
    else if (scene === 'character-pets-review') this.drawPetsReview(context, time, reducedMotion);
    else if (scene === 'character-portraits-review') this.drawPortraitReview(context, time);
    else if (scene === 'character-sprite-spike-review') this.drawSpriteSpikeReview(context, time);
    else if (scene === 'hagrid-sprite-review') this.drawHagridSpriteReview(context, time);
    else this.drawOwlMotionReview(context, time, reducedMotion);
    return true;
  }

  drawSpriteSpikeReview(context, time) {
    const rows = [
      { label: 'Today · idle', x: 210, sprite: false, pose: 'idle' },
      { label: 'Today · walking', x: 440, sprite: false, pose: 'walking' },
      { label: 'Painted · idle', x: 810, sprite: true, pose: 'idle' },
      { label: 'Painted · walking', x: 1050, sprite: true, pose: 'walking' },
    ];
    for (const entry of rows) {
      drawReviewPlinth(context, entry.x, 625, entry.label);
      if (entry.sprite) {
        const drew = violetSpriteRig.draw(context, {
          x: entry.x, y: 595, scale: 1, pose: entry.pose, time: time + entry.x * 0.001,
        });
        if (!drew) drawReviewLabel(context, entry.x, 480, 'parts loading');
      } else {
        this.draw(context, {
          kind: 'violet', x: entry.x, y: 595, scale: 1, pose: entry.pose,
          outfit: 'casual', robeTrim: '#7952b7', medium: 'bezier',
        }, time + entry.x * 0.001);
      }
    }
  }

  drawHagridSpriteReview(context, time) {
    const rows = [
      { label: 'Today · idle', x: 140, sprite: false, pose: 'idle' },
      { label: 'Today · walking', x: 370, sprite: false, pose: 'walking' },
      { label: 'Painted · idle', x: 660, sprite: true, pose: 'idle' },
      { label: 'Painted · walking', x: 895, sprite: true, pose: 'walking' },
      { label: 'Painted · beckoning', x: 1130, sprite: true, pose: 'beckoning' },
    ];
    for (const entry of rows) {
      drawReviewPlinth(context, entry.x, 625, entry.label);
      if (entry.sprite) {
        const drew = hagridSpriteRig.draw(context, {
          x: entry.x, y: 595, scale: 1, pose: entry.pose, time: time + entry.x * 0.001,
        });
        if (!drew) drawReviewLabel(context, entry.x, 480, 'parts loading');
      } else {
        this.draw(context, {
          kind: 'guide', x: entry.x, y: 595, scale: 1, medium: 'bezier',
          pose: entry.pose === 'beckoning' ? 'speaking' : entry.pose,
        }, time + entry.x * 0.001);
      }
    }
  }

  drawCastReview(context, time) {
    const cast = [
      { label: 'Violet', kind: 'violet', x: 126, y: 595, scale: 1, wand: true, robeTrim: '#7952b7', pose: 'speaking' },
      { label: 'Hagrid', kind: 'guide', x: 365, y: 595, scale: 1.18, pose: 'speaking' },
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
    const rows = [
      {
        variant: 'post', poses: OWL_RUNTIME_REVIEW_POSES.post,
        left: 150, right: 1130, owlY: 337, plinthY: 382, scale: 0.84,
      },
      {
        variant: 'pet', poses: OWL_RUNTIME_REVIEW_POSES.pet,
        left: 290, right: 990, owlY: 552, plinthY: 607, scale: 0.94,
      },
    ];

    rows.forEach((row, rowIndex) => {
      row.poses.forEach((pose, index) => {
        const progress = row.poses.length === 1 ? 0.5 : index / (row.poses.length - 1);
        const x = row.left + (row.right - row.left) * progress;
        const airborne = pose === 'delivery' || pose === 'flight';
        drawReviewPlinth(context, x, row.plinthY, `${row.variant} · ${pose.replace('-', ' ')}`);
        this.drawPet(context, {
          type: 'owl', variant: row.variant, pose,
          x, y: airborne ? row.owlY - 32 : row.owlY, scale: row.scale,
          reducedMotion,
          lookX: progress * 1.6 - 0.8,
          lookY: index % 2 ? -0.2 : 0.16,
          phase: rowIndex * 0.43 + index * 0.31,
        }, time);
      });
    });
  }
}

export function sampleVioletMotion({
  time = 0,
  walking = false,
  pose = 'idle',
  reducedMotion = false,
} = {}) {
  const safeTime = Number.isFinite(time) ? time : 0;
  const energy = reducedMotion ? 0.32 : 1;
  const walkWave = walking ? Math.sin(safeTime * 10.5) : 0;
  const speaking = pose === 'speaking' || pose === 'talk';
  const talkWave = speaking ? Math.sin(safeTime * 4.6 + 0.35) : 0;
  const quietBreath = Math.sin(safeTime * 2.05 + 0.2);
  const expressiveLift = pose === 'wonder' ? -0.014 : pose === 'proud' ? 0.008 : 0;

  return Object.freeze({
    stride: walkWave * energy,
    bob: walking
      ? -Math.abs(walkWave) * 3.2 * energy
      : quietBreath * 1.25 * energy - Math.max(0, talkWave) * 0.65 * energy,
    bodySway: walking
      ? walkWave * 0.012 * energy
      : (Math.sin(safeTime * 1.35) * 0.013 + talkWave * 0.006) * energy,
    armSwing: (walking ? walkWave * 7.2 : speaking ? talkWave * 2.4 : quietBreath * 0.45) * energy,
    headBob: (walking ? Math.abs(walkWave) * 0.75 : speaking ? talkWave * 0.8 : 0) * energy,
    headTilt: ((walking ? -walkWave * 0.006 : talkWave * 0.018) + expressiveLift) * energy,
    hairLift: (walking
      ? Math.abs(walkWave) * 1.8
      : speaking ? talkWave * 0.65 : quietBreath * 0.38) * energy,
    robeSwing: (walking ? walkWave * 2.7 : quietBreath * 0.45) * energy,
    talkWave: talkWave * energy,
  });
}

export function sampleTailorMotion({
  time = 0,
  pose = 'idle',
  reducedMotion = false,
} = {}) {
  const safeTime = Number.isFinite(time) ? time : 0;
  const energy = reducedMotion ? 0.3 : 1;
  const speaking = pose === 'speaking' || pose === 'talk';
  const breath = Math.sin(safeTime * 1.65 + 0.4);
  const briskBeat = speaking ? Math.sin(safeTime * 5.1 + 0.7) : Math.sin(safeTime * 1.25 + 0.2) * 0.24;
  return Object.freeze({
    breath: breath * energy,
    handLift: (speaking ? 13 + briskBeat * 4.2 : 2 + briskBeat * 1.8) * energy,
    handTurn: (speaking ? briskBeat * 0.11 : briskBeat * 0.04) * energy,
    headTilt: (speaking ? briskBeat * 0.018 : breath * 0.006) * energy,
    browLift: (speaking ? 1.5 + briskBeat * 0.75 : 0.45 + breath * 0.2) * energy,
    tapeSway: (briskBeat * 1.8 + breath * 0.35) * energy,
    hairSway: (briskBeat * 0.55 + breath * 0.3) * energy,
    mouthOpen: speaking ? 2.8 + Math.abs(Math.sin(safeTime * 8.2 + 0.3)) * 3.1 : 0,
  });
}

export function sampleKeeperMotion({
  time = 0,
  pose = 'idle',
  reducedMotion = false,
} = {}) {
  const safeTime = Number.isFinite(time) ? time : 0;
  const energy = reducedMotion ? 0.3 : 1;
  const speaking = pose === 'speaking' || pose === 'talk';
  const proud = pose === 'proud';
  const breath = Math.sin(safeTime * 1.55 + 0.8);
  const livelyBeat = speaking
    ? Math.sin(safeTime * 4.7 + 0.45)
    : proud ? 0.55 : Math.sin(safeTime * 1.2 + 0.25) * 0.22;
  return Object.freeze({
    breath: breath * energy,
    gloveLift: (speaking ? 9 + livelyBeat * 3.8 : proud ? 7.5 : 2 + livelyBeat * 1.5) * energy,
    brushTilt: (speaking ? livelyBeat * 0.16 : proud ? -0.08 : livelyBeat * 0.05) * energy,
    brushBob: (speaking ? livelyBeat * 2.4 : breath * 0.5) * energy,
    pouchSway: (livelyBeat * 1.4 + breath * 0.35) * energy,
    curlSway: (livelyBeat * 0.65 + breath * 0.28) * energy,
    headTilt: (speaking ? livelyBeat * 0.016 : proud ? -0.012 : breath * 0.005) * energy,
    browLift: (speaking ? 1.25 + livelyBeat * 0.7 : proud ? 1.4 : 0.4 + breath * 0.18) * energy,
    mouthOpen: speaking ? 2.7 + Math.abs(Math.sin(safeTime * 8 + 0.15)) * 3.2 : 0,
  });
}

export function sampleCompanionMotion({ type = 'cat', pose = 'idle', time = 0, reducedMotion = false } = {}) {
  const safeTime = Number.isFinite(time) ? time : 0;
  const phase = type === 'toad' ? 1.7 : 0.4;
  const energy = reducedMotion ? 0.32 : 1;
  const stepWave = Math.sin(safeTime * (type === 'toad' ? 4.2 : 6.1) + phase);
  const following = pose === 'follow' || pose === 'pet-follow';
  const pawing = pose === 'paw';
  const hopWave = following ? Math.max(0, stepWave) ** 2 : 0;
  const breath = Math.sin(safeTime * (type === 'toad' ? 1.45 : 2.05) + phase);
  const quickBeat = Math.sin(safeTime * (type === 'toad' ? 5.1 : 7.3) + phase * 0.7);
  const attention = pawing ? 1 : following ? 0.58 : 0.18;
  return Object.freeze({
    bob: breath * (type === 'toad' ? 1.1 : 1.65) * energy,
    hop: hopWave * (type === 'toad' ? 7 : 5.5) * energy,
    tilt: following ? stepWave * (type === 'toad' ? 0.025 : 0.045) * energy : breath * 0.008 * energy,
    step: following ? stepWave : 0,
    breathScale: 1 + breath * (type === 'toad' ? 0.022 : 0.012) * energy,
    tailSway: Math.sin(safeTime * 2.7 + phase) * (following ? 0.34 : 0.2) * energy,
    throatPulse: type === 'toad' ? Math.max(0, Math.sin(safeTime * 1.33 + 0.8)) * energy : 0,
    pawLift: pawing ? (0.58 + Math.sin(safeTime * 4.2) * 0.18) * energy : 0,
    foreLift: following ? Math.max(0, stepWave) * (type === 'toad' ? 0.16 : 0.24) * energy : 0,
    hindLift: following ? Math.max(0, -stepWave) * (type === 'toad' ? 0.1 : 0.18) * energy : 0,
    headNod: (breath * 0.7 + quickBeat * attention * 0.45) * energy,
    headTilt: (quickBeat * attention * (type === 'toad' ? 0.018 : 0.035)) * energy,
    earTwitch: type === 'cat' ? quickBeat * (0.45 + attention * 0.55) * energy : 0,
    eyeFocusX: (following ? 1.1 : 0.45) * Math.sin(safeTime * 0.53 + phase) * energy,
    eyeFocusY: 0.35 * Math.sin(safeTime * 0.37 + phase * 1.4) * energy,
    bodySquash: 1 - hopWave * (type === 'toad' ? 0.035 : 0.015) * energy,
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

export function tracePortraitCameoSilhouette(context, radius = 60) {
  const safeRadius = Number.isFinite(radius) ? Math.max(1, radius) : 60;
  context.beginPath();
  context.moveTo(-safeRadius * 0.055, -safeRadius);
  context.bezierCurveTo(
    -safeRadius * 0.38, -safeRadius * 1.05,
    -safeRadius * 0.82, -safeRadius * 0.88,
    -safeRadius * 0.95, -safeRadius * 0.55,
  );
  context.bezierCurveTo(
    -safeRadius * 1.07, -safeRadius * 0.14,
    -safeRadius * 0.96, safeRadius * 0.31,
    -safeRadius * 0.86, safeRadius * 0.6,
  );
  context.bezierCurveTo(
    -safeRadius * 0.68, safeRadius * 0.89,
    -safeRadius * 0.31, safeRadius * 1.02,
    -safeRadius * 0.05, safeRadius * 1.01,
  );
  context.bezierCurveTo(
    safeRadius * 0.33, safeRadius * 1.04,
    safeRadius * 0.73, safeRadius * 0.86,
    safeRadius * 0.92, safeRadius * 0.56,
  );
  context.bezierCurveTo(
    safeRadius * 1.06, safeRadius * 0.18,
    safeRadius * 0.97, -safeRadius * 0.35,
    safeRadius * 0.86, -safeRadius * 0.63,
  );
  context.bezierCurveTo(
    safeRadius * 0.69, -safeRadius * 0.92,
    safeRadius * 0.28, -safeRadius * 1.04,
    -safeRadius * 0.055, -safeRadius,
  );
  context.closePath();
}

function drawPortraitBackdrop(context, speaker, time, reducedMotion) {
  const colors = {
    violet: ['#302642', '#8b63aa'], guide: ['#30271f', '#7f6347'], wandmaker: ['#292b40', '#77799a'],
    tailor: ['#4e2943', '#ae688e'], keeper: ['#2f4939', '#66856d'], narrator: ['#33283f', '#8d6ca0'],
    cat: ['#49352b', '#b18464'], owl: ['#38313f', '#8b7a96'], toad: ['#34412d', '#71875c'],
  };
  const [dark, light] = colors[speaker] ?? colors.narrator;
  const safeTime = Number.isFinite(time) ? time : 0;
  const shimmer = reducedMotion ? 0.13 : 0.13 + Math.sin(safeTime * 1.1) * 0.025;
  context.save();

  context.save();
  context.translate(1.8, 2.7);
  context.fillStyle = PORTRAIT_CAMEO_STYLE.shadow;
  tracePortraitCameoSilhouette(context, 62);
  context.fill();
  context.restore();

  context.fillStyle = PORTRAIT_CAMEO_STYLE.brassBase;
  context.strokeStyle = PORTRAIT_CAMEO_STYLE.brassDeep;
  context.lineWidth = 1.8;
  tracePortraitCameoSilhouette(context, 61);
  context.fill();
  context.stroke();

  context.save();
  tracePortraitCameoSilhouette(context, 61);
  context.clip();
  context.fillStyle = PORTRAIT_CAMEO_STYLE.brassLight;
  traceOrganicPatch(context, -36, -39, 43, 28, -0.2);
  context.fill();
  context.fillStyle = PORTRAIT_CAMEO_STYLE.brassShadow;
  traceOrganicPatch(context, 39, 40, 46, 34, 0.16);
  context.fill();
  context.restore();

  context.fillStyle = PORTRAIT_CAMEO_STYLE.parchmentBase;
  tracePortraitCameoSilhouette(context, 57.5);
  context.fill();

  context.save();
  tracePortraitCameoSilhouette(context, 57.5);
  context.clip();
  context.fillStyle = PORTRAIT_CAMEO_STYLE.parchmentLight;
  traceOrganicPatch(context, -34, -37, 37, 26, -0.16);
  context.fill();
  context.fillStyle = PORTRAIT_CAMEO_STYLE.parchmentShadow;
  traceOrganicPatch(context, 36, 38, 41, 31, 0.14);
  context.fill();
  context.restore();

  context.fillStyle = dark;
  tracePortraitCameoSilhouette(context, 55);
  context.fill();

  context.save();
  tracePortraitCameoSilhouette(context, 55);
  context.clip();
  context.save();
  context.globalAlpha = 0.58;
  context.fillStyle = light;
  traceOrganicPatch(context, -26, -29, 39, 28, -0.16);
  context.fill();
  context.restore();
  context.fillStyle = `rgba(255,239,194,${shimmer})`;
  traceOrganicPatch(context, -24, -27, 34, 22, -0.18);
  context.fill();
  context.fillStyle = darken(dark, 0.08);
  context.globalAlpha = 0.36;
  traceOrganicPatch(context, 27, 30, 36, 22, 0.14);
  context.fill();
  context.globalAlpha = 1;
  context.strokeStyle = 'rgba(255, 235, 188, 0.16)';
  context.lineWidth = 0.8;
  context.beginPath();
  context.moveTo(-47, 4);
  context.bezierCurveTo(-24, -4, 8, -2, 39, -13);
  context.moveTo(-38, 29);
  context.bezierCurveTo(-13, 21, 14, 28, 37, 18);
  context.stroke();
  context.restore();

  context.restore();
}

function drawPortraitFrame(context, time, reducedMotion) {
  const safeTime = Number.isFinite(time) ? time : 0;
  const glow = reducedMotion ? 0.7 : 0.66 + Math.sin(safeTime * 1.23) * 0.08;

  context.save();
  context.strokeStyle = PORTRAIT_CAMEO_STYLE.brassDeep;
  context.lineWidth = 8.5;
  tracePortraitCameoSilhouette(context, 60);
  context.stroke();

  context.strokeStyle = PORTRAIT_CAMEO_STYLE.brassBase;
  context.lineWidth = 5.2;
  tracePortraitCameoSilhouette(context, 59.5);
  context.stroke();

  context.strokeStyle = PORTRAIT_CAMEO_STYLE.brassShadow;
  context.lineWidth = 2.2;
  context.beginPath();
  context.moveTo(49, -25);
  context.bezierCurveTo(54, -5, 52, 21, 42, 37);
  context.bezierCurveTo(35, 47, 25, 52, 14, 54);
  context.stroke();

  context.strokeStyle = PORTRAIT_CAMEO_STYLE.parchmentShadow;
  context.lineWidth = 3;
  tracePortraitCameoSilhouette(context, 55.9);
  context.stroke();
  context.strokeStyle = PORTRAIT_CAMEO_STYLE.parchmentLight;
  context.lineWidth = 1.25;
  tracePortraitCameoSilhouette(context, 54.8);
  context.stroke();

  context.save();
  context.globalAlpha = glow;
  context.strokeStyle = PORTRAIT_CAMEO_STYLE.brassLight;
  context.lineWidth = 1.8;
  context.beginPath();
  context.moveTo(-49, -32);
  context.bezierCurveTo(-43, -49, -23, -58, -5, -57);
  context.bezierCurveTo(7, -59, 19, -56, 29, -51);
  context.stroke();
  context.restore();

  context.strokeStyle = PORTRAIT_CAMEO_STYLE.toolMark;
  context.lineWidth = 1.05;
  context.beginPath();
  context.moveTo(47, -27);
  context.quadraticCurveTo(50, -21, 49, -15);
  context.moveTo(51, 11);
  context.quadraticCurveTo(49, 17, 46, 22);
  context.moveTo(30, 49);
  context.quadraticCurveTo(24, 52, 18, 53);
  context.moveTo(-34, 46);
  context.quadraticCurveTo(-39, 42, -41, 37);
  context.stroke();

  context.strokeStyle = 'rgba(255, 226, 156, 0.4)';
  context.lineWidth = 0.75;
  context.beginPath();
  context.moveTo(-50, -17);
  context.lineTo(-47, -13);
  context.moveTo(-22, -53);
  context.lineTo(-17, -54);
  context.moveTo(39, 38);
  context.lineTo(35, 42);
  context.stroke();
  context.restore();
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
    'character-sprite-spike-review': 'SP-E spike · code-drawn vs painted parts',
    'hagrid-sprite-review': 'SP-F · code-drawn vs painted Hagrid',
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
  const width = guide ? 78 : violet ? 54 : 54;
  context.save();
  context.fillStyle = guide ? 'rgba(25,17,18,0.34)' : 'rgba(27,18,24,0.28)';
  traceOrganicGroundShadow(context, 4, 26, width, guide ? 14 : 10, 0.08);
  context.fill();
  context.fillStyle = guide ? 'rgba(43,27,22,0.3)' : 'rgba(45,27,22,0.25)';
  traceOrganicGroundShadow(context, -2, 23, width * 0.72, guide ? 7.5 : 5.5, -0.11);
  context.fill();
  context.fillStyle = guide ? 'rgba(20,15,15,0.22)' : 'rgba(24,17,21,0.17)';
  traceOrganicGroundShadow(context, 1, 21.5, width * 0.43, guide ? 4.5 : 3.5, 0.13);
  context.fill();
  context.restore();
}

function traceOrganicGroundShadow(context, x, y, radiusX, radiusY, wobble) {
  context.beginPath();
  context.moveTo(x - radiusX * (0.96 + wobble), y - radiusY * 0.08);
  context.bezierCurveTo(
    x - radiusX * 0.63,
    y - radiusY * (1.02 - wobble),
    x + radiusX * 0.38,
    y - radiusY * (0.88 + wobble),
    x + radiusX * (1.01 - wobble),
    y + radiusY * 0.05,
  );
  context.bezierCurveTo(
    x + radiusX * 0.57,
    y + radiusY * (0.93 - wobble),
    x - radiusX * 0.42,
    y + radiusY * (1.04 + wobble),
    x - radiusX * (0.96 + wobble),
    y - radiusY * 0.08,
  );
  context.closePath();
}

function drawCompanionShadow(context, type, motion) {
  const toad = type === 'toad';
  const hopLift = Math.min(0.42, motion.hop / (toad ? 18 : 15));
  context.save();
  context.globalAlpha = 1 - hopLift;
  context.fillStyle = 'rgba(25,17,24,0.24)';
  traceOrganicPatch(context, 2, toad ? 4 : 5, toad ? 43 : 31, toad ? 8 : 7, toad ? -0.1 : 0.12);
  context.fill();
  context.fillStyle = 'rgba(92,54,36,0.12)';
  traceOrganicPatch(context, -3, toad ? 2 : 3, toad ? 30 : 22, toad ? 4.5 : 4, toad ? 0.16 : -0.14);
  context.fill();
  context.restore();
}

function drawVioletLeg(context, x, stride, behind, motion, outfit, lightDirection = -1) {
  const footX = x + stride;
  const lift = Math.abs(motion.stride) * (behind ? 1.4 : 0.7);
  const casual = outfit === 'casual';
  const legTop = casual ? -51 : -10;
  const shoeBase = casual ? VIOLET_STYLE.casualShoeBase : VIOLET_STYLE.shoeBase;
  const shoeShadow = casual ? VIOLET_STYLE.casualShoeShadow : VIOLET_STYLE.shoeShadow;
  const shoeLight = casual ? VIOLET_STYLE.casualShoeLight : VIOLET_STYLE.shoeLight;
  const lit = Math.sign(x) === lightDirection;
  context.save();
  context.globalAlpha = behind ? 0.88 : 1;

  context.fillStyle = casual ? VIOLET_STYLE.casualLeggingBase : VIOLET_STYLE.robeMid;
  context.beginPath();
  context.moveTo(x - (casual ? 7 : 5), legTop);
  context.bezierCurveTo(
    x - (casual ? 8 : 7),
    casual ? -27 : 1,
    x + stride * 0.1 - 7,
    12,
    footX - 6,
    22 - lift,
  );
  context.bezierCurveTo(footX - 1, 25 - lift, footX + 6, 24 - lift, footX + 7, 19 - lift);
  context.bezierCurveTo(
    x + stride * 0.42 + 6,
    8,
    x + (casual ? 8 : 5),
    casual ? -27 : -2,
    x + (casual ? 7 : 5),
    legTop,
  );
  context.closePath();
  fillStroke(context, 1.8);

  if (casual) {
    context.fillStyle = lit ? VIOLET_STYLE.casualLeggingLight : VIOLET_STYLE.casualLeggingShadow;
    context.beginPath();
    context.moveTo(x + 1, -48);
    context.bezierCurveTo(x + 7, -28, x + stride * 0.24 + 5, -5, footX + 3, 18 - lift);
    context.bezierCurveTo(footX + 6, 18 - lift, footX + 7, 15 - lift, footX + 5, 11 - lift);
    context.bezierCurveTo(x + stride * 0.2 + 3, -9, x + 5, -33, x + 5, -49);
    context.closePath();
    context.fill();
    context.strokeStyle = 'rgba(214, 202, 222, 0.2)';
    context.lineWidth = 0.9;
    context.beginPath();
    context.moveTo(x - 2, -43);
    context.bezierCurveTo(x - 4, -24, x + stride * 0.1 - 2, -3, footX - 2, 16 - lift);
    context.stroke();
  }

  context.fillStyle = shoeBase;
  context.beginPath();
  context.moveTo(footX - 8, 16 - lift);
  context.bezierCurveTo(footX - 2, 14 - lift, footX + 5, 16 - lift, footX + 10, 18 - lift);
  context.bezierCurveTo(footX + 17, 18 - lift, footX + 23, 21 - lift, footX + 24, 25 - lift);
  context.bezierCurveTo(footX + 22, 30 - lift, footX + 10, 32 - lift, footX - 5, 30 - lift);
  context.bezierCurveTo(footX - 11, 27 - lift, footX - 12, 20 - lift, footX - 8, 16 - lift);
  context.closePath();
  fillStroke(context, 2.25);

  context.fillStyle = shoeShadow;
  context.beginPath();
  context.moveTo(footX - 8, 25 - lift);
  context.bezierCurveTo(footX + 2, 28 - lift, footX + 14, 29 - lift, footX + 23, 25 - lift);
  context.bezierCurveTo(footX + 21, 31 - lift, footX + 5, 33 - lift, footX - 5, 30 - lift);
  context.quadraticCurveTo(footX - 9, 28 - lift, footX - 8, 25 - lift);
  context.closePath();
  context.fill();

  context.strokeStyle = shoeLight;
  context.lineWidth = 1.55;
  context.beginPath();
  context.moveTo(footX - 3, 20 - lift);
  context.bezierCurveTo(footX + 3, 17 - lift, footX + 9, 18 - lift, footX + 14, 21 - lift);
  context.stroke();
  context.strokeStyle = casual ? VIOLET_STYLE.casualShoeAccent : shoeLight;
  context.beginPath();
  context.moveTo(footX + 1, 21 - lift);
  context.quadraticCurveTo(footX + 5, 24 - lift, footX + 10, 21 - lift);
  context.moveTo(footX + 5, 23 - lift);
  context.quadraticCurveTo(footX + 9, 25 - lift, footX + 13, 22 - lift);
  context.stroke();
  context.strokeStyle = casual ? VIOLET_STYLE.casualShoeSole : 'rgba(246, 231, 207, 0.66)';
  context.lineWidth = 1.2;
  context.beginPath();
  context.moveTo(footX - 5, 27 - lift);
  context.bezierCurveTo(footX + 4, 30 - lift, footX + 15, 29 - lift, footX + 21, 26 - lift);
  context.stroke();
  context.restore();
}

function drawVioletBackHair(context, motion, lightDirection = -1) {
  const lift = motion.hairLift;
  const swing = motion.robeSwing * 0.35;
  context.fillStyle = VIOLET_STYLE.hairBase;
  context.beginPath();
  context.moveTo(-35, -169);
  context.bezierCurveTo(-51, -151, -48, -118, -42 + swing, -84 - lift);
  context.bezierCurveTo(-38, -72, -28, -66, -20, -78 - lift * 0.35);
  context.bezierCurveTo(-13, -63, -2, -62, 6, -78 - lift * 0.25);
  context.bezierCurveTo(16, -64, 28, -67, 37 + swing, -84 - lift * 0.5);
  context.bezierCurveTo(48, -117, 45, -151, 30, -171);
  context.bezierCurveTo(12, -188, -17, -187, -35, -169);
  context.closePath();
  fillStroke(context, 2.1);

  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.fillStyle = VIOLET_STYLE.hairShadow;
  context.beginPath();
  context.moveTo(4, -184);
  context.bezierCurveTo(31, -180, 44, -154, 40, -119);
  context.bezierCurveTo(42, -101, 41, -86, 33 + swing, -77 - lift * 0.4);
  context.bezierCurveTo(24, -67, 16, -70, 11, -82);
  context.bezierCurveTo(17, -112, 15, -154, 4, -184);
  context.closePath();
  context.fill();

  context.fillStyle = VIOLET_STYLE.hairLight;
  context.beginPath();
  context.moveTo(-28, -164);
  context.bezierCurveTo(-41, -137, -38, -106, -32 + swing, -86 - lift * 0.5);
  context.bezierCurveTo(-28, -78, -23, -78, -19, -88);
  context.bezierCurveTo(-24, -115, -19, -146, -8, -171);
  context.bezierCurveTo(-18, -174, -24, -171, -28, -164);
  context.closePath();
  context.fill();

  context.strokeStyle = VIOLET_STYLE.hairMid;
  context.lineWidth = 1.65;
  context.beginPath();
  for (const [x, bend, end, phase] of [
    [-29, -7, -90, 0.2], [-16, 5, -79, -0.1], [-2, -4, -81, 0.15], [13, 6, -82, -0.08], [28, 4, -91, 0.12],
  ]) {
    context.moveTo(x, -169 + Math.abs(x) * 0.12);
    context.bezierCurveTo(x + bend, -144, x - bend * 0.45, -111, x + bend + swing * phase, end - lift * phase);
  }
  context.stroke();
  context.strokeStyle = VIOLET_STYLE.hairRim;
  context.lineWidth = 1.05;
  context.beginPath();
  context.moveTo(-32, -159);
  context.bezierCurveTo(-41, -134, -37, -107, -33, -91 - lift * 0.4);
  context.moveTo(-20, -175);
  context.bezierCurveTo(-27, -146, -26, -111, -22, -88 - lift * 0.2);
  context.stroke();
  context.restore();
}

function drawVioletCasualArm(
  context,
  motion,
  side,
  behind,
  hasWand = false,
  lightDirection = -1,
) {
  const swing = (side < 0 ? motion.armSwing : -motion.armSwing) * 0.72;
  const elbowX = 43 + swing * 0.1;
  const elbowY = -58 + swing * 0.28;
  const wristX = 37 + swing * 0.12;
  const wristY = -32 + swing * 0.62;
  const lit = side === lightDirection;
  context.save();
  context.scale(side, 1);
  context.globalAlpha = behind ? 0.92 : 1;

  // The upper arm tucks under the sleeve cap and overlaps the forearm at a shaped elbow.
  context.fillStyle = VIOLET_STYLE.skinBase;
  context.beginPath();
  context.moveTo(32, -81);
  context.bezierCurveTo(39, -78, 44, -70, elbowX + 5, elbowY - 3);
  context.bezierCurveTo(elbowX + 5, elbowY + 4, elbowX - 1, elbowY + 8, elbowX - 6, elbowY + 3);
  context.bezierCurveTo(36, -64, 31, -73, 32, -81);
  context.closePath();
  fillStroke(context, 1.65);

  context.fillStyle = VIOLET_STYLE.skinBase;
  context.beginPath();
  context.moveTo(elbowX - 5, elbowY - 2);
  context.bezierCurveTo(elbowX + 3, elbowY - 6, wristX + 7, wristY - 8, wristX + 7, wristY - 2);
  context.bezierCurveTo(wristX + 5, wristY + 5, wristX - 3, wristY + 7, wristX - 7, wristY + 1);
  context.bezierCurveTo(wristX - 5, wristY - 8, elbowX - 1, elbowY + 6, elbowX - 5, elbowY - 2);
  context.closePath();
  fillStroke(context, 1.6);

  context.fillStyle = lit ? VIOLET_STYLE.skinLight : VIOLET_STYLE.skinShadow;
  context.globalAlpha = behind ? 0.36 : 1;
  context.beginPath();
  context.moveTo(elbowX + 1, elbowY - 1);
  context.bezierCurveTo(elbowX + 4, elbowY + 4, wristX + 5, wristY - 4, wristX + 3, wristY);
  context.bezierCurveTo(wristX + 1, wristY + 2, wristX - 1, wristY + 2, wristX - 2, wristY);
  context.bezierCurveTo(wristX + 1, wristY - 8, elbowX + 2, elbowY + 2, elbowX + 1, elbowY - 1);
  context.closePath();
  context.fill();
  context.globalAlpha = behind ? 0.92 : 1;

  context.fillStyle = lit ? VIOLET_STYLE.casualJerseyMid : VIOLET_STYLE.casualJerseyShadow;
  context.beginPath();
  context.moveTo(22, -99);
  context.bezierCurveTo(30, -103, 40, -98, 44, -89);
  context.bezierCurveTo(47, -83, 45, -76, 40, -72);
  context.bezierCurveTo(35, -70, 29, -73, 27, -78);
  context.bezierCurveTo(28, -86, 25, -95, 22, -99);
  context.closePath();
  fillStroke(context, 1.75);
  context.fillStyle = lit ? VIOLET_STYLE.casualJerseyLight : 'rgba(31, 39, 67, 0.24)';
  context.beginPath();
  context.moveTo(25, -97);
  context.bezierCurveTo(31, -99, 38, -94, 40, -88);
  context.quadraticCurveTo(38, -83, 34, -81);
  context.bezierCurveTo(31, -88, 29, -94, 25, -97);
  context.closePath();
  context.fill();
  context.strokeStyle = VIOLET_STYLE.casualJerseyTrim;
  context.lineWidth = 2.5;
  context.beginPath();
  context.moveTo(40, -72);
  context.bezierCurveTo(35, -70, 29, -73, 27, -78);
  context.stroke();

  context.strokeStyle = 'rgba(126, 75, 65, 0.42)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(elbowX - 3, elbowY + 1);
  context.quadraticCurveTo(elbowX, elbowY + 4, elbowX + 3, elbowY + 1);
  context.stroke();

  drawHand(context, wristX, wristY + 6, VIOLET_STYLE.skinBase, 7.8);
  context.restore();
  if (hasWand && side > 0) drawVioletWand(context, wristX, wristY + 6);
}

function drawVioletCasualJersey(context, motion, lightDirection = -1) {
  const swing = motion.robeSwing * 0.25;
  context.fillStyle = VIOLET_STYLE.casualJerseyBase;
  context.beginPath();
  context.moveTo(-27, -103);
  context.bezierCurveTo(-37, -101, -41, -90, -39, -79);
  context.bezierCurveTo(-39, -67, -36 - swing * 0.2, -52, -36 - swing, -42);
  context.bezierCurveTo(-22, -36, -7, -39, 1, -36 + swing * 0.1);
  context.bezierCurveTo(13, -39, 27, -36, 36 + swing, -43);
  context.bezierCurveTo(36, -57, 39, -70, 39, -81);
  context.bezierCurveTo(41, -92, 36, -101, 27, -104);
  context.bezierCurveTo(10, -109, -11, -108, -27, -103);
  context.closePath();
  fillStroke(context, 2.05);

  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.fillStyle = VIOLET_STYLE.casualJerseyShadow;
  context.beginPath();
  context.moveTo(4, -105);
  context.bezierCurveTo(25, -105, 38, -96, 37, -80);
  context.bezierCurveTo(38, -67, 35, -52, 35 + swing, -43);
  context.bezierCurveTo(24, -37, 13, -39, 4, -37);
  context.bezierCurveTo(10, -59, 10, -85, 4, -105);
  context.closePath();
  context.fill();

  context.fillStyle = VIOLET_STYLE.casualJerseyMid;
  context.beginPath();
  context.moveTo(-25, -100);
  context.bezierCurveTo(-34, -90, -34, -75, -32, -62);
  context.bezierCurveTo(-34, -52, -34, -46, -34, -42);
  context.bezierCurveTo(-25, -38, -17, -39, -11, -39);
  context.bezierCurveTo(-15, -58, -12, -84, -6, -101);
  context.bezierCurveTo(-13, -105, -20, -104, -25, -100);
  context.closePath();
  context.fill();

  context.fillStyle = VIOLET_STYLE.casualJerseyLight;
  context.beginPath();
  context.moveTo(-27, -96);
  context.bezierCurveTo(-34, -84, -31, -69, -31, -59);
  context.bezierCurveTo(-33, -52, -34, -47, -33, -44);
  context.bezierCurveTo(-27, -42, -23, -42, -20, -42);
  context.bezierCurveTo(-23, -61, -18, -83, -27, -96);
  context.closePath();
  context.fill();

  context.fillStyle = WARM_BOUNCE;
  context.beginPath();
  context.moveTo(-34 - swing, -48);
  context.bezierCurveTo(-19, -42, -8, -38, 1, -37 + swing * 0.1);
  context.bezierCurveTo(-11, -35, -24, -37, -36 - swing, -42);
  context.quadraticCurveTo(-37 - swing, -45, -34 - swing, -48);
  context.closePath();
  context.fill();
  context.restore();

  context.strokeStyle = VIOLET_STYLE.casualJerseyTrim;
  context.lineWidth = 2.1;
  context.beginPath();
  context.moveTo(-34 - swing, -43);
  context.bezierCurveTo(-22, -38, -9, -40, 1, -37 + swing * 0.1);
  context.bezierCurveTo(13, -40, 25, -37, 34 + swing, -44);
  context.stroke();

  context.strokeStyle = 'rgba(235, 222, 240, 0.34)';
  context.lineWidth = 1.15;
  context.beginPath();
  context.moveTo(-20, -96);
  context.bezierCurveTo(-25, -79, -24, -59, -26, -44);
  context.moveTo(18, -97);
  context.bezierCurveTo(23, -80, 23, -59, 27, -44);
  context.moveTo(-5, -91);
  context.bezierCurveTo(-8, -74, -7, -55, -9, -40);
  context.stroke();

  context.strokeStyle = VIOLET_STYLE.casualJerseyShadow;
  context.lineWidth = 2.3;
  context.beginPath();
  context.moveTo(-25, -99);
  context.bezierCurveTo(-18, -92, -14, -87, -10, -80);
  context.moveTo(25, -100);
  context.bezierCurveTo(18, -93, 13, -87, 9, -80);
  context.stroke();

  // A cream shoulder yoke and long side stripes make this read as a soccer kit, not sleepwear.
  context.fillStyle = VIOLET_STYLE.casualJerseyTrim;
  context.beginPath();
  context.moveTo(-28, -101);
  context.bezierCurveTo(-36, -98, -39, -91, -38, -84);
  context.bezierCurveTo(-31, -88, -23, -91, -14, -95);
  context.bezierCurveTo(-18, -100, -23, -102, -28, -101);
  context.closePath();
  context.moveTo(28, -102);
  context.bezierCurveTo(35, -99, 39, -92, 38, -85);
  context.bezierCurveTo(31, -89, 23, -92, 14, -96);
  context.bezierCurveTo(18, -101, 23, -103, 28, -102);
  context.closePath();
  context.fill();

  context.strokeStyle = VIOLET_STYLE.casualJerseyTrim;
  context.lineWidth = 2.8;
  context.beginPath();
  context.moveTo(-34, -85);
  context.bezierCurveTo(-31, -72, -34, -58, -33 - swing, -46);
  context.moveTo(34, -85);
  context.bezierCurveTo(31, -72, 34, -58, 33 + swing, -47);
  context.stroke();

  // An organic team shield and hand-drawn seven give the jersey an unmistakable match identity.
  context.fillStyle = VIOLET_STYLE.casualJerseyTrim;
  context.beginPath();
  context.moveTo(-25, -72);
  context.bezierCurveTo(-21, -75, -15, -74, -12, -71);
  context.bezierCurveTo(-12, -65, -16, -60, -19, -58);
  context.bezierCurveTo(-23, -60, -26, -65, -25, -72);
  context.closePath();
  context.fill();
  context.fillStyle = VIOLET_STYLE.casualJerseyShadow;
  context.beginPath();
  context.moveTo(-22, -70);
  context.bezierCurveTo(-19, -72, -16, -71, -14, -69);
  context.bezierCurveTo(-15, -65, -17, -63, -19, -61);
  context.bezierCurveTo(-21, -63, -23, -66, -22, -70);
  context.closePath();
  context.fill();

  context.strokeStyle = VIOLET_STYLE.casualJerseyTrim;
  context.lineWidth = 3.1;
  context.beginPath();
  context.moveTo(9, -72);
  context.bezierCurveTo(13, -74, 18, -74, 22, -72);
  context.bezierCurveTo(18, -68, 14, -62, 12, -56);
  context.stroke();
}

function drawVioletCasualNeckline(context) {
  context.fillStyle = VIOLET_STYLE.casualJerseyTrim;
  context.beginPath();
  context.moveTo(-20, -102);
  context.bezierCurveTo(-13, -106, -6, -105, 0, -101);
  context.bezierCurveTo(7, -106, 14, -106, 21, -102);
  context.bezierCurveTo(14, -94, 7, -88, 1, -85);
  context.bezierCurveTo(-6, -88, -14, -94, -20, -102);
  context.closePath();
  fillStroke(context, 1.55);
  context.fillStyle = VIOLET_STYLE.casualJerseyShadow;
  context.beginPath();
  context.moveTo(-14, -101);
  context.bezierCurveTo(-9, -103, -4, -102, 0, -98);
  context.bezierCurveTo(5, -102, 10, -103, 15, -101);
  context.bezierCurveTo(10, -96, 5, -91, 1, -89);
  context.bezierCurveTo(-4, -91, -9, -96, -14, -101);
  context.closePath();
  context.fill();
  context.strokeStyle = 'rgba(250, 236, 214, 0.42)';
  context.lineWidth = 0.9;
  context.beginPath();
  context.moveTo(-17, -101);
  context.bezierCurveTo(-10, -96, -5, -90, 1, -87);
  context.bezierCurveTo(7, -90, 12, -96, 18, -101);
  context.stroke();
}

function drawVioletBackArm(context, trim, motion) {
  const swing = motion.armSwing;
  const cuffX = -45 - swing * 0.25;
  const cuffY = -36 + swing;
  context.fillStyle = VIOLET_STYLE.robeBase;
  context.beginPath();
  context.moveTo(-29, -97);
  context.bezierCurveTo(-43, -94, -51, -72, cuffX - 6, cuffY - 6);
  context.bezierCurveTo(cuffX - 4, cuffY + 2, cuffX + 3, cuffY + 6, cuffX + 10, cuffY + 1);
  context.bezierCurveTo(-39, -57, -32, -82, -29, -97);
  context.closePath();
  fillStroke(context, 1.9);
  context.fillStyle = VIOLET_STYLE.robeLight;
  context.beginPath();
  context.moveTo(-34, -89);
  context.bezierCurveTo(-45, -68, cuffX - 4, cuffY - 8, cuffX + 1, cuffY - 5);
  context.bezierCurveTo(-41, -67, -36, -81, -34, -89);
  context.closePath();
  context.fill();
  context.strokeStyle = trim;
  context.lineWidth = 4.8;
  context.beginPath();
  context.moveTo(cuffX - 5, cuffY - 5);
  context.bezierCurveTo(cuffX - 1, cuffY - 1, cuffX + 4, cuffY + 2, cuffX + 9, cuffY);
  context.stroke();
  drawHand(context, -43 - swing * 0.25, -27 + swing, VIOLET_STYLE.skinBase, 8);
}

function drawVioletRobe(context, trim, motion) {
  const swing = motion.robeSwing;
  const leftHem = -58 - swing * 0.22;
  const rightHem = 58 + swing * 0.22;
  context.fillStyle = VIOLET_STYLE.robeBase;
  context.beginPath();
  context.moveTo(-29, -102);
  context.bezierCurveTo(-45, -97, -48, -82, -45, -68);
  context.bezierCurveTo(-47, -43, -54, -16, leftHem, 1);
  context.bezierCurveTo(-38, 10, -18, 13, 1, 8 + swing * 0.08);
  context.bezierCurveTo(20, 14, 42, 10, rightHem, 0);
  context.bezierCurveTo(54, -18, 47, -45, 45, -70);
  context.bezierCurveTo(47, -86, 41, -98, 29, -103);
  context.bezierCurveTo(11, -109, -12, -108, -29, -102);
  context.closePath();
  fillStroke(context, 2.15);

  context.fillStyle = VIOLET_STYLE.robeShadow;
  context.beginPath();
  context.moveTo(5, -103);
  context.bezierCurveTo(27, -103, 43, -89, 42, -67);
  context.bezierCurveTo(44, -42, 52, -15, rightHem, 0);
  context.bezierCurveTo(41, 10, 24, 12, 5, 7);
  context.bezierCurveTo(12, -26, 11, -70, 5, -103);
  context.closePath();
  context.fill();

  context.fillStyle = VIOLET_STYLE.robeMid;
  context.beginPath();
  context.moveTo(-28, -98);
  context.bezierCurveTo(-43, -83, -42, -59, -42, -45);
  context.bezierCurveTo(-47, -25, -50, -10, -51, -2);
  context.bezierCurveTo(-40, 4, -29, 7, -19, 7);
  context.bezierCurveTo(-23, -25, -19, -69, -12, -96);
  context.bezierCurveTo(-18, -102, -23, -102, -28, -98);
  context.closePath();
  context.fill();

  context.fillStyle = VIOLET_STYLE.robeLight;
  context.beginPath();
  context.moveTo(-30, -95);
  context.bezierCurveTo(-39, -76, -36, -51, -39, -31);
  context.bezierCurveTo(-42, -19, -45, -8, -47, -2);
  context.bezierCurveTo(-40, 1, -34, 3, -29, 3);
  context.bezierCurveTo(-31, -26, -24, -67, -30, -95);
  context.closePath();
  context.fill();

  context.fillStyle = trim;
  context.globalAlpha = 0.92;
  context.beginPath();
  context.moveTo(-17, -94);
  context.bezierCurveTo(-13, -72, -17, -36, -22, 2);
  context.bezierCurveTo(-15, 7, -7, 9, 1, 8);
  context.bezierCurveTo(9, 10, 17, 7, 22, 2);
  context.bezierCurveTo(17, -36, 13, -72, 17, -95);
  context.bezierCurveTo(11, -100, 6, -101, 0, -97);
  context.bezierCurveTo(-6, -101, -12, -99, -17, -94);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;

  context.fillStyle = WARM_BOUNCE;
  context.beginPath();
  context.moveTo(leftHem + 5, -8);
  context.bezierCurveTo(-29, -1, -13, 7, 1, 8);
  context.bezierCurveTo(-18, 13, -40, 9, leftHem, 1);
  context.quadraticCurveTo(leftHem - 1, -3, leftHem + 5, -8);
  context.closePath();
  context.fill();

  context.strokeStyle = trim;
  context.lineWidth = 4.8;
  context.beginPath();
  context.moveTo(leftHem + 4, 0);
  context.bezierCurveTo(-35, 9, -16, 12, 1, 8 + swing * 0.08);
  context.bezierCurveTo(19, 13, 39, 9, rightHem - 4, 0);
  context.stroke();
  context.strokeStyle = 'rgba(255, 239, 211, 0.36)';
  context.lineWidth = 1.15;
  context.beginPath();
  context.moveTo(leftHem + 8, -1);
  context.bezierCurveTo(-31, 6, -14, 9, 0, 7);
  context.stroke();

  context.strokeStyle = 'rgba(228, 212, 190, 0.25)';
  context.lineWidth = 1.25;
  context.beginPath();
  context.moveTo(-21, -88);
  context.bezierCurveTo(-27, -58, -27, -25, -32, -3);
  context.moveTo(20, -89);
  context.bezierCurveTo(25, -59, 27, -25, 33, -3);
  context.moveTo(-1, -87);
  context.bezierCurveTo(-4, -55, -4, -25, -6, 2);
  context.stroke();
  context.strokeStyle = 'rgba(18, 15, 24, 0.46)';
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(10, -83);
  context.bezierCurveTo(13, -57, 13, -28, 18, 5);
  context.stroke();
}

function drawVioletFrontArm(context, trim, motion, hasWand) {
  const swing = -motion.armSwing;
  const cuffX = 43 + swing * 0.25;
  const cuffY = -36 + swing;
  context.fillStyle = VIOLET_STYLE.robeMid;
  context.beginPath();
  context.moveTo(29, -98);
  context.bezierCurveTo(44, -95, 51, -74, cuffX + 6, cuffY - 6);
  context.bezierCurveTo(cuffX + 4, cuffY + 2, cuffX - 3, cuffY + 6, cuffX - 10, cuffY + 1);
  context.bezierCurveTo(39, -58, 32, -82, 29, -98);
  context.closePath();
  fillStroke(context, 1.9);
  context.fillStyle = VIOLET_STYLE.robeShadow;
  context.globalAlpha = 0.72;
  context.beginPath();
  context.moveTo(35, -90);
  context.bezierCurveTo(46, -69, cuffX + 4, cuffY - 8, cuffX - 1, cuffY - 5);
  context.bezierCurveTo(41, -67, 36, -81, 35, -90);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;
  context.strokeStyle = trim;
  context.lineWidth = 4.8;
  context.beginPath();
  context.moveTo(cuffX + 5, cuffY - 5);
  context.bezierCurveTo(cuffX + 1, cuffY - 1, cuffX - 4, cuffY + 2, cuffX - 9, cuffY);
  context.stroke();
  const handX = 43 + swing * 0.25;
  const handY = -27 + swing;
  drawHand(context, handX, handY, VIOLET_STYLE.skinBase, 8.5);
  if (hasWand) drawVioletWand(context, handX, handY);
}

function drawVioletWand(context, handX, handY) {
  context.fillStyle = '#68442e';
  context.beginPath();
  context.moveTo(handX - 3, handY + 2);
  context.bezierCurveTo(handX + 8, handY - 14, handX + 27, handY - 42, handX + 39, handY - 58);
  context.bezierCurveTo(handX + 42, handY - 60, handX + 44, handY - 57, handX + 41, handY - 53);
  context.bezierCurveTo(handX + 28, handY - 35, handX + 13, handY - 11, handX + 3, handY + 3);
  context.bezierCurveTo(handX + 1, handY + 5, handX - 2, handY + 4, handX - 3, handY + 2);
  context.closePath();
  fillStroke(context, 1.5);
  context.fillStyle = '#4a3027';
  context.beginPath();
  context.moveTo(handX + 18, handY - 24);
  context.bezierCurveTo(handX + 27, handY - 39, handX + 35, handY - 51, handX + 41, handY - 57);
  context.bezierCurveTo(handX + 36, handY - 45, handX + 28, handY - 32, handX + 18, handY - 24);
  context.closePath();
  context.fill();
  context.strokeStyle = 'rgba(242, 202, 132, 0.38)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(handX + 1, handY + 1);
  context.bezierCurveTo(handX + 13, handY - 14, handX + 27, handY - 39, handX + 38, handY - 54);
  context.stroke();
}

function drawVioletHead(
  context,
  blinking,
  time,
  pose = 'idle',
  motion,
  detail = 'world',
  lightDirection = -1,
) {
  drawVioletEar(context, -37, -143, -1);
  drawVioletEar(context, 38, -142, 1);

  context.fillStyle = VIOLET_STYLE.skinBase;
  context.beginPath();
  context.moveTo(-5, -184);
  context.bezierCurveTo(-26, -185, -39, -169, -37, -147);
  context.bezierCurveTo(-41, -125, -25, -105, -5, -101);
  context.bezierCurveTo(12, -98, 31, -109, 38, -131);
  context.bezierCurveTo(43, -153, 34, -177, 13, -184);
  context.bezierCurveTo(7, -187, 1, -187, -5, -184);
  context.closePath();
  fillStroke(context, 2.15);

  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.fillStyle = VIOLET_STYLE.skinShadow;
  context.globalAlpha = 0.3;
  context.beginPath();
  context.moveTo(8, -183);
  context.bezierCurveTo(31, -178, 40, -158, 36, -136);
  context.bezierCurveTo(33, -117, 20, -103, 6, -101);
  context.bezierCurveTo(14, -123, 15, -156, 8, -183);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;

  context.fillStyle = VIOLET_STYLE.skinLight;
  context.beginPath();
  context.moveTo(-27, -170);
  context.bezierCurveTo(-20, -181, -7, -184, 3, -179);
  context.bezierCurveTo(-9, -170, -15, -158, -17, -145);
  context.bezierCurveTo(-26, -146, -33, -159, -27, -170);
  context.closePath();
  context.fill();
  context.restore();

  drawVioletCheek(context, -24, -127, -1);
  drawVioletCheek(context, 24, -126, 1);

  const gazeX = Math.sin(time * 0.66 + 0.4) * 1.25;
  const gazeY = Math.sin(time * 0.41 + 1.3) * 0.55;
  drawVioletEyes(context, blinking, gazeX, gazeY, pose, time, detail);
  drawVioletGlasses(context);
  drawVioletNose(context);
  drawVioletMouth(context, pose, time);
  drawVioletFrontHair(context, time, motion, detail, lightDirection);
}

function drawVioletEar(context, x, y, side) {
  context.fillStyle = VIOLET_STYLE.skinBase;
  context.beginPath();
  context.moveTo(x - side * 2, y - 8);
  context.bezierCurveTo(x + side * 8, y - 10, x + side * 10, y + 4, x + side * 3, y + 10);
  context.bezierCurveTo(x - side * 5, y + 8, x - side * 7, y - 3, x - side * 2, y - 8);
  context.closePath();
  fillStroke(context, 1.7);
  context.strokeStyle = 'rgba(120, 67, 65, 0.36)';
  context.lineWidth = 1.15;
  context.beginPath();
  context.moveTo(x + side, y - 4);
  context.bezierCurveTo(x + side * 6, y - 2, x + side * 5, y + 5, x, y + 6);
  context.stroke();
}

function drawVioletCheek(context, x, y, side) {
  context.fillStyle = VIOLET_STYLE.cheek;
  context.beginPath();
  context.moveTo(x - 8, y - 1);
  context.bezierCurveTo(x - 5, y - 6 - side, x + 5, y - 6 + side, x + 9, y);
  context.bezierCurveTo(x + 5, y + 5, x - 5, y + 5 + side, x - 8, y - 1);
  context.closePath();
  context.fill();
}

function drawVioletEyes(context, blinking, gazeX, gazeY, pose, time, detail) {
  const wonder = pose === 'wonder';
  const proud = pose === 'proud';
  const speaking = pose === 'speaking' || pose === 'talk';
  const browPulse = speaking ? Math.sin(time * 4.6 + 0.35) * 0.8 : 0;
  const eyes = [
    { x: -13.2, y: -146.2, side: -1, width: wonder ? 7.5 : 7.1, height: wonder ? 6.2 : 5.5 },
    { x: 13.4, y: -145.5, side: 1, width: wonder ? 7.2 : 6.8, height: wonder ? 6 : 5.2 },
  ];

  for (const eye of eyes) {
    if (blinking) {
      context.fillStyle = VIOLET_STYLE.skinShadow;
      context.globalAlpha = 0.42;
      context.beginPath();
      context.moveTo(eye.x - eye.width, eye.y + 0.3);
      context.bezierCurveTo(eye.x - 3, eye.y - 2.1, eye.x + 3.2, eye.y - 1.8, eye.x + eye.width, eye.y + 0.2);
      context.bezierCurveTo(eye.x + 3, eye.y + 2.5, eye.x - 3.4, eye.y + 2.7, eye.x - eye.width, eye.y + 0.3);
      context.closePath();
      context.fill();
      context.globalAlpha = 1;
      context.strokeStyle = OUTLINE;
      context.lineWidth = 1.7;
      context.beginPath();
      context.moveTo(eye.x - eye.width, eye.y + 0.2);
      context.bezierCurveTo(eye.x - 2.5, eye.y + 2.4, eye.x + 3.1, eye.y + 2.2, eye.x + eye.width, eye.y);
      context.stroke();
      continue;
    }

    context.fillStyle = VIOLET_STYLE.eyeWhite;
    context.beginPath();
    context.moveTo(eye.x - eye.width, eye.y + 0.2);
    context.bezierCurveTo(eye.x - 3.2, eye.y - eye.height, eye.x + 3.5, eye.y - eye.height + eye.side * 0.25, eye.x + eye.width, eye.y - 0.3);
    context.bezierCurveTo(eye.x + 3.1, eye.y + eye.height * 0.72, eye.x - 3.4, eye.y + eye.height * 0.8, eye.x - eye.width, eye.y + 0.2);
    context.closePath();
    fillStroke(context, 1.45);

    const irisX = eye.x + gazeX;
    const irisY = eye.y + gazeY;
    context.fillStyle = VIOLET_STYLE.iris;
    context.beginPath();
    context.moveTo(irisX - 0.4, irisY - 4.4);
    context.bezierCurveTo(irisX + 4, irisY - 3.8, irisX + 4.4, irisY + 2.5, irisX + 0.3, irisY + 4.3);
    context.bezierCurveTo(irisX - 3.8, irisY + 3.5, irisX - 4.2, irisY - 2.9, irisX - 0.4, irisY - 4.4);
    context.closePath();
    context.fill();
    context.fillStyle = VIOLET_STYLE.pupil;
    context.beginPath();
    context.moveTo(irisX, irisY - 2.55);
    context.bezierCurveTo(irisX + 2.15, irisY - 2, irisX + 2.35, irisY + 1.65, irisX + 0.15, irisY + 2.5);
    context.bezierCurveTo(irisX - 2.1, irisY + 2, irisX - 2.3, irisY - 1.7, irisX, irisY - 2.55);
    context.closePath();
    context.fill();
    context.fillStyle = 'rgba(250, 236, 207, 0.94)';
    context.beginPath();
    context.moveTo(irisX - 2.2, irisY - 2.6);
    context.bezierCurveTo(irisX - 0.9, irisY - 3.4, irisX + 0.2, irisY - 2.4, irisX - 0.2, irisY - 1.2);
    context.bezierCurveTo(irisX - 1.5, irisY - 0.9, irisX - 2.5, irisY - 1.5, irisX - 2.2, irisY - 2.6);
    context.closePath();
    context.fill();

    context.strokeStyle = STORYBOOK_INK.soft;
    context.lineWidth = 1.15;
    context.beginPath();
    context.moveTo(eye.x - eye.width, eye.y + 0.2);
    context.bezierCurveTo(eye.x - 3.1, eye.y - eye.height, eye.x + 3.5, eye.y - eye.height + eye.side * 0.25, eye.x + eye.width, eye.y - 0.3);
    context.stroke();
    if (detail === 'portrait') {
      context.strokeStyle = 'rgba(107, 72, 51, 0.38)';
      context.lineWidth = 0.8;
      context.beginPath();
      context.moveTo(irisX - 2.8, irisY + 1.6);
      context.quadraticCurveTo(irisX, irisY + 3.6, irisX + 2.7, irisY + 1.3);
      context.stroke();
    }
  }

  const leftLift = (wonder ? 3.2 : proud ? -0.2 : 0.8) + browPulse;
  const rightLift = (wonder ? 2.2 : proud ? 1.7 : 0.4) - browPulse * 0.35;
  context.strokeStyle = VIOLET_STYLE.hairShadow;
  context.lineWidth = 2.35;
  context.beginPath();
  context.moveTo(-21, -158 - leftLift);
  context.bezierCurveTo(-17, -162 - leftLift, -10, -162.5 - leftLift, -6, -158 - leftLift * 0.8);
  context.moveTo(6, -158 - rightLift);
  context.bezierCurveTo(10, -161.5 - rightLift, 17, -162 - rightLift, 22, -157.5 - rightLift * 0.8);
  context.stroke();
}

function drawVioletNose(context) {
  context.fillStyle = 'rgba(178, 113, 91, 0.18)';
  context.beginPath();
  context.moveTo(-1, -143);
  context.bezierCurveTo(-4, -135, -5, -130, -1, -128);
  context.bezierCurveTo(2, -126, 6, -128, 6, -131);
  context.bezierCurveTo(4, -136, 3, -141, -1, -143);
  context.closePath();
  context.fill();
  context.strokeStyle = '#8d5d4e';
  context.lineWidth = 1.1;
  context.beginPath();
  context.moveTo(0, -141);
  context.bezierCurveTo(-2, -135, -2, -131, 3, -130);
  context.stroke();
  context.strokeStyle = VIOLET_STYLE.skinLight;
  context.lineWidth = 0.9;
  context.beginPath();
  context.moveTo(-1, -139);
  context.quadraticCurveTo(-2, -135, 0, -133);
  context.stroke();
}

function drawVioletMouth(context, pose, time) {
  const speaking = pose === 'speaking' || pose === 'talk';
  const wonder = pose === 'wonder';
  if (speaking || wonder) {
    const open = wonder ? 4.3 : 3.1 + Math.abs(Math.sin(time * 8.4)) * 3.2;
    context.fillStyle = '#8f4d58';
    context.beginPath();
    context.moveTo(-7, -120);
    context.bezierCurveTo(-3, -123 - open * 0.18, 4, -123 - open * 0.1, 7, -119.5);
    context.bezierCurveTo(5, -114 + open * 0.45, -3, -113 + open * 0.5, -7, -120);
    context.closePath();
    fillStroke(context, 1.25);
    context.fillStyle = 'rgba(239, 151, 151, 0.68)';
    context.beginPath();
    context.moveTo(-4.5, -116.7 + open * 0.28);
    context.bezierCurveTo(-1, -114 + open * 0.48, 3.2, -114 + open * 0.4, 5, -117 + open * 0.24);
    context.quadraticCurveTo(0, -116 + open * 0.2, -4.5, -116.7 + open * 0.28);
    context.closePath();
    context.fill();
    return;
  }

  context.strokeStyle = '#8f4d58';
  context.lineWidth = 1.9;
  context.beginPath();
  if (pose === 'curious') {
    context.moveTo(-8, -119);
    context.bezierCurveTo(-3, -117.5, 2, -121, 8, -119.5);
  } else if (pose === 'proud') {
    context.moveTo(-9, -121);
    context.bezierCurveTo(-4, -115.5, 2, -114.5, 9, -120);
  } else {
    context.moveTo(-8, -120);
    context.bezierCurveTo(-3, -116.5, 3, -116, 8, -120.5);
  }
  context.stroke();
  context.strokeStyle = 'rgba(255, 214, 192, 0.34)';
  context.lineWidth = 0.8;
  context.beginPath();
  context.moveTo(-5, -119.5);
  context.quadraticCurveTo(-1, -117.5, 3, -118.2);
  context.stroke();
}

function drawVioletFrontHair(context, time, motion, detail, lightDirection = -1) {
  context.fillStyle = VIOLET_STYLE.hairBase;
  context.beginPath();
  context.moveTo(-36, -154);
  context.bezierCurveTo(-41, -178, -23, -194, 1, -193);
  context.bezierCurveTo(25, -194, 41, -177, 38, -151);
  context.bezierCurveTo(31, -166, 22, -170, 15, -168);
  context.bezierCurveTo(10, -165, 7, -158, 1, -157);
  context.bezierCurveTo(-5, -158, -8, -169, -14, -169);
  context.bezierCurveTo(-20, -168, -24, -160, -29, -166);
  context.quadraticCurveTo(-32, -158, -36, -154);
  context.closePath();
  fillStroke(context, 2.05);

  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.fillStyle = VIOLET_STYLE.hairShadow;
  context.beginPath();
  context.moveTo(5, -191);
  context.bezierCurveTo(28, -190, 40, -174, 38, -151);
  context.bezierCurveTo(31, -164, 24, -169, 16, -168);
  context.bezierCurveTo(17, -179, 12, -188, 5, -191);
  context.closePath();
  context.fill();

  context.fillStyle = VIOLET_STYLE.hairMid;
  context.beginPath();
  context.moveTo(-34, -158);
  context.bezierCurveTo(-42, -144, -41, -125, -34, -109);
  context.bezierCurveTo(-29, -106, -26, -111, -28, -118);
  context.bezierCurveTo(-33, -136, -27, -156, -20, -167);
  context.bezierCurveTo(-26, -169, -31, -164, -34, -158);
  context.closePath();
  context.fill();
  context.beginPath();
  context.moveTo(33, -159);
  context.bezierCurveTo(41, -143, 40, -124, 33, -108);
  context.bezierCurveTo(28, -106, 25, -112, 27, -119);
  context.bezierCurveTo(32, -136, 27, -156, 20, -168);
  context.bezierCurveTo(26, -169, 31, -165, 33, -159);
  context.closePath();
  context.fill();

  context.fillStyle = VIOLET_STYLE.hairLight;
  context.beginPath();
  context.moveTo(-28, -177);
  context.bezierCurveTo(-21, -188, -8, -192, 2, -188);
  context.bezierCurveTo(-9, -183, -16, -174, -20, -164);
  context.bezierCurveTo(-28, -164, -33, -170, -28, -177);
  context.closePath();
  context.fill();

  context.strokeStyle = VIOLET_STYLE.hairRim;
  context.lineWidth = 1.25;
  context.beginPath();
  context.moveTo(-29, -178);
  context.bezierCurveTo(-18, -189, -3, -192, 9, -187);
  context.moveTo(-31, -153);
  context.bezierCurveTo(-28, -163, -22, -168, -15, -169);
  context.moveTo(9, -185);
  context.bezierCurveTo(20, -182, 29, -172, 32, -160);
  context.stroke();

  context.strokeStyle = VIOLET_STYLE.hairShadow;
  context.lineWidth = detail === 'portrait' ? 1.05 : 0.9;
  context.beginPath();
  context.moveTo(-18, -188);
  context.bezierCurveTo(-10, -184, -7, -176, -5, -166);
  context.moveTo(1, -191);
  context.bezierCurveTo(8, -185, 11, -178, 13, -169);
  context.moveTo(21, -184);
  context.bezierCurveTo(27, -177, 29, -168, 29, -159);
  context.stroke();
  context.restore();

  const lift = motion.hairLift;
  drawVioletWisp(context, -31, -174, -46, -184 - lift, -43, -160 + lift * 0.25, 2.6);
  drawVioletWisp(context, -17, -190, -31, -199 - lift * 0.8, -32, -181 + lift * 0.2, 2.3);
  drawVioletWisp(context, 9, -191, 25, -199 - lift * 0.7, 31, -178 + lift * 0.2, 2.35);
  drawVioletWisp(context, 31, -172, 45, -181 - lift * 0.55, 40, -153 + lift * 0.18, 2.45);

  if (detail === 'portrait') {
    context.strokeStyle = 'rgba(236, 224, 205, 0.22)';
    context.lineWidth = 0.75;
    context.beginPath();
    context.moveTo(-25, -182);
    context.bezierCurveTo(-16, -187, -8, -185, -2, -178);
    context.moveTo(14, -187);
    context.bezierCurveTo(23, -182, 28, -175, 31, -166);
    context.stroke();
  }
}

function drawVioletWisp(context, startX, startY, controlX, controlY, endX, endY, width) {
  const side = controlX < startX ? -1 : 1;
  context.fillStyle = VIOLET_STYLE.hairBase;
  context.beginPath();
  context.moveTo(startX, startY);
  context.bezierCurveTo(controlX, controlY, controlX + side * 2, endY - 7, endX, endY);
  context.bezierCurveTo(endX - side * width, endY + 1.5, controlX - side * width, controlY + 4, startX + side * width, startY + 2);
  context.bezierCurveTo(startX + side * 1.2, startY + 1, startX, startY + 0.5, startX, startY);
  context.closePath();
  fillStroke(context, 0.95);
  context.strokeStyle = VIOLET_STYLE.hairRim;
  context.lineWidth = 0.7;
  context.beginPath();
  context.moveTo(startX + side * 0.5, startY + 0.5);
  context.bezierCurveTo(controlX + side, controlY + 1, controlX + side, endY - 5, endX, endY - 0.5);
  context.stroke();
}

export function drawVioletGlasses(context) {
  context.save();
  context.fillStyle = VIOLET_STYLE.lenses;
  context.strokeStyle = VIOLET_STYLE.glasses;
  context.lineWidth = 3.35;
  context.lineJoin = 'round';
  context.lineCap = 'round';

  traceVioletLens(context, -32, -155, 31, 20, -0.7);
  context.fill();
  context.stroke();
  traceVioletLens(context, 1, -155, 31, 20, 0.7);
  context.fill();
  context.stroke();

  context.beginPath();
  context.moveTo(-1.5, -147.2);
  context.bezierCurveTo(-0.7, -149.6, 0.8, -149.5, 1.7, -147.1);
  context.stroke();
  context.beginPath();
  context.moveTo(-31.5, -149.2);
  context.bezierCurveTo(-35, -151, -37.4, -149.3, -38.7, -145.7);
  context.moveTo(32, -148.8);
  context.bezierCurveTo(35.4, -150.4, 37.5, -148.8, 38.5, -145.2);
  context.stroke();

  context.strokeStyle = VIOLET_STYLE.glassesLight;
  context.lineWidth = 1.15;
  context.beginPath();
  context.moveTo(-28, -152.5);
  context.bezierCurveTo(-21, -155.3, -13, -155.2, -7, -152.6);
  context.moveTo(5, -152.4);
  context.bezierCurveTo(12, -155.1, 21, -154.9, 28, -152.2);
  context.stroke();
  context.restore();
}

function traceVioletLens(context, x, y, width, height, skew) {
  context.beginPath();
  context.moveTo(x + 4 + skew, y);
  context.bezierCurveTo(x + 1.2, y - 0.3, x - 0.2, y + 1.4, x, y + 4);
  context.bezierCurveTo(x + 0.2 - skew * 0.2, y + 9, x + 0.4 - skew * 0.25, y + height - 6, x + 3.5, y + height - 3);
  context.bezierCurveTo(x + 8, y + height + 0.3, x + width - 8, y + height, x + width - 4, y + height - 1);
  context.bezierCurveTo(x + width - 0.5, y + height - 1.2, x + width + 0.2, y + height - 4, x + width, y + height - 6);
  context.bezierCurveTo(x + width - 0.2 + skew, y + 12, x + width - 0.2 + skew, y + 6, x + width - 1 + skew, y + 4);
  context.bezierCurveTo(x + width - 2, y + 0.8, x + width - 6, y + 0.5, x + 4 + skew, y);
  context.closePath();
}

function drawVioletCollar(context, trim) {
  context.fillStyle = trim;
  context.beginPath();
  context.moveTo(-27, -101);
  context.bezierCurveTo(-18, -106, -9, -107, 0, -102);
  context.bezierCurveTo(9, -108, 19, -106, 27, -101);
  context.bezierCurveTo(20, -91, 11, -84, 2, -81);
  context.bezierCurveTo(-8, -84, -19, -92, -27, -101);
  context.closePath();
  fillStroke(context, 2);

  context.fillStyle = '#efe3cc';
  context.beginPath();
  context.moveTo(-23, -101);
  context.bezierCurveTo(-15, -104, -8, -103, -1, -99);
  context.bezierCurveTo(-4, -93, -5, -87, -5, -83);
  context.bezierCurveTo(-13, -87, -20, -94, -23, -101);
  context.closePath();
  fillStroke(context, 1.2);
  context.beginPath();
  context.moveTo(23, -101);
  context.bezierCurveTo(15, -104, 8, -103, 1, -99);
  context.bezierCurveTo(4, -93, 5, -87, 5, -83);
  context.bezierCurveTo(13, -87, 20, -94, 23, -101);
  context.closePath();
  fillStroke(context, 1.2);
  context.strokeStyle = 'rgba(255, 239, 211, 0.36)';
  context.lineWidth = 1.25;
  context.beginPath();
  context.moveTo(-24, -99);
  context.bezierCurveTo(-16, -91, -8, -84, 0, -82);
  context.bezierCurveTo(8, -84, 16, -91, 24, -99);
  context.stroke();
  context.strokeStyle = trim;
  context.lineWidth = 0.9;
  context.beginPath();
  context.moveTo(-20, -99);
  context.bezierCurveTo(-12, -104, -5, -102, 0, -99);
  context.bezierCurveTo(6, -103, 13, -104, 20, -99);
  context.stroke();
}

function drawNpcLegs(context, kind, palette, pose = 'idle', time = 0) {
  if (kind === 'guide') {
    drawGuideLegs(context, pose, time);
    return;
  }
  if (kind === 'wandmaker') {
    drawWandmakerLegs(context, pose, time);
    return;
  }
  if (kind === 'tailor') {
    drawTailorLegs(context, pose, time);
    return;
  }
  if (kind === 'keeper') {
    drawKeeperLegs(context, pose, time);
    return;
  }
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

function drawGuideLegs(context, pose = 'idle', time = 0) {
  const stride = pose === 'walking' ? Math.sin(time * 7.6) * 6 : 0;
  for (const side of [-1, 1]) {
    const step = stride * side;
    context.save();
    context.scale(side, 1);
    context.globalAlpha = side < 0 ? 0.9 : 1;

    context.fillStyle = HAGRID_STYLE.coatDeep;
    context.beginPath();
    context.moveTo(14, -20);
    context.bezierCurveTo(20, -18, 30, -13, 32 + step * 0.25, 1);
    context.bezierCurveTo(33 + step * 0.55, 9, 35 + step, 16, 34 + step, 20);
    context.bezierCurveTo(28 + step, 25, 18 + step, 24, 14 + step, 19);
    context.bezierCurveTo(16 + step * 0.35, 7, 11, -8, 14, -20);
    context.closePath();
    fillStroke(context, 2.15);

    context.fillStyle = HAGRID_STYLE.bootBase;
    context.beginPath();
    context.moveTo(13 + step, 9);
    context.bezierCurveTo(21 + step, 7, 31 + step, 10, 36 + step, 14);
    context.bezierCurveTo(45 + step, 15, 54 + step, 18, 58 + step, 22);
    context.bezierCurveTo(56 + step, 27, 41 + step, 29, 21 + step, 28);
    context.bezierCurveTo(11 + step, 27, 7 + step, 20, 13 + step, 9);
    context.closePath();
    fillStroke(context, 2.4);

    context.fillStyle = HAGRID_STYLE.bootShadow;
    context.beginPath();
    context.moveTo(10 + step, 22);
    context.bezierCurveTo(24 + step, 25, 43 + step, 27, 57 + step, 22);
    context.bezierCurveTo(55 + step, 28, 40 + step, 29, 21 + step, 28);
    context.bezierCurveTo(14 + step, 28, 10 + step, 25, 10 + step, 22);
    context.closePath();
    context.fill();

    context.strokeStyle = HAGRID_STYLE.bootLight;
    context.lineWidth = 1.7;
    context.beginPath();
    context.moveTo(17 + step, 15);
    context.bezierCurveTo(28 + step, 12, 39 + step, 16, 47 + step, 20);
    context.moveTo(18 + step, 21);
    context.bezierCurveTo(29 + step, 19, 39 + step, 22, 47 + step, 25);
    context.stroke();
    context.restore();
  }
}

function drawWandmakerLegs(context, pose, time) {
  const stride = pose === 'walking' ? Math.sin(time * 7.6) * 5 : 0;
  for (const side of [-1, 1]) {
    const ankleX = side * 15 + side * stride;
    context.strokeStyle = DEEP_OUTLINE;
    context.lineWidth = 9;
    context.beginPath();
    context.moveTo(side * 14, -7);
    context.quadraticCurveTo(side * (15 + stride * 0.25), 8, ankleX, 20);
    context.stroke();
    context.strokeStyle = WANDMAKER_STYLE.robeShadow;
    context.lineWidth = 5.4;
    context.stroke();

    context.fillStyle = side < 0 ? '#34303a' : '#292832';
    context.beginPath();
    context.moveTo(ankleX - 6, 14);
    context.bezierCurveTo(
      ankleX + side * 2,
      13,
      ankleX + side * 15,
      17,
      ankleX + side * 20,
      23,
    );
    context.quadraticCurveTo(ankleX + side * 16, 29, ankleX + side * 7, 29);
    context.quadraticCurveTo(ankleX - side * 6, 30, ankleX - side * 8, 24);
    context.quadraticCurveTo(ankleX - 9, 18, ankleX - 6, 14);
    context.closePath();
    fillStroke(context, 2.1);
    context.strokeStyle = 'rgba(205, 181, 128, 0.32)';
    context.lineWidth = 1.35;
    context.beginPath();
    context.moveTo(ankleX - side * 3, 22);
    context.quadraticCurveTo(ankleX + side * 8, 20, ankleX + side * 16, 24);
    context.stroke();
  }
}

function drawNpcBackDetails(context, kind, palette, { lightDirection = -1 } = {}) {
  if (kind === 'guide') {
    drawGuideBackHair(context, lightDirection);
    return;
  }
  if (kind === 'tailor') {
    drawTailorBackHair(context);
    return;
  }
  if (kind === 'keeper') {
    drawKeeperBackDetails(context);
    return;
  }
  if (kind === 'wandmaker') {
    context.fillStyle = WANDMAKER_STYLE.hairShadow;
    context.beginPath();
    context.moveTo(-22, -171);
    context.bezierCurveTo(-37, -162, -40, -137, -34, -116);
    context.bezierCurveTo(-31, -104, -25, -98, -18, -101);
    context.bezierCurveTo(-25, -121, -21, -149, -11, -174);
    context.bezierCurveTo(-15, -176, -19, -174, -22, -171);
    context.closePath();
    fillStroke(context, 1.65);

    context.fillStyle = WANDMAKER_STYLE.hairBase;
    context.beginPath();
    context.moveTo(17, -175);
    context.bezierCurveTo(35, -164, 38, -143, 32, -123);
    context.bezierCurveTo(31, -110, 25, -102, 18, -104);
    context.bezierCurveTo(24, -126, 21, -152, 8, -178);
    context.bezierCurveTo(11, -179, 15, -177, 17, -175);
    context.closePath();
    fillStroke(context, 1.65);

    context.strokeStyle = 'rgba(244, 238, 221, 0.54)';
    context.lineWidth = 1.15;
    context.beginPath();
    context.moveTo(-28, -158);
    context.bezierCurveTo(-34, -140, -31, -119, -23, -106);
    context.moveTo(23, -163);
    context.bezierCurveTo(32, -145, 29, -119, 22, -108);
    context.stroke();
  }
  if (kind === 'guide') {
    context.fillStyle = HAGRID_STYLE.hairBase;
    context.beginPath();
    context.moveTo(-7, -199);
    context.bezierCurveTo(-39, -205, -59, -185, -58, -156);
    context.bezierCurveTo(-71, -145, -69, -116, -57, -98);
    context.bezierCurveTo(-45, -84, -25, -91, -17, -108);
    context.bezierCurveTo(-8, -91, 7, -88, 15, -108);
    context.bezierCurveTo(29, -88, 52, -93, 61, -111);
    context.bezierCurveTo(72, -132, 62, -155, 56, -165);
    context.bezierCurveTo(53, -191, 23, -205, -7, -199);
    context.closePath();
    fillStroke(context, 2.35);

    context.fillStyle = darken(HAGRID_STYLE.hairBase, 0.09);
    context.beginPath();
    context.moveTo(6, -198);
    context.bezierCurveTo(38, -200, 61, -179, 56, -157);
    context.bezierCurveTo(70, -133, 56, -106, 37, -98);
    context.bezierCurveTo(29, -91, 19, -99, 15, -110);
    context.bezierCurveTo(12, -137, 18, -173, 6, -198);
    context.closePath();
    context.fill();

    context.fillStyle = HAGRID_STYLE.hairMid;
    context.globalAlpha = 0.78;
    context.beginPath();
    context.moveTo(-48, -171);
    context.bezierCurveTo(-58, -145, -53, -116, -38, -104);
    context.bezierCurveTo(-31, -97, -24, -101, -20, -112);
    context.bezierCurveTo(-30, -135, -27, -160, -16, -185);
    context.bezierCurveTo(-29, -187, -42, -182, -48, -171);
    context.closePath();
    context.fill();
    context.globalAlpha = 1;

    context.strokeStyle = HAGRID_STYLE.rim;
    context.lineWidth = 1.8;
    context.beginPath();
    context.moveTo(-52, -153);
    context.bezierCurveTo(-62, -174, -43, -197, -13, -198);
    context.bezierCurveTo(-4, -200, 2, -199, 8, -197);
    context.stroke();
  }
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

function drawGuideBackHair(context, lightDirection = -1) {
  context.fillStyle = HAGRID_STYLE.hairBase;
  context.beginPath();
  context.moveTo(-8, -207);
  context.bezierCurveTo(-38, -211, -61, -193, -61, -166);
  context.bezierCurveTo(-70, -151, -68, -131, -58, -118);
  context.bezierCurveTo(-49, -107, -39, -110, -34, -121);
  context.bezierCurveTo(-27, -109, -17, -109, -10, -123);
  context.bezierCurveTo(0, -111, 11, -111, 18, -125);
  context.bezierCurveTo(29, -111, 43, -112, 51, -126);
  context.bezierCurveTo(67, -139, 67, -161, 58, -176);
  context.bezierCurveTo(54, -198, 23, -211, -8, -207);
  context.closePath();
  fillStroke(context, 2.4);

  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.fillStyle = HAGRID_STYLE.hairShadow;
  context.beginPath();
  context.moveTo(5, -207);
  context.bezierCurveTo(37, -210, 59, -191, 59, -171);
  context.bezierCurveTo(68, -151, 59, -130, 47, -120);
  context.bezierCurveTo(37, -111, 27, -115, 20, -128);
  context.bezierCurveTo(24, -154, 20, -183, 5, -207);
  context.closePath();
  context.fill();

  context.fillStyle = HAGRID_STYLE.hairMid;
  context.beginPath();
  context.moveTo(-48, -184);
  context.bezierCurveTo(-60, -165, -57, -140, -46, -124);
  context.bezierCurveTo(-39, -114, -32, -116, -28, -126);
  context.bezierCurveTo(-35, -148, -28, -179, -14, -199);
  context.bezierCurveTo(-28, -202, -42, -196, -48, -184);
  context.closePath();
  context.fill();

  context.strokeStyle = HAGRID_STYLE.hairLight;
  context.lineWidth = 1.65;
  context.beginPath();
  for (const [x, bend, endY] of [
    [-45, -7, -127], [-31, 5, -121], [-16, -5, -126],
    [2, 6, -126], [20, -5, -128], [39, 6, -126],
  ]) {
    context.moveTo(x, -197 + Math.abs(x) * 0.12);
    context.bezierCurveTo(x + bend, -179, x - bend * 0.45, -148, x + bend * 0.2, endY);
  }
  context.stroke();
  context.restore();
}

function drawNpcBody(context, kind, palette, { lightDirection = -1 } = {}) {
  if (kind === 'guide') {
    drawGuideBody(context, lightDirection);
    return;
  }
  if (kind === 'wandmaker') {
    drawWandmakerBody(context);
    return;
  }
  if (kind === 'tailor') {
    drawTailorBody(context);
    return;
  }
  if (kind === 'keeper') {
    drawKeeperBody(context);
    return;
  }
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
  } else {
    context.moveTo(-45, top - 3);
    context.bezierCurveTo(-62, top - 8, -70, -101, -67, -82);
    context.bezierCurveTo(-72, -59, -79, -24, -75, 2);
    context.bezierCurveTo(-55, 7, -27, 13, -3, 8);
    context.bezierCurveTo(24, 15, 54, 7, 77, -2);
    context.bezierCurveTo(76, -26, 70, -60, 66, -86);
    context.bezierCurveTo(67, -103, 57, top - 7, 45, top - 1);
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

function drawGuideBody(context, lightDirection = -1) {
  context.fillStyle = HAGRID_STYLE.coatBase;
  context.beginPath();
  context.moveTo(-47, -120);
  context.bezierCurveTo(-63, -121, -73, -107, -70, -91);
  context.bezierCurveTo(-75, -70, -79, -36, -78, -8);
  context.bezierCurveTo(-65, 1, -43, 7, -22, 5);
  context.bezierCurveTo(-9, 11, 5, 10, 17, 6);
  context.bezierCurveTo(38, 10, 62, 3, 78, -7);
  context.bezierCurveTo(79, -35, 74, -70, 70, -93);
  context.bezierCurveTo(72, -109, 61, -121, 46, -119);
  context.bezierCurveTo(21, -128, -23, -129, -47, -120);
  context.closePath();
  fillStroke(context, 2.35);

  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.fillStyle = HAGRID_STYLE.coatShadow;
  context.beginPath();
  context.moveTo(5, -124);
  context.bezierCurveTo(35, -127, 63, -116, 68, -94);
  context.bezierCurveTo(74, -68, 79, -34, 77, -8);
  context.bezierCurveTo(62, 2, 39, 8, 17, 5);
  context.bezierCurveTo(25, -32, 20, -83, 5, -124);
  context.closePath();
  context.fill();

  context.fillStyle = HAGRID_STYLE.coatMid;
  context.beginPath();
  context.moveTo(-43, -116);
  context.bezierCurveTo(-61, -105, -66, -81, -63, -58);
  context.bezierCurveTo(-69, -38, -74, -20, -74, -8);
  context.bezierCurveTo(-58, -1, -43, 4, -29, 3);
  context.bezierCurveTo(-32, -31, -29, -81, -14, -121);
  context.bezierCurveTo(-25, -124, -36, -121, -43, -116);
  context.closePath();
  context.fill();

  context.fillStyle = HAGRID_STYLE.coatHighlight;
  context.beginPath();
  context.moveTo(-55, -106);
  context.bezierCurveTo(-66, -87, -63, -61, -67, -39);
  context.bezierCurveTo(-70, -24, -72, -15, -71, -9);
  context.bezierCurveTo(-60, -4, -52, -2, -45, -2);
  context.bezierCurveTo(-48, -35, -43, -79, -55, -106);
  context.closePath();
  context.fill();
  context.restore();

  context.fillStyle = HAGRID_STYLE.coatDeep;
  context.beginPath();
  context.moveTo(-34, -114);
  context.bezierCurveTo(-23, -104, -13, -90, -2, -76);
  context.bezierCurveTo(8, -91, 20, -104, 34, -114);
  context.bezierCurveTo(23, -119, 12, -122, 1, -121);
  context.bezierCurveTo(-11, -123, -23, -120, -34, -114);
  context.closePath();
  context.fill();

  context.strokeStyle = HAGRID_STYLE.coatLight;
  context.lineWidth = 2.3;
  context.beginPath();
  context.moveTo(-33, -114);
  context.bezierCurveTo(-21, -102, -12, -87, -2, -76);
  context.moveTo(34, -114);
  context.bezierCurveTo(22, -102, 11, -87, -2, -76);
  context.stroke();

  context.strokeStyle = HAGRID_STYLE.coatDeep;
  context.lineWidth = 7;
  context.beginPath();
  context.moveTo(-67, -50);
  context.bezierCurveTo(-31, -45, 30, -43, 69, -50);
  context.stroke();
  context.strokeStyle = HAGRID_STYLE.coatLight;
  context.lineWidth = 1.45;
  context.beginPath();
  context.moveTo(-64, -53);
  context.bezierCurveTo(-28, -48, 28, -47, 66, -53);
  context.stroke();

  for (const side of [-1, 1]) drawGuideCoatPocket(context, side, lightDirection);

  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.strokeStyle = 'rgba(226, 190, 137, 0.3)';
  context.lineWidth = 1.25;
  context.beginPath();
  context.moveTo(-49, -92);
  context.bezierCurveTo(-55, -63, -53, -30, -57, -6);
  context.moveTo(-20, -70);
  context.bezierCurveTo(-25, -49, -22, -21, -27, 4);
  context.stroke();
  context.strokeStyle = 'rgba(33, 25, 24, 0.38)';
  context.lineWidth = 2.3;
  context.beginPath();
  context.moveTo(23, -73);
  context.bezierCurveTo(31, -49, 28, -20, 36, 3);
  context.moveTo(54, -92);
  context.bezierCurveTo(63, -64, 61, -32, 66, -7);
  context.stroke();
  context.restore();

  context.fillStyle = WARM_BOUNCE;
  context.beginPath();
  context.moveTo(-75, -10);
  context.bezierCurveTo(-43, 2, -15, 5, -2, 7);
  context.bezierCurveTo(22, 11, 52, 3, 76, -9);
  context.bezierCurveTo(54, 8, 20, 15, -3, 12);
  context.bezierCurveTo(-28, 14, -58, 7, -78, -7);
  context.closePath();
  context.fill();
}

function drawGuideCoatPocket(context, side, lightDirection = -1) {
  context.save();
  context.scale(side, 1);
  context.fillStyle = side === lightDirection ? HAGRID_STYLE.coatMid : HAGRID_STYLE.coatShadow;
  context.beginPath();
  context.moveTo(30, -37);
  context.bezierCurveTo(40, -42, 55, -40, 62, -35);
  context.bezierCurveTo(64, -27, 62, -17, 58, -11);
  context.bezierCurveTo(47, -7, 36, -10, 31, -16);
  context.bezierCurveTo(29, -23, 28, -31, 30, -37);
  context.closePath();
  context.fill();
  context.strokeStyle = HAGRID_STYLE.coatLight;
  context.lineWidth = 1.45;
  context.stroke();
  context.strokeStyle = 'rgba(243, 209, 158, 0.22)';
  context.lineWidth = 0.95;
  context.beginPath();
  context.moveTo(34, -34);
  context.bezierCurveTo(43, -37, 53, -36, 59, -32);
  context.stroke();
  context.restore();
}

function drawWandmakerBody(context) {
  context.fillStyle = WANDMAKER_STYLE.robeBase;
  context.beginPath();
  context.moveTo(-27, -102);
  context.bezierCurveTo(-37, -93, -36, -74, -34, -61);
  context.bezierCurveTo(-37, -45, -42, -20, -44, 1);
  context.bezierCurveTo(-29, 7, -12, 10, 2, 6);
  context.bezierCurveTo(16, 11, 31, 7, 40, 1);
  context.bezierCurveTo(39, -22, 35, -47, 34, -65);
  context.bezierCurveTo(36, -82, 34, -97, 25, -104);
  context.bezierCurveTo(8, -110, -13, -108, -27, -102);
  context.closePath();
  fillStroke(context, 1.9);

  context.fillStyle = WANDMAKER_STYLE.robeShadow;
  context.globalAlpha = 0.78;
  context.beginPath();
  context.moveTo(5, -105);
  context.bezierCurveTo(24, -106, 34, -94, 33, -72);
  context.bezierCurveTo(36, -51, 39, -21, 39, 0);
  context.bezierCurveTo(28, 7, 16, 9, 4, 6);
  context.bezierCurveTo(11, -25, 10, -69, 5, -105);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;

  context.fillStyle = WANDMAKER_STYLE.robeMid;
  context.beginPath();
  context.moveTo(-26, -98);
  context.bezierCurveTo(-18, -86, -13, -69, -12, -50);
  context.bezierCurveTo(-15, -31, -19, -12, -21, 5);
  context.bezierCurveTo(-10, 9, -2, 8, 4, 6);
  context.bezierCurveTo(1, -28, 1, -66, 5, -101);
  context.bezierCurveTo(-6, -106, -17, -104, -26, -98);
  context.closePath();
  context.fill();

  context.fillStyle = WANDMAKER_STYLE.robeLight;
  context.beginPath();
  context.moveTo(-26, -96);
  context.bezierCurveTo(-33, -79, -31, -59, -32, -43);
  context.bezierCurveTo(-35, -27, -38, -12, -39, -3);
  context.quadraticCurveTo(-31, 2, -23, 3);
  context.bezierCurveTo(-25, -25, -20, -69, -26, -96);
  context.closePath();
  context.fill();

  context.fillStyle = WANDMAKER_STYLE.waistcoat;
  context.beginPath();
  context.moveTo(-18, -91);
  context.bezierCurveTo(-12, -76, -9, -59, -9, -43);
  context.bezierCurveTo(-8, -27, -10, -13, -12, -3);
  context.quadraticCurveTo(-2, 1, 9, -2);
  context.bezierCurveTo(8, -25, 9, -56, 16, -91);
  context.quadraticCurveTo(0, -101, -18, -91);
  context.closePath();
  context.fill();
  context.strokeStyle = 'rgba(225, 212, 181, 0.28)';
  context.lineWidth = 1.2;
  context.stroke();

  context.fillStyle = WANDMAKER_STYLE.robeShadow;
  context.beginPath();
  context.moveTo(-25, -99);
  context.bezierCurveTo(-16, -89, -10, -78, -2, -68);
  context.quadraticCurveTo(-8, -60, -10, -48, -11, -38);
  context.bezierCurveTo(-18, -53, -24, -73, -25, -99);
  context.closePath();
  context.moveTo(23, -101);
  context.bezierCurveTo(14, -89, 8, -78, 1, -68);
  context.quadraticCurveTo(8, -59, 9, -46, 9, -37);
  context.bezierCurveTo(17, -55, 23, -78, 23, -101);
  context.closePath();
  context.fill();

  context.strokeStyle = WANDMAKER_STYLE.brass;
  context.lineWidth = 2.1;
  context.beginPath();
  context.moveTo(-23, -98);
  context.bezierCurveTo(-14, -84, -7, -73, -1, -67);
  context.moveTo(22, -100);
  context.bezierCurveTo(14, -86, 7, -74, 1, -67);
  context.stroke();

  for (const [x, y, scale, turn] of [[0, -55, 2.9, -1], [1, -35, 2.7, 1], [-1, -16, 2.55, -1]]) {
    drawWandmakerBrassStud(context, x, y, scale, turn);
  }

  context.strokeStyle = 'rgba(224, 211, 185, 0.3)';
  context.lineWidth = 1.25;
  context.beginPath();
  context.moveTo(-29, -82);
  context.bezierCurveTo(-31, -61, -32, -34, -36, -5);
  context.moveTo(25, -82);
  context.bezierCurveTo(29, -58, 28, -26, 33, -3);
  context.moveTo(-17, -48);
  context.bezierCurveTo(-20, -31, -20, -14, -22, 2);
  context.stroke();

  context.strokeStyle = 'rgba(19, 20, 33, 0.48)';
  context.lineWidth = 2.4;
  context.beginPath();
  context.moveTo(13, -44);
  context.bezierCurveTo(17, -29, 15, -12, 19, 5);
  context.moveTo(29, -59);
  context.bezierCurveTo(33, -41, 31, -18, 35, -1);
  context.stroke();

  context.fillStyle = WARM_BOUNCE;
  context.beginPath();
  context.moveTo(-42, -8);
  context.bezierCurveTo(-22, -2, -8, 7, 3, 6);
  context.bezierCurveTo(17, 10, 30, 5, 39, 0);
  context.quadraticCurveTo(29, 10, 4, 11);
  context.quadraticCurveTo(-20, 13, -44, 1);
  context.closePath();
  context.fill();

  context.strokeStyle = WANDMAKER_STYLE.brass;
  context.lineWidth = 2.25;
  context.beginPath();
  context.moveTo(-36, -6);
  context.bezierCurveTo(-17, -13, 15, -14, 34, -7);
  context.stroke();
}

function drawWandmakerBrassStud(context, x, y, scale, turn) {
  context.fillStyle = WANDMAKER_STYLE.brass;
  context.beginPath();
  context.moveTo(x - scale * 0.9, y - scale * 0.25);
  context.bezierCurveTo(
    x - scale * 0.65,
    y - scale,
    x + scale * 0.45,
    y - scale * (0.86 + turn * 0.04),
    x + scale,
    y - scale * 0.1,
  );
  context.bezierCurveTo(
    x + scale * 0.72,
    y + scale * 0.82,
    x - scale * 0.52,
    y + scale * (0.95 - turn * 0.05),
    x - scale * 0.9,
    y - scale * 0.25,
  );
  context.closePath();
  context.fill();
  context.strokeStyle = WANDMAKER_STYLE.woodShadow;
  context.lineWidth = 0.85;
  context.stroke();
  context.strokeStyle = WANDMAKER_STYLE.brassLight;
  context.lineWidth = 0.75;
  context.beginPath();
  context.moveTo(x - scale * 0.46, y - scale * 0.38);
  context.quadraticCurveTo(x, y - scale * 0.72, x + scale * 0.42, y - scale * 0.24);
  context.stroke();
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
    context.bezierCurveTo(-29, -89, -20, -74, -11, -67);
    context.quadraticCurveTo(-5, -84, 0, -96);
    context.quadraticCurveTo(6, -82, 11, -67);
    context.bezierCurveTo(20, -76, 29, -94, 36, -106);
    context.quadraticCurveTo(0, -116, -36, -106);
    context.closePath();
    context.fill();

    context.fillStyle = '#49372e';
    context.beginPath();
    context.moveTo(-17, -78);
    context.quadraticCurveTo(-8, -88, 0, -96);
    context.quadraticCurveTo(8, -87, 17, -78);
    context.bezierCurveTo(18, -68, 21, -58, 21, -49);
    context.quadraticCurveTo(0, -45, -21, -49);
    context.bezierCurveTo(-20, -58, -19, -68, -17, -78);
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
    context.moveTo(-8, -50);
    context.quadraticCurveTo(-1, -54, 8, -49);
    context.bezierCurveTo(10, -45, 8, -39, 5, -37);
    context.quadraticCurveTo(-2, -35, -9, -39);
    context.bezierCurveTo(-11, -43, -10, -47, -8, -50);
    context.closePath();
    context.fill();
    context.strokeStyle = 'rgba(255,224,158,0.38)';
    context.lineWidth = 1.2;
    context.stroke();
    for (const [x, y] of [[-42, -27], [42, -27]]) {
      context.fillStyle = x < 0 ? 'rgba(52,38,31,0.32)' : 'rgba(34,27,26,0.42)';
      context.beginPath();
      context.moveTo(x - 15, y - 8);
      context.quadraticCurveTo(x, y - 11 + (x < 0 ? -2 : 1), x + 15, y - 8);
      context.bezierCurveTo(x + 16, y - 1, x + 14, y + 7, x + 12, y + 12);
      context.quadraticCurveTo(x, y + 18, x - 12, y + 12);
      context.bezierCurveTo(x - 14, y + 5, x - 16, y - 2, x - 15, y - 8);
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

    context.strokeStyle = 'rgba(250,211,149,0.19)';
    context.lineWidth = 2.2;
    context.beginPath();
    context.moveTo(-54, -94);
    context.bezierCurveTo(-61, -70, -63, -39, -67, -7);
    context.moveTo(-18, -67);
    context.bezierCurveTo(-24, -46, -20, -21, -27, 3);
    context.stroke();
    context.strokeStyle = 'rgba(35,25,25,0.23)';
    context.lineWidth = 3.1;
    context.beginPath();
    context.moveTo(25, -71);
    context.bezierCurveTo(33, -48, 29, -19, 37, 3);
    context.moveTo(57, -91);
    context.bezierCurveTo(64, -65, 61, -37, 68, -9);
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

function drawNpcArms(
  context,
  kind,
  palette,
  time,
  pose = 'idle',
  { reducedMotion = false, lightDirection = -1 } = {},
) {
  if (kind === 'guide') {
    drawGuideArms(context, time, pose, { reducedMotion, lightDirection });
    return;
  }
  if (kind === 'wandmaker') {
    drawWandmakerArms(context, time, pose, { reducedMotion });
    return;
  }
  if (kind === 'tailor') {
    drawTailorArms(context, time, pose, { reducedMotion });
    return;
  }
  if (kind === 'keeper') {
    drawKeeperArms(context, time, pose, { reducedMotion });
    return;
  }
  const broad = kind === 'guide';
  const shoulderX = broad ? 49 : 32;
  const cuffX = broad ? 61 : 43;
  const handY = broad ? -37 : -30;
  const sway = pose === 'walking'
    ? Math.sin(time * 7.6) * (broad ? 4.5 : 4)
    : Math.sin(time * 1.4) * (broad ? 1.5 : 2);
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

function drawGuideArms(
  context,
  time,
  pose = 'idle',
  { reducedMotion = false, lightDirection = -1 } = {},
) {
  const energy = reducedMotion ? 0.32 : 1;
  const walk = pose === 'walking' ? Math.sin(time * 7.6) * 5 * energy : 0;
  const beckon = pose === 'beckon'
    ? (reducedMotion ? 0.5 : 0.5 + Math.sin(time * 3.4) * 0.5)
    : 0;

  for (const side of [-1, 1]) {
    const raised = pose === 'beckon' && side > 0;
    const swing = walk * -side;
    const elbowX = raised ? 70 : 65;
    const elbowY = raised ? -91 : -72 + swing * 0.45;
    const wristX = raised ? 88 + beckon * 4 : 61;
    const wristY = raised ? -117 - beckon * 5 : -38 + swing;
    const lit = side === lightDirection;

    context.save();
    context.scale(side, 1);
    context.globalAlpha = side < 0 ? 0.94 : 1;

    context.fillStyle = lit ? HAGRID_STYLE.coatMid : HAGRID_STYLE.coatBase;
    context.beginPath();
    context.moveTo(36, -112);
    context.bezierCurveTo(50, -119, 64, -110, elbowX + 7, elbowY - 7);
    context.bezierCurveTo(elbowX + 11, elbowY, elbowX + 7, elbowY + 9, elbowX, elbowY + 11);
    context.bezierCurveTo(57, elbowY + 7, 46, -89, 36, -112);
    context.closePath();
    fillStroke(context, 2.2);

    context.fillStyle = lit ? HAGRID_STYLE.coatMid : HAGRID_STYLE.coatShadow;
    context.beginPath();
    context.moveTo(elbowX - 3, elbowY - 7);
    context.bezierCurveTo(
      elbowX + 6,
      elbowY - 10,
      wristX + 8,
      wristY - 8,
      wristX + 9,
      wristY - 1,
    );
    context.bezierCurveTo(wristX + 7, wristY + 7, wristX - 4, wristY + 9, wristX - 10, wristY + 3);
    context.bezierCurveTo(
      wristX - 8,
      wristY - 7,
      elbowX - 1,
      elbowY + 9,
      elbowX - 3,
      elbowY - 7,
    );
    context.closePath();
    fillStroke(context, 2.15);

    context.fillStyle = lit ? HAGRID_STYLE.coatHighlight : 'rgba(28, 22, 22, 0.18)';
    context.beginPath();
    context.moveTo(42, -109);
    context.bezierCurveTo(54, -109, 63, -99, elbowX + 4, elbowY - 4);
    context.bezierCurveTo(elbowX + 5, elbowY + 1, elbowX + 2, elbowY + 4, elbowX - 1, elbowY + 4);
    context.bezierCurveTo(56, elbowY - 1, 49, -94, 42, -109);
    context.closePath();
    context.fill();

    context.strokeStyle = HAGRID_STYLE.coatLight;
    context.lineWidth = 2.25;
    context.beginPath();
    context.moveTo(wristX + 7, wristY);
    context.bezierCurveTo(wristX + 3, wristY + 6, wristX - 4, wristY + 7, wristX - 9, wristY + 3);
    context.stroke();

    context.strokeStyle = 'rgba(38, 28, 27, 0.38)';
    context.lineWidth = 1.05;
    context.beginPath();
    context.moveTo(elbowX - 5, elbowY + 2);
    context.bezierCurveTo(elbowX - 1, elbowY + 6, elbowX + 4, elbowY + 5, elbowX + 7, elbowY + 1);
    context.stroke();

    drawHand(context, wristX, wristY + 12, HAGRID_STYLE.skin, raised ? 12.5 : 11.5);
    context.strokeStyle = HAGRID_STYLE.skinLight;
    context.lineWidth = 1.05;
    context.beginPath();
    context.moveTo(wristX - 3, wristY + 9);
    context.bezierCurveTo(wristX + 1, wristY + 7, wristX + 6, wristY + 9, wristX + 7, wristY + 12);
    context.stroke();
    context.restore();
  }
}

function drawWandmakerArms(context, time, pose, { reducedMotion = false } = {}) {
  const motionScale = reducedMotion ? 0.3 : 1;
  const breath = Math.sin(time * 1.4) * motionScale;
  const gesture = sampleWandmakerGesture(time, pose, { reducedMotion });

  context.fillStyle = WANDMAKER_STYLE.robeBase;
  context.beginPath();
  context.moveTo(-25, -96);
  context.bezierCurveTo(-42, -96, -47, -72, -45, -55);
  context.bezierCurveTo(-47, -42, -48 + breath, -30, -43 + breath, -22);
  context.quadraticCurveTo(-35, -18, -30, -26);
  context.bezierCurveTo(-32, -47, -29, -74, -25, -96);
  context.closePath();
  fillStroke(context, 1.8);
  context.fillStyle = WANDMAKER_STYLE.robeMid;
  context.globalAlpha = 0.56;
  context.beginPath();
  context.moveTo(-37, -88);
  context.bezierCurveTo(-43, -68, -41, -42, -39 + breath, -26);
  context.quadraticCurveTo(-34, -24, -31, -29);
  context.bezierCurveTo(-35, -48, -31, -72, -37, -88);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;
  context.strokeStyle = WANDMAKER_STYLE.brass;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-45 + breath, -28);
  context.quadraticCurveTo(-38, -23, -31, -28);
  context.stroke();
  drawHand(context, -39 + breath, -16, WANDMAKER_STYLE.skin, 7.2);

  const wristX = 43 + gesture;
  const wristY = -64 - gesture * 0.7;
  context.fillStyle = WANDMAKER_STYLE.robeBase;
  context.beginPath();
  context.moveTo(23, -99);
  context.bezierCurveTo(37, -97, 42, -85, 43, -74);
  context.bezierCurveTo(45, -67, wristX + 2, wristY - 3, wristX + 4, wristY + 3);
  context.quadraticCurveTo(wristX - 1, wristY + 10, wristX - 9, wristY + 6);
  context.bezierCurveTo(34, -70, 28, -82, 23, -99);
  context.closePath();
  fillStroke(context, 1.8);
  context.fillStyle = WANDMAKER_STYLE.robeShadow;
  context.globalAlpha = 0.5;
  context.beginPath();
  context.moveTo(31, -92);
  context.bezierCurveTo(41, -84, 44, -71, wristX + 1, wristY + 2);
  context.quadraticCurveTo(wristX - 3, wristY + 7, wristX - 7, wristY + 5);
  context.bezierCurveTo(36, -74, 31, -84, 31, -92);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;
  context.strokeStyle = WANDMAKER_STYLE.brass;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(wristX + 3, wristY + 1);
  context.quadraticCurveTo(wristX - 1, wristY + 7, wristX - 8, wristY + 5);
  context.stroke();
  drawHand(context, wristX, wristY + 12, WANDMAKER_STYLE.skin, 7.4);

  context.strokeStyle = 'rgba(95, 56, 43, 0.45)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(wristX - 3, wristY + 10);
  context.quadraticCurveTo(wristX + 2, wristY + 12, wristX + 5, wristY + 9);
  context.moveTo(wristX - 2, wristY + 14);
  context.quadraticCurveTo(wristX + 2, wristY + 16, wristX + 5, wristY + 13);
  context.stroke();
}

function sampleWandmakerGesture(time, pose, { reducedMotion = false } = {}) {
  const motionScale = reducedMotion ? 0.3 : 1;
  if (pose === 'speaking') return Math.sin(time * 4.2) * 2.4 * motionScale;
  if (pose === 'curious') return 1.7 * motionScale;
  return 0.8 * motionScale;
}

function drawGuideBeckonArms(context, palette, time, { reducedMotion = false } = {}) {
  const motion = reducedMotion ? 0.55 : 0.5 + Math.sin(time * 3.4) * 0.5;

  context.save();
  context.scale(-1, 1);
  context.fillStyle = palette.robe;
  context.strokeStyle = OUTLINE;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(36, -106);
  context.bezierCurveTo(61, -106, 68, -62, 64, -43);
  context.quadraticCurveTo(57, -31, 47, -39);
  context.bezierCurveTo(48, -65, 37, -88, 36, -106);
  context.closePath();
  context.fill();
  context.stroke();
  context.strokeStyle = palette.accent;
  context.lineWidth = STORYBOOK_LINE_WEIGHT.contour;
  context.beginPath();
  context.moveTo(64, -46);
  context.quadraticCurveTo(58, -40, 49, -42);
  context.stroke();
  context.restore();
  drawHand(context, -57, -34, palette.skin, 9);

  const elbowX = 70;
  const elbowY = -91;
  const handX = 91 - motion * 7;
  const handY = -119 - motion * 5;

  context.strokeStyle = OUTLINE;
  context.lineWidth = 15;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(elbowX - 1, elbowY);
  context.quadraticCurveTo(82, -103, handX - 3, handY + 4);
  context.stroke();
  context.strokeStyle = palette.skin;
  context.lineWidth = 10;
  context.stroke();

  context.fillStyle = palette.robe;
  context.strokeStyle = OUTLINE;
  context.lineWidth = 2.1;
  context.beginPath();
  context.moveTo(35, -106);
  context.bezierCurveTo(53, -111, 67, -103, elbowX + 5, elbowY - 7);
  context.quadraticCurveTo(elbowX + 10, elbowY + 2, elbowX + 1, elbowY + 10);
  context.bezierCurveTo(58, -91, 45, -88, 35, -106);
  context.closePath();
  context.fill();
  context.stroke();
  context.strokeStyle = palette.accent;
  context.lineWidth = 2.4;
  context.beginPath();
  context.moveTo(elbowX + 5, elbowY - 7);
  context.quadraticCurveTo(elbowX + 2, elbowY + 1, elbowX + 1, elbowY + 9);
  context.stroke();

  drawHand(context, handX, handY, palette.skin, 10);
  context.strokeStyle = 'rgba(73, 55, 46, 0.58)';
  context.lineWidth = 1.4;
  context.lineCap = 'round';
  for (let index = 0; index < 3; index += 1) {
    const fingerY = handY - 4 + index * 4;
    context.beginPath();
    context.moveTo(handX + 2, fingerY);
    context.quadraticCurveTo(handX + 10 + motion * 3, fingerY - 3, handX + 6, fingerY + 2);
    context.stroke();
  }
}

function drawGuideHead(context, palette, blinking, time, lightDirection = -1) {
  const headY = -158;
  drawGuideEar(context, -41, headY, palette.skin, -1);
  drawGuideEar(context, 42, headY + 1, palette.skin, 1);

  context.fillStyle = HAGRID_STYLE.skin;
  context.beginPath();
  context.moveTo(-6, -200);
  context.bezierCurveTo(-30, -202, -44, -187, -44, -165);
  context.bezierCurveTo(-48, -145, -37, -121, -17, -112);
  context.bezierCurveTo(-2, -105, 22, -111, 35, -127);
  context.bezierCurveTo(49, -144, 46, -174, 37, -188);
  context.bezierCurveTo(27, -201, 9, -204, -6, -200);
  context.closePath();
  fillStroke(context, 2.35);

  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.fillStyle = HAGRID_STYLE.skinShadow;
  context.globalAlpha = 0.42;
  context.beginPath();
  context.moveTo(7, -198);
  context.bezierCurveTo(32, -195, 44, -178, 40, -156);
  context.bezierCurveTo(43, -140, 31, -119, 14, -113);
  context.bezierCurveTo(19, -137, 17, -174, 7, -198);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;

  context.fillStyle = HAGRID_STYLE.skinLight;
  context.beginPath();
  context.moveTo(-29, -184);
  context.bezierCurveTo(-21, -196, -7, -198, 3, -192);
  context.bezierCurveTo(-9, -184, -17, -171, -20, -158);
  context.bezierCurveTo(-29, -160, -34, -174, -29, -184);
  context.closePath();
  context.fill();
  context.restore();

  context.fillStyle = 'rgba(183, 83, 75, 0.25)';
  for (const side of [-1, 1]) {
    context.save();
    context.scale(side, 1);
    context.beginPath();
    context.moveTo(17, -141);
    context.bezierCurveTo(23, -148, 35, -147, 38, -139);
    context.bezierCurveTo(33, -133, 23, -132, 17, -137);
    context.bezierCurveTo(15, -139, 15, -140, 17, -141);
    context.closePath();
    context.fill();
    context.restore();
  }

  drawRuggedEyes(
    context,
    headY - 2,
    blinking,
    Math.sin(time * 0.62 + 5) * 1.1,
    Math.sin(time * 0.39 + 3.5) * 0.55,
  );

  context.fillStyle = HAGRID_STYLE.skinShadow;
  context.beginPath();
  context.moveTo(-4, -160);
  context.bezierCurveTo(-9, -151, -10, -140, -5, -135);
  context.bezierCurveTo(1, -131, 9, -134, 10, -141);
  context.bezierCurveTo(8, -148, 5, -157, -4, -160);
  context.closePath();
  fillStroke(context, 1.35);
  context.strokeStyle = HAGRID_STYLE.skinLight;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(-3, -156);
  context.bezierCurveTo(-6, -149, -5, -141, -1, -138);
  context.stroke();

  context.fillStyle = HAGRID_STYLE.hairBase;
  context.beginPath();
  context.moveTo(-44, -166);
  context.bezierCurveTo(-47, -187, -31, -204, -12, -202);
  context.bezierCurveTo(-1, -211, 13, -205, 19, -201);
  context.bezierCurveTo(34, -202, 46, -187, 42, -167);
  context.bezierCurveTo(34, -176, 27, -177, 22, -168);
  context.bezierCurveTo(15, -180, 7, -178, 1, -169);
  context.bezierCurveTo(-8, -182, -17, -178, -23, -167);
  context.bezierCurveTo(-32, -176, -39, -174, -44, -166);
  context.closePath();
  fillStroke(context, 2.15);

  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  drawGuideHairLock(context, -39, -184, -24, -201, -20, -168, HAGRID_STYLE.hairMid);
  drawGuideHairLock(context, -18, -200, -4, -207, 0, -170, HAGRID_STYLE.hairLight);
  drawGuideHairLock(context, 9, -202, 29, -198, 24, -168, HAGRID_STYLE.hairShadow);
  context.restore();
}

function drawGuideHairLock(context, startX, startY, bendX, bendY, endY, color) {
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(startX, startY);
  context.bezierCurveTo(bendX, bendY, bendX + 7, endY - 12, startX + 13, endY);
  context.bezierCurveTo(startX + 6, endY - 3, startX + 1, endY - 10, startX - 4, startY + 5);
  context.bezierCurveTo(startX - 3, startY + 2, startX - 1, startY + 1, startX, startY);
  context.closePath();
  context.fill();
  context.strokeStyle = HAGRID_STYLE.hairLight;
  context.lineWidth = 0.85;
  context.beginPath();
  context.moveTo(startX + 1, startY + 1);
  context.bezierCurveTo(bendX + 1, bendY + 3, bendX + 4, endY - 8, startX + 9, endY - 2);
  context.stroke();
}

function drawLegacyGuideHead(context, palette, blinking, time) {
  const headY = -157;

  drawGuideEar(context, -43, headY, palette.skin, -1);
  drawGuideEar(context, 44, headY + 1, palette.skin, 1);

  context.fillStyle = palette.skin;
  context.beginPath();
  context.moveTo(-5, -201);
  context.bezierCurveTo(-31, -202, -45, -187, -46, -164);
  context.bezierCurveTo(-50, -143, -37, -119, -15, -112);
  context.bezierCurveTo(2, -106, 26, -113, 38, -129);
  context.bezierCurveTo(52, -147, 48, -174, 39, -188);
  context.bezierCurveTo(30, -201, 10, -205, -5, -201);
  context.closePath();
  fillStroke(context, 2.35);

  context.fillStyle = darken(palette.skin, 0.16);
  context.globalAlpha = 0.28;
  context.beginPath();
  context.moveTo(8, -199);
  context.bezierCurveTo(34, -197, 46, -181, 42, -158);
  context.bezierCurveTo(46, -140, 32, -118, 13, -113);
  context.bezierCurveTo(19, -138, 16, -173, 8, -199);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;

  context.fillStyle = 'rgba(255, 220, 166, 0.2)';
  context.beginPath();
  context.moveTo(-31, -184);
  context.bezierCurveTo(-24, -197, -8, -200, 3, -194);
  context.bezierCurveTo(-10, -188, -18, -176, -22, -164);
  context.bezierCurveTo(-31, -166, -36, -174, -31, -184);
  context.closePath();
  context.fill();

  context.fillStyle = 'rgba(183, 83, 75, 0.24)';
  context.beginPath();
  context.moveTo(-35, -145);
  context.bezierCurveTo(-28, -151, -18, -149, -15, -142);
  context.bezierCurveTo(-20, -136, -31, -135, -36, -141);
  context.quadraticCurveTo(-38, -143, -35, -145);
  context.closePath();
  context.moveTo(17, -140);
  context.bezierCurveTo(22, -147, 35, -147, 39, -139);
  context.bezierCurveTo(34, -133, 23, -132, 17, -137);
  context.quadraticCurveTo(15, -139, 17, -140);
  context.closePath();
  context.fill();

  drawRuggedEyes(context, headY - 2, blinking, Math.sin(time * 0.62 + 5) * 1.1, Math.sin(time * 0.39 + 3.5) * 0.55);

  context.fillStyle = darken(palette.skin, 0.05);
  context.beginPath();
  context.moveTo(-4, -160);
  context.bezierCurveTo(-9, -150, -10, -139, -5, -134);
  context.bezierCurveTo(1, -130, 9, -134, 10, -140);
  context.bezierCurveTo(8, -147, 5, -156, -4, -160);
  context.closePath();
  fillStroke(context, 1.35);
  context.fillStyle = 'rgba(255, 225, 178, 0.24)';
  context.beginPath();
  context.moveTo(-3, -156);
  context.bezierCurveTo(-6, -149, -5, -141, -1, -138);
  context.quadraticCurveTo(2, -140, 1, -154, -3, -156);
  context.closePath();
  context.fill();

  context.fillStyle = HAGRID_STYLE.hairBase;
  context.beginPath();
  context.moveTo(-46, -164);
  context.bezierCurveTo(-48, -186, -32, -204, -12, -203);
  context.bezierCurveTo(-2, -211, 12, -205, 18, -201);
  context.bezierCurveTo(33, -202, 46, -188, 43, -168);
  context.bezierCurveTo(36, -176, 29, -177, 24, -169);
  context.bezierCurveTo(17, -183, 8, -180, 2, -171);
  context.bezierCurveTo(-7, -185, -17, -180, -23, -168);
  context.bezierCurveTo(-33, -178, -40, -174, -46, -164);
  context.closePath();
  fillStroke(context, 2.15);

  context.fillStyle = HAGRID_STYLE.hairMid;
  context.beginPath();
  context.moveTo(-42, -176);
  context.bezierCurveTo(-35, -195, -19, -203, -4, -201);
  context.bezierCurveTo(-13, -192, -14, -181, -22, -169);
  context.bezierCurveTo(-31, -179, -36, -179, -42, -176);
  context.closePath();
  context.fill();
  context.beginPath();
  context.moveTo(7, -202);
  context.bezierCurveTo(25, -201, 40, -188, 41, -172);
  context.bezierCurveTo(31, -180, 23, -176, 17, -166);
  context.bezierCurveTo(18, -181, 14, -193, 7, -202);
  context.closePath();
  context.fill();

  context.fillStyle = darken(HAGRID_STYLE.hairBase, 0.1);
  context.globalAlpha = 0.68;
  context.beginPath();
  context.moveTo(14, -201);
  context.bezierCurveTo(34, -197, 46, -182, 41, -167);
  context.bezierCurveTo(35, -176, 27, -176, 21, -169);
  context.bezierCurveTo(24, -181, 21, -193, 14, -201);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;

  context.strokeStyle = HAGRID_STYLE.hairLight;
  context.lineWidth = 1.55;
  context.beginPath();
  for (const [x, bend, endY] of [[-36, -5, -169], [-25, 5, -166], [-11, -4, -170], [3, 5, -168], [18, -5, -165], [32, 4, -169]]) {
    context.moveTo(x, -195 + Math.abs(x) * 0.08);
    context.bezierCurveTo(x + bend, -187, x - bend * 0.4, -177, x + bend * 0.25, endY);
  }
  context.stroke();
}

function drawGuideEar(context, x, y, color, side) {
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(x - side * 2, y - 9);
  context.bezierCurveTo(x + side * 9, y - 11, x + side * 11, y + 5, x + side * 3, y + 11);
  context.bezierCurveTo(x - side * 5, y + 8, x - side * 7, y - 4, x - side * 2, y - 9);
  context.closePath();
  fillStroke(context, 1.8);
  context.strokeStyle = 'rgba(116, 62, 56, 0.38)';
  context.lineWidth = 1.2;
  context.beginPath();
  context.moveTo(x + side * 1, y - 5);
  context.bezierCurveTo(x + side * 7, y - 2, x + side * 5, y + 6, x, y + 7);
  context.stroke();
}

function drawGuideMouth(context, pose, time) {
  const speaking = pose === 'speaking';
  const open = speaking ? 3 + Math.abs(Math.sin(time * 8.4)) * 3.6 : 0;
  if (speaking) {
    context.fillStyle = '#713e3e';
    context.beginPath();
    context.moveTo(-11, -126);
    context.bezierCurveTo(-6, -131 - open * 0.2, 6, -131 - open * 0.1, 11, -126);
    context.bezierCurveTo(7, -119 + open, -5, -119 + open, -11, -126);
    context.closePath();
    fillStroke(context, 1.45);
    context.fillStyle = 'rgba(238, 153, 139, 0.72)';
    context.beginPath();
    context.moveTo(-6, -122 + open * 0.45);
    context.bezierCurveTo(-2, -119 + open, 3, -119 + open, 7, -122 + open * 0.48);
    context.bezierCurveTo(2, -120 + open * 0.22, -2, -120 + open * 0.2, -6, -122 + open * 0.45);
    context.closePath();
    context.fill();
    return;
  }
  context.strokeStyle = '#874f47';
  context.lineWidth = 2.5;
  context.beginPath();
  context.moveTo(-11, -126);
  context.bezierCurveTo(-5, -119, 5, -119, 11, -127);
  context.stroke();
  context.strokeStyle = 'rgba(255, 206, 178, 0.34)';
  context.lineWidth = 0.9;
  context.beginPath();
  context.moveTo(-7, -124);
  context.bezierCurveTo(-2, -121, 3, -121, 7, -124);
  context.stroke();
}

function drawNpcHead(
  context,
  kind,
  palette,
  blinking,
  time,
  pose = 'idle',
  { reducedMotion = false, lightDirection = -1 } = {},
) {
  if (kind === 'guide') {
    drawGuideHead(context, palette, blinking, time, lightDirection);
    return;
  }
  if (kind === 'wandmaker') {
    drawWandmakerHead(context, blinking, time, pose);
    return;
  }
  if (kind === 'tailor') {
    drawTailorHead(context, blinking, time, pose, { reducedMotion });
    return;
  }
  if (kind === 'keeper') {
    drawKeeperHead(context, blinking, time, pose, { reducedMotion });
    return;
  }
  const broad = kind === 'guide';
  const headY = broad ? -151 : -137;
  const rx = broad ? 41 : kind === 'keeper' ? 35 : 34;
  const ry = broad ? 43 : kind === 'keeper' ? 37 : 39;
  drawEar(context, -rx, headY, palette.skin, broad ? 8 : 6.5);
  drawEar(context, rx, headY, palette.skin, broad ? 8 : 6.5);

  context.fillStyle = palette.skin;
  context.beginPath();
  context.moveTo(0, headY - ry);
  if (kind === 'tailor') {
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
      '#493228',
      blinking,
      3.9,
      gazeX,
      gazeY,
      { browLift: kind === 'tailor' ? 1.1 : 0 },
    );
  }
  context.strokeStyle = darken(palette.skin, 0.28);
  context.lineWidth = broad ? 1.45 : 1.25;
  context.beginPath();
  context.moveTo(broad ? -2 : 0, headY - 3);
  context.quadraticCurveTo(broad ? -6 : -2, headY + 9, broad ? 5 : kind === 'keeper' ? 4 : 3, headY + 10);
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
  if (kind === 'tailor') {
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

function drawWandmakerHead(context, blinking, time, pose) {
  drawWandmakerEar(context, -28, -141, -1);
  drawWandmakerEar(context, 27, -140, 1);

  context.fillStyle = WANDMAKER_STYLE.skin;
  context.beginPath();
  context.moveTo(-4, -183);
  context.bezierCurveTo(-21, -184, -30, -171, -29, -151);
  context.bezierCurveTo(-31, -132, -24, -110, -10, -99);
  context.bezierCurveTo(-3, -93, 5, -94, 12, -100);
  context.bezierCurveTo(24, -112, 29, -133, 27, -153);
  context.bezierCurveTo(28, -171, 15, -184, -4, -183);
  context.closePath();
  fillStroke(context, 1.8);

  context.fillStyle = WANDMAKER_STYLE.skinShadow;
  context.globalAlpha = 0.28;
  context.beginPath();
  context.moveTo(4, -181);
  context.bezierCurveTo(21, -178, 28, -166, 26, -149);
  context.bezierCurveTo(28, -128, 20, -108, 10, -100);
  context.quadraticCurveTo(5, -95, 1, -98);
  context.bezierCurveTo(8, -122, 8, -155, 4, -181);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;

  context.fillStyle = WANDMAKER_STYLE.skinLight;
  context.beginPath();
  context.moveTo(-22, -168);
  context.bezierCurveTo(-16, -178, -6, -181, 1, -176);
  context.bezierCurveTo(-8, -168, -12, -156, -13, -143);
  context.bezierCurveTo(-22, -144, -27, -157, -22, -168);
  context.closePath();
  context.fill();

  context.fillStyle = 'rgba(176, 91, 81, 0.2)';
  context.beginPath();
  context.moveTo(-24, -130);
  context.bezierCurveTo(-19, -136, -11, -135, -8, -129);
  context.bezierCurveTo(-12, -123, -21, -122, -25, -127);
  context.quadraticCurveTo(-26, -129, -24, -130);
  context.closePath();
  context.moveTo(10, -128);
  context.bezierCurveTo(15, -133, 23, -132, 26, -126);
  context.bezierCurveTo(22, -121, 14, -120, 10, -125);
  context.quadraticCurveTo(9, -127, 10, -128);
  context.closePath();
  context.fill();

  const gazeX = Math.sin(time * 0.62 + 8.1) * 1.2;
  const gazeY = Math.sin(time * 0.39 + 4.7) * 0.48;
  drawWandmakerEyes(context, blinking, gazeX, gazeY, pose);
  drawWandmakerNose(context);
  drawWandmakerMouth(context, pose, time);

  context.strokeStyle = 'rgba(100, 67, 59, 0.34)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(-24, -133);
  context.bezierCurveTo(-19, -128, -14, -127, -9, -129);
  context.moveTo(9, -128);
  context.bezierCurveTo(14, -125, 20, -126, 25, -131);
  context.moveTo(-21, -120);
  context.quadraticCurveTo(-13, -116, -7, -119);
  context.moveTo(8, -118);
  context.quadraticCurveTo(15, -115, 21, -119);
  context.moveTo(-8, -106);
  context.quadraticCurveTo(1, -102, 10, -108);
  context.stroke();

  drawWandmakerHair(context, time);
}

function drawWandmakerEar(context, x, y, side) {
  context.fillStyle = WANDMAKER_STYLE.skin;
  context.beginPath();
  context.moveTo(x - side * 1.5, y - 8);
  context.bezierCurveTo(x + side * 7, y - 10, x + side * 9, y + 3, x + side * 3, y + 10);
  context.bezierCurveTo(x - side * 4, y + 8, x - side * 6, y - 3, x - side * 1.5, y - 8);
  context.closePath();
  fillStroke(context, 1.5);
  context.strokeStyle = 'rgba(126, 73, 67, 0.4)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(x + side * 0.5, y - 4);
  context.bezierCurveTo(x + side * 5, y - 1, x + side * 4, y + 5, x, y + 6);
  context.stroke();
}

function drawWandmakerEyes(context, blinking, gazeX, gazeY, pose) {
  const curiousLift = pose === 'curious' ? 1.8 : 0;
  const speakingTilt = pose === 'speaking' ? 0.8 : 0;
  const eyes = [
    { x: -11.5, y: -145.5, side: -1, skew: -0.5 },
    { x: 10.5, y: -144.5, side: 1, skew: 0.6 },
  ];
  for (const { x, y, side, skew } of eyes) {
    if (blinking) {
      context.fillStyle = WANDMAKER_STYLE.skinShadow;
      context.globalAlpha = 0.28;
      context.beginPath();
      context.moveTo(x - 7, y + skew);
      context.quadraticCurveTo(x, y - 2.2 - side * 0.3, x + 7, y - skew);
      context.quadraticCurveTo(x, y + 2.5 + side * 0.2, x - 7, y + skew);
      context.closePath();
      context.fill();
      context.globalAlpha = 1;
      context.strokeStyle = DEEP_OUTLINE;
      context.lineWidth = 1.6;
      context.stroke();
    } else {
      context.fillStyle = '#f6ead8';
      context.beginPath();
      context.moveTo(x - 7.4, y + 0.7 + skew);
      context.quadraticCurveTo(x - 0.5, y - 5.7 - side * 0.4, x + 7.2, y - 0.2 - skew);
      context.quadraticCurveTo(x + 0.7, y + 4.4 + side * 0.2, x - 7.4, y + 0.7 + skew);
      context.closePath();
      context.fill();
      context.strokeStyle = DEEP_OUTLINE;
      context.lineWidth = 1.45;
      context.stroke();

      const irisX = x + gazeX;
      const irisY = y + gazeY;
      context.fillStyle = WANDMAKER_STYLE.iris;
      context.beginPath();
      context.moveTo(irisX - 0.4, irisY - 3.7);
      context.bezierCurveTo(irisX + 3.1, irisY - 3.1, irisX + 3.5, irisY + 1.6, irisX + 0.2, irisY + 3.6);
      context.bezierCurveTo(irisX - 3.2, irisY + 3, irisX - 3.4, irisY - 1.7, irisX - 0.4, irisY - 3.7);
      context.closePath();
      context.fill();
      context.fillStyle = '#242329';
      context.beginPath();
      context.moveTo(irisX, irisY - 1.9);
      context.bezierCurveTo(irisX + 1.55, irisY - 1.5, irisX + 1.6, irisY + 1.1, irisX, irisY + 1.9);
      context.bezierCurveTo(irisX - 1.5, irisY + 1.35, irisX - 1.55, irisY - 1.25, irisX, irisY - 1.9);
      context.closePath();
      context.fill();
      context.fillStyle = 'rgba(255, 249, 225, 0.9)';
      context.beginPath();
      context.moveTo(irisX - 1.7, irisY - 2.2);
      context.quadraticCurveTo(irisX - 0.5, irisY - 3, irisX + 0.2, irisY - 1.8);
      context.quadraticCurveTo(irisX - 0.7, irisY - 0.7, irisX - 1.7, irisY - 2.2);
      context.closePath();
      context.fill();

      context.strokeStyle = 'rgba(77, 52, 46, 0.52)';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(x - 6, y + 3.2);
      context.quadraticCurveTo(x, y + 5.3, x + 5.5, y + 3);
      context.stroke();
    }
  }

  context.strokeStyle = WANDMAKER_STYLE.hairShadow;
  context.lineWidth = 2.5;
  context.beginPath();
  context.moveTo(-20, -156 - curiousLift);
  context.bezierCurveTo(-16, -161 - curiousLift, -9, -160 - speakingTilt, -5, -155);
  context.moveTo(4, -155);
  context.bezierCurveTo(9, -161 - speakingTilt, 16, -160 - curiousLift, 20, -154 - curiousLift * 0.4);
  context.stroke();
  context.strokeStyle = 'rgba(255, 246, 221, 0.46)';
  context.lineWidth = 0.9;
  context.beginPath();
  context.moveTo(-18, -157 - curiousLift);
  context.quadraticCurveTo(-12, -160 - curiousLift, -7, -156);
  context.moveTo(6, -156);
  context.quadraticCurveTo(12, -160 - curiousLift, 18, -155 - curiousLift * 0.4);
  context.stroke();
}

function drawWandmakerNose(context) {
  context.fillStyle = 'rgba(155, 93, 75, 0.22)';
  context.beginPath();
  context.moveTo(-1, -145);
  context.bezierCurveTo(-3, -137, -6, -126, -4, -121);
  context.bezierCurveTo(-1, -117, 6, -118, 8, -122);
  context.quadraticCurveTo(5, -125, 2, -124);
  context.bezierCurveTo(3, -132, 2, -140, -1, -145);
  context.closePath();
  context.fill();
  context.strokeStyle = 'rgba(99, 65, 58, 0.48)';
  context.lineWidth = STORYBOOK_LINE_WEIGHT.detail;
  context.beginPath();
  context.moveTo(-1, -145);
  context.bezierCurveTo(-2, -135, -5, -126, -3, -122);
  context.quadraticCurveTo(2, -118, 7, -122);
  context.stroke();
  context.strokeStyle = 'rgba(255, 230, 190, 0.35)';
  context.lineWidth = 0.9;
  context.beginPath();
  context.moveTo(-2, -140);
  context.quadraticCurveTo(-3, -130, -1, -125);
  context.stroke();
}

function drawWandmakerMouth(context, pose, time) {
  const mouthY = -111;
  if (pose === 'speaking') {
    const open = 3 + Math.abs(Math.sin(time * 8.4)) * 2.8;
    context.fillStyle = '#70474a';
    context.beginPath();
    context.moveTo(-7.5, mouthY);
    context.bezierCurveTo(-3, mouthY - 2.4, 3, mouthY - 2, 7.8, mouthY + 0.3);
    context.bezierCurveTo(5, mouthY + open, -2.8, mouthY + open + 0.8, -7.5, mouthY);
    context.closePath();
    fillStroke(context, 1.2);
    context.fillStyle = 'rgba(226, 137, 137, 0.58)';
    context.beginPath();
    context.moveTo(-4.3, mouthY + open * 0.55);
    context.quadraticCurveTo(0, mouthY + open + 0.6, 4.8, mouthY + open * 0.52);
    context.quadraticCurveTo(0.5, mouthY + open * 0.35, -4.3, mouthY + open * 0.55);
    context.closePath();
    context.fill();
    return;
  }

  context.strokeStyle = '#77504d';
  context.lineWidth = 1.8;
  context.beginPath();
  context.moveTo(-7.5, mouthY + 0.5);
  context.quadraticCurveTo(-3, mouthY + 2.4, 0, mouthY + 1.7);
  context.quadraticCurveTo(4, mouthY - 0.8, 8, mouthY + 0.8);
  context.stroke();
}

function drawWandmakerHair(context, time) {
  context.fillStyle = WANDMAKER_STYLE.hairShadow;
  context.beginPath();
  context.moveTo(-29, -153);
  context.bezierCurveTo(-34, -171, -23, -188, -8, -190);
  context.bezierCurveTo(-3, -192, 1, -189, 3, -185);
  context.bezierCurveTo(-5, -177, -8, -166, -8, -157);
  context.quadraticCurveTo(-17, -165, -21, -153);
  context.quadraticCurveTo(-26, -160, -29, -153);
  context.closePath();
  fillStroke(context, 1.55);

  context.fillStyle = WANDMAKER_STYLE.hairBase;
  context.beginPath();
  context.moveTo(-5, -188);
  context.bezierCurveTo(8, -197, 24, -189, 29, -176);
  context.bezierCurveTo(34, -164, 30, -150, 25, -145);
  context.quadraticCurveTo(20, -158, 12, -153);
  context.quadraticCurveTo(10, -166, 2, -160);
  context.bezierCurveTo(4, -173, 0, -182, -5, -188);
  context.closePath();
  fillStroke(context, 1.55);

  context.fillStyle = WANDMAKER_STYLE.hairLight;
  context.globalAlpha = 0.42;
  context.beginPath();
  context.moveTo(-24, -172);
  context.bezierCurveTo(-18, -185, -7, -190, 0, -185);
  context.quadraticCurveTo(-8, -177, -10, -165);
  context.quadraticCurveTo(-17, -170, -21, -160);
  context.quadraticCurveTo(-24, -166, -24, -172);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;

  context.strokeStyle = WANDMAKER_STYLE.hairLight;
  context.lineWidth = 1.2;
  context.beginPath();
  for (const [x, y, bend, endX, endY] of [
    [-26, -171, -5, -22, -151],
    [-18, -184, 5, -13, -160],
    [-7, -189, -4, -5, -164],
    [4, -191, 5, 8, -162],
    [14, -188, -5, 16, -156],
    [24, -178, 4, 25, -149],
  ]) {
    context.moveTo(x, y);
    context.bezierCurveTo(x + bend, y + 8, endX - bend * 0.4, endY - 8, endX, endY);
  }
  context.stroke();

  context.strokeStyle = 'rgba(104, 108, 117, 0.5)';
  context.lineWidth = 0.95;
  context.beginPath();
  context.moveTo(-20, -178);
  context.bezierCurveTo(-10, -181, -8, -168, -11, -158);
  context.moveTo(8, -187);
  context.bezierCurveTo(18, -180, 19, -166, 16, -155);
  context.stroke();

  drawFlyaway(
    context,
    -19,
    -187,
    -31,
    -194 + Math.sin(time * 2.3) * 1.3,
    WANDMAKER_STYLE.hairShadow,
  );
  drawFlyaway(
    context,
    17,
    -184,
    29,
    -188 + Math.sin(time * 1.9 + 0.7) * 1.1,
    WANDMAKER_STYLE.hairBase,
  );
}

function drawNpcHair(context, kind, palette, headY, rx, ry, time) {
  context.fillStyle = palette.hair;

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
  context.fillStyle = darken(palette.hair, 0.13);
  context.globalAlpha = 0.34;
  context.beginPath();
  context.moveTo(2, headY - ry + 1);
  context.bezierCurveTo(rx * 0.74, headY - ry + 1, rx + 1, headY - 20, rx - 1, headY - 8);
  context.quadraticCurveTo(rx * 0.62, headY - 21, rx * 0.18, headY - 18);
  context.quadraticCurveTo(rx * 0.12, headY - 31, 2, headY - ry + 1);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;

  context.strokeStyle = 'rgba(246,203,139,0.3)';
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

function drawGuideFacialHair(context, lightDirection = -1) {
  context.fillStyle = HAGRID_STYLE.beardBase;
  context.beginPath();
  context.moveTo(-34, -143);
  context.bezierCurveTo(-40, -128, -34, -111, -23, -102);
  context.bezierCurveTo(-21, -94, -16, -88, -10, -94);
  context.bezierCurveTo(-7, -87, -2, -82, 2, -91);
  context.bezierCurveTo(8, -83, 14, -89, 16, -98);
  context.bezierCurveTo(27, -105, 35, -124, 33, -143);
  context.bezierCurveTo(23, -135, 13, -134, 3, -137);
  context.bezierCurveTo(-8, -133, -22, -135, -34, -143);
  context.closePath();
  fillStroke(context, 2.05);

  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.fillStyle = HAGRID_STYLE.beardShadow;
  context.beginPath();
  context.moveTo(2, -136);
  context.bezierCurveTo(19, -135, 31, -138, 33, -142);
  context.bezierCurveTo(36, -122, 27, -105, 17, -98);
  context.bezierCurveTo(13, -88, 8, -84, 2, -91);
  context.bezierCurveTo(8, -106, 9, -122, 2, -136);
  context.closePath();
  context.fill();

  context.fillStyle = HAGRID_STYLE.beardMid;
  context.beginPath();
  context.moveTo(-31, -136);
  context.bezierCurveTo(-34, -121, -28, -108, -20, -101);
  context.bezierCurveTo(-18, -94, -14, -91, -11, -96);
  context.bezierCurveTo(-15, -112, -12, -128, -7, -137);
  context.bezierCurveTo(-16, -133, -24, -133, -31, -136);
  context.closePath();
  context.fill();

  context.strokeStyle = HAGRID_STYLE.beardLight;
  context.lineWidth = 1.45;
  context.beginPath();
  for (const [x, bend, endY] of [
    [-27, -4, -104], [-17, 4, -96], [-7, -3, -91],
    [4, 3, -92], [14, -3, -98], [25, 4, -106],
  ]) {
    context.moveTo(x, -132 + Math.abs(x) * 0.12);
    context.bezierCurveTo(x + bend, -121, x - bend * 0.4, -108, x + bend * 0.18, endY);
  }
  context.stroke();
  context.restore();

  context.fillStyle = HAGRID_STYLE.beardMid;
  context.beginPath();
  context.moveTo(-30, -144);
  context.bezierCurveTo(-23, -153, -11, -151, -2, -143);
  context.bezierCurveTo(-9, -134, -21, -132, -29, -137);
  context.bezierCurveTo(-32, -139, -32, -142, -30, -144);
  context.closePath();
  context.moveTo(30, -144);
  context.bezierCurveTo(23, -153, 11, -151, 2, -143);
  context.bezierCurveTo(9, -134, 21, -132, 29, -137);
  context.bezierCurveTo(32, -139, 32, -142, 30, -144);
  context.closePath();
  context.fill();
  context.strokeStyle = HAGRID_STYLE.beardShadow;
  context.lineWidth = 1.25;
  context.stroke();

  context.strokeStyle = HAGRID_STYLE.beardLight;
  context.lineWidth = 0.95;
  context.beginPath();
  context.moveTo(-25, -144);
  context.bezierCurveTo(-18, -148, -10, -146, -4, -141);
  context.moveTo(25, -144);
  context.bezierCurveTo(18, -148, 10, -146, 4, -141);
  context.stroke();
}

function drawNpcAccessory(
  context,
  kind,
  palette,
  time = 0,
  pose = 'idle',
  { reducedMotion = false, lightDirection = -1 } = {},
) {
  if (kind === 'guide') {
    drawGuideFacialHair(context, lightDirection);
    return;
  }
  if (kind === 'tailor') {
    drawTailorAccessories(context, time, pose, { reducedMotion });
    return;
  }
  if (kind === 'keeper') {
    drawKeeperAccessories(context, time, pose, { reducedMotion });
    return;
  }
  if (kind === 'guide') {
    context.fillStyle = HAGRID_STYLE.hairBase;
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

    context.fillStyle = darken(HAGRID_STYLE.hairBase, 0.1);
    context.globalAlpha = 0.55;
    context.beginPath();
    context.moveTo(3, -133);
    context.quadraticCurveTo(22, -130, 31, -144);
    context.bezierCurveTo(35, -122, 27, -104, 16, -97);
    context.quadraticCurveTo(10, -87, 2, -82);
    context.closePath();
    context.fill();
    context.globalAlpha = 1;

    context.fillStyle = HAGRID_STYLE.hairMid;
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

    context.strokeStyle = HAGRID_STYLE.hairLight;
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
    const gesture = sampleWandmakerGesture(time, pose, { reducedMotion });
    const handX = 43 + gesture;
    const handY = -52 - gesture * 0.7;

    context.strokeStyle = DEEP_OUTLINE;
    context.lineWidth = 5.6;
    context.beginPath();
    context.moveTo(handX - 1, handY + 1);
    context.bezierCurveTo(handX + 4, -68, handX + 11, -87, handX + 14, -104);
    context.stroke();
    context.strokeStyle = WANDMAKER_STYLE.wood;
    context.lineWidth = 3.2;
    context.stroke();
    context.strokeStyle = 'rgba(232, 191, 123, 0.48)';
    context.lineWidth = 0.9;
    context.beginPath();
    context.moveTo(handX, handY - 1);
    context.bezierCurveTo(handX + 5, -71, handX + 10, -89, handX + 13, -102);
    context.stroke();

    context.fillStyle = WANDMAKER_STYLE.woodShadow;
    context.beginPath();
    context.moveTo(handX - 4, handY - 3);
    context.bezierCurveTo(handX - 1, handY - 7, handX + 5, handY - 6, handX + 7, handY - 2);
    context.bezierCurveTo(handX + 5, handY + 4, handX - 1, handY + 5, handX - 4, handY - 3);
    context.closePath();
    context.fill();
    context.strokeStyle = DEEP_OUTLINE;
    context.lineWidth = 1.25;
    context.stroke();

    context.strokeStyle = WANDMAKER_STYLE.brass;
    context.lineWidth = 2.1;
    context.beginPath();
    context.moveTo(handX + 6.5, -78);
    context.quadraticCurveTo(handX + 9, -75, handX + 12, -77);
    context.moveTo(handX + 9, -91);
    context.quadraticCurveTo(handX + 12, -88, handX + 15, -90);
    context.stroke();
    context.strokeStyle = WANDMAKER_STYLE.brassLight;
    context.lineWidth = 0.8;
    context.beginPath();
    context.moveTo(handX + 8, -78);
    context.quadraticCurveTo(handX + 9.5, -77, handX + 11, -78);
    context.stroke();
  }
}

function drawTailorLegs(context, pose, time) {
  const stride = pose === 'walking' ? Math.sin(time * 7.3) * 4.5 : 0;
  for (const side of [-1, 1]) {
    const hipX = side * 17;
    const ankleX = hipX + side * stride;
    context.fillStyle = side < 0 ? TAILOR_STYLE.apronShadow : TAILOR_STYLE.dressShadow;
    context.beginPath();
    context.moveTo(hipX - 5, -8);
    context.bezierCurveTo(hipX - 6, 2, ankleX - 6, 12, ankleX - 5, 21);
    context.bezierCurveTo(ankleX - 1, 24, ankleX + 5, 23, ankleX + 6, 19);
    context.bezierCurveTo(ankleX + 5, 10, hipX + 6, 1, hipX + 5, -8);
    context.closePath();
    fillStroke(context, 1.65);

    context.fillStyle = TAILOR_STYLE.shoe;
    context.beginPath();
    context.moveTo(ankleX - 7, 16);
    context.bezierCurveTo(ankleX - 1, 14, ankleX + side * 8, 16, ankleX + side * 16, 21);
    context.bezierCurveTo(ankleX + side * 20, 25, ankleX + side * 15, 30, ankleX + side * 7, 30);
    context.bezierCurveTo(ankleX - side * 6, 31, ankleX - side * 10, 26, ankleX - 7, 16);
    context.closePath();
    fillStroke(context, 2);
    context.strokeStyle = 'rgba(231, 201, 194, 0.34)';
    context.lineWidth = 1.1;
    context.beginPath();
    context.moveTo(ankleX - side * 2, 22);
    context.bezierCurveTo(ankleX + side * 6, 20, ankleX + side * 12, 22, ankleX + side * 16, 24);
    context.stroke();
  }
}

function drawTailorBackHair(context) {
  context.fillStyle = TAILOR_STYLE.hairShadow;
  context.beginPath();
  context.moveTo(13, -181);
  context.bezierCurveTo(29, -187, 44, -176, 45, -161);
  context.bezierCurveTo(47, -146, 34, -135, 21, -139);
  context.bezierCurveTo(10, -144, 6, -169, 13, -181);
  context.closePath();
  fillStroke(context, 1.85);

  context.fillStyle = TAILOR_STYLE.hairMid;
  context.beginPath();
  context.moveTo(18, -179);
  context.bezierCurveTo(31, -183, 40, -174, 40, -162);
  context.bezierCurveTo(42, -151, 34, -142, 24, -143);
  context.bezierCurveTo(16, -149, 13, -169, 18, -179);
  context.closePath();
  context.fill();

  context.fillStyle = TAILOR_STYLE.hairLight;
  context.globalAlpha = 0.46;
  context.beginPath();
  context.moveTo(19, -176);
  context.bezierCurveTo(27, -181, 35, -176, 36, -168);
  context.bezierCurveTo(33, -166, 28, -162, 24, -156);
  context.bezierCurveTo(19, -161, 16, -169, 19, -176);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;

  context.strokeStyle = TAILOR_STYLE.hairLight;
  context.lineWidth = 1.05;
  context.beginPath();
  context.moveTo(18, -177);
  context.bezierCurveTo(31, -181, 41, -170, 38, -158);
  context.moveTo(15, -171);
  context.bezierCurveTo(28, -175, 38, -164, 34, -150);
  context.moveTo(17, -160);
  context.bezierCurveTo(25, -166, 34, -158, 30, -145);
  context.stroke();
}

function drawTailorBody(context) {
  context.fillStyle = TAILOR_STYLE.dressBase;
  context.beginPath();
  context.moveTo(-32, -103);
  context.bezierCurveTo(-44, -99, -47, -84, -43, -69);
  context.bezierCurveTo(-47, -46, -57, -17, -62, 1);
  context.bezierCurveTo(-39, 9, -18, 12, 1, 7);
  context.bezierCurveTo(22, 13, 43, 9, 61, -1);
  context.bezierCurveTo(56, -21, 47, -48, 43, -70);
  context.bezierCurveTo(46, -86, 42, -99, 31, -104);
  context.bezierCurveTo(14, -111, -14, -110, -32, -103);
  context.closePath();
  fillStroke(context, 2.05);

  context.fillStyle = TAILOR_STYLE.dressShadow;
  context.beginPath();
  context.moveTo(5, -106);
  context.bezierCurveTo(27, -106, 42, -92, 41, -71);
  context.bezierCurveTo(47, -47, 55, -20, 60, -1);
  context.bezierCurveTo(42, 9, 24, 11, 5, 7);
  context.bezierCurveTo(13, -24, 12, -72, 5, -106);
  context.closePath();
  context.fill();

  context.fillStyle = TAILOR_STYLE.dressMid;
  context.beginPath();
  context.moveTo(-30, -99);
  context.bezierCurveTo(-40, -83, -39, -61, -39, -48);
  context.bezierCurveTo(-44, -28, -51, -9, -54, -2);
  context.bezierCurveTo(-42, 4, -31, 7, -21, 7);
  context.bezierCurveTo(-25, -27, -18, -74, -11, -98);
  context.bezierCurveTo(-17, -104, -25, -103, -30, -99);
  context.closePath();
  context.fill();

  context.fillStyle = TAILOR_STYLE.dressLight;
  context.beginPath();
  context.moveTo(-31, -96);
  context.bezierCurveTo(-39, -79, -35, -57, -39, -39);
  context.bezierCurveTo(-43, -23, -47, -10, -49, -3);
  context.bezierCurveTo(-42, 0, -35, 3, -30, 3);
  context.bezierCurveTo(-32, -27, -24, -70, -31, -96);
  context.closePath();
  context.fill();

  context.fillStyle = TAILOR_STYLE.apronBase;
  context.beginPath();
  context.moveTo(-24, -83);
  context.bezierCurveTo(-30, -67, -29, -45, -32, -27);
  context.bezierCurveTo(-36, -15, -39, -6, -41, 0);
  context.bezierCurveTo(-25, 6, -8, 8, 2, 5);
  context.bezierCurveTo(15, 9, 29, 5, 40, 0);
  context.bezierCurveTo(36, -17, 31, -38, 29, -55);
  context.bezierCurveTo(29, -68, 25, -79, 22, -84);
  context.bezierCurveTo(8, -90, -10, -89, -24, -83);
  context.closePath();
  fillStroke(context, 1.35);

  context.fillStyle = TAILOR_STYLE.apronShadow;
  context.beginPath();
  context.moveTo(3, -87);
  context.bezierCurveTo(19, -86, 27, -76, 27, -57);
  context.bezierCurveTo(30, -38, 36, -16, 40, 0);
  context.bezierCurveTo(28, 5, 15, 8, 3, 5);
  context.bezierCurveTo(8, -21, 8, -59, 3, -87);
  context.closePath();
  context.fill();

  context.fillStyle = TAILOR_STYLE.apronMid;
  context.beginPath();
  context.moveTo(-22, -80);
  context.bezierCurveTo(-28, -64, -26, -43, -29, -27);
  context.bezierCurveTo(-32, -15, -35, -6, -36, -1);
  context.bezierCurveTo(-28, 3, -20, 5, -13, 5);
  context.bezierCurveTo(-16, -19, -12, -57, -7, -83);
  context.bezierCurveTo(-13, -85, -18, -84, -22, -80);
  context.closePath();
  context.fill();

  context.fillStyle = TAILOR_STYLE.apronLight;
  context.beginPath();
  context.moveTo(-22, -76);
  context.bezierCurveTo(-27, -61, -24, -43, -27, -31);
  context.bezierCurveTo(-29, -20, -33, -9, -34, -4);
  context.bezierCurveTo(-29, -1, -24, 1, -20, 1);
  context.bezierCurveTo(-21, -25, -16, -57, -22, -76);
  context.closePath();
  context.fill();

  context.strokeStyle = TAILOR_STYLE.apronShadow;
  context.lineWidth = 5.4;
  context.beginPath();
  context.moveTo(-31, -61);
  context.bezierCurveTo(-14, -56, 12, -56, 32, -62);
  context.stroke();
  context.strokeStyle = TAILOR_STYLE.apronLight;
  context.lineWidth = 1.1;
  context.beginPath();
  context.moveTo(-29, -63);
  context.bezierCurveTo(-12, -59, 11, -59, 29, -64);
  context.stroke();

  context.strokeStyle = 'rgba(245, 217, 205, 0.32)';
  context.lineWidth = 1.2;
  context.beginPath();
  context.moveTo(-17, -52);
  context.bezierCurveTo(-22, -35, -21, -15, -25, 2);
  context.moveTo(0, -55);
  context.bezierCurveTo(-3, -35, -2, -15, -4, 5);
  context.moveTo(17, -53);
  context.bezierCurveTo(22, -34, 22, -15, 27, 2);
  context.stroke();

  context.fillStyle = WARM_BOUNCE;
  context.beginPath();
  context.moveTo(-58, -8);
  context.bezierCurveTo(-37, -1, -17, 8, 1, 7);
  context.bezierCurveTo(-18, 13, -42, 9, -62, 1);
  context.quadraticCurveTo(-62, -3, -58, -8);
  context.closePath();
  context.fill();
}

function drawTailorArms(context, time, pose, { reducedMotion = false } = {}) {
  const motion = sampleTailorMotion({ time, pose, reducedMotion });
  const leftSwing = motion.breath * 0.7;
  const leftWristX = -45 - leftSwing * 0.25;
  const leftWristY = -27 + leftSwing;

  context.fillStyle = TAILOR_STYLE.dressBase;
  context.beginPath();
  context.moveTo(-30, -99);
  context.bezierCurveTo(-44, -97, -51, -73, leftWristX - 6, leftWristY - 7);
  context.bezierCurveTo(leftWristX - 4, leftWristY + 1, leftWristX + 3, leftWristY + 5, leftWristX + 10, leftWristY);
  context.bezierCurveTo(-40, -58, -33, -82, -30, -99);
  context.closePath();
  fillStroke(context, 1.8);
  context.fillStyle = TAILOR_STYLE.dressLight;
  context.beginPath();
  context.moveTo(-35, -91);
  context.bezierCurveTo(-46, -70, leftWristX - 4, leftWristY - 9, leftWristX + 1, leftWristY - 6);
  context.bezierCurveTo(-42, -69, -37, -83, -35, -91);
  context.closePath();
  context.fill();
  context.strokeStyle = TAILOR_STYLE.apronMid;
  context.lineWidth = 2.7;
  context.beginPath();
  context.moveTo(leftWristX - 5, leftWristY - 6);
  context.bezierCurveTo(leftWristX - 1, leftWristY - 2, leftWristX + 4, leftWristY + 1, leftWristX + 9, leftWristY - 1);
  context.stroke();
  drawHand(context, leftWristX, leftWristY + 7, TAILOR_STYLE.skin, 7.8);

  const rightHandX = 45 + motion.handTurn * 9;
  const rightHandY = -24 - motion.handLift;
  const elbowX = 50 + motion.handTurn * 3;
  const elbowY = -62 - motion.handLift * 0.36;
  context.fillStyle = TAILOR_STYLE.dressMid;
  context.beginPath();
  context.moveTo(29, -100);
  context.bezierCurveTo(43, -99, 49, -82, elbowX + 3, elbowY - 5);
  context.bezierCurveTo(52, -52, rightHandX + 5, rightHandY - 9, rightHandX + 6, rightHandY - 4);
  context.bezierCurveTo(rightHandX + 2, rightHandY + 2, rightHandX - 4, rightHandY + 2, rightHandX - 8, rightHandY - 3);
  context.bezierCurveTo(43, -58, 34, -80, 29, -100);
  context.closePath();
  fillStroke(context, 1.85);
  context.fillStyle = TAILOR_STYLE.dressShadow;
  context.beginPath();
  context.moveTo(35, -92);
  context.bezierCurveTo(45, -79, 49, -65, elbowX + 1, elbowY - 2);
  context.bezierCurveTo(51, -50, rightHandX + 2, rightHandY - 7, rightHandX + 2, rightHandY - 4);
  context.bezierCurveTo(47, -58, 39, -77, 35, -92);
  context.closePath();
  context.fill();
  context.strokeStyle = TAILOR_STYLE.apronMid;
  context.lineWidth = 2.8;
  context.beginPath();
  context.moveTo(rightHandX + 5, rightHandY - 5);
  context.bezierCurveTo(rightHandX + 1, rightHandY - 1, rightHandX - 4, rightHandY, rightHandX - 7, rightHandY - 3);
  context.stroke();
  drawHand(context, rightHandX, rightHandY + 7, TAILOR_STYLE.skin, 8);
}

function drawTailorHead(context, blinking, time, pose, { reducedMotion = false } = {}) {
  const motion = sampleTailorMotion({ time, pose, reducedMotion });
  context.save();
  context.translate(0, -141);
  context.rotate(motion.headTilt);
  context.translate(0, 141);

  drawTailorEar(context, -34, -141, -1);
  drawTailorEar(context, 35, -140, 1);

  context.fillStyle = TAILOR_STYLE.skin;
  context.beginPath();
  context.moveTo(-4, -181);
  context.bezierCurveTo(-23, -183, -34, -169, -33, -149);
  context.bezierCurveTo(-36, -128, -25, -108, -9, -99);
  context.bezierCurveTo(-1, -94, 9, -97, 17, -104);
  context.bezierCurveTo(30, -117, 35, -137, 33, -153);
  context.bezierCurveTo(34, -170, 18, -183, -4, -181);
  context.closePath();
  fillStroke(context, 1.9);

  context.fillStyle = TAILOR_STYLE.skinShadow;
  context.globalAlpha = 0.3;
  context.beginPath();
  context.moveTo(5, -180);
  context.bezierCurveTo(24, -178, 33, -166, 31, -150);
  context.bezierCurveTo(34, -132, 26, -111, 15, -103);
  context.bezierCurveTo(9, -98, 4, -99, 2, -103);
  context.bezierCurveTo(10, -125, 10, -157, 5, -180);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;

  context.fillStyle = TAILOR_STYLE.skinLight;
  context.beginPath();
  context.moveTo(-25, -168);
  context.bezierCurveTo(-19, -179, -8, -182, 1, -177);
  context.bezierCurveTo(-9, -169, -14, -157, -15, -145);
  context.bezierCurveTo(-24, -146, -30, -158, -25, -168);
  context.closePath();
  context.fill();

  drawTailorCheek(context, -23, -127, -1);
  drawTailorCheek(context, 23, -126, 1);
  drawTailorEyes(context, blinking, time, pose, motion);
  drawTailorNose(context);
  drawTailorMouth(context, pose, motion);
  drawTailorFrontHair(context, motion);

  context.restore();
}

function drawTailorEar(context, x, y, side) {
  context.fillStyle = TAILOR_STYLE.skin;
  context.beginPath();
  context.moveTo(x - side * 2, y - 8);
  context.bezierCurveTo(x + side * 8, y - 10, x + side * 10, y + 4, x + side * 3, y + 10);
  context.bezierCurveTo(x - side * 5, y + 8, x - side * 7, y - 3, x - side * 2, y - 8);
  context.closePath();
  fillStroke(context, 1.55);
  context.strokeStyle = 'rgba(116, 62, 56, 0.36)';
  context.lineWidth = 1.05;
  context.beginPath();
  context.moveTo(x + side, y - 4);
  context.bezierCurveTo(x + side * 6, y - 2, x + side * 5, y + 5, x, y + 6);
  context.stroke();
}

function drawTailorCheek(context, x, y, side) {
  context.fillStyle = TAILOR_STYLE.cheek;
  context.beginPath();
  context.moveTo(x - 8, y - 1);
  context.bezierCurveTo(x - 5, y - 5 - side, x + 5, y - 5 + side, x + 8, y);
  context.bezierCurveTo(x + 5, y + 4, x - 5, y + 5 + side, x - 8, y - 1);
  context.closePath();
  context.fill();
}

function drawTailorEyes(context, blinking, time, pose, motion) {
  const gazeX = Math.sin(time * 0.67 + 2.1) * 1.05;
  const gazeY = Math.sin(time * 0.43 + 1.2) * 0.45;
  const eyes = [
    { x: -12.5, y: -145.5, side: -1, width: 6.5, height: 4.8 },
    { x: 12.2, y: -144.8, side: 1, width: 6.2, height: 4.6 },
  ];

  for (const eye of eyes) {
    if (blinking) {
      context.fillStyle = TAILOR_STYLE.skinShadow;
      context.globalAlpha = 0.4;
      context.beginPath();
      context.moveTo(eye.x - eye.width, eye.y + 0.2);
      context.bezierCurveTo(eye.x - 3, eye.y - 1.9, eye.x + 3, eye.y - 1.7, eye.x + eye.width, eye.y);
      context.bezierCurveTo(eye.x + 3, eye.y + 2.4, eye.x - 3, eye.y + 2.5, eye.x - eye.width, eye.y + 0.2);
      context.closePath();
      context.fill();
      context.globalAlpha = 1;
      context.strokeStyle = DEEP_OUTLINE;
      context.lineWidth = 1.45;
      context.beginPath();
      context.moveTo(eye.x - eye.width, eye.y + 0.2);
      context.bezierCurveTo(eye.x - 2.5, eye.y + 2.1, eye.x + 3, eye.y + 2.1, eye.x + eye.width, eye.y);
      context.stroke();
      continue;
    }

    context.fillStyle = '#f3e8d6';
    context.beginPath();
    context.moveTo(eye.x - eye.width, eye.y + 0.2);
    context.bezierCurveTo(eye.x - 3, eye.y - eye.height, eye.x + 3.2, eye.y - eye.height + eye.side * 0.2, eye.x + eye.width, eye.y - 0.25);
    context.bezierCurveTo(eye.x + 3, eye.y + eye.height * 0.7, eye.x - 3.2, eye.y + eye.height * 0.78, eye.x - eye.width, eye.y + 0.2);
    context.closePath();
    fillStroke(context, 1.35);

    const irisX = eye.x + gazeX;
    const irisY = eye.y + gazeY;
    context.fillStyle = TAILOR_STYLE.iris;
    context.beginPath();
    context.moveTo(irisX - 0.3, irisY - 3.55);
    context.bezierCurveTo(irisX + 3.1, irisY - 3, irisX + 3.4, irisY + 1.8, irisX + 0.2, irisY + 3.45);
    context.bezierCurveTo(irisX - 3, irisY + 2.8, irisX - 3.3, irisY - 2.3, irisX - 0.3, irisY - 3.55);
    context.closePath();
    context.fill();
    context.fillStyle = '#251b1a';
    context.beginPath();
    context.moveTo(irisX, irisY - 1.9);
    context.bezierCurveTo(irisX + 1.6, irisY - 1.5, irisX + 1.7, irisY + 1.2, irisX + 0.1, irisY + 1.9);
    context.bezierCurveTo(irisX - 1.55, irisY + 1.45, irisX - 1.65, irisY - 1.25, irisX, irisY - 1.9);
    context.closePath();
    context.fill();
    context.fillStyle = 'rgba(255, 247, 222, 0.92)';
    context.beginPath();
    context.moveTo(irisX - 1.65, irisY - 2.1);
    context.quadraticCurveTo(irisX - 0.5, irisY - 2.8, irisX + 0.15, irisY - 1.7);
    context.quadraticCurveTo(irisX - 0.65, irisY - 0.7, irisX - 1.65, irisY - 2.1);
    context.closePath();
    context.fill();

    context.strokeStyle = 'rgba(73, 50, 45, 0.58)';
    context.lineWidth = 1.05;
    context.beginPath();
    context.moveTo(eye.x - eye.width, eye.y + 0.2);
    context.bezierCurveTo(eye.x - 3, eye.y - eye.height, eye.x + 3.2, eye.y - eye.height + eye.side * 0.2, eye.x + eye.width, eye.y - 0.25);
    context.stroke();
  }

  const speaking = pose === 'speaking' || pose === 'talk';
  const leftLift = motion.browLift + (speaking ? 0.8 : 0.2);
  const rightLift = motion.browLift * 0.62;
  context.strokeStyle = TAILOR_STYLE.hairShadow;
  context.lineWidth = 2.2;
  context.beginPath();
  context.moveTo(-20, -157 - leftLift);
  context.bezierCurveTo(-16, -161 - leftLift, -10, -161.5 - leftLift, -6, -157 - leftLift * 0.8);
  context.moveTo(6, -157 - rightLift);
  context.bezierCurveTo(10, -160.5 - rightLift, 16, -160.5 - rightLift, 21, -156.5 - rightLift * 0.7);
  context.stroke();

  context.strokeStyle = 'rgba(116, 75, 65, 0.34)';
  context.lineWidth = 0.85;
  context.beginPath();
  context.moveTo(-28, -139);
  context.bezierCurveTo(-25, -136, -22, -135, -19, -136);
  context.moveTo(19, -135);
  context.bezierCurveTo(22, -134, 25, -136, 28, -139);
  context.stroke();
}

function drawTailorNose(context) {
  context.fillStyle = 'rgba(155, 89, 73, 0.2)';
  context.beginPath();
  context.moveTo(-1, -143);
  context.bezierCurveTo(-4, -136, -5, -128, -2, -124);
  context.bezierCurveTo(1, -121, 7, -123, 7, -127);
  context.bezierCurveTo(4, -132, 3, -140, -1, -143);
  context.closePath();
  context.fill();
  context.strokeStyle = 'rgba(105, 65, 57, 0.52)';
  context.lineWidth = 1.05;
  context.beginPath();
  context.moveTo(-1, -141);
  context.bezierCurveTo(-3, -133, -3, -126, 3, -125);
  context.quadraticCurveTo(6, -124, 7, -127);
  context.stroke();
  context.strokeStyle = TAILOR_STYLE.skinLight;
  context.lineWidth = 0.75;
  context.beginPath();
  context.moveTo(-1, -138);
  context.quadraticCurveTo(-2, -132, 0, -129);
  context.stroke();
}

function drawTailorMouth(context, pose, motion) {
  const speaking = pose === 'speaking' || pose === 'talk';
  const y = -113;
  if (speaking) {
    context.fillStyle = '#814c55';
    context.beginPath();
    context.moveTo(-7.5, y);
    context.bezierCurveTo(-3, y - 2.4, 3.5, y - 2.2, 8, y + 0.2);
    context.bezierCurveTo(5, y + motion.mouthOpen, -3, y + motion.mouthOpen + 0.7, -7.5, y);
    context.closePath();
    fillStroke(context, 1.15);
    context.fillStyle = 'rgba(233, 145, 146, 0.62)';
    context.beginPath();
    context.moveTo(-4.5, y + motion.mouthOpen * 0.55);
    context.quadraticCurveTo(0, y + motion.mouthOpen + 0.5, 4.8, y + motion.mouthOpen * 0.52);
    context.quadraticCurveTo(0.4, y + motion.mouthOpen * 0.34, -4.5, y + motion.mouthOpen * 0.55);
    context.closePath();
    context.fill();
    return;
  }

  context.strokeStyle = '#815157';
  context.lineWidth = 1.75;
  context.beginPath();
  context.moveTo(-8, y + 0.4);
  context.bezierCurveTo(-3, y + 4, 3.5, y + 3.5, 8.5, y - 0.2);
  context.stroke();
  context.strokeStyle = 'rgba(255, 216, 194, 0.3)';
  context.lineWidth = 0.7;
  context.beginPath();
  context.moveTo(-5, y + 0.8);
  context.quadraticCurveTo(-1, y + 2.5, 3, y + 1.5);
  context.stroke();
}

function drawTailorFrontHair(context, motion) {
  context.fillStyle = TAILOR_STYLE.hairBase;
  context.beginPath();
  context.moveTo(-32, -151);
  context.bezierCurveTo(-36, -169, -23, -184, -7, -185);
  context.bezierCurveTo(6, -192, 25, -185, 31, -170);
  context.bezierCurveTo(36, -158, 32, -146, 27, -141);
  context.bezierCurveTo(23, -155, 17, -159, 10, -157);
  context.bezierCurveTo(3, -155, -2, -150, -8, -154);
  context.bezierCurveTo(-15, -159, -23, -158, -32, -151);
  context.closePath();
  fillStroke(context, 1.75);

  context.fillStyle = TAILOR_STYLE.hairShadow;
  context.beginPath();
  context.moveTo(3, -187);
  context.bezierCurveTo(19, -187, 31, -177, 32, -164);
  context.bezierCurveTo(35, -155, 31, -146, 27, -141);
  context.bezierCurveTo(22, -154, 16, -159, 10, -157);
  context.bezierCurveTo(13, -170, 10, -181, 3, -187);
  context.closePath();
  context.fill();

  context.fillStyle = TAILOR_STYLE.hairMid;
  context.beginPath();
  context.moveTo(-30, -157);
  context.bezierCurveTo(-29, -173, -16, -184, -3, -185);
  context.bezierCurveTo(-15, -179, -20, -169, -18, -158);
  context.bezierCurveTo(-23, -160, -27, -159, -30, -157);
  context.closePath();
  context.fill();

  context.fillStyle = TAILOR_STYLE.hairLight;
  context.globalAlpha = 0.52;
  context.beginPath();
  context.moveTo(-26, -169);
  context.bezierCurveTo(-19, -181, -6, -187, 3, -183);
  context.bezierCurveTo(-8, -178, -14, -168, -15, -157);
  context.bezierCurveTo(-23, -158, -30, -163, -26, -169);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;

  context.strokeStyle = TAILOR_STYLE.hairLight;
  context.lineWidth = 1.1;
  context.beginPath();
  context.moveTo(-27, -171);
  context.bezierCurveTo(-17, -185, -3, -187, 8, -182);
  context.moveTo(-24, -162);
  context.bezierCurveTo(-13, -176, 2, -181, 16, -174);
  context.moveTo(-14, -156);
  context.bezierCurveTo(-2, -166, 13, -170, 25, -160);
  context.stroke();

  context.strokeStyle = TAILOR_STYLE.hairShadow;
  context.lineWidth = 0.95;
  context.beginPath();
  context.moveTo(-20, -179);
  context.bezierCurveTo(-9, -182, 1, -177, 8, -168);
  context.moveTo(-6, -185);
  context.bezierCurveTo(7, -183, 18, -175, 23, -164);
  context.moveTo(19, -177);
  context.bezierCurveTo(27, -169, 29 + motion.hairSway, -156, 26, -146);
  context.stroke();
}

function drawTailorAccessories(context, time, pose, { reducedMotion = false } = {}) {
  const motion = sampleTailorMotion({ time, pose, reducedMotion });
  const sway = motion.tapeSway;

  context.strokeStyle = DEEP_OUTLINE;
  context.lineWidth = 7.2;
  context.beginPath();
  context.moveTo(-19, -97);
  context.bezierCurveTo(-25, -83, -30 + sway, -62, -25 + sway, -44);
  context.bezierCurveTo(-22 + sway * 0.5, -31, -18, -21, -13, -15);
  context.moveTo(19, -97);
  context.bezierCurveTo(25, -82, 30 + sway, -61, 25 + sway, -43);
  context.bezierCurveTo(22 + sway * 0.45, -31, 18, -22, 14, -16);
  context.stroke();
  context.strokeStyle = TAILOR_STYLE.tape;
  context.lineWidth = 4.6;
  context.stroke();
  context.strokeStyle = TAILOR_STYLE.tapeLight;
  context.lineWidth = 0.9;
  context.beginPath();
  context.moveTo(-20, -96);
  context.bezierCurveTo(-25, -79, -27 + sway, -59, -23 + sway, -45);
  context.moveTo(18, -96);
  context.bezierCurveTo(23, -79, 27 + sway, -59, 23 + sway, -44);
  context.stroke();

  context.strokeStyle = TAILOR_STYLE.tapeMark;
  context.lineWidth = 0.95;
  context.beginPath();
  for (const [x, y, length, direction] of [
    [-26, -76, 3.6, 1], [-28, -65, 2.7, 1], [-27, -53, 3.8, 1], [-23, -39, 2.8, 1],
    [26, -75, 3.7, -1], [28, -64, 2.6, -1], [27, -52, 3.8, -1], [23, -38, 2.8, -1],
  ]) {
    const shiftedX = x + sway * (Math.abs(y) < 50 ? 0.65 : 0.25);
    context.moveTo(shiftedX, y);
    context.quadraticCurveTo(shiftedX + direction * length * 0.55, y + 0.35, shiftedX + direction * length, y + 0.1);
  }
  context.stroke();

  context.fillStyle = TAILOR_STYLE.apronShadow;
  context.beginPath();
  context.moveTo(-29, -37);
  context.bezierCurveTo(-20, -40, -12, -38, -8, -32);
  context.bezierCurveTo(-10, -22, -16, -17, -25, -19);
  context.bezierCurveTo(-30, -24, -32, -31, -29, -37);
  context.closePath();
  context.fill();
  context.strokeStyle = TAILOR_STYLE.apronLight;
  context.lineWidth = 1;
  context.stroke();
  context.strokeStyle = 'rgba(244, 218, 205, 0.32)';
  context.lineWidth = 0.75;
  context.beginPath();
  context.moveTo(-27, -34);
  context.bezierCurveTo(-21, -36, -15, -34, -11, -30);
  context.stroke();

  const cushionX = 45 + motion.handTurn * 9;
  const cushionY = -25 - motion.handLift;
  context.fillStyle = TAILOR_STYLE.cushion;
  context.beginPath();
  context.moveTo(cushionX - 9, cushionY - 3);
  context.bezierCurveTo(cushionX - 7, cushionY - 9, cushionX + 5, cushionY - 10, cushionX + 10, cushionY - 4);
  context.bezierCurveTo(cushionX + 12, cushionY + 2, cushionX + 5, cushionY + 7, cushionX - 3, cushionY + 6);
  context.bezierCurveTo(cushionX - 10, cushionY + 5, cushionX - 12, cushionY + 1, cushionX - 9, cushionY - 3);
  context.closePath();
  fillStroke(context, 1.25);
  context.fillStyle = TAILOR_STYLE.cushionShadow;
  context.beginPath();
  context.moveTo(cushionX + 1, cushionY - 8);
  context.bezierCurveTo(cushionX + 8, cushionY - 7, cushionX + 11, cushionY - 2, cushionX + 8, cushionY + 2);
  context.bezierCurveTo(cushionX + 5, cushionY + 5, cushionX + 2, cushionY + 5, cushionX, cushionY + 3);
  context.bezierCurveTo(cushionX + 3, cushionY - 1, cushionX + 3, cushionY - 5, cushionX + 1, cushionY - 8);
  context.closePath();
  context.fill();
  context.strokeStyle = 'rgba(250, 202, 199, 0.44)';
  context.lineWidth = 0.85;
  context.beginPath();
  context.moveTo(cushionX - 6, cushionY - 4);
  context.bezierCurveTo(cushionX - 1, cushionY - 7, cushionX + 4, cushionY - 6, cushionX + 7, cushionY - 3);
  context.stroke();

  const pins = [
    { dx: -5, bend: -2, height: 13, color: '#d58d79' },
    { dx: 0, bend: 1.5, height: 16, color: '#8a6b9a' },
    { dx: 5, bend: 2, height: 12, color: '#6f8790' },
  ];
  context.strokeStyle = '#8f8581';
  context.lineWidth = 0.9;
  for (const pin of pins) {
    const startX = cushionX + pin.dx;
    const endX = startX + pin.bend;
    const endY = cushionY - pin.height;
    context.beginPath();
    context.moveTo(startX, cushionY - 5);
    context.quadraticCurveTo(startX + pin.bend * 0.35, cushionY - pin.height * 0.55, endX, endY);
    context.stroke();
    drawTailorPinHead(context, endX, endY, pin.color);
  }
}

function drawTailorPinHead(context, x, y, color) {
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(x - 1.8, y - 0.4);
  context.bezierCurveTo(x - 1.3, y - 2.1, x + 1.3, y - 2.2, x + 2, y - 0.2);
  context.bezierCurveTo(x + 1.6, y + 1.6, x - 1.2, y + 1.8, x - 1.8, y - 0.4);
  context.closePath();
  context.fill();
  context.strokeStyle = DEEP_OUTLINE;
  context.lineWidth = 0.55;
  context.stroke();
}

function drawKeeperLegs(context, pose, time) {
  const stride = pose === 'walking' ? Math.sin(time * 7.1) * 5 : 0;
  for (const side of [-1, 1]) {
    const hipX = side * 18;
    const ankleX = hipX + side * stride;
    context.fillStyle = side < 0 ? KEEPER_STYLE.coatMid : KEEPER_STYLE.coatShadow;
    context.beginPath();
    context.moveTo(hipX - 6, -9);
    context.bezierCurveTo(hipX - 7, 2, ankleX - 7, 13, ankleX - 6, 21);
    context.bezierCurveTo(ankleX - 1, 25, ankleX + 6, 24, ankleX + 7, 19);
    context.bezierCurveTo(ankleX + 6, 9, hipX + 7, 1, hipX + 6, -9);
    context.closePath();
    fillStroke(context, 1.7);

    context.fillStyle = KEEPER_STYLE.shoe;
    context.beginPath();
    context.moveTo(ankleX - 8, 15);
    context.bezierCurveTo(ankleX - 1, 13, ankleX + side * 9, 16, ankleX + side * 18, 21);
    context.bezierCurveTo(ankleX + side * 22, 25, ankleX + side * 16, 30, ankleX + side * 7, 30);
    context.bezierCurveTo(ankleX - side * 6, 31, ankleX - side * 11, 26, ankleX - 8, 15);
    context.closePath();
    fillStroke(context, 2.05);
    context.strokeStyle = KEEPER_STYLE.gauntletLight;
    context.lineWidth = 1.15;
    context.beginPath();
    context.moveTo(ankleX - side * 3, 22);
    context.bezierCurveTo(ankleX + side * 6, 20, ankleX + side * 13, 22, ankleX + side * 18, 24);
    context.stroke();
  }
}

function drawKeeperBackDetails(context) {
  context.fillStyle = KEEPER_STYLE.hairShadow;
  context.beginPath();
  context.moveTo(-20, -174);
  context.bezierCurveTo(-38, -165, -42, -141, -34, -119);
  context.bezierCurveTo(-31, -106, -22, -98, -15, -104);
  context.bezierCurveTo(-22, -125, -17, -151, -8, -176);
  context.bezierCurveTo(-12, -178, -17, -177, -20, -174);
  context.closePath();
  fillStroke(context, 1.75);

  context.fillStyle = KEEPER_STYLE.hairBase;
  context.beginPath();
  context.moveTo(15, -178);
  context.bezierCurveTo(35, -167, 40, -144, 33, -122);
  context.bezierCurveTo(31, -108, 24, -100, 17, -104);
  context.bezierCurveTo(24, -128, 20, -154, 7, -180);
  context.bezierCurveTo(10, -181, 13, -180, 15, -178);
  context.closePath();
  fillStroke(context, 1.75);

  context.fillStyle = KEEPER_STYLE.hairMid;
  context.beginPath();
  context.moveTo(21, -154);
  context.bezierCurveTo(38, -149, 43, -132, 36, -117);
  context.bezierCurveTo(30, -105, 20, -101, 15, -109);
  context.bezierCurveTo(23, -124, 25, -141, 21, -154);
  context.closePath();
  context.fill();

  context.strokeStyle = KEEPER_STYLE.hairLight;
  context.lineWidth = 1.2;
  context.beginPath();
  context.moveTo(-29, -160);
  context.bezierCurveTo(-36, -140, -31, -117, -22, -105);
  context.moveTo(24, -164);
  context.bezierCurveTo(34, -147, 31, -121, 22, -107);
  context.stroke();

  const braid = [
    [29, -133, -1], [32, -120, 1], [29, -107, -1], [31, -95, 1],
  ];
  for (const [x, y, turn] of braid) drawKeeperBraidLobe(context, x, y, turn);
  context.fillStyle = KEEPER_STYLE.hairShadow;
  context.beginPath();
  context.moveTo(26, -86);
  context.bezierCurveTo(29, -93, 35, -93, 37, -87);
  context.bezierCurveTo(35, -79, 29, -78, 26, -86);
  context.closePath();
  fillStroke(context, 1.1);
}

function drawKeeperBraidLobe(context, x, y, turn) {
  context.fillStyle = turn < 0 ? KEEPER_STYLE.hairBase : KEEPER_STYLE.hairMid;
  context.beginPath();
  context.moveTo(x - 6, y - 5);
  context.bezierCurveTo(x - 2, y - 10 - turn, x + 7, y - 7 + turn, x + 7, y);
  context.bezierCurveTo(x + 5, y + 7, x - 3, y + 8 + turn, x - 7, y + 1);
  context.bezierCurveTo(x - 8, y - 1, x - 7, y - 3, x - 6, y - 5);
  context.closePath();
  fillStroke(context, 1.05);
  context.strokeStyle = KEEPER_STYLE.hairLight;
  context.lineWidth = 0.7;
  context.beginPath();
  context.moveTo(x - 3, y - 5);
  context.quadraticCurveTo(x + 2, y - 7, x + 5, y - 1);
  context.stroke();
}

function drawKeeperBody(context) {
  context.fillStyle = KEEPER_STYLE.coatBase;
  context.beginPath();
  context.moveTo(-33, -103);
  context.bezierCurveTo(-46, -100, -49, -84, -45, -69);
  context.bezierCurveTo(-48, -46, -56, -18, -59, 1);
  context.bezierCurveTo(-39, 9, -18, 12, 1, 7);
  context.bezierCurveTo(21, 13, 43, 9, 59, -1);
  context.bezierCurveTo(56, -21, 49, -48, 45, -70);
  context.bezierCurveTo(48, -86, 43, -100, 32, -104);
  context.bezierCurveTo(14, -111, -15, -110, -33, -103);
  context.closePath();
  fillStroke(context, 2.05);

  context.fillStyle = KEEPER_STYLE.coatShadow;
  context.beginPath();
  context.moveTo(5, -106);
  context.bezierCurveTo(28, -106, 43, -92, 42, -70);
  context.bezierCurveTo(47, -47, 55, -20, 58, -1);
  context.bezierCurveTo(42, 8, 24, 11, 5, 7);
  context.bezierCurveTo(13, -25, 12, -73, 5, -106);
  context.closePath();
  context.fill();

  context.fillStyle = KEEPER_STYLE.coatMid;
  context.beginPath();
  context.moveTo(-31, -99);
  context.bezierCurveTo(-41, -82, -40, -60, -40, -46);
  context.bezierCurveTo(-44, -27, -49, -10, -52, -2);
  context.bezierCurveTo(-41, 4, -31, 7, -21, 7);
  context.bezierCurveTo(-25, -27, -19, -74, -11, -98);
  context.bezierCurveTo(-18, -104, -26, -103, -31, -99);
  context.closePath();
  context.fill();

  context.fillStyle = KEEPER_STYLE.coatLight;
  context.beginPath();
  context.moveTo(-32, -96);
  context.bezierCurveTo(-40, -79, -36, -58, -39, -39);
  context.bezierCurveTo(-43, -24, -46, -10, -48, -3);
  context.bezierCurveTo(-41, 0, -35, 3, -30, 3);
  context.bezierCurveTo(-33, -28, -25, -70, -32, -96);
  context.closePath();
  context.fill();

  context.fillStyle = KEEPER_STYLE.apronBase;
  context.beginPath();
  context.moveTo(-23, -85);
  context.bezierCurveTo(-29, -67, -28, -44, -31, -27);
  context.bezierCurveTo(-35, -15, -38, -6, -40, 0);
  context.bezierCurveTo(-24, 6, -8, 8, 2, 5);
  context.bezierCurveTo(15, 9, 29, 5, 39, 0);
  context.bezierCurveTo(35, -17, 31, -39, 29, -57);
  context.bezierCurveTo(29, -70, 25, -81, 21, -86);
  context.bezierCurveTo(8, -91, -10, -90, -23, -85);
  context.closePath();
  fillStroke(context, 1.35);

  context.fillStyle = KEEPER_STYLE.apronShadow;
  context.beginPath();
  context.moveTo(3, -89);
  context.bezierCurveTo(19, -87, 27, -77, 27, -58);
  context.bezierCurveTo(30, -38, 35, -16, 39, 0);
  context.bezierCurveTo(28, 5, 15, 8, 3, 5);
  context.bezierCurveTo(8, -22, 8, -61, 3, -89);
  context.closePath();
  context.fill();

  context.fillStyle = KEEPER_STYLE.apronMid;
  context.beginPath();
  context.moveTo(-21, -81);
  context.bezierCurveTo(-27, -64, -25, -43, -28, -27);
  context.bezierCurveTo(-31, -15, -34, -6, -35, -1);
  context.bezierCurveTo(-27, 3, -19, 5, -12, 5);
  context.bezierCurveTo(-15, -20, -11, -58, -6, -84);
  context.bezierCurveTo(-12, -86, -17, -85, -21, -81);
  context.closePath();
  context.fill();

  context.fillStyle = KEEPER_STYLE.apronLight;
  context.beginPath();
  context.moveTo(-21, -77);
  context.bezierCurveTo(-26, -62, -23, -44, -26, -31);
  context.bezierCurveTo(-28, -21, -32, -10, -33, -4);
  context.bezierCurveTo(-28, -1, -23, 1, -19, 1);
  context.bezierCurveTo(-20, -26, -15, -58, -21, -77);
  context.closePath();
  context.fill();

  context.strokeStyle = KEEPER_STYLE.apronShadow;
  context.lineWidth = 5.5;
  context.beginPath();
  context.moveTo(-31, -62);
  context.bezierCurveTo(-14, -57, 12, -57, 32, -63);
  context.stroke();
  context.strokeStyle = KEEPER_STYLE.apronLight;
  context.lineWidth = 1.05;
  context.beginPath();
  context.moveTo(-29, -64);
  context.bezierCurveTo(-12, -60, 11, -60, 29, -65);
  context.stroke();

  context.strokeStyle = 'rgba(236, 207, 161, 0.3)';
  context.lineWidth = 1.15;
  context.beginPath();
  context.moveTo(-17, -53);
  context.bezierCurveTo(-22, -35, -21, -15, -25, 2);
  context.moveTo(0, -56);
  context.bezierCurveTo(-3, -35, -2, -15, -4, 5);
  context.moveTo(17, -54);
  context.bezierCurveTo(22, -34, 22, -15, 27, 2);
  context.stroke();

  context.fillStyle = KEEPER_STYLE.bristle;
  context.beginPath();
  context.moveTo(-22, -102);
  context.bezierCurveTo(-14, -106, -7, -105, 0, -100);
  context.bezierCurveTo(7, -106, 15, -106, 22, -102);
  context.bezierCurveTo(15, -95, 8, -89, 1, -87);
  context.bezierCurveTo(-6, -89, -15, -95, -22, -102);
  context.closePath();
  fillStroke(context, 1.4);
  context.fillStyle = KEEPER_STYLE.coatShadow;
  context.beginPath();
  context.moveTo(-15, -101);
  context.bezierCurveTo(-9, -103, -4, -102, 0, -98);
  context.bezierCurveTo(5, -102, 10, -103, 16, -101);
  context.bezierCurveTo(10, -96, 5, -92, 1, -90);
  context.bezierCurveTo(-4, -92, -10, -96, -15, -101);
  context.closePath();
  context.fill();

  context.fillStyle = WARM_BOUNCE;
  context.beginPath();
  context.moveTo(-56, -8);
  context.bezierCurveTo(-36, -1, -16, 8, 1, 7);
  context.bezierCurveTo(-18, 13, -41, 9, -59, 1);
  context.quadraticCurveTo(-60, -3, -56, -8);
  context.closePath();
  context.fill();
}

function drawKeeperArms(context, time, pose, { reducedMotion = false } = {}) {
  const motion = sampleKeeperMotion({ time, pose, reducedMotion });
  const leftWristX = -47 - motion.gloveLift * 0.08;
  const leftWristY = -26 - motion.gloveLift;
  context.fillStyle = KEEPER_STYLE.coatBase;
  context.beginPath();
  context.moveTo(-30, -100);
  context.bezierCurveTo(-45, -98, -51, -76, -50, -61);
  context.bezierCurveTo(-52, -50, leftWristX - 4, leftWristY - 8, leftWristX + 1, leftWristY - 5);
  context.bezierCurveTo(-41, -58, -33, -82, -30, -100);
  context.closePath();
  fillStroke(context, 1.85);
  context.fillStyle = KEEPER_STYLE.coatLight;
  context.beginPath();
  context.moveTo(-35, -92);
  context.bezierCurveTo(-46, -72, -49, -55, leftWristX - 2, leftWristY - 8);
  context.bezierCurveTo(leftWristX + 1, leftWristY - 6, leftWristX + 2, leftWristY - 5, leftWristX + 3, leftWristY - 4);
  context.bezierCurveTo(-42, -69, -37, -84, -35, -92);
  context.closePath();
  context.fill();
  drawKeeperGauntlet(context, leftWristX, leftWristY + 4);

  const rightHandX = 45 + motion.brushBob * 0.3;
  const rightHandY = -26 + motion.brushBob;
  context.fillStyle = KEEPER_STYLE.coatMid;
  context.beginPath();
  context.moveTo(29, -100);
  context.bezierCurveTo(44, -98, 50, -76, 49, -61);
  context.bezierCurveTo(51, -49, rightHandX + 5, rightHandY - 8, rightHandX + 6, rightHandY - 3);
  context.bezierCurveTo(rightHandX + 2, rightHandY + 2, rightHandX - 4, rightHandY + 2, rightHandX - 8, rightHandY - 3);
  context.bezierCurveTo(42, -58, 34, -81, 29, -100);
  context.closePath();
  fillStroke(context, 1.85);
  context.fillStyle = KEEPER_STYLE.coatShadow;
  context.beginPath();
  context.moveTo(35, -92);
  context.bezierCurveTo(46, -76, 48, -57, rightHandX + 2, rightHandY - 6);
  context.bezierCurveTo(47, -57, 39, -77, 35, -92);
  context.closePath();
  context.fill();
  context.strokeStyle = KEEPER_STYLE.apronMid;
  context.lineWidth = 2.7;
  context.beginPath();
  context.moveTo(rightHandX + 5, rightHandY - 4);
  context.bezierCurveTo(rightHandX + 1, rightHandY - 1, rightHandX - 4, rightHandY, rightHandX - 7, rightHandY - 3);
  context.stroke();
  drawHand(context, rightHandX, rightHandY + 7, KEEPER_STYLE.skin, 8);
}

function drawKeeperGauntlet(context, x, y) {
  context.fillStyle = KEEPER_STYLE.gauntletBase;
  context.beginPath();
  context.moveTo(x - 10, y - 11);
  context.bezierCurveTo(x - 7, y - 17, x + 6, y - 17, x + 10, y - 10);
  context.bezierCurveTo(x + 8, y - 4, x + 7, y + 3, x + 9, y + 10);
  context.bezierCurveTo(x + 5, y + 16, x - 5, y + 16, x - 9, y + 9);
  context.bezierCurveTo(x - 7, y + 2, x - 8, y - 5, x - 10, y - 11);
  context.closePath();
  fillStroke(context, 1.65);

  context.fillStyle = KEEPER_STYLE.gauntletShadow;
  context.beginPath();
  context.moveTo(x + 1, y - 15);
  context.bezierCurveTo(x + 8, y - 14, x + 10, y - 7, x + 8, y - 1);
  context.bezierCurveTo(x + 6, y + 4, x + 7, y + 10, x + 7, y + 12);
  context.bezierCurveTo(x + 2, y + 14, x, y + 10, x + 1, y - 15);
  context.closePath();
  context.fill();
  context.strokeStyle = KEEPER_STYLE.gauntletLight;
  context.lineWidth = 1.15;
  context.beginPath();
  context.moveTo(x - 7, y - 9);
  context.bezierCurveTo(x - 2, y - 14, x + 4, y - 13, x + 7, y - 9);
  context.moveTo(x - 8, y + 6);
  context.bezierCurveTo(x - 3, y + 10, x + 3, y + 10, x + 7, y + 7);
  context.stroke();
  context.strokeStyle = 'rgba(233, 190, 130, 0.34)';
  context.lineWidth = 0.8;
  context.beginPath();
  context.moveTo(x - 5, y - 4);
  context.quadraticCurveTo(x, y - 1, x + 5, y - 4);
  context.moveTo(x - 5, y + 1);
  context.quadraticCurveTo(x, y + 4, x + 5, y + 1);
  context.stroke();
}

function drawKeeperHead(context, blinking, time, pose, { reducedMotion = false } = {}) {
  const motion = sampleKeeperMotion({ time, pose, reducedMotion });
  context.save();
  context.translate(0, -140);
  context.rotate(motion.headTilt);
  context.translate(0, 140);

  drawKeeperEar(context, -35, -140, -1);
  drawKeeperEar(context, 36, -139, 1);

  context.fillStyle = KEEPER_STYLE.skin;
  context.beginPath();
  context.moveTo(-4, -181);
  context.bezierCurveTo(-24, -183, -36, -168, -35, -148);
  context.bezierCurveTo(-38, -127, -25, -106, -7, -99);
  context.bezierCurveTo(3, -95, 14, -99, 22, -108);
  context.bezierCurveTo(34, -121, 37, -140, 34, -154);
  context.bezierCurveTo(35, -171, 18, -183, -4, -181);
  context.closePath();
  fillStroke(context, 1.9);

  context.fillStyle = KEEPER_STYLE.skinShadow;
  context.globalAlpha = 0.3;
  context.beginPath();
  context.moveTo(5, -180);
  context.bezierCurveTo(25, -177, 35, -164, 33, -149);
  context.bezierCurveTo(35, -132, 28, -114, 20, -107);
  context.bezierCurveTo(14, -101, 7, -99, 3, -103);
  context.bezierCurveTo(11, -126, 11, -158, 5, -180);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;

  context.fillStyle = KEEPER_STYLE.skinLight;
  context.beginPath();
  context.moveTo(-27, -168);
  context.bezierCurveTo(-20, -179, -8, -182, 1, -177);
  context.bezierCurveTo(-10, -169, -15, -157, -16, -145);
  context.bezierCurveTo(-25, -146, -32, -158, -27, -168);
  context.closePath();
  context.fill();

  drawKeeperCheek(context, -24, -126, -1);
  drawKeeperCheek(context, 24, -125, 1);
  drawKeeperEyes(context, blinking, time, pose, motion);
  drawKeeperNose(context);
  drawKeeperMouth(context, pose, motion);
  drawKeeperFreckles(context);
  drawKeeperFrontHair(context, motion);

  context.restore();
}

function drawKeeperEar(context, x, y, side) {
  context.fillStyle = KEEPER_STYLE.skin;
  context.beginPath();
  context.moveTo(x - side * 2, y - 8);
  context.bezierCurveTo(x + side * 8, y - 10, x + side * 10, y + 4, x + side * 3, y + 10);
  context.bezierCurveTo(x - side * 5, y + 8, x - side * 7, y - 3, x - side * 2, y - 8);
  context.closePath();
  fillStroke(context, 1.55);
  context.strokeStyle = 'rgba(116, 62, 54, 0.36)';
  context.lineWidth = 1.05;
  context.beginPath();
  context.moveTo(x + side, y - 4);
  context.bezierCurveTo(x + side * 6, y - 2, x + side * 5, y + 5, x, y + 6);
  context.stroke();
}

function drawKeeperCheek(context, x, y, side) {
  context.fillStyle = KEEPER_STYLE.cheek;
  context.beginPath();
  context.moveTo(x - 8, y - 1);
  context.bezierCurveTo(x - 5, y - 5 - side, x + 5, y - 5 + side, x + 8, y);
  context.bezierCurveTo(x + 5, y + 4, x - 5, y + 5 + side, x - 8, y - 1);
  context.closePath();
  context.fill();
}

function drawKeeperEyes(context, blinking, time, pose, motion) {
  const gazeX = Math.sin(time * 0.64 + 3.2) * 1.15;
  const gazeY = Math.sin(time * 0.41 + 1.8) * 0.48;
  const eyes = [
    { x: -12.8, y: -145.2, side: -1, width: 6.8, height: 5 },
    { x: 12.5, y: -144.5, side: 1, width: 6.4, height: 4.7 },
  ];
  for (const eye of eyes) {
    if (blinking) {
      context.fillStyle = KEEPER_STYLE.skinShadow;
      context.globalAlpha = 0.4;
      context.beginPath();
      context.moveTo(eye.x - eye.width, eye.y + 0.2);
      context.bezierCurveTo(eye.x - 3, eye.y - 2, eye.x + 3, eye.y - 1.7, eye.x + eye.width, eye.y);
      context.bezierCurveTo(eye.x + 3, eye.y + 2.4, eye.x - 3, eye.y + 2.5, eye.x - eye.width, eye.y + 0.2);
      context.closePath();
      context.fill();
      context.globalAlpha = 1;
      context.strokeStyle = DEEP_OUTLINE;
      context.lineWidth = 1.45;
      context.beginPath();
      context.moveTo(eye.x - eye.width, eye.y + 0.2);
      context.bezierCurveTo(eye.x - 2.5, eye.y + 2.1, eye.x + 3, eye.y + 2.1, eye.x + eye.width, eye.y);
      context.stroke();
      continue;
    }

    context.fillStyle = '#f3e8d4';
    context.beginPath();
    context.moveTo(eye.x - eye.width, eye.y + 0.2);
    context.bezierCurveTo(eye.x - 3, eye.y - eye.height, eye.x + 3.2, eye.y - eye.height + eye.side * 0.2, eye.x + eye.width, eye.y - 0.25);
    context.bezierCurveTo(eye.x + 3, eye.y + eye.height * 0.72, eye.x - 3.2, eye.y + eye.height * 0.8, eye.x - eye.width, eye.y + 0.2);
    context.closePath();
    fillStroke(context, 1.35);

    const irisX = eye.x + gazeX;
    const irisY = eye.y + gazeY;
    context.fillStyle = KEEPER_STYLE.iris;
    context.beginPath();
    context.moveTo(irisX - 0.3, irisY - 3.7);
    context.bezierCurveTo(irisX + 3.2, irisY - 3.1, irisX + 3.5, irisY + 1.8, irisX + 0.2, irisY + 3.55);
    context.bezierCurveTo(irisX - 3.1, irisY + 2.9, irisX - 3.4, irisY - 2.4, irisX - 0.3, irisY - 3.7);
    context.closePath();
    context.fill();
    context.fillStyle = '#221a17';
    context.beginPath();
    context.moveTo(irisX, irisY - 2);
    context.bezierCurveTo(irisX + 1.65, irisY - 1.55, irisX + 1.75, irisY + 1.25, irisX + 0.1, irisY + 2);
    context.bezierCurveTo(irisX - 1.6, irisY + 1.5, irisX - 1.7, irisY - 1.3, irisX, irisY - 2);
    context.closePath();
    context.fill();
    context.fillStyle = 'rgba(255, 247, 220, 0.93)';
    context.beginPath();
    context.moveTo(irisX - 1.7, irisY - 2.2);
    context.quadraticCurveTo(irisX - 0.5, irisY - 2.9, irisX + 0.15, irisY - 1.75);
    context.quadraticCurveTo(irisX - 0.7, irisY - 0.7, irisX - 1.7, irisY - 2.2);
    context.closePath();
    context.fill();

    context.strokeStyle = 'rgba(72, 49, 43, 0.58)';
    context.lineWidth = 1.05;
    context.beginPath();
    context.moveTo(eye.x - eye.width, eye.y + 0.2);
    context.bezierCurveTo(eye.x - 3, eye.y - eye.height, eye.x + 3.2, eye.y - eye.height + eye.side * 0.2, eye.x + eye.width, eye.y - 0.25);
    context.stroke();
  }

  const proud = pose === 'proud';
  const leftLift = motion.browLift + (proud ? 0.7 : 0.2);
  const rightLift = motion.browLift * 0.6 - (proud ? 0.4 : 0);
  context.strokeStyle = KEEPER_STYLE.hairShadow;
  context.lineWidth = 2.3;
  context.beginPath();
  context.moveTo(-21, -157 - leftLift);
  context.bezierCurveTo(-16, -161.5 - leftLift, -10, -161.5 - leftLift, -6, -157 - leftLift * 0.8);
  context.moveTo(6, -157 - rightLift);
  context.bezierCurveTo(10, -160.5 - rightLift, 16, -160.5 - rightLift, 21, -156.5 - rightLift * 0.7);
  context.stroke();
}

function drawKeeperNose(context) {
  context.fillStyle = 'rgba(154, 88, 71, 0.2)';
  context.beginPath();
  context.moveTo(-1, -143);
  context.bezierCurveTo(-4, -136, -5, -128, -2, -124);
  context.bezierCurveTo(1, -121, 7, -123, 7, -127);
  context.bezierCurveTo(4, -132, 3, -140, -1, -143);
  context.closePath();
  context.fill();
  context.strokeStyle = 'rgba(104, 63, 55, 0.52)';
  context.lineWidth = 1.05;
  context.beginPath();
  context.moveTo(-1, -141);
  context.bezierCurveTo(-3, -133, -3, -126, 3, -125);
  context.quadraticCurveTo(6, -124, 7, -127);
  context.stroke();
  context.strokeStyle = KEEPER_STYLE.skinLight;
  context.lineWidth = 0.75;
  context.beginPath();
  context.moveTo(-1, -138);
  context.quadraticCurveTo(-2, -132, 0, -129);
  context.stroke();
}

function drawKeeperMouth(context, pose, motion) {
  const speaking = pose === 'speaking' || pose === 'talk';
  const y = -112.5;
  if (speaking) {
    context.fillStyle = '#804a50';
    context.beginPath();
    context.moveTo(-7.5, y);
    context.bezierCurveTo(-3, y - 2.4, 3.5, y - 2.2, 8, y + 0.2);
    context.bezierCurveTo(5, y + motion.mouthOpen, -3, y + motion.mouthOpen + 0.7, -7.5, y);
    context.closePath();
    fillStroke(context, 1.15);
    context.fillStyle = 'rgba(232, 144, 143, 0.62)';
    context.beginPath();
    context.moveTo(-4.5, y + motion.mouthOpen * 0.55);
    context.quadraticCurveTo(0, y + motion.mouthOpen + 0.5, 4.8, y + motion.mouthOpen * 0.52);
    context.quadraticCurveTo(0.4, y + motion.mouthOpen * 0.34, -4.5, y + motion.mouthOpen * 0.55);
    context.closePath();
    context.fill();
    return;
  }

  context.strokeStyle = '#805057';
  context.lineWidth = 1.8;
  context.beginPath();
  context.moveTo(-8, y + 0.5);
  if (pose === 'proud') context.bezierCurveTo(-3, y + 4.7, 4, y + 4.2, 9, y - 0.4);
  else context.bezierCurveTo(-3, y + 3.7, 3.5, y + 3.4, 8.5, y - 0.2);
  context.stroke();
  context.strokeStyle = 'rgba(255, 216, 193, 0.3)';
  context.lineWidth = 0.7;
  context.beginPath();
  context.moveTo(-5, y + 0.9);
  context.quadraticCurveTo(-1, y + 2.6, 3, y + 1.5);
  context.stroke();
}

function drawKeeperFreckles(context) {
  context.fillStyle = 'rgba(112, 63, 46, 0.52)';
  for (const [x, y, turn] of [
    [-24, -128, -1], [-19, -126, 1], [-14, -128, -1], [15, -127, 1], [20, -125, -1], [25, -128, 1],
  ]) {
    context.beginPath();
    context.moveTo(x - 1.1, y);
    context.bezierCurveTo(x - 0.5, y - 1.1, x + 1, y - 0.8 + turn * 0.15, x + 1.2, y + 0.2);
    context.bezierCurveTo(x + 0.5, y + 1, x - 0.8, y + 0.8, x - 1.1, y);
    context.closePath();
    context.fill();
  }
}

function drawKeeperFrontHair(context, motion) {
  context.fillStyle = KEEPER_STYLE.hairBase;
  context.beginPath();
  context.moveTo(-34, -151);
  context.bezierCurveTo(-38, -171, -24, -185, -8, -185);
  context.bezierCurveTo(7, -192, 26, -184, 32, -169);
  context.bezierCurveTo(37, -157, 33, -145, 28, -140);
  context.bezierCurveTo(24, -154, 17, -159, 10, -156);
  context.bezierCurveTo(3, -153, -2, -149, -9, -154);
  context.bezierCurveTo(-17, -159, -25, -158, -34, -151);
  context.closePath();
  fillStroke(context, 1.8);

  context.fillStyle = KEEPER_STYLE.hairShadow;
  context.beginPath();
  context.moveTo(4, -187);
  context.bezierCurveTo(20, -187, 32, -177, 33, -163);
  context.bezierCurveTo(36, -154, 32, -145, 28, -140);
  context.bezierCurveTo(23, -153, 17, -158, 10, -156);
  context.bezierCurveTo(14, -169, 11, -181, 4, -187);
  context.closePath();
  context.fill();

  context.fillStyle = KEEPER_STYLE.hairMid;
  context.beginPath();
  context.moveTo(-31, -158);
  context.bezierCurveTo(-30, -174, -17, -184, -4, -185);
  context.bezierCurveTo(-16, -179, -21, -168, -19, -157);
  context.bezierCurveTo(-24, -160, -28, -159, -31, -158);
  context.closePath();
  context.fill();

  context.fillStyle = KEEPER_STYLE.hairLight;
  context.globalAlpha = 0.5;
  context.beginPath();
  context.moveTo(-27, -169);
  context.bezierCurveTo(-20, -181, -7, -187, 2, -183);
  context.bezierCurveTo(-9, -178, -15, -168, -16, -157);
  context.bezierCurveTo(-24, -158, -31, -163, -27, -169);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;

  context.strokeStyle = KEEPER_STYLE.hairLight;
  context.lineWidth = 1.15;
  context.beginPath();
  context.moveTo(-28, -171);
  context.bezierCurveTo(-18, -185, -4, -187, 8, -182);
  context.moveTo(-25, -162);
  context.bezierCurveTo(-14, -176, 2, -181, 17, -174);
  context.moveTo(-15, -156);
  context.bezierCurveTo(-3, -166, 13, -170, 26, -160);
  context.stroke();

  for (const [x, y, turn] of [[-30, -154, -1], [-24, -146, 1], [27, -153, 1], [30, -145, -1]]) {
    drawKeeperCurl(context, x + motion.curlSway * turn * 0.35, y, turn);
  }
}

function drawKeeperCurl(context, x, y, turn) {
  context.fillStyle = turn < 0 ? KEEPER_STYLE.hairMid : KEEPER_STYLE.hairBase;
  context.beginPath();
  context.moveTo(x - 5, y - 4);
  context.bezierCurveTo(x - 2, y - 9, x + 6, y - 7, x + 7, y - 1);
  context.bezierCurveTo(x + 6, y + 5, x - 2, y + 7, x - 6, y + 1);
  context.bezierCurveTo(x - 7, y - 1, x - 6, y - 3, x - 5, y - 4);
  context.closePath();
  fillStroke(context, 0.95);
  context.strokeStyle = KEEPER_STYLE.hairLight;
  context.lineWidth = 0.65;
  context.beginPath();
  context.moveTo(x - 2, y - 4);
  context.quadraticCurveTo(x + 3, y - 6, x + 5, y - 1);
  context.stroke();
}

function drawKeeperAccessories(context, time, pose, { reducedMotion = false } = {}) {
  const motion = sampleKeeperMotion({ time, pose, reducedMotion });
  const sway = motion.pouchSway;

  context.strokeStyle = DEEP_OUTLINE;
  context.lineWidth = 7;
  context.beginPath();
  context.moveTo(-25, -97);
  context.bezierCurveTo(-5, -79, 15, -61, 34 + sway * 0.25, -38);
  context.stroke();
  context.strokeStyle = KEEPER_STYLE.pouchBase;
  context.lineWidth = 4.5;
  context.stroke();
  context.strokeStyle = KEEPER_STYLE.pouchLight;
  context.lineWidth = 0.85;
  context.beginPath();
  context.moveTo(-24, -98);
  context.bezierCurveTo(-5, -81, 15, -63, 33 + sway * 0.25, -40);
  context.stroke();

  const pouchX = 39 + sway * 0.45;
  const pouchY = -30;
  drawKeeperFeather(context, pouchX + 6, pouchY - 13, motion.curlSway * 0.012);
  context.fillStyle = KEEPER_STYLE.pouchBase;
  context.beginPath();
  context.moveTo(pouchX - 16, pouchY - 16);
  context.bezierCurveTo(pouchX - 7, pouchY - 21, pouchX + 10, pouchY - 20, pouchX + 16, pouchY - 13);
  context.bezierCurveTo(pouchX + 18, pouchY - 3, pouchX + 15, pouchY + 10, pouchX + 9, pouchY + 15);
  context.bezierCurveTo(pouchX - 2, pouchY + 19, pouchX - 13, pouchY + 14, pouchX - 17, pouchY + 5);
  context.bezierCurveTo(pouchX - 18, pouchY - 4, pouchX - 19, pouchY - 11, pouchX - 16, pouchY - 16);
  context.closePath();
  fillStroke(context, 1.65);
  context.fillStyle = KEEPER_STYLE.pouchShadow;
  context.beginPath();
  context.moveTo(pouchX + 1, pouchY - 18);
  context.bezierCurveTo(pouchX + 11, pouchY - 17, pouchX + 17, pouchY - 10, pouchX + 15, pouchY - 2);
  context.bezierCurveTo(pouchX + 15, pouchY + 7, pouchX + 11, pouchY + 13, pouchX + 7, pouchY + 15);
  context.bezierCurveTo(pouchX + 4, pouchY + 4, pouchX + 4, pouchY - 8, pouchX + 1, pouchY - 18);
  context.closePath();
  context.fill();
  context.fillStyle = KEEPER_STYLE.pouchLight;
  context.globalAlpha = 0.42;
  context.beginPath();
  context.moveTo(pouchX - 13, pouchY - 13);
  context.bezierCurveTo(pouchX - 7, pouchY - 18, pouchX + 1, pouchY - 17, pouchX + 4, pouchY - 13);
  context.bezierCurveTo(pouchX - 3, pouchY - 10, pouchX - 7, pouchY - 3, pouchX - 8, pouchY + 5);
  context.bezierCurveTo(pouchX - 14, pouchY + 1, pouchX - 16, pouchY - 7, pouchX - 13, pouchY - 13);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;
  context.strokeStyle = KEEPER_STYLE.gauntletLight;
  context.lineWidth = 1.05;
  context.beginPath();
  context.moveTo(pouchX - 13, pouchY - 9);
  context.bezierCurveTo(pouchX - 4, pouchY - 4, pouchX + 6, pouchY - 5, pouchX + 13, pouchY - 10);
  context.stroke();
  drawKeeperPawClasp(context, pouchX - 1, pouchY + 3);

  const handX = 45 + motion.brushBob * 0.3;
  const handY = -19 + motion.brushBob;
  drawKeeperBrush(context, handX, handY, motion.brushTilt);
}

function drawKeeperFeather(context, x, y, rotation) {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.fillStyle = KEEPER_STYLE.featherBase;
  context.beginPath();
  context.moveTo(0, 5);
  context.bezierCurveTo(-8, -3, -9, -17, -2, -28);
  context.bezierCurveTo(5, -19, 8, -6, 0, 5);
  context.closePath();
  fillStroke(context, 1.05);
  context.fillStyle = KEEPER_STYLE.featherLight;
  context.globalAlpha = 0.5;
  context.beginPath();
  context.moveTo(-1, 2);
  context.bezierCurveTo(-5, -7, -5, -17, -2, -24);
  context.bezierCurveTo(0, -15, 1, -6, -1, 2);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;
  context.strokeStyle = KEEPER_STYLE.featherLight;
  context.lineWidth = 0.8;
  context.beginPath();
  context.moveTo(0, 7);
  context.bezierCurveTo(-1, -5, -1, -17, -2, -27);
  context.moveTo(-1, -7);
  context.quadraticCurveTo(-5, -11, -7, -13);
  context.moveTo(-1, -13);
  context.quadraticCurveTo(3, -16, 5, -19);
  context.stroke();
  context.restore();
}

function drawKeeperPawClasp(context, x, y) {
  context.fillStyle = KEEPER_STYLE.gauntletLight;
  context.beginPath();
  context.moveTo(x - 5, y + 1);
  context.bezierCurveTo(x - 4, y - 4, x + 3, y - 5, x + 5, y);
  context.bezierCurveTo(x + 5, y + 5, x - 3, y + 6, x - 5, y + 1);
  context.closePath();
  context.fill();
  for (const [dx, dy, turn] of [[-5, -5, -1], [0, -7, 1], [5, -5, -1]]) {
    context.beginPath();
    context.moveTo(x + dx - 2, y + dy);
    context.bezierCurveTo(x + dx - 1, y + dy - 3, x + dx + 2, y + dy - 3 + turn * 0.15, x + dx + 2, y + dy);
    context.bezierCurveTo(x + dx + 1, y + dy + 2, x + dx - 1, y + dy + 2, x + dx - 2, y + dy);
    context.closePath();
    context.fill();
  }
  context.strokeStyle = KEEPER_STYLE.pouchShadow;
  context.lineWidth = 0.7;
  context.beginPath();
  context.moveTo(x - 5, y + 1);
  context.bezierCurveTo(x - 4, y - 4, x + 3, y - 5, x + 5, y);
  context.stroke();
}

function drawKeeperBrush(context, x, y, rotation) {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.fillStyle = KEEPER_STYLE.brushWood;
  context.beginPath();
  context.moveTo(-3, 5);
  context.bezierCurveTo(-2, -8, -1, -24, -3, -38);
  context.bezierCurveTo(-1, -43, 5, -43, 7, -38);
  context.bezierCurveTo(5, -23, 5, -7, 4, 6);
  context.bezierCurveTo(2, 10, -1, 9, -3, 5);
  context.closePath();
  fillStroke(context, 1.35);
  context.fillStyle = KEEPER_STYLE.brushLight;
  context.beginPath();
  context.moveTo(0, 2);
  context.bezierCurveTo(1, -10, 2, -25, 1, -37);
  context.bezierCurveTo(3, -39, 5, -39, 5, -36);
  context.bezierCurveTo(4, -22, 4, -7, 3, 3);
  context.bezierCurveTo(2, 5, 1, 5, 0, 2);
  context.closePath();
  context.fill();

  context.fillStyle = KEEPER_STYLE.bristle;
  context.beginPath();
  context.moveTo(-12, -39);
  context.bezierCurveTo(-8, -48, 10, -51, 15, -42);
  context.bezierCurveTo(17, -35, 11, -30, 2, -29);
  context.bezierCurveTo(-8, -29, -14, -33, -12, -39);
  context.closePath();
  fillStroke(context, 1.4);
  context.fillStyle = KEEPER_STYLE.bristleShadow;
  context.beginPath();
  context.moveTo(3, -48);
  context.bezierCurveTo(11, -48, 16, -44, 15, -39);
  context.bezierCurveTo(14, -34, 9, -31, 3, -30);
  context.bezierCurveTo(7, -36, 7, -42, 3, -48);
  context.closePath();
  context.fill();
  context.strokeStyle = 'rgba(248, 227, 181, 0.42)';
  context.lineWidth = 0.8;
  context.beginPath();
  for (const offset of [-8, -3, 2, 7, 12]) {
    context.moveTo(offset, -42 + Math.abs(offset) * 0.08);
    context.bezierCurveTo(offset - 1, -38, offset - 1, -34, offset - 2, -31);
  }
  context.stroke();
  context.restore();
}

function drawCat(context, time, motion, lightDirection = -1) {
  drawCatTail(context, motion);
  drawCatHindquarters(context, motion);
  drawCatBody(context, motion, lightDirection);
  drawCatForelegs(context, motion, lightDirection);
  drawCatPaws(context, motion);

  context.save();
  context.translate(0, motion.headNod);
  context.rotate(motion.headTilt);
  drawCatHead(context, time, motion, lightDirection);
  context.restore();
  drawCatCollar(context);

  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.strokeStyle = CAT_STYLE.rim;
  context.lineWidth = 2.25;
  context.beginPath();
  context.moveTo(-24, -44);
  context.bezierCurveTo(-29, -58, -27, -70, -20, -79);
  context.moveTo(-23, -78 + motion.headNod);
  context.bezierCurveTo(-19, -96, -8, -104, 5, -101);
  context.stroke();
  context.restore();
}

function drawCatTail(context, motion) {
  const sway = motion.tailSway;
  context.strokeStyle = OUTLINE;
  context.lineWidth = 10;
  context.beginPath();
  context.moveTo(18, -28);
  context.bezierCurveTo(45, -31, 49 + sway * 13, -58, 34 + sway * 9, -76);
  context.bezierCurveTo(29 + sway * 8, -82, 21 + sway * 5, -80, 20 + sway * 4, -73);
  context.stroke();
  context.strokeStyle = CAT_STYLE.furShadow;
  context.lineWidth = 6.6;
  context.stroke();
  context.strokeStyle = CAT_STYLE.furMid;
  context.lineWidth = 3.6;
  context.beginPath();
  context.moveTo(19, -29);
  context.bezierCurveTo(43, -35, 45 + sway * 12, -57, 32 + sway * 8, -75);
  context.stroke();
  context.strokeStyle = 'rgba(74, 48, 40, 0.58)';
  context.lineWidth = 1.55;
  for (let index = 0; index < 4; index += 1) {
    const y = -43 - index * 8;
    context.beginPath();
    context.moveTo(37 + sway * 5, y + 4);
    context.bezierCurveTo(42 + sway * 8, y + 1, 43 + sway * 8, y - 3, 41 + sway * 7, y - 6);
    context.stroke();
  }
}

function drawCatHindquarters(context, motion) {
  const rearX = -18 - motion.step * 2.2;
  const rearLift = motion.hindLift * 14;
  context.fillStyle = CAT_STYLE.furShadow;
  context.beginPath();
  context.moveTo(-21, -48);
  context.bezierCurveTo(-38, -43, -40, -21, -31, -8);
  context.bezierCurveTo(-28, -3 - rearLift, rearX - 9, 2 - rearLift, rearX - 1, 2 - rearLift);
  context.bezierCurveTo(rearX + 6, 1 - rearLift, rearX + 8, -4 - rearLift, rearX + 4, -9);
  context.bezierCurveTo(-11, -20, -8, -36, -21, -48);
  context.closePath();
  fillStroke(context, 1.75);
  context.fillStyle = CAT_STYLE.furMid;
  context.beginPath();
  context.moveTo(-29, -36);
  context.bezierCurveTo(-35, -25, -32, -11, -24, -7);
  context.bezierCurveTo(-21, -4, -17, -4, -15, -8);
  context.bezierCurveTo(-21, -17, -19, -29, -29, -36);
  context.closePath();
  context.fill();
}

function drawCatBody(context, motion, lightDirection = -1) {
  context.fillStyle = CAT_STYLE.furBase;
  context.beginPath();
  context.moveTo(-13, -65);
  context.bezierCurveTo(-28, -62, -34, -46, -30, -28);
  context.bezierCurveTo(-28, -12, -19, -3, -4, -4);
  context.bezierCurveTo(8, -1, 25, -6, 28, -23);
  context.bezierCurveTo(32, -40, 23, -59, 11, -65);
  context.bezierCurveTo(2, -70, -4, -67, -13, -65);
  context.closePath();
  fillStroke(context, 2.05);

  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.fillStyle = CAT_STYLE.furShadow;
  context.beginPath();
  context.moveTo(7, -66);
  context.bezierCurveTo(25, -58, 32, -40, 27, -22);
  context.bezierCurveTo(23, -8, 12, -3, 3, -4);
  context.bezierCurveTo(12, -18, 14, -47, 7, -66);
  context.closePath();
  context.fill();

  context.fillStyle = CAT_STYLE.furMid;
  context.beginPath();
  context.moveTo(-17, -60);
  context.bezierCurveTo(-28, -50, -28, -33, -23, -23);
  context.bezierCurveTo(-19, -16, -12, -17, -10, -25);
  context.bezierCurveTo(-7, -40, -9, -53, -17, -60);
  context.closePath();
  context.fill();
  context.restore();

  context.fillStyle = CAT_STYLE.chest;
  context.beginPath();
  context.moveTo(-11, -60);
  context.bezierCurveTo(-7, -55, -5, -50, -2, -54);
  context.bezierCurveTo(1, -49, 5, -50, 9, -57);
  context.bezierCurveTo(13, -43, 10, -28, 5, -15);
  context.bezierCurveTo(2, -10, -1, -13, -2, -18);
  context.bezierCurveTo(-5, -12, -9, -14, -10, -21);
  context.bezierCurveTo(-14, -33, -16, -47, -11, -60);
  context.closePath();
  context.fill();

  context.strokeStyle = 'rgba(86, 57, 46, 0.42)';
  context.lineWidth = 1.3;
  context.beginPath();
  context.moveTo(-17, -50);
  context.bezierCurveTo(-11, -46, -8, -43, -6, -37);
  context.moveTo(18, -54);
  context.bezierCurveTo(12, -46, 13, -39, 20, -34);
  context.moveTo(21, -44);
  context.bezierCurveTo(14, -37, 15, -30, 23, -26);
  context.stroke();
}

function drawCatForelegs(context, motion, lightDirection = -1) {
  const leftLift = motion.hindLift * 8;
  context.fillStyle = lightDirection < 0 ? CAT_STYLE.furMid : CAT_STYLE.furShadow;
  context.beginPath();
  context.moveTo(-12, -36);
  context.bezierCurveTo(-20, -27, -21, -12, -18 - motion.step * 1.2, -3 - leftLift);
  context.bezierCurveTo(-13, 2 - leftLift, -6, 1 - leftLift, -5, -5 - leftLift);
  context.bezierCurveTo(-7, -18, -5, -29, -12, -36);
  context.closePath();
  fillStroke(context, 1.6);

  if (motion.pawLift > 0) return;
  const rightLift = motion.foreLift * 15;
  context.fillStyle = lightDirection > 0 ? CAT_STYLE.furMid : CAT_STYLE.furBase;
  context.beginPath();
  context.moveTo(7, -37);
  context.bezierCurveTo(16, -27, 17, -12, 18 + motion.step * 1.5, -3 - rightLift);
  context.bezierCurveTo(14, 2 - rightLift, 7, 1 - rightLift, 6, -5 - rightLift);
  context.bezierCurveTo(8, -17, 3, -29, 7, -37);
  context.closePath();
  fillStroke(context, 1.6);
}

function drawCatCollar(context) {
  context.fillStyle = CAT_STYLE.collar;
  context.beginPath();
  context.moveTo(-20, -53);
  context.bezierCurveTo(-8, -48, 8, -48, 21, -54);
  context.bezierCurveTo(21, -50, 20, -46, 17, -43);
  context.bezierCurveTo(7, -39, -8, -39, -18, -44);
  context.bezierCurveTo(-20, -47, -21, -50, -20, -53);
  context.closePath();
  fillStroke(context, 1.7);
  context.fillStyle = CAT_STYLE.brass;
  traceOrganicPatch(context, 0, -41, 4.5, 4.1, 0.18);
  fillStroke(context, 1.15);
  context.strokeStyle = 'rgba(255, 238, 174, 0.65)';
  context.lineWidth = 0.9;
  context.beginPath();
  context.moveTo(-1.8, -43.2);
  context.bezierCurveTo(-0.5, -44.2, 1.2, -43.7, 2.1, -42.5);
  context.stroke();
}

function drawCatHead(context, time, motion, lightDirection = -1) {
  const twitch = motion.earTwitch;
  drawCatEar(context, -1, twitch, lightDirection);
  drawCatEar(context, 1, -twitch * 0.65, lightDirection);

  context.fillStyle = CAT_STYLE.furBase;
  context.beginPath();
  context.moveTo(-2, -96);
  context.bezierCurveTo(-20, -98, -30, -87, -30, -70);
  context.bezierCurveTo(-31, -57, -23, -47, -10, -44);
  context.bezierCurveTo(-3, -40, 5, -41, 12, -44);
  context.bezierCurveTo(25, -47, 31, -58, 29, -72);
  context.bezierCurveTo(28, -88, 17, -98, -2, -96);
  context.closePath();
  fillStroke(context, 2.05);

  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.fillStyle = CAT_STYLE.furShadow;
  context.beginPath();
  context.moveTo(5, -96);
  context.bezierCurveTo(21, -93, 29, -83, 29, -70);
  context.bezierCurveTo(30, -56, 22, -47, 11, -44);
  context.bezierCurveTo(15, -60, 13, -82, 5, -96);
  context.closePath();
  context.fill();

  context.fillStyle = CAT_STYLE.furLight;
  context.beginPath();
  context.moveTo(-16, -91);
  context.bezierCurveTo(-22, -84, -24, -72, -20, -62);
  context.bezierCurveTo(-17, -56, -13, -58, -11, -65);
  context.bezierCurveTo(-8, -76, -9, -86, -16, -91);
  context.closePath();
  context.fill();
  context.restore();

  drawCatFace(context, time, motion);
  drawCatFurMarks(context, lightDirection);
}

function drawCatEar(context, side, twitch, lightDirection = -1) {
  const innerX = side * 7;
  const outerX = side * (25 + twitch * 1.2);
  const tipY = -108 - Math.abs(twitch) * 1.5;
  context.fillStyle = side === lightDirection ? CAT_STYLE.furMid : CAT_STYLE.furShadow;
  context.beginPath();
  context.moveTo(side * 4, -82);
  context.bezierCurveTo(side * 8, -91, side * 14, -103, outerX, tipY);
  context.bezierCurveTo(side * 27, -95, side * 27, -84, side * 21, -76);
  context.bezierCurveTo(side * 15, -75, side * 8, -77, side * 4, -82);
  context.closePath();
  fillStroke(context, 1.75);
  context.fillStyle = CAT_STYLE.ear;
  context.beginPath();
  context.moveTo(innerX, -83);
  context.bezierCurveTo(side * 12, -92, side * 16, -99, side * (22 + twitch * 0.8), tipY + 2);
  context.bezierCurveTo(side * 22, -91, side * 21, -84, side * 18, -79);
  context.bezierCurveTo(side * 14, -78, side * 10, -79, innerX, -83);
  context.closePath();
  context.fill();
  context.strokeStyle = side === lightDirection ? CAT_STYLE.rim : 'rgba(71, 47, 40, 0.35)';
  context.lineWidth = 1.25;
  context.beginPath();
  context.moveTo(innerX, -86);
  context.bezierCurveTo(side * 12, -96, side * 17, -103, outerX, tipY);
  context.stroke();
}

function drawCatFace(context, time, motion) {
  const blink = isBlinking(time, 0.8);
  drawCompanionEye(context, {
    x: -10,
    y: -70,
    width: 7.7,
    height: 6.3,
    gazeX: motion.eyeFocusX,
    gazeY: motion.eyeFocusY,
    iris: CAT_STYLE.iris,
    pupil: CAT_STYLE.pupil,
    eyeWhite: CAT_STYLE.eyeWhite,
    catchlight: CAT_STYLE.catchlight,
    lid: CAT_STYLE.furDeep,
    blinking: blink,
    turn: -0.13,
  });
  drawCompanionEye(context, {
    x: 10,
    y: -70.5,
    width: 7.5,
    height: 6.2,
    gazeX: motion.eyeFocusX,
    gazeY: motion.eyeFocusY,
    iris: CAT_STYLE.iris,
    pupil: CAT_STYLE.pupil,
    eyeWhite: CAT_STYLE.eyeWhite,
    catchlight: CAT_STYLE.catchlight,
    lid: CAT_STYLE.furDeep,
    blinking: blink,
    turn: 0.12,
  });

  context.strokeStyle = CAT_STYLE.furDeep;
  context.lineWidth = 2.2;
  context.beginPath();
  context.moveTo(-19, -80);
  context.bezierCurveTo(-15, -84, -10, -84, -5, -80.5);
  context.moveTo(5, -80.5);
  context.bezierCurveTo(10, -84, 15, -83.5, 19, -79.5);
  context.stroke();

  context.fillStyle = CAT_STYLE.muzzle;
  traceOrganicPatch(context, -7.5, -56, 10.4, 8, -0.15);
  context.fill();
  traceOrganicPatch(context, 7.5, -56, 10.2, 7.7, 0.14);
  context.fill();

  context.fillStyle = CAT_STYLE.nose;
  context.beginPath();
  context.moveTo(-4.2, -61);
  context.bezierCurveTo(-1.8, -63.2, 2.5, -63, 4.4, -60.5);
  context.bezierCurveTo(3.2, -56.8, 0.8, -55.2, -0.2, -55.1);
  context.bezierCurveTo(-1.8, -55.8, -3.6, -57.7, -4.2, -61);
  context.closePath();
  fillStroke(context, 1.05);

  context.strokeStyle = CAT_STYLE.furDeep;
  context.lineWidth = 1.4;
  context.beginPath();
  context.moveTo(0, -55.5);
  context.bezierCurveTo(-0.4, -51.6, -3.3, -49.3, -7.3, -49.8);
  context.moveTo(0, -55.5);
  context.bezierCurveTo(0.6, -51.7, 3.7, -49.3, 7.6, -50.2);
  context.stroke();

  context.fillStyle = 'rgba(76, 48, 41, 0.44)';
  for (const [x, y, turn] of [[-13, -57, -0.1], [-9, -53, 0.2], [9, -53.5, -0.16], [13, -57, 0.13]]) {
    traceOrganicPatch(context, x, y, 0.85, 0.72, turn);
    context.fill();
  }
  context.strokeStyle = CAT_STYLE.furDeep;
  context.lineWidth = 1.1;
  context.beginPath();
  context.moveTo(-6, -57);
  context.bezierCurveTo(-13, -56, -19, -52, -23, -48);
  context.moveTo(-6, -53.5);
  context.bezierCurveTo(-14, -51.5, -20, -47, -24, -42.5);
  context.moveTo(6, -57);
  context.bezierCurveTo(13, -56, 19, -52, 23, -48.5);
  context.moveTo(6, -53.5);
  context.bezierCurveTo(14, -51.2, 20, -47, 24, -42.8);
  context.stroke();
}

function drawCatFurMarks(context, lightDirection = -1) {
  context.strokeStyle = CAT_STYLE.furDeep;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-12, -91);
  context.bezierCurveTo(-9, -85, -7, -82, -4, -79);
  context.moveTo(-1, -96);
  context.bezierCurveTo(-1, -88, 0, -83, 1, -79);
  context.moveTo(11, -91);
  context.bezierCurveTo(8, -85, 6, -82, 4, -79);
  context.stroke();
  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.strokeStyle = 'rgba(255, 231, 178, 0.46)';
  context.lineWidth = 1.3;
  context.beginPath();
  context.moveTo(-23, -83);
  context.bezierCurveTo(-18, -91, -10, -96, -2, -96);
  context.moveTo(-22, -62);
  context.bezierCurveTo(-18, -55, -15, -51, -10, -49);
  context.stroke();
  context.restore();
}

function drawCatPaws(context, motion) {
  context.fillStyle = CAT_STYLE.furLight;
  traceOrganicPatch(context, -14 - motion.step * 0.8, -1 - motion.hindLift * 7, 12, 6.2, -0.14);
  fillStroke(context, 1.75);

  if (motion.pawLift <= 0) {
    traceOrganicPatch(context, 14 + motion.step, -1 - motion.foreLift * 12, 11.8, 6, 0.16);
    fillStroke(context, 1.75);
    context.strokeStyle = 'rgba(91, 59, 48, 0.48)';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(11, -3 - motion.foreLift * 12);
    context.bezierCurveTo(12, -0.5 - motion.foreLift * 12, 12, 1 - motion.foreLift * 12, 10, 3 - motion.foreLift * 12);
    context.moveTo(17, -3 - motion.foreLift * 12);
    context.bezierCurveTo(18, -0.5 - motion.foreLift * 12, 18, 1 - motion.foreLift * 12, 16, 3 - motion.foreLift * 12);
    context.stroke();
    return;
  }

  const pawY = -12 - motion.pawLift * 49;
  context.fillStyle = CAT_STYLE.furMid;
  context.beginPath();
  context.moveTo(7, -31);
  context.bezierCurveTo(12, -35, 15, pawY + 18, 22, pawY + 10);
  context.bezierCurveTo(27, pawY + 2, 35, pawY - 1, 40, pawY + 3);
  context.bezierCurveTo(45, pawY + 8, 42, pawY + 15, 36, pawY + 16);
  context.bezierCurveTo(32, pawY + 20, 27, pawY + 17, 25, pawY + 14);
  context.bezierCurveTo(20, pawY + 22, 18, -23, 14, -10);
  context.bezierCurveTo(9, -10, 6, -21, 7, -31);
  context.closePath();
  fillStroke(context, 1.85);
  context.fillStyle = CAT_STYLE.furLight;
  context.beginPath();
  context.moveTo(27, pawY + 8);
  context.bezierCurveTo(31, pawY + 3, 37, pawY + 2, 40, pawY + 6);
  context.bezierCurveTo(41, pawY + 11, 36, pawY + 15, 30, pawY + 14);
  context.bezierCurveTo(27, pawY + 13, 26, pawY + 10, 27, pawY + 8);
  context.closePath();
  context.fill();
  context.strokeStyle = 'rgba(82, 52, 44, 0.54)';
  context.lineWidth = 1.05;
  context.beginPath();
  context.moveTo(32, pawY + 4);
  context.bezierCurveTo(34, pawY + 7, 33, pawY + 11, 31, pawY + 13);
  context.moveTo(38, pawY + 4.5);
  context.bezierCurveTo(40, pawY + 8, 38, pawY + 12, 35.5, pawY + 14);
  context.stroke();
}

function drawToad(context, time, motion, lightDirection = -1) {
  drawToadHindLeg(context, -1, motion, lightDirection);
  drawToadHindLeg(context, 1, motion, lightDirection);
  drawToadBody(context, motion, lightDirection);
  drawToadEyeTurret(context, -1, motion, lightDirection);
  drawToadEyeTurret(context, 1, motion, lightDirection);
  drawToadFace(context, time, motion);
  drawToadSkinDetail(context, motion);
  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.strokeStyle = TOAD_STYLE.rim;
  context.lineWidth = 2.15;
  context.beginPath();
  context.moveTo(-34, -24);
  context.bezierCurveTo(-31, -39, -23, -52, -13, -56);
  context.bezierCurveTo(-8, -61, -1, -62, 5, -59);
  context.stroke();
  context.restore();
}

function drawToadHindLeg(context, side, motion, lightDirection = -1) {
  const step = motion.step * 2.4;
  const lift = (side < 0 ? motion.hindLift : motion.foreLift) * 9;
  const outer = side * (43 + step);
  context.fillStyle = side === lightDirection ? TOAD_STYLE.skinMid : TOAD_STYLE.skinShadow;
  context.beginPath();
  context.moveTo(side * 7, -28);
  context.bezierCurveTo(side * 21, -25, side * 28, -15, outer, -8 - lift);
  context.bezierCurveTo(side * 51, -5 - lift, side * 52, 1 - lift, side * 43, 3 - lift);
  context.bezierCurveTo(side * 32, 7 - lift, side * 22, 1 - lift, side * 13, -5);
  context.bezierCurveTo(side * 5, -10, side * 3, -20, side * 7, -28);
  context.closePath();
  fillStroke(context, 1.8);

  context.strokeStyle = TOAD_STYLE.skinDeep;
  context.lineWidth = 1.7;
  context.beginPath();
  for (let toe = -1; toe <= 1; toe += 1) {
    const startX = side * (39 + step) + toe * 1.2;
    context.moveTo(startX, -1 - lift);
    context.bezierCurveTo(
      startX + side * 5,
      1 - lift,
      startX + side * (9 + Math.abs(toe)),
      3 + Math.abs(toe) - lift,
      startX + side * (13 + toe * 1.5),
      2 + Math.abs(toe) - lift,
    );
  }
  context.stroke();
}

function drawToadBody(context, motion, lightDirection = -1) {
  context.fillStyle = TOAD_STYLE.skinBase;
  context.beginPath();
  context.moveTo(-3, -57);
  context.bezierCurveTo(-24, -59, -38, -43, -37, -24);
  context.bezierCurveTo(-39, -8, -25, 2, -6, 1);
  context.bezierCurveTo(10, 5, 31, -2, 36, -19);
  context.bezierCurveTo(41, -36, 27, -55, 8, -57);
  context.bezierCurveTo(4, -59, 0, -59, -3, -57);
  context.closePath();
  fillStroke(context, 2.05);

  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.fillStyle = TOAD_STYLE.skinShadow;
  context.beginPath();
  context.moveTo(7, -57);
  context.bezierCurveTo(28, -52, 40, -35, 36, -19);
  context.bezierCurveTo(31, -3, 17, 3, 5, 1);
  context.bezierCurveTo(13, -14, 15, -39, 7, -57);
  context.closePath();
  context.fill();

  context.fillStyle = TOAD_STYLE.skinMid;
  context.beginPath();
  context.moveTo(-24, -48);
  context.bezierCurveTo(-34, -38, -35, -22, -28, -12);
  context.bezierCurveTo(-24, -7, -19, -9, -17, -16);
  context.bezierCurveTo(-13, -29, -15, -42, -24, -48);
  context.closePath();
  context.fill();
  context.restore();

  const throatWidth = 19 + motion.throatPulse * 2.2;
  const throatHeight = 12 + motion.throatPulse * 2.8;
  context.fillStyle = TOAD_STYLE.belly;
  traceOrganicPatch(context, 0, -17, throatWidth, throatHeight, -0.12);
  context.fill();
  context.fillStyle = TOAD_STYLE.bellyLight;
  context.beginPath();
  context.moveTo(-13, -23);
  context.bezierCurveTo(-8, -29, 2, -31, 10, -25);
  context.bezierCurveTo(5, -22, -3, -21, -13, -23);
  context.closePath();
  context.fill();
}

function drawToadEyeTurret(context, side, motion, lightDirection = -1) {
  const x = side * 15;
  const y = -51 + motion.headNod * 0.25;
  context.fillStyle = side === lightDirection ? TOAD_STYLE.skinLight : TOAD_STYLE.skinMid;
  traceOrganicPatch(context, x, y, 12.2, 11.6, side * 0.12);
  fillStroke(context, 1.75);
  context.fillStyle = TOAD_STYLE.skinShadow;
  context.beginPath();
  context.moveTo(x + side * 1, y - 10);
  context.bezierCurveTo(x + side * 10, y - 7, x + side * 12, y + 2, x + side * 7, y + 8);
  context.bezierCurveTo(x + side * 4, y + 5, x + side * 2, y - 3, x + side * 1, y - 10);
  context.closePath();
  context.fill();
}

function drawToadFace(context, time, motion) {
  const blink = isBlinking(time, 2.1);
  drawCompanionEye(context, {
    x: -15,
    y: -52 + motion.headNod * 0.25,
    width: 7.3,
    height: 6.8,
    gazeX: motion.eyeFocusX * 0.78,
    gazeY: motion.eyeFocusY,
    iris: TOAD_STYLE.iris,
    pupil: TOAD_STYLE.pupil,
    eyeWhite: TOAD_STYLE.eyeWhite,
    catchlight: TOAD_STYLE.catchlight,
    lid: TOAD_STYLE.skinDeep,
    blinking: blink,
    turn: -0.12,
  });
  drawCompanionEye(context, {
    x: 15,
    y: -52.5 + motion.headNod * 0.25,
    width: 7.1,
    height: 6.6,
    gazeX: motion.eyeFocusX * 0.78,
    gazeY: motion.eyeFocusY,
    iris: TOAD_STYLE.iris,
    pupil: TOAD_STYLE.pupil,
    eyeWhite: TOAD_STYLE.eyeWhite,
    catchlight: TOAD_STYLE.catchlight,
    lid: TOAD_STYLE.skinDeep,
    blinking: blink,
    turn: 0.14,
  });

  context.strokeStyle = TOAD_STYLE.skinDeep;
  context.lineWidth = 1.15;
  context.beginPath();
  context.moveTo(-8, -38);
  context.bezierCurveTo(-6, -40, -4, -40, -2, -38.5);
  context.moveTo(2, -38.5);
  context.bezierCurveTo(4, -40, 6, -39.8, 8, -38);
  context.stroke();

  context.strokeStyle = TOAD_STYLE.mouth;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-13, -29);
  context.bezierCurveTo(-6, -25, 2, -24, 11, -29.5);
  context.stroke();
  context.strokeStyle = 'rgba(235, 223, 157, 0.35)';
  context.lineWidth = 0.9;
  context.beginPath();
  context.moveTo(-9, -29);
  context.bezierCurveTo(-3, -27, 3, -27, 8, -30);
  context.stroke();
}

function drawToadSkinDetail(context, motion) {
  context.fillStyle = 'rgba(224, 211, 129, 0.38)';
  for (const [x, y, rx, ry, turn] of [
    [-12, -27, 4.1, 3.1, -0.15],
    [16, -20, 3.3, 2.5, 0.18],
    [2, -35, 2.6, 2.1, -0.11],
    [-25, -34, 3, 2.4, 0.16],
    [25, -31, 2.4, 2, -0.2],
  ]) {
    traceOrganicPatch(context, x, y, rx, ry, turn);
    context.fill();
  }
  context.fillStyle = 'rgba(43, 61, 38, 0.42)';
  for (const [x, y, rx, ry, turn] of [
    [-20, -17, 2.8, 2.2, 0.14],
    [20, -37, 2.4, 1.9, -0.17],
    [9, -9, 2, 1.6, 0.1],
    [-5, -42, 1.8, 1.5, -0.12],
  ]) {
    traceOrganicPatch(context, x, y, rx, ry, turn);
    context.fill();
  }

  context.strokeStyle = 'rgba(43, 59, 37, 0.46)';
  context.lineWidth = 1.1;
  context.beginPath();
  context.moveTo(-31, -19);
  context.bezierCurveTo(-23, -15, -18, -10, -14, -5 - motion.hindLift * 3);
  context.moveTo(30, -20);
  context.bezierCurveTo(23, -15, 18, -10, 14, -5 - motion.foreLift * 3);
  context.moveTo(-8, -5);
  context.bezierCurveTo(-3, -2, 3, -2, 8, -5);
  context.stroke();
}

function drawCompanionEye(context, {
  x,
  y,
  width,
  height,
  gazeX,
  gazeY,
  iris,
  pupil,
  eyeWhite,
  catchlight,
  lid,
  blinking,
  turn,
}) {
  if (blinking) {
    context.fillStyle = lid;
    traceOrganicPatch(context, x, y, width, Math.max(1.6, height * 0.28), turn);
    context.fill();
    context.strokeStyle = OUTLINE;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x - width, y);
    context.bezierCurveTo(x - width * 0.36, y + 2.3, x + width * 0.4, y + 2.1, x + width, y - 0.2);
    context.stroke();
    return;
  }

  context.fillStyle = eyeWhite;
  context.beginPath();
  context.moveTo(x - width, y + turn * height);
  context.bezierCurveTo(x - width * 0.46, y - height, x + width * 0.37, y - height * 0.92, x + width, y - turn * height * 0.4);
  context.bezierCurveTo(x + width * 0.42, y + height * 0.82, x - width * 0.45, y + height * 0.94, x - width, y + turn * height);
  context.closePath();
  fillStroke(context, 1.45);

  const irisX = x + gazeX;
  const irisY = y + gazeY;
  context.fillStyle = iris;
  traceOrganicPatch(context, irisX, irisY, width * 0.5, height * 0.66, -turn * 0.7);
  context.fill();
  context.fillStyle = pupil;
  context.beginPath();
  context.moveTo(irisX - width * 0.1, irisY - height * 0.48);
  context.bezierCurveTo(irisX + width * 0.17, irisY - height * 0.28, irisX + width * 0.15, irisY + height * 0.3, irisX + width * 0.02, irisY + height * 0.5);
  context.bezierCurveTo(irisX - width * 0.17, irisY + height * 0.28, irisX - width * 0.16, irisY - height * 0.3, irisX - width * 0.1, irisY - height * 0.48);
  context.closePath();
  context.fill();
  context.fillStyle = catchlight;
  context.beginPath();
  context.moveTo(irisX - width * 0.28, irisY - height * 0.4);
  context.bezierCurveTo(irisX - width * 0.12, irisY - height * 0.56, irisX + width * 0.04, irisY - height * 0.44, irisX + width * 0.01, irisY - height * 0.24);
  context.bezierCurveTo(irisX - width * 0.14, irisY - height * 0.15, irisX - width * 0.31, irisY - height * 0.23, irisX - width * 0.28, irisY - height * 0.4);
  context.closePath();
  context.fill();

  context.strokeStyle = lid;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(x - width, y + turn * height);
  context.bezierCurveTo(x - width * 0.42, y - height * 1.04, x + width * 0.4, y - height, x + width, y - turn * height * 0.4);
  context.stroke();
  context.strokeStyle = 'rgba(78, 55, 43, 0.46)';
  context.lineWidth = 0.85;
  context.beginPath();
  context.moveTo(x - width * 0.76, y + height * 0.45);
  context.bezierCurveTo(x - width * 0.25, y + height * 0.86, x + width * 0.35, y + height * 0.76, x + width * 0.78, y + height * 0.33);
  context.stroke();
}

function traceOrganicPatch(context, x, y, radiusX, radiusY, turn = 0) {
  context.beginPath();
  context.moveTo(x - radiusX * (1 + turn * 0.08), y + radiusY * turn * 0.18);
  context.bezierCurveTo(
    x - radiusX * (0.82 - turn * 0.08),
    y - radiusY * (0.78 + turn * 0.06),
    x - radiusX * (0.22 + turn * 0.08),
    y - radiusY * (1.06 - turn * 0.05),
    x + radiusX * (0.28 - turn * 0.05),
    y - radiusY * (0.91 + turn * 0.08),
  );
  context.bezierCurveTo(
    x + radiusX * (0.84 + turn * 0.04),
    y - radiusY * (0.7 - turn * 0.08),
    x + radiusX * (1.04 - turn * 0.05),
    y - radiusY * (0.14 + turn * 0.08),
    x + radiusX * (0.91 + turn * 0.06),
    y + radiusY * (0.36 - turn * 0.05),
  );
  context.bezierCurveTo(
    x + radiusX * (0.72 - turn * 0.05),
    y + radiusY * (0.94 + turn * 0.05),
    x + radiusX * (0.08 + turn * 0.06),
    y + radiusY * (1.04 - turn * 0.03),
    x - radiusX * (0.42 - turn * 0.05),
    y + radiusY * (0.87 + turn * 0.06),
  );
  context.bezierCurveTo(
    x - radiusX * (0.92 + turn * 0.04),
    y + radiusY * (0.66 - turn * 0.06),
    x - radiusX * (1.03 - turn * 0.04),
    y + radiusY * (0.18 + turn * 0.05),
    x - radiusX * (1 + turn * 0.08),
    y + radiusY * turn * 0.18,
  );
  context.closePath();
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
  context.bezierCurveTo(-side * radius * 0.28, -radius, side * radius * 0.38, -radius, side * radius * 0.7, -radius * 0.7);
  context.bezierCurveTo(side * radius * 1.02, -radius * 0.56, side * radius * 1.04, -radius * 0.28, side * radius * 0.77, -radius * 0.17);
  context.bezierCurveTo(side * radius * 1.14, -radius * 0.08, side * radius * 1.17, radius * 0.2, side * radius * 0.84, radius * 0.31);
  context.bezierCurveTo(side * radius * 1.11, radius * 0.46, side * radius, radius * 0.7, side * radius * 0.63, radius * 0.78);
  context.quadraticCurveTo(0, radius * 1.05, -side * radius * 0.72, radius * 0.52);
  context.quadraticCurveTo(-side * radius, 0, -side * radius * 0.7, -radius * 0.65);
  context.closePath();
  fillStroke(context, STORYBOOK_LINE_WEIGHT.contour);

  context.fillStyle = 'rgba(255, 218, 174, 0.3)';
  context.beginPath();
  context.moveTo(-side * radius * 0.18, -radius * 0.08);
  context.bezierCurveTo(side * radius * 0.2, -radius * 0.18, side * radius * 0.7, -radius * 0.08, side * radius * 0.82, radius * 0.17);
  context.bezierCurveTo(side * radius * 0.58, radius * 0.38, side * radius * 0.18, radius * 0.32, -side * radius * 0.18, -radius * 0.08);
  context.closePath();
  context.fill();
  context.strokeStyle = 'rgba(104,60,46,0.42)';
  context.lineWidth = 1.05;
  context.stroke();

  context.strokeStyle = 'rgba(255,231,168,0.4)';
  context.lineWidth = STORYBOOK_LINE_WEIGHT.feature;
  context.beginPath();
  context.moveTo(-radius * 0.62, -radius * 0.18);
  context.bezierCurveTo(
    -radius * 0.58,
    -radius * 0.58,
    -radius * 0.12,
    -radius * 0.78,
    radius * 0.28,
    -radius * 0.56,
  );
  context.stroke();
  context.strokeStyle = 'rgba(87,52,42,0.35)';
  context.lineWidth = STORYBOOK_LINE_WEIGHT.detail;
  context.beginPath();
  for (const fingerY of [-0.38, -0.04, 0.3]) {
    context.moveTo(side * radius * 0.55, radius * fingerY);
    context.bezierCurveTo(
      side * radius * 0.7,
      radius * (fingerY + 0.07),
      side * radius * 0.77,
      radius * (fingerY + 0.13),
      side * radius * 0.82,
      radius * (fingerY + 0.2),
    );
  }
  context.moveTo(-side * radius * 0.22, radius * 0.18);
  context.quadraticCurveTo(side * radius * 0.08, radius * 0.42, side * radius * 0.43, radius * 0.32);
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
    for (const [x, side] of eyes) {
      context.fillStyle = '#9f614f';
      context.beginPath();
      context.moveTo(x - 7, eyeY + side * 0.35);
      context.quadraticCurveTo(x, eyeY - 2.4, x + 7, eyeY - side * 0.25);
      context.quadraticCurveTo(x, eyeY + 3.2, x - 7, eyeY + side * 0.35);
      context.closePath();
      context.fill();
      context.strokeStyle = DEEP_OUTLINE;
      context.lineWidth = 1.8;
      context.stroke();
    }
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

      const irisX = x + gazeX * 0.7;
      const irisY = eyeY + gazeY * 0.55;
      context.fillStyle = '#654533';
      context.beginPath();
      context.moveTo(irisX, irisY - 3.8);
      context.bezierCurveTo(irisX + 3.2, irisY - 3.2, irisX + 3.6, irisY + 1.5, irisX + 0.5, irisY + 3.7);
      context.bezierCurveTo(irisX - 3.2, irisY + 3, irisX - 3.5, irisY - 1.8, irisX, irisY - 3.8);
      context.closePath();
      context.fill();
      context.fillStyle = '#231a18';
      context.beginPath();
      context.moveTo(irisX, irisY - 1.9);
      context.bezierCurveTo(irisX + 1.7, irisY - 1.5, irisX + 1.8, irisY + 1.2, irisX + 0.2, irisY + 1.9);
      context.bezierCurveTo(irisX - 1.7, irisY + 1.5, irisX - 1.8, irisY - 1.2, irisX, irisY - 1.9);
      context.closePath();
      context.fill();
      context.fillStyle = 'rgba(250, 236, 207, 0.88)';
      context.beginPath();
      context.moveTo(irisX - 1.4, irisY - 2.1);
      context.quadraticCurveTo(irisX - 0.3, irisY - 2.8, irisX + 0.4, irisY - 1.7);
      context.quadraticCurveTo(irisX - 0.7, irisY - 0.7, irisX - 1.4, irisY - 2.1);
      context.closePath();
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
  context.lineWidth = 3.8;
  context.beginPath();
  context.moveTo(-28, eyeY - 9);
  context.bezierCurveTo(-22, eyeY - 15, -14, eyeY - 14, -7, eyeY - 7);
  context.moveTo(7, eyeY - 7);
  context.bezierCurveTo(15, eyeY - 13, 22, eyeY - 14, 28, eyeY - 8);
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

function drawVioletWarmRim(context, motion, facingDirection, outfit, lightSide = 'left') {
  context.save();
  const screenLightDirection = lightSide === 'right' ? 1 : -1;
  if (screenLightDirection * facingDirection > 0) context.scale(-1, 1);
  context.strokeStyle = 'rgba(255, 224, 158, 0.44)';
  context.lineWidth = 1.45;
  context.save();
  if (outfit === 'casual') {
    context.translate(0, -101);
    context.scale(0.84, 0.84);
    context.translate(0, 101);
  }
  context.beginPath();
  context.moveTo(-42, -153);
  context.bezierCurveTo(-43, -174, -28, -191, -9, -195 - motion.hairLift * 0.2);
  context.bezierCurveTo(-4, -196, 1, -196, 6, -194);
  context.stroke();
  context.restore();

  context.beginPath();
  if (outfit === 'casual') {
    context.moveTo(-38, -94);
    context.bezierCurveTo(-45, -88, -47, -76, -41, -68);
    context.moveTo(-39, -66);
    context.bezierCurveTo(-39, -56, -37 - motion.robeSwing * 0.1, -47, -36 - motion.robeSwing * 0.25, -42);
    context.bezierCurveTo(-31, -39, -26, -42, -22, -47);
    context.moveTo(-22, -46);
    context.bezierCurveTo(-24, -27, -23, -3, -21, 17);
  } else {
    context.moveTo(-45, -91);
    context.bezierCurveTo(-52, -70, -55, -35, -59 - motion.robeSwing * 0.15, -3);
    context.bezierCurveTo(-49, 3, -39, 7, -29, 9);
  }
  context.stroke();

  context.strokeStyle = VIOLET_STYLE.hairRim;
  context.lineWidth = 0.8;
  context.save();
  if (outfit === 'casual') {
    context.translate(0, -101);
    context.scale(0.84, 0.84);
    context.translate(0, 101);
  }
  context.beginPath();
  context.moveTo(-37, -157);
  context.bezierCurveTo(-38, -176, -24, -190, -8, -192 - motion.hairLift * 0.12);
  context.stroke();
  context.restore();
  context.restore();
}

function drawWandmakerWarmRim(context) {
  context.strokeStyle = WANDMAKER_STYLE.rim;
  context.lineWidth = 1.75;
  context.beginPath();
  context.moveTo(-29, -151);
  context.bezierCurveTo(-34, -171, -23, -189, -8, -191);
  context.bezierCurveTo(-4, -193, -1, -191, 2, -188);
  context.moveTo(-27, -101);
  context.bezierCurveTo(-39, -91, -37, -71, -35, -59);
  context.bezierCurveTo(-39, -40, -43, -18, -44, 0);
  context.stroke();

  context.strokeStyle = 'rgba(255, 239, 198, 0.24)';
  context.lineWidth = 0.95;
  context.beginPath();
  context.moveTo(-25, -169);
  context.bezierCurveTo(-20, -183, -10, -190, -1, -187);
  context.moveTo(-31, -87);
  context.bezierCurveTo(-35, -66, -36, -36, -40, -8);
  context.stroke();
}

function drawTailorWarmRim(context, facingDirection) {
  context.save();
  if (facingDirection < 0) context.scale(-1, 1);
  context.strokeStyle = TAILOR_STYLE.rim;
  context.lineWidth = 1.65;
  context.beginPath();
  context.moveTo(-33, -151);
  context.bezierCurveTo(-36, -170, -23, -185, -7, -187);
  context.bezierCurveTo(-2, -190, 3, -189, 7, -187);
  context.moveTo(-34, -98);
  context.bezierCurveTo(-47, -88, -48, -71, -45, -59);
  context.bezierCurveTo(-51, -39, -58, -17, -61, -2);
  context.bezierCurveTo(-50, 3, -39, 7, -29, 9);
  context.stroke();

  context.strokeStyle = 'rgba(255, 238, 194, 0.24)';
  context.lineWidth = 0.85;
  context.beginPath();
  context.moveTo(-29, -169);
  context.bezierCurveTo(-22, -182, -9, -187, 2, -184);
  context.moveTo(-39, -88);
  context.bezierCurveTo(-45, -67, -48, -36, -55, -7);
  context.stroke();
  context.restore();
}

function drawKeeperWarmRim(context, facingDirection) {
  context.save();
  if (facingDirection < 0) context.scale(-1, 1);
  context.strokeStyle = KEEPER_STYLE.rim;
  context.lineWidth = 1.65;
  context.beginPath();
  context.moveTo(-34, -151);
  context.bezierCurveTo(-38, -170, -24, -185, -8, -187);
  context.bezierCurveTo(-3, -190, 2, -189, 7, -187);
  context.moveTo(-35, -98);
  context.bezierCurveTo(-48, -88, -49, -70, -46, -58);
  context.bezierCurveTo(-51, -38, -56, -17, -58, -2);
  context.bezierCurveTo(-48, 3, -38, 7, -28, 9);
  context.stroke();

  context.strokeStyle = 'rgba(255, 238, 192, 0.23)';
  context.lineWidth = 0.85;
  context.beginPath();
  context.moveTo(-30, -169);
  context.bezierCurveTo(-22, -182, -9, -187, 2, -184);
  context.moveTo(-40, -88);
  context.bezierCurveTo(-46, -67, -48, -36, -53, -7);
  context.stroke();
  context.restore();
}

function drawGuideWarmRim(context, facingDirection, lightSide = 'left') {
  context.save();
  const screenLightDirection = lightSide === 'right' ? 1 : -1;
  if (screenLightDirection * facingDirection > 0) context.scale(-1, 1);
  context.strokeStyle = HAGRID_STYLE.rim;
  context.lineWidth = 2.1;
  context.beginPath();
  context.moveTo(-58, -151);
  context.bezierCurveTo(-60, -179, -38, -201, -9, -203);
  context.bezierCurveTo(-2, -205, 4, -204, 9, -202);
  context.moveTo(-61, -112);
  context.bezierCurveTo(-73, -102, -75, -82, -70, -62);
  context.bezierCurveTo(-76, -38, -79, -16, -74, 1);
  context.stroke();

  context.strokeStyle = 'rgba(255, 229, 178, 0.22)';
  context.lineWidth = 1.05;
  context.beginPath();
  context.moveTo(-46, -174);
  context.bezierCurveTo(-39, -195, -20, -203, -3, -201);
  context.moveTo(-58, -94);
  context.bezierCurveTo(-65, -68, -68, -35, -69, -12);
  context.stroke();
  context.restore();
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
