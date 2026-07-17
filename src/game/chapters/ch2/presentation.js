const WORLD_WIDTH = 1280;
const WORLD_HEIGHT = 720;
const TRAIN_WINDOW = Object.freeze({ left: 758, top: 126, right: 995, bottom: 397 });
const SORTING_CANDLES = Object.freeze([
  [172, 75, 0.2], [235, 105, 1.1], [326, 126, 2.3], [405, 92, 0.7],
  [512, 134, 1.7], [592, 88, 2.8], [705, 116, 0.4], [792, 76, 2],
  [876, 122, 1.3], [966, 88, 2.5], [1086, 128, 0.9], [1178, 72, 1.9],
]);

export const trainCompartmentOverlay = Object.freeze({
  id: 'ch2.presentation.trainCompartment',
  kind: 'room-variant-overlay',
  roomId: 'ch2.trainCompartment',
  variant: 'base',
  drawBackground: drawTrainCompartmentBackground,
  draw: drawTrainCompartmentMotion,
});

export const sortingGreatHallOverlay = Object.freeze({
  id: 'ch2.presentation.sortingGreatHall',
  kind: 'room-variant-overlay',
  roomId: 'ch2.greatHall',
  variant: 'base',
  draw: drawSortingCeremonyAtmosphere,
});

export const gryffindorGreatHallOverlay = Object.freeze({
  id: 'ch2.presentation.greatHallGryffindor',
  kind: 'room-variant-overlay',
  roomId: 'ch2.greatHall',
  variant: 'gryffindor',
  draw: drawGryffindorGreatHallBanners,
});

export const chapter2PresentationPackage = Object.freeze({
  chapterId: 'ch2',
  registrations: Object.freeze([]),
  roomMusic: Object.freeze({
    default: null,
    rooms: Object.freeze({
      'ch2.kingsCross': 'music/ch2/platform',
      'ch2.trainCompartment': 'music/ch2/platform',
      'ch2.lakeVista': 'music/ch2/lake-wonder',
      'ch2.greatHall': 'music/ch2/sorting',
      'ch2.gryffindorCommonRoom': 'music/ch2/common-room',
      'ch2.chapterCardRoom': 'music/ch2/common-room',
    }),
  }),
  roomVariantOverlays: Object.freeze([
    trainCompartmentOverlay,
    sortingGreatHallOverlay,
    gryffindorGreatHallOverlay,
  ]),
});

export default chapter2PresentationPackage;

export function trainCompartmentMotionState(time, { reducedMotion = false } = {}) {
  const safeTime = Math.max(0, Number.isFinite(time) ? time : 0);
  if (reducedMotion) {
    return Object.freeze({
      sceneryTravel: 0,
      carriageY: 0,
      carriageRoll: 0,
      lightSweep: 0.48,
      reducedMotion: true,
    });
  }
  return Object.freeze({
    sceneryTravel: (safeTime * 76) % 520,
    carriageY: Math.sin(safeTime * 1.7) * 1.8 + Math.sin(safeTime * 3.8) * 0.45,
    carriageRoll: Math.sin(safeTime * 1.25) * 0.0022,
    lightSweep: (safeTime / 6.4) % 1,
    reducedMotion: false,
  });
}

export function sortingCeremonyMotionState(
  time,
  { reducedMotion = false, speaking = false } = {},
) {
  const safeTime = Math.max(0, Number.isFinite(time) ? time : 0);
  if (reducedMotion) {
    return Object.freeze({
      hatPulse: 0,
      candleResponse: speaking ? 0.72 : 0.42,
      haloBreath: 0.5,
      reducedMotion: true,
    });
  }
  const speechWave = (Math.sin(safeTime * 5.4) + Math.sin(safeTime * 8.1 + 0.8) * 0.35 + 1.35) / 2.7;
  const quietWave = (Math.sin(safeTime * 1.45) + 1) / 2;
  return Object.freeze({
    hatPulse: speaking ? speechWave : quietWave * 0.16,
    candleResponse: speaking ? 0.52 + speechWave * 0.4 : 0.34 + quietWave * 0.12,
    haloBreath: speaking ? 0.48 + speechWave * 0.32 : 0.38 + quietWave * 0.12,
    reducedMotion: false,
  });
}

