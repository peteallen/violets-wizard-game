const PROP_LAYOUT = Object.freeze({
  'props/ch3/spellbook-parcel': Object.freeze({ width: 220, height: 190, offsetY: -12 }),
  'props/ch3/lantern': Object.freeze({ width: 118, height: 154, offsetY: -8 }),
  'props/ch3/feather': Object.freeze({ width: 184, height: 96, offsetY: -4 }),
  'props/ch3/wet-footprints': Object.freeze({ width: 220, height: 108, offsetY: 12 }),
  'props/ch3/ribbon-clue': Object.freeze({ width: 152, height: 92, offsetY: 14 }),
  'props/ch3/reflected-eyes': Object.freeze({ width: 96, height: 58, offsetY: -22 }),
  'props/ch3/torn-book': Object.freeze({ width: 164, height: 112, offsetY: 6 }),
  'props/ch3/toad-token': Object.freeze({ width: 108, height: 108, offsetY: 4 }),
});

export function drawChapterThreeTargetProps(context, request = {}) {
  const state = request.state;
  const imageFor = request.imageFor;
  if (!Array.isArray(state?.targets) || typeof imageFor !== 'function') return false;
  let drawn = false;
  context.save();
  context.translate(-(request.cameraX ?? state.cameraX ?? 0), 0);
  for (const target of state.targets) {
    const key = target?.presentation?.icon;
    const layout = PROP_LAYOUT[key];
    if (!layout) continue;
    const image = imageFor(key);
    if (!image?.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) continue;
    const center = hitAreaCenter(target.hitArea);
    context.drawImage(
      image,
      center.x - layout.width / 2,
      center.y - layout.height / 2 + layout.offsetY,
      layout.width,
      layout.height,
    );
    drawn = true;
  }
  context.restore();
  return drawn;
}

function hitAreaCenter(hitArea = {}) {
  if (hitArea.shape === 'rect') {
    return {
      x: (hitArea.x ?? 0) + (hitArea.width ?? 0) / 2,
      y: (hitArea.y ?? 0) + (hitArea.height ?? 0) / 2,
    };
  }
  return { x: hitArea.x ?? 0, y: hitArea.y ?? 0 };
}

export const CHAPTER_THREE_PROP_ASSET_KEYS = Object.freeze(Object.keys(PROP_LAYOUT));
