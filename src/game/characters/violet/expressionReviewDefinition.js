function still(path) {
  return Object.freeze({ fps: 1, frames: Object.freeze([path]) });
}

export const VIOLET_EXPRESSION_REVIEW_VARIANT = 'approved-expression-alignment';

/**
 * Package-owned geometry for Violet's accepted expression sheet. The source
 * predates the general full-frame convention by one ground pixel, so its
 * review runtime keeps that authored alignment without changing Violet's
 * ordinary gameplay placement.
 */
export const violetExpressionReviewDefinition = Object.freeze({
  id: 'character.violet',
  basePath: 'assets/art/characters/violet',
  canvas: Object.freeze({
    width: 896,
    height: 1200,
    ground: Object.freeze({ x: 448, y: 1133 }),
  }),
  worldHeight: 1048,
  bounds: Object.freeze({
    world: Object.freeze({ x: 239, y: 85, width: 410, height: 1048 }),
    portrait: Object.freeze({ x: 285, y: 90, width: 326, height: 330 }),
    shadow: Object.freeze({ x: 299, y: 1114, width: 310, height: 28 }),
    headSafe: Object.freeze({ x: 350, y: 195, width: 195, height: 180 }),
  }),
  defaultAppearance: 'casual',
  appearances: Object.freeze({
    casual: Object.freeze({
      clips: Object.freeze({
        idle: still('casual/neutral.png'),
        neutral: still('casual/neutral.png'),
        blink: still('casual/blink.png'),
        'talk-a': still('casual/talk-a.png'),
        'talk-b': still('casual/talk-b.png'),
        wonder: still('casual/wonder.png'),
        proud: still('casual/proud.png'),
        curious: still('casual/curious.png'),
      }),
    }),
  }),
});