export function drawTrainCompartmentBackground(context, request, drawBackground) {
  const state = trainCompartmentMotionState(request.time, {
    reducedMotion: request.reducedMotion,
  });
  if (state.reducedMotion) {
    drawBackground();
    return;
  }
  context.save();
  context.translate(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
  context.translate(0, state.carriageY);
  context.rotate(state.carriageRoll);
  context.scale(1.006, 1.006);
  context.translate(-WORLD_WIDTH / 2, -WORLD_HEIGHT / 2);
  drawBackground();
  context.restore();
}

export function drawTrainCompartmentMotion(
  context,
  { cameraX = 0, time = 0, reducedMotion = false } = {},
) {
  const state = trainCompartmentMotionState(time, { reducedMotion });
  context.save();
  context.translate(-cameraX, state.carriageY * 0.35);
  drawPassingWindowScenery(context, state);
  drawTrainLightSweep(context, state);
  context.restore();
}

export function drawSortingCeremonyAtmosphere(
  context,
  { cameraX = 0, time = 0, reducedMotion = false, state: worldState } = {},
) {
  if (worldState?.sceneId !== 'ch2.scene.sorting') return;
  const speaking = worldState?.dialogue?.speaker === 'ch2.npc.sortingHat'
    && worldState.dialogue.type === 'line';
  const motion = sortingCeremonyMotionState(time, { reducedMotion, speaking });
  context.save();
  context.translate(-cameraX, 0);

  context.fillStyle = `rgba(241,187,77,${0.025 + motion.haloBreath * 0.035})`;
  context.beginPath();
  context.moveTo(510, 470);
  context.bezierCurveTo(500, 380, 548, 326, 640, 320);
  context.bezierCurveTo(732, 326, 780, 380, 770, 470);
  context.bezierCurveTo(730, 438, 690, 426, 640, 430);
  context.bezierCurveTo(590, 426, 550, 438, 510, 470);
  context.closePath();
  context.fill();

  for (const [x, y, phase] of SORTING_CANDLES) {
    drawResponsiveCandleLight(context, x, y, phase, time, motion);
  }

  if (speaking) {
    const pulse = motion.hatPulse;
    context.strokeStyle = `rgba(250,214,119,${0.08 + pulse * 0.13})`;
    context.lineWidth = 3;
    for (const direction of [-1, 1]) {
      context.beginPath();
      context.moveTo(640 + direction * 58, 386);
      context.bezierCurveTo(
        640 + direction * (78 + pulse * 9),
        374 - pulse * 5,
        640 + direction * (91 + pulse * 13),
        402,
        640 + direction * (112 + pulse * 16),
        388,
      );
      context.stroke();
    }
  }
  context.restore();
}

function drawPassingWindowScenery(context, state) {
  context.save();
  trainWindowPath(context);
  context.clip();

  context.strokeStyle = 'rgba(75,80,116,0.14)';
  context.lineWidth = 13;
  context.lineCap = 'round';
  const distantOffset = state.reducedMotion ? 0 : state.sceneryTravel * 0.16;
  for (let ridge = -1; ridge < 4; ridge += 1) {
    const x = TRAIN_WINDOW.left - 90 + ridge * 126 - (distantOffset % 126);
    context.beginPath();
    context.moveTo(x, 302);
    context.bezierCurveTo(x + 34, 256, x + 78, 276, x + 126, 238);
    context.stroke();
  }

  if (!state.reducedMotion) {
    const width = TRAIN_WINDOW.right - TRAIN_WINDOW.left;
    for (let tree = 0; tree < 6; tree += 1) {
      const x = TRAIN_WINDOW.left - 54
        + wrap(tree * 76 - state.sceneryTravel, width + 110);
      const height = 58 + (tree % 3) * 23;
      context.fillStyle = tree % 2
        ? 'rgba(45,64,57,0.2)'
        : 'rgba(67,70,68,0.16)';
      context.beginPath();
      context.moveTo(x - 20, TRAIN_WINDOW.bottom + 8);
      context.bezierCurveTo(x - 18, 348, x - 7, 333 - height, x, 318 - height);
      context.bezierCurveTo(x + 8, 333 - height, x + 20, 348, x + 22, TRAIN_WINDOW.bottom + 8);
      context.closePath();
      context.fill();
    }
    context.strokeStyle = 'rgba(250,230,178,0.16)';
    context.lineWidth = 3;
    for (let streak = 0; streak < 4; streak += 1) {
      const y = 214 + streak * 43;
      const start = TRAIN_WINDOW.left - 35
        + wrap(streak * 89 - state.sceneryTravel * 1.7, width + 140);
      context.beginPath();
      context.moveTo(start, y);
      context.bezierCurveTo(start + 34, y - 3, start + 64, y + 3, start + 104, y);
      context.stroke();
    }
  }
  context.restore();
}

function drawTrainLightSweep(context, state) {
  const sweepX = -360 + state.lightSweep * (WORLD_WIDTH + 720);
  context.save();
  context.globalCompositeOperation = 'screen';
  context.fillStyle = state.reducedMotion
    ? 'rgba(255,222,151,0.035)'
    : 'rgba(255,222,151,0.075)';
  context.beginPath();
  context.moveTo(sweepX - 150, 145);
  context.lineTo(sweepX + 55, 145);
  context.lineTo(sweepX + 390, WORLD_HEIGHT);
  context.lineTo(sweepX + 40, WORLD_HEIGHT);
  context.closePath();
  context.fill();
  context.restore();

  context.strokeStyle = `rgba(45,29,30,${state.reducedMotion ? 0.035 : 0.045})`;
  context.lineWidth = 11;
  context.beginPath();
  context.moveTo(-20, 651 + state.carriageY * 0.45);
  context.bezierCurveTo(330, 638, 930, 662, 1300, 646 - state.carriageY * 0.45);
  context.stroke();
}

function drawResponsiveCandleLight(context, x, y, phase, time, motion) {
  const flicker = motion.reducedMotion
    ? 0
    : Math.sin(Math.max(0, time) * 4.1 + phase) * 2.2;
  const alpha = 0.04 + motion.candleResponse * 0.07;
  context.fillStyle = `rgba(255,198,78,${alpha})`;
  context.beginPath();
  context.moveTo(x, y - 28 - flicker);
  context.bezierCurveTo(x + 18, y - 11, x + 17, y + 17, x, y + 27);
  context.bezierCurveTo(x - 17, y + 17, x - 18, y - 11, x, y - 28 - flicker);
  context.fill();

  context.fillStyle = `rgba(255,232,151,${0.12 + motion.candleResponse * 0.12})`;
  context.beginPath();
  context.moveTo(x, y - 12 - flicker);
  context.bezierCurveTo(x + 5, y - 3, x + 4, y + 7, x, y + 11);
  context.bezierCurveTo(x - 4, y + 7, x - 5, y - 3, x, y - 12 - flicker);
  context.fill();
}

function trainWindowPath(context) {
  context.beginPath();
  context.moveTo(TRAIN_WINDOW.left + 16, TRAIN_WINDOW.top);
  context.bezierCurveTo(
    TRAIN_WINDOW.left + 70,
    TRAIN_WINDOW.top - 4,
    TRAIN_WINDOW.right - 54,
    TRAIN_WINDOW.top - 2,
    TRAIN_WINDOW.right - 12,
    TRAIN_WINDOW.top + 13,
  );
  context.lineTo(TRAIN_WINDOW.right, TRAIN_WINDOW.bottom - 24);
  context.bezierCurveTo(
    TRAIN_WINDOW.right - 12,
    TRAIN_WINDOW.bottom - 3,
    TRAIN_WINDOW.left + 42,
    TRAIN_WINDOW.bottom + 2,
    TRAIN_WINDOW.left + 12,
    TRAIN_WINDOW.bottom - 18,
  );
  context.closePath();
}

function wrap(value, range) {
  return ((value % range) + range) % range;
}

export function drawGryffindorGreatHallBanners(context, { cameraX = 0 } = {}) {
  context.save();
  context.translate(-cameraX, 0);
  drawGryffindorGreatHallBanner(context, 92, -1);
  drawGryffindorGreatHallBanner(context, 1080, 1);
  context.restore();
}

function drawGryffindorGreatHallBanner(context, x, direction) {
  const width = 108;
  const top = 88;
  const bottom = 376;
  context.save();
  context.translate(x, 0);
  context.rotate(direction * 0.008);

  context.strokeStyle = 'rgba(52,31,34,0.38)';
  context.lineWidth = 11;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(-13, top - 11);
  context.lineTo(width + 13, top - 11);
  context.stroke();

  context.strokeStyle = '#d9ad43';
  context.lineWidth = 7;
  context.beginPath();
  context.moveTo(-14, top - 16);
  context.lineTo(width + 14, top - 16);
  context.stroke();

  context.fillStyle = 'rgba(49,24,31,0.24)';
  context.beginPath();
  context.moveTo(8, top + 8);
  context.lineTo(width + 10, top + 8);
  context.lineTo(width + 10, bottom - 4);
  context.lineTo(width / 2 + 10, bottom + 44);
  context.lineTo(8, bottom - 4);
  context.closePath();
  context.fill();

  context.fillStyle = '#8f2638';
  context.strokeStyle = '#d9ad43';
  context.lineWidth = 7;
  context.lineJoin = 'round';
  context.beginPath();
  context.moveTo(0, top);
  context.lineTo(width, top);
  context.lineTo(width, bottom - 12);
  context.lineTo(width / 2, bottom + 32);
  context.lineTo(0, bottom - 12);
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = '#d9ad43';
  context.fillRect(8, top + 10, width - 16, 15);
  context.fillRect(13, top + 41, 10, bottom - top - 85);
  context.fillRect(width - 23, top + 41, 10, bottom - top - 85);

  const shieldX = width / 2;
  const shieldY = top + 135;
  context.fillStyle = '#d9ad43';
  context.beginPath();
  context.moveTo(shieldX, shieldY - 38);
  context.lineTo(shieldX + 34, shieldY - 24);
  context.lineTo(shieldX + 27, shieldY + 20);
  context.quadraticCurveTo(shieldX, shieldY + 48, shieldX, shieldY + 48);
  context.quadraticCurveTo(shieldX, shieldY + 48, shieldX - 27, shieldY + 20);
  context.lineTo(shieldX - 34, shieldY - 24);
  context.closePath();
  context.fill();

  context.fillStyle = '#8f2638';
  context.beginPath();
  context.moveTo(shieldX, shieldY - 21);
  context.lineTo(shieldX + 11, shieldY + 3);
  context.lineTo(shieldX + 3, shieldY + 2);
  context.lineTo(shieldX + 15, shieldY + 28);
  context.lineTo(shieldX, shieldY + 15);
  context.lineTo(shieldX - 15, shieldY + 28);
  context.lineTo(shieldX - 3, shieldY + 2);
  context.lineTo(shieldX - 11, shieldY + 3);
  context.closePath();
  context.fill();

  context.fillStyle = 'rgba(255,239,174,0.28)';
  context.beginPath();
  context.moveTo(28, top + 34);
  context.lineTo(45, top + 34);
  context.lineTo(38, bottom - 36);
  context.lineTo(25, bottom - 54);
  context.closePath();
  context.fill();
  context.restore();
}
